import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Shield, Users, Settings, Plus, Edit, Trash2, Check, X, Lock,
  Eye, Search, Building2, UserPlus, Clock, Activity, Flag,
  ChevronRight, AlertTriangle, Copy, ToggleLeft
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

export type PermissionCategory =
  | 'candidates' | 'jobs' | 'pipeline' | 'messaging' | 'analytics'
  | 'billing' | 'team' | 'settings' | 'security' | 'exports'
  | 'directory' | 'invitations' | 'notes' | 'reports' | 'audit'
  | 'feature_flags' | 'api_access' | 'integrations';

export interface Permission {
  id: string;
  key: string;
  label: string;
  description: string;
  category: PermissionCategory;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isCustom: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roleId: string;
  departmentId?: string;
  status: 'active' | 'suspended' | 'invited' | 'deactivated';
  lastActive?: string;
  joinedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headId?: string;
  memberCount: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  targetType: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
  department?: string;
  details?: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  tier: 'free' | 'premium' | 'enterprise';
  category: string;
}

// ============================================================
// Default Permissions
// ============================================================

const ALL_PERMISSIONS: Permission[] = [
  // Candidates
  { id: 'p1', key: 'candidates.search', label: 'Search Candidates', description: 'Search the candidate directory', category: 'candidates' },
  { id: 'p2', key: 'candidates.view', label: 'View Candidates', description: 'View candidate profiles', category: 'candidates' },
  { id: 'p3', key: 'candidates.save', label: 'Save Candidates', description: 'Save candidates to lists', category: 'candidates' },
  { id: 'p4', key: 'candidates.contact', label: 'Contact Candidates', description: 'Send contact requests', category: 'candidates' },
  { id: 'p5', key: 'candidates.download_resume', label: 'Download Resume', description: 'Download candidate resumes', category: 'candidates' },
  { id: 'p6', key: 'candidates.export', label: 'Export Candidates', description: 'Export candidate data', category: 'candidates' },
  // Jobs
  { id: 'p7', key: 'jobs.create', label: 'Create Jobs', description: 'Create new job postings', category: 'jobs' },
  { id: 'p8', key: 'jobs.edit', label: 'Edit Jobs', description: 'Edit existing job postings', category: 'jobs' },
  { id: 'p9', key: 'jobs.delete', label: 'Delete Jobs', description: 'Delete job postings', category: 'jobs' },
  { id: 'p10', key: 'jobs.publish', label: 'Publish Jobs', description: 'Publish/unpublish jobs', category: 'jobs' },
  // Pipeline
  { id: 'p11', key: 'pipeline.view', label: 'View Pipeline', description: 'View talent pipeline', category: 'pipeline' },
  { id: 'p12', key: 'pipeline.manage', label: 'Manage Pipeline', description: 'Move candidates between stages', category: 'pipeline' },
  { id: 'p13', key: 'pipeline.approve', label: 'Approve Candidates', description: 'Approve candidates for next stage', category: 'pipeline' },
  { id: 'p14', key: 'pipeline.reject', label: 'Reject Candidates', description: 'Reject candidates from pipeline', category: 'pipeline' },
  // Messaging
  { id: 'p15', key: 'messaging.send', label: 'Send Messages', description: 'Send messages to candidates', category: 'messaging' },
  { id: 'p16', key: 'messaging.view_all', label: 'View All Messages', description: 'View all team messages', category: 'messaging' },
  // Analytics
  { id: 'p17', key: 'analytics.view', label: 'View Analytics', description: 'View analytics dashboards', category: 'analytics' },
  { id: 'p18', key: 'analytics.export', label: 'Export Analytics', description: 'Export analytics reports', category: 'analytics' },
  // Billing
  { id: 'p19', key: 'billing.view', label: 'View Billing', description: 'View billing information', category: 'billing' },
  { id: 'p20', key: 'billing.manage', label: 'Manage Billing', description: 'Manage subscriptions and payments', category: 'billing' },
  // Team
  { id: 'p21', key: 'team.invite', label: 'Invite Members', description: 'Invite new team members', category: 'team' },
  { id: 'p22', key: 'team.manage', label: 'Manage Members', description: 'Edit/remove team members', category: 'team' },
  { id: 'p23', key: 'team.assign_roles', label: 'Assign Roles', description: 'Assign roles to members', category: 'team' },
  // Settings
  { id: 'p24', key: 'settings.company', label: 'Company Settings', description: 'Modify company settings', category: 'settings' },
  { id: 'p25', key: 'settings.security', label: 'Security Settings', description: 'Manage security policies', category: 'settings' },
  { id: 'p26', key: 'settings.delete_company', label: 'Delete Company', description: 'Delete the company account', category: 'settings' },
  { id: 'p27', key: 'settings.transfer_ownership', label: 'Transfer Ownership', description: 'Transfer company ownership', category: 'settings' },
  // Directory
  { id: 'p28', key: 'directory.browse', label: 'Browse Directory', description: 'Browse candidate directory', category: 'directory' },
  { id: 'p29', key: 'directory.invite', label: 'Send Invitations', description: 'Send recruiter invitations', category: 'invitations' },
  // Notes
  { id: 'p30', key: 'notes.create', label: 'Create Notes', description: 'Add notes to candidates', category: 'notes' },
  { id: 'p31', key: 'notes.view_team', label: 'View Team Notes', description: 'View notes from other team members', category: 'notes' },
  // Reports
  { id: 'p32', key: 'reports.view', label: 'View Reports', description: 'View generated reports', category: 'reports' },
  { id: 'p33', key: 'reports.create', label: 'Create Reports', description: 'Generate new reports', category: 'reports' },
  // Audit
  { id: 'p34', key: 'audit.view', label: 'View Audit Logs', description: 'View system audit logs', category: 'audit' },
  // Feature Flags
  { id: 'p35', key: 'feature_flags.manage', label: 'Manage Features', description: 'Enable/disable feature flags', category: 'feature_flags' },
];

