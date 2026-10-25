-- Additive mobile Profile contract; preserves all canonical account and billing rows.
BEGIN;
ALTER TABLE public.job_seeker_profiles ADD COLUMN IF NOT EXISTS cv_file_name text, ADD COLUMN IF NOT EXISTS cv_updated_at timestamptz, ADD COLUMN IF NOT EXISTS professional_details jsonb NOT NULL DEFAULT '{}', ADD COLUMN IF NOT EXISTS account_settings jsonb NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS public.app_91d3436dfc_support_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id),category text NOT NULL CHECK(category IN ('account','profile','jobs','billing','technical')),subject text NOT NULL CHECK(length(subject) BETWEEN 3 AND 150),description text NOT NULL CHECK(length(description) BETWEEN 10 AND 5000),screenshot_path text,request_key uuid NOT NULL UNIQUE,status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','reviewing','resolved')),created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_91d3436dfc_support_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_owner_read ON public.app_91d3436dfc_support_reports FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY support_owner_submit ON public.app_91d3436dfc_support_reports FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND status='received' AND (screenshot_path IS NULL OR split_part(screenshot_path,'/',1)=auth.uid()::text));
CREATE POLICY support_admin_read ON public.app_91d3436dfc_support_reports FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=auth.uid() AND is_active));
REVOKE ALL ON public.app_91d3436dfc_support_reports FROM anon; GRANT SELECT,INSERT ON public.app_91d3436dfc_support_reports TO authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('cvs','cvs',false,10485760,ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']),('support-attachments','support-attachments',false,5242880,ARRAY['image/png','image/jpeg','image/webp']) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
CREATE POLICY profile_file_owner_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id IN ('cvs','support-attachments') AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY profile_file_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id IN ('cvs','support-attachments') AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY profile_file_owner_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id IN ('cvs','support-attachments') AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY support_admin_attachment_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='support-attachments' AND EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=auth.uid() AND is_active));
CREATE OR REPLACE FUNCTION public.update_mobile_personal(p_patch jsonb,p_base jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); current_row job_seeker_profiles; key text; allowed text[]:=ARRAY['first_name','last_name','phone','country','city','date_of_birth','gender'];
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 SELECT * INTO STRICT current_row FROM job_seeker_profiles WHERE user_id=uid FOR UPDATE;
 FOR key IN SELECT jsonb_object_keys(p_patch) LOOP
  IF NOT key=ANY(allowed) THEN RAISE EXCEPTION 'Unsupported personal field'; END IF;
  IF to_jsonb(current_row)->key IS DISTINCT FROM p_base->key AND to_jsonb(current_row)->key IS DISTINCT FROM p_patch->key THEN RAISE EXCEPTION 'Profile changed elsewhere. Reload before saving.'; END IF;
 END LOOP;
 IF p_patch?'first_name' AND length(trim(coalesce(p_patch->>'first_name','')))=0 OR p_patch?'last_name' AND length(trim(coalesce(p_patch->>'last_name','')))=0 THEN RAISE EXCEPTION 'Legal name required'; END IF;
 IF p_patch?'phone' AND EXISTS(SELECT 1 FROM auth.users WHERE id=uid AND coalesce(phone,'')<>'') THEN RAISE EXCEPTION 'Login phone requires verified identity change'; END IF;
 IF p_patch?'phone' AND coalesce(p_patch->>'phone','') !~ '^\+[0-9]{6,15}$' THEN RAISE EXCEPTION 'Valid international mobile required'; END IF;
 IF p_patch?'date_of_birth' AND (p_patch->>'date_of_birth')::date>current_date THEN RAISE EXCEPTION 'Invalid birthday'; END IF;
 IF p_patch?'gender' AND coalesce(p_patch->>'gender','') NOT IN ('male','female','prefer_not_to_say') THEN RAISE EXCEPTION 'Invalid gender'; END IF;
 UPDATE job_seeker_profiles SET first_name=CASE WHEN p_patch?'first_name' THEN p_patch->>'first_name' ELSE first_name END,last_name=CASE WHEN p_patch?'last_name' THEN p_patch->>'last_name' ELSE last_name END,phone=CASE WHEN p_patch?'phone' THEN p_patch->>'phone' ELSE phone END,country=CASE WHEN p_patch?'country' THEN p_patch->>'country' ELSE country END,city=CASE WHEN p_patch?'city' THEN p_patch->>'city' ELSE city END,date_of_birth=CASE WHEN p_patch?'date_of_birth' THEN (p_patch->>'date_of_birth')::date ELSE date_of_birth END,gender=CASE WHEN p_patch?'gender' THEN p_patch->>'gender' ELSE gender END,updated_at=clock_timestamp() WHERE user_id=uid;
 UPDATE job_seeker_profiles SET full_name=CASE WHEN p_patch?'first_name' OR p_patch?'last_name' THEN trim(concat_ws(' ',first_name,last_name)) ELSE full_name END,location=CASE WHEN p_patch?'country' OR p_patch?'city' THEN concat_ws(', ',city,country) ELSE location END WHERE user_id=uid AND (p_patch?'first_name' OR p_patch?'last_name' OR p_patch?'country' OR p_patch?'city');
 RETURN (SELECT to_jsonb(p) FROM job_seeker_profiles p WHERE user_id=uid);
END $$;
CREATE OR REPLACE FUNCTION public.save_profile_section(p_section text,p_items jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF auth.uid() IS NULL OR p_section NOT IN ('certificates','languages') OR jsonb_typeof(p_items)<>'array' THEN RAISE EXCEPTION 'Invalid profile section'; END IF; UPDATE job_seeker_profiles SET professional_details=jsonb_set(professional_details,ARRAY[p_section],p_items),updated_at=clock_timestamp() WHERE user_id=auth.uid(); IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.attach_profile_cv(p_path text,p_name text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE stamp timestamptz; BEGIN IF auth.uid() IS NULL OR split_part(p_path,'/',1)<>auth.uid()::text OR length(trim(p_name))=0 THEN RAISE EXCEPTION 'Invalid CV owner'; END IF; SELECT updated_at INTO stamp FROM storage.objects WHERE bucket_id='cvs' AND name=p_path; IF stamp IS NULL THEN RAISE EXCEPTION 'Uploaded CV not found'; END IF; UPDATE job_seeker_profiles SET cv_url=p_path,cv_file_name=p_name,cv_updated_at=stamp,resume_extract=coalesce(resume_extract,'{}'::jsonb)||jsonb_build_object('fileName',p_name,'cvUrl',p_path),updated_at=clock_timestamp() WHERE user_id=auth.uid(); IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF; RETURN (SELECT to_jsonb(p) FROM job_seeker_profiles p WHERE user_id=auth.uid()); END $$;
REVOKE ALL ON FUNCTION public.update_mobile_personal(jsonb,jsonb),public.save_profile_section(text,jsonb),public.attach_profile_cv(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.update_mobile_personal(jsonb,jsonb),public.save_profile_section(text,jsonb),public.attach_profile_cv(text,text) TO authenticated;
COMMIT;
