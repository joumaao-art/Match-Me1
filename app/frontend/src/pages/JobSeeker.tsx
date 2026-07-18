import { useState, useCallback, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/App';
import { changeLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  Sparkles, Home, Heart, MessageSquare, Bookmark, Settings, LogOut,
  Globe, Moon, Sun, Building2, MapPin, Briefcase, GraduationCap, X, Check,
  ChevronRight, User, BarChart3, CreditCard, Bell, FileText, Award,
  Languages, Video, Sliders, Clock, Plus, Edit, Trash2, Upload,
  ExternalLink, Star, Eye, Calendar, Download, Link2, Layers, Undo2,
  TrendingUp, Zap, Target, Weight
} from 'lucide-react';
import { useMatchingEngine } from '@/lib/useMatchingEngine';
import { SeekerProfile, VacancyProfile, DEFAULT_WEIGHTS } from '@/lib/matching-engine';
import { useAIMatching } from '@/lib/useAIMatching';
import { SeekerAIProfile, VacancyAIProfile, MatchExplanation } from '@/lib/ai-matching-engine';

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

const mockExperience = [
  { id: '1', company: 'StartupX', title: 'Frontend Developer', type: 'Full-time', from: '2023-01', to: '2026-07', current: true, description: 'Building modern web applications with React and TypeScript.' },
  { id: '2', company: 'WebAgency', title: 'Junior Developer', type: 'Full-time', from: '2021-06', to: '2023-01', current: false, description: 'Developed responsive websites and e-commerce platforms.' },
];

const mockEducation = [
  { id: '1', institution: 'University of Dubai', degree: "Bachelor's", field: 'Computer Science', from: '2017', to: '2021', grade: '3.8 GPA' },
];

const mockCertificates = [
  { id: '1', name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: '2025-03', expiry: '2028-03', verified: true },
  { id: '2', name: 'React Advanced Patterns', issuer: 'Frontend Masters', date: '2024-11', expiry: null, verified: true },
];

const mockSkills = [
  { id: '1', name: 'React', level: 'expert', years: 4, endorsed: 12 },
  { id: '2', name: 'TypeScript', level: 'advanced', years: 3, endorsed: 8 },
  { id: '3', name: 'Node.js', level: 'advanced', years: 3, endorsed: 6 },
  { id: '4', name: 'Tailwind CSS', level: 'expert', years: 3, endorsed: 5 },
  { id: '5', name: 'PostgreSQL', level: 'intermediate', years: 2, endorsed: 3 },
];

const mockLanguages = [
  { id: '1', name: 'Arabic', level: 'native' },
  { id: '2', name: 'English', level: 'advanced' },
  { id: '3', name: 'French', level: 'intermediate' },
];

// ============================================================
// Navigation
// ============================================================

type NavSection = 'swipe' | 'dashboard' | 'profile' | 'cv' | 'experience' | 'education' | 'certificates' | 'skills' | 'languages' | 'portfolio' | 'video' | 'preferences' | 'saved' | 'applications' | 'matches' | 'messages' | 'notifications' | 'settings';

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
      { id: 'cv' as NavSection, icon: FileText, label: t('my_resume') },
      { id: 'experience' as NavSection, icon: Briefcase, label: t('experience') },
      { id: 'education' as NavSection, icon: GraduationCap, label: t('education') },
      { id: 'certificates' as NavSection, icon: Award, label: t('certificates') },
      { id: 'skills' as NavSection, icon: Star, label: t('skills') },
      { id: 'languages' as NavSection, icon: Languages, label: t('languages') },
      { id: 'portfolio' as NavSection, icon: Layers, label: t('portfolio') },
      { id: 'video' as NavSection, icon: Video, label: t('video_intro') },
    ]},
    { items: [
      { id: 'preferences' as NavSection, icon: Sliders, label: t('preferences') },
      { id: 'saved' as NavSection, icon: Bookmark, label: t('saved_jobs') },
      { id: 'applications' as NavSection, icon: FileText, label: t('applications') },
      { id: 'matches' as NavSection, icon: Sparkles, label: t('matches') },
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
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary-foreground" /></div>
          <span className="text-lg font-bold font-[Poppins]">{t('app_name')}</span>
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
// Swipe View (with Matching Engine)
// ============================================================

function SwipeCard({ job, score, onSwipe }: { job: typeof mockJobs[0]; score: number; onSwipe: (dir: 'left' | 'right') => void }) {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const leftIndicatorOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);
  const handleDragEnd = (_: any, info: PanInfo) => { if (info.offset.x > 100) onSwipe('right'); else if (info.offset.x < -100) onSwipe('left'); };
  const typeLabel = (type: string) => { const m: Record<string, string> = { full_time: t('full_time'), part_time: t('part_time'), contract: t('contract'), remote: t('remote'), internship: t('internship') }; return m[type] || type; };

  const scoreColor = score >= 85 ? 'text-green-600' : score >= 70 ? 'text-primary' : score >= 50 ? 'text-amber-600' : 'text-muted-foreground';

  return (
    <motion.div className="absolute inset-0 cursor-grab active:cursor-grabbing" style={{ x, rotate, opacity }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.7} onDragEnd={handleDragEnd}>
      {/* Swipe direction indicators */}
      <motion.div className="absolute top-6 start-6 z-10 px-3 py-1 rounded-lg border-2 border-destructive text-destructive font-bold rotate-[-12deg]" style={{ opacity: leftIndicatorOpacity }}>{t('reject')}</motion.div>
      <motion.div className="absolute top-6 end-6 z-10 px-3 py-1 rounded-lg border-2 border-green-500 text-green-500 font-bold rotate-[12deg]" style={{ opacity: rightIndicatorOpacity }}>{t('interested')}</motion.div>

      <Card className="h-full flex flex-col overflow-hidden border-2"><CardContent className="flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="w-7 h-7 text-primary" /></div><div><h3 className="font-semibold font-[Poppins]">{job.company_name}</h3><p className="text-sm text-muted-foreground">{job.industry}</p></div></div>
          <div className="text-end">
            <div className={`text-2xl font-bold font-[Poppins] ${scoreColor}`}>{score}%</div>
            <p className="text-xs text-muted-foreground">{t('match_score')}</p>
            <div className="flex items-center gap-0.5 mt-1 justify-end">{[...Array(5)].map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < Math.round(score / 20) ? 'bg-primary' : 'bg-muted'}`} />)}</div>
          </div>
        </div>
        <h2 className="text-xl font-bold font-[Poppins] mb-3">{job.job_title}</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" />{job.city}, {job.country}</Badge>
          <Badge variant="secondary" className="gap-1"><Briefcase className="w-3 h-3" />{typeLabel(job.employment_type)}</Badge>
          <Badge variant="secondary" className="gap-1"><GraduationCap className="w-3 h-3" />{job.min_experience}-{job.max_experience} {t('years_exp')}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 flex-1">{job.job_description}</p>
        <div className="mb-4"><p className="text-xs font-medium text-muted-foreground mb-2">{t('required_skills')}</p><div className="flex flex-wrap gap-1.5">{job.required_skills.map(s => {
          const hasSkill = CURRENT_SEEKER.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase());
          return <Badge key={s} variant={hasSkill ? 'default' : 'outline'} className={`text-xs ${hasSkill ? '' : 'opacity-60'}`}>{s}{hasSkill && <Check className="w-2.5 h-2.5 ms-0.5" />}</Badge>;
        })}</div></div>
        {job.salary_min && <div className="bg-muted/50 rounded-lg p-3 text-center"><p className="text-sm font-medium">${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()} {t('per_month')}</p></div>}
      </CardContent></Card>
    </motion.div>
  );
}

function MatchExplanationPanel({ explanation }: { explanation: MatchExplanation }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 mt-3">
      {/* Top Reasons */}
      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
        <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">{t('why_recommended')}</p>
        {explanation.topReasons.map((reason, i) => (
          <p key={i} className="text-xs text-green-700 dark:text-green-400 flex items-start gap-1"><Check className="w-3 h-3 shrink-0 mt-0.5" />{reason}</p>
        ))}
      </div>
      {/* Factor bars */}
      <div className="space-y-1.5">
        {explanation.factors.filter(f => f.weight >= 0.07).slice(0, 5).map((f) => (
          <div key={f.name} className="flex items-center gap-2">
            <span className="text-[10px] w-16 shrink-0 text-muted-foreground">{f.name}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${f.score * 100}%` }} /></div>
            <span className="text-[10px] w-7 text-end font-medium">{Math.round(f.score * 100)}%</span>
          </div>
        ))}
      </div>
      {/* Confidence */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{t('ai_confidence')}: {Math.round(explanation.confidence * 100)}%</span>
        {explanation.improvementTips.length > 0 && <span className="text-amber-600">{t('tip')}: {explanation.improvementTips[0]}</span>}
      </div>
    </div>
  );
}

