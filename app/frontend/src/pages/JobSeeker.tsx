import { MobileSwipePreferences } from '@/components/seeker/MobileSwipePreferences';
import { useCountries } from '@/components/shared/ProfileFields';
import { useViaPremium } from '@/lib/via-premium';
import { nativeBridge } from '@/lib/native-bridge';
import { MobileSwipePage } from '@/components/seeker/MobileSwipePage';
import { useMandatoryProfile } from '@/lib/mandatory-profile';
import { latestEligiblePass, isAvailableJob, compensationText, clearPendingSharedJob, rememberSharedJob } from '@/lib/swipe-presentation';
import { seekerSection, seekerSectionUrl, accurateBadgeCount } from '@/lib/seeker-navigation';
import { messageService } from '@/services/message.service';
import { BackButton } from '@/components/shared/BackButton';
import { rankEligibleVacancies } from '@/lib/vacancy-discovery';
import { loadPreferences, migrateLegacyPreferences, preferenceFit, savePreferences } from '@/lib/job-preferences';
import { apiClient } from '@/services/api-client';
import { useCreditAccount } from '@/lib/seeker-credits';
import { useSeekerJobs, recordJobAction, shareJob, type DiscoverJob } from '@/lib/seeker-jobs';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { PreferencesForm } from '@/components/seeker/PreferencesForm';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/App';
import { changeLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { SwipeFeedbackEngine, type SwipeCardItem } from '@/components/shared/SwipeFeedbackEngine';
import {
  Sparkles, Home, Heart, MessageSquare, Bookmark, Settings, LogOut,
  Globe, Moon, Sun, Building2, MapPin, Briefcase, GraduationCap, X, Check,
  User, BarChart3, CreditCard, Bell, FileText, Award,
  Languages as LanguagesIcon, Video, Sliders, Clock, Plus, Edit, Trash2, Upload,
  ExternalLink, Star, Eye, Calendar, Download, Link2, Layers, Undo2,
  TrendingUp, Zap, Target, Send, Users
} from 'lucide-react';
import { useMatchingEngine } from '@/lib/useMatchingEngine';
import { SeekerProfile, VacancyProfile } from '@/lib/matching-engine';
import { useAIMatching } from '@/lib/useAIMatching';
import { SeekerAIProfile, VacancyAIProfile, MatchExplanation } from '@/lib/ai-matching-engine';
import { ChangePassword } from '@/components/shared/ChangePassword';
import { SeekerInvitationsView } from '@/components/shared/SeekerInvitations';
import PortalBrand, { getPortalBrandConfig } from '@/components/shared/PortalBrand';
import {
  ProfileVisibilitySettings, ContactRequestsView, ExposureDashboard,
  RecruiterVisibilityView, DiscoverabilityNotifications,
  type SeekerTier
} from '@/components/shared/CandidateDiscoverability';
import { ProfileCompletionCard, ProfileCompletionMini, type ProfileData } from '@/components/shared/ProfileCompletion';
import { MobileBottomNav, type MobileNavTab } from '@/components/shared/MobileBottomNav';
import { MobileDashboard } from '@/components/shared/MobileDashboard';
import LegacyDashboard from '@/components/shared/LegacyDashboard';
import { applicationStatus, recruitmentLabel } from '@/lib/recruitment-status';
import { PersonalInformationPage } from '@/components/seeker/PersonalInformation';
import { MobileProfileAccount, MOBILE_ACCOUNT_SECTIONS } from '@/components/seeker/MobileProfileAccount';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/stores';
import { logger } from '@/lib/logger';
import { ensureJobSeekerInitialized } from '@/lib/signup-flow';
import { ProfileView, ExperienceView, EducationView, LanguagesView } from '@/components/seeker/ProfessionalProfile';
import { ScoreBreakdown, ConfidenceIndicator } from '@/components/shared/ScoreVisualizationEngine';

// ============================================================
// Types
// ============================================================

interface Skill {
  id: string;
  name: string;
  level: string;
  years: number;
  endorsed: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  desc: string;
  url: string;
}

// ============================================================
// Mock Data
// ============================================================

const mockJobs = [
  { id: '1', company_name: 'TechCorp', industry: 'Technology', country: 'UAE', city: 'Dubai', employment_type: 'full_time', min_experience: 3, max_experience: 5, job_title: 'Senior Frontend Developer', job_description: 'We are looking for an experienced frontend developer to join our team and build amazing user interfaces.', required_skills: ['React', 'TypeScript', 'Tailwind CSS'], salary_min: 8000, salary_max: 12000, compatibility_score: 92 },
  { id: '2', company_name: 'DataFlow', industry: 'Data Analytics', country: 'Saudi Arabia', city: 'Riyadh', employment_type: 'full_time', min_experience: 2, max_experience: 4, job_title: 'Full Stack Engineer', job_description: 'Join our growing team to build scalable data platforms and analytics dashboards.', required_skills: ['Node.js', 'Python', 'PostgreSQL', 'React'], salary_min: 7000, salary_max: 10000, compatibility_score: 85 },
  { id: '3', company_name: 'FinanceHub', industry: 'Finance', country: 'UAE', city: 'Abu Dhabi', employment_type: 'remote', min_experience: 1, max_experience: 3, job_title: 'Mobile Developer', job_description: 'Build cross-platform mobile applications for our fintech products.', required_skills: ['React Native', 'Flutter', 'Firebase'], salary_min: 6000, salary_max: 9000, compatibility_score: 78 },
  { id: '4', company_name: 'CloudNine', industry: 'Cloud Computing', country: 'Qatar', city: 'Doha', employment_type: 'full_time', min_experience: 4, max_experience: 7, job_title: 'DevOps Engineer', job_description: 'Design and maintain cloud infrastructure for enterprise clients.', required_skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'], salary_min: 10000, salary_max: 15000, compatibility_score: 71 },
];

const mockSavedJobs = [
  { id: '1', title: 'Senior Frontend Developer', company: 'TechCorp', location: 'Dubai, UAE', salary: '$8K-12K', savedDate: '2026-07-14', status: 'open' },
  { id: '2', title: 'Full Stack Engineer', company: 'DataFlow', location: 'Riyadh, KSA', salary: '$7K-10K', savedDate: '2026-07-13', status: 'open' },
  { id: '3', title: 'Product Manager', company: 'InnoTech', location: 'Abu Dhabi, UAE', salary: '$9K-14K', savedDate: '2026-07-10', status: 'closed' },
];

const mockApplications = [
  { id: '1', title: 'Senior Frontend Developer', company: 'TechCorp', appliedDate: '2026-07-14', status: 'interview' as const },
  { id: '2', title: 'Full Stack Engineer', company: 'DataFlow', appliedDate: '2026-07-12', status: 'reviewed' as const },
  { id: '3', title: 'Mobile Developer', company: 'FinanceHub', appliedDate: '2026-07-10', status: 'pending' as const },
  { id: '4', title: 'DevOps Engineer', company: 'CloudNine', appliedDate: '2026-07-08', status: 'rejected' as const },
];

const mockMatches = [
  { id: '1', company: 'TechCorp', role: 'Senior Frontend Developer', score: 94, matchedDate: '2026-07-15', hasMessage: true },
  { id: '2', company: 'DataFlow', role: 'Full Stack Engineer', score: 87, matchedDate: '2026-07-14', hasMessage: false },
  { id: '3', company: 'FinanceHub', role: 'Mobile Developer', score: 82, matchedDate: '2026-07-13', hasMessage: true },
];

const mockNotifications = [
  { id: '1', type: 'match', message: 'New match with TechCorp (94% compatibility)', time: '5 min ago', read: false },
  { id: '2', type: 'application', message: 'Your application for Full Stack Engineer was reviewed', time: '2 hours ago', read: false },
  { id: '3', type: 'interview', message: 'Interview scheduled with TechCorp for July 20', time: '1 day ago', read: true },
  { id: '4', type: 'message', message: 'New message from DataFlow recruiter', time: '2 days ago', read: true },
];

const initialSkills: Skill[] = [
  { id: '1', name: 'React', level: 'expert', years: 4, endorsed: 12 },
  { id: '2', name: 'TypeScript', level: 'advanced', years: 3, endorsed: 8 },
  { id: '3', name: 'Node.js', level: 'advanced', years: 3, endorsed: 6 },
  { id: '4', name: 'Tailwind CSS', level: 'expert', years: 3, endorsed: 5 },
  { id: '5', name: 'PostgreSQL', level: 'intermediate', years: 2, endorsed: 3 },
];

const initialPortfolio: PortfolioItem[] = [
  { id: '1', title: 'E-commerce Platform', desc: 'Full-stack e-commerce with React & Node.js', url: 'https://github.com/ahmed/ecommerce' },
  { id: '2', title: 'Task Management App', desc: 'Kanban-style project management tool', url: 'https://taskapp.demo.com' },
];

// ============================================================
// Navigation
// ============================================================

type NavSection = 'personal' | 'via_resume' | 'subscription_overview' | 'support' | 'faq' | 'report' | 'account_settings' | 'swipe' | 'dashboard' | 'profile' | 'cv' | 'experience' | 'education' | 'certificates' | 'skills' | 'languages' | 'portfolio' | 'video' | 'preferences' | 'saved' | 'applications' | 'matches' | 'messages' | 'notifications' | 'settings' | 'visibility' | 'exposure' | 'contact_requests' | 'who_viewed' | 'invitations';

function SeekerNav({ activeTab, setActiveTab }: { activeTab: NavSection; setActiveTab: (tab: NavSection) => void }) {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const toggleDark = () => { document.documentElement.classList.toggle('dark'); setIsDark(!isDark); };

  const navGroups = [
    { items: [
      { id: 'swipe' as NavSection, icon: Heart, label: t('discover') },
      { id: 'dashboard' as NavSection, icon: Home, label: t('dashboard') },
    ]},
    { items: [
      { id: 'profile' as NavSection, icon: User, label: t('profile') },
      { id: 'experience' as NavSection, icon: Briefcase, label: t('experience') },
      { id: 'education' as NavSection, icon: GraduationCap, label: t('education') },
      { id: 'skills' as NavSection, icon: Star, label: t('skills') },
      { id: 'languages' as NavSection, icon: LanguagesIcon, label: t('languages') },
      { id: 'portfolio' as NavSection, icon: Layers, label: t('portfolio') },
      { id: 'video' as NavSection, icon: Video, label: t('video_intro') },
    ]},
    { items: [
      { id: 'saved' as NavSection, icon: Bookmark, label: t('saved_jobs') },
    ]},
    { items: [
      { id: 'visibility' as NavSection, icon: Eye, label: t('profile_visibility') },
      { id: 'exposure' as NavSection, icon: BarChart3, label: t('exposure_dashboard') },
      { id: 'contact_requests' as NavSection, icon: Send, label: t('contact_requests') },
      { id: 'who_viewed' as NavSection, icon: Users, label: t('who_viewed_profile') },
      { id: 'invitations' as NavSection, icon: Send, label: t('invitations') },
    ]},
    { items: [
      { id: 'messages' as NavSection, icon: MessageSquare, label: t('messages') },
      { id: 'notifications' as NavSection, icon: Bell, label: t('notifications') },
    ]},
    { items: [
      { id: 'settings' as NavSection, icon: Settings, label: t('settings') },
    ]},
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="mb-3">
          <PortalBrand config={getPortalBrandConfig('job_seeker')} />
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => changeLanguage(i18n.language === 'en' ? 'ar' : 'en')} className="cursor-pointer h-8 w-8"><Globe className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} className="cursor-pointer h-8 w-8">{isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</Button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-3">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="border-t border-border my-2" />}
            {group.items.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth cursor-pointer ${activeTab === item.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                <item.icon className="w-4 h-4" /><span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-border space-y-1">
        <button onClick={() => navigate('/seeker/subscription')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-smooth cursor-pointer"><CreditCard className="w-4 h-4" /><span>{t('subscription')}</span></button>
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-smooth cursor-pointer"><LogOut className="w-4 h-4" /><span>{t('logout')}</span></button>
      </div>
    </div>
  );
}

// ============================================================
// Mock Seeker Profile (for matching engine)
// ============================================================

const CURRENT_SEEKER: SeekerProfile = {
  id: 'seeker-1',
  skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'PostgreSQL'],
  experienceYears: 5,
  location: { country: 'UAE', city: 'Dubai' },
  expectedSalaryMin: 8000,
  expectedSalaryMax: 15000,
  preferredIndustries: ['Technology', 'Finance', 'E-commerce'],
  languages: [{ name: 'Arabic', level: 'native' }, { name: 'English', level: 'advanced' }, { name: 'French', level: 'intermediate' }],
  availability: 'two_weeks',
  preferredLocations: ['Dubai', 'Abu Dhabi', 'Riyadh'],
  willingToRelocate: true,
  openToRemote: true,
};

const MOCK_VACANCIES: VacancyProfile[] = mockJobs.map(j => ({
  id: j.id,
  companyId: `company-${j.id}`,
  requiredSkills: j.required_skills,
  minExperience: j.min_experience,
  maxExperience: j.max_experience,
  location: { country: j.country, city: j.city },
  salaryMin: j.salary_min,
  salaryMax: j.salary_max,
  industry: j.industry,
  requiredLanguages: ['English'],
  employmentType: j.employment_type,
  isRemote: j.employment_type === 'remote',
}));

// AI-enhanced profiles
const AI_SEEKER: SeekerAIProfile = {
  id: 'seeker-1',
  skills: [
    { name: 'React', level: 'expert', years: 4 },
    { name: 'TypeScript', level: 'advanced', years: 3 },
    { name: 'Node.js', level: 'advanced', years: 3 },
    { name: 'Tailwind CSS', level: 'expert', years: 3 },
    { name: 'PostgreSQL', level: 'intermediate', years: 2 },
  ],
  experienceYears: 5,
  experienceDetails: 'Full-stack web development with focus on React ecosystem',
  education: [{ degree: 'bachelors', field: 'Computer Science', institution: 'University of Dubai' }],
  languages: [{ name: 'Arabic', level: 'native' }, { name: 'English', level: 'advanced' }, { name: 'French', level: 'intermediate' }],
  expectedSalary: { min: 8000, max: 15000, currency: 'USD' },
  location: { country: 'UAE', city: 'Dubai', willingToRelocate: true },
  preferredIndustries: ['Technology', 'Finance', 'E-commerce'],
  workPreference: 'hybrid',
  availability: 'two_weeks',
  summary: 'Senior frontend developer with 5+ years building scalable React applications',
  preferredRoles: ['Frontend Developer', 'Full Stack Engineer', 'React Developer'],
};

const AI_VACANCIES: VacancyAIProfile[] = mockJobs.map(j => ({
  id: j.id,
  companyId: `company-${j.id}`,
  companyName: j.company_name,
  requiredSkills: j.required_skills.map((s, i) => ({ name: s, importance: i === 0 ? 'required' as const : 'preferred' as const })),
  experienceRange: { min: j.min_experience, max: j.max_experience },
  educationRequirement: { minDegree: 'bachelors', preferredFields: ['Computer Science', 'Software Engineering'] },
  requiredLanguages: [{ name: 'English', minLevel: 'advanced' }],
  salaryRange: { min: j.salary_min, max: j.salary_max, currency: 'USD' },
  location: { country: j.country, city: j.city },
  industry: j.industry,
  workPolicy: j.employment_type === 'remote' ? 'remote' as const : 'hybrid' as const,
  startDate: 'flexible',
  description: j.job_description,
  title: j.job_title,
}));

// ============================================================
// Swipe View — One-Viewport Decision Experience
// ============================================================
// Architecture: DecisionScreenLayout (dynamic height distribution)
// Level 1: Ultra-compact Decision Card (NO scrolling, viewport-fit)
// Level 2: Details View (Bottom Sheet, lazy loaded on tap)
//
// Mobile viewport budget (390×844):
//   Status bar: ~47px
//   Header: ~36px
//   Summary chips: ~24px
//   Decision Card: DYNAMIC (flex-1, ~480px available)
//   Action buttons: ~64px
//   Bottom nav: 56px
//   Safe area: ~34px
// Total: 844px — fits perfectly with zero scroll
// ============================================================

import { BottomSheet } from '@/components/shared/BottomSheet';
import { DecisionScreenLayout } from '@/components/shared/DecisionScreenLayout';
import { DecisionActionBar } from '@/components/shared/DecisionActionBar';
import { UCSummaryCard, UCDecisionCard } from '@/components/shared/CardEngine';
import type { SummaryCardConfig, DecisionCardConfig } from '@/lib/card-engine-types';

/** Level 1 — Premium Decision Card Content (swipe handled by SwipeFeedbackEngine on mobile) */
function SwipeCardContent({ job, score, onViewDetails, onUndo, canUndo }: { job: DiscoverJob; score: number; onViewDetails: () => void; onUndo?: () => void; canUndo?: boolean }) {
  const { t,i18n } = useTranslation();
  const compensation=compensationText(job,i18n.language);
  const completion=useMandatoryProfile();
  const isMobile = useIsMobile();
  const typeLabel = (type: string) => { const m: Record<string, string> = { full_time: t('full_time'), part_time: t('part_time'), contract: t('contract'), remote: t('remote'), internship: t('internship') }; return m[type] || type; };
  const [expanded, setExpanded] = useState(false);

  const scoreColor = score >= 85 ? 'text-green-600 bg-green-50 dark:bg-green-950/30' : score >= 70 ? 'text-primary bg-primary/5' : score >= 50 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-muted-foreground bg-muted';
  const topSkills = job.required_skills.slice(0, 3);
  const remainingSkills = job.required_skills.length - 3;

  return (
    <div className="h-full w-full">
      <Card className="h-full flex flex-col overflow-hidden border shadow-lg rounded-2xl" onClick={onViewDetails}>
        <CardContent className={`flex-1 flex flex-col ${isMobile ? 'p-3 gap-2.5' : 'p-5 gap-3'}`}>
          {/* Header: Company Logo + Verification + Save/Share */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`rounded-xl bg-primary/10 flex items-center justify-center shrink-0 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
                {job.company_logo?<img src={job.company_logo} alt={job.company_name} className="w-full h-full object-contain rounded-xl"/>:<Building2 className={`text-primary ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm leading-tight truncate">{job.company_name}</p>

                </div>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">{job.industry}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" disabled={!canUndo} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onUndo?.(); }} aria-label={t('undo_last_pass')} title={t('undo_last_pass')}>
                <Undo2 className="w-4 h-4 text-muted-foreground rtl:-scale-x-100" />
              </button>
              <button type="button" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-muted transition-colors cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); void shareJob({...job,status:'open'}).then(result=>{if(result==='copied')toast.success(t('link_copied'));}).catch(error=>{if(error?.name!=='AbortError')toast.error(t('try_again'));}); }} aria-label={t('share')}>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Primary Info: Title + Score + Salary */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className={`font-bold font-[Poppins] leading-tight line-clamp-2 flex-1 ${isMobile ? 'text-base' : 'text-lg'}`}>{job.job_title}</h2>
              <div className={`px-2.5 py-1.5 rounded-xl ${scoreColor} shrink-0 text-center`}>
                <p className={`font-bold font-[Poppins] leading-none ${isMobile ? 'text-lg' : 'text-xl'}`}>{score}%</p>
                <p className="text-[8px] opacity-70 leading-tight">{t('match_score')}</p>
              </div>
            </div>
            {compensation && <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-0.5">{compensation}</p>}
          </div>

          {/* Metadata: Location · Type · Experience · Company Size */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="gap-0.5 text-[11px] py-0 px-1.5 h-5"><MapPin className="w-2.5 h-2.5" />{job.city}, {job.country}</Badge>
            <Badge variant="secondary" className="gap-0.5 text-[11px] py-0 px-1.5 h-5"><Briefcase className="w-2.5 h-2.5" />{typeLabel(job.employment_type)}</Badge>
            <Badge variant="secondary" className="gap-0.5 text-[11px] py-0 px-1.5 h-5"><GraduationCap className="w-2.5 h-2.5" />{job.min_experience}-{job.max_experience}y</Badge>
            {job.employment_style&&<Badge variant="secondary" className="text-[11px]">{t(job.employment_style)}</Badge>}
          </div>

          {/* Skills: Top 3 + "+N more" */}
          <div className="flex flex-wrap gap-1">
            {topSkills.map(s => {
              const hasSkill = (completion.draft?.skills||[]).map(sk => sk.toLowerCase()).includes(s.toLowerCase());
              return <Badge key={s} variant={hasSkill ? 'default' : 'outline'} className={`text-[11px] py-0 px-1.5 h-5 ${hasSkill ? '' : 'opacity-60'}`}>{s}{hasSkill && <Check className="w-2 h-2 ms-0.5" />}</Badge>;
            })}
            {remainingSkills > 0 && (
              <Badge variant="outline" className="text-[11px] py-0 px-1.5 h-5 text-primary border-primary/30 font-semibold">+{remainingSkills}</Badge>
            )}
          </div>

          {/* Expandable: Job Description (progressive disclosure) */}
          {!isMobile && (
            <div className="flex-1 overflow-hidden">
              <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                {job.job_description}
              </p>
              {job.job_description.length > 100 && (
                <button
                  className="text-[11px] text-primary font-medium mt-0.5"
                  onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                  {expanded ? t('collapse') : t('read_more')}
                </button>
              )}
            </div>
          )}

          {/* Tap hint on mobile */}
          {isMobile && (
            <div className="flex-1 flex items-end justify-center">
              <p className="text-[10px] text-muted-foreground/60">{t('tap_for_details')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Level 2 — Job Details View (Bottom Sheet content) */
function JobDetailsContent({ job, explanation }: { job: DiscoverJob & { explanation?: MatchExplanation }; explanation: MatchExplanation | null }) {
  const { t,i18n } = useTranslation();
  const compensation=compensationText(job,i18n.language);
  const completion=useMandatoryProfile();

  return (
    <div className="space-y-4">
      {/* Salary */}
      {compensation && <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3"><p className="text-xs font-medium">{t('salary_range')}</p><p className="text-lg font-bold text-green-700 dark:text-green-400">{compensation}</p></div>}
      {job.qualifications&&<div><h4 className="font-semibold text-sm">{i18n.language.startsWith('ar')?'المؤهلات':'Qualifications'}</h4><p className="text-sm whitespace-pre-wrap">{job.qualifications}</p></div>}

      {/* Job Description */}
      <div>
        <h4 className="text-sm font-semibold mb-1.5">{t('job_description')}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{job.job_description}</p>
      </div>

      {/* All Required Skills */}
      <div>
        <h4 className="text-sm font-semibold mb-1.5">{t('required_skills')}</h4>
        <div className="flex flex-wrap gap-1.5">
          {job.required_skills.map(s => {
            const hasSkill = (completion.draft?.skills||[]).map(sk => sk.toLowerCase()).includes(s.toLowerCase());
            return (
              <Badge key={s} variant={hasSkill ? 'default' : 'outline'} className={`text-xs ${hasSkill ? '' : 'opacity-60'}`}>
                {s}{hasSkill && <Check className="w-2.5 h-2.5 ms-0.5" />}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* AI Match Explanation */}
      {explanation && (
        <div className="space-y-2.5">
          <h4 className="text-sm font-semibold">{t('why_recommended')}</h4>
          <div className="bg-primary/5 rounded-xl p-3 space-y-1.5">
            {explanation.topReasons.map((reason, i) => (
              <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <Check className="w-3 h-3 shrink-0 mt-0.5 text-green-600" />{reason}
              </p>
            ))}
          </div>
          <ScoreBreakdown
            items={explanation.factors.filter(f => f.weight >= 0.07).slice(0, 5).map(f => ({
              label: f.name,
              value: f.score,
              weight: f.weight,
            }))}
            layout="auto"
            barSize="sm"
            labelSize="sm"
            animated
            showPercentage
          />
          <ConfidenceIndicator value={explanation.confidence} label={t('ai_confidence')} size="sm" />
        </div>
      )}

      {/* Company Info */}
      <div>
        <h4 className="text-sm font-semibold mb-1.5">{t('company_info')}</h4>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{job.company_name}</p>
            <p className="text-xs text-muted-foreground">{job.industry} · {job.city}, {job.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SwipeView() {
  const { t } = useTranslation();
  const route=useLocation();
  const requestedId=new URLSearchParams(route.search).get('job');
  const isMobile = useIsMobile();
  const accountId = useAuthStore(s => s.userId);
  const engine = useMatchingEngine(accountId || CURRENT_SEEKER.id, 'job_seeker');
  const profileEligibility=useMandatoryProfile();
  const navigate=useNavigate();
  const { balance: creditBalance } = useCreditAccount(accountId);
  const premium=useViaPremium(accountId);
  const [creditsPaused,setCreditsPaused]=useState(false);
  const {jobs,actions,loading:jobsLoading,error:jobsError,refresh:refreshJobs}=useSeekerJobs(creditsPaused);
  const [lastPass,setLastPass]=useState<string|null>(null);
  const [restoredJobId,setRestoredJobId]=useState<string|null>(null);
  const [prefs, setPrefs] = useState(() => loadPreferences(accountId || ''));
  const [swipeBusy, setSwipeBusy] = useState(false);
  const swipeLock = useRef(false);
  useEffect(() => {
    if (!accountId) return;
    const refresh = () => setPrefs(loadPreferences(accountId));
    setPrefs(loadPreferences(accountId));
    let alive=true;
    void apiClient.supabase.from('job_seeker_profiles').select('job_preferences').eq('user_id', accountId).abortSignal(AbortSignal.timeout(10000)).maybeSingle().then(r => { if (alive && useAuthStore.getState().userId===accountId && !r.error && r.data) savePreferences(accountId, migrateLegacyPreferences(r.data.job_preferences||{})); });
    window.addEventListener('matchme:preferences-changed', refresh);
    return () => {alive=false;window.removeEventListener('matchme:preferences-changed', refresh);};
  }, [accountId]);
  const aiMatching = useAIMatching(accountId || '');
  const [showMatch, setShowMatch] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailJobId,setDetailJobId]=useState<string|null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<MatchExplanation | null>(null);

  const { countries } = useCountries();
  const recommendedJobs = useMemo(() => {
    const requested=restoredJobId||requestedId;
    return rankEligibleVacancies(jobs,actions,prefs,requested,countries);
  }, [jobs,actions,prefs,requestedId,restoredJobId,countries]);

  const [handledRequestedId,setHandledRequestedId]=useState<string|null>(null);
  const requestedPreview=isMobile&&requestedId&&requestedId!==handledRequestedId?jobs.find(j=>j.id===requestedId&&isAvailableJob(j)):undefined;
  const requestedDecision=actions.find(a=>a.vacancy_id===requestedPreview?.id)?.direction;
  const currentJob = requestedPreview||recommendedJobs[0];
  const eligiblePass=latestEligiblePass(actions,jobs);
  useEffect(()=>{setLastPass(eligiblePass);setCanUndo(!!eligiblePass);},[eligiblePass]);
  useEffect(()=>{if(requestedId&&currentJob?.id===requestedId){clearPendingSharedJob();nativeBridge()?.postMessage(JSON.stringify({type:'job-opened',jobId:requestedId}));}},[requestedId,currentJob?.id]);
  const linkedJob=jobs.find(j=>j.id===detailJobId);
  const requestedJobExists=jobs.some(j=>j.id===requestedId);
  useEffect(()=>{if(requestedJobExists&&!new URLSearchParams(route.search).has('via_return')){setDetailJobId(requestedId);setShowDetails(true);}},[requestedId,requestedJobExists]);

  const handleSwipe = useCallback(async (dir: 'left' | 'right') => {
    if (!currentJob || !accountId || swipeLock.current) return false;
    if(dir==='right'&&(profileEligibility.error||profileEligibility.percentage!==100)){navigate('/seeker?view=cv&complete=1');return false;}
    swipeLock.current = true; setSwipeBusy(true);
    try {
      await recordJobAction(currentJob.id,dir);
      if(useAuthStore.getState().userId!==accountId)return;
      setHandledRequestedId(requestedId);setRestoredJobId(null);setLastPass(dir==='left'?currentJob.id:null);setCanUndo(dir==='left');setShowDetails(false);
      await refreshJobs();
      toast(dir==='right'?t('interest_recorded'):t('job_skipped'));return true;
    }catch(error){toast.error((error as {message?:string}).message||t('try_again'));return false;}
    finally{swipeLock.current=false;setSwipeBusy(false);}
  }, [currentJob,t,accountId,refreshJobs,requestedId,profileEligibility.error,profileEligibility.percentage,navigate]);

  const handleUndo = useCallback(async () => {
    if(!lastPass||!accountId||swipeLock.current)return;
    swipeLock.current=true;setSwipeBusy(true);
    try{await recordJobAction(lastPass,'undo');if(useAuthStore.getState().userId!==accountId)return;setRestoredJobId(lastPass);setHandledRequestedId(null);await refreshJobs();setLastPass(null);setCanUndo(false);toast.success(t('pass_undone'));}
    catch{toast.error(t('try_again'));}finally{swipeLock.current=false;setSwipeBusy(false);}
  },[lastPass,t,refreshJobs,accountId]);

  const handleSaveJob = useCallback(async () => {
    if(!currentJob||!accountId||swipeLock.current)return;
    swipeLock.current=true;setSwipeBusy(true);
    try{await recordJobAction(currentJob.id,'save');if(useAuthStore.getState().userId!==accountId)return;await refreshJobs();toast.success(t('job_saved'));}
    catch{toast.error(t('try_again'));}finally{swipeLock.current=false;setSwipeBusy(false);}
  },[currentJob,t,refreshJobs,accountId]);

  const handleUndoRef = useRef(handleUndo); handleUndoRef.current = handleUndo;
  const canUndoRef = useRef(canUndo); canUndoRef.current = canUndo;

  // Prepare swipe deck items for the SwipeFeedbackEngine (must be before early return)
  const swipeDeckItems: SwipeCardItem[] = useMemo(() =>
    recommendedJobs.slice(0, 5).map(job => ({ id: job.id, ...job })),
    [recommendedJobs]
  );

  const swipeDeckIndex = useMemo(() => {
    if (!currentJob) return 0;
    const idx = swipeDeckItems.findIndex(item => item.id === currentJob.id);
    return idx >= 0 ? idx : 0;
  }, [currentJob, swipeDeckItems]);

  const renderSwipeCard = useCallback((item: SwipeCardItem, _isActive: boolean) => {
    const job = item as unknown as DiscoverJob;
    return (
      <SwipeCardContent
        job={job}
        score={job.compatibility_score}
        onViewDetails={() => {setDetailJobId(job.id);setShowDetails(true);}}
        onUndo={handleUndoRef.current}
        canUndo={canUndoRef.current}
      />
    );
  }, [canUndo]);

  const handleSwipeFeedback = useCallback((direction: 'left' | 'right', _item: SwipeCardItem) => {
    return handleSwipe(direction);
  }, [handleSwipe]);

  if(isMobile)return <MobileSwipePage onCreditsOpenChange={setCreditsPaused} premium={premium.active} decision={requestedDecision||undefined} onBrowse={()=>setHandledRequestedId(requestedId)} job={currentJob} loading={jobsLoading} error={jobsError} balance={creditBalance} busy={swipeBusy} saved={actions.some(a=>a.vacancy_id===currentJob?.id&&a.saved)} canUndo={canUndo} onPass={()=>handleSwipe('left')} onApply={()=>handleSwipe('right')} onSave={()=>void handleSaveJob()} onUndo={()=>void handleUndo()} onShare={()=>{if(currentJob)void shareJob(currentJob).then(result=>{if(result==='copied')toast.success(t('link_copied'));}).catch(error=>{if(error?.name!=='AbortError')toast.error(t('try_again'));});}} onRetry={()=>void refreshJobs()} unavailable={!!requestedId&&requestedId!==handledRequestedId&&!jobsLoading&&!jobsError&&!jobs.some(j=>j.id===requestedId&&isAvailableJob(j))}/>;
  if(jobsLoading)return <div className="flex-1 p-6" role="status">{t('loading')}</div>;
  if(jobsError)return <div className="flex-1 p-6" role="alert"><p>{t('try_again')}</p><Button onClick={()=>void refreshJobs()}>{t('try_again')}</Button></div>;
  if (!currentJob) return (
    <div className="flex-1 flex items-center justify-center p-8"><BottomSheet open={showDetails&&!!linkedJob} onClose={()=>setShowDetails(false)} title={linkedJob?.job_title||t('discover')}>{linkedJob&&<JobDetailsContent job={linkedJob} explanation={null} />}</BottomSheet><div className="text-center"><Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" /><h3 className="text-lg font-semibold font-[Poppins] mb-2">{t('no_more_jobs')}</h3><p className="text-sm text-muted-foreground mb-4">{t('check_back_later')}</p>
      {canUndo && <Button variant="outline" onClick={handleUndo} className="cursor-pointer gap-2"><Undo2 className="w-4 h-4" />{t('undo_last_pass')}</Button>}
    </div></div>
  );

  // --- Render via DecisionScreenLayout ---
  const headerContent = (
    <div className="flex justify-between items-center">
      <h2 className={`font-bold font-[Poppins] ${isMobile ? 'text-base' : 'text-xl'}`}>{t('discover')}</h2>
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px] gap-0.5 py-0 h-5"><Zap className="w-2.5 h-2.5" />{creditBalance ?? '—'}</Badge>
        <Button size="sm" variant="ghost" onClick={() => setShowPrefs(true)} className="cursor-pointer h-9 px-2 gap-1" aria-label={t('preferences')}><Sliders className="w-4 h-4" /><span className="text-xs">{t('preferences')}</span></Button>
      </div>
    </div>
  );

  const summaryContent = (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      <Badge variant="outline" className="text-[9px] gap-0.5 py-0 px-1 h-4 shrink-0"><TrendingUp className="w-2 h-2" />{actions.filter(a=>a.direction==='right').length}</Badge>
      <Badge variant="outline" className="text-[9px] gap-0.5 py-0 px-1 h-4 shrink-0"><Heart className="w-2 h-2" />{actions.filter(a=>a.saved).length}</Badge>
    </div>
  );

  const cardContent = isMobile ? (
    <SwipeFeedbackEngine
      items={swipeDeckItems}
      activeIndex={swipeDeckIndex}
      renderCard={renderSwipeCard}
      onSwipe={handleSwipeFeedback}
      onTap={() => {setDetailJobId(currentJob.id);setShowDetails(true);}}
      enabled={!swipeBusy && creditBalance !== 0}
      config={{
        threshold: 100,
        maxRotation: 15,
        elasticity: 0.7,
        showStack: true,
        rightLabel: 'swipe_apply',
        leftLabel: 'swipe_pass',
        rightColor: '#16a34a',
        leftColor: '#dc2626',
      }}
    />
  ) : (
    <>
      {recommendedJobs.slice(0, 2).reverse().map((job, i) => (
        <div key={job.id} className="absolute inset-0">
          <SwipeCardContent
            job={job}
            score={job.compatibility_score}
            onViewDetails={() => {setDetailJobId(job.id);setShowDetails(true);}}
          />
        </div>
      ))}
    </>
  );

  const actionsContent = (
    <DecisionActionBar
      onPass={() => void handleSwipe('left')}
      passDisabled={swipeBusy || creditBalance === 0}
      likeDisabled={swipeBusy || (!premium.active && (creditBalance === 0 || creditBalance === null))}
      onSave={handleSaveJob}
      onLike={() => handleSwipe('right')}
      variant={isMobile ? 'default' : 'default'}
    />
  );

  const overlayContent = (
    <>
      {/* Level 2 — Details Bottom Sheet */}
      <BottomSheet open={showPrefs} onClose={() => setShowPrefs(false)} title={t('preferences')}>
        <div className="p-4"><PreferencesForm compact signals={PREF_SIGNALS} onSaved={() => setShowPrefs(false)} /></div>
      </BottomSheet>
      <BottomSheet
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title={linkedJob?.job_title||currentJob.job_title}
      >
        <JobDetailsContent job={linkedJob||currentJob} explanation={currentExplanation} />
      </BottomSheet>

      {/* Match Celebration */}
      {showMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center animate-in fade-in">
          <div className="text-center p-8">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h2 className="text-2xl font-bold text-white font-[Poppins] mb-1">{t('its_a_match')}</h2>
            <p className="text-white/80 text-sm">{t('match_message', { company: currentJob?.company_name })}</p>
            <Button className="mt-3 cursor-pointer" variant="secondary" size="sm" onClick={() => setShowMatch(false)}>{t('send_message')}</Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <DecisionScreenLayout
      header={headerContent}
      summaryChips={summaryContent}
      card={cardContent}
      actions={actionsContent}
      overlay={overlayContent}
    />
  );
}

// ============================================================
// Dashboard
// ============================================================

// Mock profile data for demonstration (in production, this comes from state/API)
function ProfileCompletionSlot({ onNavigate }: { onNavigate: (section: string) => void }) {
  const data = useMockProfileData();
  return <ProfileCompletionMini profileData={data} onNavigateToSection={onNavigate} />;
}

function useMockProfileData(): ProfileData {
  return {
    hasBasicInfo: true,
    hasPhoto: false,
    hasHeadline: true,
    hasAboutMe: true,
    hasLocation: true,
    hasPhone: true,
    hasVerifiedEmail: true,
    hasResume: true,
    experienceCount: 2,
    educationCount: 1,
    skillsCount: 5,
    languagesCount: 3,
    certificatesCount: 2,
    portfolioCount: 2,
    hasJobPreferences: true,
    hasSalaryExpectations: true,
    hasAvailability: true,
    headlineLength: 50,
    aboutMeLength: 150,
    avgExperienceDescLength: 60,
  };
}

function DashboardView({ onNavigateToSection }: { onNavigateToSection?: (section: string) => void }) {
  return <LegacyDashboard onNavigateToSection={section=>onNavigateToSection?.(section)} />;
}

// ============================================================
// Skills (Full CRUD)
// ============================================================

function SkillsView() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form, setForm] = useState<{ name: string; level: string; years: number }>({ name: '', level: 'intermediate', years: 1 });

  const levelColor = (l: string) => { switch(l) { case 'expert': return 'text-green-600'; case 'advanced': return 'text-primary'; case 'intermediate': return 'text-accent'; default: return 'text-muted-foreground'; } };

  const openAdd = () => {
    setEditingSkill(null);
    setForm({ name: '', level: 'intermediate', years: 1 });
    setDialogOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setForm({ name: skill.name, level: skill.level, years: skill.years });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast.error(t('fill_all_fields'));
      return;
    }
    if (editingSkill) {
      setSkills(prev => prev.map(s => s.id === editingSkill.id ? { ...s, ...form } : s));
      toast.success(t('skill_updated'));
    } else {
      setSkills(prev => [...prev, { id: Date.now().toString(), ...form, endorsed: 0 }]);
      toast.success(t('skill_added'));
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    toast.success(t('skill_deleted'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('skills')}</h2><Button className="cursor-pointer gap-2" onClick={openAdd}><Plus className="w-4 h-4" />{t('add_skill')}</Button></div>
      <div className="max-w-2xl space-y-3">
        {skills.map(skill => (
          <Card key={skill.id}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="font-medium">{skill.name}</p><p className="text-xs text-muted-foreground">{skill.years} {t('years_exp')} · {skill.endorsed} {t('endorsements')}</p></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className={`text-xs ${levelColor(skill.level)}`}>{t(skill.level)}</Badge><Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => openEdit(skill)}><Edit className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={() => handleDelete(skill.id)}><Trash2 className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
        {skills.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_skills_yet')}</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-[Poppins]">{editingSkill ? t('edit_skill') : t('add_skill')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('skill_name')}</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1" placeholder="React, Python, etc." /></div>
            <div><Label>{t('proficiency_level')}</Label>
              <Select value={form.level} onValueChange={(v) => setForm({...form, level: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="beginner">{t('beginner')}</SelectItem><SelectItem value="intermediate">{t('intermediate')}</SelectItem><SelectItem value="advanced">{t('advanced')}</SelectItem><SelectItem value="expert">{t('expert')}</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>{t('years_of_experience')}</Label><Input type="number" min={0} value={form.years} onChange={(e) => setForm({...form, years: parseInt(e.target.value) || 0})} className="mt-1" /></div>
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
// Portfolio (Full CRUD)
// ============================================================

function PortfolioView() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<PortfolioItem[]>(initialPortfolio);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState<{ title: string; desc: string; url: string }>({ title: '', desc: '', url: '' });

  const openAdd = () => {
    setEditingProject(null);
    setForm({ title: '', desc: '', url: '' });
    setDialogOpen(true);
  };

  const openEdit = (project: PortfolioItem) => {
    setEditingProject(project);
    setForm({ title: project.title, desc: project.desc, url: project.url });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.desc) {
      toast.error(t('fill_all_fields'));
      return;
    }
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...form } : p));
      toast.success(t('project_updated'));
    } else {
      setProjects(prev => [...prev, { id: Date.now().toString(), ...form }]);
      toast.success(t('project_added'));
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success(t('project_deleted'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('portfolio')}</h2><Button className="cursor-pointer gap-2" onClick={openAdd}><Plus className="w-4 h-4" />{t('add_project')}</Button></div>
      <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-smooth"><CardContent className="p-4">
            <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center"><Layers className="w-8 h-8 text-muted-foreground/30" /></div>
            <p className="font-semibold text-sm">{p.title}</p>
            <p className="text-xs text-muted-foreground mb-2">{p.desc}</p>
            <div className="flex gap-2">
              {p.url && <Button size="sm" variant="outline" className="cursor-pointer gap-1 text-xs" onClick={() => window.open(p.url, '_blank')}><ExternalLink className="w-3 h-3" />{t('view_project')}</Button>}
              <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => openEdit(p)}><Edit className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
      {projects.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_projects_yet')}</p>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-[Poppins]">{editingProject ? t('edit_project') : t('add_project')}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>{t('project_title')}</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="mt-1" /></div>
            <div><Label>{t('description')}</Label><Textarea value={form.desc} onChange={(e) => setForm({...form, desc: e.target.value})} className="mt-1" rows={3} /></div>
            <div><Label>{t('project_url')}</Label><Input value={form.url} onChange={(e) => setForm({...form, url: e.target.value})} className="mt-1" placeholder="https://..." /></div>
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
// Video Introduction
// ============================================================

function VideoIntroView() {
  const { t } = useTranslation();
  const [hasVideo, setHasVideo] = useState(false);

  const handleUpload = () => {
    setHasVideo(true);
    toast.success(t('video_uploaded'));
  };

  const handleDelete = () => {
    setHasVideo(false);
    toast.success(t('video_deleted'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('video_intro')}</h2>
      <div className="max-w-2xl">
        {!hasVideo ? (
          <Card className="border-dashed border-2 mb-4"><CardContent className="p-8 text-center">
            <Video className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-medium mb-1">{t('upload_video')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('video_hint')}</p>
            <Button className="cursor-pointer gap-2" onClick={handleUpload}><Upload className="w-4 h-4" />{t('upload')}</Button>
          </CardContent></Card>
        ) : (
          <Card className="mb-4"><CardContent className="p-4">
            <div className="w-full h-48 bg-muted rounded-lg mb-3 flex items-center justify-center"><Video className="w-12 h-12 text-primary" /></div>
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-sm">{t('video_intro')}</p><p className="text-xs text-muted-foreground">1:30 · {t('uploaded')} Jul 15, 2026</p></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="cursor-pointer" onClick={handleUpload}>{t('replace')}</Button>
                <Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent></Card>
        )}
        <Card><CardContent className="p-4">
          <h3 className="font-medium text-sm mb-2">{t('video_tips_title')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{t('video_tip_1')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{t('video_tip_2')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{t('video_tip_3')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />{t('video_tip_4')}</li>
          </ul>
        </CardContent></Card>
      </div>
    </div>
  );
}

// ============================================================
// Preferences
// ============================================================

const PREF_SIGNALS = { skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'PostgreSQL'], titles: ['Frontend Developer'], fields: ['Computer Science'] };

function PreferencesView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('preferences')}</h2>
      <div className="max-w-2xl"><PreferencesForm signals={PREF_SIGNALS} /></div>
    </div>
  );
}

// ============================================================
// Saved Jobs
// ============================================================

function SavedJobsView() {
  const { t } = useTranslation();
  const navigate=useNavigate();
  const {jobs,actions,loading,error,refresh}=useSeekerJobs();
  const savedJobs=actions.filter(a=>a.saved).flatMap(a=>{const j=jobs.find(j=>j.id===a.vacancy_id);return j?[{id:j.id,title:j.job_title,company:j.company_name,location:`${j.city}, ${j.country}`,salary:j.salary_min?`${j.salary_min}–${j.salary_max}`:'',status:j.status}]:[];});
  const handleRemove = async (id: string) => {
    try{await recordJobAction(id,'unsave');toast.success(t('job_removed'));}catch{toast.error(t('try_again'));}
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('saved_jobs')}</h2>
      {loading&&<p role="status">{t('loading')}</p>}{error&&<Button onClick={()=>void refresh()}>{t('try_again')}</Button>}
      <div className="space-y-3">
        {savedJobs.map(job => (
          <Card key={job.id}><CardContent className="p-4 flex items-center justify-between" onClick={()=>navigate(`/seeker?view=swipe&job=${job.id}`)}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{job.title}</p><p className="text-xs text-muted-foreground">{job.company} · {job.location} · {job.salary}</p></div></div>
            <div className="flex items-center gap-2"><Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-xs">{t(job.status)}</Badge><Button size="sm" variant="ghost" className="cursor-pointer text-destructive" onClick={(event) => {event.stopPropagation();void handleRemove(job.id);}}><Trash2 className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
        {savedJobs.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_saved_jobs')}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Applications
// ============================================================

function ApplicationsView() {
  const { t, i18n } = useTranslation();
  const {jobs,actions,loading,error,refresh}=useSeekerJobs();
  const applications=actions.filter(a=>a.application_status!==null).flatMap(a=>{const j=jobs.find(j=>j.id===a.vacancy_id);return j?[{id:j.id,title:j.job_title,company:j.company_name,appliedDate:a.applied_at?new Date(a.applied_at).toLocaleDateString(i18n.language):i18n.language.startsWith('ar')?'التاريخ غير مسجل':'Date not recorded',status:applicationStatus(a)||'unknown'}]:[];});
  const statusColor = (s: string) => { switch(s) { case 'interview': return 'default'; case 'reviewed': return 'secondary'; case 'pending': return 'outline'; case 'rejected': return 'destructive'; default: return 'secondary'; } };

  const handleWithdraw = async (id: string) => {
    try{await recordJobAction(id,'withdraw');toast.success(t('application_withdrawn'));}catch{toast.error(t('try_again'));}
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('applications')}</h2>
      {loading&&<p role="status">{t('loading')}</p>}{error&&<Button onClick={()=>void refresh()}>{t('try_again')}</Button>}
      <div className="space-y-3">
        {applications.map(app => (
          <Card key={app.id}><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{app.title}</p><p className="text-xs text-muted-foreground">{app.company} · {t('applied')}: {app.appliedDate}</p></div></div>
            <div className="flex items-center gap-2">
              <Badge variant={statusColor(app.status) as any} className="text-xs">{recruitmentLabel(app.status,i18n.language)}</Badge>
              {!['withdrawn','rejected','hired'].includes(app.status) && <Button size="sm" variant="ghost" className="cursor-pointer text-destructive text-xs" onClick={() => handleWithdraw(app.id)}>{t('withdraw')}</Button>}
            </div>
          </CardContent></Card>
        ))}
        {applications.length === 0 && <p className="text-center text-muted-foreground py-8">{t('no_applications')}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Matches
// ============================================================

function MatchesView() {
  const {t}=useTranslation();const navigate=useNavigate();
  const {jobs,actions,loading,error,refresh}=useSeekerJobs();
  const matches=actions.filter(a=>a.direction==='right'&&a.application_status==='pending'&&['accepted','offer_received','hired'].includes(a.company_status||'')).flatMap(a=>{const job=jobs.find(j=>j.id===a.vacancy_id);return job?[{job,status:a.company_status}]:[];});
  return <div className="flex-1 p-4 sm:p-6 overflow-y-auto"><h2 className="text-xl font-bold mb-6">{t('matches')}</h2>{loading?<p role="status">{t('loading')}</p>:error?<Button onClick={()=>void refresh()}>{t('try_again')}</Button>:<div className="space-y-3">{matches.map(({job,status})=><Card key={job.id}><CardContent className="p-4 flex justify-between gap-3"><div><p className="font-semibold">{job.job_title}</p><p className="text-sm text-muted-foreground">{job.company_name}</p><Badge variant="outline">{t(status||'accepted')}</Badge></div><Button onClick={()=>navigate('/messages')}>{t('messages')}</Button></CardContent></Card>)}{!matches.length&&<p className="text-muted-foreground">{t('no_matches_yet')}</p>}</div>}</div>;
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

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success(t('notification_deleted'));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('notifications')}</h2><Button variant="ghost" size="sm" className="cursor-pointer" onClick={markAllRead}>{t('mark_all_read')}</Button></div>
      <div className="space-y-2">
        {notifications.map(n => (
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
// Settings
// ============================================================

function SettingsView({ seekerTier }: { seekerTier?: SeekerTier }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    emailMatches: true, emailApps: true, emailMessages: true, push: true,
    showPublic: true, allowDM: true, showOnline: true,
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
          <div className="flex items-center justify-between"><Label>{t('email_new_matches')}</Label><Switch checked={settings.emailMatches} onCheckedChange={(v) => setSettings({...settings, emailMatches: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('email_new_applications')}</Label><Switch checked={settings.emailApps} onCheckedChange={(v) => setSettings({...settings, emailApps: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('email_messages')}</Label><Switch checked={settings.emailMessages} onCheckedChange={(v) => setSettings({...settings, emailMessages: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('push_notifications')}</Label><Switch checked={settings.push} onCheckedChange={(v) => setSettings({...settings, push: v})} /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('privacy_settings')}</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>{t('show_profile_public')}</Label><Switch checked={settings.showPublic} onCheckedChange={(v) => setSettings({...settings, showPublic: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('allow_direct_messages')}</Label><Switch checked={settings.allowDM} onCheckedChange={(v) => setSettings({...settings, allowDM: v})} /></div>
          <div className="flex items-center justify-between"><Label>{t('show_online_status')}</Label><Switch checked={settings.showOnline} onCheckedChange={(v) => setSettings({...settings, showOnline: v})} /></div>
        </CardContent></Card>
        {/* Discoverability Notification Preferences */}
        {seekerTier && <DiscoverabilityNotifications tier={seekerTier} />}
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
// Main Component
// ============================================================

export default function JobSeeker() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location=useLocation();
  useEffect(()=>{const id=new URLSearchParams(location.search).get('job');if(id)rememberSharedJob(id);},[location.search]);
  const activeTab = seekerSection(location.pathname, location.search) as NavSection;
  const setActiveTab = (section: NavSection) => navigate(seekerSectionUrl(section));
  const [unreadMessages,setUnreadMessages] = useState<number|null>(null);
  const isMobile = useIsMobile();
  const messageUserId = useAuthStore(s=>s.userId);
  useEffect(()=>{
    if(!isMobile || activeTab!=='dashboard' || !messageUserId)return;
    let alive=true;
    const refresh=async()=>{
      try {
        const result=await messageService.getUnreadCount(messageUserId);
        if(alive && useAuthStore.getState().userId===messageUserId)setUnreadMessages(result.error?null:accurateBadgeCount(result.data));
      } catch { if(alive)setUnreadMessages(null); }
    };
    setUnreadMessages(null);void refresh();
    const timer=setInterval(()=>void refresh(),30000);
    window.addEventListener('focus',refresh);
    return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[isMobile,activeTab,messageUserId]);

  // Simulated seeker tier - in production this comes from subscription state
  const seekerTier: SeekerTier = 'premium';

  // Navigation Reliability: Intercept 'messages' tab at all entry points
  // If activeTab is ever set to 'messages' (from sidebar or any source), navigate immediately
  useEffect(() => {
    if (activeTab === 'messages') {
      navigate('/messages');
    }
  }, [activeTab, navigate]);

  // Onboarding Guard: the SHARED authority decides — this component no longer
  // re-derives the completion state on its own.
  //
  // The previous version read `onboarding_completed`, back-filled legacy
  // accounts, otherwise redirected. That duplicated a decision the onboarding
  // journey also makes from its LOCAL mirror, and the two sources could
  // disagree permanently. An account with no `user_profiles` row — exactly the
  // state left behind by the earlier signup defect — makes `completeOnboarding`
  // an UPDATE that matches ZERO rows while still reporting success, so the
  // mirror said "complete" and this guard said "not complete":
  //
  //     /seeker  (guard: not complete) -> /seeker/onboarding
  //     /seeker/onboarding (mirror: complete) -> /seeker ... forever, one
  //     full-screen loader per hop.
  //
  // That is why "Get started" and "Dashboard" looked like they never loaded for
  // these accounts. `ensureJobSeekerInitialized` repairs the account rows and
  // returns the matching destination, so whichever screen reads the flag agrees
  // with the one that wrote it.
  //
  // Hard rule: NEVER hang and NEVER loop.
  //   - decisive "incomplete" -> onboarding (the journey resumes at the user's
  //     first unfinished step);
  //   - anything inconclusive (offline, slow, no session) -> release the
  //     dashboard, because redirecting on an unknown state is what creates
  //     loops. The watchdog stays as a last-resort guarantee that this loader
  //     always ends.
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const { userId } = useAuthStore();
  useEffect(() => {
    if (!userId || onboardingChecked) return;
    let alive = true;
    // Hard ceiling for the guard (ms). The authority already bounds each of its
    // own network steps, so this is a backstop rather than the mechanism.
    const ONBOARDING_GUARD_TIMEOUT_MS = 6000;
    const settle = () => {
      if (alive) setOnboardingChecked(true);
    };
    const watchdog = setTimeout(() => {
      logger.warn(
        `[OnboardingGuard] Initialization exceeded ${ONBOARDING_GUARD_TIMEOUT_MS}ms; releasing the dashboard.`
      );
      settle();
    }, ONBOARDING_GUARD_TIMEOUT_MS);
    (async () => {
      try {
        const init = await ensureJobSeekerInitialized(userId);
        if (!alive) return;
        if (init.ready && init.needsOnboarding) {
          navigate(init.destination, { replace: true });
          return;
        }
        settle();
      } catch {
        // Never block the dashboard on a guard failure.
        settle();
      } finally {
        clearTimeout(watchdog);
      }
    })();
    return () => { alive = false; clearTimeout(watchdog); };
  }, [userId, onboardingChecked, navigate]);

  // Three primary destinations; Messages is reached from Dashboard.
  const handleMobileTabChange = (tab: MobileNavTab) => setActiveTab(tab as NavSection);
  const showAccountCenter = true;

  // Hold the dashboard until the onboarding guard has resolved (avoids a content flash).
  if (!onboardingChecked) {
    return (
      <div
        data-loader-id="job-seeker-route-guard"
        data-loader-kind="fullscreen"
        className="min-h-[100dvh] flex items-center justify-center bg-background"
      >
        <div className="h-10 w-10 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    // On mobile, dashboard tab shows MobileDashboard instead of desktop DashboardView
    if (isMobile && activeTab === 'dashboard') {
      return <MobileDashboard key={messageUserId || 'guest'} unreadMessages={unreadMessages} onNavigateToSection={(section) => setActiveTab(section as NavSection)} />;
    }

    if (isMobile && MOBILE_ACCOUNT_SECTIONS.includes(activeTab)) {
      return <MobileProfileAccount section={activeTab}/>;
    }
    if (isMobile && activeTab === 'settings') return <MobileProfileAccount section="account_settings"/>;

    switch(activeTab) {
      case 'personal': return <PersonalInformationPage/>;
      case 'swipe': return <SwipeView />;
      case 'dashboard': return <DashboardView onNavigateToSection={(section) => setActiveTab(section as NavSection)} />;
      case 'profile': case 'cv': return <ProfileView onOpenPreferences={() => { trackEvent('preferences_opened', { from: 'profile' }); setActiveTab('preferences'); }} completion={<ProfileCompletionSlot onNavigate={(section) => setActiveTab(section as NavSection)} />} />;
            case 'experience': return <ExperienceView />;
      case 'education': case 'certificates': return <EducationView />;
      case 'skills': return <SkillsView />;
      case 'languages': return <LanguagesView />;
      case 'portfolio': return <PortfolioView />;
      case 'video': return <VideoIntroView />;
      case 'preferences': return isMobile?<MobileSwipePreferences/>:<PreferencesView />;
      case 'saved': return <SavedJobsView />;
      case 'applications': return <ApplicationsView />;
      case 'matches': return <MatchesView />;
      case 'messages': return null; // Handled by useEffect — navigates to /messages
      case 'notifications': return <NotificationsView />;
      case 'settings': return <SettingsView seekerTier={seekerTier} />;
      case 'visibility': return <ProfileVisibilitySettings tier={seekerTier} />;
      case 'exposure': return <ExposureDashboard tier={seekerTier} />;
      case 'contact_requests': return <ContactRequestsView tier={seekerTier} />;
      case 'who_viewed': return <RecruiterVisibilityView tier={seekerTier} />;
      case 'invitations': return <SeekerInvitationsView />;
      default: return <SwipeView />;
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-64 border-e border-border flex-col bg-sidebar-background">
        <SeekerNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Main content area — pb accounts for fixed MobileBottomNav on mobile */}
      <main className="flex-1 flex flex-col min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {isMobile && !['dashboard','swipe','preferences'].includes(activeTab) && !(activeTab==='profile' && showAccountCenter) && <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0"><BackButton fallbackRoute={seekerSectionUrl(['applications','matches','saved'].includes(activeTab)?'dashboard':'profile')} /></div>}
        {renderContent()}
      </main>

      {/* Mobile bottom navigation - visible only on mobile (< md) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={tab=>{if(activeTab==='preferences'&&!window.dispatchEvent(new Event('matchme:before-preferences-leave',{cancelable:true})))return;handleMobileTabChange(tab);}}
      />
    </div>
  );
}