-- ============================================================
-- MatchMe Realtime & Seed Data
-- Enable realtime on key tables and seed reference data
-- ============================================================

BEGIN;

-- ============================================================
-- REALTIME: Enable for interactive tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE matches_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================================
-- SEED: Languages
-- ============================================================
INSERT INTO languages (code, name, native_name) VALUES
  ('en', 'English', 'English'),
  ('ar', 'Arabic', 'العربية'),
  ('fr', 'French', 'Français'),
  ('es', 'Spanish', 'Español'),
  ('de', 'German', 'Deutsch'),
  ('zh', 'Chinese', '中文'),
  ('hi', 'Hindi', 'हिन्दी'),
  ('pt', 'Portuguese', 'Português'),
  ('ru', 'Russian', 'Русский'),
  ('ja', 'Japanese', '日本語'),
  ('ko', 'Korean', '한국어'),
  ('it', 'Italian', 'Italiano'),
  ('nl', 'Dutch', 'Nederlands'),
  ('tr', 'Turkish', 'Türkçe'),
  ('ur', 'Urdu', 'اردو'),
  ('fa', 'Persian', 'فارسی'),
  ('pl', 'Polish', 'Polski'),
  ('sv', 'Swedish', 'Svenska'),
  ('th', 'Thai', 'ไทย'),
  ('vi', 'Vietnamese', 'Tiếng Việt')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED: Common Skills
