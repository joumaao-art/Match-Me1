/**
 * Super Admin Platform Service
 * Centralized service for all platform administration operations.
 * Handles: Authentication, User Management, Company Management, 
 * Subscriptions, Billing, Impersonation, Notifications, Feature Flags,
 * Global Search, Audit Logging, Platform Health.
 */

// ============================================================
// Types
// ============================================================

export type AdminRole = 'super_admin' | 'support_admin' | 'billing_admin' | 'content_admin';

export interface AdminSession {
  id: string;
  adminId: string;
  email: string;
  role: AdminRole;
  mfaVerified: boolean;
  trustedDevice: boolean;
  ipAddress: string;
  loginAt: string;
  lastActivity: string;
  expiresAt: string;
}

export interface ImpersonationSession {
  active: boolean;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: 'company_owner' | 'recruiter' | 'hiring_manager' | 'job_seeker';
  startedAt: string;
  reason: 'support' | 'debugging' | 'training';
  adminId: string;
  adminName: string;
}

export interface PlatformMetrics {
  totalCompanies: number;
  verifiedCompanies: number;
  pendingCompanies: number;
  suspendedCompanies: number;
  totalJobSeekers: number;
  premiumUsers: number;
  premiumPlusUsers: number;
  companiesByPlan: Record<string, number>;
  jobsPosted: number;
  applications: number;
  matches: number;
  interviews: number;
  offers: number;
  hires: number;
  candidateDirectoryProfiles: number;
  featuredCandidates: number;
  monthlyRevenue: number;
  mrr: number;
  arr: number;
  activeTrials: number;
  supportTickets: number;
  platformHealth: {
    api: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
    realtime: 'healthy' | 'degraded' | 'down';
    ai: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
  };
}

export interface CompanyRecord {
  id: string;
  name: string;
  email: string;
  industry: string;
  size: string;
  plan: string;
  status: 'active' | 'suspended' | 'pending_verification' | 'rejected';
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'suspended';
  recruiters: number;
  hiringManagers: number;
  activeJobs: number;
  totalHires: number;
  revenue: number;
  joinedAt: string;
  lastActive: string;
  country: string;
}

export interface JobSeekerRecord {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  plan: string;
  visibility: 'public' | 'anonymous' | 'private';
  featured: boolean;
  applications: number;
  matches: number;
  messages: number;
  profileScore: number;
  joinedAt: string;
  lastActive: string;
  country: string;
  skills: string[];
}

export interface GlobalSearchResult {
  id: string;
  type: 'company' | 'job_seeker' | 'recruiter' | 'job' | 'invoice' | 'payment' | 'ticket' | 'audit_log' | 'subscription' | 'message' | 'report';
  title: string;
  subtitle: string;
  status?: string;
  relevance: number;
}

