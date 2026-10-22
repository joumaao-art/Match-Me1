import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/App';
import { changeLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  Sparkles, Home, Users, MessageSquare, BarChart3, CreditCard, Settings, LogOut,
  Globe, Moon, Sun, Plus, Building2, MapPin, Briefcase, GraduationCap, Check, X,
  ChevronRight, Mail, Phone, Eye, BookmarkPlus, Send, FileText, Bell, Shield,
  UserPlus, Archive, Pause, Play, Edit, Trash2, Heart, Clock, DollarSign,
  TrendingUp, Calendar, Download, Filter, Search, MoreVertical, Star,
  GitBranch, Lock, Unlock, Receipt, PieChart, UserCheck, Layers
} from 'lucide-react';
import { ChangePassword } from '@/components/shared/ChangePassword';
import CandidateDirectory from '@/components/shared/CandidateDirectory';
import PortalBrand, { getPortalBrandConfig } from '@/components/shared/PortalBrand';
import type { DirectoryView } from '@/components/shared/CandidateDirectory';
import {
  AIRecommendationsView, CompanyInvitationsView,
  AdvancedTalentPipelineView, TeamCollaborationView, TalentAnalyticsView,
} from '@/components/shared/AITalentIntelligence';
import TalentCollections from '@/components/shared/TalentCollections';
import { UCSummaryCard } from '@/components/shared/CardEngine';
import type { SummaryCardConfig } from '@/lib/card-engine-types';
import {
  RoleManagementView, TeamManagementView, DepartmentManagementView,
  AuditLogsView, FeatureFlagsView, OrganizationSettingsView, SecurityDashboardView,
} from '@/components/shared/EnterpriseRBAC';

// ============================================================
// Types
// ============================================================

interface Branch {
  id: string;
  name: string;
  city: string;
  country: string;
  isHQ: boolean;
  employees: number;
  phone: string;
}

interface Recruiter {
  id: string;
  name: string;
  email: string;
  role: string;
  hires: number;
  active: boolean;
}

interface Vacancy {
  id: string;
  title: string;
  status: 'open' | 'paused' | 'draft' | 'archived';
  applicants: number;
  posted: string;
  views: number;
  type: string;
  location: string;
  description?: string;
  skills?: string;
  minSalary?: string;
  maxSalary?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastActive: string;
}

// ============================================================
// Mock Data
// ============================================================

const mockCandidates = [
  { id: '1', name: 'Ahmed Hassan', skills: ['React', 'TypeScript', 'Node.js'], experience: 5, education: "Bachelor's in CS", location: 'Dubai, UAE', score: 94, status: 'new' as const, summary: 'Senior full-stack developer with 5 years of experience.', appliedFor: 'Senior Frontend Developer', appliedDate: '2026-07-14' },
  { id: '2', name: 'Sara Al-Rashid', skills: ['Python', 'ML', 'SQL'], experience: 3, education: "Master's in Data Science", location: 'Riyadh, KSA', score: 87, status: 'interview' as const, summary: 'Data scientist passionate about AI solutions.', appliedFor: 'Full Stack Engineer', appliedDate: '2026-07-13' },
  { id: '3', name: 'Omar Khalil', skills: ['Java', 'Spring Boot', 'AWS'], experience: 7, education: "Bachelor's in SE", location: 'Doha, Qatar', score: 82, status: 'accepted' as const, summary: 'Backend engineer specializing in microservices.', appliedFor: 'DevOps Engineer', appliedDate: '2026-07-12' },
  { id: '4', name: 'Layla Mansour', skills: ['UI/UX', 'Figma', 'React'], experience: 4, education: "Bachelor's in Design", location: 'Abu Dhabi, UAE', score: 76, status: 'new' as const, summary: 'Creative designer with frontend skills.', appliedFor: 'Senior Frontend Developer', appliedDate: '2026-07-15' },
  { id: '5', name: 'Khalid Nasser', skills: ['DevOps', 'K8s', 'Terraform'], experience: 6, education: "Bachelor's in IT", location: 'Jeddah, KSA', score: 91, status: 'offered' as const, summary: 'Cloud infrastructure expert.', appliedFor: 'DevOps Engineer', appliedDate: '2026-07-11' },
];

const initialVacancies: Vacancy[] = [
  { id: '1', title: 'Senior Frontend Developer', status: 'open', applicants: 24, posted: '2026-07-10', views: 342, type: 'Full-time', location: 'Dubai, UAE', description: 'Looking for a senior frontend developer...', skills: 'React, TypeScript, Tailwind CSS', minSalary: '8000', maxSalary: '12000' },
  { id: '2', title: 'Full Stack Engineer', status: 'open', applicants: 18, posted: '2026-07-12', views: 256, type: 'Full-time', location: 'Riyadh, KSA', description: 'Join our growing team...', skills: 'Node.js, React, PostgreSQL', minSalary: '7000', maxSalary: '10000' },
  { id: '3', title: 'DevOps Engineer', status: 'paused', applicants: 12, posted: '2026-07-08', views: 189, type: 'Remote', location: 'Remote', description: 'Design and maintain cloud infrastructure...', skills: 'AWS, Kubernetes, Terraform', minSalary: '10000', maxSalary: '15000' },
  { id: '4', title: 'Mobile Developer', status: 'draft', applicants: 0, posted: '2026-07-15', views: 0, type: 'Contract', location: 'Abu Dhabi, UAE', description: 'Build cross-platform mobile apps...', skills: 'React Native, Flutter', minSalary: '6000', maxSalary: '9000' },
  { id: '5', title: 'Data Analyst', status: 'archived', applicants: 31, posted: '2026-06-20', views: 412, type: 'Full-time', location: 'Doha, Qatar', description: 'Analyze business data...', skills: 'SQL, Python, Tableau', minSalary: '5000', maxSalary: '8000' },
];

const initialBranches: Branch[] = [
  { id: '1', name: 'Dubai HQ', city: 'Dubai', country: 'UAE', isHQ: true, employees: 45, phone: '+971 4 123 4567' },
  { id: '2', name: 'Riyadh Office', city: 'Riyadh', country: 'Saudi Arabia', isHQ: false, employees: 22, phone: '+966 11 234 5678' },
  { id: '3', name: 'Doha Branch', city: 'Doha', country: 'Qatar', isHQ: false, employees: 12, phone: '+974 4412 3456' },
];

const initialRecruiters: Recruiter[] = [
  { id: '1', name: 'Fatima Al-Zahra', email: 'fatima@techcorp.com', role: 'Head of Recruitment', hires: 15, active: true },
  { id: '2', name: 'Mohammed Ali', email: 'mohammed@techcorp.com', role: 'Senior Recruiter', hires: 8, active: true },
  { id: '3', name: 'Noor Hassan', email: 'noor@techcorp.com', role: 'Recruiter', hires: 4, active: true },
];

