/**
 * MatchMe Centralized Billing Engine
 * 
 * A configurable subscription engine that supports:
 * - Independent subscriptions for Companies and Job Seekers
 * - Configurable plans, pricing, limits, add-ons, and premium features
 * - Payment provider abstraction layer
 * - Feature entitlements system
 * - Usage tracking and enforcement
 * - Trial management
 * - Promotions and coupons
 * - Compliance (GDPR, CCPA, Saudi PDPL)
 * - Billing analytics
 * 
 * All subscription behavior is configurable through the database.
 */

import { logger } from '@/lib/logger';

// ============================================================
// Core Types
// ============================================================

export type PlanType = 'company' | 'job_seeker';
export type BillingCycleType = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'lifetime';
export type SubscriptionStatusType = 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled' | 'expired' | 'grace_period';
export type PaymentProviderType = 'stripe' | 'moyasar' | 'apple_pay' | 'google_pay' | 'mada' | 'stc_pay' | 'bank_transfer';
export type PaymentMethodType = 'credit_card' | 'debit_card' | 'apple_pay' | 'google_pay' | 'mada' | 'stc_pay' | 'bank_transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
export type AddonCategory = 'seats' | 'exports' | 'ai_credits' | 'storage' | 'analytics' | 'api' | 'branding' | 'locations' | 'modules';
export type CouponType = 'percentage' | 'fixed';
export type OveragePolicy = 'block' | 'warn' | 'allow_overage' | 'auto_upgrade';

// ============================================================
// Plan Configuration
// ============================================================

export interface PlanConfig {
  id: string;
  name: string;
  type: PlanType;
  description: string;
  tier: number; // 0=free, 1=basic, 2=premium, 3=enterprise, 4=custom
  pricing: PlanPricing;
  features: FeatureEntitlement[];
  limits: UsageLimit[];
  addons: string[]; // addon IDs available for this plan
  trialConfig: TrialConfig;
  upgradeRules: UpgradeRules;
  downgradeRules: DowngradeRules;
  renewalRules: RenewalRules;
  gracePeriodDays: number;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
}

export interface PlanPricing {
  monthly: number;
  quarterly: number;
  semiAnnual: number;
  annual: number;
  lifetime: number;
  currency: string;
  discounts: { cycle: BillingCycleType; percentage: number }[];
}

export interface TrialConfig {
  enabled: boolean;
  durationDays: number;
  requiresPaymentMethod: boolean;
  autoConvert: boolean;
  notifyDaysBefore: number[];
}

export interface UpgradeRules {
  allowImmediate: boolean;
  prorateCredit: boolean;
  preserveTrialDays: boolean;
}

export interface DowngradeRules {
  allowImmediate: boolean;
  effectiveAtPeriodEnd: boolean;
  gracePeriodDays: number;
  dataRetentionDays: number;
}

export interface RenewalRules {
  autoRenew: boolean;
  retryAttempts: number;
  retryIntervalDays: number;
  notifyDaysBefore: number[];
  dunningEnabled: boolean;
}

// ============================================================
// Feature Entitlements
// ============================================================

export interface FeatureEntitlement {
  featureId: string;
  featureName: string;
  enabled: boolean;
  tier: number;
  metadata?: Record<string, unknown>;
}

export type FeatureId =
  | 'candidate_directory' | 'talent_pipeline' | 'recruiter_invitations'
  | 'recruiter_notes' | 'featured_candidate' | 'ai_matching'
  | 'ai_recommendations' | 'analytics' | 'reports' | 'exports'
  | 'marketplace' | 'api_access' | 'white_label' | 'custom_branding'
  | 'priority_support' | 'dedicated_manager' | 'sla_support'
  | 'video_intro' | 'salary_insights' | 'interview_prep'
  | 'resume_builder' | 'career_coach' | 'discoverability'
  | 'exposure_dashboard' | 'profile_analytics' | 'contact_requests'
  | 'ats_integration' | 'crm_integration' | 'bulk_actions'
  | 'team_collaboration' | 'audit_logs' | 'custom_workflows';

// ============================================================
// Usage Limits
// ============================================================

export interface UsageLimit {
  limitId: string;
  limitName: string;
  maxValue: number; // -1 = unlimited
  resetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  overagePolicy: OveragePolicy;
  warningThreshold: number; // percentage (0-100)
}

export interface UsageRecord {
  limitId: string;
  used: number;
  limit: number;
  resetDate: string;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  isUnlimited: boolean;
}

// ============================================================
// Add-ons
// ============================================================

export interface Addon {
  id: string;
  name: string;
  description: string;
  category: AddonCategory;
  pricing: { monthly: number; annual: number; oneTime?: number; currency: string };
  quantity: number;
  unit: string;
  applicablePlans: string[];
  isActive: boolean;
  metadata: Record<string, unknown>;
}

// ============================================================
// Payment & Transactions
// ============================================================

export interface PaymentProvider {
  id: PaymentProviderType;
  name: string;
  icon: string;
  available: boolean;
  supportedMethods: PaymentMethodType[];
  supportedCurrencies: string[];
  regions: string[];
}

