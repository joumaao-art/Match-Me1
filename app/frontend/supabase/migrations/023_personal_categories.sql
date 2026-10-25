-- Additive canonical Personal fields; no backfill or account reset.
BEGIN;
ALTER TABLE public.job_seeker_profiles ADD COLUMN IF NOT EXISTS title text, ADD COLUMN IF NOT EXISTS current_compensation jsonb;
CREATE OR REPLACE FUNCTION public.valid_current_compensation(value jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE code text; amount numeric; precision_digits integer;
BEGIN
 IF value IS NULL THEN RETURN true; END IF;
 IF jsonb_typeof(value)<>'object' OR NOT value ?& ARRAY['amount','currency','frequency'] OR (SELECT count(*) FROM jsonb_object_keys(value))<>3 THEN RETURN false; END IF;
 IF jsonb_typeof(value->'amount')<>'number' OR jsonb_typeof(value->'currency')<>'string' OR jsonb_typeof(value->'frequency')<>'string' THEN RETURN false; END IF;
 code:=value->>'currency'; amount:=(value->>'amount')::numeric;
 IF code NOT IN ('AED','ARS','AUD','BDT','BGN','BHD','BRL','CAD','CHF','CLP','CNY','COP','CZK','DKK','DZD','EGP','EUR','GBP','HKD','HUF','IDR','ILS','INR','IQD','ISK','JOD','JPY','KES','KRW','KWD','LKR','MAD','MXN','MYR','NGN','NOK','NPR','NZD','OMR','PEN','PHP','PKR','PLN','QAR','RON','RSD','RUB','SAR','SEK','SGD','THB','TND','TRY','TWD','UAH','USD','VND','ZAR') OR value->>'frequency' NOT IN ('monthly','annually') OR amount<=0 OR amount>1000000000000 THEN RETURN false; END IF;
 precision_digits:=CASE WHEN code IN ('CLP','ISK','JPY','KRW','VND') THEN 0 WHEN code IN ('BHD','IQD','JOD','KWD','OMR','TND') THEN 3 ELSE 2 END;
 RETURN amount=round(amount,precision_digits);
END $$;
ALTER TABLE public.job_seeker_profiles ADD CONSTRAINT seeker_personal_title_valid CHECK(title IS NULL OR title IN ('Dr.','Mr.','Mrs.','Ms.'));
ALTER TABLE public.job_seeker_profiles ADD CONSTRAINT seeker_current_compensation_valid CHECK(public.valid_current_compensation(current_compensation));
CREATE OR REPLACE FUNCTION public.update_mobile_personal(p_patch jsonb,p_base jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); current_row job_seeker_profiles; next_row job_seeker_profiles; key text; allowed text[]:=ARRAY['title','first_name','last_name','phone','country','city','location','date_of_birth','gender','current_compensation']; auth_email text;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM user_profiles WHERE user_id=uid AND role='job_seeker') THEN RAISE EXCEPTION 'Job Seeker authentication required'; END IF;
 IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR jsonb_typeof(p_base) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid personal payload'; END IF;
 SELECT * INTO STRICT current_row FROM job_seeker_profiles WHERE user_id=uid FOR UPDATE;
 FOR key IN SELECT jsonb_object_keys(p_patch) LOOP
  IF NOT key=ANY(allowed) THEN RAISE EXCEPTION 'Unsupported personal field'; END IF;
  IF key<>'current_compensation' AND jsonb_typeof(p_patch->key) NOT IN ('string','null') THEN RAISE EXCEPTION 'Invalid personal field type'; END IF;
  IF to_jsonb(current_row)->key IS DISTINCT FROM p_base->key AND to_jsonb(current_row)->key IS DISTINCT FROM p_patch->key THEN RAISE EXCEPTION 'Profile changed elsewhere. Reload before saving.'; END IF;
 END LOOP;
 IF p_patch?'phone' AND EXISTS(SELECT 1 FROM auth.users WHERE id=uid AND coalesce(phone,'')<>'') AND p_patch->>'phone' IS DISTINCT FROM current_row.phone THEN RAISE EXCEPTION 'Login phone requires verified identity change'; END IF;
 SELECT * INTO next_row FROM jsonb_populate_record(current_row,p_patch);
 next_row.first_name:=btrim(next_row.first_name); next_row.last_name:=btrim(next_row.last_name);
 IF coalesce(next_row.first_name,'')='' OR coalesce(next_row.last_name,'')='' OR length(next_row.first_name)>100 OR length(next_row.last_name)>100 THEN RAISE EXCEPTION 'Legal first and last names required (maximum 100 characters)'; END IF;
 IF next_row.date_of_birth IS NULL OR next_row.date_of_birth>current_date OR extract(year from next_row.date_of_birth)<extract(year from current_date)-100 THEN RAISE EXCEPTION 'Valid birthday required'; END IF;
 SELECT email INTO auth_email FROM auth.users WHERE id=uid;
 IF coalesce(auth_email,'')='' THEN RAISE EXCEPTION 'Registered email required'; END IF;
 IF coalesce(next_row.phone,'') !~ '^\+[0-9]{7,15}$' OR coalesce(btrim(next_row.country),'')='' OR coalesce(btrim(next_row.city),'')='' THEN RAISE EXCEPTION 'Valid mobile, country and city required'; END IF;
 IF coalesce(next_row.gender,'') NOT IN ('male','female','prefer_not_to_say') THEN RAISE EXCEPTION 'Gender selection required'; END IF;
 IF next_row.title IS NOT NULL AND next_row.title NOT IN ('Dr.','Mr.','Mrs.','Ms.') THEN RAISE EXCEPTION 'Invalid title'; END IF;
 IF NOT valid_current_compensation(next_row.current_compensation) THEN RAISE EXCEPTION 'Invalid current compensation'; END IF;
 UPDATE job_seeker_profiles SET title=next_row.title,first_name=next_row.first_name,last_name=next_row.last_name,phone=next_row.phone,country=next_row.country,city=next_row.city,location=next_row.location,date_of_birth=next_row.date_of_birth,gender=next_row.gender,current_compensation=next_row.current_compensation,full_name=CASE WHEN p_patch?'first_name' OR p_patch?'last_name' THEN trim(concat_ws(' ',next_row.first_name,next_row.last_name)) ELSE current_row.full_name END,updated_at=clock_timestamp() WHERE user_id=uid;
 RETURN (SELECT to_jsonb(p) FROM job_seeker_profiles p WHERE user_id=uid);
END $$;
REVOKE ALL ON FUNCTION public.update_mobile_personal(jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.update_mobile_personal(jsonb,jsonb) TO authenticated;
COMMIT;
