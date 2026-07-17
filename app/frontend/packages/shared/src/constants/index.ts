/**
 * Shared constants used across all applications.
 */

export const APP_NAME = 'MatchMe';
export const APP_VERSION = '1.0.0';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'matchme-token',
  USER_ROLE: 'matchme-role',
  THEME: 'matchme-theme',
  LANGUAGE: 'matchme-lang',
  ONBOARDING: 'matchme-onboarding',
} as const;

// Route paths (web)
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_SETTINGS: '/admin/settings',
  SEEKER: '/seeker',
  SEEKER_SWIPE: '/seeker/swipe',
  SEEKER_SAVED: '/seeker/saved',
  SEEKER_APPLICATIONS: '/seeker/applications',
  SEEKER_PROFILE: '/seeker/profile',
  COMPANY: '/company',
  COMPANY_VACANCIES: '/company/vacancies',
  COMPANY_CANDIDATES: '/company/candidates',
  COMPANY_ANALYTICS: '/company/analytics',
  COMPANY_PROFILE: '/company/profile',
  MESSAGES: '/messages',
  SUBSCRIPTION: '/subscription',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Matching
export const MATCHING = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  HIGH_MATCH_THRESHOLD: 80,
  MEDIUM_MATCH_THRESHOLD: 60,
  LOW_MATCH_THRESHOLD: 40,
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MAX_BIO_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_SKILLS: 20,
  MAX_FILE_SIZE_MB: 10,
  MAX_AVATAR_SIZE_MB: 5,
  MAX_RESUME_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_RESUME_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Subscription limits by plan
export const PLAN_LIMITS = {
  'seeker-free': { dailySwipes: 5, resumes: 1, savedJobs: 10 },
  'seeker-premium': { dailySwipes: -1, resumes: 5, savedJobs: -1 },
  'company-starter': { jobPostings: 3, candidateViews: 20, teamMembers: 1 },
  'company-business': { jobPostings: -1, candidateViews: -1, teamMembers: 5 },
  'company-enterprise': { jobPostings: -1, candidateViews: -1, teamMembers: -1 },
} as const;

// Supabase storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CVS: 'cvs',
  LOGOS: 'logos',
  ATTACHMENTS: 'attachments',
} as const;