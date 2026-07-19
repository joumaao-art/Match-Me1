/**
 * Super Admin Platform - Enterprise Platform Owner Portal
 * 
 * Completely isolated from Company and Job Seeker dashboards.
 * Features: Dashboard, Global Search, Company Management, Company Verification,
 * Job Seeker Management, Subscription Management, Billing, Platform Analytics,
 * User Impersonation, Platform Notifications, Feature Flags, Support Center,
 * Audit Logs, System Settings
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { ChangePassword } from '@/components/shared/ChangePassword';
import BillingAnalyticsDashboard from '@/components/shared/BillingAnalytics';
import LocalizationManagement from '@/components/shared/LocalizationManagement';
import {
  adminPlatformService,
  mockPlatformMetrics,
  mockCompanies,
  mockJobSeekers,
  mockSupportTickets,
  mockFeatureFlags as mockFeatureFlagsData,
  mockNotifications,
  type CompanyRecord,
  type JobSeekerRecord,
  type GlobalSearchResult,
  type ImpersonationSession,
} from '@/services/admin-platform';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  LayoutDashboard, Users, Building2, Briefcase, Heart, CreditCard,
  DollarSign, HeadphonesIcon, BarChart3, FileText, Flag, Megaphone,
  ToggleLeft, ScrollText, Settings, LogOut, Search, Bell,
  ChevronDown, MoreHorizontal, Download, Plus, Trash2,
  Edit, Eye, Ban, CheckCircle2, XCircle, Clock, TrendingUp,
  TrendingDown, Activity, Shield, AlertTriangle, RefreshCw,
  Send, Star, Globe, Lock, Unlock, Database,
  Server, Cpu, HardDrive, Wifi, Mail, UserCheck,
  ShieldCheck, Monitor, Zap as ZapIcon,
  Target, Layers, Hash, Command, X, ArrowRight,
  RotateCcw, Gift, Pause, Play,
  MessageSquare, LifeBuoy,
  Gauge, Crown, Sparkles, EyeOff, UserCog
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type AdminSection =
  | 'dashboard' | 'global_search' | 'companies' | 'verification'
  | 'job_seekers' | 'subscriptions' | 'billing' | 'billing_analytics'
  | 'analytics' | 'impersonation' | 'notifications' | 'feature_flags'
  | 'support' | 'audit_logs' | 'settings' | 'localization';

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

// ============================================================
// Reusable Sub-components
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
    banned: { variant: 'destructive', label: 'Banned' },
    pending_verification: { variant: 'secondary', label: 'Pending' },
    pending: { variant: 'secondary', label: 'Pending' },
    rejected: { variant: 'destructive', label: 'Rejected' },
    verified: { variant: 'default', label: 'Verified' },
    paused: { variant: 'secondary', label: 'Paused' },
    expired: { variant: 'outline', label: 'Expired' },
    completed: { variant: 'default', label: 'Completed' },
    refunded: { variant: 'secondary', label: 'Refunded' },
    failed: { variant: 'destructive', label: 'Failed' },
    open: { variant: 'destructive', label: 'Open' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
    waiting_user: { variant: 'outline', label: 'Waiting' },
    resolved: { variant: 'default', label: 'Resolved' },
    closed: { variant: 'outline', label: 'Closed' },
    cancelled: { variant: 'outline', label: 'Cancelled' },
    published: { variant: 'default', label: 'Published' },
    draft: { variant: 'outline', label: 'Draft' },
    scheduled: { variant: 'secondary', label: 'Scheduled' },
    sent: { variant: 'default', label: 'Sent' },
    healthy: { variant: 'default', label: 'Healthy' },
    degraded: { variant: 'secondary', label: 'Degraded' },
    down: { variant: 'destructive', label: 'Down' },
    critical: { variant: 'destructive', label: 'Critical' },
    high: { variant: 'destructive', label: 'High' },
    medium: { variant: 'secondary', label: 'Medium' },
    low: { variant: 'outline', label: 'Low' },
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

// ============================================================
// Section: Dashboard
// ============================================================

function DashboardSection() {
  const metrics = mockPlatformMetrics;
  return (
    <div className="space-y-6">
      <SectionHeader title="Platform Dashboard" description="Real-time executive overview of the MatchMe ecosystem" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardMini label="Total Companies" value={metrics.totalCompanies} trend="+12.5% this month" trendUp icon={<Building2 className="w-5 h-5" />} />
        <StatCardMini label="Total Job Seekers" value={metrics.totalJobSeekers} trend="+18.3% this month" trendUp icon={<Users className="w-5 h-5" />} />
        <StatCardMini label="Monthly Revenue" value={`$${metrics.monthlyRevenue.toLocaleString()}`} trend="+15.7%" trendUp icon={<DollarSign className="w-5 h-5" />} />
        <StatCardMini label="Active Matches" value={metrics.matches} trend="+23.1%" trendUp icon={<Heart className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-600">{metrics.verifiedCompanies}</p><p className="text-[11px] text-muted-foreground">Verified</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-600">{metrics.pendingCompanies}</p><p className="text-[11px] text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-red-600">{metrics.suspendedCompanies}</p><p className="text-[11px] text-muted-foreground">Suspended</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{metrics.activeTrials}</p><p className="text-[11px] text-muted-foreground">Active Trials</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardMini label="Premium Users" value={metrics.premiumUsers} icon={<Crown className="w-5 h-5" />} />
        <StatCardMini label="Premium+ Users" value={metrics.premiumPlusUsers} icon={<Sparkles className="w-5 h-5" />} />
        <StatCardMini label="Jobs Posted" value={metrics.jobsPosted} icon={<Briefcase className="w-5 h-5" />} />
        <StatCardMini label="Applications" value={metrics.applications} icon={<FileText className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardMini label="Interviews" value={metrics.interviews} icon={<MessageSquare className="w-5 h-5" />} />
        <StatCardMini label="Offers" value={metrics.offers} icon={<Gift className="w-5 h-5" />} />
        <StatCardMini label="Hires" value={metrics.hires} icon={<UserCheck className="w-5 h-5" />} />
        <StatCardMini label="Featured Candidates" value={metrics.featuredCandidates} icon={<Star className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardMini label="MRR" value={`$${metrics.mrr.toLocaleString()}`} trend="+8.2%" trendUp icon={<TrendingUp className="w-5 h-5" />} />
        <StatCardMini label="ARR" value={`$${metrics.arr.toLocaleString()}`} icon={<BarChart3 className="w-5 h-5" />} />
        <StatCardMini label="Directory Profiles" value={metrics.candidateDirectoryProfiles} icon={<Target className="w-5 h-5" />} />
        <StatCardMini label="Support Tickets" value={metrics.supportTickets} icon={<HeadphonesIcon className="w-5 h-5" />} />
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">Companies by Plan</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(metrics.companiesByPlan).map(([plan, count]) => (
              <div key={plan} className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold font-[Poppins]">{count}</p>
                <p className="text-xs text-muted-foreground">{plan}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">Platform Health</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(metrics.platformHealth).map(([service, status]) => (
              <div key={service} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${status === 'healthy' ? 'bg-emerald-500' : status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium capitalize">{service}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Add Company</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><Megaphone className="w-4 h-4" /> Broadcast</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export Data</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><RefreshCw className="w-4 h-4" /> Sync Cache</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><Shield className="w-4 h-4" /> Security Scan</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2 cursor-pointer"><ToggleLeft className="w-4 h-4" /> Feature Flags</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { action: 'Verified company BuildRight Construction', time: '5 mins ago' },
              { action: 'Resolved ticket TKT-004', time: '15 mins ago' },
              { action: 'Updated feature flag ai_matching_v2', time: '1 hour ago' },
              { action: 'Suspended user Omar Hassan', time: '2 hours ago' },
              { action: 'Issued refund $29 to Global Solutions', time: '3 hours ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Section: Global Search
// ============================================================

function GlobalSearchSection() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const res = await adminPlatformService.globalSearch(q, typeFilter !== 'all' ? { type: typeFilter } : undefined);
    setResults(res);
    setSearching(false);
  }, [typeFilter]);

  const typeIcons: Record<string, React.ReactNode> = {
    company: <Building2 className="w-4 h-4" />,
    job_seeker: <Users className="w-4 h-4" />,
    recruiter: <UserCog className="w-4 h-4" />,
    job: <Briefcase className="w-4 h-4" />,
    invoice: <FileText className="w-4 h-4" />,
    payment: <DollarSign className="w-4 h-4" />,
    ticket: <HeadphonesIcon className="w-4 h-4" />,
    audit_log: <ScrollText className="w-4 h-4" />,
    subscription: <CreditCard className="w-4 h-4" />,
    message: <MessageSquare className="w-4 h-4" />,
    report: <Flag className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Global Search" description="Search across the entire platform" />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search companies, users, jobs, invoices, tickets..." className="ps-12 h-12 text-base" value={query} onChange={(e) => handleSearch(e.target.value)} autoFocus />
          {searching && <RefreshCw className="absolute end-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 h-12"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="company">Companies</SelectItem>
            <SelectItem value="job_seeker">Job Seekers</SelectItem>
            <SelectItem value="job">Jobs</SelectItem>
            <SelectItem value="ticket">Support Tickets</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{results.length} results found</p>
          {results.map(result => (
            <Card key={result.id} className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    {typeIcons[result.type] || <Hash className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{result.title}</p>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{result.type.replace('_', ' ')}</Badge>
                      {result.status && <StatusBadge status={result.status} />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 cursor-pointer"><ArrowRight className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && !searching && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
        </div>
      )}
      {query.length < 2 && (
        <div className="text-center py-12">
          <Command className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Start typing to search across the platform</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['Companies', 'Job Seekers', 'Jobs', 'Invoices', 'Payments', 'Tickets', 'Audit Logs'].map(t => (
              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Section: Company Management
// ============================================================

function CompanyManagementSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [actionType, setActionType] = useState('');

  const filteredCompanies = useMemo(() =>
    mockCompanies.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [searchQuery, statusFilter]);

  const handleAction = (company: CompanyRecord, action: string) => {
    setSelectedCompany(company);
    setActionType(action);
    setShowActionDialog(true);
  };

  const executeAction = () => {
    if (!selectedCompany) return;
    switch (actionType) {
      case 'suspend': adminPlatformService.suspendCompany(selectedCompany.id, 'Admin action'); toast.success(`${selectedCompany.name} suspended`); break;
      case 'reactivate': adminPlatformService.reactivateCompany(selectedCompany.id); toast.success(`${selectedCompany.name} reactivated`); break;
      case 'verify': adminPlatformService.verifyCompany(selectedCompany.id); toast.success(`${selectedCompany.name} verified`); break;
      case 'reject': adminPlatformService.rejectCompany(selectedCompany.id, 'Admin decision'); toast.success('Verification rejected'); break;
      case 'delete': toast.success(`${selectedCompany.name} deleted`); break;
      case 'transfer': adminPlatformService.transferOwnership(selectedCompany.id, 'new-owner'); toast.success('Ownership transferred'); break;
    }
    setShowActionDialog(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Company Management" description={`${mockCompanies.length} registered companies`} action={<div className="flex gap-2"><Button variant="outline" size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export</Button><Button size="sm" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Add Company</Button></div>} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search companies..." className="ps-9 h-9" onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          { key: 'name', label: 'Company', render: (_v, row) => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-primary" /></div>
              <div>
                <div className="flex items-center gap-1.5"><p className="font-medium">{row.name}</p>{row.verificationStatus === 'verified' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}</div>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
            </div>
          )},
          { key: 'industry', label: 'Industry' },
          { key: 'plan', label: 'Plan', render: (v) => <Badge variant="outline">{v}</Badge> },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'activeJobs', label: 'Jobs' },
          { key: 'revenue', label: 'Revenue', render: (v) => <span className="font-medium">${v}</span> },
          { key: 'lastActive', label: 'Last Active' },
        ]}
        data={filteredCompanies}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status === 'active' ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" onClick={() => handleAction(row, 'suspend')}><Ban className="w-4 h-4" /></Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" onClick={() => handleAction(row, 'reactivate')}><CheckCircle2 className="w-4 h-4" /></Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => handleAction(row, 'transfer')}><MoreHorizontal className="w-4 h-4" /></Button>
          </div>
        )}
      />
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionType} Company</DialogTitle>
            <DialogDescription>Are you sure you want to {actionType} <strong>{selectedCompany?.name}</strong>? This action will be logged.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={executeAction} variant={actionType === 'suspend' || actionType === 'delete' ? 'destructive' : 'default'} className="cursor-pointer">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Section: Company Verification
// ============================================================

function CompanyVerificationSection() {
  const pendingCompanies = mockCompanies.filter(c => c.verificationStatus === 'pending');
  const verifiedCompanies = mockCompanies.filter(c => c.verificationStatus === 'verified');
  const rejectedCompanies = mockCompanies.filter(c => c.verificationStatus === 'rejected');

  return (
    <div className="space-y-6">
      <SectionHeader title="Company Verification" description="Review and manage company verification requests" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Verified" value={verifiedCompanies.length} icon={<ShieldCheck className="w-5 h-5" />} />
        <StatCardMini label="Pending" value={pendingCompanies.length} icon={<Clock className="w-5 h-5" />} />
        <StatCardMini label="Rejected" value={rejectedCompanies.length} icon={<XCircle className="w-5 h-5" />} />
        <StatCardMini label="Verification Rate" value="89%" icon={<Target className="w-5 h-5" />} />
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="cursor-pointer">Pending ({pendingCompanies.length})</TabsTrigger>
          <TabsTrigger value="verified" className="cursor-pointer">Verified</TabsTrigger>
          <TabsTrigger value="rejected" className="cursor-pointer">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingCompanies.map(company => (
            <Card key={company.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center"><Building2 className="w-6 h-6 text-amber-600" /></div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">{company.industry} &bull; {company.size} employees &bull; {company.country}</p>
                      <p className="text-xs text-muted-foreground mt-1">Applied: {company.joinedAt}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 cursor-pointer"><Eye className="w-3 h-3" /> Review</Button>
                    <Button size="sm" className="gap-1 cursor-pointer bg-emerald-600 hover:bg-emerald-700" onClick={() => { adminPlatformService.verifyCompany(company.id); toast.success(`${company.name} verified`); }}><CheckCircle2 className="w-3 h-3" /> Approve</Button>
                    <Button variant="destructive" size="sm" className="gap-1 cursor-pointer" onClick={() => { adminPlatformService.rejectCompany(company.id, 'Insufficient docs'); toast.success('Rejected'); }}><XCircle className="w-3 h-3" /> Reject</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="verified" className="mt-4 space-y-3">
          {verifiedCompanies.map(company => (
            <Card key={company.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-600" /><div><p className="font-medium">{company.name}</p><p className="text-xs text-muted-foreground">{company.industry} &bull; {company.country}</p></div></div>
                <Badge variant="default" className="text-xs">Verified</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejectedCompanies.map(company => (
            <Card key={company.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><XCircle className="w-5 h-5 text-red-600" /><div><p className="font-medium">{company.name}</p><p className="text-xs text-muted-foreground">{company.industry}</p></div></div>
                <Button variant="outline" size="sm" className="cursor-pointer">Re-review</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Section: Job Seeker Management
// ============================================================

function JobSeekerManagementSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const filteredSeekers = useMemo(() =>
    mockJobSeekers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.skills.some(sk => sk.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesPlan = planFilter === 'all' || s.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    }), [searchQuery, statusFilter, planFilter]);

  return (
    <div className="space-y-4">
      <SectionHeader title="Job Seeker Management" description={`${mockJobSeekers.length} registered job seekers`} action={<Button variant="outline" size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Active" value={mockJobSeekers.filter(s => s.status === 'active').length} icon={<UserCheck className="w-5 h-5" />} />
        <StatCardMini label="Premium" value={mockJobSeekers.filter(s => s.plan === 'Premium').length} icon={<Crown className="w-5 h-5" />} />
        <StatCardMini label="Premium+" value={mockJobSeekers.filter(s => s.plan === 'Premium+').length} icon={<Sparkles className="w-5 h-5" />} />
        <StatCardMini label="Featured" value={mockJobSeekers.filter(s => s.featured).length} icon={<Star className="w-5 h-5" />} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-72"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search seekers, skills..." className="ps-9 h-9" onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="banned">Banned</SelectItem></SelectContent></Select>
        <Select value={planFilter} onValueChange={setPlanFilter}><SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Plan" /></SelectTrigger><SelectContent><SelectItem value="all">All Plans</SelectItem><SelectItem value="Free">Free</SelectItem><SelectItem value="Premium">Premium</SelectItem><SelectItem value="Premium+">Premium+</SelectItem></SelectContent></Select>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Job Seeker', render: (_v, row) => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{row.name.charAt(0)}</div>
              <div><div className="flex items-center gap-1.5"><p className="font-medium">{row.name}</p>{row.featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}</div><p className="text-xs text-muted-foreground">{row.email}</p></div>
            </div>
          )},
          { key: 'plan', label: 'Plan', render: (v) => <Badge variant={v === 'Premium+' ? 'default' : v === 'Premium' ? 'secondary' : 'outline'} className="text-xs">{v}</Badge> },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'visibility', label: 'Visibility', render: (v) => <span className="text-xs capitalize flex items-center gap-1">{v === 'public' ? <Eye className="w-3 h-3" /> : v === 'anonymous' ? <EyeOff className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{v}</span> },
          { key: 'profileScore', label: 'Score', render: (v) => <div className="flex items-center gap-2"><Progress value={v} className="w-12 h-2" /><span className="text-xs font-medium">{v}%</span></div> },
          { key: 'applications', label: 'Apps' },
          { key: 'matches', label: 'Matches' },
          { key: 'lastActive', label: 'Last Active' },
        ]}
        data={filteredSeekers}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status === 'active' ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" onClick={() => { adminPlatformService.suspendSeeker(row.id, 'Admin action'); toast.success(`${row.name} suspended`); }}><Ban className="w-4 h-4" /></Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" onClick={() => { adminPlatformService.reactivateSeeker(row.id); toast.success(`${row.name} reactivated`); }}><CheckCircle2 className="w-4 h-4" /></Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => { adminPlatformService.resetSeekerSubscription(row.id); toast.success('Subscription reset'); }}><RotateCcw className="w-4 h-4" /></Button>
          </div>
        )}
      />
    </div>
  );
}

// ============================================================
// Section: Subscription Management
// ============================================================

function SubscriptionManagementSection() {
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantType, setGrantType] = useState<'complimentary' | 'trial'>('trial');
  const mockSubs = [
    { id: '1', user: 'TechCorp Inc', type: 'company', plan: 'Enterprise', status: 'active', amount: 299, cycle: 'monthly', nextBilling: '2026-08-15', started: '2026-06-15' },
    { id: '2', user: 'Ahmed Al-Rashid', type: 'job_seeker', plan: 'Premium', status: 'active', amount: 29, cycle: 'monthly', nextBilling: '2026-08-10', started: '2026-07-10' },
    { id: '3', user: 'Sara Technologies', type: 'company', plan: 'Business', status: 'active', amount: 99, cycle: 'monthly', nextBilling: '2026-08-20', started: '2026-01-20' },
    { id: '4', user: 'Global Solutions', type: 'company', plan: 'Starter', status: 'cancelled', amount: 49, cycle: 'monthly', nextBilling: '-', started: '2026-05-01' },
    { id: '5', user: 'Youssef Amr', type: 'job_seeker', plan: 'Premium+', status: 'active', amount: 49, cycle: 'monthly', nextBilling: '2026-08-01', started: '2026-02-01' },
    { id: '6', user: 'Fatima Noor', type: 'job_seeker', plan: 'Premium+', status: 'paused', amount: 49, cycle: 'monthly', nextBilling: '-', started: '2026-05-10' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="Subscription Management" description="Manage all subscriptions, trials, and overrides" action={<div className="flex gap-2"><Button variant="outline" size="sm" className="gap-2 cursor-pointer" onClick={() => { setGrantType('trial'); setShowGrantDialog(true); }}><Gift className="w-4 h-4" /> Grant Trial</Button><Button size="sm" className="gap-2 cursor-pointer" onClick={() => { setGrantType('complimentary'); setShowGrantDialog(true); }}><Crown className="w-4 h-4" /> Grant Access</Button></div>} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Active Subs" value={1893} icon={<CreditCard className="w-5 h-5" />} />
        <StatCardMini label="MRR" value="$47,200" trend="+8.2%" trendUp icon={<DollarSign className="w-5 h-5" />} />
        <StatCardMini label="Churn Rate" value="3.2%" icon={<TrendingDown className="w-5 h-5" />} />
        <StatCardMini label="Active Trials" value={234} icon={<Clock className="w-5 h-5" />} />
      </div>
      <DataTable
        columns={[
          { key: 'user', label: 'User', render: (_v, row) => <div><p className="font-medium">{row.user}</p><p className="text-xs text-muted-foreground capitalize">{row.type.replace('_', ' ')}</p></div> },
          { key: 'plan', label: 'Plan', render: (v) => <Badge variant="outline">{v}</Badge> },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'amount', label: 'Amount', render: (v, row) => <span className="font-medium">${v}/{row.cycle === 'yearly' ? 'yr' : 'mo'}</span> },
          { key: 'nextBilling', label: 'Next Billing' },
          { key: 'started', label: 'Started' },
        ]}
        data={mockSubs}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status === 'active' && <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-amber-600" onClick={() => toast.success('Paused')}><Pause className="w-4 h-4" /></Button>}
            {row.status === 'active' && <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive" onClick={() => toast.success('Cancelled')}><XCircle className="w-4 h-4" /></Button>}
            {row.status === 'paused' && <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" onClick={() => toast.success('Resumed')}><Play className="w-4 h-4" /></Button>}
            {row.status === 'cancelled' && <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-primary" onClick={() => toast.success('Reactivated')}><RefreshCw className="w-4 h-4" /></Button>}
          </div>
        )}
      />
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{grantType === 'trial' ? 'Grant Trial' : 'Grant Complimentary Access'}</DialogTitle><DialogDescription>{grantType === 'trial' ? 'Give a free trial period.' : 'Grant free access without billing.'}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>User Email</Label><Input placeholder="user@email.com" /></div>
            <div className="space-y-2"><Label>Plan</Label><Select defaultValue="premium"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="premium">Premium</SelectItem><SelectItem value="premium_plus">Premium+</SelectItem><SelectItem value="business">Business</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>{grantType === 'trial' ? 'Duration (days)' : 'Duration'}</Label><Input type="number" defaultValue="14" /></div>
            <div className="space-y-2"><Label>Reason</Label><Textarea placeholder="Reason..." rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowGrantDialog(false)} className="cursor-pointer">Cancel</Button><Button onClick={() => { setShowGrantDialog(false); toast.success('Granted'); }} className="cursor-pointer">Grant</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Section: Billing Management
// ============================================================

function BillingManagementSection() {
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const mockPayments = [
    { id: 'PAY-001', user: 'TechCorp Inc', amount: 299, method: 'Stripe', status: 'completed', date: '2026-07-15', invoice: 'INV-0145' },
    { id: 'PAY-002', user: 'Ahmed Al-Rashid', amount: 29, method: 'Apple Pay', status: 'completed', date: '2026-07-14', invoice: 'INV-0144' },
    { id: 'PAY-003', user: 'Sara Technologies', amount: 99, method: 'Stripe', status: 'completed', date: '2026-07-13', invoice: 'INV-0143' },
    { id: 'PAY-004', user: 'Omar Hassan', amount: 29, method: 'Google Pay', status: 'refunded', date: '2026-07-12', invoice: 'INV-0142' },
    { id: 'PAY-005', user: 'Global Solutions', amount: 49, method: 'Stripe', status: 'failed', date: '2026-07-11', invoice: '-' },
    { id: 'PAY-006', user: 'BuildRight', amount: 299, method: 'Moyasar', status: 'completed', date: '2026-07-10', invoice: 'INV-0141' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="Billing Management" description="Payments, invoices, refunds, and revenue" action={<div className="flex gap-2"><Button variant="outline" size="sm" className="gap-2 cursor-pointer"><FileText className="w-4 h-4" /> Generate Invoice</Button><Button variant="outline" size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export</Button></div>} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Total Revenue" value="$284,500" trend="+15.7%" trendUp icon={<DollarSign className="w-5 h-5" />} />
        <StatCardMini label="This Month" value="$47,200" trend="+18%" trendUp icon={<TrendingUp className="w-5 h-5" />} />
        <StatCardMini label="Refunds" value="$1,230" icon={<RefreshCw className="w-5 h-5" />} />
        <StatCardMini label="Failed" value="$890" icon={<AlertTriangle className="w-5 h-5" />} />
      </div>
      <DataTable
        columns={[
          { key: 'id', label: 'ID', render: (v) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}</code> },
          { key: 'user', label: 'User' },
          { key: 'amount', label: 'Amount', render: (v) => <span className="font-medium">${v}</span> },
          { key: 'method', label: 'Method' },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
          { key: 'invoice', label: 'Invoice' },
          { key: 'date', label: 'Date' },
        ]}
        data={mockPayments}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
            {row.status === 'completed' && <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-amber-600" onClick={() => setShowRefundDialog(true)}><RefreshCw className="w-4 h-4" /></Button>}
            {row.status === 'failed' && <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-primary" onClick={() => { adminPlatformService.retryPayment(row.id); toast.success('Retry initiated'); }}><RotateCcw className="w-4 h-4" /></Button>}
          </div>
        )}
      />
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue Refund</DialogTitle><DialogDescription>Process a refund. This action will be logged.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Reason</Label><Select defaultValue="billing_error"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="billing_error">Billing Error</SelectItem><SelectItem value="service_issue">Service Issue</SelectItem><SelectItem value="customer_request">Customer Request</SelectItem><SelectItem value="duplicate">Duplicate Charge</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Details..." rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowRefundDialog(false)} className="cursor-pointer">Cancel</Button><Button onClick={() => { setShowRefundDialog(false); toast.success('Refund processed'); }} className="cursor-pointer">Process Refund</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Section: Platform Analytics
// ============================================================

function PlatformAnalyticsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Platform Analytics" description="Comprehensive performance metrics" />
      <Tabs defaultValue="growth">
        <TabsList>
          <TabsTrigger value="growth" className="cursor-pointer">Growth</TabsTrigger>
          <TabsTrigger value="revenue" className="cursor-pointer">Revenue</TabsTrigger>
          <TabsTrigger value="engagement" className="cursor-pointer">Engagement</TabsTrigger>
          <TabsTrigger value="demographics" className="cursor-pointer">Demographics</TabsTrigger>
        </TabsList>
        <TabsContent value="growth" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardMini label="DAU" value="2,847" trend="+8.3%" trendUp icon={<Users className="w-5 h-5" />} />
            <StatCardMini label="MAU" value="9,234" trend="+12.1%" trendUp icon={<Activity className="w-5 h-5" />} />
            <StatCardMini label="Company Growth" value="+127" trend="This month" trendUp icon={<Building2 className="w-5 h-5" />} />
            <StatCardMini label="Seeker Growth" value="+892" trend="This month" trendUp icon={<UserCheck className="w-5 h-5" />} />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">User Growth (30 Days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const h = 30 + Math.random() * 70;
                  return <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t cursor-pointer" style={{ height: `${h}%` }} />;
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardMini label="MRR" value="$47,200" trend="+8.2%" trendUp icon={<DollarSign className="w-5 h-5" />} />
            <StatCardMini label="ARR" value="$566,400" trend="+15.7%" trendUp icon={<TrendingUp className="w-5 h-5" />} />
            <StatCardMini label="ARPU" value="$24.90" icon={<Users className="w-5 h-5" />} />
            <StatCardMini label="LTV" value="$342" icon={<Star className="w-5 h-5" />} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardMini label="Churn" value="3.2%" trend="-0.4%" trendUp icon={<TrendingDown className="w-5 h-5" />} />
            <StatCardMini label="Trial Conversion" value="34.5%" icon={<Target className="w-5 h-5" />} />
            <StatCardMini label="Expansion Revenue" value="$8,400" icon={<ZapIcon className="w-5 h-5" />} />
            <StatCardMini label="Net Retention" value="112%" icon={<Gauge className="w-5 h-5" />} />
          </div>
        </TabsContent>
        <TabsContent value="engagement" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardMini label="AI Usage" value="12,450" trend="Queries/day" icon={<ZapIcon className="w-5 h-5" />} />
            <StatCardMini label="Directory Views" value="8,234" trend="+23%" trendUp icon={<Target className="w-5 h-5" />} />
            <StatCardMini label="Recruiter Invites" value="1,456" icon={<Send className="w-5 h-5" />} />
            <StatCardMini label="Profile Views" value="34,521" trend="+18%" trendUp icon={<Eye className="w-5 h-5" />} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardMini label="Search Volume" value="45,678" icon={<Search className="w-5 h-5" />} />
            <StatCardMini label="Messages/Day" value="8,234" icon={<MessageSquare className="w-5 h-5" />} />
            <StatCardMini label="Applications/Day" value="1,456" icon={<FileText className="w-5 h-5" />} />
            <StatCardMini label="Feature Adoption" value="78%" icon={<Layers className="w-5 h-5" />} />
          </div>
        </TabsContent>
        <TabsContent value="demographics" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">Top Countries</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[{ country: 'Saudi Arabia', pct: 41 }, { country: 'UAE', pct: 22 }, { country: 'Egypt', pct: 15 }, { country: 'Kuwait', pct: 8 }, { country: 'Bahrain', pct: 6 }].map(c => (
                  <div key={c.country} className="flex items-center gap-3"><span className="text-sm w-28">{c.country}</span><Progress value={c.pct} className="flex-1 h-2" /><span className="text-xs text-muted-foreground">{c.pct}%</span></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">Top Industries</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[{ ind: 'Technology', pct: 32 }, { ind: 'Healthcare', pct: 17 }, { ind: 'Finance', pct: 14 }, { ind: 'Construction', pct: 12 }, { ind: 'Education', pct: 9 }].map(i => (
                  <div key={i.ind} className="flex items-center gap-3"><span className="text-sm w-28">{i.ind}</span><Progress value={i.pct} className="flex-1 h-2" /><span className="text-xs text-muted-foreground">{i.pct}%</span></div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Section: User Impersonation
// ============================================================

function ImpersonationSection() {
  const [impersonating, setImpersonating] = useState<ImpersonationSession | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState('job_seeker');
  const [reason, setReason] = useState('support');

  const impersonationLog = [
    { id: '1', admin: 'Super Admin', target: 'Ahmed Al-Rashid', role: 'Job Seeker', reason: 'Support', duration: '5 min', timestamp: '2026-07-16 14:30' },
    { id: '2', admin: 'Super Admin', target: 'TechCorp Inc', role: 'Company Owner', reason: 'Debugging', duration: '12 min', timestamp: '2026-07-16 10:15' },
    { id: '3', admin: 'Support Admin', target: 'Sara Technologies', role: 'Recruiter', reason: 'Training', duration: '8 min', timestamp: '2026-07-15 16:45' },
  ];

  const startImpersonation = () => {
    const session = adminPlatformService.startImpersonation({ targetUserId: 'usr-123', targetUserName: targetEmail.split('@')[0] || 'User', targetUserRole: targetRole as any, reason: reason as any });
    setImpersonating(session);
    setShowStartDialog(false);
    toast.success(`Now impersonating as ${targetRole.replace('_', ' ')}`);
  };

  const stopImpersonation = () => {
    adminPlatformService.stopImpersonation();
    setImpersonating(null);
    toast.success('Impersonation ended');
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="User Impersonation" description="Securely view the platform as any user" action={!impersonating ? <Button size="sm" className="gap-2 cursor-pointer" onClick={() => setShowStartDialog(true)}><Monitor className="w-4 h-4" /> Start</Button> : undefined} />
      {impersonating && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center"><Monitor className="w-5 h-5 text-amber-700" /></div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Currently Impersonating</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{impersonating.targetUserName} ({impersonating.targetUserRole.replace('_', ' ')}) &bull; {impersonating.reason}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" className="gap-2 cursor-pointer" onClick={stopImpersonation}><X className="w-4 h-4" /> End Session</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Security Notice</p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>&bull; Every session is logged with admin ID, target, reason, and duration</li>
                <li>&bull; Impersonation is always visible in the audit trail</li>
                <li>&bull; Sessions auto-expire after 30 minutes</li>
                <li>&bull; All actions are attributed to the admin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins]">Impersonation History</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={[{ key: 'admin', label: 'Admin' }, { key: 'target', label: 'Target' }, { key: 'role', label: 'Role', render: (v) => <Badge variant="outline" className="text-xs">{v}</Badge> }, { key: 'reason', label: 'Reason', render: (v) => <Badge variant="secondary" className="text-xs">{v}</Badge> }, { key: 'duration', label: 'Duration' }, { key: 'timestamp', label: 'Timestamp' }]} data={impersonationLog} />
        </CardContent>
      </Card>
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start Impersonation</DialogTitle><DialogDescription>This action will be logged.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Target User Email</Label><Input placeholder="user@email.com" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Target Role</Label><Select value={targetRole} onValueChange={setTargetRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="company_owner">Company Owner</SelectItem><SelectItem value="recruiter">Recruiter</SelectItem><SelectItem value="hiring_manager">Hiring Manager</SelectItem><SelectItem value="job_seeker">Job Seeker</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Reason</Label><Select value={reason} onValueChange={setReason}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="support">Support</SelectItem><SelectItem value="debugging">Debugging</SelectItem><SelectItem value="training">Training</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowStartDialog(false)} className="cursor-pointer">Cancel</Button><Button onClick={startImpersonation} disabled={!targetEmail} className="cursor-pointer">Start</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Section: Platform Notifications
// ============================================================

function PlatformNotificationsSection() {
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  return (
    <div className="space-y-6">
      <SectionHeader title="Platform Notifications" description="Broadcast messages via email, push, and in-app" action={<Button size="sm" className="gap-2 cursor-pointer" onClick={() => setShowComposeDialog(true)}><Plus className="w-4 h-4" /> Compose</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Sent (30d)" value={12} icon={<Send className="w-5 h-5" />} />
        <StatCardMini label="Avg Open Rate" value="31.4%" icon={<Eye className="w-5 h-5" />} />
        <StatCardMini label="Scheduled" value={2} icon={<Clock className="w-5 h-5" />} />
        <StatCardMini label="Recipients" value="12,847" icon={<Users className="w-5 h-5" />} />
      </div>
      <div className="space-y-3">
        {mockNotifications.map(notif => (
          <Card key={notif.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><h4 className="font-medium">{notif.title}</h4><StatusBadge status={notif.status} /></div>
                  <p className="text-sm text-muted-foreground">{notif.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="capitalize">Audience: {notif.audience.replace('_', ' ')}</span>
                    <span>Channels: {notif.channels.join(', ')}</span>
                    {notif.recipientCount && <span>{notif.recipientCount.toLocaleString()} recipients</span>}
                    {notif.openRate && <span className="text-emerald-600">{notif.openRate}% open rate</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {notif.status === 'draft' && <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-primary" onClick={() => toast.success('Sent')}><Send className="w-4 h-4" /></Button>}
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Compose Notification</DialogTitle><DialogDescription>Send to platform users</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input placeholder="Notification title..." /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea placeholder="Message..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Audience</Label><Select defaultValue="all"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="companies">Companies</SelectItem><SelectItem value="job_seekers">Job Seekers</SelectItem><SelectItem value="segment">Custom Segment</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Channels</Label><div className="flex gap-2 pt-1"><Badge variant="outline" className="cursor-pointer">Email</Badge><Badge variant="outline" className="cursor-pointer">Push</Badge><Badge variant="outline" className="cursor-pointer">In-App</Badge></div></div>
            </div>
            <div className="space-y-2"><Label>Schedule (optional)</Label><Input type="datetime-local" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowComposeDialog(false)} className="cursor-pointer">Save Draft</Button><Button onClick={() => { setShowComposeDialog(false); toast.success('Notification sent'); }} className="cursor-pointer">Send Now</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Section: Feature Flags
// ============================================================

function FeatureFlagsSection() {
  const [flags, setFlags] = useState(mockFeatureFlagsData);

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    adminPlatformService.updateFeatureFlag(id, {});
    toast.success('Feature flag updated');
  };

  const categoryColors: Record<string, string> = { core: 'bg-blue-100 text-blue-700', ai: 'bg-purple-100 text-purple-700', billing: 'bg-emerald-100 text-emerald-700', marketplace: 'bg-amber-100 text-amber-700', beta: 'bg-orange-100 text-orange-700', candidate_directory: 'bg-pink-100 text-pink-700' };

  return (
    <div className="space-y-4">
      <SectionHeader title="Feature Flags" description="Control feature rollouts by country, plan, company, or percentage" action={<Button size="sm" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> New Flag</Button>} />
      <div className="space-y-3">
        {flags.map(flag => (
          <Card key={flag.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-medium bg-muted px-2 py-0.5 rounded">{flag.name}</code>
                    {flag.enabled ? <Badge variant="default" className="text-xs gap-1"><Unlock className="w-3 h-3" /> Enabled</Badge> : <Badge variant="secondary" className="text-xs gap-1"><Lock className="w-3 h-3" /> Disabled</Badge>}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium capitalize ${categoryColors[flag.category] || 'bg-muted'}`}>{flag.category.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Rollout:</span><Progress value={flag.rolloutPercentage} className="w-20 h-2" /><span className="text-xs font-medium">{flag.rolloutPercentage}%</span></div>
                    {flag.targetCountries.length > 0 && <span className="text-xs text-muted-foreground">Countries: {flag.targetCountries.join(', ')}</span>}
                    {flag.targetPlans.length > 0 && <span className="text-xs text-muted-foreground">Plans: {flag.targetPlans.join(', ')}</span>}
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

// ============================================================
// Section: Support Center
// ============================================================

function SupportCenterSection() {
  return (
    <div className="space-y-4">
      <SectionHeader title="Support Center" description="Manage tickets, SLA tracking, and support analytics" action={<Button size="sm" className="gap-2 cursor-pointer"><Plus className="w-4 h-4" /> Create Ticket</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCardMini label="Open" value={mockSupportTickets.filter(t => t.status === 'open').length} icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCardMini label="In Progress" value={mockSupportTickets.filter(t => t.status === 'in_progress').length} icon={<Clock className="w-5 h-5" />} />
        <StatCardMini label="SLA Breached" value={mockSupportTickets.filter(t => t.slaBreached).length} icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCardMini label="Avg Response" value="2.4h" icon={<Activity className="w-5 h-5" />} />
      </div>
      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets" className="cursor-pointer">Tickets</TabsTrigger>
          <TabsTrigger value="knowledge" className="cursor-pointer">Knowledge Base</TabsTrigger>
          <TabsTrigger value="analytics" className="cursor-pointer">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets" className="mt-4">
          <DataTable
            columns={[
              { key: 'id', label: 'Ticket', render: (v) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v}</code> },
              { key: 'user', label: 'User', render: (_v, row) => <div><p className="text-sm">{row.user}</p><p className="text-xs text-muted-foreground capitalize">{row.userType.replace('_', ' ')}</p></div> },
              { key: 'subject', label: 'Subject' },
              { key: 'category', label: 'Category', render: (v) => <Badge variant="outline" className="text-xs capitalize">{v.replace('_', ' ')}</Badge> },
              { key: 'priority', label: 'Priority', render: (v) => <StatusBadge status={v} /> },
              { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
              { key: 'slaBreached', label: 'SLA', render: (v) => v ? <Badge variant="destructive" className="text-[10px]">Breached</Badge> : <Badge variant="outline" className="text-[10px]">OK</Badge> },
              { key: 'assignedTo', label: 'Assigned', render: (v) => v || <span className="text-xs text-muted-foreground italic">Unassigned</span> },
            ]}
            data={mockSupportTickets}
            actions={(row) => (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Eye className="w-4 h-4" /></Button>
                {row.status !== 'resolved' && row.status !== 'closed' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-emerald-600" onClick={() => { adminPlatformService.resolveTicket(row.id); toast.success('Resolved'); }}><CheckCircle2 className="w-4 h-4" /></Button>
                )}
                {!row.assignedTo && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-primary" onClick={() => { adminPlatformService.assignTicket(row.id, 'Support Team'); toast.success('Assigned'); }}><UserCog className="w-4 h-4" /></Button>
                )}
              </div>
            )}
          />
        </TabsContent>
        <TabsContent value="knowledge" className="mt-4 space-y-3">
          {['Getting Started Guide', 'How Matching Works', 'Subscription Plans FAQ', 'Billing & Payments', 'Privacy & Security', 'API Documentation'].map((article, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3"><LifeBuoy className="w-4 h-4 text-muted-foreground" /><p className="text-sm font-medium">{article}</p></div>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer"><Edit className="w-4 h-4" /></Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins]">2.4h</p><p className="text-xs text-muted-foreground">Avg First Response</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins]">8.1h</p><p className="text-xs text-muted-foreground">Avg Resolution Time</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins]">94%</p><p className="text-xs text-muted-foreground">Customer Satisfaction</p></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Section: Audit Logs
// ============================================================

function AuditLogsSection() {
  const mockAuditLogs = [
    { id: '1', admin: 'Super Admin', action: 'update', resource: 'user', resourceId: 'usr_003', details: 'Suspended user account', ip: '192.168.1.1', timestamp: '2026-07-16 15:30' },
    { id: '2', admin: 'Super Admin', action: 'delete', resource: 'job', resourceId: 'job_045', details: 'Removed spam job posting', ip: '192.168.1.1', timestamp: '2026-07-16 14:15' },
    { id: '3', admin: 'Support Admin', action: 'update', resource: 'ticket', resourceId: 'TKT-002', details: 'Assigned to Billing Team', ip: '10.0.0.5', timestamp: '2026-07-16 12:45' },
    { id: '4', admin: 'Super Admin', action: 'create', resource: 'announcement', resourceId: 'ann_001', details: 'Created maintenance announcement', ip: '192.168.1.1', timestamp: '2026-07-16 10:20' },
    { id: '5', admin: 'Super Admin', action: 'impersonate', resource: 'user', resourceId: 'usr_001', details: 'Impersonated Ahmed Al-Rashid', ip: '192.168.1.1', timestamp: '2026-07-16 09:05' },
    { id: '6', admin: 'Billing Admin', action: 'refund', resource: 'payment', resourceId: 'PAY-004', details: 'Refunded $29 - duplicate charge', ip: '10.0.0.8', timestamp: '2026-07-15 16:30' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="Audit Logs" description="Complete activity trail for compliance and security" action={<Button variant="outline" size="sm" className="gap-2 cursor-pointer"><Download className="w-4 h-4" /> Export</Button>} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-72"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search logs..." className="ps-9 h-9" /></div>
        <Select defaultValue="all"><SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Action" /></SelectTrigger><SelectContent><SelectItem value="all">All Actions</SelectItem><SelectItem value="create">Create</SelectItem><SelectItem value="update">Update</SelectItem><SelectItem value="delete">Delete</SelectItem><SelectItem value="impersonate">Impersonate</SelectItem><SelectItem value="refund">Refund</SelectItem></SelectContent></Select>
        <Select defaultValue="all"><SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="Resource" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="job">Job</SelectItem><SelectItem value="ticket">Ticket</SelectItem><SelectItem value="payment">Payment</SelectItem></SelectContent></Select>
      </div>
      <DataTable
        columns={[
          { key: 'timestamp', label: 'Timestamp', render: (v) => <span className="text-xs font-mono">{v}</span> },
          { key: 'admin', label: 'Admin' },
          { key: 'action', label: 'Action', render: (v) => {
            const colors: Record<string, string> = { create: 'bg-emerald-100 text-emerald-700', update: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700', impersonate: 'bg-amber-100 text-amber-700', refund: 'bg-purple-100 text-purple-700' };
            return <span className={`text-xs px-2 py-0.5 rounded font-medium uppercase ${colors[v] || 'bg-muted'}`}>{v}</span>;
          }},
          { key: 'resource', label: 'Resource', render: (_v, row) => <div><span className="capitalize">{row.resource}</span>{row.resourceId && <code className="text-xs text-muted-foreground ms-1">({row.resourceId})</code>}</div> },
          { key: 'details', label: 'Details' },
          { key: 'ip', label: 'IP', render: (v) => <code className="text-xs">{v}</code> },
        ]}
        data={mockAuditLogs}
      />
    </div>
  );
}

// ============================================================
// Section: System Settings
// ============================================================

function SettingsSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="System Settings" description="Configure platform-wide settings" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins] flex items-center gap-2"><Globe className="w-4 h-4" /> General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Platform Name</Label><Input defaultValue="MatchMe" /></div>
            <div className="space-y-2"><Label>Support Email</Label><Input defaultValue="support@matchme.com" /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Maintenance Mode</p><p className="text-xs text-muted-foreground">Disable access for non-admin users</p></div><Switch /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Registration Open</p><p className="text-xs text-muted-foreground">Allow new user registrations</p></div><Switch defaultChecked /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins] flex items-center gap-2"><Shield className="w-4 h-4" /> Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Require 2FA for admin accounts</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Email Verification</p><p className="text-xs text-muted-foreground">Require on signup</p></div><Switch defaultChecked /></div>
            <div className="space-y-2"><Label>Session Timeout (min)</Label><Input type="number" defaultValue="60" /></div>
            <div className="space-y-2"><Label>Max Login Attempts</Label><Input type="number" defaultValue="5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins] flex items-center gap-2"><ZapIcon className="w-4 h-4" /> AI &amp; Matching</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Min Match Score (%)</Label><Input type="number" defaultValue="40" /></div>
            <div className="space-y-2"><Label>Daily Swipe Limit (Free)</Label><Input type="number" defaultValue="5" /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">AI Matching</p><p className="text-xs text-muted-foreground">Use AI for enhanced scoring</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Match Expiration</p><p className="text-xs text-muted-foreground">Auto-expire unresponsive matches</p></div><Switch defaultChecked /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-[Poppins] flex items-center gap-2"><Server className="w-4 h-4" /> Infrastructure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Database className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm font-medium">Database</p><p className="text-xs text-muted-foreground">PostgreSQL 15</p></div></div><Badge variant="default" className="text-xs">Healthy</Badge></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><HardDrive className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm font-medium">Storage</p><p className="text-xs text-muted-foreground">2.3 TB / 5 TB</p></div></div><Progress value={46} className="w-20 h-2" /></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Cpu className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm font-medium">CPU</p><p className="text-xs text-muted-foreground">Avg: 34%</p></div></div><Progress value={34} className="w-20 h-2" /></div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Wifi className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm font-medium">API Latency</p><p className="text-xs text-muted-foreground">Avg: 45ms</p></div></div><Badge variant="default" className="text-xs">Normal</Badge></div>
          </CardContent>
        </Card>
      </div>
      <div className="max-w-lg"><ChangePassword /></div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="cursor-pointer">Reset to Defaults</Button>
        <Button className="cursor-pointer" onClick={() => toast.success('Settings saved')}>Save Settings</Button>
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
    { id: 'global_search', label: 'Global Search', icon: <Search className="w-4 h-4" /> },
    { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
    { id: 'verification', label: 'Verification', icon: <ShieldCheck className="w-4 h-4" />, badge: 2 },
    { id: 'job_seekers', label: 'Job Seekers', icon: <Users className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'billing_analytics', label: 'Billing Analytics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'impersonation', label: 'Impersonation', icon: <Monitor className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'feature_flags', label: 'Feature Flags', icon: <ToggleLeft className="w-4 h-4" /> },
    { id: 'support', label: 'Support', icon: <HeadphonesIcon className="w-4 h-4" />, badge: 3 },
    { id: 'localization', label: 'Localization', icon: <Globe className="w-4 h-4" /> },
    { id: 'audit_logs', label: 'Audit Logs', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardSection />;
      case 'global_search': return <GlobalSearchSection />;
      case 'companies': return <CompanyManagementSection />;
      case 'verification': return <CompanyVerificationSection />;
      case 'job_seekers': return <JobSeekerManagementSection />;
      case 'subscriptions': return <SubscriptionManagementSection />;
      case 'billing': return <BillingManagementSection />;
      case 'billing_analytics': return <BillingAnalyticsDashboard />;
      case 'analytics': return <PlatformAnalyticsSection />;
      case 'impersonation': return <ImpersonationSection />;
      case 'notifications': return <PlatformNotificationsSection />;
      case 'feature_flags': return <FeatureFlagsSection />;
      case 'support': return <SupportCenterSection />;
      case 'localization': return <LocalizationManagement />;
      case 'audit_logs': return <AuditLogsSection />;
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
        <div className="h-14 flex items-center px-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
              <div><p className="text-sm font-bold font-[Poppins]">MatchMe</p><p className="text-[10px] text-muted-foreground">Super Admin</p></div>
            </div>
          )}
          {sidebarCollapsed && <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center mx-auto"><Shield className="w-4 h-4 text-white" /></div>}
        </div>
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-0.5 px-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${activeSection === item.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-start">{item.label}</span>
                    {item.badge && <span className="text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 font-medium">{item.badge}</span>}
                  </>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>
        <div className="border-t p-3">
          <button onClick={handleSignOut} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Select value={activeSection} onValueChange={(v) => setActiveSection(v as AdminSection)}>
                <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{navItems.map(item => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors cursor-pointer">
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
            </button>
            <h1 className="hidden lg:block text-sm font-medium font-[Poppins] capitalize">{activeSection.replace('_', ' ')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer relative"><Bell className="w-4 h-4" /><span className="absolute top-1 end-1 w-2 h-2 bg-destructive rounded-full" /></Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center"><span className="text-xs text-white font-medium">SA</span></div>
              <span className="text-xs text-muted-foreground">{email || 'admin@matchme.com'}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}