function SwipeView() {
  const { t } = useTranslation();
  const engine = useMatchingEngine(CURRENT_SEEKER.id, 'job_seeker');
  const aiMatching = useAIMatching(CURRENT_SEEKER.id);
  const [showMatch, setShowMatch] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<MatchExplanation | null>(null);

  // Get AI-recommended jobs sorted by score
  const recommendedJobs = useMemo(() => {
    const recommendations = aiMatching.getRecommendations(AI_SEEKER, AI_VACANCIES);
    return recommendations.map(r => {
      const job = mockJobs.find(j => j.id === r.vacancy.id)!;
      return { ...job, compatibility_score: r.explanation.overallScore, explanation: r.explanation };
    }).filter(j => !engine.hasSwipedOn(j.id));
  }, [engine.swipeHistory.length]);

  const currentJob = recommendedJobs[0];

  // Calculate explanation for current job
  useMemo(() => {
    if (currentJob) {
      const vacancy = AI_VACANCIES.find(v => v.id === currentJob.id);
      if (vacancy) {
        setCurrentExplanation(aiMatching.calculateMatch(AI_SEEKER, vacancy));
      }
    }
  }, [currentJob?.id]);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    if (!currentJob) return;

    // Record interaction for AI learning
    const matchContext = currentExplanation ? {
      skillMatch: currentExplanation.factors.find(f => f.name === 'Skills')?.score || 0,
      locationMatch: currentExplanation.factors.find(f => f.name === 'Location')?.score || 0,
      salaryMatch: currentExplanation.factors.find(f => f.name === 'Salary')?.score || 0,
      remoteMatch: currentExplanation.factors.find(f => f.name === 'Remote/Hybrid/Office')?.score || 0,
      overallScore: currentExplanation.overallScore,
    } : {};

    aiMatching.recordInteraction({
      userId: CURRENT_SEEKER.id,
      targetId: currentJob.id,
      action: dir === 'right' ? 'swipe_right' : 'swipe_left',
      context: matchContext,
    });

    const result = engine.swipe(currentJob.id, 'company', dir, currentJob.id);
    setCanUndo(true);
    setShowExplanation(false);

    if (dir === 'right' && result?.match) {
      setShowMatch(true);
      setTimeout(() => setShowMatch(false), 2500);
      toast.success(t('its_a_match'));
    } else if (dir === 'right') {
      if (Math.random() > 0.5) {
        setTimeout(() => { engine.swipe(currentJob.id, 'company', 'right'); }, 500);
      }
      toast(t('interest_recorded'));
    } else {
      toast(t('job_skipped'));
    }
  }, [currentJob, engine, aiMatching, currentExplanation, t]);

  const handleUndo = useCallback(() => {
    const undone = engine.undoLastSwipe();
    if (undone) { setCanUndo(false); toast.success(t('swipe_undone')); }
  }, [engine, t]);

  if (!currentJob) return (
    <div className="flex-1 flex items-center justify-center p-8"><div className="text-center"><Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" /><h3 className="text-lg font-semibold font-[Poppins] mb-2">{t('no_more_jobs')}</h3><p className="text-sm text-muted-foreground mb-4">{t('check_back_later')}</p>
      {canUndo && <Button variant="outline" onClick={handleUndo} className="cursor-pointer gap-2"><Undo2 className="w-4 h-4" />{t('undo_last_swipe')}</Button>}
    </div></div>
  );

  return (
    <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-[Poppins]">{t('discover')}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1"><Zap className="w-3 h-3" />{recommendedJobs.length} {t('remaining')}</Badge>
          {canUndo && <Button size="sm" variant="ghost" onClick={handleUndo} className="cursor-pointer gap-1 text-xs"><Undo2 className="w-3 h-3" />{t('undo')}</Button>}
        </div>
      </div>

      {/* AI Learning stats */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary" />{t('ai_powered')}</span>
        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{t('match_rate')}: {engine.stats.matchRate}%</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{engine.stats.rightSwipes} {t('liked')}</span>
        {aiMatching.learningStats?.isPersonalized && <Badge variant="outline" className="text-[10px] gap-0.5"><Target className="w-2.5 h-2.5" />{t('personalized')}</Badge>}
      </div>

      <div className="flex-1 relative min-h-[450px]">
        {recommendedJobs.slice(0, 2).reverse().map((job, i) => (
          <SwipeCard key={job.id} job={job} score={job.compatibility_score} onSwipe={i === Math.min(recommendedJobs.length, 2) - 1 ? handleSwipe : () => {}} />
        ))}
      </div>

      {/* AI Explanation toggle */}
      {currentExplanation && (
        <div className="mt-2">
          <Button variant="ghost" size="sm" className="cursor-pointer w-full text-xs gap-1" onClick={() => setShowExplanation(!showExplanation)}>
            <Sparkles className="w-3 h-3" />{showExplanation ? t('hide_explanation') : t('why_this_match')}
          </Button>
          {showExplanation && <MatchExplanationPanel explanation={currentExplanation} />}
        </div>
      )}

      <div className="flex justify-center items-center gap-4 mt-3 pb-4">
        <Button size="lg" variant="outline" className="w-14 h-14 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer" onClick={() => handleSwipe('left')}><X className="w-6 h-6" /></Button>
        {canUndo && <Button size="lg" variant="outline" className="w-12 h-12 rounded-full cursor-pointer" onClick={handleUndo}><Undo2 className="w-5 h-5" /></Button>}
        <Button size="lg" className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white cursor-pointer" onClick={() => handleSwipe('right')}><Check className="w-6 h-6" /></Button>
      </div>

      {showMatch && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center animate-in fade-in"><div className="text-center p-8"><div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4"><Heart className="w-12 h-12 text-white fill-white" /></div><h2 className="text-3xl font-bold text-white font-[Poppins] mb-2">{t('its_a_match')}</h2><p className="text-white/80">{t('match_message', { company: currentJob?.company_name })}</p><Button className="mt-4 cursor-pointer" variant="secondary" onClick={() => setShowMatch(false)}>{t('send_message')}</Button></div></div>}
    </div>
  );
}

