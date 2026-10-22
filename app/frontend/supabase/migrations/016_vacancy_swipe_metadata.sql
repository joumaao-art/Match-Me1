-- Nullable metadata preserves all legacy vacancies without inventing values.
BEGIN;
ALTER TABLE public.vacancies
 ADD COLUMN IF NOT EXISTS salary_currency text,
 ADD COLUMN IF NOT EXISTS salary_period text,
 ADD COLUMN IF NOT EXISTS show_salary boolean,
 ADD COLUMN IF NOT EXISTS employment_style text,
 ADD COLUMN IF NOT EXISTS qualifications text;
ALTER TABLE public.vacancies ADD CONSTRAINT vacancy_salary_currency_format CHECK(salary_currency IS NULL OR salary_currency ~ '^[A-Z]{3}$') NOT VALID;
ALTER TABLE public.vacancies ADD CONSTRAINT vacancy_salary_period_values CHECK(salary_period IS NULL OR salary_period IN('hour','day','week','month','year')) NOT VALID;
ALTER TABLE public.vacancies ADD CONSTRAINT vacancy_style_values CHECK(employment_style IS NULL OR employment_style IN('onsite','remote','hybrid')) NOT VALID;
COMMIT;
