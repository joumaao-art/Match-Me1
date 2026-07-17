-- MatchMe Admin Role Support
-- Adds admin role and admin-specific policies

BEGIN;

-- Add admin to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Create admin_users table for separate admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Admin',
  permissions JSONB DEFAULT '["all"]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- RLS for admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin table"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update own record"
  ON admin_users FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role from database
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check admin first
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_user_id AND is_active = TRUE) THEN
    RETURN 'admin';
  END IF;

  -- Check user_profiles
  SELECT role::TEXT INTO v_role FROM user_profiles WHERE user_id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for viewing all data
CREATE POLICY "Admins can read all user profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Admins can read all seeker profiles"
  ON job_seeker_profiles FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = TRUE)
  );

CREATE POLICY "Admins can manage all vacancies"
  ON vacancies FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = TRUE)
  );

-- Update updated_at trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;