const initialTeamMembers: TeamMember[] = [
  { id: '1', name: 'Fatima Al-Zahra', email: 'fatima@techcorp.com', role: 'Admin', permissions: ['all'], lastActive: '2026-07-17' },
  { id: '2', name: 'Mohammed Ali', email: 'mohammed@techcorp.com', role: 'Recruiter', permissions: ['post_jobs', 'manage_candidates', 'messages'], lastActive: '2026-07-16' },
  { id: '3', name: 'Noor Hassan', email: 'noor@techcorp.com', role: 'Viewer', permissions: ['view_candidates', 'messages'], lastActive: '2026-07-15' },
];

const mockNotifications = [
  { id: '1', type: 'application', message: 'Ahmed Hassan applied for Senior Frontend Developer', time: '2 min ago', read: false },
  { id: '2', type: 'match', message: 'New match: Sara Al-Rashid (87% compatibility)', time: '15 min ago', read: false },
  { id: '3', type: 'interview', message: 'Interview with Omar Khalil scheduled for tomorrow', time: '1 hour ago', read: true },
  { id: '4', type: 'message', message: 'New message from Layla Mansour', time: '3 hours ago', read: true },
  { id: '5', type: 'system', message: 'Your subscription renews in 5 days', time: '1 day ago', read: true },
];

const mockBilling = [
  { id: '1', date: '2026-07-01', description: 'Premium Plan - Monthly', amount: 49, status: 'paid' },
  { id: '2', date: '2026-06-01', description: 'Premium Plan - Monthly', amount: 49, status: 'paid' },
  { id: '3', date: '2026-05-01', description: 'Premium Plan - Monthly', amount: 49, status: 'paid' },
];

// ============================================================
// Navigation
// ============================================================

type NavSection = 'dashboard' | 'profile' | 'branches' | 'recruiters' | 'vacancies' | 'candidates' | 'pipeline' | 'saved' | 'matching' | 'messages' | 'notifications' | 'analytics' | 'subscription' | 'billing' | 'reports' | 'team' | 'settings' | 'directory' | 'dir_saved' | 'dir_viewed' | 'dir_contacts' | 'dir_pipeline' | 'ai_recommendations' | 'invitations' | 'enhanced_saved' | 'advanced_pipeline' | 'team_collab' | 'talent_analytics' | 'role_management' | 'enterprise_team' | 'departments' | 'audit_logs' | 'feature_flags' | 'org_settings' | 'security';

// Company Portal Navigation Configuration (uses shared Enterprise Navigation Framework)
import { EnterpriseNavigation, type NavigationConfig, type NavSectionConfig } from '@/components/shared/EnterpriseNavigation';

function getCompanyNavConfig(): NavigationConfig {
  const sections: NavSectionConfig[] = [
    { id: 'overview', titleKey: 'dashboard', icon: Home, items: [
      { id: 'dashboard', titleKey: 'dashboard', icon: Home },
    ]},
    { id: 'recruitment_jobs', titleKey: 'vacancies', icon: Briefcase, items: [
      { id: 'vacancies', titleKey: 'vacancies', icon: FileText },
      { id: 'candidates', titleKey: 'applicants', icon: Users },
      { id: 'pipeline', titleKey: 'hiring_pipeline', icon: Layers },
      { id: 'matching', titleKey: 'matching_queue', icon: Sparkles },
    ]},
    { id: 'talent', titleKey: 'candidate_directory', icon: Search, items: [
      { id: 'directory', titleKey: 'candidate_directory', icon: Search },
      { id: 'dir_saved', titleKey: 'saved_candidates', icon: Heart },
      { id: 'dir_viewed', titleKey: 'viewed_candidates', icon: Eye },
      { id: 'dir_contacts', titleKey: 'contact_requests', icon: Send },
      { id: 'dir_pipeline', titleKey: 'talent_pipeline', icon: Layers },
    ]},
    { id: 'ai_intelligence', titleKey: 'ai_talent_intelligence', icon: Sparkles, subscriptionTier: ['Business', 'Enterprise'], items: [
      { id: 'ai_recommendations', titleKey: 'ai_recommendations', icon: Sparkles },
      { id: 'invitations', titleKey: 'invitations_sent', icon: Mail },
      { id: 'enhanced_saved', titleKey: 'saved_folders', icon: BookmarkPlus },
      { id: 'advanced_pipeline', titleKey: 'advanced_pipeline', icon: Layers },
      { id: 'team_collab', titleKey: 'team_collaboration', icon: Users, subscriptionTier: ['Enterprise'] },
      { id: 'talent_analytics', titleKey: 'talent_analytics', icon: TrendingUp },
    ]},
    { id: 'communication', titleKey: 'messages', icon: MessageSquare, items: [
      { id: 'messages', titleKey: 'messages', icon: MessageSquare },
      { id: 'notifications', titleKey: 'notifications', icon: Bell },
    ]},
    { id: 'analytics_reports', titleKey: 'analytics', icon: BarChart3, items: [
      { id: 'analytics', titleKey: 'analytics', icon: BarChart3 },
      { id: 'reports', titleKey: 'reports', icon: PieChart },
    ]},
    { id: 'organization', titleKey: 'enterprise', icon: Shield, items: [
      { id: 'profile', titleKey: 'company_profile', icon: Building2 },
      { id: 'branches', titleKey: 'branches', icon: GitBranch },
      { id: 'recruiters', titleKey: 'recruiters', icon: UserPlus },
      { id: 'team', titleKey: 'team_members', icon: UserCheck },
      { id: 'role_management', titleKey: 'role_management', icon: Shield },
      { id: 'enterprise_team', titleKey: 'team_management', icon: Users },
      { id: 'departments', titleKey: 'departments', icon: Building2 },
    ]},
    { id: 'billing_section', titleKey: 'subscription', icon: CreditCard, items: [
      { id: 'subscription', titleKey: 'subscription', icon: CreditCard },
      { id: 'billing', titleKey: 'billing', icon: Receipt },
    ]},
    { id: 'administration', titleKey: 'settings', icon: Settings, items: [
      { id: 'settings', titleKey: 'settings', icon: Settings },
      { id: 'org_settings', titleKey: 'organization_settings', icon: Settings },
      { id: 'audit_logs', titleKey: 'audit_logs', icon: Clock },
      { id: 'feature_flags', titleKey: 'feature_flags', icon: TrendingUp },
      { id: 'security', titleKey: 'security_dashboard', icon: Lock },
    ]},
  ];

  return {
    portalId: 'company',
    logo: <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-primary-foreground" /></div>,
    title: 'MatchMe',
    subtitle: 'Company Portal',
    brandElement: <PortalBrand config={getPortalBrandConfig('company')} />,
    sections,
  };
}

// ============================================================
// Interactive Stat Card Component (Reusable Dashboard Framework)
// ============================================================

interface InteractiveStatProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