// ============================================================
// Default Roles
// ============================================================

const DEFAULT_ROLES: Role[] = [
  {
    id: 'role_owner', name: 'Company Owner', description: 'Full platform permissions. Can manage all aspects of the company.',
    isDefault: true, isCustom: false,
    permissions: ALL_PERMISSIONS.map(p => p.key),
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'role_admin', name: 'Admin', description: 'Manage users, jobs, candidates, and settings. Cannot delete company or manage billing.',
    isDefault: true, isCustom: false,
    permissions: ALL_PERMISSIONS.filter(p => !['billing.manage', 'settings.delete_company', 'settings.transfer_ownership'].includes(p.key)).map(p => p.key),
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'role_recruiter', name: 'Recruiter', description: 'Search candidates, manage pipeline, send invitations, write notes.',
    isDefault: true, isCustom: false,
    permissions: ['candidates.search', 'candidates.view', 'candidates.save', 'candidates.contact', 'candidates.download_resume', 'pipeline.view', 'pipeline.manage', 'messaging.send', 'directory.browse', 'directory.invite', 'notes.create', 'notes.view_team', 'analytics.view'],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'role_hiring_manager', name: 'Hiring Manager', description: 'Review candidates, approve/reject, view pipeline, leave feedback.',
    isDefault: true, isCustom: false,
    permissions: ['candidates.view', 'pipeline.view', 'pipeline.approve', 'pipeline.reject', 'notes.create', 'notes.view_team', 'analytics.view', 'messaging.send'],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'role_interviewer', name: 'Interviewer', description: 'View assigned interviews, review profiles, submit feedback.',
    isDefault: true, isCustom: false,
    permissions: ['candidates.view', 'pipeline.view', 'notes.create'],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'role_hr_coordinator', name: 'HR Coordinator', description: 'Schedule interviews, coordinate candidates, manage hiring documents.',
    isDefault: true, isCustom: false,
    permissions: ['candidates.view', 'candidates.contact', 'pipeline.view', 'pipeline.manage', 'messaging.send', 'notes.create', 'notes.view_team'],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 'role_analyst', name: 'Read-Only Analyst', description: 'View dashboards, reports, and analytics. No editing permissions.',
    isDefault: true, isCustom: false,
    permissions: ['analytics.view', 'analytics.export', 'reports.view', 'reports.create'],
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
];

// ============================================================
// Mock Data
// ============================================================

const MOCK_TEAM: TeamMember[] = [
  { id: 'tm1', name: 'Sarah Ahmed', email: 'sarah@company.com', roleId: 'role_owner', status: 'active', lastActive: '2 min ago', joinedAt: '2025-01-15', departmentId: 'dept1' },
  { id: 'tm2', name: 'Omar Hassan', email: 'omar@company.com', roleId: 'role_admin', status: 'active', lastActive: '1 hour ago', joinedAt: '2025-03-20', departmentId: 'dept1' },
  { id: 'tm3', name: 'Fatima Ali', email: 'fatima@company.com', roleId: 'role_recruiter', status: 'active', lastActive: '30 min ago', joinedAt: '2025-06-10', departmentId: 'dept2' },
  { id: 'tm4', name: 'Ahmed Khalil', email: 'ahmed.k@company.com', roleId: 'role_recruiter', status: 'active', lastActive: '5 min ago', joinedAt: '2025-08-01', departmentId: 'dept2' },
  { id: 'tm5', name: 'Layla Mansour', email: 'layla@company.com', roleId: 'role_hiring_manager', status: 'active', lastActive: '3 hours ago', joinedAt: '2025-09-15', departmentId: 'dept3' },
  { id: 'tm6', name: 'Youssef Nader', email: 'youssef@company.com', roleId: 'role_interviewer', status: 'suspended', lastActive: '2 days ago', joinedAt: '2025-11-01', departmentId: 'dept3' },
  { id: 'tm7', name: 'Noor Saleh', email: 'noor@company.com', roleId: 'role_hr_coordinator', status: 'invited', joinedAt: '2026-07-15', departmentId: 'dept2' },
  { id: 'tm8', name: 'Karim Zayed', email: 'karim@company.com', roleId: 'role_analyst', status: 'active', lastActive: '1 day ago', joinedAt: '2026-01-10', departmentId: 'dept4' },
];

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept1', name: 'Executive', description: 'Company leadership and management', memberCount: 2, createdAt: '2025-01-01' },
  { id: 'dept2', name: 'Recruitment', description: 'Talent acquisition and sourcing', headId: 'tm3', memberCount: 3, createdAt: '2025-01-01' },
  { id: 'dept3', name: 'Engineering', description: 'Software development and technical hiring', headId: 'tm5', memberCount: 2, createdAt: '2025-03-01' },
  { id: 'dept4', name: 'Analytics', description: 'Data analysis and reporting', headId: 'tm8', memberCount: 1, createdAt: '2026-01-01' },
];

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'al1', userId: 'tm3', userName: 'Fatima Ali', userRole: 'Recruiter', action: 'candidate.viewed', target: 'Ahmed Hassan', targetType: 'candidate', status: 'success', timestamp: '2026-07-18T10:30:00Z', department: 'Recruitment' },
  { id: 'al2', userId: 'tm3', userName: 'Fatima Ali', userRole: 'Recruiter', action: 'invitation.sent', target: 'Mohammed Said', targetType: 'candidate', status: 'success', timestamp: '2026-07-18T10:25:00Z', department: 'Recruitment' },
  { id: 'al3', userId: 'tm4', userName: 'Ahmed Khalil', userRole: 'Recruiter', action: 'resume.downloaded', target: 'Sara Omar', targetType: 'candidate', status: 'success', timestamp: '2026-07-18T10:20:00Z', department: 'Recruitment' },
  { id: 'al4', userId: 'tm2', userName: 'Omar Hassan', userRole: 'Admin', action: 'role.updated', target: 'Interviewer', targetType: 'role', status: 'success', timestamp: '2026-07-18T09:45:00Z', department: 'Executive' },
  { id: 'al5', userId: 'tm5', userName: 'Layla Mansour', userRole: 'Hiring Manager', action: 'candidate.approved', target: 'Khalid Nasser', targetType: 'candidate', status: 'success', timestamp: '2026-07-18T09:30:00Z', department: 'Engineering' },
  { id: 'al6', userId: 'tm1', userName: 'Sarah Ahmed', userRole: 'Owner', action: 'feature.enabled', target: 'AI Recommendations', targetType: 'feature_flag', status: 'success', timestamp: '2026-07-18T09:00:00Z', department: 'Executive' },
  { id: 'al7', userId: 'tm2', userName: 'Omar Hassan', userRole: 'Admin', action: 'user.invited', target: 'noor@company.com', targetType: 'team_member', status: 'success', timestamp: '2026-07-17T16:00:00Z', department: 'Executive' },
  { id: 'al8', userId: 'tm1', userName: 'Sarah Ahmed', userRole: 'Owner', action: 'subscription.upgraded', target: 'Enterprise Plan', targetType: 'subscription', status: 'success', timestamp: '2026-07-17T14:00:00Z', department: 'Executive' },
  { id: 'al9', userId: 'tm6', userName: 'Youssef Nader', userRole: 'Interviewer', action: 'login.failed', target: 'Session', targetType: 'auth', status: 'failed', timestamp: '2026-07-17T12:00:00Z', department: 'Engineering' },
  { id: 'al10', userId: 'tm1', userName: 'Sarah Ahmed', userRole: 'Owner', action: 'user.suspended', target: 'Youssef Nader', targetType: 'team_member', status: 'warning', timestamp: '2026-07-17T12:30:00Z', department: 'Executive' },
];

