-- Run against the existing Supabase project; all fixtures are rolled back.
BEGIN;
DO $$ DECLARE uid uuid; BEGIN
 SELECT p.user_id INTO uid FROM user_profiles p JOIN job_seeker_profiles s USING(user_id) WHERE p.role='job_seeker' LIMIT 1;
 IF uid IS NULL THEN RAISE EXCEPTION 'BLOCKED: existing seeker required';END IF;
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE p jsonb; b jsonb; r jsonb; failed boolean; BEGIN
 SELECT to_jsonb(s) INTO p FROM job_seeker_profiles s WHERE user_id=auth.uid();
 b:=coalesce(nullif(p->'professional_details'->'languages','null'),'[]');
 failed:=false;BEGIN PERFORM save_seeker_history('languages','[null]',b);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL malformed language';END IF;
 failed:=false;BEGIN PERFORM save_seeker_history('languages','[{"id":"test","name":"English","level":"expert"}]',b);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL invalid level';END IF;
 r:=save_seeker_history('languages','[{"id":"test","name":"English","level":"fluent"}]',b);
 IF r->0->>'level'<>'fluent' THEN RAISE EXCEPTION 'FAIL valid language';END IF;
 b:=coalesce(nullif(p->'professional_details'->'certificates','null'),'[]');
 failed:=false;BEGIN PERFORM save_seeker_history('certificates','[{"id":"test","name":"Test","issuer":"Issuer","date":"2025-01","expiry":null,"verified":true}]',b);EXCEPTION WHEN OTHERS THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'FAIL forged verification';END IF;
 r:=save_seeker_history('certificates','[{"id":"test","name":"Test","issuer":"Issuer","date":"2025-01","expiry":null,"verified":false}]',b);
 r:=update_seeker_account_settings('{"notifications":{"enabled":true,"events":{"message":false}}}',coalesce(p->'account_settings','{}'));
END $$;
RESET ROLE;
DO $$ DECLARE n bigint; BEGIN
 SELECT count(*) INTO n FROM app_91d3436dfc_notifications WHERE user_id=auth.uid();
 INSERT INTO app_91d3436dfc_notifications(user_id,event,title,body) VALUES(auth.uid(),'message','Rollback suppressed','Test');
 IF (SELECT count(*) FROM app_91d3436dfc_notifications WHERE user_id=auth.uid())<>n THEN RAISE EXCEPTION 'FAIL notification preference suppression';END IF;
END $$;
ROLLBACK;
SELECT 'PASS: saved JSON validation, valid writes, verification protection and notification suppression; rolled back' AS result;