function InteractiveStatCard({ label, value, icon: Icon, color, onClick }: InteractiveStatProps) {
  return (
    <Card
      className={`group transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]' : ''}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `${label}: ${value}` : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-colors duration-200 ${onClick ? 'group-hover:bg-primary/20' : ''}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-2xl font-bold font-[Poppins] ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Dashboard Overview
// ============================================================

function DashboardView({ onNavigate }: { onNavigate: (tab: NavSection) => void }) {
  const { t } = useTranslation();

  // Stats derived from mock data (in production, these come from Supabase)
  const activeVacanciesCount = initialVacancies.filter(v => v.status === 'open').length;
  const totalApplicationsCount = mockCandidates.length;
  const interviewsCount = mockCandidates.filter(c => c.status === 'interview').length;
  const hiredCount = mockCandidates.filter(c => c.status === 'accepted').length;

  const stats: (InteractiveStatProps & { navigateTo: NavSection })[] = [
    { label: t('active_vacancies'), value: activeVacanciesCount, icon: FileText, color: 'text-primary', navigateTo: 'vacancies' },
    { label: t('total_applications'), value: totalApplicationsCount, icon: Users, color: 'text-accent', navigateTo: 'candidates' },
    { label: t('interviews'), value: interviewsCount, icon: Calendar, color: 'text-green-600', navigateTo: 'pipeline' },
    { label: t('hired'), value: hiredCount, icon: UserCheck, color: 'text-purple-600', navigateTo: 'pipeline' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('dashboard')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <UCSummaryCard
            key={s.label}
            config={{
              type: 'summary',
              value: String(s.value),
              label: s.label,
              icon: s.icon as import('lucide-react').LucideIcon,
              colorClass: s.color,
              density: 'normal',
              variant: 'default',
              radius: 'lg',
              onClick: () => onNavigate(s.navigateTo),
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => onNavigate('matching')} tabIndex={0} role="button" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('matching'); } }}>
          <CardHeader><CardTitle className="text-sm font-[Poppins]">{t('top_matched_candidates')}</CardTitle></CardHeader><CardContent className="space-y-3">
          {mockCandidates.slice(0, 3).map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div><div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.appliedFor}</p></div></div>
              <Badge variant="secondary" className="text-xs">{c.score}%</Badge>
            </div>
          ))}
        </CardContent></Card>
        <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => onNavigate('notifications')} tabIndex={0} role="button" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('notifications'); } }}>
          <CardHeader><CardTitle className="text-sm font-[Poppins]">{t('recent_activity')}</CardTitle></CardHeader><CardContent className="space-y-3">
          {mockNotifications.slice(0, 4).map((n) => (
            <div key={n.id} className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-2 ${n.read ? 'bg-muted' : 'bg-primary'}`} />
              <div><p className="text-sm">{n.message}</p><p className="text-xs text-muted-foreground">{n.time}</p></div>
            </div>
          ))}
        </CardContent></Card>
      </div>
    </div>
  );
}

// ============================================================
// Company Profile
// ============================================================

function ProfileView() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    name: 'TechCorp', industry: 'Technology', website: 'https://techcorp.com',
    phone: '+971 4 123 4567', country: 'UAE', city: 'Dubai',
    size: '50-200', founded: '2018',
    description: 'Leading technology company in the MENA region...',
    culture: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!profile.name) { toast.error(t('fill_all_fields')); return; }
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success(t('profile_saved')); }, 800);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('company_profile')}</h2>
      <div className="max-w-2xl space-y-6">
        <Card><CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4"><div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="w-8 h-8 text-primary" /></div><div><Button variant="outline" size="sm" className="cursor-pointer" onClick={() => toast.success(t('logo_upload_started'))}>{t('upload_logo')}</Button><p className="text-xs text-muted-foreground mt-1">{t('logo_hint')}</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>{t('company_name')}</Label><Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('industry')}</Label><Input value={profile.industry} onChange={(e) => setProfile({...profile, industry: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('company_website')}</Label><Input value={profile.website} onChange={(e) => setProfile({...profile, website: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('company_phone')}</Label><Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('country')}</Label><Input value={profile.country} onChange={(e) => setProfile({...profile, country: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('city')}</Label><Input value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('company_size')}</Label><Select value={profile.size} onValueChange={(v) => setProfile({...profile, size: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1-10">1-10</SelectItem><SelectItem value="11-50">11-50</SelectItem><SelectItem value="50-200">50-200</SelectItem><SelectItem value="200-500">200-500</SelectItem><SelectItem value="500+">500+</SelectItem></SelectContent></Select></div>
            <div><Label>{t('founded_year')}</Label><Input type="number" value={profile.founded} onChange={(e) => setProfile({...profile, founded: e.target.value})} className="mt-1" /></div>
          </div>
          <div><Label>{t('company_description')}</Label><Textarea value={profile.description} onChange={(e) => setProfile({...profile, description: e.target.value})} className="mt-1" rows={4} /></div>
          <div><Label>{t('company_culture')}</Label><Textarea value={profile.culture} onChange={(e) => setProfile({...profile, culture: e.target.value})} placeholder={t('culture_placeholder')} className="mt-1" rows={3} /></div>
          <Button className="cursor-pointer" onClick={handleSave} disabled={saving}>{saving ? t('loading') : t('save')}</Button>
        </CardContent></Card>
      </div>
    </div>
  );
}

// ============================================================
// Branches (Full CRUD)
// ============================================================

