/**
 * Job seeker and vacancy-related types.
 */

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'remote' | 'internship';
export type AvailabilityStatus = 'immediate' | '2_weeks' | '1_month' | '3_months' | 'not_available';
export type VacancyStatus = 'open' | 'closed' | 'draft' | 'scheduled';
export type MatchStatus = 'pending' | 'interested' | 'not_interested';
export type CompanyMatchStatus = 'pending' | 'accepted' | 'rejected' | 'interview' | 'offer' | 'hired';

export interface JobSeekerProfile {
  id: string;
  user_id: string;
  photo_url: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  mobile: string;
  nationality: string;
  date_of_birth: string;
  current_location: string;
  languages: Language[];
  cv_url?: string;
  education: Education[];
  work_experience: WorkExperience[];
  key_skills: string[];
  availability: AvailabilityStatus;
  preferred_employment_type: EmploymentType;
  preferred_location: string;
  preferred_industry: string;
  preferred_company_size: string;
  expected_salary?: number;
  certificates?: string[];
  accomplishments?: string[];
  resume_score?: number;
  professional_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface Language {
  language: string;
  proficiency: 'basic' | 'intermediate' | 'fluent' | 'native';
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  years: number;
  description: string;
}

export interface Vacancy {
  id: string;
  company_id: string;
  job_title: string;
  employment_type: EmploymentType;
  job_description: string;
  country: string;
  city: string;
  required_skills: string[];
  min_experience: number;
  max_experience: number;
  education_level: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string | null;
  salary_period?: 'hour' | 'day' | 'week' | 'month' | 'year' | null;
  show_salary?: boolean | null;
  employment_style?: 'onsite' | 'remote' | 'hybrid' | null;
  seniority_level?: string | null;
  qualifications?: string | null;
  benefits?: string[];
  status: VacancyStatus;
  posting_date: string;
  expiration_date: string;
  created_at: string;
  updated_at: string;
}

export interface JobMatch {
  id: string;
  vacancy_id: string;
  job_seeker_id: string;
  company_id: string;
  compatibility_score: number;
  seeker_status: MatchStatus;
  company_status: CompanyMatchStatus;
  created_at: string;
  updated_at: string;
}

export interface JobCard {
  id: string;
  company_name: string;
  logo_url: string;
  industry: string;
  country: string;
  city: string;
  employment_type: EmploymentType;
  min_experience: number;
  max_experience: number;
  job_title: string;
  job_description: string;
  required_skills: string[];
  salary_min?: number;
  salary_max?: number;
  compatibility_score: number;
}