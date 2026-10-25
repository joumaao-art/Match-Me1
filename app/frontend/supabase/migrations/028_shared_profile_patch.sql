BEGIN;
CREATE OR REPLACE FUNCTION public.update_seeker_profile(p_patch jsonb,p_base jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p job_seeker_profiles;k text;personal jsonb:='{}';
BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR jsonb_typeof(p_base) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Authenticated profile required';END IF;
 SELECT * INTO STRICT p FROM job_seeker_profiles WHERE user_id=auth.uid() FOR UPDATE;
 FOR k IN SELECT jsonb_object_keys(p_patch) LOOP
  IF k IN('first_name','last_name','phone','country','city','date_of_birth','gender') THEN personal:=personal||jsonb_build_object(k,p_patch->k);
  ELSIF k NOT IN('nationalities','headline','bio','is_available') THEN RAISE EXCEPTION 'Unsupported profile field';END IF;
  IF to_jsonb(p)->k IS DISTINCT FROM p_base->k AND to_jsonb(p)->k IS DISTINCT FROM p_patch->k THEN RAISE EXCEPTION 'Profile changed elsewhere. Reload before saving';END IF;
 END LOOP;
 IF p_patch?'nationalities' AND (jsonb_typeof(p_patch->'nationalities') IS DISTINCT FROM 'array' OR jsonb_array_length(p_patch->'nationalities')>250) THEN RAISE EXCEPTION 'Invalid nationalities';END IF;
 IF p_patch?'is_available' AND jsonb_typeof(p_patch->'is_available') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid availability';END IF;
 PERFORM update_mobile_personal(personal,p_base);
 UPDATE job_seeker_profiles SET nationalities=CASE WHEN p_patch?'nationalities' THEN ARRAY(SELECT jsonb_array_elements_text(p_patch->'nationalities')) ELSE nationalities END,headline=CASE WHEN p_patch?'headline' THEN p_patch->>'headline' ELSE headline END,bio=CASE WHEN p_patch?'bio' THEN p_patch->>'bio' ELSE bio END,is_available=CASE WHEN p_patch?'is_available' THEN (p_patch->>'is_available')::boolean ELSE is_available END,updated_at=clock_timestamp() WHERE user_id=auth.uid();
 RETURN (SELECT to_jsonb(s) FROM job_seeker_profiles s WHERE user_id=auth.uid());
END $$;
REVOKE ALL ON FUNCTION update_seeker_profile(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION update_seeker_profile(jsonb,jsonb) TO authenticated;
COMMIT;
