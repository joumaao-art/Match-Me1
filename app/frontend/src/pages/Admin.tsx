/**
 * Super Admin Portal - Complete management dashboard.
 * Contains all admin management sections with sidebar navigation.
 * Sections: Dashboard, Users, Companies, Jobs, Matches, Subscriptions,
 * Payments, Support, Analytics, Content, Reports, Announcements,
 * Feature Flags, Audit Logs, System Settings
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { ChangePassword } from '@/components/shared/ChangePassword';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, Building2, Briefcase, Heart, CreditCard,
  DollarSign, HeadphonesIcon, BarChart3, FileText, Flag, Megaphone,
  ToggleLeft, ScrollText, Settings, LogOut, Search, Bell, Moon, Sun,
  ChevronDown, MoreHorizontal, Download, Filter, Plus, Trash2,
  Edit, Eye, Ban, CheckCircle2, XCircle, Clock, TrendingUp,
  TrendingDown, Activity, Shield, AlertTriangle, RefreshCw,
  Send, Archive, Star, Zap, Globe, Lock, Unlock, Database,
  Server, Cpu, HardDrive, Wifi, Mail
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type AdminSection =
  | 'dashboard' | 'users' | 'companies' | 'jobs' | 'matches'
  | 'subscriptions' | 'payments' | 'support' | 'analytics'
  | 'content' | 'reports' | 'announcements' | 'feature-flags'
  | 'audit-logs' | 'settings';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

// ============================================================
// Mock Data
// ============================================================

const mockStats = {
  totalUsers: 12847,
  totalJobSeekers: 8932,
  totalCompanies: 3915,
  totalJobs: 2456,
  totalApplications: 18234,
  totalMatches: 4521,
  activeSubscriptions: 1893,
  revenue: 284500,
  newUsersToday: 147,
  newJobsToday: 38,
  activeUsersNow: 892,
  supportTicketsOpen: 23,
};

const mockUsers = [
  { id: '1', name: 'Ahmed Al-Rashid', email: 'ahmed@email.com', role: 'job_seeker', status: 'active', joinedAt: '2026-06-15', lastActive: '2 hours ago' },
  { id: '2', name: 'Sara Technologies', email: 'hr@saratech.com', role: 'company', status: 'active', joinedAt: '2026-05-20', lastActive: '1 hour ago' },
  { id: '3', name: 'Omar Hassan', email: 'omar@email.com', role: 'job_seeker', status: 'suspended', joinedAt: '2026-07-01', lastActive: '3 days ago' },
  { id: '4', name: 'TechCorp Inc', email: 'admin@techcorp.com', role: 'company', status: 'active', joinedAt: '2026-04-10', lastActive: '5 mins ago' },
  { id: '5', name: 'Fatima Noor', email: 'fatima@email.com', role: 'job_seeker', status: 'pending_verification', joinedAt: '2026-07-16', lastActive: 'Never' },
  { id: '6', name: 'Global Solutions', email: 'info@globalsol.com', role: 'company', status: 'active', joinedAt: '2026-03-22', lastActive: '30 mins ago' },
];

const mockJobs = [
  { id: '1', title: 'Senior React Developer', company: 'TechCorp Inc', status: 'active', applicants: 45, posted: '2026-07-10', expires: '2026-08-10' },
  { id: '2', title: 'Product Manager', company: 'Sara Technologies', status: 'active', applicants: 32, posted: '2026-07-12', expires: '2026-08-12' },
  { id: '3', title: 'UX Designer', company: 'Global Solutions', status: 'paused', applicants: 18, posted: '2026-07-05', expires: '2026-08-05' },
  { id: '4', title: 'Data Scientist', company: 'TechCorp Inc', status: 'expired', applicants: 67, posted: '2026-06-01', expires: '2026-07-01' },
  { id: '5', title: 'Marketing Lead', company: 'Sara Technologies', status: 'active', applicants: 23, posted: '2026-07-14', expires: '2026-08-14' },
];

const mockMatches = [
  { id: '1', seeker: 'Ahmed Al-Rashid', company: 'TechCorp Inc', job: 'Senior React Developer', score: 94, status: 'active', matchedAt: '2026-07-15' },
  { id: '2', seeker: 'Omar Hassan', company: 'Sara Technologies', job: 'Product Manager', score: 87, status: 'expired', matchedAt: '2026-07-10' },
  { id: '3', seeker: 'Fatima Noor', company: 'Global Solutions', job: 'UX Designer', score: 91, status: 'active', matchedAt: '2026-07-14' },
  { id: '4', seeker: 'Ahmed Al-Rashid', company: 'Sara Technologies', job: 'Marketing Lead', score: 72, status: 'pending', matchedAt: '2026-07-16' },
];

const mockSubscriptions = [
  { id: '1', user: 'TechCorp Inc', plan: 'Business', status: 'active', amount: 99, billingCycle: 'monthly', nextBilling: '2026-08-15', startedAt: '2026-06-15' },
  { id: '2', user: 'Ahmed Al-Rashid', plan: 'Premium', status: 'active', amount: 29, billingCycle: 'monthly', nextBilling: '2026-08-10', startedAt: '2026-07-10' },
  { id: '3', user: 'Sara Technologies', plan: 'Enterprise', status: 'active', amount: 299, billingCycle: 'yearly', nextBilling: '2027-01-20', startedAt: '2026-01-20' },
  { id: '4', user: 'Global Solutions', plan: 'Starter', status: 'cancelled', amount: 49, billingCycle: 'monthly', nextBilling: '-', startedAt: '2026-05-01' },
];

const mockPayments = [
  { id: 'PAY-001', user: 'TechCorp Inc', amount: 99, method: 'Stripe', status: 'completed', date: '2026-07-15 14:23' },
  { id: 'PAY-002', user: 'Ahmed Al-Rashid', amount: 29, method: 'Apple Pay', status: 'completed', date: '2026-07-14 09:15' },
  { id: 'PAY-003', user: 'Sara Technologies', amount: 299, method: 'Stripe', status: 'completed', date: '2026-07-13 16:42' },
  { id: 'PAY-004', user: 'Omar Hassan', amount: 29, method: 'Google Pay', status: 'refunded', date: '2026-07-12 11:30' },
  { id: 'PAY-005', user: 'Global Solutions', amount: 49, method: 'Stripe', status: 'failed', date: '2026-07-11 08:55' },
];

const mockTickets = [
  { id: 'TKT-001', user: 'Ahmed Al-Rashid', subject: 'Cannot upload CV', priority: 'high', status: 'open', created: '2026-07-16 10:30', assignedTo: 'Support Team' },
  { id: 'TKT-002', user: 'TechCorp Inc', subject: 'Billing discrepancy', priority: 'medium', status: 'in_progress', created: '2026-07-15 14:20', assignedTo: 'Billing Team' },
  { id: 'TKT-003', user: 'Fatima Noor', subject: 'Account verification stuck', priority: 'high', status: 'open', created: '2026-07-16 08:15', assignedTo: 'Unassigned' },
  { id: 'TKT-004', user: 'Global Solutions', subject: 'Feature request: bulk import', priority: 'low', status: 'resolved', created: '2026-07-10 09:00', assignedTo: 'Product Team' },
];

const mockReports = [
  { id: 'RPT-001', reporter: 'Ahmed Al-Rashid', reported: 'Spam Company XYZ', type: 'fraud_report', status: 'open', created: '2026-07-16', description: 'Fake job postings with suspicious links' },
  { id: 'RPT-002', reporter: 'Sara Technologies', reported: 'Omar Hassan', type: 'content_report', status: 'in_progress', created: '2026-07-15', description: 'Inappropriate profile content' },
  { id: 'RPT-003', reporter: 'Fatima Noor', reported: 'TechCorp Inc', type: 'user_report', status: 'resolved', created: '2026-07-12', description: 'Harassment in messages' },
];

const mockAnnouncements = [
  { id: '1', title: 'Platform Maintenance Window', content: 'Scheduled maintenance on July 20th from 2-4 AM UTC', status: 'scheduled', audience: 'all', scheduledAt: '2026-07-20 02:00' },
  { id: '2', title: 'New AI Matching Feature', content: 'We have launched our AI-powered matching engine!', status: 'published', audience: 'all', publishedAt: '2026-07-14' },
  { id: '3', title: 'Premium Plan Price Update', content: 'Starting August 1st, Premium plans will include video interviews', status: 'draft', audience: 'subscribers', scheduledAt: '-' },
];

const mockFeatureFlags = [
  { id: '1', name: 'ai_matching_v2', description: 'Enable AI Matching Engine v2 with semantic analysis', enabled: true, rollout: 100, updatedAt: '2026-07-14' },
  { id: '2', name: 'video_interviews', description: 'Allow video interview scheduling in matches', enabled: false, rollout: 0, updatedAt: '2026-07-10' },
  { id: '3', name: 'dark_mode', description: 'Enable dark mode toggle for all users', enabled: true, rollout: 100, updatedAt: '2026-06-20' },
  { id: '4', name: 'bulk_import', description: 'Allow companies to bulk import job postings via CSV', enabled: true, rollout: 50, updatedAt: '2026-07-15' },
  { id: '5', name: 'smart_notifications', description: 'AI-powered notification timing optimization', enabled: false, rollout: 25, updatedAt: '2026-07-16' },
  { id: '6', name: 'payment_moyasar', description: 'Enable Moyasar payment gateway for MENA region', enabled: true, rollout: 100, updatedAt: '2026-07-01' },
];

const mockAuditLogs = [
  { id: '1', admin: 'Super Admin', action: 'update', resource: 'user', resourceId: 'usr_003', details: 'Suspended user account', ip: '192.168.1.1', timestamp: '2026-07-16 15:30:22' },
  { id: '2', admin: 'Super Admin', action: 'delete', resource: 'job', resourceId: 'job_045', details: 'Removed spam job posting', ip: '192.168.1.1', timestamp: '2026-07-16 14:15:08' },
  { id: '3', admin: 'Support Admin', action: 'update', resource: 'ticket', resourceId: 'TKT-002', details: 'Assigned to Billing Team', ip: '10.0.0.5', timestamp: '2026-07-16 12:45:33' },
  { id: '4', admin: 'Super Admin', action: 'create', resource: 'announcement', resourceId: 'ann_001', details: 'Created maintenance announcement', ip: '192.168.1.1', timestamp: '2026-07-16 10:20:11' },
  { id: '5', admin: 'Super Admin', action: 'update', resource: 'feature_flag', resourceId: 'ff_005', details: 'Enabled smart_notifications at 25%', ip: '192.168.1.1', timestamp: '2026-07-16 09:05:44' },
];

// ============================================================
// Sub-components
// ============================================================

function StatCardMini({ label, value, trend, trendUp, icon }: { label: string; value: string | number; trend?: string; trendUp?: boolean; icon: React.ReactNode }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1 font-[Poppins]">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataTable({ columns, data, actions }: { columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode }[]; data: any[]; actions?: (row: any) => React.ReactNode }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="text-start px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{col.label}</th>
              ))}
              {actions && <th className="text-start px-4 py-3 font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && <td className="px-4 py-3">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    suspended: { variant: 'destructive', label: 'Suspended' },
    pending_verification: { variant: 'secondary', label: 'Pending' },
    paused: { variant: 'secondary', label: 'Paused' },
    expired: { variant: 'outline', label: 'Expired' },
    completed: { variant: 'default', label: 'Completed' },
    refunded: { variant: 'secondary', label: 'Refunded' },
    failed: { variant: 'destructive', label: 'Failed' },
    open: { variant: 'destructive', label: 'Open' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
    resolved: { variant: 'default', label: 'Resolved' },
    closed: { variant: 'outline', label: 'Closed' },
    cancelled: { variant: 'outline', label: 'Cancelled' },
    published: { variant: 'default', label: 'Published' },
    draft: { variant: 'outline', label: 'Draft' },
    scheduled: { variant: 'secondary', label: 'Scheduled' },
    pending: { variant: 'secondary', label: 'Pending' },
  };
  const c = config[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl font-bold font-[Poppins]">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function SearchBar({ placeholder, onSearch }: { placeholder: string; onSearch?: (q: string) => void }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input placeholder={placeholder} className="ps-9 h-9" onChange={(e) => onSearch?.(e.target.value)} />
    </div>
  );
}

// ============================================================
// Section Components
// ============================================================

function DashboardSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard Overview" description="Real-time platform metrics and insights" />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardMini label="Total Users" value={mockStats.totalUsers} trend="+12.5% this month" trendUp icon={<Users className="w-5 h-5" />} />
        <StatCardMini label="Active Jobs" value={mockStats.totalJobs} trend="+8.3% this week" trendUp icon={<Briefcase className="w-5 h-5" />} />
        <StatCardMini label="Total Matches" value={mockStats.totalMatches} trend="+23.1% this month" trendUp icon={<Heart className="w-5 h-5" />} />
        <StatCardMini label="Revenue (USD)" value={`$${mockStats.revenue.toLocaleString()}`} trend="+15.7% this month" trendUp icon={<DollarSign className="w-5 h-5" />} />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardMini label="New Users Today" value={mockStats.newUsersToday} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCardMini label="Active Now" value={mockStats.activeUsersNow} icon={<Activity className="w-5 h-5" />} />
        <StatCardMini label="Active Subscriptions" value={mockStats.activeSubscriptions} icon={<CreditCard className="w-5 h-5" />} />
        <StatCardMini label="Open Tickets" value={mockStats.supportTicketsOpen} trend="3 critical" icon={<HeadphonesIcon className="w-5 h-5" />} />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Poppins]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Add User</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><Megaphone className="w-4 h-4" /> Announcement</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export Data</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><RefreshCw className="w-4 h-4" /> Sync Cache</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Poppins]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAuditLogs.slice(0, 4).map(log => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate"><span className="font-medium">{log.admin}</span> {log.details}</p>
                  <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-[Poppins]">Platform Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">API Server</p>
                <p className="text-xs text-muted-foreground">99.9% uptime</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">12ms avg latency</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Storage</p>
                <p className="text-xs text-muted-foreground">45% used (2.3TB)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Email Service</p>
                <p className="text-xs text-muted-foreground">Rate limited (85%)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredUsers = useMemo(() =>
    mockUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="User Management"
        description={`${mockStats.totalUsers.toLocaleString()} total users`}
        action={<Button size="sm" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Add User</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar placeholder="Search users..." onSearch={setSearchQuery} />
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="job_seeker">Job Seekers</SelectItem>
            <SelectItem value="company">Companies</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending_verification">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (v, row) => (
            <div>
              <p className="font-medium">{v}</p>
              <p className="text-xs text-muted-foreground">{row.email}</p>
            </div>
          )},
          { key: 'role', label: 'Role', render: (v) => <Badge variant="outline" className="text-xs capitalize">{v.replace('_', ' ')}</Badge> },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'joinedAt', label: 'Joined' },
          { key: 'lastActive', label: 'Last Active' },
        ]}
        data={filteredUsers}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" title="View"><Eye className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" title="Edit"><Edit className="w-4 h-4" /></Button>
            {row.status === 'active' ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" title="Suspend" onClick={() => toast.success('User suspended')}><Ban className="w-4 h-4" /></Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" title="Activate" onClick={() => toast.success('User activated')}><CheckCircle2 className="w-4 h-4" /></Button>
            )}
          </div>
        )}
      />
    </div>
  );
}

function CompaniesSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Company Management"
        description={`${mockStats.totalCompanies.toLocaleString()} registered companies`}
        action={<Button size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar placeholder="Search companies..." />
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Company', render: (v, row) => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{v}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
            </div>
          )},
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'joinedAt', label: 'Joined' },
          { key: 'lastActive', label: 'Last Active' },
        ]}
        data={mockUsers.filter(u => u.role === 'company')}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Edit className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><MoreHorizontal className="w-4 h-4" /></Button>
          </div>
        )}
      />

      {/* Company Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-[Poppins]">89%</p>
            <p className="text-xs text-muted-foreground">Verified Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-[Poppins]">4.2</p>
            <p className="text-xs text-muted-foreground">Avg Jobs/Company</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-[Poppins]">72%</p>
            <p className="text-xs text-muted-foreground">Active This Month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function JobsSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Job Management"
        description={`${mockStats.totalJobs.toLocaleString()} total job postings`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer"><Filter className="w-4 h-4" /> Filter</Button>
            <Button size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export</Button>
          </div>
        }
      />

      <SearchBar placeholder="Search jobs..." />

      <DataTable
        columns={[
          { key: 'title', label: 'Job Title', render: (v, row) => (
            <div>
              <p className="font-medium">{v}</p>
              <p className="text-xs text-muted-foreground">{row.company}</p>
            </div>
          )},
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'applicants', label: 'Applicants', render: (v) => <span className="font-medium">{v}</span> },
          { key: 'posted', label: 'Posted' },
          { key: 'expires', label: 'Expires' },
        ]}
        data={mockJobs}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status === 'active' ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-amber-600" title="Pause" onClick={() => toast.success('Job paused')}><Clock className="w-4 h-4" /></Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" title="Activate" onClick={() => toast.success('Job activated')}><CheckCircle2 className="w-4 h-4" /></Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" title="Remove" onClick={() => toast.success('Job removed')}><Trash2 className="w-4 h-4" /></Button>
          </div>
        )}
      />
    </div>
  );
}

function MatchesSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Match Management"
        description={`${mockStats.totalMatches.toLocaleString()} total matches created`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCardMini label="Active Matches" value={3241} icon={<Heart className="w-5 h-5" />} />
        <StatCardMini label="Avg Match Score" value="82%" icon={<Zap className="w-5 h-5" />} />
        <StatCardMini label="Conversion Rate" value="34%" trend="+5.2%" trendUp icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      <DataTable
        columns={[
          { key: 'seeker', label: 'Job Seeker' },
          { key: 'company', label: 'Company' },
          { key: 'job', label: 'Position' },
          { key: 'score', label: 'Score', render: (v) => (
            <div className="flex items-center gap-2">
              <Progress value={v} className="w-16 h-2" />
              <span className="text-sm font-medium">{v}%</span>
            </div>
          )},
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'matchedAt', label: 'Matched' },
        ]}
        data={mockMatches}
        actions={() => (
          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
        )}
      />
    </div>
  );
}

function SubscriptionsSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Subscription Management"
        description="Manage all user subscriptions and plans"
        action={<Button size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Active Subs" value={mockStats.activeSubscriptions} icon={<CreditCard className="w-5 h-5" />} />
        <StatCardMini label="MRR" value="$47,200" icon={<DollarSign className="w-5 h-5" />} />
        <StatCardMini label="Churn Rate" value="3.2%" icon={<TrendingDown className="w-5 h-5" />} />
        <StatCardMini label="Avg LTV" value="$342" icon={<Star className="w-5 h-5" />} />
      </div>

      <DataTable
        columns={[
          { key: 'user', label: 'User' },
          { key: 'plan', label: 'Plan', render: (v) => <Badge variant="outline">{v}</Badge> },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'amount', label: 'Amount', render: (v, row) => <span className="font-medium">${v}/{row.billingCycle === 'yearly' ? 'yr' : 'mo'}</span> },
          { key: 'nextBilling', label: 'Next Billing' },
          { key: 'startedAt', label: 'Started' },
        ]}
        data={mockSubscriptions}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status === 'active' && (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" title="Cancel" onClick={() => toast.success('Subscription cancelled')}><XCircle className="w-4 h-4" /></Button>
            )}
          </div>
        )}
      />
    </div>
  );
}

function PaymentsSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Payment Management"
        description="Track all transactions and refunds"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer"><Filter className="w-4 h-4" /> Filter</Button>
            <Button size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export CSV</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Total Revenue" value={`$${mockStats.revenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatCardMini label="This Month" value="$32,450" trend="+18%" trendUp icon={<TrendingUp className="w-5 h-5" />} />
        <StatCardMini label="Refunds" value="$1,230" icon={<RefreshCw className="w-5 h-5" />} />
        <StatCardMini label="Failed" value="$890" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'Transaction ID', render: (v) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}</code> },
          { key: 'user', label: 'User' },
          { key: 'amount', label: 'Amount', render: (v) => <span className="font-medium">${v}</span> },
          { key: 'method', label: 'Method' },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'date', label: 'Date' },
        ]}
        data={mockPayments}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status === 'completed' && (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-amber-600" title="Refund" onClick={() => toast.success('Refund initiated')}><RefreshCw className="w-4 h-4" /></Button>
            )}
          </div>
        )}
      />
    </div>
  );
}

function SupportSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Support Tickets"
        description="Manage customer support requests"
        action={<Button size="sm" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Create Ticket</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Open" value={12} icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCardMini label="In Progress" value={8} icon={<Clock className="w-5 h-5" />} />
        <StatCardMini label="Resolved Today" value={15} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCardMini label="Avg Response" value="2.4h" icon={<Activity className="w-5 h-5" />} />
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'Ticket', render: (v) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}</code> },
          { key: 'user', label: 'User' },
          { key: 'subject', label: 'Subject' },
          { key: 'priority', label: 'Priority', render: (v) => {
            const colors: Record<string, string> = { low: 'text-slate-500', medium: 'text-amber-600', high: 'text-orange-600', critical: 'text-red-600' };
            return <span className={`text-xs font-medium uppercase ${colors[v] || ''}`}>{v}</span>;
          }},
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'assignedTo', label: 'Assigned To' },
          { key: 'created', label: 'Created' },
        ]}
        data={mockTickets}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Send className="w-4 h-4" /></Button>
            {row.status !== 'resolved' && (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" title="Resolve" onClick={() => toast.success('Ticket resolved')}><CheckCircle2 className="w-4 h-4" /></Button>
            )}
          </div>
        )}
      />
    </div>
  );
}

function AnalyticsSection() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics & Insights"
        description="Platform performance metrics"
        action={<Button size="sm" className="gap-2 cursor-pointer" onClick={() => navigate('/admin/analytics')}><BarChart3 className="w-4 h-4" /> Full Dashboard</Button>}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
          <TabsTrigger value="users" className="cursor-pointer">Users</TabsTrigger>
          <TabsTrigger value="engagement" className="cursor-pointer">Engagement</TabsTrigger>
          <TabsTrigger value="revenue" className="cursor-pointer">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardMini label="DAU" value="2,847" trend="+8.3%" trendUp icon={<Users className="w-5 h-5" />} />
            <StatCardMini label="MAU" value="9,234" trend="+12.1%" trendUp icon={<Activity className="w-5 h-5" />} />
            <StatCardMini label="Avg Session" value="8.5 min" trend="+1.2 min" trendUp icon={<Clock className="w-5 h-5" />} />
            <StatCardMini label="Bounce Rate" value="24.3%" trend="-2.1%" trendUp icon={<TrendingDown className="w-5 h-5" />} />
          </div>

          {/* Chart placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-[Poppins]">User Growth (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const h = 20 + Math.random() * 80;
                  return (
                    <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t cursor-pointer" style={{ height: `${h}%` }} title={`Day ${i + 1}: ${Math.floor(h * 2)} users`} />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Jun 17</span>
                <span>Jul 2</span>
                <span>Jul 17</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Job Seekers</p><p className="text-2xl font-bold font-[Poppins]">{mockStats.totalJobSeekers.toLocaleString()}</p><p className="text-xs text-emerald-600">69.5% of users</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Companies</p><p className="text-2xl font-bold font-[Poppins]">{mockStats.totalCompanies.toLocaleString()}</p><p className="text-xs text-primary">30.5% of users</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Retention (30d)</p><p className="text-2xl font-bold font-[Poppins]">67.8%</p><p className="text-xs text-emerald-600">+3.2% vs last month</p></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCardMini label="Swipes/Day" value="34,521" icon={<Heart className="w-5 h-5" />} />
            <StatCardMini label="Messages/Day" value="8,234" icon={<Mail className="w-5 h-5" />} />
            <StatCardMini label="Applications" value="1,456" icon={<FileText className="w-5 h-5" />} />
            <StatCardMini label="Profile Views" value="12,890" icon={<Eye className="w-5 h-5" />} />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCardMini label="MRR" value="$47,200" trend="+15.7%" trendUp icon={<DollarSign className="w-5 h-5" />} />
            <StatCardMini label="ARR" value="$566,400" icon={<TrendingUp className="w-5 h-5" />} />
            <StatCardMini label="ARPU" value="$24.90" icon={<Users className="w-5 h-5" />} />
            <StatCardMini label="LTV" value="$342" icon={<Star className="w-5 h-5" />} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Content Management"
        description="Manage platform content, templates, and resources"
        action={<Button size="sm" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Add Content</Button>}
      />

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="cursor-pointer">Email Templates</TabsTrigger>
          <TabsTrigger value="pages" className="cursor-pointer">Static Pages</TabsTrigger>
          <TabsTrigger value="faq" className="cursor-pointer">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-3">
          {['Welcome Email', 'Password Reset', 'Match Notification', 'Subscription Confirmation', 'Weekly Digest'].map((name, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">Last edited: Jul {10 + i}, 2026</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="pages" className="mt-4 space-y-3">
          {['Terms of Service', 'Privacy Policy', 'About Us', 'Contact', 'Help Center'].map((name, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Edit className="w-4 h-4" /></Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="faq" className="mt-4 space-y-3">
          {['How to create an account?', 'How does matching work?', 'What are subscription plans?', 'How to contact support?'].map((q, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary">Q{i + 1}.</span>
                <p className="text-sm">{q}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Edit className="w-4 h-4" /></Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportsSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Reports & Moderation"
        description="Review user reports and content moderation"
        action={
          <div className="flex gap-2">
            <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> 2 Critical</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Open Reports" value={5} icon={<Flag className="w-5 h-5" />} />
        <StatCardMini label="In Review" value={3} icon={<Clock className="w-5 h-5" />} />
        <StatCardMini label="Resolved (7d)" value={18} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCardMini label="Avg Resolution" value="4.2h" icon={<Activity className="w-5 h-5" />} />
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'Report ID', render: (v) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}</code> },
          { key: 'reporter', label: 'Reporter' },
          { key: 'reported', label: 'Reported' },
          { key: 'type', label: 'Type', render: (v) => <Badge variant="outline" className="text-xs capitalize">{v.replace('_', ' ')}</Badge> },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'created', label: 'Created' },
        ]}
        data={mockReports}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status !== 'resolved' && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" title="Resolve" onClick={() => toast.success('Report resolved')}><CheckCircle2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" title="Ban User" onClick={() => toast.success('User banned')}><Ban className="w-4 h-4" /></Button>
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}

function AnnouncementsSection() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Announcements"
        description="Broadcast messages to platform users"
        action={<Button size="sm" className="gap-2 cursor-pointer" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" /> New Announcement</Button>}
      />

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="Announcement title..." />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea placeholder="Write your announcement..." rows={3} />
            </div>
            <div className="flex gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-40"><SelectValue placeholder="Audience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="seekers">Job Seekers</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                  <SelectItem value="subscribers">Subscribers</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2 cursor-pointer" onClick={() => { setShowForm(false); toast.success('Announcement published'); }}><Send className="w-4 h-4" /> Publish</Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {mockAnnouncements.map(ann => (
          <Card key={ann.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{ann.title}</h4>
                    <StatusBadge status={ann.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Audience: {ann.audience}</span>
                    <span>{ann.status === 'published' ? `Published: ${ann.publishedAt}` : `Scheduled: ${ann.scheduledAt}`}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FeatureFlagsSection() {
  const [flags, setFlags] = useState(mockFeatureFlags);

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    toast.success('Feature flag updated');
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Feature Flags"
        description="Control feature rollouts and A/B tests"
        action={<Button size="sm" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> New Flag</Button>}
      />

      <div className="space-y-3">
        {flags.map(flag => (
          <Card key={flag.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-medium bg-muted px-2 py-0.5 rounded">{flag.name}</code>
                    {flag.enabled ? (
                      <Badge variant="default" className="text-xs gap-1"><Unlock className="w-3 h-3" /> Enabled</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs gap-1"><Lock className="w-3 h-3" /> Disabled</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Rollout:</span>
                      <Progress value={flag.rollout} className="w-20 h-2" />
                      <span className="text-xs font-medium">{flag.rollout}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Updated: {flag.updatedAt}</span>
                  </div>
                </div>
                <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.id)} className="cursor-pointer" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuditLogsSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Audit Logs"
        description="Complete activity trail for compliance and security"
        action={<Button variant="outline" size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export Logs</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar placeholder="Search logs..." />
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Resource" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="job">Job</SelectItem>
            <SelectItem value="ticket">Ticket</SelectItem>
            <SelectItem value="feature_flag">Feature Flag</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: 'timestamp', label: 'Timestamp', render: (v) => <span className="text-xs font-mono">{v}</span> },
          { key: 'admin', label: 'Admin' },
          { key: 'action', label: 'Action', render: (v) => {
            const colors: Record<string, string> = { create: 'bg-emerald-100 text-emerald-700', update: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700', login: 'bg-slate-100 text-slate-700' };
            return <span className={`text-xs px-2 py-0.5 rounded font-medium uppercase ${colors[v] || 'bg-muted'}`}>{v}</span>;
          }},
          { key: 'resource', label: 'Resource', render: (v, row) => (
            <div>
              <span className="capitalize">{v}</span>
              {row.resourceId && <code className="text-xs text-muted-foreground ms-1">({row.resourceId})</code>}
            </div>
          )},
          { key: 'details', label: 'Details' },
          { key: 'ip', label: 'IP', render: (v) => <code className="text-xs">{v}</code> },
        ]}
        data={mockAuditLogs}
      />
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="System Settings" description="Configure platform-wide settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Poppins] flex items-center gap-2"><Globe className="w-4 h-4" /> General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="MatchMe" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@matchme.com" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Disable access for non-admin users</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Registration Open</p>
                <p className="text-xs text-muted-foreground">Allow new user registrations</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Poppins] flex items-center gap-2"><Shield className="w-4 h-4" /> Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Verification</p>
                <p className="text-xs text-muted-foreground">Require email verification on signup</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input type="number" defaultValue="60" />
            </div>
            <div className="space-y-2">
              <Label>Max Login Attempts</Label>
              <Input type="number" defaultValue="5" />
            </div>
          </CardContent>
        </Card>

        {/* Matching Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Poppins] flex items-center gap-2"><Zap className="w-4 h-4" /> Matching Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Minimum Match Score (%)</Label>
              <Input type="number" defaultValue="40" />
            </div>
            <div className="space-y-2">
              <Label>Daily Swipe Limit (Free)</Label>
              <Input type="number" defaultValue="5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Matching</p>
                <p className="text-xs text-muted-foreground">Use AI for enhanced scoring</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Match Expiration</p>
                <p className="text-xs text-muted-foreground">Auto-expire unresponsive matches</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-[Poppins] flex items-center gap-2"><Server className="w-4 h-4" /> Infrastructure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-muted-foreground">PostgreSQL 15</p>
                </div>
              </div>
              <Badge variant="default" className="text-xs">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Storage</p>
                  <p className="text-xs text-muted-foreground">2.3 TB / 5 TB used</p>
                </div>
              </div>
              <Progress value={46} className="w-20 h-2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">CPU Usage</p>
                  <p className="text-xs text-muted-foreground">Average: 34%</p>
                </div>
              </div>
              <Progress value={34} className="w-20 h-2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">API Latency</p>
                  <p className="text-xs text-muted-foreground">Avg: 45ms</p>
                </div>
              </div>
              <Badge variant="default" className="text-xs">Normal</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Change Password */}
      <div className="max-w-lg">
        <ChangePassword />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="cursor-pointer">Reset to Defaults</Button>
        <Button className="cursor-pointer" onClick={() => toast.success('Settings saved successfully')}>Save Settings</Button>
      </div>
    </div>
  );
}

