import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/App';
import { changeLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import {
  Sparkles, Home, Users, MessageSquare, BarChart3, CreditCard, Settings, LogOut,
  Globe, Moon, Sun, Plus, Building2, MapPin, Briefcase, GraduationCap, Check, X,
  ChevronRight, Mail, Phone, Eye, BookmarkPlus, Send, FileText
} from 'lucide-react';

// Mock candidates data
const mockCandidates = [
  {
    id: '1', name: 'Ahmed Hassan', photo: '', skills: ['React', 'TypeScript', 'Node.js'],
    experience: 5, education: "Bachelor's in CS", location: 'Dubai, UAE',
    score: 94, status: 'new' as const, summary: 'Senior full-stack developer with 5 years of experience in building scalable web applications.'
  },
  {
    id: '2', name: 'Sara Al-Rashid', photo: '', skills: ['Python', 'Machine Learning', 'SQL'],
    experience: 3, education: "Master's in Data Science", location: 'Riyadh, KSA',
    score: 87, status: 'interview' as const, summary: 'Data scientist passionate about AI and machine learning solutions.'
  },
  {
    id: '3', name: 'Omar Khalil', photo: '', skills: ['Java', 'Spring Boot', 'AWS'],
    experience: 7, education: "Bachelor's in Software Engineering", location: 'Doha, Qatar',
    score: 82, status: 'accepted' as const, summary: 'Backend engineer specializing in cloud-native microservices architecture.'
  },
  {
    id: '4', name: 'Layla Mansour', photo: '', skills: ['UI/UX', 'Figma', 'React'],
    experience: 4, education: "Bachelor's in Design", location: 'Abu Dhabi, UAE',
    score: 76, status: 'new' as const, summary: 'Creative designer with a strong technical background in frontend development.'
  },
];

const mockVacancies = [
  { id: '1', title: 'Senior Frontend Developer', status: 'open', applicants: 24, posted: '2026-07-10' },
  { id: '2', title: 'Full Stack Engineer', status: 'open', applicants: 18, posted: '2026-07-12' },
  { id: '3', title: 'DevOps Engineer', status: 'draft', applicants: 0, posted: '2026-07-15' },
];

function CompanyNav({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const navItems = [
    { id: 'dashboard', icon: Home, label: t('dashboard') },
    { id: 'vacancies', icon: FileText, label: t('vacancies') },
    { id: 'candidates', icon: Users, label: t('candidates') },
    { id: 'messages', icon: MessageSquare, label: t('messages') },
    { id: 'analytics', icon: BarChart3, label: t('analytics') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-[Poppins]">{t('app_name')}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => changeLanguage(i18n.language === 'en' ? 'ar' : 'en')} className="cursor-pointer h-8 w-8">
            <Globe className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} className="cursor-pointer h-8 w-8">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

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

function CompanyDashboard() {
  const { t } = useTranslation();
  
  const stats = [
    { label: 'Active Vacancies', value: '5', color: 'text-primary' },
    { label: t('candidates'), value: '47', color: 'text-accent' },
    { label: 'Interviews', value: '8', color: 'text-green-600' },
    { label: 'Hired', value: '2', color: 'text-purple-600' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-[Poppins]">{t('dashboard')}</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl sm:text-3xl font-bold font-[Poppins] ${stat.color}`}>{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Candidates */}
      <h3 className="text-lg font-semibold font-[Poppins] mb-3">Top Matched Candidates</h3>
      <div className="space-y-3">
        {mockCandidates.slice(0, 3).map((candidate) => (
          <Card key={candidate.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">{candidate.skills.slice(0, 2).join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={candidate.status === 'interview' ? 'default' : 'secondary'} className="text-xs">
                  {candidate.status === 'new' ? t('new_status') : t(candidate.status)}
                </Badge>
                <span className="text-sm font-bold text-primary">{candidate.score}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VacanciesView() {
  const { t } = useTranslation();
  const [showPostDialog, setShowPostDialog] = useState(false);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-[Poppins]">{t('vacancies')}</h2>
        <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2">
              <Plus className="w-4 h-4" />
              {t('post_vacancy')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-[Poppins]">{t('post_vacancy')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>{t('job_title')}</Label>
                <Input placeholder="e.g. Senior Frontend Developer" className="mt-1" />
              </div>
              <div>
                <Label>{t('employment_type')}</Label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('job_description')}</Label>
                <Textarea placeholder="Describe the role..." className="mt-1" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('country')}</Label>
                  <Input placeholder="UAE" className="mt-1" />
                </div>
                <div>
                  <Label>{t('city')}</Label>
                  <Input placeholder="Dubai" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>{t('required_skills')}</Label>
                <Input placeholder="React, TypeScript, Node.js" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('min_experience')}</Label>
                  <Input type="number" placeholder="2" className="mt-1" />
                </div>
                <div>
                  <Label>{t('max_experience')}</Label>
                  <Input type="number" placeholder="5" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>{t('education_level')}</Label>
                <Select>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="bachelors">Bachelor's</SelectItem>
                    <SelectItem value="masters">Master's</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Salary (USD)</Label>
                  <Input type="number" placeholder="5000" className="mt-1" />
                </div>
                <div>
                  <Label>Max Salary (USD)</Label>
                  <Input type="number" placeholder="10000" className="mt-1" />
                </div>
              </div>
              <Button className="w-full cursor-pointer" onClick={() => { toast.success('Vacancy posted!'); setShowPostDialog(false); }}>
                {t('post_vacancy')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vacancy List */}
      <div className="space-y-3">
        {mockVacancies.map((vacancy) => (
          <Card key={vacancy.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{vacancy.title}</p>
                <p className="text-xs text-muted-foreground">Posted: {vacancy.posted} · {vacancy.applicants} applicants</p>
              </div>
              <Badge variant={vacancy.status === 'open' ? 'default' : 'secondary'}>
                {t(vacancy.status)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CandidatesView() {
  const { t } = useTranslation();
  const [candidates, setCandidates] = useState(mockCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<typeof mockCandidates[0] | null>(null);

  const updateStatus = (id: string, status: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
    toast.success(`Candidate ${status}`);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('candidates')}</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="default" className="cursor-pointer">All</Badge>
        <Badge variant="outline" className="cursor-pointer">{t('new_status')}</Badge>
        <Badge variant="outline" className="cursor-pointer">{t('accepted')}</Badge>
        <Badge variant="outline" className="cursor-pointer">{t('interview')}</Badge>
        <Badge variant="outline" className="cursor-pointer">{t('hired')}</Badge>
      </div>

      {/* Candidate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="hover:shadow-md transition-smooth">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">{candidate.location}</p>
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-xl font-bold text-primary font-[Poppins]">{candidate.score}%</div>
                  <Badge variant={candidate.status === 'interview' ? 'default' : 'secondary'} className="text-xs mt-1">
                    {candidate.status === 'new' ? t('new_status') : t(candidate.status)}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{candidate.summary}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {candidate.skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Briefcase className="w-3 h-3" />
                <span>{candidate.experience} years</span>
                <GraduationCap className="w-3 h-3 ms-2" />
                <span>{candidate.education}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="default" className="cursor-pointer flex-1 gap-1" onClick={() => updateStatus(candidate.id, 'accepted')}>
                  <Check className="w-3 h-3" />
                  {t('accept')}
                </Button>
                <Button size="sm" variant="outline" className="cursor-pointer flex-1 gap-1" onClick={() => updateStatus(candidate.id, 'rejected')}>
                  <X className="w-3 h-3" />
                  {t('reject')}
                </Button>
                <Button size="sm" variant="ghost" className="cursor-pointer gap-1">
                  <Send className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="cursor-pointer gap-1">
                  <BookmarkPlus className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AnalyticsView() {
  const { t } = useTranslation();

  const metrics = [
    { label: 'Total Applications', value: '156' },
    { label: 'Acceptance Rate', value: '34%' },
    { label: 'Response Rate', value: '78%' },
    { label: 'Avg. Time to Hire', value: '12 days' },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('analytics')}</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-[Poppins] text-primary">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hiring Funnel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-[Poppins]">Hiring Funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { stage: 'Applications', count: 156, pct: 100 },
            { stage: 'Screened', count: 89, pct: 57 },
            { stage: 'Interviewed', count: 34, pct: 22 },
            { stage: 'Offered', count: 12, pct: 8 },
            { stage: 'Hired', count: 8, pct: 5 },
          ].map((item) => (
            <div key={item.stage} className="flex items-center gap-3">
              <span className="text-sm w-24 shrink-0">{item.stage}</span>
              <div className="flex-1">
                <Progress value={item.pct} className="h-3" />
              </div>
              <span className="text-sm font-medium w-12 text-end">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-[Poppins]">Top Requested Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'SQL', 'Docker', 'Kubernetes'].map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CompanySettingsView() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('settings')}</h2>
      <div className="space-y-4 max-w-lg">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">{t('company_name')}</h3>
            <div className="space-y-3">
              <div>
                <Label>{t('company_name')}</Label>
                <Input placeholder="TechCorp" className="mt-1" />
              </div>
              <div>
                <Label>{t('company_website')}</Label>
                <Input placeholder="https://techcorp.com" className="mt-1" />
              </div>
              <div>
                <Label>{t('company_phone')}</Label>
                <Input placeholder="+971 4 123 4567" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('country')}</Label>
                  <Input placeholder="UAE" className="mt-1" />
                </div>
                <div>
                  <Label>{t('city')}</Label>
                  <Input placeholder="Dubai" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>{t('industry')}</Label>
                <Input placeholder="Technology" className="mt-1" />
              </div>
              <div>
                <Label>{t('company_description')}</Label>
                <Textarea placeholder="Tell us about your company..." className="mt-1" rows={3} />
              </div>
            </div>
            <Button className="mt-4 cursor-pointer">{t('save')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Company() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-e border-border flex-col bg-sidebar-background">
        <CompanyNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute start-0 top-0 bottom-0 w-64 bg-sidebar-background border-e border-border">
            <CompanyNav activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} />
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
          <span className="font-bold font-[Poppins] capitalize">{activeTab}</span>
          <div className="w-9" />
        </header>

        {/* Content */}
        {activeTab === 'dashboard' && <CompanyDashboard />}
        {activeTab === 'vacancies' && <VacanciesView />}
        {activeTab === 'candidates' && <CandidatesView />}
        {activeTab === 'messages' && (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          </div>
        )}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <CompanySettingsView />}
      </main>
    </div>
  );
}