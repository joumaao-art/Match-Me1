import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/App';
import { supabase } from '@/lib/supabase';
import { changeLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  Sparkles, Home, Heart, MessageSquare, Bookmark, History, Settings, LogOut,
  Globe, Moon, Sun, Building2, MapPin, Briefcase, GraduationCap, X, Check,
  ChevronLeft, ChevronRight, User, BarChart3, CreditCard
} from 'lucide-react';

// Mock data for demo
const mockJobs = [
  {
    id: '1', company_name: 'TechCorp', logo_url: '', industry: 'Technology', country: 'UAE', city: 'Dubai',
    employment_type: 'full_time', min_experience: 3, max_experience: 5, job_title: 'Senior Frontend Developer',
    job_description: 'We are looking for an experienced frontend developer to join our team and build amazing user interfaces.',
    required_skills: ['React', 'TypeScript', 'Tailwind CSS'], salary_min: 8000, salary_max: 12000,
    compatibility_score: 92
  },
  {
    id: '2', company_name: 'DataFlow', logo_url: '', industry: 'Data Analytics', country: 'Saudi Arabia', city: 'Riyadh',
    employment_type: 'full_time', min_experience: 2, max_experience: 4, job_title: 'Full Stack Engineer',
    job_description: 'Join our growing team to build scalable data platforms and analytics dashboards.',
    required_skills: ['Node.js', 'Python', 'PostgreSQL', 'React'], salary_min: 7000, salary_max: 10000,
    compatibility_score: 85
  },
  {
    id: '3', company_name: 'FinanceHub', logo_url: '', industry: 'Finance', country: 'UAE', city: 'Abu Dhabi',
    employment_type: 'remote', min_experience: 1, max_experience: 3, job_title: 'Mobile Developer',
    job_description: 'Build cross-platform mobile applications for our fintech products serving millions of users.',
    required_skills: ['React Native', 'Flutter', 'Firebase'], salary_min: 6000, salary_max: 9000,
    compatibility_score: 78
  },
  {
    id: '4', company_name: 'CloudNine', logo_url: '', industry: 'Cloud Computing', country: 'Qatar', city: 'Doha',
    employment_type: 'full_time', min_experience: 4, max_experience: 7, job_title: 'DevOps Engineer',
    job_description: 'Design and maintain cloud infrastructure for enterprise clients across the region.',
    required_skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'], salary_min: 10000, salary_max: 15000,
    compatibility_score: 71
  },
];

