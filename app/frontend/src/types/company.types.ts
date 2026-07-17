/**
 * Company-related types.
 */

export type CompanyType = 'local' | 'international';
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

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
  company_size: CompanySize;
  company_type: CompanyType;
  description: string;
  created_at: string;
  updated_at: string;
}

export type CandidateStatus = 'new' | 'accepted' | 'rejected' | 'interview' | 'offer' | 'hired';

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