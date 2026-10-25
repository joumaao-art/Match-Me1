BEGIN;
CREATE FUNCTION public.update_seeker_account_settings(p_patch jsonb,p_base jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p job_seeker_profiles; k text; settings jsonb;
BEGIN
 IF auth.uid() IS NULL OR p_patch IS NULL OR jsonb_typeof(p_patch)<>'object' OR p_base IS NULL OR jsonb_typeof(p_base)<>'object' THEN RAISE EXCEPTION 'Authenticated settings required';END IF;
 SELECT * INTO STRICT p FROM job_seeker_profiles WHERE user_id=auth.uid() FOR UPDATE;
 settings:=coalesce(p.account_settings,'{}');
 FOR k IN SELECT jsonb_object_keys(p_patch) LOOP
  IF k NOT IN('language','notifications') THEN RAISE EXCEPTION 'Unsupported setting';END IF;
  IF settings->k IS DISTINCT FROM p_base->k AND settings->k IS DISTINCT FROM p_patch->k THEN RAISE EXCEPTION 'Settings changed on another device. Reload before saving.';END IF;
 END LOOP;
 IF p_patch?'language' AND coalesce(p_patch->>'language','') NOT IN('en','ar') THEN RAISE EXCEPTION 'Unsupported language';END IF;
 IF p_patch?'notifications' AND (jsonb_typeof(p_patch->'notifications')<>'object' OR jsonb_typeof(p_patch->'notifications'->'enabled') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_patch->'notifications'->'events') IS DISTINCT FROM 'object') THEN RAISE EXCEPTION 'Invalid notification preferences';END IF;
 IF p_patch?'notifications' THEN
  FOR k IN SELECT jsonb_object_keys(p_patch->'notifications'->'events') LOOP
   IF k NOT IN('message','interview','application','new_match','company_invite','job_expiry','subscription','admin_notice') OR jsonb_typeof(p_patch->'notifications'->'events'->k)<>'boolean' THEN RAISE EXCEPTION 'Invalid event preference';END IF;
  END LOOP;
 END IF;
 UPDATE job_seeker_profiles SET account_settings=settings||p_patch,notification_enabled=CASE WHEN p_patch?'notifications' THEN (p_patch->'notifications'->>'enabled')::boolean ELSE notification_enabled END,updated_at=clock_timestamp() WHERE user_id=auth.uid();
 RETURN (SELECT to_jsonb(s) FROM job_seeker_profiles s WHERE user_id=auth.uid());
END $$;
CREATE FUNCTION public.filter_account_notification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p job_seeker_profiles;
BEGIN
 SELECT * INTO p FROM job_seeker_profiles WHERE user_id=NEW.user_id;
 IF p.user_id IS NOT NULL AND (p.notification_enabled=false OR p.account_settings->'notifications'->>'enabled'='false' OR p.account_settings->'notifications'->'events'->>NEW.event='false') THEN RETURN NULL;END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER account_notification_preferences BEFORE INSERT ON app_91d3436dfc_notifications FOR EACH ROW EXECUTE FUNCTION filter_account_notification();
REVOKE ALL ON FUNCTION update_seeker_account_settings(jsonb,jsonb),filter_account_notification() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION update_seeker_account_settings(jsonb,jsonb) TO authenticated;
COMMIT;
