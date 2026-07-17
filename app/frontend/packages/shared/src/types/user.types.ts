/**
 * User profile types for all roles.
 */

import type { UserRole } from './auth.types';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'remote' | 'internship';
export type EducationLevel = 'high_school' | 'diploma' | 'bachelors' | 'masters' | 'doctorate' | 'professional' | 'other';
export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'native';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface UserProfile {
  id: string;
  userId: string;
  role: UserRole;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  country?: string;
  city?: string;
  timezone?: string;
  preferredLanguage?: string;
  isActive: boolean;
  isVerified: boolean;
  onboardingCompleted: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobSeekerProfile {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  gender?: Gender;
  dateOfBirth?: string;
  nationality?: string;
  currentLocation?: string;
  bio?: string;
  headline?: string;
  yearsOfExperience: number;
  availability: string;
  preferredEmploymentType: EmploymentType;
  preferredLocations: string[];
  preferredIndustries: string[];
  preferredSalaryMin?: number;
  preferredSalaryMax?: number;
  preferredCurrency: string;
  willingToRelocate: boolean;
  remotePreference: string;
  resumeScore: number;
  profileCompleteness: number;
  isOpenToWork: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  legalName?: string;
  registrationNumber?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  industry?: string;
  companySize?: string;
  companyType: 'local' | 'international';
  foundedYear?: number;
  description?: string;
  mission?: string;
  culture?: string;
  benefitsSummary?: string;
  socialLinks?: Record<string, string>;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recruiter {
  id: string;
  userId: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  specializations: string[];
  isActive: boolean;
  canPostJobs: boolean;
  canManageCandidates: boolean;
  canManageTeam: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  id: string;
  userId: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  level?: EducationLevel;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  grade?: string;
  description?: string;
  country?: string;
  city?: string;
}

export interface Experience {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  employmentType: EmploymentType;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  responsibilities: string[];
  achievements: string[];
  country?: string;
  city?: string;
  isRemote: boolean;
}

export interface Certificate {
  id: string;
  userId: string;
  name: string;
  issuingOrganization: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  fileUrl?: string;
  isVerified: boolean;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skillName?: string;
  level: SkillLevel;
  yearsOfExperience: number;
  isPrimary: boolean;
  endorsedCount: number;
}

export interface UserLanguage {
  id: string;
  userId: string;
  languageId: string;
  languageName?: string;
  proficiency: ProficiencyLevel;
  isNative: boolean;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  isPrimary: boolean;
  isParsed: boolean;
  downloadCount: number;
  createdAt: string;
}