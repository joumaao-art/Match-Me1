/**
 * Admin-specific types.
 */

export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReportType = 'user_report' | 'content_report' | 'bug_report' | 'fraud_report';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import';
export type NotificationType = 'match' | 'message' | 'application' | 'interview' | 'system' | 'payment' | 'profile_view';

export interface AdminUser {
  id: string;
  userId: string;
  displayName: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  sessionId?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedContentId?: string;
  reportedContentType?: string;
  type: ReportType;
  reason: string;
  description?: string;
  evidenceUrls: string[];
  status: TicketStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  attachmentUrls: string[];
  resolution?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  satisfactionRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrail {
  id: string;
  userId?: string;
  action: AuditAction;
  tableName: string;
  recordId?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  changedFields: string[];
  ipAddress?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  eventName: string;
  eventCategory?: string;
  eventData?: Record<string, any>;
  pageUrl?: string;
  deviceType?: string;
  country?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalJobSeekers: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  totalMatches: number;
  activeSubscriptions: number;
  revenue: number;
  newUsersToday: number;
  newJobsToday: number;
}