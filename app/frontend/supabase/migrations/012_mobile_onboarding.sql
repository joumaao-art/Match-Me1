-- Mobile onboarding v3: additive, account-owned persistence.
BEGIN;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS mobile_onboarding_state jsonb;
ALTER TABLE public.job_seeker_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.job_seeker_profiles ADD COLUMN IF NOT EXISTS nationalities text[] DEFAULT '{}';
CREATE TABLE IF NOT EXISTS public.education (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 institution text NOT NULL, degree text, degree_code text, field_of_study text,
 start_date date, end_date date, is_current boolean DEFAULT false, country text, city text, grade text
);
CREATE TABLE IF NOT EXISTS public.experience (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 company_name text NOT NULL, job_title text NOT NULL, employment_type text,
 start_date date, end_date date, is_current boolean DEFAULT false, country text, city text,
 description text, industry text
);
ALTER TABLE public.experience ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.education ADD COLUMN IF NOT EXISTS degree_code text;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mobile_education_owner ON public.education;
CREATE POLICY mobile_education_owner ON public.education FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS mobile_experience_owner ON public.experience;
CREATE POLICY mobile_experience_owner ON public.experience FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

CREATE TABLE IF NOT EXISTS public.seeker_credit_accounts (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id), balance integer NOT NULL DEFAULT 0 CHECK(balance>=0),
 signup_granted boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.seeker_credit_transactions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id),
 operation_key text NOT NULL, amount integer NOT NULL, kind text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,operation_key)
);
ALTER TABLE public.seeker_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeker_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_account_read ON public.seeker_credit_accounts FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY credit_transaction_read ON public.seeker_credit_transactions FOR SELECT TO authenticated USING(user_id=auth.uid());
-- Preserve every existing credit award, including completed zero-balance accounts.
INSERT INTO public.seeker_credit_accounts(user_id,balance,signup_granted)
 SELECT j.user_id,greatest(coalesce(j.signup_credits,0),0),coalesce(j.signup_credits,0)>0 OR coalesce(u.onboarding_completed,false)
 FROM public.job_seeker_profiles j JOIN public.user_profiles u USING(user_id)
 ON CONFLICT(user_id) DO NOTHING;
INSERT INTO public.seeker_credit_transactions(user_id,operation_key,amount,kind)
 SELECT user_id,'legacy-import',balance,'legacy_import' FROM public.seeker_credit_accounts WHERE balance>0
 ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.claim_seeker_signup_credits() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); account seeker_credit_accounts%ROWTYPE;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker authentication required'; END IF;
 INSERT INTO seeker_credit_accounts(user_id) VALUES(uid) ON CONFLICT DO NOTHING;
 SELECT * INTO account FROM seeker_credit_accounts WHERE user_id=uid FOR UPDATE;
 IF NOT account.signup_granted THEN
  INSERT INTO seeker_credit_transactions(user_id,operation_key,amount,kind) VALUES(uid,'signup-v1',20,'signup');
  UPDATE seeker_credit_accounts SET balance=balance+20,signup_granted=true,updated_at=now() WHERE user_id=uid;
 END IF;
 RETURN (SELECT balance FROM seeker_credit_accounts WHERE user_id=uid);
END $$;
CREATE OR REPLACE FUNCTION public.spend_seeker_swipe_credit(operation_key text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); available integer;
BEGIN
 IF uid IS NULL OR operation_key !~ '^swipe:[a-zA-Z0-9_-]+:(left|right)$' THEN RAISE EXCEPTION 'Invalid swipe operation'; END IF;
 SELECT balance INTO available FROM seeker_credit_accounts WHERE user_id=uid FOR UPDATE;
 IF available IS NULL THEN RAISE EXCEPTION 'Credit account unavailable'; END IF;
 IF EXISTS(SELECT 1 FROM seeker_credit_transactions t WHERE t.user_id=uid AND t.operation_key=spend_seeker_swipe_credit.operation_key) THEN RETURN available; END IF;
 IF available<1 THEN RAISE EXCEPTION 'No swiping credits remaining'; END IF;
 INSERT INTO seeker_credit_transactions(user_id,operation_key,amount,kind) VALUES(uid,operation_key,-1,'swipe');
 UPDATE seeker_credit_accounts SET balance=balance-1,updated_at=now() WHERE user_id=uid;
 RETURN available-1;
