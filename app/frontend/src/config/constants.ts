/**
 * Application-wide constants.
 * Centralized location for magic strings, limits, and configuration values.
 */

export const APP_NAME = 'MatchMe';

// Storage keys
export const STORAGE_KEYS = {
  USER_ROLE: 'matchme-role',
  THEME: 'matchme-theme',
  LANGUAGE: 'matchme-lang',
  AUTH_TOKEN: 'matchme-token',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  AUTH_CALLBACK: '/auth/callback',
  AUTH_RESET_PASSWORD: '/auth/reset-password',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin',
  SEEKER: '/seeker',
  COMPANY: '/company',
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
} as const;

// Subscription
export const SUBSCRIPTION = {
  FREE_JOB_POSTINGS_LIMIT: 3,
  PREMIUM_MONTHLY_PRICE: 49,
  PREMIUM_YEARLY_PRICE: 39,
  YEARLY_DISCOUNT_PERCENT: 20,
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MAX_BIO_LENGTH: 500,
  MAX_SKILLS: 20,
  MAX_FILE_SIZE_MB: 10,
} as const;