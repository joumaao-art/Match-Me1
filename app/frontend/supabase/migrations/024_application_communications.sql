BEGIN;
CREATE TABLE public.app_91d3436dfc_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vacancy_id uuid NOT NULL REFERENCES vacancies(id), seeker_id uuid NOT NULL, company_user_id uuid NOT NULL,
 first_contact_at timestamptz, closed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(vacancy_id,seeker_id), FOREIGN KEY(seeker_id,vacancy_id) REFERENCES seeker_job_actions(user_id,vacancy_id)
);
CREATE TABLE public.app_91d3436dfc_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES app_91d3436dfc_conversations(id), sender_id uuid NOT NULL,
 content text NOT NULL CHECK(length(trim(content)) BETWEEN 1 AND 5000), request_key uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), read_at timestamptz,
 UNIQUE(sender_id,request_key)
);
CREATE TABLE public.app_91d3436dfc_interviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES app_91d3436dfc_conversations(id), starts_at timestamptz NOT NULL,
 duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 15 AND 480), location text NOT NULL CHECK(length(trim(location)) BETWEEN 1 AND 500),
 status text NOT NULL DEFAULT 'invited' CHECK(status IN('invited','accepted','declined','cancelled')), request_key uuid NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.app_91d3436dfc_notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, event text NOT NULL CHECK(event IN('message','interview','application','subscription','admin_notice','new_match','company_invite','job_expiry')),
 title text NOT NULL, body text NOT NULL, action_url text, status text NOT NULL DEFAULT 'unread' CHECK(status IN('unread','read','archived','dismissed')), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app_91d3436dfc_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_91d3436dfc_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_91d3436dfc_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_91d3436dfc_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY participant_read ON app_91d3436dfc_conversations FOR SELECT TO authenticated USING(auth.uid() IN(seeker_id,company_user_id));
CREATE POLICY participant_read ON app_91d3436dfc_messages FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM app_91d3436dfc_conversations c WHERE c.id=conversation_id AND auth.uid() IN(c.seeker_id,c.company_user_id)));
CREATE POLICY participant_read ON app_91d3436dfc_interviews FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM app_91d3436dfc_conversations c WHERE c.id=conversation_id AND auth.uid() IN(c.seeker_id,c.company_user_id)));
CREATE POLICY owner_read ON app_91d3436dfc_notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY owner_update ON app_91d3436dfc_notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY owner_delete ON app_91d3436dfc_notifications FOR DELETE TO authenticated USING(user_id=auth.uid());
REVOKE ALL ON app_91d3436dfc_conversations,app_91d3436dfc_messages,app_91d3436dfc_interviews,app_91d3436dfc_notifications FROM anon,authenticated;
GRANT SELECT ON app_91d3436dfc_conversations,app_91d3436dfc_messages,app_91d3436dfc_interviews,app_91d3436dfc_notifications TO authenticated;
GRANT UPDATE(status),DELETE ON app_91d3436dfc_notifications TO authenticated;
CREATE INDEX ON app_91d3436dfc_messages(conversation_id,created_at);
CREATE INDEX ON app_91d3436dfc_notifications(user_id,created_at DESC);

