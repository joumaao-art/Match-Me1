BEGIN;
ALTER TABLE public.seeker_job_actions ADD COLUMN IF NOT EXISTS applied_at timestamptz, ADD COLUMN IF NOT EXISTS saved_at timestamptz, ADD COLUMN IF NOT EXISTS passed_at timestamptz, ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.seeker_job_actions DROP CONSTRAINT application_company_status_check;
ALTER TABLE public.seeker_job_actions ADD CONSTRAINT application_company_status_check CHECK(company_status IN ('pending','reviewed','interview','accepted','rejected','hired','shortlisted','interview_scheduled','offer_received'));

CREATE OR REPLACE FUNCTION public.application_display_status(application_state text, company_state text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT CASE WHEN application_state='withdrawn' THEN 'withdrawn' WHEN application_state IS NULL THEN NULL ELSE CASE company_state WHEN 'reviewed' THEN 'under_review' WHEN 'accepted' THEN 'shortlisted' WHEN 'interview' THEN 'interview_scheduled' WHEN 'pending' THEN 'applied' ELSE company_state END END
$$;

CREATE OR REPLACE FUNCTION public.track_seeker_action_events() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE stamp timestamptz:=clock_timestamp(); before_status text; after_status text;
BEGIN
 IF TG_OP='UPDATE' THEN
  NEW.applied_at:=OLD.applied_at; NEW.saved_at:=OLD.saved_at; NEW.passed_at:=OLD.passed_at; NEW.status_history:=OLD.status_history;
  IF NEW.application_status='withdrawn' AND OLD.application_status IS DISTINCT FROM 'withdrawn' AND OLD.company_status IN ('rejected','hired') THEN RAISE EXCEPTION 'Completed applications cannot be withdrawn'; END IF;
  before_status:=application_display_status(OLD.application_status,OLD.company_status);
 END IF;
 IF NEW.direction='right' AND NEW.application_status='pending' AND (TG_OP='INSERT' OR OLD.application_status IS NULL) THEN NEW.applied_at:=stamp; END IF;
 IF NEW.saved AND (TG_OP='INSERT' OR NOT OLD.saved) THEN NEW.saved_at:=stamp; END IF;
 IF NEW.direction='left' AND (TG_OP='INSERT' OR OLD.direction IS DISTINCT FROM 'left') THEN NEW.passed_at:=stamp; END IF;
 after_status:=application_display_status(NEW.application_status,NEW.company_status);
 IF after_status IS NOT NULL AND after_status IS DISTINCT FROM before_status THEN
  NEW.status_history:=coalesce(NEW.status_history,'[]'::jsonb)||jsonb_build_array(jsonb_build_object('status',after_status,'at',stamp));
 END IF;
 IF TG_OP='INSERT' OR NEW.direction IS DISTINCT FROM OLD.direction OR NEW.application_status IS DISTINCT FROM OLD.application_status OR NEW.company_status IS DISTINCT FROM OLD.company_status THEN NEW.updated_at:=stamp; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER track_seeker_action_events BEFORE INSERT OR UPDATE ON public.seeker_job_actions FOR EACH ROW EXECUTE FUNCTION public.track_seeker_action_events();

CREATE OR REPLACE FUNCTION public.review_company_application(job_id uuid,seeker_id uuid,review_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT company_owns_vacancy(job_id) THEN RAISE EXCEPTION 'Vacancy owner required'; END IF;
 IF review_status IS NULL OR review_status NOT IN ('pending','reviewed','interview','accepted','shortlisted','interview_scheduled','offer_received','rejected','hired') THEN RAISE EXCEPTION 'Invalid review status'; END IF;
 UPDATE seeker_job_actions SET company_status=review_status WHERE vacancy_id=job_id AND user_id=seeker_id AND direction='right' AND application_status='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'Active application not found'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.get_company_applicants() RETURNS TABLE(vacancy_id uuid,company_id uuid,seeker_user_id uuid,job_title text,application_status text,company_status text,applied_at timestamptz,full_name text,headline text,location text,skills text[],experience_years integer,education text,bio text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT v.id,v.company_id,a.user_id,v.job_title,a.application_status,a.company_status,a.applied_at,s.full_name,s.headline,s.location,s.skills,s.experience_years,s.education,s.bio
 FROM seeker_job_actions a JOIN vacancies v ON v.id=a.vacancy_id JOIN company_profiles c ON c.id=v.company_id LEFT JOIN job_seeker_profiles s ON s.user_id=a.user_id
 WHERE c.user_id=auth.uid() AND a.direction='right' AND a.application_status IS NOT NULL ORDER BY a.applied_at DESC NULLS LAST,a.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_seeker_dashboard(p_category text DEFAULT 'all',p_query text DEFAULT '',p_status text DEFAULT '',p_oldest boolean DEFAULT false,p_offset integer DEFAULT 0,p_limit integer DEFAULT 25) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); result jsonb;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker authentication required'; END IF;
 IF p_category NOT IN ('all','submitted','skipped','saved','search') THEN RAISE EXCEPTION 'Invalid category'; END IF;
 WITH owned AS (
  SELECT a.*,application_display_status(a.application_status,a.company_status) AS display_status,v.job_title,c.company_name,v.country,v.city,
   (to_jsonb(v)||jsonb_build_object('company_name',c.company_name,'company_logo',c.logo_url,'industry',c.industry)) AS job,
   CASE WHEN p_category='saved' THEN a.saved_at WHEN p_category='skipped' THEN a.passed_at ELSE a.applied_at END AS event_at
  FROM seeker_job_actions a JOIN vacancies v ON v.id=a.vacancy_id LEFT JOIN company_profiles c ON c.id=v.company_id WHERE a.user_id=uid
 ), filtered AS (
  SELECT * FROM owned WHERE
   (CASE p_category WHEN 'all' THEN application_status IS NOT NULL WHEN 'submitted' THEN application_status='pending' WHEN 'skipped' THEN direction='left' WHEN 'saved' THEN saved ELSE application_status IS NOT NULL OR saved OR direction='left' END)
   AND (coalesce(p_status,'')='' OR display_status=p_status)
   AND (coalesce(p_query,'')='' OR position(lower(left(p_query,200)) IN lower(concat_ws(' ',job_title,company_name,country,city,display_status,replace(display_status,'_',' '),CASE display_status WHEN 'applied' THEN 'تم التقديم' WHEN 'under_review' THEN 'قيد المراجعة' WHEN 'shortlisted' THEN 'القائمة المختصرة' WHEN 'interview_scheduled' THEN 'تم تحديد المقابلة' WHEN 'offer_received' THEN 'تم استلام عرض' WHEN 'hired' THEN 'تم التوظيف' WHEN 'rejected' THEN 'مرفوض' WHEN 'withdrawn' THEN 'منسحب' END)))>0)
 ), paged AS (
  SELECT * FROM filtered ORDER BY CASE WHEN p_oldest THEN event_at END ASC NULLS LAST,CASE WHEN NOT p_oldest THEN event_at END DESC NULLS LAST,updated_at DESC,vacancy_id LIMIT greatest(1,least(coalesce(p_limit,25),50)) OFFSET greatest(coalesce(p_offset,0),0)
 )
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(jsonb_build_object('action',to_jsonb(p)-'job'-'job_title'-'company_name'-'country'-'city'-'display_status'-'event_at','job',p.job)) FROM paged p),'[]'::jsonb),'total',(SELECT count(*) FROM filtered),'counts',jsonb_build_object('all',(SELECT count(*) FROM owned WHERE application_status IS NOT NULL),'submitted',(SELECT count(*) FROM owned WHERE application_status='pending'),'skipped',(SELECT count(*) FROM owned WHERE direction='left'),'saved',(SELECT count(*) FROM owned WHERE saved)),
 'latestPass',(SELECT a.vacancy_id FROM seeker_job_actions a JOIN vacancies v ON v.id=a.vacancy_id WHERE a.user_id=uid AND a.direction='left' AND v.status='open' AND (v.expiration_date IS NULL OR v.expiration_date::date>=current_date) ORDER BY a.updated_at DESC,a.vacancy_id LIMIT 1)) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_seeker_dashboard(text,text,text,boolean,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_seeker_dashboard(text,text,text,boolean,integer,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.review_company_application(uuid,uuid,text),public.get_company_applicants() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_company_application(uuid,uuid,text),public.get_company_applicants() TO authenticated;
COMMIT;
