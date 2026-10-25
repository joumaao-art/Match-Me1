-- Existing-account integration checks under actual authenticated RLS; no committed fixtures.
BEGIN;
DO $$ DECLARE uid uuid; BEGIN
 SELECT p.user_id INTO uid FROM user_profiles p JOIN job_seeker_profiles s USING(user_id) WHERE p.role='job_seeker' LIMIT 1;
 IF uid IS NULL THEN RAISE EXCEPTION 'BLOCKED: existing seeker required';END IF;
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE uid uuid:=auth.uid(); profile jsonb; other_id uuid; previous jsonb; result jsonb; failed boolean; marker uuid:=gen_random_uuid();
BEGIN
 SELECT to_jsonb(p) INTO profile FROM job_seeker_profiles p WHERE user_id=uid;
 IF profile IS NULL THEN RAISE EXCEPTION 'FAIL: owner read unavailable';END IF;
 IF EXISTS(SELECT 1 FROM job_seeker_profiles WHERE user_id<>uid) OR EXISTS(SELECT 1 FROM education WHERE user_id<>uid) OR EXISTS(SELECT 1 FROM experience WHERE user_id<>uid) OR EXISTS(SELECT 1 FROM seeker_credit_transactions WHERE user_id<>uid) THEN RAISE EXCEPTION 'FAIL: private account RLS';END IF;
 result:=load_seeker_onboarding();
 IF result->'profile'->>'user_id' IS DISTINCT FROM uid::text THEN RAISE EXCEPTION 'FAIL: snapshot owner';END IF;
 previous:=coalesce(nullif(profile->'professional_details'->'portfolio','null'),'[]');
 result:=save_seeker_history('portfolio',previous||jsonb_build_array(jsonb_build_object('id',marker,'title','Rollback project','desc','Test only','url','https://example.com')),previous);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result) x WHERE x->>'id'=marker::text) THEN RAISE EXCEPTION 'FAIL: portfolio save';END IF;
 failed:=false;BEGIN PERFORM save_seeker_history('portfolio','[]',previous);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: stale portfolio accepted';END IF;
 failed:=false;BEGIN PERFORM save_seeker_history('portfolio',jsonb_build_array(jsonb_build_object('id',marker,'title','Unsafe','desc','Test','url','javascript:alert(1)')),result);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: unsafe project URL accepted';END IF;
 result:=save_seeker_history('portfolio',previous,result);
 result:=update_seeker_optional_profile('{"acquisition_other":"Rollback metadata"}',profile);
 IF result->>'acquisition_other' IS DISTINCT FROM 'Rollback metadata' OR result->'cv_url' IS DISTINCT FROM profile->'cv_url' OR result->'job_preferences' IS DISTINCT FROM profile->'job_preferences' THEN RAISE EXCEPTION 'FAIL: optional metadata preservation';END IF;
 failed:=false;BEGIN PERFORM update_seeker_optional_profile('{"acquisition_other":"Stale metadata"}',profile);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: optional conflict accepted';END IF;
 failed:=false;BEGIN PERFORM update_seeker_optional_profile('{"signup_credits":999}',result);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL: entitlement field accepted';END IF;
 RAISE NOTICE 'PASS: authenticated owner reads, profile/history/credit isolation, snapshot ownership, portfolio create/remove/conflict/URL guard and optional metadata conflict/preservation';
END $$;
RESET ROLE;
ROLLBACK;