CREATE FUNCTION public.start_application_conversation(p_vacancy uuid,p_seeker uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result uuid; owner_id uuid;
BEGIN
 SELECT c.user_id INTO owner_id FROM vacancies v JOIN company_profiles c ON c.id=v.company_id JOIN seeker_job_actions a ON a.vacancy_id=v.id AND a.user_id=p_seeker
 WHERE v.id=p_vacancy AND c.user_id=auth.uid() AND a.direction='right' AND a.application_status='pending' AND coalesce(a.company_status,'pending') NOT IN('rejected','hired') AND v.status='open' AND (v.expiration_date IS NULL OR v.expiration_date>now());
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Only the owning Company can contact an eligible applicant'; END IF;
 INSERT INTO app_91d3436dfc_conversations(vacancy_id,seeker_id,company_user_id) VALUES(p_vacancy,p_seeker,owner_id) ON CONFLICT(vacancy_id,seeker_id) DO NOTHING;
 SELECT id INTO result FROM app_91d3436dfc_conversations WHERE vacancy_id=p_vacancy AND seeker_id=p_seeker;
 RETURN result;
END $$;
CREATE FUNCTION public.send_application_message(p_conversation uuid,p_content text,p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c app_91d3436dfc_conversations; result uuid; peer uuid;
BEGIN
 SELECT * INTO STRICT c FROM app_91d3436dfc_conversations WHERE id=p_conversation FOR UPDATE;
 IF auth.uid() IS NULL OR auth.uid() NOT IN(c.seeker_id,c.company_user_id) THEN RAISE EXCEPTION 'Conversation access denied'; END IF;
 SELECT id INTO result FROM app_91d3436dfc_messages WHERE sender_id=auth.uid() AND request_key=p_request AND conversation_id=p_conversation;
 IF result IS NOT NULL THEN RETURN result; END IF;
 IF c.closed OR NOT EXISTS(SELECT 1 FROM seeker_job_actions a JOIN vacancies v ON v.id=a.vacancy_id WHERE a.user_id=c.seeker_id AND a.vacancy_id=c.vacancy_id AND a.application_status='pending' AND coalesce(a.company_status,'pending') NOT IN('rejected','hired') AND v.status='open' AND (v.expiration_date IS NULL OR v.expiration_date>now())) THEN RAISE EXCEPTION 'This conversation is closed'; END IF;
 IF auth.uid()=c.seeker_id AND c.first_contact_at IS NULL THEN RAISE EXCEPTION 'Wait for the Company to contact you first'; END IF;
 IF p_request IS NULL OR length(trim(p_content)) NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'Invalid message'; END IF;
 INSERT INTO app_91d3436dfc_messages(conversation_id,sender_id,content,request_key) VALUES(c.id,auth.uid(),trim(p_content),p_request) RETURNING id INTO result;
 IF auth.uid()=c.company_user_id AND c.first_contact_at IS NULL THEN UPDATE app_91d3436dfc_conversations SET first_contact_at=now() WHERE id=c.id; END IF;
 peer:=CASE WHEN auth.uid()=c.seeker_id THEN c.company_user_id ELSE c.seeker_id END;
 INSERT INTO app_91d3436dfc_notifications(user_id,event,title,body,action_url) VALUES(peer,'message','New message',left(trim(p_content),200),'/messages?conversation='||c.id);
 RETURN result;
END $$;
CREATE FUNCTION public.get_application_conversations() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM(SELECT c.*,v.job_title,co.company_name,CASE WHEN auth.uid()=c.seeker_id THEN co.company_name ELSE coalesce(s.full_name,'Applicant') END AS participant_name,
 a.application_status,a.company_status,(c.closed OR a.application_status<>'pending' OR coalesce(a.company_status,'pending') IN('rejected','hired') OR v.status<>'open' OR (v.expiration_date IS NOT NULL AND v.expiration_date<=now())) AS unavailable,
 (SELECT content FROM app_91d3436dfc_messages m WHERE m.conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
 (SELECT count(*) FROM app_91d3436dfc_messages m WHERE m.conversation_id=c.id AND m.sender_id<>auth.uid() AND m.read_at IS NULL) AS unread_count
 FROM app_91d3436dfc_conversations c JOIN vacancies v ON v.id=c.vacancy_id JOIN company_profiles co ON co.id=v.company_id JOIN seeker_job_actions a ON a.vacancy_id=c.vacancy_id AND a.user_id=c.seeker_id LEFT JOIN job_seeker_profiles s ON s.user_id=c.seeker_id
 WHERE auth.uid() IN(c.seeker_id,c.company_user_id) ORDER BY c.created_at DESC) r;
$$;
CREATE FUNCTION public.read_application_messages(p_conversation uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT EXISTS(SELECT 1 FROM app_91d3436dfc_conversations WHERE id=p_conversation AND auth.uid() IN(seeker_id,company_user_id)) THEN RAISE EXCEPTION 'Access denied';END IF; UPDATE app_91d3436dfc_messages SET read_at=coalesce(read_at,now()) WHERE conversation_id=p_conversation AND sender_id<>auth.uid(); END $$;
CREATE FUNCTION public.close_application_conversation(p_conversation uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE app_91d3436dfc_conversations SET closed=true WHERE id=p_conversation AND auth.uid() IN(seeker_id,company_user_id);IF NOT FOUND THEN RAISE EXCEPTION 'Access denied';END IF;END $$;
CREATE FUNCTION public.schedule_application_interview(p_conversation uuid,p_start timestamptz,p_minutes integer,p_location text,p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c app_91d3436dfc_conversations; result uuid;
BEGIN SELECT * INTO STRICT c FROM app_91d3436dfc_conversations WHERE id=p_conversation FOR UPDATE;
 IF auth.uid()<>c.company_user_id OR auth.uid() IS NULL OR c.closed OR c.first_contact_at IS NULL THEN RAISE EXCEPTION 'Only the contacted applicant Company can schedule';END IF;
 SELECT id INTO result FROM app_91d3436dfc_interviews WHERE request_key=p_request AND conversation_id=c.id;IF result IS NOT NULL THEN RETURN result;END IF;
 IF p_start<=now() THEN RAISE EXCEPTION 'Choose a future interview time';END IF;
 PERFORM review_company_application(c.vacancy_id,c.seeker_id,'interview_scheduled');
 INSERT INTO app_91d3436dfc_interviews(conversation_id,starts_at,duration_minutes,location,request_key) VALUES(c.id,p_start,p_minutes,trim(p_location),p_request) RETURNING id INTO result;
 INSERT INTO app_91d3436dfc_notifications(user_id,event,title,body,action_url) VALUES(c.seeker_id,'interview','Interview invitation',p_start::text||' · '||p_location,'/messages?conversation='||c.id);RETURN result;
END $$;
CREATE FUNCTION public.respond_application_interview(p_interview uuid,p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN UPDATE app_91d3436dfc_interviews i SET status=p_status FROM app_91d3436dfc_conversations c WHERE i.id=p_interview AND c.id=i.conversation_id AND ((auth.uid()=c.seeker_id AND p_status IN('accepted','declined') AND i.status='invited') OR(auth.uid()=c.company_user_id AND p_status='cancelled' AND i.status IN('invited','accepted')));IF NOT FOUND THEN RAISE EXCEPTION 'Interview response not permitted';END IF;END $$;
CREATE FUNCTION public.notify_application_stage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NEW.company_status IS DISTINCT FROM OLD.company_status THEN INSERT INTO app_91d3436dfc_notifications(user_id,event,title,body,action_url) VALUES(NEW.user_id,'application','Application update',(SELECT job_title FROM vacancies WHERE id=NEW.vacancy_id)||' · '||NEW.company_status,'/seeker?view=applications');END IF;RETURN NEW;END $$;
CREATE TRIGGER application_stage_notification AFTER UPDATE OF company_status ON seeker_job_actions FOR EACH ROW EXECUTE FUNCTION notify_application_stage();
REVOKE ALL ON FUNCTION start_application_conversation(uuid,uuid),send_application_message(uuid,text,uuid),get_application_conversations(),read_application_messages(uuid),close_application_conversation(uuid),schedule_application_interview(uuid,timestamptz,integer,text,uuid),respond_application_interview(uuid,text),notify_application_stage() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION start_application_conversation(uuid,uuid),send_application_message(uuid,text,uuid),get_application_conversations(),read_application_messages(uuid),close_application_conversation(uuid),schedule_application_interview(uuid,timestamptz,integer,text,uuid),respond_application_interview(uuid,text) TO authenticated;
COMMIT;
