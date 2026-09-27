-- App Experience Rating (final onboarding step, onboarding v2.0).
-- PRODUCT FEEDBACK ONLY: nothing in the matching engine, career graph,
-- ranking, or job/candidate preferences reads this table.
-- Aggregate analytics (average, distribution, over time, by version/platform)
-- can be computed from rating/created_at/onboarding_version/platform without
-- joining any candidate profile data.
CREATE TABLE IF NOT EXISTS public.app_experience_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  feedback_text text CHECK (feedback_text IS NULL OR char_length(feedback_text) <= 2000),
  skipped boolean NOT NULL DEFAULT false,
  onboarding_context text NOT NULL DEFAULT 'onboarding_final_step',
  onboarding_version text,
  platform text CHECK (platform IN ('web','mobile')),
  locale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_experience_ratings_user_context_key UNIQUE (user_id, onboarding_context),
  CONSTRAINT app_experience_ratings_rating_or_skip CHECK (skipped OR rating IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS app_experience_ratings_created_idx ON public.app_experience_ratings (created_at);
CREATE INDEX IF NOT EXISTS app_experience_ratings_version_platform_idx ON public.app_experience_ratings (onboarding_version, platform);
ALTER TABLE public.app_experience_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rating_select_own" ON public.app_experience_ratings FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "rating_insert_own" ON public.app_experience_ratings FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "rating_update_own" ON public.app_experience_ratings FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