function BranchesView() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<Omit<Branch, 'id'>>({ name: '', city: '', country: '', isHQ: false, employees: 0, phone: '' });

  const openAdd = () => {
    setEditingBranch(null);
    setForm({ name: '', city: '', country: '', isHQ: false, employees: 0, phone: '' });
    setDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({ name: branch.name, city: branch.city, country: branch.country, isHQ: branch.isHQ, employees: branch.employees, phone: branch.phone });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.city || !form.country) { toast.error(t('fill_all_fields')); return; }
    if (editingBranch) {
      setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...form } : b));
      toast.success(t('branch_updated'));
    } else {
      setBranches(prev => [...prev, { id: Date.now().toString(), ...form }]);
      toast.success(t('branch_added'));
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
    toast.success(t('branch_deleted'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-[Poppins]">{t('branches')}</h2>
        <Button className="cursor-pointer gap-2" onClick={openAdd}><Plus className="w-4 h-4" />{t('add_branch')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <Card key={b.id}><CardContent className="p-4">
            <div className="flex items-start justify-between mb-3"><div><p className="font-semibold">{b.name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city}, {b.country}</p></div>{b.isHQ && <Badge variant="default" className="text-xs">HQ</Badge>}</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="w-3 h-3" /><span>{b.employees} {t('employees')}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-3 h-3" /><span>{b.phone}</span></div>
            </div>
            <div className="flex gap-2 mt-3"><Button size="sm" variant="outline" className="cursor-pointer flex-1" onClick={() => openEdit(b)}>{t('edit')}</Button><Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
      {branches.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_branches_yet')}</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-[Poppins]">{editingBranch ? t('edit_branch') : t('add_branch')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('branch_name')}</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t('city')}</Label><Input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="mt-1" /></div>
              <div><Label>{t('country')}</Label><Input value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} className="mt-1" /></div>
            </div>
            <div><Label>{t('phone')}</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('employees')}</Label><Input type="number" value={form.employees} onChange={(e) => setForm({...form, employees: parseInt(e.target.value) || 0})} className="mt-1" /></div>
            <div className="flex items-center gap-3"><Switch checked={form.isHQ} onCheckedChange={(v) => setForm({...form, isHQ: v})} /><Label>{t('headquarters')}</Label></div>
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
// Recruiters (Full CRUD)
// ============================================================

function RecruitersView() {
  const { t } = useTranslation();
  const [recruiters, setRecruiters] = useState<Recruiter[]>(initialRecruiters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: string }>({ name: '', email: '', role: 'Recruiter' });

  const openAdd = () => {
    setEditingRecruiter(null);
    setForm({ name: '', email: '', role: 'Recruiter' });
    setDialogOpen(true);
  };

  const openEdit = (rec: Recruiter) => {
    setEditingRecruiter(rec);
    setForm({ name: rec.name, email: rec.email, role: rec.role });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) { toast.error(t('fill_all_fields')); return; }
    if (editingRecruiter) {
      setRecruiters(prev => prev.map(r => r.id === editingRecruiter.id ? { ...r, ...form } : r));
      toast.success(t('recruiter_updated'));
    } else {
      setRecruiters(prev => [...prev, { id: Date.now().toString(), ...form, hires: 0, active: true }]);
      toast.success(t('recruiter_added'));
    }
    setDialogOpen(false);
  };

  const toggleActive = (id: string) => {
    setRecruiters(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    toast.success(t('status_updated'));
  };

  const handleDelete = (id: string) => {
    setRecruiters(prev => prev.filter(r => r.id !== id));
    toast.success(t('recruiter_removed'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-[Poppins]">{t('recruiters')}</h2>
        <Button className="cursor-pointer gap-2" onClick={openAdd}><UserPlus className="w-4 h-4" />{t('add_recruiter')}</Button>
      </div>
      <div className="space-y-3">
        {recruiters.map((r) => (
          <Card key={r.id}><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.role} · {r.email}</p></div></div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{r.hires} {t('hires')}</Badge>
              <Badge variant={r.active ? 'default' : 'secondary'} className="text-xs cursor-pointer" onClick={() => toggleActive(r.id)}>{r.active ? t('active') : t('inactive')}</Badge>
              <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => openEdit(r)}><Edit className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-[Poppins]">{editingRecruiter ? t('edit_recruiter') : t('add_recruiter')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('full_name')}</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('email')}</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('role')}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({...form, role: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Head of Recruitment">{t('head_of_recruitment')}</SelectItem><SelectItem value="Senior Recruiter">{t('senior_recruiter')}</SelectItem><SelectItem value="Recruiter">{t('recruiter')}</SelectItem><SelectItem value="Junior Recruiter">{t('junior_recruiter')}</SelectItem></SelectContent>
              </Select>
            </div>
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
// Vacancies (Full CRUD with Edit Dialog)
// ============================================================

function VacanciesView() {
  const { t } = useTranslation();
  const [vacancies, setVacancies] = useState<Vacancy[]>(initialVacancies);
  const [filter, setFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [form, setForm] = useState({ title: '', type: '', location: '', description: '', skills: '', minSalary: '', maxSalary: '' });

  const filtered = filter === 'all' ? vacancies : vacancies.filter(v => v.status === filter);

  const openPost = () => {
    setEditingVacancy(null);
    setForm({ title: '', type: '', location: '', description: '', skills: '', minSalary: '', maxSalary: '' });
    setDialogOpen(true);
  };

  const openEdit = (v: Vacancy) => {
    setEditingVacancy(v);
    setForm({ title: v.title, type: v.type, location: v.location, description: v.description || '', skills: v.skills || '', minSalary: v.minSalary || '', maxSalary: v.maxSalary || '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.type) { toast.error(t('fill_all_fields')); return; }
    if (editingVacancy) {
      setVacancies(prev => prev.map(v => v.id === editingVacancy.id ? { ...v, ...form } : v));
      toast.success(t('vacancy_updated'));
    } else {
      setVacancies(prev => [...prev, { id: Date.now().toString(), ...form, status: 'open' as const, applicants: 0, posted: new Date().toISOString().slice(0, 10), views: 0 }]);
      toast.success(t('vacancy_posted'));
    }
    setDialogOpen(false);
  };

  const updateStatus = (id: string, status: string) => {
    setVacancies(prev => prev.map(v => v.id === id ? { ...v, status: status as any } : v));
    toast.success(t('status_updated'));
  };

  const duplicateVacancy = (v: Vacancy) => {
    const dup = { ...v, id: Date.now().toString(), title: `${v.title} (Copy)`, status: 'draft' as const, applicants: 0, views: 0, posted: new Date().toISOString().slice(0, 10) };
    setVacancies(prev => [...prev, dup]);
    toast.success(t('vacancy_duplicated'));
  };

  const deleteVacancy = (id: string) => {
    setVacancies(prev => prev.filter(v => v.id !== id));
    toast.success(t('vacancy_deleted'));
  };

  const getStatusColor = (status: string) => {
    switch(status) { case 'open': return 'default'; case 'paused': return 'secondary'; case 'draft': return 'outline'; case 'archived': return 'secondary'; default: return 'secondary'; }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-[Poppins]">{t('vacancies')}</h2>
        <Button className="cursor-pointer gap-2" onClick={openPost}><Plus className="w-4 h-4" />{t('post_vacancy')}</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'open', 'paused', 'draft', 'archived'].map((f) => (
          <Badge key={f} variant={filter === f ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter(f)}>{f === 'all' ? t('all') : t(f)}</Badge>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((v) => (
          <Card key={v.id}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div><p className="font-semibold">{v.title}</p><p className="text-xs text-muted-foreground">{v.type} · {v.location} · {t('posted_on')}: {v.posted}</p></div>
              <Badge variant={getStatusColor(v.status) as any}>{t(v.status)}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.applicants} {t('applicants')}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{v.views} {t('views')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => openEdit(v)}><Edit className="w-3 h-3" />{t('edit')}</Button>
              {v.status === 'open' && <Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => updateStatus(v.id, 'paused')}><Pause className="w-3 h-3" />{t('pause')}</Button>}
              {v.status === 'paused' && <Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => updateStatus(v.id, 'open')}><Play className="w-3 h-3" />{t('resume')}</Button>}
              {v.status === 'draft' && <Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => updateStatus(v.id, 'open')}><Play className="w-3 h-3" />{t('publish')}</Button>}
              <Button size="sm" variant="ghost" className="cursor-pointer gap-1" onClick={() => duplicateVacancy(v)}><Layers className="w-3 h-3" />{t('duplicate')}</Button>
              {v.status !== 'archived' && <Button size="sm" variant="ghost" className="cursor-pointer gap-1 text-muted-foreground" onClick={() => updateStatus(v.id, 'archived')}><Archive className="w-3 h-3" />{t('archive')}</Button>}
              <Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={() => deleteVacancy(v.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-[Poppins]">{editingVacancy ? t('edit_vacancy') : t('post_vacancy')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>{t('job_title')}</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder={t('job_title_placeholder')} className="mt-1" /></div>
            <div><Label>{t('employment_type')}</Label><Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}><SelectTrigger className="mt-1"><SelectValue placeholder={t('select_type')} /></SelectTrigger><SelectContent><SelectItem value="Full-time">{t('full_time')}</SelectItem><SelectItem value="Part-time">{t('part_time')}</SelectItem><SelectItem value="Contract">{t('contract')}</SelectItem><SelectItem value="Remote">{t('remote')}</SelectItem></SelectContent></Select></div>
            <div><Label>{t('location')}</Label><Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('job_description')}</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder={t('job_desc_placeholder')} className="mt-1" rows={4} /></div>
            <div><Label>{t('required_skills')}</Label><Input value={form.skills} onChange={(e) => setForm({...form, skills: e.target.value})} placeholder={t('skills_input_placeholder')} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>{t('min_salary')}</Label><Input type="number" value={form.minSalary} onChange={(e) => setForm({...form, minSalary: e.target.value})} placeholder="5000" className="mt-1" /></div><div><Label>{t('max_salary')}</Label><Input type="number" value={form.maxSalary} onChange={(e) => setForm({...form, maxSalary: e.target.value})} placeholder="10000" className="mt-1" /></div></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">{t('cancel')}</Button>
            <Button className="cursor-pointer" onClick={handleSave}>{editingVacancy ? t('save') : t('post_vacancy')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Candidates / Applicant Tracking (Full Search, Filter, Sort, Pagination)
// ============================================================

const CANDIDATES_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 300;

type SortField = 'score' | 'name' | 'appliedDate' | 'experience';
type SortOrder = 'asc' | 'desc';

interface CandidateFilters {
  status: string;
  minScore: number;
  maxScore: number;
  skills: string[];
  experience: string;
  location: string;
  dateRange: string;
}

const DEFAULT_FILTERS: CandidateFilters = {
  status: 'all',
  minScore: 0,
  maxScore: 100,
  skills: [],
  experience: 'all',
  location: 'all',
  dateRange: 'all',
};

// Reusable debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function CandidatesView() {
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState(mockCandidates);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search for performance
  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  // Show loading indicator while debouncing
  useEffect(() => {
    if (searchQuery !== debouncedSearch) setIsSearching(true);
    else setIsSearching(false);
  }, [searchQuery, debouncedSearch]);

  // Reset to page 1 when search/filters change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filters, sortField, sortOrder]);

  // All unique skills from candidates for filter options
  const allSkills = Array.from(new Set(candidates.flatMap(c => c.skills)));
  // All unique locations
  const allLocations = Array.from(new Set(candidates.map(c => c.location)));

  // Combined search + filter + sort logic
  const processedCandidates = (() => {
    let result = [...candidates];

    // 1. Search (case-insensitive, partial match across multiple fields)
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase().trim();
      result = result.filter(c => {
        const searchableFields = [
          c.name,
          c.appliedFor,
          c.summary,
          c.location,
          c.education,
          ...c.skills,
        ].map(f => f.toLowerCase());
        return searchableFields.some(field => field.includes(query));
      });
    }

    // 2. Status filter
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }

    // 3. Score range filter
    result = result.filter(c => c.score >= filters.minScore && c.score <= filters.maxScore);

    // 4. Skills filter (candidate must have ALL selected skills)
    if (filters.skills.length > 0) {
      result = result.filter(c =>
        filters.skills.every(skill => c.skills.some(s => s.toLowerCase() === skill.toLowerCase()))
      );
    }

    // 5. Experience filter
    if (filters.experience !== 'all') {
      const expRanges: Record<string, [number, number]> = {
        'entry': [0, 1], 'junior': [1, 3], 'mid': [3, 5], 'senior': [5, 8], 'lead': [8, 100],
      };
      const range = expRanges[filters.experience];
      if (range) {
        result = result.filter(c => c.experience >= range[0] && c.experience < range[1]);
      }
    }

    // 6. Location filter
    if (filters.location !== 'all') {
      result = result.filter(c => c.location === filters.location);
    }

    // 7. Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (filters.dateRange) {
        case 'today': cutoff = new Date(now.setHours(0, 0, 0, 0)); break;
        case '7days': cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case '30days': cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        default: cutoff = new Date(0);
      }
      result = result.filter(c => new Date(c.appliedDate) >= cutoff);
    }

    // 8. Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'score': cmp = a.score - b.score; break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'appliedDate': cmp = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime(); break;
        case 'experience': cmp = a.experience - b.experience; break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  })();

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedCandidates.length / CANDIDATES_PER_PAGE));
  const paginatedCandidates = processedCandidates.slice(
    (currentPage - 1) * CANDIDATES_PER_PAGE,
    currentPage * CANDIDATES_PER_PAGE
  );

  // Check if any filters are active
  const hasActiveFilters = filters.status !== 'all' || filters.minScore > 0 || filters.maxScore < 100 || filters.skills.length > 0 || filters.experience !== 'all' || filters.location !== 'all' || filters.dateRange !== 'all';

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  const toggleSkillFilter = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const updateStatus = (id: string, status: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
    toast.success(t('status_updated'));
  };

  const inviteCandidate = (name: string) => {
    toast.success(t('invitation_sent_to', { name }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold font-[Poppins]">{t('applicant_tracking')}</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className="ps-9 w-full sm:w-64 h-9"
              aria-label={t('search')}
            />
            {isSearching && <div className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            className="cursor-pointer gap-1 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <Filter className="w-3 h-3" />
            {t('filter')}
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-destructive" />}
          </Button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(hasActiveFilters || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setSearchQuery('')}>
              {t('search')}: "{searchQuery}" <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(p => ({ ...p, status: 'all' }))}>
              {t('status')}: {filters.status === 'new' ? t('new_status') : t(filters.status)} <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.skills.map(skill => (
            <Badge key={skill} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleSkillFilter(skill)}>
              {skill} <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.experience !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(p => ({ ...p, experience: 'all' }))}>
              {t('experience')}: {filters.experience} <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.location !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(p => ({ ...p, location: 'all' }))}>
              {t('location')}: {filters.location} <X className="w-3 h-3" />
            </Badge>
          )}
          {(filters.minScore > 0 || filters.maxScore < 100) && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(p => ({ ...p, minScore: 0, maxScore: 100 }))}>
              {t('match_score')}: {filters.minScore}-{filters.maxScore}% <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.dateRange !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(p => ({ ...p, dateRange: 'all' }))}>
              {t('date')}: {filters.dateRange} <X className="w-3 h-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="cursor-pointer text-xs h-6" onClick={clearAllFilters}>
            {t('clear_filters')}
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <Label className="text-xs font-medium mb-1 block">{t('status')}</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="new">{t('new_status')}</SelectItem>
                    <SelectItem value="interview">{t('interview')}</SelectItem>
                    <SelectItem value="offered">{t('offered')}</SelectItem>
                    <SelectItem value="accepted">{t('hired')}</SelectItem>
                    <SelectItem value="rejected">{t('rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Filter */}
              <div>
                <Label className="text-xs font-medium mb-1 block">{t('experience')}</Label>
                <Select value={filters.experience} onValueChange={(v) => setFilters(p => ({ ...p, experience: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="entry">{t('entry_level')}</SelectItem>
                    <SelectItem value="junior">{t('junior')}</SelectItem>
                    <SelectItem value="mid">{t('mid_level')}</SelectItem>
                    <SelectItem value="senior">{t('senior')}</SelectItem>
                    <SelectItem value="lead">{t('lead')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <Label className="text-xs font-medium mb-1 block">{t('location')}</Label>
                <Select value={filters.location} onValueChange={(v) => setFilters(p => ({ ...p, location: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    {allLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div>
                <Label className="text-xs font-medium mb-1 block">{t('date_applied')}</Label>
                <Select value={filters.dateRange} onValueChange={(v) => setFilters(p => ({ ...p, dateRange: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="today">{t('today')}</SelectItem>
                    <SelectItem value="7days">{t('last_7_days')}</SelectItem>
                    <SelectItem value="30days">{t('last_30_days')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Match Score Range */}
            <div>
              <Label className="text-xs font-medium mb-1 block">{t('match_score')}: {filters.minScore}% - {filters.maxScore}%</Label>
              <div className="flex items-center gap-3">
                <Input type="number" min={0} max={100} value={filters.minScore} onChange={(e) => setFilters(p => ({ ...p, minScore: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))} className="w-20 h-8 text-sm" />
                <span className="text-muted-foreground text-sm">—</span>
                <Input type="number" min={0} max={100} value={filters.maxScore} onChange={(e) => setFilters(p => ({ ...p, maxScore: Math.max(0, Math.min(100, parseInt(e.target.value) || 100)) }))} className="w-20 h-8 text-sm" />
              </div>
            </div>

            {/* Skills Filter */}
            <div>
              <Label className="text-xs font-medium mb-2 block">{t('skills')}</Label>
              <div className="flex flex-wrap gap-2">
                {allSkills.map(skill => (
                  <Badge
                    key={skill}
                    variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleSkillFilter(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort & Results Count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <p className="text-sm text-muted-foreground">
          {processedCandidates.length} {t('candidates')} {hasActiveFilters || debouncedSearch ? `(${t('filtered')})` : ''}
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">{t('sort_by')}:</Label>
          <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => { const [f, o] = v.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder); }}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score-desc">{t('match_score')} ↓</SelectItem>
              <SelectItem value="score-asc">{t('match_score')} ↑</SelectItem>
              <SelectItem value="name-asc">{t('name')} A-Z</SelectItem>
              <SelectItem value="name-desc">{t('name')} Z-A</SelectItem>
              <SelectItem value="appliedDate-desc">{t('date_applied')} ↓</SelectItem>
              <SelectItem value="appliedDate-asc">{t('date_applied')} ↑</SelectItem>
              <SelectItem value="experience-desc">{t('experience')} ↓</SelectItem>
              <SelectItem value="experience-asc">{t('experience')} ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-3">
        {paginatedCandidates.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">{t('no_candidates_found')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('try_different_search')}</p>
            {(hasActiveFilters || searchQuery) && (
              <Button variant="outline" size="sm" className="cursor-pointer mt-4" onClick={clearAllFilters}>
                {t('clear_filters')}
              </Button>
            )}
          </div>
        ) : (
          paginatedCandidates.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="font-semibold text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.appliedFor} · {c.appliedDate} · {c.location}</p></div></div>
                <div className="text-end"><span className="text-lg font-bold text-primary">{c.score}%</span><Badge variant="secondary" className="text-xs block mt-1">{c.status === 'new' ? t('new_status') : t(c.status)}</Badge></div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{c.summary}</p>
              <div className="flex flex-wrap gap-1 mb-3">{c.skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
              <div className="flex flex-wrap gap-2">
                {c.status === 'new' && <><Button size="sm" className="cursor-pointer gap-1" onClick={() => updateStatus(c.id, 'interview')}><Calendar className="w-3 h-3" />{t('schedule_interview')}</Button><Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => updateStatus(c.id, 'rejected')}><X className="w-3 h-3" />{t('reject')}</Button></>}
                {c.status === 'interview' && <><Button size="sm" className="cursor-pointer gap-1" onClick={() => updateStatus(c.id, 'offered')}><Check className="w-3 h-3" />{t('make_offer')}</Button><Button size="sm" variant="outline" className="cursor-pointer gap-1" onClick={() => updateStatus(c.id, 'rejected')}><X className="w-3 h-3" />{t('reject')}</Button></>}
                {c.status === 'offered' && <Button size="sm" className="cursor-pointer gap-1" onClick={() => updateStatus(c.id, 'accepted')}><UserCheck className="w-3 h-3" />{t('mark_hired')}</Button>}
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => toast.success(t('candidate_saved'))}><Heart className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => inviteCandidate(c.name)}><Send className="w-3 h-3" /></Button>
              </div>
            </CardContent></Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            {t('previous')}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'ghost'}
                size="sm"
                className="cursor-pointer w-8 h-8 p-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            {t('next')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Candidate Pipeline (Kanban-style)
// ============================================================

function PipelineView() {
  const { t } = useTranslation();
  const stages = [
    { key: 'new', label: t('new_status'), candidates: mockCandidates.filter(c => c.status === 'new') },
    { key: 'interview', label: t('interview'), candidates: mockCandidates.filter(c => c.status === 'interview') },
    { key: 'offered', label: t('offered'), candidates: mockCandidates.filter(c => c.status === 'offered') },
    { key: 'accepted', label: t('hired'), candidates: mockCandidates.filter(c => c.status === 'accepted') },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-x-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('hiring_pipeline')}</h2>
      <div className="flex gap-4 min-w-[800px]">
        {stages.map((stage) => (
          <div key={stage.key} className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">{stage.label}</h3><Badge variant="secondary" className="text-xs">{stage.candidates.length}</Badge></div>
            <div className="space-y-2">
              {stage.candidates.map((c) => (
                <Card key={c.id} className="cursor-pointer hover:shadow-md transition-smooth"><CardContent className="p-3">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.appliedFor}</p>
                  <div className="flex items-center justify-between mt-2"><div className="flex gap-1">{c.skills.slice(0, 2).map(s => <Badge key={s} variant="outline" className="text-[10px] px-1">{s}</Badge>)}</div><span className="text-xs font-bold text-primary">{c.score}%</span></div>
                </CardContent></Card>
              ))}
              {stage.candidates.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">{t('no_candidates')}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Saved Candidates
// ============================================================

function SavedCandidatesView() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(mockCandidates.slice(0, 3));

  const handleRemove = (id: string) => {
    setSaved(prev => prev.filter(c => c.id !== id));
    toast.success(t('candidate_removed'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('saved_candidates')}</h2>
      <div className="space-y-3">
        {saved.map((c) => (
          <Card key={c.id}><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.skills.join(', ')}</p></div></div>
            <div className="flex items-center gap-2"><Badge variant="secondary">{c.score}%</Badge><Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={() => handleRemove(c.id)}><Trash2 className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
        {saved.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_saved_candidates')}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Matching Queue
// ============================================================

function MatchingQueueView() {
  const { t } = useTranslation();
  const [queue, setQueue] = useState(mockCandidates.filter(c => c.score >= 80));

  const handleAccept = (id: string) => {
    setQueue(prev => prev.filter(c => c.id !== id));
    toast.success(t('candidate_accepted'));
  };

  const handleReject = (id: string) => {
    setQueue(prev => prev.filter(c => c.id !== id));
    toast.success(t('candidate_rejected'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('matching_queue')}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t('matching_queue_desc')}</p>
      <div className="space-y-3">
        {queue.map((c) => (
          <Card key={c.id} className="border-primary/20"><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.appliedFor} · {c.experience} {t('years_exp')}</p></div></div>
            <div className="flex items-center gap-2"><span className="text-lg font-bold text-primary">{c.score}%</span><Button size="sm" className="cursor-pointer gap-1" onClick={() => handleAccept(c.id)}><Check className="w-3 h-3" />{t('accept')}</Button><Button size="sm" variant="outline" className="cursor-pointer" onClick={() => handleReject(c.id)}><X className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
        {queue.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_candidates_in_queue')}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Notifications
// ============================================================

function NotificationsView() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success(t('all_marked_read'));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success(t('notification_deleted'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('notifications')}</h2><Button variant="ghost" size="sm" className="cursor-pointer" onClick={markAllRead}>{t('mark_all_read')}</Button></div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={`${!n.read ? 'border-primary/30 bg-primary/5' : ''} cursor-pointer`} onClick={() => markAsRead(n.id)}><CardContent className="p-4 flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
            <div className="flex-1"><p className="text-sm">{n.message}</p><p className="text-xs text-muted-foreground mt-1">{n.time}</p></div>
            <Button size="sm" variant="ghost" className="cursor-pointer text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}><Trash2 className="w-3 h-3" /></Button>
          </CardContent></Card>
        ))}
        {notifications.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_notifications')}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Analytics
// ============================================================

function AnalyticsView() {
  const { t } = useTranslation();
  const metrics = [
    { label: t('total_applications'), value: '156' },
    { label: t('acceptance_rate'), value: '34%' },
    { label: t('response_rate'), value: '78%' },
    { label: t('avg_time_to_hire'), value: t('days', { count: 12 }) },
  ];
  const funnel = [
    { stage: t('applications'), count: 156, pct: 100 },
    { stage: t('screened'), count: 89, pct: 57 },
    { stage: t('interviewed'), count: 34, pct: 22 },
    { stage: t('offered'), count: 12, pct: 8 },
    { stage: t('hired'), count: 8, pct: 5 },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('analytics')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (<Card key={m.label}><CardContent className="p-4 text-center"><p className="text-2xl font-bold font-[Poppins] text-primary">{m.value}</p><p className="text-xs text-muted-foreground mt-1">{m.label}</p></CardContent></Card>))}
      </div>
      <Card className="mb-6"><CardHeader><CardTitle className="text-sm font-[Poppins]">{t('hiring_funnel')}</CardTitle></CardHeader><CardContent className="space-y-3">
        {funnel.map((f) => (<div key={f.stage} className="flex items-center gap-3"><span className="text-sm w-28 shrink-0">{f.stage}</span><div className="flex-1"><Progress value={f.pct} className="h-3" /></div><span className="text-sm font-medium w-10 text-end">{f.count}</span></div>))}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm font-[Poppins]">{t('top_requested_skills')}</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'SQL', 'Docker', 'Kubernetes'].map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div></CardContent></Card>
    </div>
  );
}

// ============================================================
// Reports
// ============================================================

function ReportsView() {
  const { t } = useTranslation();
  const reports = [
    { name: t('monthly_hiring_report'), date: '2026-07-01', type: 'PDF' },
    { name: t('candidate_source_analysis'), date: '2026-07-05', type: 'CSV' },
    { name: t('time_to_hire_report'), date: '2026-07-10', type: 'PDF' },
    { name: t('diversity_report'), date: '2026-07-12', type: 'PDF' },
  ];

  const handleDownload = (name: string) => {
    toast.success(t('download_started'));
  };

  const handleGenerate = () => {
    toast.success(t('report_generating'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('reports')}</h2><Button className="cursor-pointer gap-2" onClick={handleGenerate}><Plus className="w-4 h-4" />{t('generate_report')}</Button></div>
      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.name}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-muted-foreground">{r.date}</p></div>
            <div className="flex items-center gap-2"><Badge variant="outline">{r.type}</Badge><Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => handleDownload(r.name)}><Download className="w-4 h-4" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Subscription
// ============================================================

function SubscriptionView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('subscription')}</h2>
      <Card className="border-primary border-2 mb-6"><CardContent className="p-6">
        <div className="flex items-center justify-between mb-4"><div><Badge className="mb-2">{t('current_plan')}</Badge><h3 className="text-2xl font-bold font-[Poppins]">Professional</h3><p className="text-sm text-muted-foreground">$49{t('per_month')}</p></div><CreditCard className="w-10 h-10 text-primary" /></div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground"><span>{t('next_billing')}: 2026-08-01</span><span>·</span><span>{t('auto_renew')}: {t('active')}</span></div>
        <div className="flex gap-2 mt-4"><Button className="cursor-pointer" onClick={() => navigate('/company/subscription')}>{t('view_all_plans')}</Button><Button variant="ghost" className="cursor-pointer text-destructive" onClick={() => toast.error(t('cancel_subscription_confirm'))}>{t('cancel_subscription')}</Button></div>
      </CardContent></Card>
      <h3 className="font-semibold mb-3">{t('plan_features')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[t('unlimited_job_postings'), t('message_anyone'), t('full_contact_details'), t('advanced_analytics'), t('priority_ranking'), t('export_candidate_data')].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600" /><span>{f}</span></div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Billing
// ============================================================

function BillingView() {
  const { t } = useTranslation();

  const handleDownloadInvoice = (id: string) => {
    toast.success(t('download_started'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('billing')}</h2>
      <Card className="mb-6"><CardContent className="p-4">
        <h3 className="font-medium mb-3">{t('payment_method')}</h3>
        <div className="flex items-center gap-3"><div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">Visa •••• 4242</div><Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => toast.success(t('payment_method_update'))}>{t('change')}</Button></div>
      </CardContent></Card>
      <h3 className="font-semibold mb-3">{t('billing_history')}</h3>
      <div className="space-y-2">
        {mockBilling.map((b) => (
          <Card key={b.id}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium">{b.description}</p><p className="text-xs text-muted-foreground">{b.date}</p></div>
            <div className="flex items-center gap-3"><span className="font-semibold">${b.amount}</span><Badge variant="secondary" className="text-xs">{t(b.status)}</Badge><Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => handleDownloadInvoice(b.id)}><Download className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Team Members & Permissions (Full CRUD)
// ============================================================

function TeamView() {
  const { t } = useTranslation();
  const [team, setTeam] = useState<TeamMember[]>(initialTeamMembers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: string }>({ name: '', email: '', role: 'Viewer' });

  const openInvite = () => {
    setEditingMember(null);
    setForm({ name: '', email: '', role: 'Viewer' });
    setDialogOpen(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setForm({ name: member.name, email: member.email, role: member.role });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) { toast.error(t('fill_all_fields')); return; }
    const permissions = form.role === 'Admin' ? ['all'] : form.role === 'Recruiter' ? ['post_jobs', 'manage_candidates', 'messages'] : ['view_candidates', 'messages'];
    if (editingMember) {
      setTeam(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...form, permissions } : m));
      toast.success(t('member_updated'));
    } else {
      setTeam(prev => [...prev, { id: Date.now().toString(), ...form, permissions, lastActive: 'Pending' }]);
      toast.success(t('invitation_sent'));
    }
    setDialogOpen(false);
  };

  const handleRemove = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
    toast.success(t('member_removed'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('team_members')}</h2><Button className="cursor-pointer gap-2" onClick={openInvite}><UserPlus className="w-4 h-4" />{t('invite_member')}</Button></div>
      <div className="space-y-3">
        {team.map((m) => (
          <Card key={m.id}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div></div>
              <div className="flex items-center gap-2"><Badge variant={m.role === 'Admin' ? 'default' : 'secondary'} className="text-xs">{m.role}</Badge><Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => openEdit(m)}><Edit className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={() => handleRemove(m.id)}><Trash2 className="w-3 h-3" /></Button></div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">{m.permissions.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p === 'all' ? t('full_access') : p.replace('_', ' ')}</Badge>)}</div>
            <p className="text-xs text-muted-foreground mt-2">{t('last_active')}: {m.lastActive}</p>
          </CardContent></Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-[Poppins]">{editingMember ? t('edit_member') : t('invite_member')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('full_name')}</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('email')}</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('role')}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({...form, role: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Admin">{t('admin')}</SelectItem><SelectItem value="Recruiter">{t('recruiter')}</SelectItem><SelectItem value="Viewer">{t('viewer')}</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">{t('cancel')}</Button>
            <Button onClick={handleSave} className="cursor-pointer">{editingMember ? t('save') : t('send_invitation')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Settings
// ============================================================

function SettingsView() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    emailApps: true, emailMatches: true, emailMessages: true, push: true,
    showPublic: true, allowDM: true, showSalary: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); toast.success(t('settings_saved')); }, 800);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('settings')}</h2>
      <div className="max-w-2xl space-y-6">
        <Card><CardHeader><CardTitle className="text-sm">{t('notification_settings')}</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>{t('email_new_applications')}</Label><Switch checked={settings.emailApps} onCheckedChange={(v) => setSettings({...settings, emailApps: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('email_new_matches')}</Label><Switch checked={settings.emailMatches} onCheckedChange={(v) => setSettings({...settings, emailMatches: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('email_messages')}</Label><Switch checked={settings.emailMessages} onCheckedChange={(v) => setSettings({...settings, emailMessages: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('push_notifications')}</Label><Switch checked={settings.push} onCheckedChange={(v) => setSettings({...settings, push: v})} /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('privacy_settings')}</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>{t('show_company_public')}</Label><Switch checked={settings.showPublic} onCheckedChange={(v) => setSettings({...settings, showPublic: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('allow_direct_messages')}</Label><Switch checked={settings.allowDM} onCheckedChange={(v) => setSettings({...settings, allowDM: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('show_salary_range')}</Label><Switch checked={settings.showSalary} onCheckedChange={(v) => setSettings({...settings, showSalary: v})} /></div>
        </CardContent></Card>
        <Button className="cursor-pointer" onClick={handleSave} disabled={saving}>{saving ? t('loading') : t('save')}</Button>
        <ChangePassword />
        <Card><CardHeader><CardTitle className="text-sm">{t('danger_zone')}</CardTitle></CardHeader><CardContent>
          <Button variant="destructive" className="cursor-pointer" onClick={() => toast.error(t('delete_account_warning'))}>{t('delete_account')}</Button>
          <p className="text-xs text-muted-foreground mt-2">{t('delete_account_warning')}</p>
        </CardContent></Card>
      </div>
    </div>
  );
}



// ============================================================
// Main Company Component
// ============================================================

export default function Company() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NavSection>('dashboard');

  // Navigation Reliability: Intercept 'messages' tab at all entry points
  // If activeTab is ever set to 'messages' (from sidebar or any source), navigate immediately
  useEffect(() => {
    if (activeTab === 'messages') {
      navigate('/messages');
    }
  }, [activeTab, navigate]);

  // Map nav sections to directory views
  const directoryViewMap: Record<string, DirectoryView> = {
    directory: 'directory',
    dir_saved: 'saved',
    dir_viewed: 'viewed',
    dir_contacts: 'contacts',
    dir_pipeline: 'pipeline',
  };

  const renderContent = () => {
    // Handle directory views
    if (activeTab in directoryViewMap) {
      return <CandidateDirectory activeView={directoryViewMap[activeTab]} companyTier="premium" />;
    }

    switch(activeTab) {
      case 'dashboard': return <DashboardView onNavigate={setActiveTab} />;
      case 'profile': return <ProfileView />;
      case 'branches': return <BranchesView />;
      case 'recruiters': return <RecruitersView />;
      case 'vacancies': return <VacanciesView />;
      case 'candidates': return <CandidatesView />;
      case 'pipeline': return <PipelineView />;
      case 'saved': return <TalentCollections />;
      case 'matching': return <MatchingQueueView />;
      case 'messages': return null; // Handled by useEffect — navigates to /messages
      case 'notifications': return <NotificationsView />;
      case 'analytics': return <AnalyticsView />;
      case 'subscription': return <SubscriptionView />;
      case 'billing': return <BillingView />;
      case 'reports': return <ReportsView />;
      case 'team': return <TeamView />;
      case 'settings': return <SettingsView />;
      case 'ai_recommendations': return <AIRecommendationsView tier="premium" />;
      case 'invitations': return <CompanyInvitationsView tier="premium" />;
      case 'enhanced_saved': return <TalentCollections />;
      case 'advanced_pipeline': return <AdvancedTalentPipelineView tier="premium" />;
      case 'team_collab': return <TeamCollaborationView tier="premium" />;
      case 'talent_analytics': return <TalentAnalyticsView tier="premium" />;
      case 'role_management': return <RoleManagementView />;
      case 'enterprise_team': return <TeamManagementView />;
      case 'departments': return <DepartmentManagementView />;
      case 'audit_logs': return <AuditLogsView />;
      case 'feature_flags': return <FeatureFlagsView />;
      case 'org_settings': return <OrganizationSettingsView />;
      case 'security': return <SecurityDashboardView />;
      default: return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  const companyNavConfig = getCompanyNavConfig();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseNavigation
        config={companyNavConfig}
        activeItemId={activeTab}
        onNavigate={(id) => setActiveTab(id as NavSection)}
        onSignOut={signOut}
      />
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {renderContent()}
      </main>
    </div>
  );
}