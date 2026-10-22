-- Targeted mobile refinements; no schema/data resets or desktop layout changes.
BEGIN;
DO $$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.validate_mobile_step(text,jsonb)'::regprocedure);
 definition:=replace(definition,'''firstName'',''lastName'',''email'',''mobile'',''headline'',''summary''','''firstName'',''lastName'',''email'',''mobile''');
 EXECUTE definition;
 definition:=pg_get_functiondef('public.save_mobile_onboarding_internal(jsonb,text,boolean)'::regprocedure);
 definition:=replace(definition,' OR trim(coalesce(d->>''headline'',''''))=''''','');
 definition:=replace(definition,' OR trim(coalesce(d->>''summary'',''''))=''''','');
 -- These fields remain editable elsewhere; Step1 must never overwrite them.
 definition:=replace(definition,'headline=d->>''headline'',bio=d->>''summary'',','');
 EXECUTE definition;
END $$;
CREATE OR REPLACE FUNCTION public.ensure_seeker_signup_credit(account_user uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE account seeker_credit_accounts%ROWTYPE; added integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=account_user AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker account required'; END IF;
 INSERT INTO seeker_credit_accounts(user_id) VALUES(account_user) ON CONFLICT DO NOTHING;
 SELECT * INTO account FROM seeker_credit_accounts WHERE user_id=account_user FOR UPDATE;
 -- Honor imported legacy entitlements and existing signup evidence. Never reduce any balance.
 IF NOT account.signup_granted THEN
  IF EXISTS(SELECT 1 FROM seeker_credit_transactions WHERE user_id=account_user AND kind='signup' AND amount>0)
   OR EXISTS(SELECT 1 FROM job_seeker_profiles WHERE user_id=account_user AND coalesce(signup_credits,0)>0) THEN
   UPDATE seeker_credit_accounts SET signup_granted=true,updated_at=now() WHERE user_id=account_user;
  ELSE
   INSERT INTO seeker_credit_transactions(user_id,operation_key,amount,kind) VALUES(account_user,'signup-v1',20,'signup') ON CONFLICT(user_id,operation_key) DO NOTHING;
   GET DIAGNOSTICS added=ROW_COUNT;
   UPDATE seeker_credit_accounts SET balance=balance+CASE WHEN added=1 THEN 20 ELSE 0 END,signup_granted=true,updated_at=now() WHERE user_id=account_user;
  END IF;
 END IF;
 RETURN (SELECT balance FROM seeker_credit_accounts WHERE user_id=account_user);
END $$;
REVOKE ALL ON FUNCTION public.ensure_seeker_signup_credit(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.claim_seeker_signup_credits() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 RETURN ensure_seeker_signup_credit(auth.uid());
END $$;
REVOKE ALL ON FUNCTION public.claim_seeker_signup_credits() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_seeker_signup_credits() TO authenticated;
CREATE OR REPLACE FUNCTION public.initialize_seeker_credit_entitlement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.role='job_seeker' THEN PERFORM ensure_seeker_signup_credit(NEW.user_id); END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.initialize_seeker_credit_entitlement() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS initialize_seeker_credit_entitlement ON public.user_profiles;
CREATE TRIGGER initialize_seeker_credit_entitlement AFTER INSERT ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.initialize_seeker_credit_entitlement();
-- Repair only accounts explicitly marked ungranted or missing an account. Unknown imported zero balances stay untouched.
SELECT ensure_seeker_signup_credit(u.user_id) FROM user_profiles u LEFT JOIN seeker_credit_accounts c ON c.user_id=u.user_id WHERE u.role='job_seeker' AND (c.user_id IS NULL OR NOT c.signup_granted);
COMMIT;
