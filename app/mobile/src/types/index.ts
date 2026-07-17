/**
 * Shared type definitions for the MatchMe mobile app.
 */

// Auth types
export type UserRole = 'job_seeker' | 'company';

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  role: UserRole;
}

// Job types
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'remote' | 'internship';
export type VacancyStatus = 'open' | 'closed' | 'draft' | 'scheduled';
export type CandidateStatus = 'new' | 'accepted' | 'rejected' | 'interview' | 'offer' | 'hired';

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
  salary_min?: number;
  salary_max?: number;
  status: VacancyStatus;
  posting_date: string;
  applicants: number;
}

export interface Candidate {
  id: string;
  name: string;
  photo: string;
  skills: string[];
  experience: number;
  education: string;
  location: string;
  score: number;
  status: CandidateStatus;
  summary: string;
}

// Messaging types
export interface Conversation {
  id: string;
  name: string;
  role: 'company' | 'job_seeker';
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'me' | 'other';
  timestamp: string;
  read: boolean;
}

// Subscription types
export type SubscriptionPlan = 'free' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';