// ============================================================
// Main Admin Component
// ============================================================

export default function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut, email } = useAuthStore();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, badge: 5 },
    { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'matches', label: 'Matches', icon: <Heart className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'support', label: 'Support', icon: <HeadphonesIcon className="w-4 h-4" />, badge: 23 },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'content', label: 'Content', icon: <FileText className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <Flag className="w-4 h-4" />, badge: 2 },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'feature-flags', label: 'Feature Flags', icon: <ToggleLeft className="w-4 h-4" /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />;
      case 'users': return <UsersSection />;
      case 'companies': return <CompaniesSection />;
      case 'jobs': return <JobsSection />;
      case 'matches': return <MatchesSection />;
      case 'subscriptions': return <SubscriptionsSection />;
      case 'payments': return <PaymentsSection />;
      case 'support': return <SupportSection />;
      case 'analytics': return <AnalyticsSection />;
      case 'content': return <ContentSection />;
      case 'reports': return <ReportsSection />;
      case 'announcements': return <AnnouncementsSection />;
      case 'feature-flags': return <FeatureFlagsSection />;
      case 'audit-logs': return <AuditLogsSection />;
      case 'settings': return <SettingsSection />;
      default: return <DashboardSection />;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`hidden lg:flex flex-col border-e bg-card transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold font-[Poppins]">MatchMe</p>
                <p className="text-[10px] text-muted-foreground">Super Admin</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center mx-auto">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-0.5 px-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-start">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-medium">{item.badge}</span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu - show section selector */}
            <div className="lg:hidden">
              <Select value={activeSection} onValueChange={(v) => setActiveSection(v as AdminSection)}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {navItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
            </button>
            <h1 className="hidden lg:block text-sm font-medium font-[Poppins] capitalize">{activeSection.replace('-', ' ')}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 end-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-xs text-white font-medium">SA</span>
              </div>
              <span className="text-xs text-muted-foreground">{email || 'admin@matchme.com'}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}