END $$;
-- Only a verified payment webhook/service role may call this, never a browser.
CREATE OR REPLACE FUNCTION public.credit_seeker_purchase(account_user uuid, payment_reference text, quantity integer) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE added integer;
BEGIN
 IF quantity<1 OR length(payment_reference)<3 THEN RAISE EXCEPTION 'Invalid verified purchase'; END IF;
 INSERT INTO seeker_credit_accounts(user_id) VALUES(account_user) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM seeker_credit_accounts WHERE user_id=account_user FOR UPDATE;
 INSERT INTO seeker_credit_transactions(user_id,operation_key,amount,kind) VALUES(account_user,'payment:'||payment_reference,quantity,'purchase') ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS added=ROW_COUNT;
 IF added=1 THEN UPDATE seeker_credit_accounts SET balance=balance+quantity,updated_at=now() WHERE user_id=account_user; END IF;
 RETURN (SELECT balance FROM seeker_credit_accounts WHERE user_id=account_user);
END $$;
REVOKE ALL ON FUNCTION public.credit_seeker_purchase(uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_seeker_purchase(uuid,text,integer) TO service_role;
REVOKE ALL ON FUNCTION public.claim_seeker_signup_credits(),public.spend_seeker_swipe_credit(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_seeker_signup_credits(),public.spend_seeker_swipe_credit(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.save_mobile_onboarding_internal(payload jsonb, completed_step text DEFAULT NULL, finish boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); d jsonb:=payload->'draft'; entry jsonb; prefs jsonb;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker authentication required'; END IF;
 IF completed_step IS NOT NULL AND completed_step NOT IN ('PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY','FREE_CREDITS','HOW_IT_WORKS') THEN RAISE EXCEPTION 'Invalid step'; END IF;
 PERFORM 1 FROM user_profiles WHERE user_id=uid FOR UPDATE;
 -- Draft saves do not mark steps completed or update canonical history.
 IF completed_step IS NOT NULL THEN
  IF completed_step='PERSONAL_DETAILS' THEN
   IF trim(coalesce(d->>'firstName',''))='' OR trim(coalesce(d->>'lastName',''))='' THEN RAISE EXCEPTION 'Names required'; END IF;
   UPDATE job_seeker_profiles SET first_name=d->>'firstName',last_name=d->>'lastName',full_name=concat_ws(' ',d->>'firstName',d->>'lastName'),phone=d->>'mobile',email=d->>'email',headline=d->>'headline',bio=d->>'summary',nationalities=ARRAY(SELECT jsonb_array_elements_text(d->'nationalities')),cv_url=nullif(d->>'cvUrl','') WHERE user_id=uid;
  ELSIF completed_step='GENDER' THEN
   IF d->>'gender' NOT IN ('male','female','prefer_not_to_say') THEN RAISE EXCEPTION 'Gender required'; END IF;
   UPDATE job_seeker_profiles SET gender=d->>'gender' WHERE user_id=uid;
  ELSIF completed_step='BIRTHDAY' THEN
   UPDATE job_seeker_profiles SET date_of_birth=(d->>'birthday')::date WHERE user_id=uid;
  ELSIF completed_step='CURRENT_LOCATION' THEN
   UPDATE job_seeker_profiles SET country=d->>'country',city=d->>'city',location=concat_ws(', ',d->>'city',d->>'country') WHERE user_id=uid;
  ELSIF completed_step='SKILLS' THEN
   UPDATE job_seeker_profiles SET skills=ARRAY(SELECT jsonb_array_elements_text(d->'skills')) WHERE user_id=uid;
  ELSIF completed_step='EDUCATION' THEN
   FOR entry IN SELECT * FROM jsonb_array_elements(d->'educations') LOOP
    INSERT INTO education(id,user_id,institution,degree,degree_code,field_of_study,start_date,end_date,is_current,country,city)
    VALUES((entry->>'id')::uuid,uid,entry->>'institution',entry->>'degree',entry->>'degree',entry->>'field',(entry->>'from'||'-01')::date,CASE WHEN coalesce(entry->>'to','')='' THEN NULL ELSE (entry->>'to'||'-01')::date END,coalesce((entry->>'current')::boolean,false),entry->>'country',entry->>'city')
    ON CONFLICT(id) DO UPDATE SET institution=EXCLUDED.institution,degree=EXCLUDED.degree,degree_code=EXCLUDED.degree_code,field_of_study=EXCLUDED.field_of_study,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,is_current=EXCLUDED.is_current,country=EXCLUDED.country,city=EXCLUDED.city WHERE education.user_id=uid;
   END LOOP;
  ELSIF completed_step='EXPERIENCE' THEN
   IF NOT coalesce((d->>'noExperience')::boolean,false) THEN
    FOR entry IN SELECT * FROM jsonb_array_elements(d->'experiences') LOOP
     INSERT INTO experience(id,user_id,company_name,job_title,employment_type,start_date,end_date,is_current,industry,description,country,city)
     VALUES((entry->>'id')::uuid,uid,entry->>'company',entry->>'title',entry->>'type',(entry->>'from'||'-01')::date,CASE WHEN coalesce(entry->>'to','')='' THEN NULL ELSE (entry->>'to'||'-01')::date END,coalesce((entry->>'current')::boolean,false),entry->>'industry',entry->>'description',entry->>'country',entry->>'city')
     ON CONFLICT(id) DO UPDATE SET company_name=EXCLUDED.company_name,job_title=EXCLUDED.job_title,employment_type=EXCLUDED.employment_type,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,is_current=EXCLUDED.is_current,industry=EXCLUDED.industry WHERE experience.user_id=uid;
    END LOOP;
   END IF;
   UPDATE job_seeker_profiles SET job_preferences=coalesce(job_preferences,'{}')||jsonb_build_object('noExperience',coalesce((d->>'noExperience')::boolean,false)) WHERE user_id=uid;
  ELSIF completed_step IN ('PREFERENCES','SENIORITY') THEN
   prefs:=d->'preferences';
   UPDATE job_seeker_profiles SET job_preferences=coalesce(job_preferences,'{}')||prefs,desired_roles=ARRAY(SELECT jsonb_array_elements_text(prefs->'expertise')),work_styles=ARRAY(SELECT jsonb_array_elements_text(prefs->'workingStyles')) WHERE user_id=uid;
  ELSIF completed_step='FREE_CREDITS' THEN
   PERFORM claim_seeker_signup_credits();
  END IF;
 END IF;
 IF finish THEN
  IF NOT (payload->'done' @> '["PERSONAL_DETAILS","GENDER","BIRTHDAY","CURRENT_LOCATION","SKILLS","EDUCATION","EXPERIENCE","PREFERENCES","SENIORITY","FREE_CREDITS","HOW_IT_WORKS"]'::jsonb) THEN RAISE EXCEPTION 'Complete every step first'; END IF;
  UPDATE user_profiles SET onboarding_completed=true WHERE user_id=uid;
 END IF;
 UPDATE user_profiles SET mobile_onboarding_state=payload WHERE user_id=uid;
 RETURN payload;
END $$;
REVOKE ALL ON FUNCTION public.save_mobile_onboarding_internal(jsonb,text,boolean) FROM PUBLIC,anon,authenticated;
COMMIT;