// ============================================================
// Dashboard
// ============================================================

function DashboardView() {
  const { t } = useTranslation();
  const stats = [
    { label: t('matched_jobs'), value: '12', color: 'text-primary' },
    { label: t('applications'), value: '28', color: 'text-accent' },
    { label: t('interviews'), value: '3', color: 'text-green-600' },
    { label: t('profile_views'), value: '89', color: 'text-purple-600' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('dashboard')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4 text-center"><p className={`text-2xl font-bold font-[Poppins] ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-1">{s.label}</p></CardContent></Card>)}
      </div>
      <Card className="mb-6"><CardContent className="p-4"><div className="flex justify-between items-center mb-2"><span className="text-sm font-medium">{t('profile_strength')}</span><span className="text-sm font-bold text-primary">75%</span></div><Progress value={75} className="h-2" /><p className="text-xs text-muted-foreground mt-2">{t('add_certifications_tip')}</p></CardContent></Card>
      <h3 className="text-lg font-semibold font-[Poppins] mb-3">{t('recent_matches')}</h3>
      <div className="space-y-3">{mockMatches.map(m => (
        <Card key={m.id}><CardContent className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{m.role}</p><p className="text-xs text-muted-foreground">{m.company}</p></div></div><div className="flex items-center gap-2"><span className="text-sm font-bold text-primary">{m.score}%</span>{m.hasMessage && <Badge variant="default" className="text-xs">{t('new_message')}</Badge>}</div></CardContent></Card>
      ))}</div>
    </div>
  );
}

