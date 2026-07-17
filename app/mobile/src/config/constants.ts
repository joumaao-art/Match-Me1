/**
 * Application-wide constants for the mobile app.
 */

export const APP_NAME = 'MatchMe';

export const STORAGE_KEYS = {
  USER_ROLE: 'matchme-role',
  THEME: 'matchme-theme',
  LANGUAGE: 'matchme-lang',
  AUTH_TOKEN: 'matchme-token',
} as const;

export const ROUTES = {
  AUTH: 'Auth',
  HOME: 'Home',
  SEEKER_TABS: 'SeekerTabs',
  COMPANY_TABS: 'CompanyTabs',
  MESSAGES: 'Messages',
  CHAT: 'Chat',
  SUBSCRIPTION: 'Subscription',
  SETTINGS: 'Settings',
} as const;

export const MATCHING = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  HIGH_MATCH_THRESHOLD: 80,
  MEDIUM_MATCH_THRESHOLD: 60,
} as const;

export const SUBSCRIPTION = {
  FREE_JOB_POSTINGS_LIMIT: 3,
  PREMIUM_MONTHLY_PRICE: 49,
  PREMIUM_YEARLY_PRICE: 39,
  YEARLY_DISCOUNT_PERCENT: 20,
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MAX_BIO_LENGTH: 500,
  MAX_SKILLS: 20,
  MAX_FILE_SIZE_MB: 10,
} as const;