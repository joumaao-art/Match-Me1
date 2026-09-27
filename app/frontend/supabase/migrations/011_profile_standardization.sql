-- ============================================================
-- 011 — Job Seeker professional-profile standardization
-- Non-destructive: no column, row, Resume, Certificate, GPA or language
-- record is deleted. Only additive enum values, additive columns, and an
-- in-place Advanced -> Fluent value mapping.
-- ============================================================

-- 1. Employment type: add the requested options. Existing values
--    ('full-time','part-time','contract','remote','internship') are kept;
--    the app maps canonical codes onto them (INTERN -> 'internship').
ALTER TYPE employment_type ADD VALUE IF NOT EXISTS 'hybrid';
ALTER TYPE employment_type ADD VALUE IF NOT EXISTS 'freelance';
ALTER TYPE employment_type ADD VALUE IF NOT EXISTS 'consultant';

-- 2. Language proficiency: add 'fluent' to the production scale.
ALTER TYPE proficiency_level ADD VALUE IF NOT EXISTS 'fluent' BEFORE 'native';

-- Enum additions must be committed before use.
COMMIT;
BEGIN;

-- 3. Migrate Advanced -> Fluent (value mapping, rows are preserved).
UPDATE user_languages SET proficiency = 'fluent' WHERE proficiency = 'advanced';

-- 4. Future work-style dimension, derivable from employment_type without
--    a destructive split later.
ALTER TABLE experience ADD COLUMN IF NOT EXISTS work_style TEXT
  CHECK (work_style IS NULL OR work_style IN ('onsite', 'remote', 'hybrid'));
UPDATE experience SET work_style = 'remote' WHERE work_style IS NULL AND (employment_type = 'remote' OR is_remote);

-- 5. Structured nationalities (ISO 3166-1 alpha-2), multi-valued.
--    The legacy free-text `nationality` column is retained untouched.
ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS nationalities TEXT[] DEFAULT '{}';
ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS country_code TEXT
  CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$');
CREATE INDEX IF NOT EXISTS idx_jsp_nationalities ON job_seeker_profiles USING GIN (nationalities);
CREATE INDEX IF NOT EXISTS idx_jsp_country_code ON job_seeker_profiles (country_code);

-- 6. Structured education degree + current flag already exist (`level`,
--    `is_current`). GPA (`grade`) is deprecated in the UI only.
COMMENT ON COLUMN education.grade IS 'DEPRECATED 2026-09: no longer displayed or required. Retained for historical data.';
ALTER TABLE education ADD COLUMN IF NOT EXISTS degree_code TEXT
  CHECK (degree_code IS NULL OR degree_code IN ('HIGH_SCHOOL','DIPLOMA','ASSOCIATE','BACHELOR','MASTER','DOCTORATE','NOT_APPLICABLE'));

-- 7. Experience description word limit applies to NEW saves only
--    (enforced in the app); existing longer descriptions are not truncated.
COMMENT ON COLUMN experience.description IS 'Max 250 words enforced on save (2026-09). Historical values preserved.';