// ============================================================
// Profile
// ============================================================

function ProfileView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('profile')}</h2>
      <div className="max-w-2xl space-y-6">
        <Card><CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6"><div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-10 h-10 text-primary" /></div><div><Button variant="outline" size="sm" className="cursor-pointer">{t('upload_photo')}</Button><p className="text-xs text-muted-foreground mt-1">{t('photo_hint')}</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>{t('first_name')}</Label><Input defaultValue="Ahmed" className="mt-1" /></div>
            <div><Label>{t('last_name')}</Label><Input defaultValue="Hassan" className="mt-1" /></div>
            <div><Label>{t('email')}</Label><Input defaultValue="ahmed@example.com" className="mt-1" disabled /></div>
            <div><Label>{t('mobile')}</Label><Input defaultValue="+971 50 123 4567" className="mt-1" /></div>
            <div><Label>{t('country')}</Label><Input defaultValue="UAE" className="mt-1" /></div>
            <div><Label>{t('city')}</Label><Input defaultValue="Dubai" className="mt-1" /></div>
            <div><Label>{t('nationality')}</Label><Input defaultValue="Egyptian" className="mt-1" /></div>
            <div><Label>{t('date_of_birth')}</Label><Input type="date" defaultValue="1995-03-15" className="mt-1" /></div>
          </div>
          <div className="mt-4"><Label>{t('headline')}</Label><Input defaultValue="Senior Frontend Developer | React & TypeScript Expert" className="mt-1" /></div>
          <div className="mt-4"><Label>{t('professional_summary')}</Label><Textarea defaultValue="Passionate frontend developer with 5+ years of experience building scalable web applications..." className="mt-1" rows={4} /></div>
          <div className="flex items-center gap-3 mt-4"><Switch defaultChecked /><Label>{t('open_to_work')}</Label></div>
          <Button className="mt-4 cursor-pointer">{t('save')}</Button>
        </CardContent></Card>
      </div>
    </div>
  );
}

