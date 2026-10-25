-- Shared onboarding: preserve canonical edits and reject stale cross-device writes.
BEGIN;
CREATE OR REPLACE FUNCTION public.seeker_onboarding_snapshot() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); p jsonb; e jsonb; x jsonb;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker authentication required'; END IF;
 SELECT to_jsonb(s) INTO p FROM job_seeker_profiles s WHERE user_id=uid;
 SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY id),'[]') INTO e FROM education h WHERE user_id=uid;
 SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY id),'[]') INTO x FROM experience h WHERE user_id=uid;
 RETURN jsonb_build_object(
 'PERSONAL_DETAILS',jsonb_build_object('first_name',p->'first_name','last_name',p->'last_name','full_name',p->'full_name','phone',p->'phone','nationalities',p->'nationalities'),
 'GENDER',p->'gender','BIRTHDAY',p->'date_of_birth',
 'CURRENT_LOCATION',jsonb_build_object('country',p->'country','city',p->'city'),
 'SKILLS',p->'skills','EDUCATION',e,
 'EXPERIENCE',jsonb_build_object('records',x,'noExperience',p->'job_preferences'->'noExperience'),
 'PREFERENCES',jsonb_build_object('expertise',p->'job_preferences'->'expertise','keywords',p->'job_preferences'->'keywords','targetCountries',p->'job_preferences'->'targetCountries','workingStyles',p->'job_preferences'->'workingStyles','employmentTypes',p->'job_preferences'->'employmentTypes'),
 'SENIORITY',p->'job_preferences'->'seniorityLevels');
END $$;
REVOKE ALL ON FUNCTION public.seeker_onboarding_snapshot() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.seeker_onboarding_snapshot() TO authenticated;
DO $$
DECLARE definition text; old_part text; new_part text;
BEGIN
 definition:=pg_get_functiondef('public.save_mobile_onboarding_internal(jsonb,text,boolean)'::regprocedure);
 old_part:='IF completed_step IS NOT NULL THEN IF completed_step=''PERSONAL_DETAILS'' THEN';
 new_part:=$part$IF completed_step IS NOT NULL THEN
 IF completed_step IN ('PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY') THEN
  PERFORM 1 FROM job_seeker_profiles WHERE user_id=uid FOR UPDATE;
  PERFORM 1 FROM education WHERE user_id=uid ORDER BY id FOR UPDATE;
  PERFORM 1 FROM experience WHERE user_id=uid ORDER BY id FOR UPDATE;
  IF NOT coalesce(payload->'canonicalBase','{}') ? completed_step OR (payload->'canonicalBase'->completed_step) IS DISTINCT FROM (seeker_onboarding_snapshot()->completed_step) THEN
   RAISE EXCEPTION 'Newer account changes exist. Reload saved progress before continuing';
  END IF;
 END IF;
 IF completed_step='PERSONAL_DETAILS' THEN$part$;
 IF position(old_part IN definition)=0 THEN RAISE EXCEPTION 'Unexpected onboarding internal contract'; END IF;
 definition:=replace(definition,old_part,new_part);
 definition:=replace(definition,'email=d->>''email'',nationalities=ARRAY(SELECT jsonb_array_elements_text(d->''nationalities'')),cv_url=nullif(d->>''cvUrl'','''')','email=coalesce((SELECT email FROM auth.users WHERE id=uid),email),nationalities=ARRAY(SELECT jsonb_array_elements_text(d->''nationalities''))');
 old_part:='UPDATE job_seeker_profiles SET job_preferences=coalesce(job_preferences,''{}'')||prefs,desired_roles=ARRAY(SELECT jsonb_array_elements_text(prefs->''expertise'')),work_styles=ARRAY(SELECT jsonb_array_elements_text(prefs->''workingStyles'')) WHERE user_id=uid;';
 new_part:=$part$IF completed_step='PREFERENCES' THEN
 IF jsonb_array_length(prefs->'expertise')+jsonb_array_length(prefs->'keywords')>10 THEN RAISE EXCEPTION 'Maximum 10 roles and keywords'; END IF;
 UPDATE job_seeker_profiles SET job_preferences=coalesce(job_preferences,'{}')||jsonb_build_object('expertise',prefs->'expertise','keywords',prefs->'keywords','targetCountries',coalesce(prefs->'targetCountries','[]'),'workingStyles',prefs->'workingStyles','employmentTypes',prefs->'employmentTypes'),desired_roles=ARRAY(SELECT jsonb_array_elements_text(prefs->'expertise')),work_styles=ARRAY(SELECT jsonb_array_elements_text(prefs->'workingStyles')),target_countries=ARRAY(SELECT jsonb_array_elements_text(coalesce(prefs->'targetCountries','[]'))) WHERE user_id=uid;
 ELSE UPDATE job_seeker_profiles SET job_preferences=coalesce(job_preferences,'{}')||jsonb_build_object('seniorityLevels',prefs->'seniorityLevels') WHERE user_id=uid;
 END IF;$part$;
 IF position(old_part IN definition)=0 THEN RAISE EXCEPTION 'Unexpected onboarding preference contract'; END IF;
 definition:=replace(definition,old_part,new_part);
 definition:=replace(definition,'UPDATE user_profiles SET mobile_onboarding_state=payload WHERE user_id=uid; RETURN payload;', $part$
 IF completed_step IN ('PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY') THEN
  payload:=jsonb_set(payload,'{canonicalBase}',coalesce(payload->'canonicalBase','{}')||jsonb_build_object(completed_step,seeker_onboarding_snapshot()->completed_step));
 END IF;
 payload:=jsonb_set(payload,'{serverRevision}',payload->'revision');
 UPDATE user_profiles SET mobile_onboarding_state=payload WHERE user_id=uid; RETURN payload;$part$);
 EXECUTE definition;
 definition:=pg_get_functiondef('public.save_mobile_onboarding(jsonb,text,boolean)'::regprocedure);
 definition:=replace(definition,'IF coalesce((prior->>''revision'')::bigint,0)>coalesce((payload->>''revision'')::bigint,0) THEN', 'IF coalesce((prior->>''revision'')::bigint,0)<>coalesce((payload->>''serverRevision'')::bigint,0) THEN');
 definition:=replace(definition,'PERFORM save_mobile_onboarding_internal(payload,candidate,false);','');
 -- Auth email is not editable through a profile/onboarding payload.
 definition:=replace(definition,'IF prior IS NULL THEN', $part$payload:=jsonb_set(payload,'{draft,email}',to_jsonb(coalesce((SELECT email FROM auth.users WHERE id=uid),payload->'draft'->>'email',''))); IF prior IS NULL THEN$part$);
 EXECUTE definition;
END $$;
REVOKE ALL ON FUNCTION public.save_mobile_onboarding_internal(jsonb,text,boolean) FROM PUBLIC,anon,authenticated;
COMMIT;
