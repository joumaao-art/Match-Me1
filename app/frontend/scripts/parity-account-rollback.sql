-- Run with the connected project SQL tool; all account edits are rolled back.
BEGIN;
DO $$
DECLARE uid uuid; before_row jsonb; saved jsonb; snapshot jsonb; account jsonb; payload jsonb; history jsonb; result jsonb; eid uuid:=gen_random_uuid(); failed boolean;
BEGIN
 SELECT user_id INTO uid FROM user_profiles WHERE role='job_seeker' AND EXISTS(SELECT 1 FROM job_seeker_profiles p WHERE p.user_id=user_profiles.user_id) LIMIT 1;
 IF uid IS NULL THEN RAISE EXCEPTION 'BLOCKED: existing seeker required';END IF;
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated')::text,true);
 UPDATE job_seeker_profiles SET headline=NULL WHERE user_id=uid;
 SELECT to_jsonb(p) INTO before_row FROM job_seeker_profiles p WHERE user_id=uid;
 saved:=update_seeker_profile('{"headline":"Parity transaction test"}',before_row);
 IF saved->>'headline' IS DISTINCT FROM 'Parity transaction test' THEN RAISE EXCEPTION 'FAIL: nullable profile patch';END IF;
 failed:=false;BEGIN PERFORM update_seeker_profile('{"headline":"Stale"}',before_row);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: stale profile accepted';END IF;
 failed:=false;BEGIN PERFORM update_seeker_profile('{"email":"forged@example.com"}',saved);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: forged Auth email accepted';END IF;
 snapshot:=load_seeker_onboarding();account:=snapshot->'account';
 IF snapshot->'profile'->>'user_id' IS DISTINCT FROM uid::text THEN RAISE EXCEPTION 'FAIL: snapshot ownership';END IF;
 history:=snapshot->'snapshot'->'EDUCATION';
 result:=save_seeker_history('education',jsonb_build_array(jsonb_build_object('id',eid,'institution','Parity University','degree','BACHELOR','degree_code','BACHELOR','field_of_study','Testing','start_date','2020-01-01','end_date','2024-01-01','country','GB','city','London','grade','Preserved')),history);
 result:=save_seeker_history('education',jsonb_build_array(jsonb_build_object('id',eid,'institution','Updated University')),result);
 IF NOT EXISTS(SELECT 1 FROM education WHERE id=eid AND grade='Preserved' AND city='London') THEN RAISE EXCEPTION 'FAIL: hidden history lost';END IF;
 failed:=false;BEGIN PERFORM save_seeker_history('education','[]',history);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: stale history accepted';END IF;
 result:=save_seeker_history('education','[]',result,jsonb_build_array(eid));
 IF EXISTS(SELECT 1 FROM education WHERE id=eid) THEN RAISE EXCEPTION 'FAIL: removal not atomic';END IF;
 failed:=false;BEGIN PERFORM save_mobile_onboarding('{"version":3,"screen":"INTRO","draft":{},"done":[]}'::jsonb,NULL,false);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: missing revision accepted';END IF;
 IF EXISTS(SELECT 1 FROM information_schema.routine_privileges WHERE specific_schema='public' AND routine_name IN ('save_seeker_history','load_seeker_onboarding','update_seeker_profile') AND grantee IN ('PUBLIC','anon')) THEN RAISE EXCEPTION 'FAIL: anonymous write privileges';END IF;
 IF EXISTS(SELECT 1 FROM information_schema.routine_privileges WHERE specific_schema='public' AND routine_name='save_mobile_onboarding_internal' AND grantee='authenticated') THEN RAISE EXCEPTION 'FAIL: internal onboarding exposed';END IF;
 RAISE NOTICE 'PASS: nullable patch, stale profile/history rejection, email restriction, coherent owner snapshot, atomic history create/update/delete, hidden fields, revision validation and grants';
END $$;
ROLLBACK;