// ============================================================
// CV / Resume
// ============================================================

function CVView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('my_resume')}</h2>
      <div className="max-w-2xl space-y-4">
        <Card className="border-dashed border-2"><CardContent className="p-8 text-center">
          <Upload className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-medium mb-1">{t('upload_resume')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('resume_formats')}</p>
          <Button className="cursor-pointer gap-2"><Upload className="w-4 h-4" />{t('upload')}</Button>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><FileText className="w-8 h-8 text-primary" /><div><p className="font-medium text-sm">Ahmed_Hassan_CV_2026.pdf</p><p className="text-xs text-muted-foreground">2.4 MB · {t('uploaded')} Jul 10, 2026</p></div></div>
          <div className="flex items-center gap-2"><Badge variant="default" className="text-xs">{t('primary')}</Badge><Button size="sm" variant="ghost" className="cursor-pointer"><Download className="w-4 h-4" /></Button><Button size="sm" variant="ghost" className="cursor-pointer text-destructive"><Trash2 className="w-4 h-4" /></Button></div>
        </CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="font-medium text-sm">{t('ai_resume_score')}</p><p className="text-xs text-muted-foreground">{t('ai_resume_score_desc')}</p></div><div className="text-2xl font-bold text-primary font-[Poppins]">82/100</div></div><Progress value={82} className="h-2 mt-3" /></CardContent></Card>
      </div>
    </div>
  );
}

// ============================================================
// Experience
// ============================================================

