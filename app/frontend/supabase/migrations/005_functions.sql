-- MatchMe Database Functions
-- Server-side functions for matching, scoring, and business logic

BEGIN;

-- ============================================================
-- FUNCTION: Calculate compatibility score between seeker and vacancy
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_compatibility_score(
  p_seeker_id UUID,
  p_vacancy_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_seeker job_seeker_profiles%ROWTYPE;
  v_vacancy vacancies%ROWTYPE;
  v_skill_match INTEGER;
  v_total_skills INTEGER;
BEGIN
  -- Get seeker profile
  SELECT * INTO v_seeker FROM job_seeker_profiles WHERE user_id = p_seeker_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Get vacancy
  SELECT * INTO v_vacancy FROM vacancies WHERE id = p_vacancy_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Skill matching (40% weight)
  v_total_skills := array_length(v_vacancy.required_skills, 1);
  IF v_total_skills > 0 THEN
    SELECT COUNT(*) INTO v_skill_match
    FROM unnest(v_seeker.key_skills) AS sk
    WHERE sk = ANY(v_vacancy.required_skills);
    v_score := v_score + ((v_skill_match * 40) / v_total_skills);
  END IF;

  -- Location matching (20% weight)
  IF v_seeker.current_location IS NOT NULL AND v_vacancy.city IS NOT NULL THEN
    IF LOWER(v_seeker.current_location) LIKE '%' || LOWER(v_vacancy.city) || '%' THEN
      v_score := v_score + 20;
    ELSIF v_seeker.preferred_location IS NOT NULL AND LOWER(v_seeker.preferred_location) LIKE '%' || LOWER(v_vacancy.city) || '%' THEN
      v_score := v_score + 15;
    END IF;
  END IF;

  -- Experience matching (20% weight)
  DECLARE
    v_seeker_exp INTEGER := 0;
    v_exp_item JSONB;
  BEGIN
    FOR v_exp_item IN SELECT * FROM jsonb_array_elements(v_seeker.work_experience)
    LOOP
      v_seeker_exp := v_seeker_exp + COALESCE((v_exp_item->>'years')::INTEGER, 0);
    END LOOP;

    IF v_seeker_exp >= v_vacancy.min_experience AND v_seeker_exp <= v_vacancy.max_experience THEN
      v_score := v_score + 20;
    ELSIF v_seeker_exp >= v_vacancy.min_experience THEN
      v_score := v_score + 15;
    ELSIF v_seeker_exp >= (v_vacancy.min_experience - 1) THEN
      v_score := v_score + 10;
    END IF;
  END;

  -- Industry preference matching (10% weight)
  IF v_seeker.preferred_industry IS NOT NULL THEN
    DECLARE
      v_company company_profiles%ROWTYPE;
    BEGIN
      SELECT * INTO v_company FROM company_profiles WHERE id = v_vacancy.company_id;
      IF FOUND AND LOWER(v_seeker.preferred_industry) = LOWER(v_company.industry) THEN
        v_score := v_score + 10;
      END IF;
    END;
  END IF;

  -- Employment type matching (10% weight)
  IF v_seeker.preferred_employment_type = v_vacancy.employment_type THEN
    v_score := v_score + 10;
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Create a match when seeker swipes right
-- ============================================================
CREATE OR REPLACE FUNCTION create_match(
  p_vacancy_id UUID,
  p_seeker_status seeker_match_status DEFAULT 'interested'
)
RETURNS matches AS $$
DECLARE
  v_match matches;
  v_vacancy vacancies%ROWTYPE;
  v_company company_profiles%ROWTYPE;
  v_score INTEGER;
BEGIN
  -- Get vacancy and company info
  SELECT * INTO v_vacancy FROM vacancies WHERE id = p_vacancy_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vacancy not found';
  END IF;

  SELECT * INTO v_company FROM company_profiles WHERE id = v_vacancy.company_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  -- Calculate compatibility score
  v_score := calculate_compatibility_score(auth.uid(), p_vacancy_id);

  -- Insert or update match
  INSERT INTO matches (vacancy_id, job_seeker_id, company_id, compatibility_score, seeker_status)
  VALUES (p_vacancy_id, auth.uid(), v_company.user_id, v_score, p_seeker_status)
  ON CONFLICT (vacancy_id, job_seeker_id)
  DO UPDATE SET seeker_status = p_seeker_status, updated_at = NOW()
  RETURNING * INTO v_match;

  -- Create notification for company if interested
  IF p_seeker_status = 'interested' THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      v_company.user_id,
      'new_match',
      'New candidate match!',
      'A candidate showed interest in your vacancy: ' || v_vacancy.job_title,
      jsonb_build_object('match_id', v_match.id, 'vacancy_id', p_vacancy_id)
    );
  END IF;

  RETURN v_match;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Get job cards for seeker with compatibility scores
-- ============================================================
CREATE OR REPLACE FUNCTION get_job_cards_for_seeker(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  logo_url TEXT,
  industry TEXT,
  country TEXT,
  city TEXT,
  employment_type employment_type,
  min_experience INTEGER,
  max_experience INTEGER,
  job_title TEXT,
  job_description TEXT,
  required_skills TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,
  compatibility_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    cp.company_name,
    cp.logo_url,
    cp.industry,
    v.country,
    v.city,
    v.employment_type,
    v.min_experience,
    v.max_experience,
    v.job_title,
    v.job_description,
    v.required_skills,
    v.salary_min,
    v.salary_max,
    calculate_compatibility_score(auth.uid(), v.id) AS compatibility_score
  FROM vacancies v
  JOIN company_profiles cp ON cp.id = v.company_id
  WHERE v.status = 'open'
    AND v.id NOT IN (
      SELECT m.vacancy_id FROM matches m WHERE m.job_seeker_id = auth.uid()
    )
  ORDER BY calculate_compatibility_score(auth.uid(), v.id) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Get unread message count for a user
-- ============================================================
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM messages m
  JOIN matches mt ON mt.id = m.match_id
  WHERE m.read = FALSE
    AND m.sender_id != p_user_id
    AND (mt.job_seeker_id = p_user_id OR mt.company_id = p_user_id);
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Handle new user signup (create base profile)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a free subscription for the new user
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMIT;