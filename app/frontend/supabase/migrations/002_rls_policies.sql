-- MatchMe RLS Policies
-- Row Level Security for all tables

BEGIN;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- user_profiles policies
-- ============================================================
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- job_seeker_profiles policies
-- ============================================================
CREATE POLICY "Seekers can read own profile"
  ON job_seeker_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can read seeker profiles for matches"
  ON job_seeker_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'company'
    )
  );

CREATE POLICY "Seekers can insert own profile"
  ON job_seeker_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Seekers can update own profile"
  ON job_seeker_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- company_profiles policies
-- ============================================================
CREATE POLICY "Anyone authenticated can read company profiles"
  ON company_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Companies can insert own profile"
  ON company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can update own profile"
  ON company_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- vacancies policies
-- ============================================================
CREATE POLICY "Anyone authenticated can read open vacancies"
  ON vacancies FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (status = 'open' OR company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Companies can insert own vacancies"
  ON vacancies FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update own vacancies"
  ON vacancies FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can delete own vacancies"
  ON vacancies FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- matches policies
-- ============================================================
CREATE POLICY "Users can read own matches"
  ON matches FOR SELECT
  USING (auth.uid() = job_seeker_id OR auth.uid() = company_id);

CREATE POLICY "System can insert matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = job_seeker_id OR auth.uid() = company_id);

CREATE POLICY "Users can update own match status"
  ON matches FOR UPDATE
  USING (auth.uid() = job_seeker_id OR auth.uid() = company_id);

-- ============================================================
-- messages policies
-- ============================================================
CREATE POLICY "Users can read messages in their matches"
  ON messages FOR SELECT
  USING (
    match_id IN (
      SELECT id FROM matches
      WHERE job_seeker_id = auth.uid() OR company_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND match_id IN (
      SELECT id FROM matches
      WHERE job_seeker_id = auth.uid() OR company_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    match_id IN (
      SELECT id FROM matches
      WHERE job_seeker_id = auth.uid() OR company_id = auth.uid()
    )
  );

-- ============================================================
-- subscriptions policies
-- ============================================================
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- notifications policies
-- ============================================================
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

COMMIT;