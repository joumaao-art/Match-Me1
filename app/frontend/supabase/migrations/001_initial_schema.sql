-- MatchMe Database Schema
-- Initial migration: Core tables, RLS policies, indexes, and functions

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('job_seeker', 'company');
CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'remote', 'internship');
CREATE TYPE vacancy_status AS ENUM ('open', 'closed', 'draft', 'scheduled');
CREATE TYPE seeker_match_status AS ENUM ('pending', 'interested', 'not_interested');
CREATE TYPE company_match_status AS ENUM ('pending', 'accepted', 'rejected', 'interview', 'offer', 'hired');
CREATE TYPE subscription_plan AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE company_type AS ENUM ('local', 'international');
CREATE TYPE language_proficiency AS ENUM ('basic', 'intermediate', 'fluent', 'native');

-- ============================================================
-- TABLE: user_profiles (base profile for all users)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role NOT NULL,
  avatar_url TEXT,
  display_name TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- ============================================================
-- TABLE: job_seeker_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  photo_url TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  middle_name TEXT,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  mobile TEXT,
  nationality TEXT,
  date_of_birth DATE,
  current_location TEXT,
  languages JSONB DEFAULT '[]'::jsonb,
  cv_url TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  work_experience JSONB DEFAULT '[]'::jsonb,
  key_skills TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT 'immediate',
  preferred_employment_type employment_type DEFAULT 'full-time',
  preferred_location TEXT,
  preferred_industry TEXT,
  preferred_company_size TEXT,
  expected_salary INTEGER,
  certificates TEXT[] DEFAULT '{}',
  accomplishments TEXT[] DEFAULT '{}',
  resume_score INTEGER DEFAULT 0,
  professional_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_seeker_profiles_user_id ON job_seeker_profiles(user_id);
CREATE INDEX idx_seeker_profiles_skills ON job_seeker_profiles USING GIN(key_skills);
CREATE INDEX idx_seeker_profiles_location ON job_seeker_profiles(current_location);

-- ============================================================
-- TABLE: company_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  industry TEXT,
  company_size TEXT,
  company_type company_type DEFAULT 'local',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX idx_company_profiles_industry ON company_profiles(industry);

-- ============================================================
-- TABLE: vacancies
-- ============================================================
CREATE TABLE IF NOT EXISTS vacancies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  job_title TEXT NOT NULL,
  employment_type employment_type DEFAULT 'full-time',
  job_description TEXT,
  country TEXT,
  city TEXT,
  required_skills TEXT[] DEFAULT '{}',
  min_experience INTEGER DEFAULT 0,
  max_experience INTEGER DEFAULT 0,
  education_level TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  benefits TEXT[] DEFAULT '{}',
  status vacancy_status DEFAULT 'draft',
  posting_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_vacancies_company_id ON vacancies(company_id);
CREATE INDEX idx_vacancies_status ON vacancies(status);
CREATE INDEX idx_vacancies_skills ON vacancies USING GIN(required_skills);
CREATE INDEX idx_vacancies_location ON vacancies(country, city);
CREATE INDEX idx_vacancies_created_at ON vacancies(created_at DESC);

-- ============================================================
-- TABLE: matches
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE NOT NULL,
  job_seeker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  compatibility_score INTEGER DEFAULT 0 CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  seeker_status seeker_match_status DEFAULT 'pending',
  company_status company_match_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(vacancy_id, job_seeker_id)
);

CREATE INDEX idx_matches_seeker ON matches(job_seeker_id);
CREATE INDEX idx_matches_company ON matches(company_id);
CREATE INDEX idx_matches_vacancy ON matches(vacancy_id);
CREATE INDEX idx_matches_score ON matches(compatibility_score DESC);

-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(match_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(match_id, read) WHERE read = FALSE;

-- ============================================================
-- TABLE: subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan subscription_plan DEFAULT 'free',
  billing_cycle billing_cycle,
  status subscription_status DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================================
-- FUNCTIONS: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seeker_profiles_updated_at
  BEFORE UPDATE ON job_seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacancies_updated_at
  BEFORE UPDATE ON vacancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;