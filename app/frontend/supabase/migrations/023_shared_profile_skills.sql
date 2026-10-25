BEGIN;
CREATE OR REPLACE FUNCTION public.update_profile_skills(p_base text[],p_skills text[]) RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_skills text[]; uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT coalesce(skills,'{}') INTO STRICT current_skills FROM job_seeker_profiles WHERE user_id=uid FOR UPDATE;
 IF current_skills IS DISTINCT FROM coalesce(p_base,'{}') AND current_skills IS DISTINCT FROM p_skills THEN RAISE EXCEPTION 'Skills changed elsewhere. Reload before saving.'; END IF;
 IF p_skills IS NULL OR cardinality(p_skills)>200 OR EXISTS(SELECT 1 FROM unnest(p_skills) s WHERE length(trim(s))=0 OR length(s)>150) THEN RAISE EXCEPTION 'Invalid skills'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(p_skills) s GROUP BY lower(trim(s)) HAVING count(*)>1) THEN RAISE EXCEPTION 'Duplicate skills'; END IF;
 UPDATE job_seeker_profiles SET skills=p_skills,updated_at=clock_timestamp() WHERE user_id=uid;
 RETURN p_skills;
END $$;
REVOKE ALL ON FUNCTION public.update_profile_skills(text[],text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.update_profile_skills(text[],text[]) TO authenticated;
COMMIT;