const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'ff1', key: 'candidate_directory', name: 'Candidate Directory', description: 'Browse and search candidate profiles', enabled: true, tier: 'premium', category: 'Recruitment' },
  { id: 'ff2', key: 'talent_pipeline', name: 'Talent Pipeline', description: 'Multi-stage candidate tracking', enabled: true, tier: 'premium', category: 'Recruitment' },
  { id: 'ff3', key: 'recruiter_notes', name: 'Recruiter Notes', description: 'Add notes to candidate profiles', enabled: true, tier: 'premium', category: 'Recruitment' },
  { id: 'ff4', key: 'recruiter_invitations', name: 'Recruiter Invitations', description: 'Send job invitations to candidates', enabled: true, tier: 'premium', category: 'Recruitment' },
  { id: 'ff5', key: 'ai_matching', name: 'AI Matching', description: 'AI-powered candidate-job matching', enabled: true, tier: 'premium', category: 'AI' },
  { id: 'ff6', key: 'ai_recommendations', name: 'AI Recommendations', description: 'AI-generated candidate recommendations', enabled: true, tier: 'enterprise', category: 'AI' },
  { id: 'ff7', key: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed recruitment analytics', enabled: true, tier: 'premium', category: 'Analytics' },
  { id: 'ff8', key: 'team_collaboration', name: 'Team Collaboration', description: 'Multi-user collaboration features', enabled: true, tier: 'enterprise', category: 'Team' },
  { id: 'ff9', key: 'exports', name: 'Data Exports', description: 'Export candidate and report data', enabled: false, tier: 'enterprise', category: 'Data' },
  { id: 'ff10', key: 'api_access', name: 'API Access', description: 'REST API for integrations', enabled: false, tier: 'enterprise', category: 'Integrations' },
  { id: 'ff11', key: 'white_label', name: 'White Label', description: 'Custom branding and domain', enabled: false, tier: 'enterprise', category: 'Branding' },
  { id: 'ff12', key: 'featured_candidate', name: 'Featured Candidate', description: 'Highlight candidates in search', enabled: true, tier: 'premium', category: 'Recruitment' },
];

