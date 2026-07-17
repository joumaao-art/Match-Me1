/**
 * Shared type definitions for the MatchMe platform.
 * Re-exports from @matchme/shared for backward compatibility,
 * plus any web-specific types.
 */

// Re-export all shared types
export type {
  // Auth
  UserRole,
  AuthUser,
  AuthSession,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  // Users
  UserProfile,
  JobSeekerProfile,
  CompanyProfile,
  Recruiter,
  Education,
  Experience,
  Certificate,
  UserSkill,
  UserLanguage,
  Resume,
  Gender,
  EmploymentType,
  EducationLevel,
  ProficiencyLevel,
  SkillLevel,
  // Jobs
  Job,
  JobCard,
  SavedJob,
  Application,
  SwipeHistoryItem,
  Match,
  VacancyStatus,
  SwipeDirection,
  MatchStatus,
  ApplicationStatus,
  // Company
  CompanyBranch,
  CompanyStats,
  // Messaging
  Conversation,
  Message,
  ConversationWithDetails,
  MessageType,
  // Subscription
  PlanDefinition,
  UserSubscription,
  Payment,
  Invoice,
  InvoiceLineItem,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  PaymentStatus,
  InvoiceStatus,
  // Admin
  AdminUser,
  AdminLog,
  ActivityLog,
  Report,
  SupportTicket,
  AuditTrail,
  Notification,
  AnalyticsEvent,
  DashboardStats,
  TicketStatus,
  TicketPriority,
  ReportType,
  AuditAction,
  NotificationType,
  // Common
  ApiResponse,
  ApiError,
  PaginatedResponse,
  Locale,
  Direction,
  Theme,
  SelectOption,
  DateRange,
  GeoLocation,
  FileUpload,
} from '@matchme/shared';

// Legacy type aliases for backward compatibility with existing pages
export type { Job as Vacancy } from '@matchme/shared';
export type { Match as JobMatch } from '@matchme/shared';