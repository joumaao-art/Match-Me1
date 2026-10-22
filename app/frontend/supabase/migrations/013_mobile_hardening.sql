-- Additive mobile hardening and real account-owned job actions.
BEGIN;
CREATE TABLE IF NOT EXISTS public.vacancies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.company_profiles(id),
 job_title text NOT NULL, employment_type text DEFAULT 'full-time', job_description text,
 country text, city text, required_skills text[] DEFAULT '{}', min_experience integer DEFAULT 0,
 max_experience integer DEFAULT 0, education_level text, salary_min integer, salary_max integer,
 benefits text[] DEFAULT '{}', status text DEFAULT 'draft', posting_date timestamptz,
 expiration_date timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vacancy_read_open ON public.vacancies;
CREATE POLICY vacancy_read_open ON public.vacancies FOR SELECT TO authenticated USING(status='open' OR company_id IN(SELECT id FROM company_profiles WHERE user_id=auth.uid()));
DROP POLICY IF EXISTS vacancy_company_owner ON public.vacancies;
CREATE POLICY vacancy_company_owner ON public.vacancies FOR ALL TO authenticated USING(company_id IN(SELECT id FROM company_profiles WHERE user_id=auth.uid())) WITH CHECK(company_id IN(SELECT id FROM company_profiles WHERE user_id=auth.uid()));
CREATE TABLE public.seeker_job_actions (
 user_id uuid NOT NULL REFERENCES auth.users(id), vacancy_id uuid NOT NULL REFERENCES public.vacancies(id),
 direction text CHECK(direction IN('left','right')), saved boolean NOT NULL DEFAULT false,
 application_status text CHECK(application_status IN('pending','withdrawn')), updated_at timestamptz DEFAULT now(),
 PRIMARY KEY(user_id,vacancy_id)
);
ALTER TABLE public.seeker_job_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_action_owner_read ON public.seeker_job_actions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.company_owns_vacancy(job_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM vacancies v JOIN company_profiles c ON c.id=v.company_id WHERE v.id=job_id AND c.user_id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.company_owns_vacancy(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.company_owns_vacancy(uuid) TO authenticated;
CREATE POLICY job_application_company_read ON public.seeker_job_actions FOR SELECT TO authenticated USING(direction='right' AND public.company_owns_vacancy(vacancy_id));
CREATE POLICY vacancy_action_history_read ON public.vacancies FOR SELECT TO authenticated USING(id IN(SELECT vacancy_id FROM seeker_job_actions WHERE user_id=auth.uid()));
CREATE OR REPLACE FUNCTION public.record_seeker_job_action(job_id uuid, action text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); available integer;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker authentication required'; END IF;
 IF action NOT IN('left','right','save','unsave','undo','withdraw') THEN RAISE EXCEPTION 'Invalid action'; END IF;
 PERFORM 1 FROM vacancies WHERE id=job_id AND status='open' FOR SHARE;
 IF NOT FOUND AND action IN('left','right','save') THEN RAISE EXCEPTION 'Job is no longer available'; END IF;
 SELECT balance INTO available FROM seeker_credit_accounts WHERE user_id=uid FOR UPDATE;
 IF action IN('left','right') THEN
  IF available IS NULL THEN RAISE EXCEPTION 'Credit account unavailable'; END IF;
  IF NOT EXISTS(SELECT 1 FROM seeker_credit_transactions WHERE user_id=uid AND operation_key='job:'||job_id) THEN
   IF available<1 THEN RAISE EXCEPTION 'No swiping credits remaining'; END IF;
   INSERT INTO seeker_credit_transactions(user_id,operation_key,amount,kind) VALUES(uid,'job:'||job_id,-1,'swipe');
   UPDATE seeker_credit_accounts SET balance=balance-1,updated_at=now() WHERE user_id=uid;
   available:=available-1;
  END IF;
  INSERT INTO seeker_job_actions(user_id,vacancy_id,direction,application_status) VALUES(uid,job_id,action,CASE WHEN action='right' THEN 'pending' END)
  ON CONFLICT(user_id,vacancy_id) DO UPDATE SET direction=EXCLUDED.direction,application_status=EXCLUDED.application_status,updated_at=now();
 ELSIF action IN('save','unsave') THEN
  INSERT INTO seeker_job_actions(user_id,vacancy_id,saved) VALUES(uid,job_id,action='save') ON CONFLICT(user_id,vacancy_id) DO UPDATE SET saved=EXCLUDED.saved,updated_at=now();
 ELSIF action='undo' THEN
  UPDATE seeker_job_actions SET direction=NULL,updated_at=now() WHERE user_id=uid AND vacancy_id=job_id AND direction='left';
 ELSIF action='withdraw' THEN
  UPDATE seeker_job_actions SET application_status='withdrawn',updated_at=now() WHERE user_id=uid AND vacancy_id=job_id AND application_status='pending';
 END IF;
 RETURN coalesce(available,0);
END $$;
REVOKE ALL ON FUNCTION public.record_seeker_job_action(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_seeker_job_action(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_mobile_step(step text, d jsonb) RETURNS void
LANGUAGE plpgsql SET search_path=public AS $$
DECLARE entry jsonb; f text; start_value date; end_value date; current_value boolean;
BEGIN
 IF d IS NULL OR jsonb_typeof(d)<>'object' THEN RAISE EXCEPTION 'Draft required'; END IF;
 IF step='PERSONAL_DETAILS' THEN
  FOREACH f IN ARRAY ARRAY['firstName','lastName','email','mobile','headline','summary'] LOOP
   IF trim(coalesce(d->>f,''))='' THEN RAISE EXCEPTION 'Personal details required'; END IF;
  END LOOP;
  IF d->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR d->>'mobile' !~ '^\+[0-9]{7,15}$' OR coalesce(jsonb_array_length(d->'nationalities'),0)<1 THEN RAISE EXCEPTION 'Invalid contact details'; END IF;
 ELSIF step='GENDER' THEN
  IF coalesce(d->>'gender','') NOT IN('male','female','prefer_not_to_say') THEN RAISE EXCEPTION 'Gender required'; END IF;
 ELSIF step='BIRTHDAY' THEN
  IF coalesce(d->>'birthday','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RAISE EXCEPTION 'Birthday required'; END IF;
  IF (d->>'birthday')::date>current_date OR (d->>'birthday')::date<current_date-interval '100 years' THEN RAISE EXCEPTION 'Invalid birthday'; END IF;
 ELSIF step='CURRENT_LOCATION' THEN
  IF coalesce(d->>'country','') !~ '^[A-Z]{2}$' OR trim(coalesce(d->>'city',''))='' THEN RAISE EXCEPTION 'Location required'; END IF;
 ELSIF step='SKILLS' THEN
  IF coalesce(jsonb_array_length(d->'skills'),0)<1 THEN RAISE EXCEPTION 'Skills required'; END IF;
 ELSIF step IN('EDUCATION','EXPERIENCE') AND NOT(step='EXPERIENCE' AND coalesce((d->>'noExperience')::boolean,false)) THEN
  f:=CASE WHEN step='EDUCATION' THEN 'educations' ELSE 'experiences' END;
  IF coalesce(jsonb_array_length(d->f),0)<1 THEN RAISE EXCEPTION 'History required'; END IF;
  FOR entry IN SELECT * FROM jsonb_array_elements(d->f) LOOP
   IF coalesce(entry->>'from','') !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN RAISE EXCEPTION 'Start date required'; END IF;
   start_value:=(entry->>'from'||'-01')::date;
   IF start_value>current_date THEN RAISE EXCEPTION 'Future start date'; END IF;
   current_value:=coalesce((entry->>'current')::boolean,false);
   IF NOT current_value OR step='EDUCATION' AND coalesce(entry->>'to','')<>'' THEN
    IF coalesce(entry->>'to','') !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN RAISE EXCEPTION 'End date required'; END IF;
    end_value:=(entry->>'to'||'-01')::date;
    IF end_value<start_value OR step='EXPERIENCE' AND end_value>current_date THEN RAISE EXCEPTION 'Invalid date range'; END IF;
   END IF;
   IF step='EDUCATION' THEN
    IF trim(coalesce(entry->>'institution',''))='' OR coalesce(entry->>'degree','') NOT IN('HIGH_SCHOOL','DIPLOMA','BACHELOR','MASTER','DOCTORATE','NOT_APPLICABLE') OR coalesce(entry->>'country','') !~ '^[A-Z]{2}$' OR trim(coalesce(entry->>'city',''))='' OR entry->>'degree'<>'NOT_APPLICABLE' AND trim(coalesce(entry->>'field',''))='' THEN RAISE EXCEPTION 'Invalid education'; END IF;
   ELSE
    IF trim(coalesce(entry->>'company',''))='' OR trim(coalesce(entry->>'title',''))='' OR trim(coalesce(entry->>'industry',''))='' OR coalesce(entry->>'type','') NOT IN('FULL_TIME','PART_TIME','INTERN','CONTRACT') THEN RAISE EXCEPTION 'Invalid experience'; END IF;
   END IF;
  END LOOP;
 ELSIF step='PREFERENCES' THEN
  FOREACH f IN ARRAY ARRAY['expertise','keywords','workingStyles','employmentTypes'] LOOP
   IF coalesce(jsonb_array_length(d->'preferences'->f),0)<1 THEN RAISE EXCEPTION 'Preferences required'; END IF;
  END LOOP;
 ELSIF step='SENIORITY' THEN
  IF coalesce(jsonb_array_length(d->'preferences'->'seniorityLevels'),0)<1 THEN RAISE EXCEPTION 'Seniority required'; END IF;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.validate_mobile_step(text,jsonb) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.save_mobile_onboarding(payload jsonb, completed_step text DEFAULT NULL, finish boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); prior jsonb; legacy jsonb; progress jsonb:='[]'; candidate text; source text;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT mobile_onboarding_state,onboarding_state INTO prior,legacy FROM user_profiles WHERE user_id=uid AND role='job_seeker' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Job Seeker account unavailable'; END IF;
 IF coalesce((prior->>'revision')::bigint,0)>coalesce((payload->>'revision')::bigint,0) THEN RAISE EXCEPTION 'Newer changes exist. Reload to recover'; END IF;
 IF prior IS NULL THEN
  FOR candidate,source IN SELECT * FROM (VALUES('PERSONAL_DETAILS','profile_setup'),('GENDER','gender'),('BIRTHDAY','birthday'),('CURRENT_LOCATION','current_location'),('SKILLS','profile_setup'),('PREFERENCES','job_preferences'),('HOW_IT_WORKS','discover_tutorial')) AS mapping(step,old_step) LOOP
   IF legacy->'steps'->source->>'status'='done' AND payload->'done' @> jsonb_build_array(candidate) THEN
    BEGIN
     PERFORM validate_mobile_step(candidate,payload->'draft');
     PERFORM save_mobile_onboarding_internal(payload,candidate,false);
     progress:=progress||jsonb_build_array(candidate);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
   END IF;
  END LOOP;
 ELSE
  FOR candidate IN SELECT jsonb_array_elements_text(coalesce(prior->'done','[]')) LOOP
   IF payload->'done' @> jsonb_build_array(candidate) THEN
    BEGIN PERFORM validate_mobile_step(candidate,payload->'draft');progress:=progress||jsonb_build_array(candidate);EXCEPTION WHEN OTHERS THEN NULL;END;
   END IF;
  END LOOP;
 END IF;
 IF completed_step IS NOT NULL THEN
  PERFORM validate_mobile_step(completed_step,payload->'draft');
  IF NOT progress @> jsonb_build_array(completed_step) THEN progress:=progress||jsonb_build_array(completed_step); END IF;
 END IF;
 payload:=jsonb_set(payload,'{done}',progress);
 IF payload->>'screen'='COMPLETE' AND jsonb_array_length(progress)<11 THEN
  SELECT step INTO candidate FROM unnest(ARRAY['PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY','FREE_CREDITS','HOW_IT_WORKS']) step WHERE NOT progress @> jsonb_build_array(step) LIMIT 1;
  payload:=jsonb_set(payload,'{screen}',to_jsonb(candidate));
 END IF;
 RETURN save_mobile_onboarding_internal(payload,completed_step,finish);
END $$;
REVOKE ALL ON FUNCTION public.save_mobile_onboarding_internal(jsonb,text,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_mobile_onboarding(jsonb,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_mobile_onboarding(jsonb,text,boolean) TO authenticated;
COMMIT;
