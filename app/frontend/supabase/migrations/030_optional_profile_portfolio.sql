-- Extend existing account contracts without new account tables or entitlements.
BEGIN;
DO $$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.save_seeker_history(text,jsonb,jsonb,jsonb)'::regprocedure);
 definition:=replace(definition,'''education'',''experience'',''certificates'',''languages''','''education'',''experience'',''certificates'',''languages'',''portfolio''');
 definition:=replace(definition,'p_section IN (''certificates'',''languages'')','p_section IN (''certificates'',''languages'',''portfolio'')');
 definition:=replace(definition,'coalesce(professional_details->p_section,''[]'')','coalesce(nullif(professional_details->p_section,''null''::jsonb),''[]'')');
 definition:=replace(definition,'UPDATE job_seeker_profiles SET professional_details=', $part$IF p_section='portfolio' THEN
   FOR entry IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    IF jsonb_typeof(entry) IS DISTINCT FROM 'object' OR trim(coalesce(entry->>'id',''))='' OR trim(coalesce(entry->>'title',''))='' OR trim(coalesce(entry->>'desc',''))='' OR length(entry->>'title')>200 OR length(entry->>'desc')>5000 OR length(entry->>'url')>2000 OR (coalesce(entry->>'url','')<>'' AND entry->>'url' !~ '^https?://[^[:space:]]+$') THEN RAISE EXCEPTION 'Invalid portfolio record';END IF;
   END LOOP;
   IF (SELECT count(DISTINCT item->>'id') FROM jsonb_array_elements(p_rows) item)<>jsonb_array_length(p_rows) THEN RAISE EXCEPTION 'Duplicate portfolio record';END IF;
  END IF;
  UPDATE job_seeker_profiles SET professional_details=$part$);
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION public.update_seeker_optional_profile(p_patch jsonb,p_base jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p job_seeker_profiles; k text;
BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR jsonb_typeof(p_base) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Authenticated profile required';END IF;
 IF NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=auth.uid() AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker account required';END IF;
 SELECT * INTO STRICT p FROM job_seeker_profiles WHERE user_id=auth.uid() FOR UPDATE;
 FOR k IN SELECT jsonb_object_keys(p_patch) LOOP
  IF k NOT IN('disability','acquisition_source','acquisition_other') OR jsonb_typeof(p_patch->k) NOT IN('string','null') THEN RAISE EXCEPTION 'Unsupported optional profile field';END IF;
  IF length(p_patch->>k)>1000 THEN RAISE EXCEPTION 'Optional profile value too long';END IF;
  IF to_jsonb(p)->k IS DISTINCT FROM p_base->k AND to_jsonb(p)->k IS DISTINCT FROM p_patch->k THEN RAISE EXCEPTION 'Profile changed elsewhere. Reload before saving';END IF;
 END LOOP;
 UPDATE job_seeker_profiles SET disability=CASE WHEN p_patch?'disability' THEN p_patch->>'disability' ELSE disability END,acquisition_source=CASE WHEN p_patch?'acquisition_source' THEN p_patch->>'acquisition_source' ELSE acquisition_source END,acquisition_other=CASE WHEN p_patch?'acquisition_other' THEN p_patch->>'acquisition_other' ELSE acquisition_other END,updated_at=clock_timestamp() WHERE user_id=auth.uid();
 RETURN (SELECT to_jsonb(s) FROM job_seeker_profiles s WHERE user_id=auth.uid());
END $$;
REVOKE ALL ON FUNCTION update_seeker_optional_profile(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION update_seeker_optional_profile(jsonb,jsonb) TO authenticated;
COMMIT;
