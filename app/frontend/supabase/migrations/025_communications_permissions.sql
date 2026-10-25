BEGIN;
CREATE FUNCTION public.application_conversation_access(p_conversation uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM app_91d3436dfc_conversations c JOIN vacancies v ON v.id=c.vacancy_id JOIN company_profiles co ON co.id=v.company_id WHERE c.id=p_conversation AND auth.uid() IS NOT NULL AND (auth.uid()=c.seeker_id OR (auth.uid()=c.company_user_id AND co.user_id=c.company_user_id)));
$$;
CREATE FUNCTION public.application_conversation_eligible(p_conversation uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT application_conversation_access(p_conversation) AND EXISTS(SELECT 1 FROM app_91d3436dfc_conversations c JOIN vacancies v ON v.id=c.vacancy_id JOIN company_profiles co ON co.id=v.company_id JOIN seeker_job_actions a ON a.vacancy_id=v.id AND a.user_id=c.seeker_id WHERE c.id=p_conversation AND NOT c.closed AND co.user_id=c.company_user_id AND a.direction='right' AND a.application_status='pending' AND coalesce(a.company_status,'pending') NOT IN('rejected','hired') AND v.status='open' AND (v.expiration_date IS NULL OR v.expiration_date>now()));
$$;
DROP POLICY participant_read ON app_91d3436dfc_conversations;
CREATE POLICY participant_read ON app_91d3436dfc_conversations FOR SELECT TO authenticated USING(application_conversation_access(id));
DROP POLICY participant_read ON app_91d3436dfc_messages;
CREATE POLICY participant_read ON app_91d3436dfc_messages FOR SELECT TO authenticated USING(application_conversation_access(conversation_id));
DROP POLICY participant_read ON app_91d3436dfc_interviews;
CREATE POLICY participant_read ON app_91d3436dfc_interviews FOR SELECT TO authenticated USING(application_conversation_access(conversation_id));
CREATE OR REPLACE FUNCTION public.send_application_message(p_conversation uuid,p_content text,p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c app_91d3436dfc_conversations; prior app_91d3436dfc_messages; result uuid; peer uuid;
BEGIN
 SELECT * INTO c FROM app_91d3436dfc_conversations WHERE id=p_conversation FOR UPDATE;
 IF c.id IS NULL OR NOT application_conversation_access(c.id) THEN RAISE EXCEPTION 'Conversation access denied'; END IF;
 IF p_request IS NULL OR p_content IS NULL OR length(trim(p_content)) NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'Invalid message'; END IF;
 SELECT * INTO prior FROM app_91d3436dfc_messages WHERE sender_id=auth.uid() AND request_key=p_request;
 IF prior.id IS NOT NULL THEN
  IF prior.conversation_id<>c.id OR prior.content<>trim(p_content) THEN RAISE EXCEPTION 'Message retry does not match the original request'; END IF;
  RETURN prior.id;
 END IF;
 IF NOT application_conversation_eligible(c.id) THEN RAISE EXCEPTION 'This conversation is closed'; END IF;
 IF auth.uid()=c.seeker_id AND c.first_contact_at IS NULL THEN RAISE EXCEPTION 'Wait for the Company to contact you first'; END IF;
 INSERT INTO app_91d3436dfc_messages(conversation_id,sender_id,content,request_key) VALUES(c.id,auth.uid(),trim(p_content),p_request) RETURNING id INTO result;
 IF auth.uid()=c.company_user_id AND c.first_contact_at IS NULL THEN UPDATE app_91d3436dfc_conversations SET first_contact_at=now() WHERE id=c.id; END IF;
 peer:=CASE WHEN auth.uid()=c.seeker_id THEN c.company_user_id ELSE c.seeker_id END;
 INSERT INTO app_91d3436dfc_notifications(user_id,event,title,body,action_url) VALUES(peer,'message','New message',left(trim(p_content),200),'/messages?conversation='||c.id);
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.get_application_conversations() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM(SELECT c.*,v.job_title,co.company_name,CASE WHEN auth.uid()=c.seeker_id THEN co.company_name ELSE coalesce(s.full_name,'Applicant') END AS participant_name,
 a.application_status,a.company_status,NOT application_conversation_eligible(c.id) AS unavailable,
 (SELECT content FROM app_91d3436dfc_messages m WHERE m.conversation_id=c.id ORDER BY created_at DESC,id DESC LIMIT 1) AS last_message,
 (SELECT count(*) FROM app_91d3436dfc_messages m WHERE m.conversation_id=c.id AND m.sender_id<>auth.uid() AND m.read_at IS NULL) AS unread_count
 FROM app_91d3436dfc_conversations c JOIN vacancies v ON v.id=c.vacancy_id JOIN company_profiles co ON co.id=v.company_id JOIN seeker_job_actions a ON a.vacancy_id=c.vacancy_id AND a.user_id=c.seeker_id LEFT JOIN job_seeker_profiles s ON s.user_id=c.seeker_id
 WHERE application_conversation_access(c.id) ORDER BY c.created_at DESC,c.id DESC) r;
$$;
CREATE OR REPLACE FUNCTION public.read_application_messages(p_conversation uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT application_conversation_access(p_conversation) THEN RAISE EXCEPTION 'Access denied';END IF; UPDATE app_91d3436dfc_messages SET read_at=coalesce(read_at,now()) WHERE conversation_id=p_conversation AND sender_id<>auth.uid(); END $$;
CREATE OR REPLACE FUNCTION public.close_application_conversation(p_conversation uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT application_conversation_access(p_conversation) THEN RAISE EXCEPTION 'Access denied';END IF; UPDATE app_91d3436dfc_conversations SET closed=true WHERE id=p_conversation; END $$;
CREATE OR REPLACE FUNCTION public.schedule_application_interview(p_conversation uuid,p_start timestamptz,p_minutes integer,p_location text,p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c app_91d3436dfc_conversations; prior app_91d3436dfc_interviews; result uuid;
BEGIN
 SELECT * INTO c FROM app_91d3436dfc_conversations WHERE id=p_conversation FOR UPDATE;
 IF c.id IS NULL OR NOT application_conversation_access(c.id) OR auth.uid()<>c.company_user_id THEN RAISE EXCEPTION 'Only the applicant Company can schedule';END IF;
 IF p_request IS NULL OR p_start IS NULL OR p_minutes IS NULL OR p_minutes NOT BETWEEN 15 AND 480 OR p_location IS NULL OR length(trim(p_location)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid interview';END IF;
 SELECT * INTO prior FROM app_91d3436dfc_interviews WHERE request_key=p_request;
 IF prior.id IS NOT NULL THEN
  IF prior.conversation_id<>c.id OR prior.starts_at<>p_start OR prior.duration_minutes<>p_minutes OR prior.location<>trim(p_location) THEN RAISE EXCEPTION 'Interview retry does not match the original request';END IF;
  RETURN prior.id;
 END IF;
 IF NOT application_conversation_eligible(c.id) OR c.first_contact_at IS NULL THEN RAISE EXCEPTION 'An active contacted application is required';END IF;
 IF p_start<=now() THEN RAISE EXCEPTION 'Choose a future interview time';END IF;
 PERFORM review_company_application(c.vacancy_id,c.seeker_id,'interview_scheduled');
 INSERT INTO app_91d3436dfc_interviews(conversation_id,starts_at,duration_minutes,location,request_key) VALUES(c.id,p_start,p_minutes,trim(p_location),p_request) RETURNING id INTO result;
 INSERT INTO app_91d3436dfc_notifications(user_id,event,title,body,action_url) VALUES(c.seeker_id,'interview','Interview invitation',p_start::text||' · '||trim(p_location),'/messages?conversation='||c.id);RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.respond_application_interview(p_interview uuid,p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i app_91d3436dfc_interviews; c app_91d3436dfc_conversations; peer uuid;
BEGIN
 SELECT * INTO i FROM app_91d3436dfc_interviews WHERE id=p_interview FOR UPDATE;
 SELECT * INTO c FROM app_91d3436dfc_conversations WHERE id=i.conversation_id;
 IF i.id IS NULL OR NOT application_conversation_access(c.id) OR p_status IS NULL OR NOT ((auth.uid()=c.seeker_id AND p_status IN('accepted','declined')) OR (auth.uid()=c.company_user_id AND p_status='cancelled')) THEN RAISE EXCEPTION 'Interview response not permitted';END IF;
 IF i.status=p_status THEN RETURN;END IF;
 IF auth.uid()=c.seeker_id AND (i.status<>'invited' OR i.starts_at<=now() OR NOT application_conversation_eligible(c.id)) THEN RAISE EXCEPTION 'This invitation is no longer active';END IF;
 IF auth.uid()=c.company_user_id AND i.status NOT IN('invited','accepted') THEN RAISE EXCEPTION 'This invitation cannot be cancelled';END IF;
 UPDATE app_91d3436dfc_interviews SET status=p_status WHERE id=i.id;
 peer:=CASE WHEN auth.uid()=c.seeker_id THEN c.company_user_id ELSE c.seeker_id END;
 INSERT INTO app_91d3436dfc_notifications(user_id,event,title,body,action_url) VALUES(peer,'interview','Interview update',p_status||' · '||i.starts_at::text,'/messages?conversation='||c.id);
END $$;
REVOKE ALL ON FUNCTION application_conversation_access(uuid),application_conversation_eligible(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION application_conversation_access(uuid),application_conversation_eligible(uuid) TO authenticated;
COMMIT;