export interface PlatformNotification {
  id: string;
  title: string;
  content: string;
  audience: 'all' | 'premium' | 'companies' | 'job_seekers' | 'segment';
  segmentFilter?: string;
  channels: ('email' | 'push' | 'in_app' | 'sms')[];
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount?: number;
  openRate?: number;
  createdBy: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  user: string;
  userType: 'company' | 'job_seeker';
  subject: string;
  description: string;
  category: 'billing' | 'technical' | 'account' | 'feature_request' | 'bug_report' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  assignedTo?: string;
  slaDeadline?: string;
  slaBreached: boolean;
  messages: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface FeatureFlagConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetCountries: string[];
  targetPlans: string[];
  targetCompanies: string[];
  targetUsers: string[];
  category: 'core' | 'ai' | 'billing' | 'marketplace' | 'beta' | 'candidate_directory';
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'impersonate' | 'export' | 'suspend' | 'reactivate' | 'refund';
  resource: string;
  resourceId: string;
  details: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

// ============================================================
// Mock Data
// ============================================================

export const mockPlatformMetrics: PlatformMetrics = {
  totalCompanies: 3915,
  verifiedCompanies: 3482,
  pendingCompanies: 287,
  suspendedCompanies: 146,
  totalJobSeekers: 8932,
  premiumUsers: 1847,
  premiumPlusUsers: 623,
  companiesByPlan: { Free: 1200, Starter: 1450, Business: 890, Enterprise: 375 },
  jobsPosted: 2456,
  applications: 18234,
  matches: 4521,
  interviews: 1893,
  offers: 847,
  hires: 612,
  candidateDirectoryProfiles: 6234,
  featuredCandidates: 342,
  monthlyRevenue: 284500,
  mrr: 47200,
  arr: 566400,
  activeTrials: 234,
  supportTickets: 23,
  platformHealth: {
    api: 'healthy',
    database: 'healthy',
    realtime: 'healthy',
    ai: 'healthy',
    storage: 'healthy',
  },
};

export const mockCompanies: CompanyRecord[] = [
  { id: 'c1', name: 'TechCorp Inc', email: 'admin@techcorp.com', industry: 'Technology', size: '201-500', plan: 'Enterprise', status: 'active', verificationStatus: 'verified', recruiters: 12, hiringManagers: 5, activeJobs: 8, totalHires: 45, revenue: 3588, joinedAt: '2026-04-10', lastActive: '5 mins ago', country: 'Saudi Arabia' },
  { id: 'c2', name: 'Sara Technologies', email: 'hr@saratech.com', industry: 'Technology', size: '51-200', plan: 'Business', status: 'active', verificationStatus: 'verified', recruiters: 6, hiringManagers: 3, activeJobs: 5, totalHires: 23, revenue: 1188, joinedAt: '2026-05-20', lastActive: '1 hour ago', country: 'UAE' },
  { id: 'c3', name: 'Global Solutions', email: 'info@globalsol.com', industry: 'Consulting', size: '501-1000', plan: 'Starter', status: 'active', verificationStatus: 'pending', recruiters: 3, hiringManagers: 2, activeJobs: 2, totalHires: 8, revenue: 588, joinedAt: '2026-03-22', lastActive: '30 mins ago', country: 'Saudi Arabia' },
  { id: 'c4', name: 'InnovateTech', email: 'hr@innovatetech.com', industry: 'AI/ML', size: '11-50', plan: 'Business', status: 'suspended', verificationStatus: 'rejected', recruiters: 2, hiringManagers: 1, activeJobs: 0, totalHires: 3, revenue: 297, joinedAt: '2026-06-01', lastActive: '3 days ago', country: 'Egypt' },
  { id: 'c5', name: 'BuildRight Construction', email: 'jobs@buildright.com', industry: 'Construction', size: '1001-5000', plan: 'Enterprise', status: 'active', verificationStatus: 'verified', recruiters: 15, hiringManagers: 8, activeJobs: 12, totalHires: 67, revenue: 3588, joinedAt: '2026-02-15', lastActive: '2 hours ago', country: 'Saudi Arabia' },
  { id: 'c6', name: 'HealthFirst Medical', email: 'recruit@healthfirst.com', industry: 'Healthcare', size: '201-500', plan: 'Business', status: 'active', verificationStatus: 'verified', recruiters: 8, hiringManagers: 4, activeJobs: 6, totalHires: 34, revenue: 1188, joinedAt: '2026-01-10', lastActive: '15 mins ago', country: 'Bahrain' },
  { id: 'c7', name: 'EduLearn Platform', email: 'team@edulearn.com', industry: 'Education', size: '11-50', plan: 'Free', status: 'pending_verification', verificationStatus: 'pending', recruiters: 1, hiringManagers: 1, activeJobs: 1, totalHires: 0, revenue: 0, joinedAt: '2026-07-15', lastActive: '1 day ago', country: 'Jordan' },
];

export const mockJobSeekers: JobSeekerRecord[] = [
  { id: 's1', name: 'Ahmed Al-Rashid', email: 'ahmed@email.com', status: 'active', plan: 'Premium', visibility: 'public', featured: true, applications: 12, matches: 8, messages: 34, profileScore: 94, joinedAt: '2026-06-15', lastActive: '2 hours ago', country: 'Saudi Arabia', skills: ['React', 'TypeScript', 'Node.js'] },
  { id: 's2', name: 'Fatima Noor', email: 'fatima@email.com', status: 'active', plan: 'Premium+', visibility: 'public', featured: true, applications: 8, matches: 6, messages: 21, profileScore: 91, joinedAt: '2026-05-10', lastActive: '30 mins ago', country: 'UAE', skills: ['UX Design', 'Figma', 'Research'] },
  { id: 's3', name: 'Omar Hassan', email: 'omar@email.com', status: 'suspended', plan: 'Free', visibility: 'private', featured: false, applications: 3, matches: 1, messages: 5, profileScore: 45, joinedAt: '2026-07-01', lastActive: '3 days ago', country: 'Egypt', skills: ['Marketing', 'SEO'] },
  { id: 's4', name: 'Layla Ibrahim', email: 'layla@email.com', status: 'active', plan: 'Premium', visibility: 'anonymous', featured: false, applications: 15, matches: 10, messages: 42, profileScore: 87, joinedAt: '2026-04-20', lastActive: '1 hour ago', country: 'Saudi Arabia', skills: ['Product Management', 'Agile', 'Data Analysis'] },
  { id: 's5', name: 'Khalid Mohammed', email: 'khalid@email.com', status: 'active', plan: 'Free', visibility: 'public', featured: false, applications: 5, matches: 2, messages: 8, profileScore: 62, joinedAt: '2026-06-28', lastActive: '4 hours ago', country: 'Kuwait', skills: ['Java', 'Spring Boot', 'AWS'] },
  { id: 's6', name: 'Nora Al-Saud', email: 'nora@email.com', status: 'banned', plan: 'Premium', visibility: 'private', featured: false, applications: 0, matches: 0, messages: 0, profileScore: 78, joinedAt: '2026-03-15', lastActive: '1 week ago', country: 'Saudi Arabia', skills: ['Finance', 'Accounting'] },
  { id: 's7', name: 'Youssef Amr', email: 'youssef@email.com', status: 'active', plan: 'Premium+', visibility: 'public', featured: true, applications: 20, matches: 14, messages: 56, profileScore: 96, joinedAt: '2026-02-01', lastActive: '10 mins ago', country: 'Saudi Arabia', skills: ['AI/ML', 'Python', 'TensorFlow', 'Data Science'] },
];

export const mockSupportTickets: SupportTicket[] = [
  { id: 'TKT-001', user: 'Ahmed Al-Rashid', userType: 'job_seeker', subject: 'Cannot upload CV', description: 'Getting error when trying to upload PDF CV file', category: 'technical', priority: 'high', status: 'open', assignedTo: 'Support Team', slaDeadline: '2026-07-17 10:30', slaBreached: false, messages: 3, createdAt: '2026-07-16 10:30', updatedAt: '2026-07-16 14:20', resolvedAt: undefined },
  { id: 'TKT-002', user: 'TechCorp Inc', userType: 'company', subject: 'Billing discrepancy', description: 'Charged twice for Enterprise plan', category: 'billing', priority: 'high', status: 'in_progress', assignedTo: 'Billing Team', slaDeadline: '2026-07-16 14:20', slaBreached: true, messages: 5, createdAt: '2026-07-15 14:20', updatedAt: '2026-07-16 09:00', resolvedAt: undefined },
  { id: 'TKT-003', user: 'Fatima Noor', userType: 'job_seeker', subject: 'Account verification stuck', description: 'Submitted documents 3 days ago, still pending', category: 'account', priority: 'medium', status: 'waiting_user', assignedTo: 'Verification Team', slaDeadline: '2026-07-18 08:15', slaBreached: false, messages: 2, createdAt: '2026-07-16 08:15', updatedAt: '2026-07-16 12:00', resolvedAt: undefined },
  { id: 'TKT-004', user: 'Global Solutions', userType: 'company', subject: 'Feature request: bulk import', description: 'Need ability to import job postings via CSV', category: 'feature_request', priority: 'low', status: 'resolved', assignedTo: 'Product Team', slaDeadline: '2026-07-15 09:00', slaBreached: false, messages: 4, createdAt: '2026-07-10 09:00', updatedAt: '2026-07-14 16:00', resolvedAt: '2026-07-14 16:00' },
  { id: 'TKT-005', user: 'Sara Technologies', userType: 'company', subject: 'AI matching not working', description: 'Match scores showing 0% for all candidates', category: 'bug_report', priority: 'critical', status: 'open', assignedTo: undefined, slaDeadline: '2026-07-16 16:00', slaBreached: true, messages: 1, createdAt: '2026-07-16 15:00', updatedAt: '2026-07-16 15:00', resolvedAt: undefined },
  { id: 'TKT-006', user: 'Khalid Mohammed', userType: 'job_seeker', subject: 'Cannot cancel subscription', description: 'Cancel button not responding on mobile', category: 'billing', priority: 'medium', status: 'in_progress', assignedTo: 'Support Team', slaDeadline: '2026-07-17 11:00', slaBreached: false, messages: 2, createdAt: '2026-07-16 11:00', updatedAt: '2026-07-16 13:30', resolvedAt: undefined },
];

export const mockFeatureFlags: FeatureFlagConfig[] = [
  { id: 'ff1', name: 'ai_matching_v2', description: 'AI Matching Engine v2 with semantic analysis', enabled: true, rolloutPercentage: 100, targetCountries: [], targetPlans: [], targetCompanies: [], targetUsers: [], category: 'ai', createdAt: '2026-06-01', updatedAt: '2026-07-14', updatedBy: 'Super Admin' },
  { id: 'ff2', name: 'video_interviews', description: 'Video interview scheduling in matches', enabled: false, rolloutPercentage: 0, targetCountries: ['SA', 'AE'], targetPlans: ['Enterprise'], targetCompanies: [], targetUsers: [], category: 'beta', createdAt: '2026-07-01', updatedAt: '2026-07-10', updatedBy: 'Super Admin' },
  { id: 'ff3', name: 'candidate_directory_v2', description: 'Enhanced candidate directory with AI recommendations', enabled: true, rolloutPercentage: 75, targetCountries: [], targetPlans: ['Business', 'Enterprise'], targetCompanies: [], targetUsers: [], category: 'candidate_directory', createdAt: '2026-06-15', updatedAt: '2026-07-15', updatedBy: 'Super Admin' },
  { id: 'ff4', name: 'smart_notifications', description: 'AI-powered notification timing optimization', enabled: false, rolloutPercentage: 25, targetCountries: [], targetPlans: [], targetCompanies: ['c1', 'c2'], targetUsers: [], category: 'ai', createdAt: '2026-07-10', updatedAt: '2026-07-16', updatedBy: 'Super Admin' },
  { id: 'ff5', name: 'payment_moyasar', description: 'Moyasar payment gateway for MENA region', enabled: true, rolloutPercentage: 100, targetCountries: ['SA', 'AE', 'BH', 'KW', 'OM', 'QA'], targetPlans: [], targetCompanies: [], targetUsers: [], category: 'billing', createdAt: '2026-05-01', updatedAt: '2026-07-01', updatedBy: 'Billing Admin' },
  { id: 'ff6', name: 'bulk_job_import', description: 'CSV/Excel bulk job posting import', enabled: true, rolloutPercentage: 50, targetCountries: [], targetPlans: ['Business', 'Enterprise'], targetCompanies: [], targetUsers: [], category: 'core', createdAt: '2026-07-05', updatedAt: '2026-07-15', updatedBy: 'Super Admin' },
  { id: 'ff7', name: 'marketplace_addons', description: 'Marketplace for premium add-ons', enabled: false, rolloutPercentage: 0, targetCountries: [], targetPlans: [], targetCompanies: [], targetUsers: [], category: 'marketplace', createdAt: '2026-07-12', updatedAt: '2026-07-12', updatedBy: 'Super Admin' },
  { id: 'ff8', name: 'ai_resume_parser', description: 'AI-powered CV/resume parsing and extraction', enabled: true, rolloutPercentage: 100, targetCountries: [], targetPlans: [], targetCompanies: [], targetUsers: [], category: 'ai', createdAt: '2026-04-01', updatedAt: '2026-06-20', updatedBy: 'Super Admin' },
];

export const mockNotifications: PlatformNotification[] = [
  { id: 'n1', title: 'Platform Maintenance Window', content: 'Scheduled maintenance on July 20th from 2-4 AM UTC. Services may be briefly unavailable.', audience: 'all', channels: ['email', 'in_app', 'push'], status: 'scheduled', scheduledAt: '2026-07-20 02:00', recipientCount: 12847, createdBy: 'Super Admin', createdAt: '2026-07-16 10:00' },
  { id: 'n2', title: 'New AI Matching Feature', content: 'We have launched our AI-powered matching engine v2! Experience smarter job-candidate matching.', audience: 'all', channels: ['email', 'in_app'], status: 'sent', sentAt: '2026-07-14 09:00', recipientCount: 12847, openRate: 34.5, createdBy: 'Super Admin', createdAt: '2026-07-13 16:00' },
  { id: 'n3', title: 'Premium Plan Price Update', content: 'Starting August 1st, Premium plans will include video interviews at no extra cost.', audience: 'premium', channels: ['email', 'push'], status: 'draft', recipientCount: 2470, createdBy: 'Billing Admin', createdAt: '2026-07-16 14:00' },
  { id: 'n4', title: 'Complete Your Profile', content: 'Your profile is incomplete. Complete it to get 3x more matches!', audience: 'job_seekers', channels: ['push', 'in_app'], status: 'sent', sentAt: '2026-07-15 10:00', recipientCount: 4521, openRate: 28.3, createdBy: 'Support Admin', createdAt: '2026-07-14 15:00' },
];

// ============================================================
// Service Class
// ============================================================

class AdminPlatformService {
  private currentSession: AdminSession | null = null;
  private impersonation: ImpersonationSession | null = null;
  private auditLog: AuditLogEntry[] = [];