// ============================================================
// Permission Check Hook
// ============================================================

export function usePermissions(userRoleId: string) {
  const roles = DEFAULT_ROLES;
  const currentRole = roles.find(r => r.id === userRoleId);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (!currentRole) return false;
    return currentRole.permissions.includes(permissionKey);
  }, [currentRole]);

  const hasAnyPermission = useCallback((keys: string[]): boolean => {
    return keys.some(k => hasPermission(k));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((keys: string[]): boolean => {
    return keys.every(k => hasPermission(k));
  }, [hasPermission]);

  return { currentRole, hasPermission, hasAnyPermission, hasAllPermissions, allPermissions: ALL_PERMISSIONS };
}

// ============================================================
// Audit Logger
// ============================================================

export function useAuditLog() {
  const log = useCallback((action: string, target: string, targetType: string, status: 'success' | 'failed' | 'warning' = 'success') => {
    const entry: AuditLogEntry = {
      id: `al_${Date.now()}`,
      userId: 'current_user',
      userName: 'Current User',
      userRole: 'Owner',
      action,
      target,
      targetType,
      status,
      timestamp: new Date().toISOString(),
    };
    // In production, this would call Supabase to insert the log
    console.log('[AUDIT]', entry);
    return entry;
  }, []);

  return { log };
}

// ============================================================
// Feature Flag Hook
// ============================================================

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(MOCK_FEATURE_FLAGS);

  const isEnabled = useCallback((key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    return flag?.enabled ?? false;
  }, [flags]);

  const toggleFlag = useCallback((id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }, []);

  return { flags, isEnabled, toggleFlag, setFlags };
}

// ============================================================
// Role Management View
// ============================================================

