-- ============================================================
-- MatchMe Production RLS Policies
-- Row Level Security for all production tables
-- ============================================================

BEGIN;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: Admin check function
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (is_admin_user());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- JOB SEEKERS
-- ============================================================
CREATE POLICY "seekers_select_own" ON job_seekers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "seekers_select_companies" ON job_seekers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('company', 'admin'))
);
CREATE POLICY "seekers_insert_own" ON job_seekers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "seekers_update_own" ON job_seekers FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE POLICY "companies_select_all" ON companies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "companies_insert_own" ON companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companies_update_own" ON companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "companies_update_admin" ON companies FOR UPDATE USING (is_admin_user());

-- ============================================================
-- COMPANY BRANCHES
-- ============================================================
CREATE POLICY "branches_select_all" ON company_branches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "branches_insert_company" ON company_branches FOR INSERT WITH CHECK (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "branches_update_company" ON company_branches FOR UPDATE USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "branches_delete_company" ON company_branches FOR DELETE USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);

-- ============================================================
-- RECRUITERS
-- ============================================================
CREATE POLICY "recruiters_select_own" ON recruiters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recruiters_select_company" ON recruiters FOR SELECT USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "recruiters_select_admin" ON recruiters FOR SELECT USING (is_admin_user());
CREATE POLICY "recruiters_insert_own" ON recruiters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recruiters_update_own" ON recruiters FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- SKILLS (public read, admin write)
-- ============================================================
CREATE POLICY "skills_select_all" ON skills FOR SELECT USING (TRUE);
CREATE POLICY "skills_insert_auth" ON skills FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "skills_update_admin" ON skills FOR UPDATE USING (is_admin_user());

-- ============================================================
-- USER SKILLS
-- ============================================================
CREATE POLICY "user_skills_select_own" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_skills_select_companies" ON user_skills FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('company', 'admin'))
);
CREATE POLICY "user_skills_insert_own" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_skills_update_own" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_skills_delete_own" ON user_skills FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- LANGUAGES (public read)
-- ============================================================
CREATE POLICY "languages_select_all" ON languages FOR SELECT USING (TRUE);
CREATE POLICY "languages_insert_admin" ON languages FOR INSERT WITH CHECK (is_admin_user());

-- ============================================================
-- USER LANGUAGES
-- ============================================================
CREATE POLICY "user_languages_select_own" ON user_languages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_languages_select_companies" ON user_languages FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('company', 'admin'))
);
CREATE POLICY "user_languages_insert_own" ON user_languages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_languages_update_own" ON user_languages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_languages_delete_own" ON user_languages FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- EDUCATION
-- ============================================================
CREATE POLICY "education_select_own" ON education FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "education_select_companies" ON education FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('company', 'admin'))
);
CREATE POLICY "education_insert_own" ON education FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "education_update_own" ON education FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "education_delete_own" ON education FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- EXPERIENCE
-- ============================================================
CREATE POLICY "experience_select_own" ON experience FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "experience_select_companies" ON experience FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('company', 'admin'))
);
CREATE POLICY "experience_insert_own" ON experience FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "experience_update_own" ON experience FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "experience_delete_own" ON experience FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE POLICY "certificates_select_own" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "certificates_select_companies" ON certificates FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('company', 'admin'))
);
CREATE POLICY "certificates_insert_own" ON certificates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "certificates_update_own" ON certificates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "certificates_delete_own" ON certificates FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RESUMES
-- ============================================================
CREATE POLICY "resumes_select_own" ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "resumes_select_matched_companies" ON resumes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matches_v2
    WHERE seeker_id = resumes.user_id
    AND company_user_id = auth.uid()
    AND status = 'mutual'
  )
);
CREATE POLICY "resumes_insert_own" ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_update_own" ON resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "resumes_delete_own" ON resumes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- JOBS
-- ============================================================
CREATE POLICY "jobs_select_open" ON jobs FOR SELECT USING (
  status = 'open' OR
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR
  is_admin_user()
);
CREATE POLICY "jobs_insert_company" ON jobs FOR INSERT WITH CHECK (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "jobs_update_company" ON jobs FOR UPDATE USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin_user()
);
CREATE POLICY "jobs_delete_company" ON jobs FOR DELETE USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()) OR is_admin_user()
);

-- ============================================================
-- SAVED JOBS
-- ============================================================
CREATE POLICY "saved_jobs_select_own" ON saved_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_jobs_insert_own" ON saved_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_jobs_delete_own" ON saved_jobs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE POLICY "applications_select_own" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "applications_select_company" ON applications FOR SELECT USING (
  job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);