function ExperienceView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('experience')}</h2><Button className="cursor-pointer gap-2"><Plus className="w-4 h-4" />{t('add_experience')}</Button></div>
      <div className="max-w-2xl space-y-4">
        {mockExperience.map(exp => (
          <Card key={exp.id}><CardContent className="p-4">
            <div className="flex items-start justify-between mb-2"><div><p className="font-semibold">{exp.title}</p><p className="text-sm text-muted-foreground">{exp.company} · {exp.type}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{exp.from} - {exp.current ? t('present') : exp.to}</p></div><div className="flex gap-1"><Button size="sm" variant="ghost" className="cursor-pointer"><Edit className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="cursor-pointer text-destructive"><Trash2 className="w-3 h-3" /></Button></div></div>
            <p className="text-sm text-muted-foreground">{exp.description}</p>
            {exp.current && <Badge variant="default" className="mt-2 text-xs">{t('current_position')}</Badge>}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Education
// ============================================================

function EducationView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('education')}</h2><Button className="cursor-pointer gap-2"><Plus className="w-4 h-4" />{t('add_education')}</Button></div>
      <div className="max-w-2xl space-y-4">
        {mockEducation.map(edu => (
          <Card key={edu.id}><CardContent className="p-4">
            <div className="flex items-start justify-between"><div><p className="font-semibold">{edu.degree} - {edu.field}</p><p className="text-sm text-muted-foreground">{edu.institution}</p><p className="text-xs text-muted-foreground">{edu.from} - {edu.to} · {edu.grade}</p></div><div className="flex gap-1"><Button size="sm" variant="ghost" className="cursor-pointer"><Edit className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="cursor-pointer text-destructive"><Trash2 className="w-3 h-3" /></Button></div></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Certificates
// ============================================================

function CertificatesView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('certificates')}</h2><Button className="cursor-pointer gap-2"><Plus className="w-4 h-4" />{t('add_certificate')}</Button></div>
      <div className="max-w-2xl space-y-4">
        {mockCertificates.map(cert => (
          <Card key={cert.id}><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Award className="w-5 h-5 text-accent" /></div><div><p className="font-medium text-sm">{cert.name}</p><p className="text-xs text-muted-foreground">{cert.issuer} · {cert.date}</p></div></div>
            <div className="flex items-center gap-2">{cert.verified && <Badge variant="default" className="text-xs gap-1"><Check className="w-3 h-3" />{t('verified')}</Badge>}<Button size="sm" variant="ghost" className="cursor-pointer"><Edit className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Skills
// ============================================================

function SkillsView() {
  const { t } = useTranslation();
  const levelColor = (l: string) => { switch(l) { case 'expert': return 'text-green-600'; case 'advanced': return 'text-primary'; case 'intermediate': return 'text-accent'; default: return 'text-muted-foreground'; } };
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('skills')}</h2><Button className="cursor-pointer gap-2"><Plus className="w-4 h-4" />{t('add_skill')}</Button></div>
      <div className="max-w-2xl space-y-3">
        {mockSkills.map(skill => (
          <Card key={skill.id}><CardContent className="p-4 flex items-center justify-between">
            <div><p className="font-medium">{skill.name}</p><p className="text-xs text-muted-foreground">{skill.years} {t('years_exp')} · {skill.endorsed} {t('endorsements')}</p></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className={`text-xs ${levelColor(skill.level)}`}>{t(skill.level)}</Badge><Button size="sm" variant="ghost" className="cursor-pointer"><Edit className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Languages
// ============================================================

function LanguagesView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('languages')}</h2><Button className="cursor-pointer gap-2"><Plus className="w-4 h-4" />{t('add_language')}</Button></div>
      <div className="max-w-2xl space-y-3">
        {mockLanguages.map(lang => (
          <Card key={lang.id}><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Languages className="w-5 h-5 text-primary" /><div><p className="font-medium">{lang.name}</p></div></div>
            <div className="flex items-center gap-2"><Badge variant="secondary" className="text-xs">{t(lang.level)}</Badge><Button size="sm" variant="ghost" className="cursor-pointer"><Edit className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Portfolio
// ============================================================

function PortfolioView() {
  const { t } = useTranslation();
  const projects = [
    { id: '1', title: 'E-commerce Platform', desc: 'Full-stack e-commerce with React & Node.js', url: 'https://github.com/ahmed/ecommerce', image: '' },
    { id: '2', title: 'Task Management App', desc: 'Kanban-style project management tool', url: 'https://taskapp.demo.com', image: '' },
  ];
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('portfolio')}</h2><Button className="cursor-pointer gap-2"><Plus className="w-4 h-4" />{t('add_project')}</Button></div>
      <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-smooth"><CardContent className="p-4">
            <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center"><Layers className="w-8 h-8 text-muted-foreground/30" /></div>
            <p className="font-semibold text-sm">{p.title}</p>
            <p className="text-xs text-muted-foreground mb-2">{p.desc}</p>
            <div className="flex gap-2"><Button size="sm" variant="outline" className="cursor-pointer gap-1 text-xs"><ExternalLink className="w-3 h-3" />{t('view_project')}</Button><Button size="sm" variant="ghost" className="cursor-pointer"><Edit className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Video Introduction
// ============================================================

function VideoIntroView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('video_intro')}</h2>
      <div className="max-w-2xl">
        <Card className="border-dashed border-2 mb-4"><CardContent className="p-8 text-center">
          <Video className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-medium mb-1">{t('upload_video')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('video_hint')}</p>
          <Button className="cursor-pointer gap-2"><Upload className="w-4 h-4" />{t('upload')}</Button>
        </CardContent></Card>
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

function PreferencesView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('preferences')}</h2>
      <div className="max-w-2xl space-y-6">
        <Card><CardHeader><CardTitle className="text-sm">{t('job_preferences')}</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><Label>{t('preferred_job_titles')}</Label><Input defaultValue="Frontend Developer, Full Stack Engineer" className="mt-1" /></div>
          <div><Label>{t('preferred_industries')}</Label><Input defaultValue="Technology, Finance, E-commerce" className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{t('min_salary')}</Label><Input type="number" defaultValue="8000" className="mt-1" /></div>
            <div><Label>{t('max_salary')}</Label><Input type="number" defaultValue="15000" className="mt-1" /></div>
          </div>
          <div><Label>{t('preferred_locations')}</Label><Input defaultValue="Dubai, Abu Dhabi, Riyadh" className="mt-1" /></div>
          <div><Label>{t('employment_type')}</Label><Select defaultValue="full-time"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full-time">{t('full_time')}</SelectItem><SelectItem value="part-time">{t('part_time')}</SelectItem><SelectItem value="contract">{t('contract')}</SelectItem><SelectItem value="remote">{t('remote')}</SelectItem></SelectContent></Select></div>
          <div className="flex items-center gap-3"><Switch defaultChecked /><Label>{t('willing_to_relocate')}</Label></div>
          <div className="flex items-center gap-3"><Switch defaultChecked /><Label>{t('open_to_remote')}</Label></div>
        </CardContent></Card>
        <Button className="cursor-pointer">{t('save')}</Button>
      </div>
    </div>
  );
}

// ============================================================
// Saved Jobs
// ============================================================

function SavedJobsView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('saved_jobs')}</h2>
      <div className="space-y-3">
        {mockSavedJobs.map(job => (
          <Card key={job.id}><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{job.title}</p><p className="text-xs text-muted-foreground">{job.company} · {job.location} · {job.salary}</p></div></div>
            <div className="flex items-center gap-2"><Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-xs">{t(job.status)}</Badge><Button size="sm" variant="ghost" className="cursor-pointer text-destructive"><Trash2 className="w-3 h-3" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Applications
// ============================================================

function ApplicationsView() {
  const { t } = useTranslation();
  const statusColor = (s: string) => { switch(s) { case 'interview': return 'default'; case 'reviewed': return 'secondary'; case 'pending': return 'outline'; case 'rejected': return 'destructive'; default: return 'secondary'; } };
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('applications')}</h2>
      <div className="space-y-3">
        {mockApplications.map(app => (
          <Card key={app.id}><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div><div><p className="font-medium text-sm">{app.title}</p><p className="text-xs text-muted-foreground">{app.company} · {t('applied')}: {app.appliedDate}</p></div></div>
            <Badge variant={statusColor(app.status) as any} className="text-xs">{t(app.status)}</Badge>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Matches
// ============================================================

function MatchesView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('matches')}</h2>
      <div className="space-y-3">
        {mockMatches.map(m => (
          <Card key={m.id} className="hover:shadow-md transition-smooth"><CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div><div><p className="font-semibold text-sm">{m.role}</p><p className="text-xs text-muted-foreground">{m.company} · {t('matched')}: {m.matchedDate}</p></div></div>
            <div className="flex items-center gap-3"><span className="text-xl font-bold text-primary font-[Poppins]">{m.score}%</span><Button size="sm" className="cursor-pointer gap-1"><MessageSquare className="w-3 h-3" />{t('send')}</Button></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Notifications
// ============================================================

function NotificationsView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-[Poppins]">{t('notifications')}</h2><Button variant="ghost" size="sm" className="cursor-pointer">{t('mark_all_read')}</Button></div>
      <div className="space-y-2">
        {mockNotifications.map(n => (
          <Card key={n.id} className={!n.read ? 'border-primary/30 bg-primary/5' : ''}><CardContent className="p-4 flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
            <div className="flex-1"><p className="text-sm">{n.message}</p><p className="text-xs text-muted-foreground mt-1">{n.time}</p></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Messages Placeholder
// ============================================================

function MessagesPlaceholder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div><MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground mb-4">{t('no_messages_desc')}</p><Button onClick={() => navigate('/messages')} className="cursor-pointer">{t('open_messages')}</Button></div>
    </div>
  );
}

// ============================================================
// Settings
// ============================================================

function SettingsView() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('settings')}</h2>
      <div className="max-w-2xl space-y-6">
        <Card><CardHeader><CardTitle className="text-sm">{t('notification_settings')}</CardTitle></CardHeader><CardContent className="space-y-4">
          {[{ label: t('email_new_matches'), key: '1' }, { label: t('email_new_applications'), key: '2' }, { label: t('email_messages'), key: '3' }, { label: t('push_notifications'), key: '4' }].map(s => (
            <div key={s.key} className="flex items-center justify-between"><Label>{s.label}</Label><Switch defaultChecked /></div>
          ))}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('privacy_settings')}</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>{t('show_profile_public')}</Label><Switch defaultChecked /></div>
          <div className="flex items-center justify-between"><Label>{t('allow_direct_messages')}</Label><Switch defaultChecked /></div>
          <div className="flex items-center justify-between"><Label>{t('show_online_status')}</Label><Switch defaultChecked /></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('danger_zone')}</CardTitle></CardHeader><CardContent>
          <Button variant="destructive" className="cursor-pointer">{t('delete_account')}</Button>
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
  const [activeTab, setActiveTab] = useState<NavSection>('swipe');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTabTitle = (tab: NavSection) => {
    const map: Record<string, string> = { swipe: t('discover'), dashboard: t('dashboard'), profile: t('profile'), cv: t('my_resume'), experience: t('experience'), education: t('education'), certificates: t('certificates'), skills: t('skills'), languages: t('languages'), portfolio: t('portfolio'), video: t('video_intro'), preferences: t('preferences'), saved: t('saved_jobs'), applications: t('applications'), matches: t('matches'), messages: t('messages'), notifications: t('notifications'), settings: t('settings') };
    return map[tab] || tab;
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'swipe': return <SwipeView />;
      case 'dashboard': return <DashboardView />;
      case 'profile': return <ProfileView />;
      case 'cv': return <CVView />;
      case 'experience': return <ExperienceView />;
      case 'education': return <EducationView />;
      case 'certificates': return <CertificatesView />;
      case 'skills': return <SkillsView />;
      case 'languages': return <LanguagesView />;
      case 'portfolio': return <PortfolioView />;
      case 'video': return <VideoIntroView />;
      case 'preferences': return <PreferencesView />;
      case 'saved': return <SavedJobsView />;
      case 'applications': return <ApplicationsView />;
      case 'matches': return <MatchesView />;
      case 'messages': return <MessagesPlaceholder />;
      case 'notifications': return <NotificationsView />;
      case 'settings': return <SettingsView />;
      default: return <SwipeView />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-64 border-e border-border flex-col bg-sidebar-background">
        <SeekerNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute start-0 top-0 bottom-0 w-64 bg-sidebar-background border-e border-border overflow-y-auto">
            <SeekerNav activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} />
          </aside>
        </div>
      )}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="cursor-pointer"><ChevronRight className="w-5 h-5" /></Button>
          <span className="font-bold font-[Poppins] text-sm">{getTabTitle(activeTab)}</span>
          <div className="w-9" />
        </header>
        {renderContent()}
      </main>
    </div>
  );
}