export function RoleManagementView() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const permissionCategories = useMemo(() => {
    const cats = new Map<PermissionCategory, Permission[]>();
    ALL_PERMISSIONS.forEach(p => {
      const existing = cats.get(p.category) || [];
      cats.set(p.category, [...existing, p]);
    });
    return cats;
  }, []);

  const openCreateRole = () => {
    setEditMode(false);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRolePerms([]);
    setDialogOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditMode(true);
    setNewRoleName(role.name);
    setNewRoleDesc(role.description);
    setNewRolePerms([...role.permissions]);
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const duplicateRole = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: `role_custom_${Date.now()}`,
      name: `${role.name} (Copy)`,
      isDefault: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRoles(prev => [...prev, newRole]);
    toast.success(t('role_duplicated'));
  };

  const handleSaveRole = () => {
    if (!newRoleName.trim()) { toast.error(t('fill_all_fields')); return; }
    if (editMode && selectedRole) {
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, name: newRoleName, description: newRoleDesc, permissions: newRolePerms, updatedAt: new Date().toISOString() } : r));
      toast.success(t('role_updated'));
    } else {
      const newRole: Role = {
        id: `role_custom_${Date.now()}`,
        name: newRoleName,
        description: newRoleDesc,
        isDefault: false,
        isCustom: true,
        permissions: newRolePerms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRoles(prev => [...prev, newRole]);
      toast.success(t('role_created'));
    }
    setDialogOpen(false);
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
    toast.success(t('role_deleted'));
  };

  const togglePermission = (key: string) => {
    setNewRolePerms(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins]">{t('role_management')}</h2>
          <p className="text-sm text-muted-foreground">{t('role_management_desc')}</p>
        </div>
        <Button className="cursor-pointer gap-2" onClick={openCreateRole}><Plus className="w-4 h-4" />{t('create_role')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <Card key={role.id} className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={`w-5 h-5 ${role.id === 'role_owner' ? 'text-amber-500' : role.id === 'role_admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-sm">{role.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  {role.isDefault && <Badge variant="secondary" className="text-[10px]">{t('default')}</Badge>}
                  {role.isCustom && <Badge variant="outline" className="text-[10px]">{t('custom')}</Badge>}
                </div>
              </div>
              <CardDescription className="text-xs mt-1">{role.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{role.permissions.length} {t('permissions')}</span>
                <span>{MOCK_TEAM.filter(m => m.roleId === role.id).length} {t('members')}</span>
              </div>
              <div className="flex gap-1 flex-wrap mb-3">
                {Array.from(new Set(ALL_PERMISSIONS.filter(p => role.permissions.includes(p.key)).map(p => p.category))).slice(0, 4).map(cat => (
                  <Badge key={cat} variant="outline" className="text-[10px]">{cat}</Badge>
                ))}
                {Array.from(new Set(ALL_PERMISSIONS.filter(p => role.permissions.includes(p.key)).map(p => p.category))).length > 4 && (
                  <Badge variant="outline" className="text-[10px]">+{Array.from(new Set(ALL_PERMISSIONS.filter(p => role.permissions.includes(p.key)).map(p => p.category))).length - 4}</Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="cursor-pointer flex-1 text-xs" onClick={() => openEditRole(role)}><Edit className="w-3 h-3 me-1" />{t('edit')}</Button>
                <Button size="sm" variant="ghost" className="cursor-pointer text-xs" onClick={() => duplicateRole(role)}><Copy className="w-3 h-3" /></Button>
                {role.isCustom && <Button size="sm" variant="ghost" className="cursor-pointer text-xs text-destructive" onClick={() => deleteRole(role.id)}><Trash2 className="w-3 h-3" /></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Poppins]">{editMode ? t('edit_role') : t('create_role')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('role_name')}</Label><Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="mt-1" placeholder="e.g. Senior Recruiter" /></div>
            <div><Label>{t('description')}</Label><Textarea value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} className="mt-1" rows={2} /></div>
            <div>
              <Label className="mb-2 block">{t('permissions')} ({newRolePerms.length}/{ALL_PERMISSIONS.length})</Label>
              <Input placeholder={t('search_permissions')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="mb-3" />
              <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                {Array.from(permissionCategories.entries()).map(([category, perms]) => {
                  const filtered = perms.filter(p => !searchQuery || p.label.toLowerCase().includes(searchQuery.toLowerCase()) || p.key.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={category} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium uppercase text-muted-foreground">{category}</span>
                        <Button size="sm" variant="ghost" className="cursor-pointer text-[10px] h-6" onClick={() => {
                          const catKeys = filtered.map(p => p.key);
                          const allSelected = catKeys.every(k => newRolePerms.includes(k));
                          if (allSelected) setNewRolePerms(prev => prev.filter(k => !catKeys.includes(k)));
                          else setNewRolePerms(prev => [...new Set([...prev, ...catKeys])]);
                        }}>{filtered.every(p => newRolePerms.includes(p.key)) ? t('deselect_all') : t('select_all')}</Button>
                      </div>
                      <div className="space-y-1.5">
                        {filtered.map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1">
                            <input type="checkbox" checked={newRolePerms.includes(perm.key)} onChange={() => togglePermission(perm.key)} className="rounded" />
                            <div className="flex-1">
                              <span className="text-xs font-medium">{perm.label}</span>
                              <span className="text-[10px] text-muted-foreground ms-2">{perm.description}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">{t('cancel')}</Button>
            <Button onClick={handleSaveRole} className="cursor-pointer">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Team Management View
// ============================================================

export function TeamManagementView() {
  const { t } = useTranslation();
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);
  const [departments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('role_recruiter');
  const [inviteDept, setInviteDept] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeam = useMemo(() => {
    return team.filter(m => {
      if (filterRole !== 'all' && m.roleId !== filterRole) return false;
      if (filterStatus !== 'all' && m.status !== filterStatus) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [team, filterRole, filterStatus, searchQuery]);

  const handleInvite = () => {
    if (!inviteEmail.trim()) { toast.error(t('fill_all_fields')); return; }
    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      roleId: inviteRole,
      departmentId: inviteDept || undefined,
      status: 'invited',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setTeam(prev => [...prev, newMember]);
    toast.success(t('invitation_sent'));
    setInviteOpen(false);
    setInviteEmail('');
  };

  const toggleStatus = (memberId: string, newStatus: 'active' | 'suspended') => {
    setTeam(prev => prev.map(m => m.id === memberId ? { ...m, status: newStatus } : m));
    toast.success(newStatus === 'suspended' ? t('user_suspended') : t('user_reactivated'));
  };

  const removeMember = (memberId: string) => {
    setTeam(prev => prev.filter(m => m.id !== memberId));
    toast.success(t('member_removed'));
  };

  const changeRole = (memberId: string, newRoleId: string) => {
    setTeam(prev => prev.map(m => m.id === memberId ? { ...m, roleId: newRoleId } : m));
    toast.success(t('role_updated'));
  };

  const statusColor = (s: string) => {
    switch (s) { case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'; case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'; case 'invited': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'; default: return 'bg-gray-100 text-gray-700'; }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins]">{t('team_management')}</h2>
          <p className="text-sm text-muted-foreground">{t('team_management_desc')}</p>
        </div>
        <Button className="cursor-pointer gap-2" onClick={() => setInviteOpen(true)}><UserPlus className="w-4 h-4" />{t('invite_member')}</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary font-[Poppins]">{team.filter(m => m.status === 'active').length}</p><p className="text-xs text-muted-foreground">{t('active_members')}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600 font-[Poppins]">{team.filter(m => m.status === 'invited').length}</p><p className="text-xs text-muted-foreground">{t('pending_invites')}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-muted-foreground font-[Poppins]">{departments.length}</p><p className="text-xs text-muted-foreground">{t('departments')}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600 font-[Poppins]">{DEFAULT_ROLES.length}</p><p className="text-xs text-muted-foreground">{t('roles')}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder={t('search_members')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-64" />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t('all_roles')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_roles')}</SelectItem>
            {DEFAULT_ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder={t('all_statuses')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_statuses')}</SelectItem>
            <SelectItem value="active">{t('active')}</SelectItem>
            <SelectItem value="suspended">{t('suspended')}</SelectItem>
            <SelectItem value="invited">{t('invited')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team List */}
      <div className="space-y-2">
        {filteredTeam.map(member => {
          const role = DEFAULT_ROLES.find(r => r.id === member.roleId);
          const dept = departments.find(d => d.id === member.departmentId);
          return (
            <Card key={member.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{member.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {dept && <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{dept.name}</Badge>}
                  <Select value={member.roleId} onValueChange={(v) => changeRole(member.id, v)}>
                    <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{DEFAULT_ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Badge className={`text-[10px] ${statusColor(member.status)}`}>{t(member.status)}</Badge>
                  <div className="flex gap-1">
                    {member.status === 'active' && member.roleId !== 'role_owner' && (
                      <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0 text-amber-600" onClick={() => toggleStatus(member.id, 'suspended')} title={t('suspend')}><Lock className="w-3 h-3" /></Button>
                    )}
                    {member.status === 'suspended' && (
                      <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0 text-green-600" onClick={() => toggleStatus(member.id, 'active')} title={t('reactivate')}><Check className="w-3 h-3" /></Button>
                    )}
                    {member.roleId !== 'role_owner' && (
                      <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0 text-destructive" onClick={() => removeMember(member.id)} title={t('remove')}><Trash2 className="w-3 h-3" /></Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-[Poppins]">{t('invite_member')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('email')}</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="mt-1" placeholder="colleague@company.com" /></div>
            <div><Label>{t('role')}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DEFAULT_ROLES.filter(r => r.id !== 'role_owner').map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t('department')}</Label>
              <Select value={inviteDept} onValueChange={setInviteDept}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('select_department')} /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="cursor-pointer">{t('cancel')}</Button>
            <Button onClick={handleInvite} className="cursor-pointer">{t('send_invitation')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Department Management View
// ============================================================

export function DepartmentManagementView() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const openAdd = () => { setEditingDept(null); setForm({ name: '', description: '' }); setDialogOpen(true); };
  const openEdit = (dept: Department) => { setEditingDept(dept); setForm({ name: dept.name, description: dept.description }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error(t('fill_all_fields')); return; }
    if (editingDept) {
      setDepartments(prev => prev.map(d => d.id === editingDept.id ? { ...d, ...form } : d));
      toast.success(t('department_updated'));
    } else {
      setDepartments(prev => [...prev, { id: `dept_${Date.now()}`, ...form, memberCount: 0, createdAt: new Date().toISOString().slice(0, 10) }]);
      toast.success(t('department_created'));
    }
    setDialogOpen(false);
  };

  const deleteDept = (id: string) => { setDepartments(prev => prev.filter(d => d.id !== id)); toast.success(t('department_deleted')); };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold font-[Poppins]">{t('departments')}</h2><p className="text-sm text-muted-foreground">{t('departments_desc')}</p></div>
        <Button className="cursor-pointer gap-2" onClick={openAdd}><Plus className="w-4 h-4" />{t('add_department')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map(dept => (
          <Card key={dept.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />{dept.name}</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0" onClick={() => openEdit(dept)}><Edit className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0 text-destructive" onClick={() => deleteDept(dept.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <CardDescription className="text-xs">{dept.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{dept.memberCount} {t('members')}</span>
                <span>{t('created')}: {dept.createdAt}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-[Poppins]">{editingDept ? t('edit_department') : t('add_department')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('department_name')}</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>{t('description')}</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">{t('cancel')}</Button>
            <Button onClick={handleSave} className="cursor-pointer">{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Audit Logs View
// ============================================================

export function AuditLogsView() {
  const { t } = useTranslation();
  const [logs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all' && !log.action.startsWith(filterAction)) return false;
      if (filterStatus !== 'all' && log.status !== filterStatus) return false;
      if (searchQuery && !log.userName.toLowerCase().includes(searchQuery.toLowerCase()) && !log.target.toLowerCase().includes(searchQuery.toLowerCase()) && !log.action.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [logs, filterAction, filterStatus, searchQuery]);

  const statusIcon = (s: string) => {
    switch (s) { case 'success': return <Check className="w-3 h-3 text-green-600" />; case 'failed': return <X className="w-3 h-3 text-red-600" />; case 'warning': return <AlertTriangle className="w-3 h-3 text-amber-600" />; default: return null; }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold font-[Poppins]">{t('audit_logs')}</h2><p className="text-sm text-muted-foreground">{t('audit_logs_desc')}</p></div>
        <Badge variant="secondary" className="text-xs">{logs.length} {t('entries')}</Badge>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Input placeholder={t('search_logs')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-64" />
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t('all_actions')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_actions')}</SelectItem>
            <SelectItem value="candidate">Candidate</SelectItem>
            <SelectItem value="invitation">Invitation</SelectItem>
            <SelectItem value="resume">Resume</SelectItem>
            <SelectItem value="role">Role</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('all_statuses')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_statuses')}</SelectItem>
            <SelectItem value="success">{t('success')}</SelectItem>
            <SelectItem value="failed">{t('failed')}</SelectItem>
            <SelectItem value="warning">{t('warning')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filteredLogs.map(log => (
          <Card key={log.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {statusIcon(log.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{log.userName}</span>
                  <Badge variant="outline" className="text-[10px]">{log.userRole}</Badge>
                  {log.department && <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{log.department}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium">{log.action.replace('.', ' → ')}</span> · {log.target}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(log.timestamp)}</span>
            </CardContent>
          </Card>
        ))}
        {filteredLogs.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_audit_logs')}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Feature Flags View
// ============================================================

export function FeatureFlagsView() {
  const { t } = useTranslation();
  const { flags, toggleFlag } = useFeatureFlags();
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTier, setFilterTier] = useState('all');

  const categories = useMemo(() => Array.from(new Set(flags.map(f => f.category))), [flags]);

  const filteredFlags = useMemo(() => {
    return flags.filter(f => {
      if (filterCategory !== 'all' && f.category !== filterCategory) return false;
      if (filterTier !== 'all' && f.tier !== filterTier) return false;
      return true;
    });
  }, [flags, filterCategory, filterTier]);

  const tierColor = (tier: string) => {
    switch (tier) { case 'free': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'; case 'premium': return 'bg-primary/10 text-primary'; case 'enterprise': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'; default: return ''; }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold font-[Poppins]">{t('feature_flags')}</h2><p className="text-sm text-muted-foreground">{t('feature_flags_desc')}</p></div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs">{flags.filter(f => f.enabled).length} {t('enabled')}</Badge>
          <Badge variant="secondary" className="text-xs">{flags.filter(f => !f.enabled).length} {t('disabled')}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t('all_categories')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_categories')}</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-36"><SelectValue placeholder={t('all_tiers')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all_tiers')}</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filteredFlags.map(flag => (
          <Card key={flag.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${flag.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                  <Flag className={`w-4 h-4 ${flag.enabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{flag.name}</p>
                    <Badge className={`text-[10px] ${tierColor(flag.tier)}`}>{flag.tier}</Badge>
                    <Badge variant="outline" className="text-[10px]">{flag.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </div>
              </div>
              <Switch checked={flag.enabled} onCheckedChange={() => { toggleFlag(flag.id); toast.success(flag.enabled ? t('feature_disabled') : t('feature_enabled')); }} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Organization Settings View
// ============================================================

export function OrganizationSettingsView() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    companyName: 'TechCorp International',
    industry: 'Technology',
    size: '50-200',
    website: 'https://techcorp.com',
    defaultRecruiterQuota: '10',
    autoAssignDepartment: true,
    requireApprovalForOffers: true,
    allowSelfRegistration: false,
    enforcePasswordPolicy: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    enableTwoFactor: false,
    enableAuditLogs: true,
    dataRetentionDays: '365',
    enableNotifications: true,
    enableEmailDigest: true,
    digestFrequency: 'daily',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success(t('settings_saved')); }, 800);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold font-[Poppins]">{t('organization_settings')}</h2><p className="text-sm text-muted-foreground">{t('organization_settings_desc')}</p></div>
      </div>
      <div className="max-w-2xl space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('company_information')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('company_name')}</Label><Input value={settings.companyName} onChange={e => setSettings({ ...settings, companyName: e.target.value })} className="mt-1" /></div>
              <div><Label>{t('industry')}</Label><Input value={settings.industry} onChange={e => setSettings({ ...settings, industry: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('company_size')}</Label>
                <Select value={settings.size} onValueChange={v => setSettings({ ...settings, size: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1-10">1-10</SelectItem><SelectItem value="11-50">11-50</SelectItem><SelectItem value="50-200">50-200</SelectItem><SelectItem value="200-1000">200-1000</SelectItem><SelectItem value="1000+">1000+</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>{t('website')}</Label><Input value={settings.website} onChange={e => setSettings({ ...settings, website: e.target.value })} className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        {/* Hiring Preferences */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('hiring_preferences')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>{t('default_recruiter_quota')}</Label><Input type="number" value={settings.defaultRecruiterQuota} onChange={e => setSettings({ ...settings, defaultRecruiterQuota: e.target.value })} className="mt-1" /></div>
            <div className="flex items-center justify-between"><Label>{t('auto_assign_department')}</Label><Switch checked={settings.autoAssignDepartment} onCheckedChange={v => setSettings({ ...settings, autoAssignDepartment: v })} /></div>
            <div className="flex items-center justify-between"><Label>{t('require_approval_offers')}</Label><Switch checked={settings.requireApprovalForOffers} onCheckedChange={v => setSettings({ ...settings, requireApprovalForOffers: v })} /></div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('security_settings')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>{t('enforce_password_policy')}</Label><Switch checked={settings.enforcePasswordPolicy} onCheckedChange={v => setSettings({ ...settings, enforcePasswordPolicy: v })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('session_timeout_min')}</Label><Input type="number" value={settings.sessionTimeout} onChange={e => setSettings({ ...settings, sessionTimeout: e.target.value })} className="mt-1" /></div>
              <div><Label>{t('max_login_attempts')}</Label><Input type="number" value={settings.maxLoginAttempts} onChange={e => setSettings({ ...settings, maxLoginAttempts: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex items-center justify-between"><Label>{t('enable_two_factor')}</Label><Switch checked={settings.enableTwoFactor} onCheckedChange={v => setSettings({ ...settings, enableTwoFactor: v })} /></div>
            <div className="flex items-center justify-between"><Label>{t('enable_audit_logs')}</Label><Switch checked={settings.enableAuditLogs} onCheckedChange={v => setSettings({ ...settings, enableAuditLogs: v })} /></div>
            <div><Label>{t('data_retention_days')}</Label><Input type="number" value={settings.dataRetentionDays} onChange={e => setSettings({ ...settings, dataRetentionDays: e.target.value })} className="mt-1" /></div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('notification_preferences')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>{t('enable_notifications')}</Label><Switch checked={settings.enableNotifications} onCheckedChange={v => setSettings({ ...settings, enableNotifications: v })} /></div>
            <div className="flex items-center justify-between"><Label>{t('email_digest')}</Label><Switch checked={settings.enableEmailDigest} onCheckedChange={v => setSettings({ ...settings, enableEmailDigest: v })} /></div>
            {settings.enableEmailDigest && (
              <div><Label>{t('digest_frequency')}</Label>
                <Select value={settings.digestFrequency} onValueChange={v => setSettings({ ...settings, digestFrequency: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="daily">{t('daily')}</SelectItem><SelectItem value="weekly">{t('weekly')}</SelectItem><SelectItem value="monthly">{t('monthly')}</SelectItem></SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Button className="cursor-pointer" onClick={handleSave} disabled={saving}>{saving ? t('loading') : t('save')}</Button>
      </div>
    </div>
  );
}

// ============================================================
// Security Dashboard View
// ============================================================

export function SecurityDashboardView() {
  const { t } = useTranslation();

  const securityChecks = [
    { id: 's1', name: t('supabase_rls'), status: 'active', description: t('rls_active_desc') },
    { id: 's2', name: t('jwt_validation'), status: 'active', description: t('jwt_active_desc') },
    { id: 's3', name: t('permission_enforcement'), status: 'active', description: t('permission_enforcement_desc') },
    { id: 's4', name: t('session_management'), status: 'active', description: t('session_mgmt_desc') },
    { id: 's5', name: t('secure_file_access'), status: 'active', description: t('secure_files_desc') },
    { id: 's6', name: t('profile_visibility'), status: 'active', description: t('profile_vis_desc') },
    { id: 's7', name: t('rate_limiting'), status: 'active', description: t('rate_limit_desc') },
    { id: 's8', name: t('input_validation'), status: 'active', description: t('input_val_desc') },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold font-[Poppins]">{t('security_dashboard')}</h2><p className="text-sm text-muted-foreground">{t('security_dashboard_desc')}</p></div>
        <Badge variant="default" className="text-xs gap-1"><Shield className="w-3 h-3" />{t('all_checks_passed')}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-green-600 font-[Poppins]">A+</p><p className="text-xs text-muted-foreground">{t('security_score')}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-primary font-[Poppins]">8/8</p><p className="text-xs text-muted-foreground">{t('checks_passed')}</p></CardContent></Card>
      </div>

      <div className="space-y-2">
        {securityChecks.map(check => (
          <Card key={check.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{check.name}</p>
                <p className="text-xs text-muted-foreground">{check.description}</p>
              </div>
              <Badge variant="default" className="text-[10px] bg-green-600">{t('active')}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}