  // --- Authentication ---
  getSession(): AdminSession | null {
    return this.currentSession;
  }

  isImpersonating(): ImpersonationSession | null {
    return this.impersonation;
  }

  startImpersonation(target: Omit<ImpersonationSession, 'active' | 'startedAt' | 'adminId' | 'adminName'>): ImpersonationSession {
    this.impersonation = {
      ...target,
      active: true,
      startedAt: new Date().toISOString(),
      adminId: this.currentSession?.adminId || 'admin-1',
      adminName: this.currentSession?.email || 'Super Admin',
    };
    this.logAction('impersonate', 'user', target.targetUserId, `Started impersonating ${target.targetUserName} (${target.targetUserRole})`);
    return this.impersonation;
  }

  stopImpersonation(): void {
    if (this.impersonation) {
      this.logAction('impersonate', 'user', this.impersonation.targetUserId, `Stopped impersonating ${this.impersonation.targetUserName}`);
      this.impersonation = null;
    }
  }

  // --- Global Search ---
  async globalSearch(query: string, filters?: { type?: string }): Promise<GlobalSearchResult[]> {
    const q = query.toLowerCase();
    const results: GlobalSearchResult[] = [];

    // Search companies
    if (!filters?.type || filters.type === 'company') {
      mockCompanies.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        .forEach(c => results.push({ id: c.id, type: 'company', title: c.name, subtitle: `${c.industry} • ${c.plan}`, status: c.status, relevance: 95 }));
    }

    // Search job seekers
    if (!filters?.type || filters.type === 'job_seeker') {
      mockJobSeekers.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.skills.some(sk => sk.toLowerCase().includes(q)))
        .forEach(s => results.push({ id: s.id, type: 'job_seeker', title: s.name, subtitle: `${s.skills.slice(0, 2).join(', ')} • ${s.plan}`, status: s.status, relevance: 90 }));
    }