export interface PaymentTransaction {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  provider: PaymentProviderType;
  method: PaymentMethodType;
  description: string;
  invoiceId?: string;
  refundId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  number: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  dueDate: string;
  paidDate?: string;
  lineItems: InvoiceLineItem[];
  billingAddress?: BillingAddress;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BillingAddress {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// ============================================================
// Promotions & Coupons
// ============================================================

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: CouponType;
  discountValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  applicablePlans: string[];
  applicableCycles: BillingCycleType[];
  minPurchaseAmount?: number;
  isActive: boolean;
  isSingleUse: boolean;
  referralCode?: string;
  campaignId?: string;
  metadata: Record<string, unknown>;
}

// ============================================================
// Subscription Record
// ============================================================

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  planType: PlanType;
  status: SubscriptionStatusType;
  billingCycle: BillingCycleType;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  cancelReason?: string;
  pausedAt?: string;
  resumeAt?: string;
  paymentProvider: PaymentProviderType;
  paymentMethodId?: string;
  promotionId?: string;
  addons: { addonId: string; quantity: number; activatedAt: string }[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Billing Analytics
// ============================================================

export interface BillingAnalytics {
  mrr: number;
  arr: number;
  activeSubscribers: number;
  trialUsers: number;
  trialConversionRate: number;
  upgradeRate: number;
  downgradeRate: number;
  cancellationRate: number;
  churnRate: number;
  arpu: number;
  ltv: number;
  revenueGrowth: number;
  popularPlans: { planId: string; planName: string; count: number; revenue: number }[];
  popularAddons: { addonId: string; addonName: string; count: number; revenue: number }[];
  revenueByCountry: { country: string; revenue: number; subscribers: number }[];
  revenueByIndustry: { industry: string; revenue: number }[];
  revenueBySize: { size: string; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number; subscribers: number }[];
}

// ============================================================
// Compliance
// ============================================================

export interface ComplianceConfig {
  gdpr: { enabled: boolean; dataExportEnabled: boolean; rightToDeleteEnabled: boolean; consentRequired: boolean };
  ccpa: { enabled: boolean; doNotSellEnabled: boolean; dataDisclosureEnabled: boolean };
  pdpl: { enabled: boolean; crossBorderTransferConsent: boolean; dataLocalization: boolean };
  dataRetention: { activeAccountDays: number; deletedAccountDays: number; billingRecordsDays: number; auditLogDays: number };
}

export interface DataExportRequest {
  id: string;
  userId: string;
  type: 'export' | 'delete' | 'consent_withdrawal';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
}

// ============================================================
// Company Plans Database
// ============================================================

const COMPANY_PLANS_DB: PlanConfig[] = [
  {
    id: 'company_free', name: 'Free', type: 'company', description: 'company_plan_starter_desc',
    tier: 0, isActive: true, isPublic: true, sortOrder: 0, metadata: {},
    pricing: { monthly: 0, quarterly: 0, semiAnnual: 0, annual: 0, lifetime: 0, currency: 'USD', discounts: [] },
    features: [
      { featureId: 'candidate_directory', featureName: 'Candidate Directory', enabled: true, tier: 0 },
      { featureId: 'ai_matching', featureName: 'AI Matching', enabled: true, tier: 0 },
    ],
    limits: [
      { limitId: 'job_postings', limitName: 'Job Postings', maxValue: 3, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'candidate_views', limitName: 'Candidate Views', maxValue: 50, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'messages_per_day', limitName: 'Messages/Day', maxValue: 10, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'team_members', limitName: 'Team Members', maxValue: 1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 100 },
      { limitId: 'ai_matches_per_day', limitName: 'AI Matches/Day', maxValue: 5, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'cv_downloads', limitName: 'CV Downloads', maxValue: 5, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'candidate_searches', limitName: 'Searches', maxValue: 20, resetPeriod: 'daily', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'contact_requests', limitName: 'Contact Requests', maxValue: 5, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'invitations', limitName: 'Invitations', maxValue: 5, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'storage_mb', limitName: 'Storage (MB)', maxValue: 100, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 90 },
    ],
    addons: [], trialConfig: { enabled: false, durationDays: 0, requiresPaymentMethod: false, autoConvert: false, notifyDaysBefore: [] },
    upgradeRules: { allowImmediate: true, prorateCredit: true, preserveTrialDays: false },
    downgradeRules: { allowImmediate: false, effectiveAtPeriodEnd: true, gracePeriodDays: 7, dataRetentionDays: 30 },
    renewalRules: { autoRenew: false, retryAttempts: 0, retryIntervalDays: 0, notifyDaysBefore: [], dunningEnabled: false },
    gracePeriodDays: 0,
  },
  {
    id: 'company_premium', name: 'Premium', type: 'company', description: 'company_plan_professional_desc',
    tier: 1, isActive: true, isPublic: true, sortOrder: 1, metadata: { popular: true },
    pricing: { monthly: 49, quarterly: 132, semiAnnual: 245, annual: 468, lifetime: -1, currency: 'USD', discounts: [{ cycle: 'annual', percentage: 20 }, { cycle: 'quarterly', percentage: 10 }] },
    features: [
      { featureId: 'candidate_directory', featureName: 'Candidate Directory', enabled: true, tier: 1 },
      { featureId: 'talent_pipeline', featureName: 'Talent Pipeline', enabled: true, tier: 1 },
      { featureId: 'ai_matching', featureName: 'AI Matching', enabled: true, tier: 1 },
      { featureId: 'ai_recommendations', featureName: 'AI Recommendations', enabled: true, tier: 1 },
      { featureId: 'analytics', featureName: 'Analytics', enabled: true, tier: 1 },
      { featureId: 'recruiter_invitations', featureName: 'Recruiter Invitations', enabled: true, tier: 1 },
      { featureId: 'recruiter_notes', featureName: 'Recruiter Notes', enabled: true, tier: 1 },
      { featureId: 'exports', featureName: 'Exports', enabled: true, tier: 1 },
      { featureId: 'priority_support', featureName: 'Priority Support', enabled: true, tier: 1 },
    ],
    limits: [
      { limitId: 'job_postings', limitName: 'Job Postings', maxValue: 15, resetPeriod: 'never', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'candidate_views', limitName: 'Candidate Views', maxValue: 500, resetPeriod: 'monthly', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'messages_per_day', limitName: 'Messages/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'team_members', limitName: 'Team Members', maxValue: 3, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 100 },
      { limitId: 'ai_matches_per_day', limitName: 'AI Matches/Day', maxValue: 50, resetPeriod: 'daily', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'cv_downloads', limitName: 'CV Downloads', maxValue: 50, resetPeriod: 'monthly', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'candidate_searches', limitName: 'Searches', maxValue: 100, resetPeriod: 'daily', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'contact_requests', limitName: 'Contact Requests', maxValue: 50, resetPeriod: 'monthly', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'invitations', limitName: 'Invitations', maxValue: 50, resetPeriod: 'monthly', overagePolicy: 'warn', warningThreshold: 80 },
      { limitId: 'storage_mb', limitName: 'Storage (MB)', maxValue: 1000, resetPeriod: 'never', overagePolicy: 'warn', warningThreshold: 90 },
    ],
    addons: ['extra_seats', 'extra_exports', 'extra_ai_credits', 'extra_storage', 'premium_analytics'],
    trialConfig: { enabled: true, durationDays: 14, requiresPaymentMethod: true, autoConvert: true, notifyDaysBefore: [7, 3, 1] },
    upgradeRules: { allowImmediate: true, prorateCredit: true, preserveTrialDays: false },
    downgradeRules: { allowImmediate: false, effectiveAtPeriodEnd: true, gracePeriodDays: 7, dataRetentionDays: 60 },
    renewalRules: { autoRenew: true, retryAttempts: 3, retryIntervalDays: 3, notifyDaysBefore: [7, 3, 1], dunningEnabled: true },
    gracePeriodDays: 7,
  },
  {
    id: 'company_enterprise', name: 'Enterprise', type: 'company', description: 'company_plan_enterprise_desc',
    tier: 3, isActive: true, isPublic: true, sortOrder: 2, metadata: {},
    pricing: { monthly: 149, quarterly: 402, semiAnnual: 745, annual: 1428, lifetime: -1, currency: 'USD', discounts: [{ cycle: 'annual', percentage: 20 }, { cycle: 'quarterly', percentage: 10 }] },
    features: [
      { featureId: 'candidate_directory', featureName: 'Candidate Directory', enabled: true, tier: 3 },
      { featureId: 'talent_pipeline', featureName: 'Talent Pipeline', enabled: true, tier: 3 },
      { featureId: 'ai_matching', featureName: 'AI Matching', enabled: true, tier: 3 },
      { featureId: 'ai_recommendations', featureName: 'AI Recommendations', enabled: true, tier: 3 },
      { featureId: 'analytics', featureName: 'Analytics', enabled: true, tier: 3 },
      { featureId: 'reports', featureName: 'Reports', enabled: true, tier: 3 },
      { featureId: 'exports', featureName: 'Exports', enabled: true, tier: 3 },
      { featureId: 'api_access', featureName: 'API Access', enabled: true, tier: 3 },
      { featureId: 'custom_branding', featureName: 'Custom Branding', enabled: true, tier: 3 },
      { featureId: 'white_label', featureName: 'White Label', enabled: true, tier: 3 },
      { featureId: 'dedicated_manager', featureName: 'Dedicated Manager', enabled: true, tier: 3 },
      { featureId: 'sla_support', featureName: 'SLA Support', enabled: true, tier: 3 },
      { featureId: 'ats_integration', featureName: 'ATS Integration', enabled: true, tier: 3 },
      { featureId: 'crm_integration', featureName: 'CRM Integration', enabled: true, tier: 3 },
      { featureId: 'team_collaboration', featureName: 'Team Collaboration', enabled: true, tier: 3 },
      { featureId: 'audit_logs', featureName: 'Audit Logs', enabled: true, tier: 3 },
      { featureId: 'custom_workflows', featureName: 'Custom Workflows', enabled: true, tier: 3 },
      { featureId: 'bulk_actions', featureName: 'Bulk Actions', enabled: true, tier: 3 },
      { featureId: 'recruiter_invitations', featureName: 'Recruiter Invitations', enabled: true, tier: 3 },
      { featureId: 'recruiter_notes', featureName: 'Recruiter Notes', enabled: true, tier: 3 },
      { featureId: 'priority_support', featureName: 'Priority Support', enabled: true, tier: 3 },
    ],
    limits: [
      { limitId: 'job_postings', limitName: 'Job Postings', maxValue: -1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'candidate_views', limitName: 'Candidate Views', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'messages_per_day', limitName: 'Messages/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'team_members', limitName: 'Team Members', maxValue: -1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'ai_matches_per_day', limitName: 'AI Matches/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'cv_downloads', limitName: 'CV Downloads', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'candidate_searches', limitName: 'Searches', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'contact_requests', limitName: 'Contact Requests', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'invitations', limitName: 'Invitations', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'storage_mb', limitName: 'Storage (MB)', maxValue: -1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'api_calls', limitName: 'API Calls', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
    ],
    addons: ['extra_seats', 'extra_exports', 'extra_ai_credits', 'extra_storage', 'premium_analytics', 'api_access_addon', 'multi_brand', 'extra_locations', 'ai_modules'],
    trialConfig: { enabled: true, durationDays: 30, requiresPaymentMethod: false, autoConvert: false, notifyDaysBefore: [14, 7, 3, 1] },
    upgradeRules: { allowImmediate: true, prorateCredit: true, preserveTrialDays: true },
    downgradeRules: { allowImmediate: false, effectiveAtPeriodEnd: true, gracePeriodDays: 14, dataRetentionDays: 90 },
    renewalRules: { autoRenew: true, retryAttempts: 5, retryIntervalDays: 2, notifyDaysBefore: [14, 7, 3, 1], dunningEnabled: true },
    gracePeriodDays: 14,
  },
  {
    id: 'company_custom', name: 'Custom Enterprise', type: 'company', description: 'company_plan_custom_desc',
    tier: 4, isActive: true, isPublic: true, sortOrder: 3, metadata: { contactSales: true },
    pricing: { monthly: -1, quarterly: -1, semiAnnual: -1, annual: -1, lifetime: -1, currency: 'USD', discounts: [] },
    features: [
      { featureId: 'candidate_directory', featureName: 'Candidate Directory', enabled: true, tier: 4 },
      { featureId: 'talent_pipeline', featureName: 'Talent Pipeline', enabled: true, tier: 4 },
      { featureId: 'ai_matching', featureName: 'AI Matching', enabled: true, tier: 4 },
      { featureId: 'white_label', featureName: 'White Label', enabled: true, tier: 4 },
      { featureId: 'custom_workflows', featureName: 'Custom Workflows', enabled: true, tier: 4 },
    ],
    limits: [
      { limitId: 'job_postings', limitName: 'Job Postings', maxValue: -1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'candidate_views', limitName: 'Candidate Views', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'team_members', limitName: 'Team Members', maxValue: -1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
    ],
    addons: [],
    trialConfig: { enabled: true, durationDays: 30, requiresPaymentMethod: false, autoConvert: false, notifyDaysBefore: [14, 7, 3, 1] },
    upgradeRules: { allowImmediate: true, prorateCredit: true, preserveTrialDays: true },
    downgradeRules: { allowImmediate: false, effectiveAtPeriodEnd: true, gracePeriodDays: 30, dataRetentionDays: 365 },
    renewalRules: { autoRenew: true, retryAttempts: 5, retryIntervalDays: 2, notifyDaysBefore: [30, 14, 7, 1], dunningEnabled: true },
    gracePeriodDays: 30,
  },
];

// ============================================================
// Job Seeker Plans Database
// ============================================================

const SEEKER_PLANS_DB: PlanConfig[] = [
  {
    id: 'seeker_free', name: 'Free', type: 'job_seeker', description: 'seeker_plan_free_desc',
    tier: 0, isActive: true, isPublic: true, sortOrder: 0, metadata: {},
    pricing: { monthly: 0, quarterly: 0, semiAnnual: 0, annual: 0, lifetime: 0, currency: 'USD', discounts: [] },
    features: [
      { featureId: 'ai_matching', featureName: 'AI Matching', enabled: true, tier: 0 },
    ],
    limits: [
      { limitId: 'swipes_per_day', limitName: 'Swipes/Day', maxValue: 10, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'messages_per_day', limitName: 'Messages/Day', maxValue: 10, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'profile_views', limitName: 'Profile Views', maxValue: 10, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'saved_jobs', limitName: 'Saved Jobs', maxValue: 20, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'ai_matches_per_day', limitName: 'AI Matches/Day', maxValue: 5, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
    ],
    addons: [], trialConfig: { enabled: false, durationDays: 0, requiresPaymentMethod: false, autoConvert: false, notifyDaysBefore: [] },
    upgradeRules: { allowImmediate: true, prorateCredit: false, preserveTrialDays: false },
    downgradeRules: { allowImmediate: true, effectiveAtPeriodEnd: false, gracePeriodDays: 0, dataRetentionDays: 30 },
    renewalRules: { autoRenew: false, retryAttempts: 0, retryIntervalDays: 0, notifyDaysBefore: [], dunningEnabled: false },
    gracePeriodDays: 0,
  },
  {
    id: 'seeker_premium', name: 'Premium', type: 'job_seeker', description: 'seeker_plan_premium_new_desc',
    tier: 1, isActive: true, isPublic: true, sortOrder: 1, metadata: { popular: true },
    pricing: { monthly: 19.99, quarterly: 53.97, semiAnnual: 99.94, annual: 179.88, lifetime: -1, currency: 'USD', discounts: [{ cycle: 'annual', percentage: 25 }, { cycle: 'quarterly', percentage: 10 }] },
    features: [
      { featureId: 'ai_matching', featureName: 'AI Matching', enabled: true, tier: 1 },
      { featureId: 'ai_recommendations', featureName: 'AI Recommendations', enabled: true, tier: 1 },
      { featureId: 'discoverability', featureName: 'Discoverability', enabled: true, tier: 1 },
      { featureId: 'contact_requests', featureName: 'Contact Requests', enabled: true, tier: 1 },
      { featureId: 'profile_analytics', featureName: 'Profile Analytics', enabled: true, tier: 1 },
      { featureId: 'exposure_dashboard', featureName: 'Exposure Dashboard', enabled: true, tier: 1 },
    ],
    limits: [
      { limitId: 'swipes_per_day', limitName: 'Swipes/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'messages_per_day', limitName: 'Messages/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'profile_views', limitName: 'Profile Views', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'saved_jobs', limitName: 'Saved Jobs', maxValue: -1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'ai_matches_per_day', limitName: 'AI Matches/Day', maxValue: 50, resetPeriod: 'daily', overagePolicy: 'warn', warningThreshold: 80 },
    ],
    addons: ['extra_ai_credits'],
    trialConfig: { enabled: true, durationDays: 7, requiresPaymentMethod: true, autoConvert: true, notifyDaysBefore: [3, 1] },
    upgradeRules: { allowImmediate: true, prorateCredit: true, preserveTrialDays: false },
    downgradeRules: { allowImmediate: false, effectiveAtPeriodEnd: true, gracePeriodDays: 3, dataRetentionDays: 30 },
    renewalRules: { autoRenew: true, retryAttempts: 3, retryIntervalDays: 3, notifyDaysBefore: [7, 3, 1], dunningEnabled: true },
    gracePeriodDays: 3,
  },
  {
    id: 'seeker_premium_plus', name: 'Premium+', type: 'job_seeker', description: 'seeker_plan_premium_plus_desc',
    tier: 2, isActive: true, isPublic: true, sortOrder: 2, metadata: {},
    pricing: { monthly: 39.99, quarterly: 107.97, semiAnnual: 199.94, annual: 359.88, lifetime: -1, currency: 'USD', discounts: [{ cycle: 'annual', percentage: 25 }, { cycle: 'quarterly', percentage: 10 }] },
    features: [
      { featureId: 'ai_matching', featureName: 'AI Matching', enabled: true, tier: 2 },
      { featureId: 'ai_recommendations', featureName: 'AI Recommendations', enabled: true, tier: 2 },
      { featureId: 'discoverability', featureName: 'Discoverability', enabled: true, tier: 2 },
      { featureId: 'featured_candidate', featureName: 'Featured Candidate', enabled: true, tier: 2 },
      { featureId: 'contact_requests', featureName: 'Contact Requests', enabled: true, tier: 2 },
      { featureId: 'profile_analytics', featureName: 'Profile Analytics', enabled: true, tier: 2 },
      { featureId: 'exposure_dashboard', featureName: 'Exposure Dashboard', enabled: true, tier: 2 },
      { featureId: 'video_intro', featureName: 'Video Intro', enabled: true, tier: 2 },
      { featureId: 'salary_insights', featureName: 'Salary Insights', enabled: true, tier: 2 },
      { featureId: 'interview_prep', featureName: 'Interview Prep', enabled: true, tier: 2 },
      { featureId: 'priority_support', featureName: 'Priority Support', enabled: true, tier: 2 },
    ],
    limits: [
      { limitId: 'swipes_per_day', limitName: 'Swipes/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'messages_per_day', limitName: 'Messages/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'profile_views', limitName: 'Profile Views', maxValue: -1, resetPeriod: 'monthly', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'saved_jobs', limitName: 'Saved Jobs', maxValue: -1, resetPeriod: 'never', overagePolicy: 'block', warningThreshold: 80 },
      { limitId: 'ai_matches_per_day', limitName: 'AI Matches/Day', maxValue: -1, resetPeriod: 'daily', overagePolicy: 'block', warningThreshold: 80 },
    ],
    addons: ['extra_ai_credits', 'resume_builder', 'career_coach', 'interview_coach'],
    trialConfig: { enabled: true, durationDays: 7, requiresPaymentMethod: true, autoConvert: true, notifyDaysBefore: [3, 1] },
    upgradeRules: { allowImmediate: true, prorateCredit: true, preserveTrialDays: false },
    downgradeRules: { allowImmediate: false, effectiveAtPeriodEnd: true, gracePeriodDays: 3, dataRetentionDays: 60 },
    renewalRules: { autoRenew: true, retryAttempts: 3, retryIntervalDays: 3, notifyDaysBefore: [7, 3, 1], dunningEnabled: true },
    gracePeriodDays: 5,
  },
];

// ============================================================
// Add-ons Database
// ============================================================

const ADDONS_DB: Addon[] = [
  { id: 'extra_seats', name: 'Extra Recruiter Seats', description: 'addon_extra_seats_desc', category: 'seats', pricing: { monthly: 15, annual: 144, currency: 'USD' }, quantity: 1, unit: 'seat', applicablePlans: ['company_premium', 'company_enterprise'], isActive: true, metadata: {} },
  { id: 'extra_exports', name: 'Extra Candidate Exports', description: 'addon_extra_exports_desc', category: 'exports', pricing: { monthly: 10, annual: 96, currency: 'USD' }, quantity: 50, unit: 'exports/mo', applicablePlans: ['company_premium', 'company_enterprise'], isActive: true, metadata: {} },
  { id: 'extra_ai_credits', name: 'Additional AI Credits', description: 'addon_extra_ai_desc', category: 'ai_credits', pricing: { monthly: 20, annual: 192, currency: 'USD' }, quantity: 100, unit: 'credits/mo', applicablePlans: ['company_premium', 'company_enterprise', 'seeker_premium', 'seeker_premium_plus'], isActive: true, metadata: {} },
  { id: 'extra_storage', name: 'Additional Storage', description: 'addon_extra_storage_desc', category: 'storage', pricing: { monthly: 5, annual: 48, currency: 'USD' }, quantity: 5, unit: 'GB', applicablePlans: ['company_premium', 'company_enterprise'], isActive: true, metadata: {} },
  { id: 'premium_analytics', name: 'Premium Analytics', description: 'addon_premium_analytics_desc', category: 'analytics', pricing: { monthly: 25, annual: 240, currency: 'USD' }, quantity: 1, unit: 'module', applicablePlans: ['company_premium', 'company_enterprise'], isActive: true, metadata: {} },
  { id: 'api_access_addon', name: 'API Access', description: 'addon_api_access_desc', category: 'api', pricing: { monthly: 50, annual: 480, currency: 'USD' }, quantity: 1, unit: 'module', applicablePlans: ['company_enterprise'], isActive: true, metadata: {} },
  { id: 'multi_brand', name: 'Multiple Brands', description: 'addon_multi_brand_desc', category: 'branding', pricing: { monthly: 30, annual: 288, currency: 'USD' }, quantity: 3, unit: 'brands', applicablePlans: ['company_enterprise'], isActive: true, metadata: {} },
  { id: 'extra_locations', name: 'Additional Locations', description: 'addon_extra_locations_desc', category: 'locations', pricing: { monthly: 10, annual: 96, currency: 'USD' }, quantity: 1, unit: 'location', applicablePlans: ['company_premium', 'company_enterprise'], isActive: true, metadata: {} },
  { id: 'ai_modules', name: 'AI Modules Pack', description: 'addon_ai_modules_desc', category: 'modules', pricing: { monthly: 75, annual: 720, currency: 'USD' }, quantity: 1, unit: 'pack', applicablePlans: ['company_enterprise'], isActive: true, metadata: {} },
  { id: 'resume_builder', name: 'Resume Builder', description: 'addon_resume_builder_desc', category: 'modules', pricing: { monthly: 9.99, annual: 95.88, currency: 'USD' }, quantity: 1, unit: 'module', applicablePlans: ['seeker_premium', 'seeker_premium_plus'], isActive: true, metadata: {} },
  { id: 'career_coach', name: 'AI Career Coach', description: 'addon_career_coach_desc', category: 'modules', pricing: { monthly: 14.99, annual: 143.88, currency: 'USD' }, quantity: 1, unit: 'module', applicablePlans: ['seeker_premium_plus'], isActive: true, metadata: {} },
  { id: 'interview_coach', name: 'Interview Coach', description: 'addon_interview_coach_desc', category: 'modules', pricing: { monthly: 12.99, annual: 124.68, currency: 'USD' }, quantity: 1, unit: 'module', applicablePlans: ['seeker_premium_plus'], isActive: true, metadata: {} },
];

// ============================================================
// Payment Providers Database
// ============================================================

const PAYMENT_PROVIDERS_DB: PaymentProvider[] = [
  { id: 'stripe', name: 'Stripe', icon: '💳', available: true, supportedMethods: ['credit_card', 'debit_card'], supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'], regions: ['global'] },
  { id: 'moyasar', name: 'Moyasar', icon: '🏦', available: true, supportedMethods: ['credit_card', 'debit_card', 'mada'], supportedCurrencies: ['SAR', 'USD'], regions: ['SA', 'AE', 'BH', 'KW', 'OM', 'QA'] },
  { id: 'apple_pay', name: 'Apple Pay', icon: '🍎', available: true, supportedMethods: ['apple_pay'], supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'], regions: ['global'] },
  { id: 'google_pay', name: 'Google Pay', icon: '🟢', available: true, supportedMethods: ['google_pay'], supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'], regions: ['global'] },
  { id: 'mada', name: 'Mada', icon: '🇸🇦', available: true, supportedMethods: ['mada'], supportedCurrencies: ['SAR'], regions: ['SA'] },
  { id: 'stc_pay', name: 'STC Pay', icon: '📱', available: false, supportedMethods: ['stc_pay'], supportedCurrencies: ['SAR'], regions: ['SA'] },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏛️', available: false, supportedMethods: ['bank_transfer'], supportedCurrencies: ['USD', 'SAR', 'EUR'], regions: ['global'] },
];

// ============================================================
// Compliance Configuration
// ============================================================

const COMPLIANCE_CONFIG: ComplianceConfig = {
  gdpr: { enabled: true, dataExportEnabled: true, rightToDeleteEnabled: true, consentRequired: true },
  ccpa: { enabled: true, doNotSellEnabled: true, dataDisclosureEnabled: true },
  pdpl: { enabled: true, crossBorderTransferConsent: true, dataLocalization: true },
  dataRetention: { activeAccountDays: 3650, deletedAccountDays: 90, billingRecordsDays: 2555, auditLogDays: 365 },
};

// ============================================================
// Billing Engine Class
// ============================================================

class BillingEngine {
  private plans: PlanConfig[] = [...COMPANY_PLANS_DB, ...SEEKER_PLANS_DB];
  private addons: Addon[] = ADDONS_DB;
  private providers: PaymentProvider[] = PAYMENT_PROVIDERS_DB;
  private compliance: ComplianceConfig = COMPLIANCE_CONFIG;

  // --- Plan Management ---

  getPlans(type?: PlanType): PlanConfig[] {
    const filtered = type ? this.plans.filter(p => p.type === type && p.isActive && p.isPublic) : this.plans.filter(p => p.isActive && p.isPublic);
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPlanById(planId: string): PlanConfig | undefined {
    return this.plans.find(p => p.id === planId);
  }

  getPlanPrice(planId: string, cycle: BillingCycleType): number {
    const plan = this.getPlanById(planId);
    if (!plan) return 0;
    const priceMap: Record<BillingCycleType, number> = {
      monthly: plan.pricing.monthly,
      quarterly: plan.pricing.quarterly,
      semi_annual: plan.pricing.semiAnnual,
      annual: plan.pricing.annual,
      lifetime: plan.pricing.lifetime,
    };
    return priceMap[cycle] ?? plan.pricing.monthly;
  }

  getEffectiveMonthlyPrice(planId: string, cycle: BillingCycleType): number {
    const total = this.getPlanPrice(planId, cycle);
    if (total <= 0) return total;
    const months: Record<BillingCycleType, number> = { monthly: 1, quarterly: 3, semi_annual: 6, annual: 12, lifetime: 1 };
    return Math.round((total / months[cycle]) * 100) / 100;
  }

  getSavingsPercentage(planId: string, cycle: BillingCycleType): number {
    if (cycle === 'monthly') return 0;
    const plan = this.getPlanById(planId);
    if (!plan || plan.pricing.monthly <= 0) return 0;
    const effectiveMonthly = this.getEffectiveMonthlyPrice(planId, cycle);
    if (effectiveMonthly <= 0) return 0;
    return Math.round((1 - effectiveMonthly / plan.pricing.monthly) * 100);
  }

  // --- Feature Entitlements ---

  hasFeature(planId: string, featureId: FeatureId): boolean {
    const plan = this.getPlanById(planId);
    if (!plan) return false;
    const feature = plan.features.find(f => f.featureId === featureId);
    return feature?.enabled ?? false;
  }

  getEntitlements(planId: string): FeatureEntitlement[] {
    const plan = this.getPlanById(planId);
    return plan?.features ?? [];
  }

  // --- Usage Limits ---

  getUsageLimits(planId: string): UsageLimit[] {
    const plan = this.getPlanById(planId);
    return plan?.limits ?? [];
  }

  getUsageLimit(planId: string, limitId: string): UsageLimit | undefined {
    const plan = this.getPlanById(planId);
    return plan?.limits.find(l => l.limitId === limitId);
  }

  checkUsage(planId: string, limitId: string, currentUsage: number): UsageRecord {
    const limit = this.getUsageLimit(planId, limitId);
    if (!limit) {
      return { limitId, used: currentUsage, limit: 0, resetDate: '', percentage: 100, isNearLimit: true, isAtLimit: true, isUnlimited: false };
    }
    const isUnlimited = limit.maxValue === -1;
    const percentage = isUnlimited ? 0 : Math.min((currentUsage / limit.maxValue) * 100, 100);
    return {
      limitId,
      used: currentUsage,
      limit: limit.maxValue,
      resetDate: this.getNextResetDate(limit.resetPeriod),
      percentage,
      isNearLimit: !isUnlimited && percentage >= limit.warningThreshold,
      isAtLimit: !isUnlimited && currentUsage >= limit.maxValue,
      isUnlimited,
    };
  }

  private getNextResetDate(period: string): string {
    const now = new Date();
    switch (period) {
      case 'daily': return new Date(now.getTime() + 86400000).toISOString();
      case 'weekly': return new Date(now.getTime() + 604800000).toISOString();
      case 'monthly': return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      case 'yearly': return new Date(now.getFullYear() + 1, 0, 1).toISOString();
      default: return '';
    }
  }

  // --- Add-ons ---

  getAddons(planId?: string): Addon[] {
    if (!planId) return this.addons.filter(a => a.isActive);
    return this.addons.filter(a => a.isActive && a.applicablePlans.includes(planId));
  }

  getAddonById(addonId: string): Addon | undefined {
    return this.addons.find(a => a.id === addonId);
  }

  // --- Payment Providers ---

  getPaymentProviders(region?: string): PaymentProvider[] {
    if (!region) return this.providers.filter(p => p.available);
    return this.providers.filter(p => p.available && (p.regions.includes('global') || p.regions.includes(region)));
  }

  // --- Trial Management ---

  getTrialConfig(planId: string): TrialConfig | undefined {
    const plan = this.getPlanById(planId);
    return plan?.trialConfig;
  }

  isTrialEligible(planId: string): boolean {
    const trial = this.getTrialConfig(planId);
    return trial?.enabled ?? false;
  }

  // --- Promotions ---

  applyPromotion(basePrice: number, promotion: Promotion): { discountedPrice: number; savings: number } {
    if (!promotion.isActive || new Date(promotion.validUntil) < new Date()) {
      return { discountedPrice: basePrice, savings: 0 };
    }
    if (promotion.maxUses > 0 && promotion.currentUses >= promotion.maxUses) {
      return { discountedPrice: basePrice, savings: 0 };
    }
    let savings = 0;
    if (promotion.discountType === 'percentage') {
      savings = Math.round(basePrice * (promotion.discountValue / 100) * 100) / 100;
    } else {
      savings = Math.min(promotion.discountValue, basePrice);
    }
    return { discountedPrice: Math.round((basePrice - savings) * 100) / 100, savings };
  }

  // --- Upgrade/Downgrade ---

  canUpgrade(currentPlanId: string, targetPlanId: string): boolean {
    const current = this.getPlanById(currentPlanId);
    const target = this.getPlanById(targetPlanId);
    if (!current || !target) return false;
    return target.tier > current.tier && current.type === target.type;
  }

  canDowngrade(currentPlanId: string, targetPlanId: string): boolean {
    const current = this.getPlanById(currentPlanId);
    const target = this.getPlanById(targetPlanId);
    if (!current || !target) return false;
    return target.tier < current.tier && current.type === target.type;
  }

  calculateProratedCredit(currentPlanId: string, cycle: BillingCycleType, daysRemaining: number, totalDays: number): number {
    const price = this.getPlanPrice(currentPlanId, cycle);
    if (price <= 0) return 0;
    return Math.round((price * (daysRemaining / totalDays)) * 100) / 100;
  }

  // --- Compliance ---

  getComplianceConfig(): ComplianceConfig {
    return this.compliance;
  }

  // --- Analytics Helpers ---

  calculateMRR(subscriptions: SubscriptionRecord[]): number {
    return subscriptions.reduce((total, sub) => {
      if (sub.status !== 'active' && sub.status !== 'trialing') return total;
      const plan = this.getPlanById(sub.planId);
      if (!plan) return total;
      return total + this.getEffectiveMonthlyPrice(sub.planId, sub.billingCycle);
    }, 0);
  }

  calculateARR(mrr: number): number {
    return Math.round(mrr * 12 * 100) / 100;
  }

  calculateChurnRate(canceledCount: number, totalAtStart: number): number {
    if (totalAtStart === 0) return 0;
    return Math.round((canceledCount / totalAtStart) * 100 * 100) / 100;
  }

  calculateLTV(arpu: number, churnRate: number): number {
    if (churnRate === 0) return arpu * 60; // assume 5 year if no churn
    return Math.round((arpu / (churnRate / 100)) * 100) / 100;
  }
}

// Singleton export
export const billingEngine = new BillingEngine();

// ============================================================
// Mock Data Generators for Demo
// ============================================================

export function generateMockSubscription(userId: string, planId: string): SubscriptionRecord {
  const plan = billingEngine.getPlanById(planId);
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 86400000);
  return {
    id: `sub_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    planId,
    planName: plan?.name ?? 'Unknown',
    planType: plan?.type ?? 'company',
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    paymentProvider: 'stripe',
    addons: [],
    metadata: {},
    createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function generateMockTransactions(count: number): PaymentTransaction[] {
  const statuses: TransactionStatus[] = ['completed', 'completed', 'completed', 'pending', 'failed'];
  const providers: PaymentProviderType[] = ['stripe', 'moyasar', 'apple_pay', 'google_pay'];
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.now() - i * 30 * 86400000);
    return {
      id: `txn_${Math.random().toString(36).slice(2, 10)}`,
      subscriptionId: `sub_demo`,
      userId: 'user_demo',
      amount: [49, 149, 19.99, 39.99][i % 4],
      currency: 'USD',
      status: statuses[i % statuses.length],
      provider: providers[i % providers.length],
      method: 'credit_card',
      description: `Subscription payment - ${['Premium', 'Enterprise', 'Premium', 'Premium+'][i % 4]}`,
      invoiceId: `inv_${String(i + 1).padStart(3, '0')}`,
      metadata: {},
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    };
  });
}

export function generateMockInvoices(count: number): InvoiceRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.now() - i * 30 * 86400000);
    const amount = [49, 149, 19.99, 39.99][i % 4];
    const tax = Math.round(amount * 0.15 * 100) / 100;
    return {
      id: `inv_${String(i + 1).padStart(3, '0')}`,
      userId: 'user_demo',
      subscriptionId: 'sub_demo',
      number: `INV-2026-${String(i + 1).padStart(4, '0')}`,
      amount,
      tax,
      total: Math.round((amount + tax) * 100) / 100,
      currency: 'USD',
      status: i === 0 ? 'paid' : i === 1 ? 'paid' : 'paid',
      dueDate: date.toISOString(),
      paidDate: date.toISOString(),
      lineItems: [{ description: `${['Premium', 'Enterprise', 'Premium', 'Premium+'][i % 4]} Plan - Monthly`, quantity: 1, unitPrice: amount, total: amount }],
      createdAt: date.toISOString(),
    };
  });
}

export function generateMockAnalytics(): BillingAnalytics {
  return {
    mrr: 45230,
    arr: 542760,
    activeSubscribers: 1247,
    trialUsers: 89,
    trialConversionRate: 34.2,
    upgradeRate: 12.5,
    downgradeRate: 3.2,
    cancellationRate: 5.1,
    churnRate: 4.8,
    arpu: 36.27,
    ltv: 755.63,
    revenueGrowth: 18.3,
    popularPlans: [
      { planId: 'company_premium', planName: 'Company Premium', count: 534, revenue: 26166 },
      { planId: 'seeker_premium', planName: 'Seeker Premium', count: 412, revenue: 8231.88 },
      { planId: 'company_enterprise', planName: 'Company Enterprise', count: 156, revenue: 23244 },
      { planId: 'seeker_premium_plus', planName: 'Seeker Premium+', count: 145, revenue: 5798.55 },
    ],
    popularAddons: [
      { addonId: 'extra_ai_credits', addonName: 'AI Credits', count: 234, revenue: 4680 },
      { addonId: 'extra_seats', addonName: 'Recruiter Seats', count: 178, revenue: 2670 },
      { addonId: 'premium_analytics', addonName: 'Premium Analytics', count: 89, revenue: 2225 },
      { addonId: 'extra_storage', addonName: 'Extra Storage', count: 67, revenue: 335 },
    ],
    revenueByCountry: [
      { country: 'Saudi Arabia', revenue: 18500, subscribers: 456 },
      { country: 'UAE', revenue: 12300, subscribers: 312 },
      { country: 'Egypt', revenue: 5600, subscribers: 189 },
      { country: 'Jordan', revenue: 3200, subscribers: 98 },
      { country: 'Other', revenue: 5630, subscribers: 192 },
    ],
    revenueByIndustry: [
      { industry: 'Technology', revenue: 15200 },
      { industry: 'Healthcare', revenue: 8900 },
      { industry: 'Finance', revenue: 7600 },
      { industry: 'Education', revenue: 5400 },
      { industry: 'Retail', revenue: 4100 },
      { industry: 'Other', revenue: 4030 },
    ],
    revenueBySize: [
      { size: '1-10', revenue: 5200 },
      { size: '11-50', revenue: 12400 },
      { size: '51-200', revenue: 15600 },
      { size: '201-1000', revenue: 8900 },
      { size: '1000+', revenue: 3130 },
    ],
    monthlyRevenue: [
      { month: 'Jan', revenue: 32000, subscribers: 980 },
      { month: 'Feb', revenue: 34500, subscribers: 1020 },
      { month: 'Mar', revenue: 36800, subscribers: 1065 },
      { month: 'Apr', revenue: 38200, subscribers: 1110 },
      { month: 'May', revenue: 40100, subscribers: 1158 },
      { month: 'Jun', revenue: 42800, subscribers: 1200 },
      { month: 'Jul', revenue: 45230, subscribers: 1247 },
    ],
  };
}

export default billingEngine;