/**
 * Application-wide constants.
 * Re-exports from @matchme/shared plus web-specific constants.
 */

export {
  APP_NAME,
  STORAGE_KEYS,
  ROUTES,
  PAGINATION,
  MATCHING,
  VALIDATION_LIMITS,
  PLAN_LIMITS,
  STORAGE_BUCKETS,
} from '@matchme/shared/constants';

// Web-specific aliases for backward compatibility
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MAX_BIO_LENGTH: 500,
  MAX_SKILLS: 20,
  MAX_FILE_SIZE_MB: 10,
} as const;

// Subscription display values
export const SUBSCRIPTION = {
  FREE_JOB_POSTINGS_LIMIT: 3,
  PREMIUM_MONTHLY_PRICE: 49,
  PREMIUM_YEARLY_PRICE: 39,
  YEARLY_DISCOUNT_PERCENT: 20,
} as const;