/**
 * Job, vacancy, and matching types.
 */

import type { EmploymentType, EducationLevel } from './user.types';

export type VacancyStatus = 'open' | 'closed' | 'draft' | 'scheduled';
export type SwipeDirection = 'left' | 'right' | 'super_like';
export type MatchStatus = 'pending' | 'mutual' | 'unmatched' | 'expired';
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected' | 'withdrawn';

export interface Job {
  id: string;
  companyId: string;
  recruiterId?: string;
  branchId?: string;
  title: string;
  slug?: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  employmentType: EmploymentType;
  experienceMin: number;
  experienceMax?: number;
  educationLevel?: EducationLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  showSalary: boolean;
  country?: string;
  city?: string;
  isRemote: boolean;
  remotePolicy?: string;
  benefits: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  status: VacancyStatus;
  publishedAt?: string;
  expiresAt?: string;
  applicationDeadline?: string;
  maxApplications?: number;
  applicationCount: number;
  viewCount: number;
  isFeatured: boolean;
  isUrgent: boolean;
  externalApplyUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobCard {
  id: string;
  companyName: string;
  logoUrl?: string;
  industry?: string;
  country?: string;
  city?: string;
  employmentType: EmploymentType;
  experienceMin: number;
  experienceMax?: number;
  title: string;
  description?: string;
  requiredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
  compatibilityScore: number;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  notes?: string;
  createdAt: string;
  job?: Job;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  resumeId?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  statusChangedAt?: string;
  rejectionReason?: string;
  interviewDate?: string;
  interviewNotes?: string;
  salaryExpectation?: number;
  score: number;
  isViewed: boolean;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SwipeHistoryItem {
  id: string;
  swiperId: string;
  targetId: string;
  targetType: 'job' | 'user';
  direction: SwipeDirection;
  compatibilityScore: number;
  createdAt: string;
}

export interface Match {
  id: string;
  jobId?: string;
  seekerId: string;
  companyUserId: string;
  status: MatchStatus;
  compatibilityScore: number;
  seekerSwipedAt?: string;
  companySwipedAt?: string;
  matchedAt?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}