CREATE POLICY "applications_select_admin" ON applications FOR SELECT USING (is_admin_user());
CREATE POLICY "applications_insert_own" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_update_own" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "applications_update_company" ON applications FOR UPDATE USING (
  job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);

-- ============================================================
-- SWIPE HISTORY
-- ============================================================
CREATE POLICY "swipe_select_own" ON swipe_history FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "swipe_insert_own" ON swipe_history FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- ============================================================
-- MATCHES V2
-- ============================================================
CREATE POLICY "matches_v2_select_own" ON matches_v2 FOR SELECT USING (
  auth.uid() = seeker_id OR auth.uid() = company_user_id
);
CREATE POLICY "matches_v2_select_admin" ON matches_v2 FOR SELECT USING (is_admin_user());
CREATE POLICY "matches_v2_insert_participant" ON matches_v2 FOR INSERT WITH CHECK (
  auth.uid() = seeker_id OR auth.uid() = company_user_id
);
CREATE POLICY "matches_v2_update_participant" ON matches_v2 FOR UPDATE USING (
  auth.uid() = seeker_id OR auth.uid() = company_user_id
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);
CREATE POLICY "conversations_update_participant" ON conversations FOR UPDATE USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

-- ============================================================
-- MESSAGES V2
-- ============================================================
CREATE POLICY "messages_v2_select_participant" ON messages_v2 FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);
CREATE POLICY "messages_v2_insert_sender" ON messages_v2 FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN (
    SELECT id FROM conversations WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);
CREATE POLICY "messages_v2_update_participant" ON messages_v2 FOR UPDATE USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
  )
);

-- ============================================================
-- NOTIFICATIONS V2
-- ============================================================
CREATE POLICY "notifications_v2_select_own" ON notifications_v2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_v2_update_own" ON notifications_v2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_v2_delete_own" ON notifications_v2 FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SUBSCRIPTION PLANS (public read)
-- ============================================================
CREATE POLICY "plans_select_all" ON subscription_plans FOR SELECT USING (TRUE);
CREATE POLICY "plans_manage_admin" ON subscription_plans FOR ALL USING (is_admin_user());

-- ============================================================
-- USER SUBSCRIPTIONS
-- ============================================================
CREATE POLICY "user_subs_select_own" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_subs_select_admin" ON user_subscriptions FOR SELECT USING (is_admin_user());
CREATE POLICY "user_subs_insert_own" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_subs_update_own" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_select_admin" ON payments FOR SELECT USING (is_admin_user());
CREATE POLICY "payments_insert_own" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE POLICY "invoices_select_own" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "invoices_select_admin" ON invoices FOR SELECT USING (is_admin_user());

-- ============================================================
-- ADMIN LOGS (admin only)
-- ============================================================
CREATE POLICY "admin_logs_select_admin" ON admin_logs FOR SELECT USING (is_admin_user());
CREATE POLICY "admin_logs_insert_admin" ON admin_logs FOR INSERT WITH CHECK (is_admin_user());

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE POLICY "activity_logs_select_own" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_select_admin" ON activity_logs FOR SELECT USING (is_admin_user());
CREATE POLICY "activity_logs_insert_own" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "reports_select_admin" ON reports FOR SELECT USING (is_admin_user());
CREATE POLICY "reports_insert_auth" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE USING (is_admin_user());

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
CREATE POLICY "tickets_select_own" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_select_admin" ON support_tickets FOR SELECT USING (is_admin_user());
CREATE POLICY "tickets_insert_auth" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_update_own" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tickets_update_admin" ON support_tickets FOR UPDATE USING (is_admin_user());

-- ============================================================
-- SUPPORT TICKET MESSAGES
-- ============================================================
CREATE POLICY "ticket_msgs_select_own" ON support_ticket_messages FOR SELECT USING (
  ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()) OR is_admin_user()
);
CREATE POLICY "ticket_msgs_insert_participant" ON support_ticket_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()) OR is_admin_user()
  )
);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================
CREATE POLICY "analytics_insert_auth" ON analytics_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "analytics_select_admin" ON analytics_events FOR SELECT USING (is_admin_user());
CREATE POLICY "analytics_select_own" ON analytics_events FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- ANALYTICS DAILY STATS (admin only read)
-- ============================================================
CREATE POLICY "analytics_daily_select_admin" ON analytics_daily_stats FOR SELECT USING (is_admin_user());
CREATE POLICY "analytics_daily_insert_admin" ON analytics_daily_stats FOR INSERT WITH CHECK (is_admin_user());

-- ============================================================
-- AUDIT TRAILS (admin only)
-- ============================================================
CREATE POLICY "audit_select_admin" ON audit_trails FOR SELECT USING (is_admin_user());
CREATE POLICY "audit_insert_system" ON audit_trails FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;