function SeekerNav({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const navItems = [
    { id: 'swipe', icon: Heart, label: t('swipe_jobs') },
    { id: 'dashboard', icon: Home, label: t('dashboard') },
    { id: 'messages', icon: MessageSquare, label: t('messages') },
    { id: 'saved', icon: Bookmark, label: t('saved_jobs') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-[Poppins]">{t('app_name')}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => changeLanguage(i18n.language === 'en' ? 'ar' : 'en')} className="cursor-pointer h-8 w-8" aria-label={t('language')}>
            <Globe className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} className="cursor-pointer h-8 w-8" aria-label={isDark ? t('light_mode') : t('dark_mode')}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-smooth cursor-pointer ${
              activeTab === item.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border space-y-1">
        <button
          onClick={() => navigate('/subscription')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-smooth cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('subscription')}</span>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-smooth cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}

function SwipeCard({ job, onSwipe }: { job: typeof mockJobs[0]; onSwipe: (direction: 'left' | 'right') => void }) {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      full_time: t('full_time'),
      part_time: t('part_time'),
      contract: t('contract'),
      remote: t('remote'),
      internship: t('internship'),
    };
    return map[type] || type;
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
    >
      <Card className="h-full flex flex-col overflow-hidden border-2">
        <CardContent className="flex-1 p-6 flex flex-col">
          {/* Match Score */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold font-[Poppins]">{job.company_name}</h3>
                <p className="text-sm text-muted-foreground">{job.industry}</p>
              </div>
            </div>
            <div className="text-end">
              <div className="text-2xl font-bold text-primary font-[Poppins]">{job.compatibility_score}%</div>
              <p className="text-xs text-muted-foreground">{t('match_score')}</p>
            </div>
          </div>

          {/* Job Title */}
          <h2 className="text-xl font-bold font-[Poppins] mb-3">{job.job_title}</h2>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="w-3 h-3" />
              {job.city}, {job.country}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Briefcase className="w-3 h-3" />
              {getEmploymentTypeLabel(job.employment_type)}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <GraduationCap className="w-3 h-3" />
              {t('years_experience', { count: `${job.min_experience}-${job.max_experience}` })}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 flex-1">{job.job_description}</p>

          {/* Skills */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('required_skills')}</p>
            <div className="flex flex-wrap gap-1.5">
              {job.required_skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </div>

          {/* Salary */}
          {job.salary_min && (
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm font-medium">${job.salary_min.toLocaleString()} - ${job.salary_max?.toLocaleString()} {t('per_month')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SwipeView() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState(mockJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Simulate match (30% chance)
      if (Math.random() > 0.7) {
        setShowMatch(true);
        setTimeout(() => setShowMatch(false), 2500);
      }
      toast.success(t('interested'));
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const currentJob = jobs[currentIndex];

  if (!currentJob) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold font-[Poppins] mb-2">{t('no_more_jobs')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('check_back_later')}</p>
          <Button onClick={() => setCurrentIndex(0)} className="cursor-pointer mt-4">
            {t('start_over')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
      <h2 className="text-xl font-bold font-[Poppins] mb-4">{t('swipe_jobs')}</h2>
      
      {/* Card Stack */}
      <div className="flex-1 relative min-h-[500px]">
        {jobs.slice(currentIndex, currentIndex + 2).reverse().map((job, i) => (
          <SwipeCard
            key={job.id}
            job={job}
            onSwipe={i === jobs.slice(currentIndex, currentIndex + 2).length - 1 ? handleSwipe : () => {}}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 mt-4 pb-4">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer"
          onClick={() => handleSwipe('left')}
          aria-label={t('not_interested')}
        >
          <X className="w-6 h-6" />
        </Button>
        <Button
          size="lg"
          className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white cursor-pointer"
          onClick={() => handleSwipe('right')}
          aria-label={t('interested')}
        >
          <Check className="w-6 h-6" />
        </Button>
      </div>

      {/* Match Overlay */}
      {showMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="animate-match-pop text-center p-8">
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-12 h-12 text-white fill-white" />
            </div>
            <h2 className="text-3xl font-bold text-white font-[Poppins] mb-2">{t('its_a_match')}</h2>
            <p className="text-white/80">{t('match_message', { company: currentJob?.company_name })}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView() {
  const { t } = useTranslation();
  
  const stats = [
    { label: t('matched_jobs'), value: '12', color: 'text-primary' },
    { label: t('applications'), value: '28', color: 'text-accent' },
    { label: t('interview'), value: '3', color: 'text-green-600' },
  ];

  const recentMatches = [
    { company: 'TechCorp', role: 'Senior Frontend Developer', score: 92, status: 'interview' },
    { company: 'DataFlow', role: 'Full Stack Engineer', score: 85, status: 'accepted' },
    { company: 'FinanceHub', role: 'Mobile Developer', score: 78, status: 'new_status' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('dashboard')}</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold font-[Poppins] ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Strength */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{t('profile_strength')}</span>
            <span className="text-sm font-bold text-primary">75%</span>
          </div>
          <Progress value={75} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{t('add_certifications_tip')}</p>
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <h3 className="text-lg font-semibold font-[Poppins] mb-3">{t('matched_jobs')}</h3>
      <div className="space-y-3">
        {recentMatches.map((match) => (
          <Card key={match.company}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{match.role}</p>
                  <p className="text-xs text-muted-foreground">{match.company}</p>
                </div>
              </div>
              <div className="text-end">
                <Badge variant={match.status === 'interview' ? 'default' : 'secondary'} className="text-xs">
                  {t(match.status)}
                </Badge>
                <p className="text-xs text-primary font-medium mt-1">{match.score}%</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  const { t } = useTranslation();
  
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('settings')}</h2>
      <div className="space-y-4 max-w-lg">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">{t('profile')}</h3>
            <div className="space-y-3">
              <div>
                <Label>{t('first_name')}</Label>
                <Input placeholder={t('first_name_placeholder')} className="mt-1" />
              </div>
              <div>
                <Label>{t('last_name')}</Label>
                <Input placeholder={t('last_name_placeholder')} className="mt-1" />
              </div>
              <div>
                <Label>{t('email')}</Label>
                <Input placeholder={t('email_placeholder')} className="mt-1" disabled />
              </div>
              <div>
                <Label>{t('mobile')}</Label>
                <Input placeholder={t('mobile_placeholder')} className="mt-1" />
              </div>
              <div>
                <Label>{t('professional_summary')}</Label>
                <Textarea placeholder={t('summary_placeholder')} className="mt-1" rows={3} />
              </div>
              <div>
                <Label>{t('key_skills')}</Label>
                <Input placeholder={t('skills_placeholder')} className="mt-1" />
              </div>
            </div>
            <Button className="mt-4 cursor-pointer">{t('save')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function JobSeeker() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('swipe');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getTabTitle = (tab: string) => {
    const map: Record<string, string> = {
      swipe: t('discover'),
      dashboard: t('dashboard'),
      messages: t('messages'),
      saved: t('saved_jobs'),
      settings: t('settings'),
    };
    return map[tab] || tab;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-e border-border flex-col bg-sidebar-background">
        <SeekerNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute start-0 top-0 bottom-0 w-64 bg-sidebar-background border-e border-border">
            <SeekerNav activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <span className="font-bold font-[Poppins]">{getTabTitle(activeTab)}</span>
          <div className="w-9" />
        </header>

        {/* Content */}
        {activeTab === 'swipe' && <SwipeView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'messages' && (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{t('no_messages')}</p>
            </div>
          </div>
        )}
        {activeTab === 'saved' && (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-medium mb-1">{t('no_saved_jobs')}</h3>
              <p className="text-muted-foreground text-sm">{t('no_saved_jobs_desc')}</p>
            </div>
          </div>
        )}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}