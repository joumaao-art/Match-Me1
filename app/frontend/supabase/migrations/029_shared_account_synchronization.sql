-- Shared account synchronization; no table resets or entitlement changes.
BEGIN;
CREATE OR REPLACE FUNCTION public.load_seeker_onboarding() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); account jsonb; profile jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT to_jsonb(u) INTO account FROM user_profiles u WHERE user_id=uid AND role='job_seeker' FOR UPDATE;
 IF account IS NULL THEN RAISE EXCEPTION 'Job Seeker account unavailable'; END IF;
 SELECT to_jsonb(p) INTO profile FROM job_seeker_profiles p WHERE user_id=uid FOR UPDATE;
 IF profile IS NULL THEN RAISE EXCEPTION 'Profile unavailable'; END IF;
 RETURN jsonb_build_object('account',account,'profile',profile,'snapshot',seeker_onboarding_snapshot());
END $$;
REVOKE ALL ON FUNCTION load_seeker_onboarding() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION load_seeker_onboarding() TO authenticated;
DO $$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.save_mobile_onboarding(jsonb,text,boolean)'::regprocedure);
 definition:=replace(definition,'IF uid IS NULL THEN RAISE EXCEPTION ''Authentication required'';END IF;', $part$IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required';END IF;
 IF jsonb_typeof(payload) IS DISTINCT FROM 'object' OR payload->>'version' IS DISTINCT FROM '3' OR jsonb_typeof(payload->'revision') IS DISTINCT FROM 'number' OR coalesce(payload->>'revision','') !~ '^[0-9]{1,16}$' OR jsonb_typeof(payload->'serverRevision') IS DISTINCT FROM 'number' OR coalesce(payload->>'serverRevision','') !~ '^[0-9]{1,16}$' OR (payload->>'revision')::bigint <= (payload->>'serverRevision')::bigint THEN RAISE EXCEPTION 'Invalid onboarding revision';END IF;
 IF payload->>'screen' IS NULL OR payload->>'screen' NOT IN ('INTRO','COMPLETE','PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY','FREE_CREDITS','HOW_IT_WORKS') THEN RAISE EXCEPTION 'Invalid onboarding screen';END IF;$part$);
 EXECUTE definition;
 definition:=pg_get_functiondef('public.save_mobile_onboarding_internal(jsonb,text,boolean)'::regprocedure);
 definition:=replace(definition,'UPDATE job_seeker_profiles SET first_name=d->>''firstName''', $part$IF EXISTS(SELECT 1 FROM auth.users a JOIN job_seeker_profiles p ON p.user_id=a.id WHERE a.id=uid AND coalesce(a.phone,'')<>'' AND p.phone IS DISTINCT FROM d->>'mobile') THEN RAISE EXCEPTION 'Login phone requires verified identity change';END IF;
 UPDATE job_seeker_profiles SET first_name=d->>'firstName'$part$);
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION public.save_seeker_history(p_section text,p_rows jsonb,p_base jsonb,p_removed jsonb DEFAULT '[]') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); current_items jsonb; entry jsonb; old_row jsonb; merged jsonb; record_id uuid; e education; x experience; k text;
BEGIN
 IF uid IS NULL OR p_section NOT IN ('education','experience','certificates','languages') OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_typeof(p_base) IS DISTINCT FROM 'array' OR jsonb_typeof(p_removed) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid profile history';END IF;
 PERFORM 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Job Seeker account required';END IF;
 PERFORM 1 FROM job_seeker_profiles WHERE user_id=uid FOR UPDATE;
 IF p_section IN ('certificates','languages') THEN
  SELECT coalesce(professional_details->p_section,'[]') INTO current_items FROM job_seeker_profiles WHERE user_id=uid;
  IF current_items IS DISTINCT FROM p_base THEN RAISE EXCEPTION 'History changed elsewhere. Reload before saving';END IF;
  IF jsonb_array_length(p_rows)>1000 THEN RAISE EXCEPTION 'Too many profile records';END IF;
  UPDATE job_seeker_profiles SET professional_details=jsonb_set(coalesce(professional_details,'{}'),ARRAY[p_section],p_rows),updated_at=clock_timestamp() WHERE user_id=uid;
  RETURN p_rows;
 END IF;
 IF p_section='education' THEN SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY id),'[]') INTO current_items FROM education h WHERE user_id=uid;
 ELSE SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY id),'[]') INTO current_items FROM experience h WHERE user_id=uid;END IF;
 IF current_items IS DISTINCT FROM p_base THEN RAISE EXCEPTION 'History changed elsewhere. Reload before saving';END IF;
 IF jsonb_array_length(p_rows)>1000 THEN RAISE EXCEPTION 'Too many profile records';END IF;
 FOR entry IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
  IF jsonb_typeof(entry) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid record';END IF;
  record_id:=(entry->>'id')::uuid;
  IF record_id IS NULL THEN RAISE EXCEPTION 'Record ID required';END IF;
  FOR k IN SELECT jsonb_object_keys(entry) LOOP
   IF p_section='education' AND k NOT IN ('id','institution','degree','degree_code','field_of_study','start_date','end_date','is_current','country','city','grade') OR p_section='experience' AND k NOT IN ('id','job_title','company_name','employment_type','start_date','end_date','is_current','country','city','description','industry') THEN RAISE EXCEPTION 'Unsupported history field';END IF;
  END LOOP;
  old_row:=NULL;
  IF p_section='education' THEN SELECT to_jsonb(h) INTO old_row FROM education h WHERE id=record_id FOR UPDATE;
  ELSE SELECT to_jsonb(h) INTO old_row FROM experience h WHERE id=record_id FOR UPDATE;END IF;
  IF old_row IS NOT NULL AND old_row->>'user_id' IS DISTINCT FROM uid::text THEN RAISE EXCEPTION 'History ownership mismatch';END IF;
  merged:=coalesce(old_row,'{}')||entry||jsonb_build_object('user_id',uid);
  IF p_section='education' THEN
   e:=jsonb_populate_record(NULL::education,merged);
   IF trim(coalesce(e.institution,''))='' OR coalesce(e.degree_code,e.degree,'')='' OR e.start_date IS NULL OR e.start_date>current_date OR (NOT coalesce(e.is_current,false) AND (e.end_date IS NULL OR e.end_date<e.start_date)) OR e.end_date<e.start_date THEN RAISE EXCEPTION 'Invalid education';END IF;
   INSERT INTO education(id,user_id,institution,degree,degree_code,field_of_study,start_date,end_date,is_current,country,city,grade) VALUES(e.id,uid,e.institution,e.degree,e.degree_code,e.field_of_study,e.start_date,e.end_date,coalesce(e.is_current,false),e.country,e.city,e.grade) ON CONFLICT(id) DO UPDATE SET institution=EXCLUDED.institution,degree=EXCLUDED.degree,degree_code=EXCLUDED.degree_code,field_of_study=EXCLUDED.field_of_study,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,is_current=EXCLUDED.is_current,country=EXCLUDED.country,city=EXCLUDED.city,grade=EXCLUDED.grade WHERE education.user_id=uid;
  ELSE
   x:=jsonb_populate_record(NULL::experience,merged);
   IF trim(coalesce(x.job_title,''))='' OR trim(coalesce(x.company_name,''))='' OR coalesce(x.employment_type,'')='' OR x.start_date IS NULL OR x.start_date>current_date OR (NOT coalesce(x.is_current,false) AND (x.end_date IS NULL OR x.end_date<x.start_date OR x.end_date>current_date)) THEN RAISE EXCEPTION 'Invalid experience';END IF;
   INSERT INTO experience(id,user_id,job_title,company_name,employment_type,start_date,end_date,is_current,country,city,description,industry) VALUES(x.id,uid,x.job_title,x.company_name,x.employment_type,x.start_date,x.end_date,coalesce(x.is_current,false),x.country,x.city,x.description,x.industry) ON CONFLICT(id) DO UPDATE SET job_title=EXCLUDED.job_title,company_name=EXCLUDED.company_name,employment_type=EXCLUDED.employment_type,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,is_current=EXCLUDED.is_current,country=EXCLUDED.country,city=EXCLUDED.city,description=EXCLUDED.description,industry=EXCLUDED.industry WHERE experience.user_id=uid;
  END IF;
 END LOOP;
 FOR entry IN SELECT * FROM jsonb_array_elements(p_removed) LOOP
  record_id:=(entry#>>'{}')::uuid;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_base) b WHERE b->>'id'=record_id::text) THEN RAISE EXCEPTION 'Invalid history removal';END IF;
  IF p_section='education' THEN DELETE FROM education WHERE id=record_id AND user_id=uid;
  ELSE DELETE FROM experience WHERE id=record_id AND user_id=uid;END IF;
 END LOOP;
 IF p_section='education' THEN RETURN (SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY id),'[]') FROM education h WHERE user_id=uid);
 ELSE RETURN (SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY id),'[]') FROM experience h WHERE user_id=uid);END IF;
END $$;
REVOKE ALL ON FUNCTION save_seeker_history(text,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION save_seeker_history(text,jsonb,jsonb,jsonb) TO authenticated;
COMMIT;
