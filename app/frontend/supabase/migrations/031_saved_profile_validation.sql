-- Validate changed JSON profile records; preserve unchanged historical entries.
BEGIN;
DO $$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.save_seeker_history(text,jsonb,jsonb,jsonb)'::regprocedure);
 IF position('Invalid saved JSON profile record' IN definition)>0 THEN RAISE EXCEPTION 'Validation already installed';END IF;
 definition:=replace(definition,'UPDATE job_seeker_profiles SET professional_details=', $part$IF p_section IN ('certificates','languages') THEN
   IF (SELECT count(DISTINCT item->>'id') FROM jsonb_array_elements(p_rows) item)<>jsonb_array_length(p_rows) THEN RAISE EXCEPTION 'Duplicate saved profile record';END IF;
   FOR entry IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    IF jsonb_typeof(entry) IS DISTINCT FROM 'object' OR jsonb_typeof(entry->'id') IS DISTINCT FROM 'string' OR trim(coalesce(entry->>'id',''))='' THEN RAISE EXCEPTION 'Invalid saved JSON profile record';END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_base) prior WHERE prior=entry) THEN CONTINUE;END IF;
    IF jsonb_typeof(entry->'name') IS DISTINCT FROM 'string' OR trim(coalesce(entry->>'name',''))='' OR length(entry->>'name')>500 THEN RAISE EXCEPTION 'Profile record name required';END IF;
    IF p_section='languages' THEN
     IF entry->>'level' IS NULL OR entry->>'level' NOT IN('beginner','intermediate','fluent','native') THEN RAISE EXCEPTION 'Invalid language proficiency';END IF;
    ELSE
     IF jsonb_typeof(entry->'issuer') IS DISTINCT FROM 'string' OR trim(coalesce(entry->>'issuer',''))='' OR length(entry->>'issuer')>500 OR coalesce(entry->>'date','') !~ '^[0-9]{4}(-(0[1-9]|1[0-2]))?$' OR (coalesce(entry->>'expiry','')<>'' AND (entry->>'expiry' !~ '^[0-9]{4}(-(0[1-9]|1[0-2]))?$' OR entry->>'expiry'<entry->>'date')) THEN RAISE EXCEPTION 'Invalid certificate details';END IF;
     IF coalesce((entry->>'verified')::boolean,false) AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_base) prior WHERE prior->>'id'=entry->>'id' AND prior->>'verified'='true') THEN RAISE EXCEPTION 'Certificate verification cannot be granted by the account';END IF;
    END IF;
   END LOOP;
   IF p_section='languages' AND (SELECT count(DISTINCT lower(trim(item->>'name'))) FROM jsonb_array_elements(p_rows) item)<>jsonb_array_length(p_rows) THEN RAISE EXCEPTION 'Duplicate language';END IF;
  END IF;
  UPDATE job_seeker_profiles SET professional_details=$part$);
 IF position('Invalid saved JSON profile record' IN definition)=0 THEN RAISE EXCEPTION 'Unexpected history function contract';END IF;
 EXECUTE definition;
END $$;
COMMIT;