    // Search tickets
    if (!filters?.type || filters.type === 'ticket') {
      mockSupportTickets.filter(t => t.subject.toLowerCase().includes(q) || t.user.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
        .forEach(t => results.push({ id: t.id, type: 'ticket', title: t.subject, subtitle: `${t.user} • ${t.priority}`, status: t.status, relevance: 85 }));
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  // --- Audit Logging ---
  logAction(action: AuditLogEntry['action'], resource: string, resourceId: string, details: string): void {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      adminId: this.currentSession?.adminId || 'admin-1',
      adminName: this.currentSession?.email || 'Super Admin',
      adminRole: this.currentSession?.role || 'super_admin',
      action,
      resource,
      resourceId,
      details,
      ipAddress: '192.168.1.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLog.unshift(entry);
  }

  getAuditLogs(): AuditLogEntry[] {
    return this.auditLog;
  }

  // --- Platform Metrics ---
  getMetrics(): PlatformMetrics {
    return mockPlatformMetrics;
  }

  // --- Company Management ---
  getCompanies(): CompanyRecord[] {
    return mockCompanies;
  }

  suspendCompany(id: string, reason: string): void {
    this.logAction('suspend', 'company', id, `Suspended company: ${reason}`);
  }

  reactivateCompany(id: string): void {
    this.logAction('reactivate', 'company', id, 'Reactivated company');
  }

  verifyCompany(id: string): void {
    this.logAction('update', 'company', id, 'Verified company');
  }

  rejectCompany(id: string, reason: string): void {
    this.logAction('update', 'company', id, `Rejected verification: ${reason}`);
  }

  transferOwnership(companyId: string, newOwnerId: string): void {
    this.logAction('update', 'company', companyId, `Transferred ownership to ${newOwnerId}`);
  }

  // --- Job Seeker Management ---
  getJobSeekers(): JobSeekerRecord[] {
    return mockJobSeekers;
  }

  suspendSeeker(id: string, reason: string): void {
    this.logAction('suspend', 'job_seeker', id, `Suspended: ${reason}`);
  }

  banSeeker(id: string, reason: string): void {
    this.logAction('suspend', 'job_seeker', id, `Banned: ${reason}`);
  }

  reactivateSeeker(id: string): void {
    this.logAction('reactivate', 'job_seeker', id, 'Reactivated job seeker');
  }

  resetSeekerVisibility(id: string): void {
    this.logAction('update', 'job_seeker', id, 'Reset visibility settings');
  }

  resetSeekerFeatured(id: string): void {
    this.logAction('update', 'job_seeker', id, 'Reset featured status');
  }

  resetSeekerSubscription(id: string): void {
    this.logAction('update', 'job_seeker', id, 'Reset subscription to Free');
  }

  // --- Subscription Management ---
  grantComplimentaryAccess(userId: string, plan: string, duration: string): void {
    this.logAction('update', 'subscription', userId, `Granted complimentary ${plan} for ${duration}`);
  }

  grantTrial(userId: string, plan: string, days: number): void {
    this.logAction('update', 'subscription', userId, `Granted ${days}-day trial of ${plan}`);
  }

  revokeTrial(userId: string): void {
    this.logAction('update', 'subscription', userId, 'Revoked trial access');
  }

  overrideLimits(userId: string, limits: Record<string, number>): void {
    this.logAction('update', 'subscription', userId, `Override limits: ${JSON.stringify(limits)}`);
  }

  // --- Billing ---
  issueRefund(paymentId: string, amount: number, reason: string): void {
    this.logAction('refund', 'payment', paymentId, `Refunded $${amount}: ${reason}`);
  }

  retryPayment(paymentId: string): void {
    this.logAction('update', 'payment', paymentId, 'Retried failed payment');
  }

  addManualCredit(userId: string, amount: number, reason: string): void {
    this.logAction('create', 'credit', userId, `Added $${amount} credit: ${reason}`);
  }

  // --- Notifications ---
  getNotifications(): PlatformNotification[] {
    return mockNotifications;
  }

  sendNotification(notification: Omit<PlatformNotification, 'id' | 'status' | 'createdAt' | 'createdBy'>): void {
    this.logAction('create', 'notification', `notif-${Date.now()}`, `Sent notification: ${notification.title}`);
  }

  // --- Feature Flags ---
  getFeatureFlags(): FeatureFlagConfig[] {
    return mockFeatureFlags;
  }

  updateFeatureFlag(id: string, updates: Partial<FeatureFlagConfig>): void {
    this.logAction('update', 'feature_flag', id, `Updated flag: ${JSON.stringify(updates)}`);
  }

  // --- Support ---
  getTickets(): SupportTicket[] {
    return mockSupportTickets;
  }

  assignTicket(ticketId: string, assignee: string): void {
    this.logAction('update', 'ticket', ticketId, `Assigned to ${assignee}`);
  }

  resolveTicket(ticketId: string): void {
    this.logAction('update', 'ticket', ticketId, 'Resolved ticket');
  }
}

export const adminPlatformService = new AdminPlatformService();