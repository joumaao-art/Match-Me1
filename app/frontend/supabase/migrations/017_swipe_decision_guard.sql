BEGIN;
CREATE OR REPLACE FUNCTION public.record_seeker_job_action(job_id uuid, action text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();available integer;prior text;latest uuid;changed integer;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker authentication required';END IF;
 IF action IS NULL OR action NOT IN('left','right','save','unsave','undo','withdraw') THEN RAISE EXCEPTION 'Invalid action';END IF;
 -- Serialize all decisions for an account, including undo/save, across devices.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,0));
 PERFORM 1 FROM vacancies WHERE id=job_id AND status='open' AND (expiration_date IS NULL OR expiration_date::date>=current_date) FOR SHARE;
 IF NOT FOUND AND action IN('left','right','save','undo') THEN RAISE EXCEPTION 'Job is no longer available';END IF;
 SELECT balance INTO available FROM seeker_credit_accounts WHERE user_id=uid FOR UPDATE;
 SELECT direction INTO prior FROM seeker_job_actions WHERE user_id=uid AND vacancy_id=job_id FOR UPDATE;
 IF action IN('left','right') THEN
  IF prior=action THEN RETURN coalesce(available,0);END IF;
  IF prior IS NOT NULL THEN RAISE EXCEPTION 'This job already has a decision. Refresh your jobs.';END IF;
  IF available IS NULL THEN RAISE EXCEPTION 'Credit account unavailable';END IF;
  IF NOT EXISTS(SELECT 1 FROM seeker_credit_transactions WHERE user_id=uid AND operation_key='job:'||job_id) THEN
   IF available<1 THEN RAISE EXCEPTION 'No swiping credits remaining';END IF;
   INSERT INTO seeker_credit_transactions(user_id,operation_key,amount,kind) VALUES(uid,'job:'||job_id,-1,'swipe');
   UPDATE seeker_credit_accounts SET balance=balance-1,updated_at=now() WHERE user_id=uid;available:=available-1;
  END IF;
  INSERT INTO seeker_job_actions(user_id,vacancy_id,direction,application_status) VALUES(uid,job_id,action,CASE WHEN action='right' THEN 'pending' END)
  ON CONFLICT(user_id,vacancy_id) DO UPDATE SET direction=EXCLUDED.direction,application_status=EXCLUDED.application_status,updated_at=now();
 ELSIF action IN('save','unsave') THEN
  INSERT INTO seeker_job_actions(user_id,vacancy_id,saved) VALUES(uid,job_id,action='save')
  ON CONFLICT(user_id,vacancy_id) DO UPDATE SET saved=EXCLUDED.saved;
 ELSIF action='undo' THEN
  SELECT a.vacancy_id INTO latest FROM seeker_job_actions a JOIN vacancies v ON v.id=a.vacancy_id
   WHERE a.user_id=uid AND a.direction='left' AND v.status='open' AND (v.expiration_date IS NULL OR v.expiration_date::date>=current_date)
   ORDER BY a.updated_at DESC,a.vacancy_id LIMIT 1;
  IF latest IS DISTINCT FROM job_id THEN RAISE EXCEPTION 'No eligible latest Pass to undo. Refresh your jobs.';END IF;
  UPDATE seeker_job_actions SET direction=NULL,updated_at=now() WHERE user_id=uid AND vacancy_id=job_id AND direction='left';
  GET DIAGNOSTICS changed=ROW_COUNT;IF changed<>1 THEN RAISE EXCEPTION 'Pass was already restored';END IF;
 ELSIF action='withdraw' THEN
  UPDATE seeker_job_actions SET application_status='withdrawn',updated_at=now() WHERE user_id=uid AND vacancy_id=job_id AND application_status='pending';
 END IF;
 RETURN coalesce(available,0);
END $$;
REVOKE ALL ON FUNCTION public.record_seeker_job_action(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_seeker_job_action(uuid,text) TO authenticated;
COMMIT;