-- ============================================================
INSERT INTO skills (name, category, is_verified) VALUES
  -- Technical
  ('JavaScript', 'Programming', TRUE),
  ('TypeScript', 'Programming', TRUE),
  ('Python', 'Programming', TRUE),
  ('Java', 'Programming', TRUE),
  ('C#', 'Programming', TRUE),
  ('React', 'Frontend', TRUE),
  ('Angular', 'Frontend', TRUE),
  ('Vue.js', 'Frontend', TRUE),
  ('Node.js', 'Backend', TRUE),
  ('PostgreSQL', 'Database', TRUE),
  ('MongoDB', 'Database', TRUE),
  ('AWS', 'Cloud', TRUE),
  ('Docker', 'DevOps', TRUE),
  ('Kubernetes', 'DevOps', TRUE),
  ('Git', 'Tools', TRUE),
  ('REST API', 'Architecture', TRUE),
  ('GraphQL', 'Architecture', TRUE),
  ('Machine Learning', 'AI/ML', TRUE),
  ('Data Analysis', 'Data', TRUE),
  ('SQL', 'Database', TRUE),
  -- Business
  ('Project Management', 'Management', TRUE),
  ('Agile/Scrum', 'Methodology', TRUE),
  ('Leadership', 'Soft Skills', TRUE),
  ('Communication', 'Soft Skills', TRUE),
  ('Problem Solving', 'Soft Skills', TRUE),
  ('Teamwork', 'Soft Skills', TRUE),
  ('Critical Thinking', 'Soft Skills', TRUE),
  ('Marketing', 'Business', TRUE),
  ('Sales', 'Business', TRUE),
  ('Finance', 'Business', TRUE),
  ('Accounting', 'Business', TRUE),
  ('Human Resources', 'Business', TRUE),
  ('Customer Service', 'Business', TRUE),
  ('Business Development', 'Business', TRUE),
  ('Strategic Planning', 'Business', TRUE),
  -- Design
  ('UI/UX Design', 'Design', TRUE),
  ('Figma', 'Design', TRUE),
  ('Adobe Photoshop', 'Design', TRUE),
  ('Adobe Illustrator', 'Design', TRUE),
  ('Graphic Design', 'Design', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED: Subscription Plans
-- ============================================================
INSERT INTO subscription_plans (name, slug, description, target_role, price_monthly, price_yearly, features, limits, is_active, is_popular, sort_order) VALUES
  (
    'Free',
    'seeker-free',
    'Get started with basic job search',
    'job_seeker',
    0, 0,
    '["5 swipes per day", "Basic profile", "View job listings", "1 resume upload"]'::jsonb,
    '{"daily_swipes": 5, "resumes": 1, "saved_jobs": 10}'::jsonb,
    TRUE, FALSE, 1
  ),
  (
    'Premium',
    'seeker-premium',
    'Unlock unlimited job matching',
    'job_seeker',
    29.99, 24.99,
    '["Unlimited swipes", "Priority matching", "See who viewed you", "5 resume uploads", "Advanced filters", "Read receipts"]'::jsonb,
    '{"daily_swipes": -1, "resumes": 5, "saved_jobs": -1}'::jsonb,
    TRUE, TRUE, 2
  ),
  (
    'Starter',
    'company-starter',
    'Start hiring with basic tools',
    'company',
    0, 0,
    '["3 job postings", "Basic candidate search", "Standard support", "Company profile"]'::jsonb,
    '{"job_postings": 3, "candidate_views": 20, "team_members": 1}'::jsonb,
    TRUE, FALSE, 1
  ),
  (
    'Business',
    'company-business',
    'Scale your hiring with advanced features',
    'company',
    99.99, 83.33,
    '["Unlimited job postings", "Advanced candidate search", "Priority support", "Team collaboration", "Analytics dashboard", "Bulk messaging"]'::jsonb,
    '{"job_postings": -1, "candidate_views": -1, "team_members": 5}'::jsonb,
    TRUE, TRUE, 2
  ),
  (
    'Enterprise',
    'company-enterprise',
    'Custom solutions for large organizations',
    'company',
    299.99, 249.99,
    '["Everything in Business", "Dedicated account manager", "Custom integrations", "API access", "White-label options", "SLA guarantee", "Unlimited team members"]'::jsonb,
    '{"job_postings": -1, "candidate_views": -1, "team_members": -1}'::jsonb,
    TRUE, FALSE, 3
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FUNCTION: Auto-create conversation on mutual match
-- ============================================================
CREATE OR REPLACE FUNCTION create_conversation_on_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'mutual' AND OLD.status != 'mutual' THEN
    INSERT INTO conversations (match_id, participant_1, participant_2, last_message_at)
    VALUES (NEW.id, NEW.seeker_id, NEW.company_user_id, NOW())
    ON CONFLICT (match_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_mutual
  AFTER UPDATE ON matches_v2
  FOR EACH ROW
  WHEN (NEW.status = 'mutual')
  EXECUTE FUNCTION create_conversation_on_match();

-- ============================================================
-- FUNCTION: Update conversation last_message_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at, last_message_id = NEW.id, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages_v2
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- FUNCTION: Increment job application count
-- ============================================================
CREATE OR REPLACE FUNCTION increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_application
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION increment_application_count();

-- ============================================================
-- FUNCTION: Generate invoice number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO v_seq
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || v_year || '-%';
  
  NEW.invoice_number := 'INV-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================================
-- FUNCTION: Audit trail trigger (generic)
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_action audit_action;
  v_changed TEXT[];
  v_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_new := to_jsonb(NEW);
    INSERT INTO audit_trails (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), v_action, TG_TABLE_NAME, NEW.id::TEXT, v_new);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- Find changed fields
    FOR v_key IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_old->v_key IS DISTINCT FROM v_new->v_key THEN
        v_changed := array_append(v_changed, v_key);
      END IF;
    END LOOP;
    IF array_length(v_changed, 1) > 0 THEN
      INSERT INTO audit_trails (user_id, action, table_name, record_id, old_data, new_data, changed_fields)
      VALUES (auth.uid(), v_action, TG_TABLE_NAME, NEW.id::TEXT, v_old, v_new, v_changed);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old := to_jsonb(OLD);
    INSERT INTO audit_trails (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), v_action, TG_TABLE_NAME, OLD.id::TEXT, v_old);
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_applications AFTER INSERT OR UPDATE OR DELETE ON applications FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_user_subscriptions AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

COMMIT;