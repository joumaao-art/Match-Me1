BEGIN;
-- RLS does not protect TRUNCATE or trigger-management privileges.
REVOKE TRUNCATE,REFERENCES,TRIGGER ON public.company_profiles,public.job_seeker_profiles,public.vacancies,public.seeker_job_actions FROM anon,authenticated;
-- Application decisions remain RPC-only, including Company review state.
REVOKE INSERT,UPDATE,DELETE ON public.seeker_job_actions FROM anon,authenticated;
-- Deleting an applied/saved vacancy would destroy history; archive it instead.
CREATE OR REPLACE FUNCTION public.guard_vacancy_deletion() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM seeker_job_actions WHERE vacancy_id=OLD.id) THEN RAISE EXCEPTION 'This vacancy has candidate history. Close it instead of deleting.';END IF;
 RETURN OLD;
END $$;
CREATE TRIGGER vacancy_history_guard BEFORE DELETE ON public.vacancies FOR EACH ROW EXECUTE FUNCTION public.guard_vacancy_deletion();
COMMIT;
