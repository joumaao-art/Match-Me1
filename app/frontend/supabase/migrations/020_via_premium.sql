BEGIN;
CREATE TABLE public.billing_plans(id text PRIMARY KEY,name text NOT NULL,amount integer NOT NULL,currency text NOT NULL,billing_interval text NOT NULL CHECK(billing_interval IN('month','year')),active boolean NOT NULL DEFAULT true);
INSERT INTO public.billing_plans VALUES('via_premium_monthly','VIA Premium',1000,'usd','month',true),('via_premium_yearly','VIA Premium',10000,'usd','year',true);
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_catalog_read ON public.billing_plans FOR SELECT TO authenticated USING(active);
GRANT SELECT ON public.billing_plans TO authenticated;
CREATE TABLE public.subscriptions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
 plan text REFERENCES public.billing_plans(id),billing_cycle text,status text NOT NULL DEFAULT 'inactive' CHECK(status IN('inactive','checkout_pending','active','payment_failed','cancelled','expired')),
 stripe_customer_id text,stripe_subscription_id text UNIQUE,current_period_start timestamptz,current_period_end timestamptz,
 cancel_at_period_end boolean NOT NULL DEFAULT false,verified_at timestamptz,checkout_key uuid,checkout_started_at timestamptz,checkout_session_id text,checkout_url text,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_owner_read ON public.subscriptions FOR SELECT TO authenticated USING(user_id=auth.uid());
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions,public.billing_plans TO service_role;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.subscriptions,public.billing_plans FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.has_via_premium(account_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM subscriptions WHERE user_id=account_user AND plan IN('via_premium_monthly','via_premium_yearly') AND status IN('active','cancelled') AND verified_at IS NOT NULL AND current_period_end>now());
$$;
REVOKE ALL ON FUNCTION public.has_via_premium(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.get_via_entitlement() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT has_via_premium(auth.uid()); $$;
REVOKE ALL ON FUNCTION public.get_via_entitlement() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_via_entitlement() TO authenticated;
CREATE OR REPLACE FUNCTION public.reserve_via_checkout(account_user uuid,plan_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s subscriptions;
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Server only';END IF;
 IF NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=account_user AND role='job_seeker') OR NOT EXISTS(SELECT 1 FROM billing_plans WHERE id=plan_id AND active) THEN RAISE EXCEPTION 'Invalid purchaser or plan';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(account_user::text,0));
 INSERT INTO subscriptions(user_id) VALUES(account_user) ON CONFLICT(user_id) DO NOTHING;
 SELECT * INTO s FROM subscriptions WHERE user_id=account_user FOR UPDATE;
 IF has_via_premium(account_user) THEN RAISE EXCEPTION 'Subscription already active. Manage your existing subscription.';END IF;
 IF s.checkout_started_at>now()-interval '24 hours' AND s.status='checkout_pending' THEN
  IF s.plan<>plan_id THEN RAISE EXCEPTION 'A different plan checkout is pending. Cancel it before changing plans.';END IF;
  RETURN to_jsonb(s);
 END IF;
 UPDATE subscriptions SET plan=plan_id,status='checkout_pending',checkout_key=gen_random_uuid(),checkout_started_at=now(),checkout_session_id=NULL,checkout_url=NULL,updated_at=now() WHERE user_id=account_user RETURNING * INTO s;
 RETURN to_jsonb(s);
END $$;
REVOKE ALL ON FUNCTION public.reserve_via_checkout(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_via_checkout(uuid,text) TO service_role;
-- Modify only the existing canonical action RPC's debit guard; preserve all decision rules.
DO $$ DECLARE definition text;BEGIN
 SELECT pg_get_functiondef('public.record_seeker_job_action(uuid,text)'::regprocedure) INTO definition;
 IF position('IF available IS NULL THEN RAISE EXCEPTION' IN definition)=0 THEN RAISE EXCEPTION 'Unexpected action contract';END IF;
 definition:=replace(definition,'IF available IS NULL THEN RAISE EXCEPTION','IF NOT(action=''right'' AND has_via_premium(uid)) AND available IS NULL THEN RAISE EXCEPTION');
 definition:=replace(definition,'IF NOT EXISTS(SELECT 1 FROM seeker_credit_transactions WHERE user_id=uid AND operation_key=''job:''||job_id) THEN','IF NOT(action=''right'' AND has_via_premium(uid)) AND NOT EXISTS(SELECT 1 FROM seeker_credit_transactions WHERE user_id=uid AND operation_key=''job:''||job_id) THEN');
 EXECUTE definition;
END $$;
COMMIT;
