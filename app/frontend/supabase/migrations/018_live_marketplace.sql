-- Canonical marketplace integration; no fixture data or parallel tables.
BEGIN;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS country text, ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS culture text;
ALTER TABLE public.vacancies ADD COLUMN IF NOT EXISTS seniority_level text;
ALTER TABLE public.seeker_job_actions ADD COLUMN IF NOT EXISTS company_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.seeker_job_actions ADD CONSTRAINT application_company_status_check CHECK(company_status IN ('pending','reviewed','interview','accepted','rejected','hired'));
CREATE OR REPLACE FUNCTION public.validate_vacancy_publication() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN RAISE EXCEPTION 'Vacancy ownership cannot change'; END IF;
 IF NEW.status IS NULL OR NEW.status NOT IN ('draft','open','closed','scheduled') THEN RAISE EXCEPTION 'Invalid publication status'; END IF;
 IF NEW.status='open' THEN
  IF NOT EXISTS(SELECT 1 FROM company_profiles c WHERE c.id=NEW.company_id AND nullif(trim(c.company_name),'') IS NOT NULL) THEN RAISE EXCEPTION 'Save your Company profile with a Company name before publishing';END IF;
  IF nullif(trim(NEW.job_title),'') IS NULL OR nullif(trim(NEW.job_description),'') IS NULL OR nullif(trim(NEW.employment_type),'') IS NULL OR nullif(trim(NEW.country),'') IS NULL OR nullif(trim(NEW.city),'') IS NULL OR nullif(trim(NEW.employment_style),'') IS NULL THEN RAISE EXCEPTION 'Publishing requires title, description, employment type/style, country and city'; END IF;
  IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date::date<current_date THEN RAISE EXCEPTION 'Expiration date must not be in the past'; END IF;
  IF NEW.show_salary AND (NEW.salary_currency IS NULL OR NEW.salary_period IS NULL OR (NEW.salary_min IS NULL AND NEW.salary_max IS NULL)) THEN RAISE EXCEPTION 'Declared compensation requires amount, currency and pay period';END IF;
  IF TG_OP='INSERT' THEN NEW.posting_date:=now(); ELSIF OLD.status IS DISTINCT FROM 'open' THEN NEW.posting_date:=now();END IF;
 END IF;
 IF NEW.salary_min<0 OR NEW.salary_max<0 OR NEW.salary_max<NEW.salary_min OR NEW.min_experience<0 OR NEW.max_experience<0 OR NEW.max_experience<NEW.min_experience THEN RAISE EXCEPTION 'Invalid compensation or experience range';END IF;
 NEW.updated_at:=now();RETURN NEW;
END $$;
CREATE TRIGGER vacancy_publication_guard BEFORE INSERT OR UPDATE ON public.vacancies FOR EACH ROW EXECUTE FUNCTION public.validate_vacancy_publication();
DROP POLICY IF EXISTS "Companies can view seeker profiles" ON public.job_seeker_profiles;
DROP POLICY IF EXISTS vacancy_read_open ON public.vacancies;
CREATE POLICY vacancy_read_open ON public.vacancies FOR SELECT TO authenticated USING(status='open' AND (expiration_date IS NULL OR expiration_date::date>=current_date));
CREATE OR REPLACE FUNCTION public.get_company_applicants() RETURNS TABLE(vacancy_id uuid,company_id uuid,seeker_user_id uuid,job_title text,application_status text,company_status text,applied_at timestamptz,full_name text,headline text,location text,skills text[],experience_years integer,education text,bio text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT v.id,v.company_id,a.user_id,v.job_title,a.application_status,a.company_status,a.updated_at,s.full_name,s.headline,s.location,s.skills,s.experience_years,s.education,s.bio
 FROM seeker_job_actions a JOIN vacancies v ON v.id=a.vacancy_id JOIN company_profiles c ON c.id=v.company_id LEFT JOIN job_seeker_profiles s ON s.user_id=a.user_id
 WHERE c.user_id=auth.uid() AND a.direction='right' ORDER BY a.updated_at DESC;
$$;
REVOKE ALL ON FUNCTION public.get_company_applicants() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_company_applicants() TO authenticated;
CREATE OR REPLACE FUNCTION public.review_company_application(job_id uuid,seeker_id uuid,review_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT company_owns_vacancy(job_id) THEN RAISE EXCEPTION 'Vacancy owner required'; END IF;
 IF review_status IS NULL OR review_status NOT IN ('pending','reviewed','interview','accepted','rejected','hired') THEN RAISE EXCEPTION 'Invalid review status'; END IF;
 UPDATE seeker_job_actions SET company_status=review_status WHERE vacancy_id=job_id AND user_id=seeker_id AND direction='right' AND application_status='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'Active application not found';END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_company_application(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_company_application(uuid,uuid,text) TO authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('logos','logos',true,2097152,ARRAY['image/png','image/jpeg','image/webp']) ON CONFLICT(id) DO NOTHING;
CREATE POLICY logo_public_read ON storage.objects FOR SELECT USING(bucket_id='logos');
CREATE POLICY logo_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='logos' AND (storage.foldername(name))[1]=auth.uid()::text AND EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id=auth.uid() AND role='company'));
CREATE POLICY logo_owner_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='logos' AND (storage.foldername(name))[1]=auth.uid()::text) WITH CHECK(bucket_id='logos' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY logo_owner_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='logos' AND (storage.foldername(name))[1]=auth.uid()::text);
COMMIT;
