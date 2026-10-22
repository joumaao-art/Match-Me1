-- Apply after 013; preserve existing records and server credit balances.
BEGIN;
DO $$
DECLARE definition text; guard text := $guard$
 IF jsonb_typeof(payload)<>'object' OR jsonb_typeof(payload->'draft')<>'object' OR jsonb_typeof(payload->'done')<>'array' THEN RAISE EXCEPTION 'Invalid mobile state'; END IF;
 IF completed_step IS NOT NULL AND completed_step NOT IN('PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY','FREE_CREDITS','HOW_IT_WORKS') THEN RAISE EXCEPTION 'Invalid mobile step'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(payload->'draft'->'educations','[]')) e JOIN education h ON h.id=(e->>'id')::uuid WHERE h.user_id<>uid)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(payload->'draft'->'experiences','[]')) e JOIN experience h ON h.id=(e->>'id')::uuid WHERE h.user_id<>uid) THEN RAISE EXCEPTION 'History ownership mismatch'; END IF;
$guard$;
BEGIN
 definition:=pg_get_functiondef('public.save_mobile_onboarding(jsonb,text,boolean)'::regprocedure);
 IF position('History ownership mismatch' IN definition)=0 THEN
  definition:=replace(definition,'IF prior IS NULL THEN',guard||'IF prior IS NULL THEN');
  EXECUTE definition;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.credit_seeker_purchase(account_user uuid, payment_reference text, quantity integer) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE added integer;
BEGIN
 IF account_user IS NULL OR quantity IS NULL OR quantity<1 OR quantity>100000 OR payment_reference IS NULL OR length(trim(payment_reference))<3
 OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=account_user AND role='job_seeker') THEN RAISE EXCEPTION 'Invalid verified purchase'; END IF;
 INSERT INTO seeker_credit_accounts(user_id) VALUES(account_user) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM seeker_credit_accounts WHERE user_id=account_user FOR UPDATE;
 INSERT INTO seeker_credit_transactions(user_id,operation_key,amount,kind) VALUES(account_user,'payment:'||payment_reference,quantity,'purchase') ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS added=ROW_COUNT;
 IF added=1 THEN UPDATE seeker_credit_accounts SET balance=balance+quantity,updated_at=now() WHERE user_id=account_user; END IF;
 RETURN (SELECT balance FROM seeker_credit_accounts WHERE user_id=account_user);
END $$;
REVOKE ALL ON FUNCTION public.credit_seeker_purchase(uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_seeker_purchase(uuid,text,integer) TO service_role;
COMMIT;
