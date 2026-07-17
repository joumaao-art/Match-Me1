import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface UserProfile {
  id: string;
  user_id: string;
  role: 'job_seeker' | 'company';
  created_at: string;
  updated_at: string;
}

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
  languages: { language: string; proficiency: string }[];
  cv_url?: string;
  education: { degree: string; institution: string; year: string }[];
  work_experience: { title: string; company: string; years: number; description: string }[];
  key_skills: string[];
  availability: string;
  preferred_employment_type: string;
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

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string;
  website: string;
  phone: string;
  country: string;
  city: string;
  industry: string;
  company_size: string;
  company_type: 'local' | 'international';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Vacancy {
  id: string;
  company_id: string;
  job_title: string;
  employment_type: string;
  job_description: string;
  country: string;
  city: string;
  required_skills: string[];
  min_experience: number;
  max_experience: number;
  education_level: string;
  salary_min?: number;
  salary_max?: number;
  benefits?: string[];
  status: 'open' | 'closed' | 'draft' | 'scheduled';
  posting_date: string;
  expiration_date: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  vacancy_id: string;
  job_seeker_id: string;
  company_id: string;
  compatibility_score: number;
  seeker_status: 'pending' | 'interested' | 'not_interested';
  company_status: 'pending' | 'accepted' | 'rejected' | 'interview' | 'offer' | 'hired';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  attachment_url?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium';
  billing_cycle?: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}