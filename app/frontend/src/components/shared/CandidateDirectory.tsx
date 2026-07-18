import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search, Filter, X, Heart, Send, Eye, Clock, MapPin, Briefcase,
  GraduationCap, Globe, Star, Lock, ChevronRight, ChevronLeft,
  LayoutGrid, List, BookmarkPlus, UserCheck, Shield, Sparkles,
  Download, Plus, FolderPlus, Tag, MoreVertical, CheckCircle2,
  AlertCircle, Users, TrendingUp, Calendar, Building2
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

export type CompanyTier = 'free' | 'premium' | 'enterprise';
export type DirectoryView = 'directory' | 'saved' | 'viewed' | 'contacts' | 'pipeline';
export type CardViewMode = 'card' | 'table';

type VisibilityMode = 'public' | 'anonymous' | 'private';
type SeekerSubscriptionTier = 'free' | 'premium' | 'premium_plus';

interface DirectoryCandidate {
  id: string;
  name: string;
  headline: string;
  currentPosition: string;
  company: string;
  experience: number;
  industry: string;
  location: string;
  employmentPref: string;
  availability: string;
  skills: string[];
  languages: string[];
  education: string;
  profileCompletion: number;
  profileStrength: number;
  matchScore: number;
  verified: boolean;
  openToWork: boolean;
  featured: boolean;
  recentlyActive: boolean;
  lastActive: string;
  joinedDate: string;
  salaryExpectation: number;
  avatar?: string;
  email?: string;
  phone?: string;
  portfolio?: string;
  resume?: string;
  about?: string;
  certifications?: string[];
  // Discoverability fields (Part 2)
  visibilityMode: VisibilityMode;
  seekerTier: SeekerSubscriptionTier;
  discoverable: boolean;
  allowAIRecommendations: boolean;
}

interface SavedFolder {
  id: string;
  name: string;
  count: number;
  color: string;
}

interface PipelineStage {
  key: string;
  label: string;
  color: string;
}

interface CandidateView {
  candidateId: string;
  viewedAt: string;
  viewCount: number;
}

// ============================================================
// Mock Data
// ============================================================

const mockDirectoryCandidates: DirectoryCandidate[] = [
  { id: 'd1', name: 'Fatima Al-Rashid', headline: 'Senior Full-Stack Developer', currentPosition: 'Lead Engineer', company: 'TechVentures', experience: 7, industry: 'Technology', location: 'Dubai, UAE', employmentPref: 'Full-time', availability: 'Immediate', skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL'], languages: ['Arabic', 'English', 'French'], education: "Master's in CS", profileCompletion: 95, profileStrength: 92, matchScore: 96, verified: true, openToWork: true, featured: true, recentlyActive: true, lastActive: '2026-07-18', joinedDate: '2025-11-01', salaryExpectation: 18000, email: 'fatima@email.com', phone: '+971501234567', portfolio: 'https://fatima.dev', resume: 'fatima_cv.pdf', about: 'Passionate full-stack developer with 7 years of experience building scalable web applications.', certifications: ['AWS Solutions Architect', 'Google Cloud Professional'], visibilityMode: 'public', seekerTier: 'premium_plus', discoverable: true, allowAIRecommendations: true },
  { id: 'd2', name: 'Khalid Mohammed', headline: 'DevOps & Cloud Architect', currentPosition: 'Senior DevOps Engineer', company: 'CloudFirst', experience: 6, industry: 'Technology', location: 'Riyadh, KSA', employmentPref: 'Full-time', availability: '2 Weeks', skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD'], languages: ['Arabic', 'English'], education: "Bachelor's in IT", profileCompletion: 88, profileStrength: 85, matchScore: 91, verified: true, openToWork: true, featured: false, recentlyActive: true, lastActive: '2026-07-17', joinedDate: '2026-01-15', salaryExpectation: 15000, email: 'khalid@email.com', phone: '+966551234567', about: 'Cloud infrastructure expert specializing in Kubernetes and multi-cloud architectures.', certifications: ['CKA', 'AWS DevOps Professional'], visibilityMode: 'public', seekerTier: 'premium', discoverable: true, allowAIRecommendations: true },
  { id: 'd3', name: 'Sara Hassan', headline: 'UX/UI Design Lead', currentPosition: 'Design Director', company: 'DesignStudio', experience: 8, industry: 'Design', location: 'Abu Dhabi, UAE', employmentPref: 'Full-time', availability: '1 Month', skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping', 'User Research'], languages: ['Arabic', 'English', 'Spanish'], education: "Master's in Design", profileCompletion: 100, profileStrength: 98, matchScore: 88, verified: true, openToWork: false, featured: true, recentlyActive: true, lastActive: '2026-07-18', joinedDate: '2025-08-20', salaryExpectation: 20000, email: 'sara@email.com', phone: '+971521234567', portfolio: 'https://sara-design.com', about: 'Award-winning design leader with expertise in creating intuitive digital experiences.', certifications: ['Google UX Design', 'Nielsen Norman Group'], visibilityMode: 'public', seekerTier: 'premium_plus', discoverable: true, allowAIRecommendations: true },
  { id: 'd4', name: 'Omar Al-Jabri', headline: 'Data Scientist & ML Engineer', currentPosition: 'Senior Data Scientist', company: 'DataInsights', experience: 5, industry: 'Technology', location: 'Doha, Qatar', employmentPref: 'Remote', availability: 'Immediate', skills: ['Python', 'TensorFlow', 'SQL', 'ML', 'NLP', 'Statistics'], languages: ['Arabic', 'English'], education: "PhD in Data Science", profileCompletion: 92, profileStrength: 90, matchScore: 84, verified: true, openToWork: true, featured: false, recentlyActive: false, lastActive: '2026-07-14', joinedDate: '2026-03-10', salaryExpectation: 16000, email: 'omar@email.com', about: 'Data scientist passionate about applying ML to solve real-world business problems.', certifications: ['TensorFlow Developer', 'AWS ML Specialty'], visibilityMode: 'anonymous', seekerTier: 'premium', discoverable: true, allowAIRecommendations: true },
  { id: 'd5', name: 'Layla Nasser', headline: 'Product Manager', currentPosition: 'Senior PM', company: 'ProductCo', experience: 6, industry: 'Technology', location: 'Jeddah, KSA', employmentPref: 'Hybrid', availability: '2 Weeks', skills: ['Product Strategy', 'Agile', 'Analytics', 'Roadmapping', 'Stakeholder Management'], languages: ['Arabic', 'English', 'Turkish'], education: "MBA", profileCompletion: 85, profileStrength: 82, matchScore: 79, verified: false, openToWork: true, featured: false, recentlyActive: true, lastActive: '2026-07-16', joinedDate: '2026-02-01', salaryExpectation: 14000, email: 'layla@email.com', about: 'Product leader focused on building products that users love.', certifications: ['CSPO', 'SAFe Agilist'], visibilityMode: 'public', seekerTier: 'premium', discoverable: true, allowAIRecommendations: false },
  { id: 'd6', name: 'Ahmed Mansour', headline: 'Backend Engineer', currentPosition: 'Software Engineer', company: 'StartupXYZ', experience: 3, industry: 'Technology', location: 'Cairo, Egypt', employmentPref: 'Remote', availability: 'Immediate', skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'Redis'], languages: ['Arabic', 'English'], education: "Bachelor's in CS", profileCompletion: 78, profileStrength: 75, matchScore: 72, verified: false, openToWork: true, featured: false, recentlyActive: true, lastActive: '2026-07-18', joinedDate: '2026-05-20', salaryExpectation: 8000, email: 'ahmed@email.com', about: 'Backend developer with strong microservices experience.', visibilityMode: 'public', seekerTier: 'premium', discoverable: true, allowAIRecommendations: true },
  { id: 'd7', name: 'Noor Al-Qasim', headline: 'Cybersecurity Analyst', currentPosition: 'Security Engineer', company: 'SecureNet', experience: 4, industry: 'Cybersecurity', location: 'Manama, Bahrain', employmentPref: 'Full-time', availability: '1 Month', skills: ['Penetration Testing', 'SIEM', 'Incident Response', 'Cloud Security', 'SOC'], languages: ['Arabic', 'English', 'Hindi'], education: "Master's in Cybersecurity", profileCompletion: 90, profileStrength: 87, matchScore: 81, verified: true, openToWork: true, featured: false, recentlyActive: false, lastActive: '2026-07-12', joinedDate: '2025-12-05', salaryExpectation: 13000, email: 'noor@email.com', about: 'Cybersecurity professional with expertise in threat detection and incident response.', certifications: ['CISSP', 'CEH', 'OSCP'], visibilityMode: 'anonymous', seekerTier: 'premium', discoverable: true, allowAIRecommendations: true },
  { id: 'd8', name: 'Youssef Ibrahim', headline: 'Mobile Developer', currentPosition: 'iOS Developer', company: 'AppFactory', experience: 4, industry: 'Technology', location: 'Kuwait City, Kuwait', employmentPref: 'Full-time', availability: '2 Weeks', skills: ['Swift', 'React Native', 'Flutter', 'iOS', 'Android'], languages: ['Arabic', 'English'], education: "Bachelor's in SE", profileCompletion: 82, profileStrength: 80, matchScore: 77, verified: false, openToWork: true, featured: false, recentlyActive: true, lastActive: '2026-07-17', joinedDate: '2026-04-15', salaryExpectation: 10000, email: 'youssef@email.com', about: 'Cross-platform mobile developer building beautiful native experiences.', visibilityMode: 'public', seekerTier: 'premium', discoverable: true, allowAIRecommendations: true },
];

const PIPELINE_STAGES: PipelineStage[] = [
  { key: 'prospect', label: 'New Prospect', color: 'bg-blue-500' },
  { key: 'interesting', label: 'Interesting', color: 'bg-yellow-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-purple-500' },
  { key: 'interview_future', label: 'Interview Future', color: 'bg-green-500' },
  { key: 'high_priority', label: 'High Priority', color: 'bg-red-500' },
  { key: 'archived', label: 'Archived', color: 'bg-gray-500' },
];

const DEFAULT_FOLDERS: SavedFolder[] = [
  { id: 'f1', name: 'All Saved', count: 0, color: 'bg-primary' },
  { id: 'f2', name: 'Marketing', count: 0, color: 'bg-blue-500' },
  { id: 'f3', name: 'Engineering', count: 0, color: 'bg-green-500' },
  { id: 'f4', name: 'Executives', count: 0, color: 'bg-purple-500' },
  { id: 'f5', name: 'Future Hiring', count: 0, color: 'bg-orange-500' },
];

// ============================================================
// Debounce Hook
// ============================================================

function useDebounceDir<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================
// Reusable Search Bar Component
// ============================================================

function SearchBar({ value, onChange, placeholder, isSearching }: { value: string; onChange: (v: string) => void; placeholder: string; isSearching?: boolean }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="ps-9 h-9" aria-label={placeholder} />
      {isSearching && <div className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
    </div>
  );
}

// ============================================================
// Filter Chips Component
// ============================================================

function FilterChips({ filters, onRemove, onClearAll, t }: { filters: { key: string; label: string }[]; onRemove: (key: string) => void; onClearAll: () => void; t: any }) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {filters.map(f => (
        <Badge key={f.key} variant="secondary" className="gap-1 cursor-pointer" onClick={() => onRemove(f.key)}>
          {f.label} <X className="w-3 h-3" />
        </Badge>
      ))}
      <Button variant="ghost" size="sm" className="cursor-pointer text-xs h-6" onClick={onClearAll}>
        {t('clear_filters')}
      </Button>
    </div>
  );
}

// ============================================================
// Locked Content Overlay
// ============================================================

function LockedOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
      <div className="text-center p-4">
        <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================================
// Candidate Card Component
// ============================================================

function CandidateCard({ candidate, tier, onView, onSave, onPipeline, onContact, isSaved }: {
  candidate: DirectoryCandidate;
  tier: CompanyTier;
  onView: () => void;
  onSave: () => void;
  onPipeline: () => void;
  onContact: () => void;
  isSaved: boolean;
}) {
  const { t } = useTranslation();
  const isAnonymous = candidate.visibilityMode === 'anonymous';
  const canSeeIdentity = tier !== 'free' && !isAnonymous;
  const canContact = tier !== 'free' && !isAnonymous;

  return (
    <Card className="hover:shadow-md transition-all duration-200 group relative">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
            {canSeeIdentity ? (
              <span className="text-lg font-bold text-primary">{candidate.name.charAt(0)}</span>
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
            {candidate.verified && <CheckCircle2 className="w-4 h-4 text-green-500 absolute -bottom-0.5 -end-0.5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {canSeeIdentity ? (
                <p className="font-semibold text-sm truncate">{candidate.name}</p>
              ) : (
                <p className="font-semibold text-sm text-muted-foreground">🔒 {t('upgrade_to_see_name')}</p>
              )}
              {candidate.featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{candidate.headline}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{candidate.location}
            </p>
          </div>
          <div className="text-end shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-lg font-bold text-primary">{candidate.matchScore}%</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {candidate.openToWork && <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-600">{t('open_to_work')}</Badge>}
          {candidate.recentlyActive && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('recently_active')}</Badge>}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{candidate.experience} {t('years_exp')}</Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{candidate.availability}</Badge>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.skills.slice(0, 4).map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
          {candidate.skills.length > 4 && <Badge variant="secondary" className="text-[10px]">+{candidate.skills.length - 4}</Badge>}
        </div>

        {/* Profile Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <GraduationCap className="w-3 h-3" /><span className="truncate">{candidate.education}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Globe className="w-3 h-3" /><span className="truncate">{candidate.languages.slice(0, 2).join(', ')}</span>
          </div>
        </div>

        {/* Strength Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{t('profile_strength')}</span>
            <span>{candidate.profileStrength}%</span>
          </div>
          <Progress value={candidate.profileStrength} className="h-1.5" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="default" className="cursor-pointer flex-1 gap-1 text-xs h-7" onClick={onView}>
            <Eye className="w-3 h-3" />{t('view_profile')}
          </Button>
          <Button size="sm" variant={isSaved ? 'secondary' : 'outline'} className="cursor-pointer h-7 w-7 p-0" onClick={onSave} title={t('save')}>
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button size="sm" variant="outline" className="cursor-pointer h-7 w-7 p-0" onClick={onPipeline} title={t('add_to_pipeline')}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          {canContact ? (
            <Button size="sm" variant="outline" className="cursor-pointer h-7 w-7 p-0" onClick={onContact} title={t('contact')}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="cursor-pointer h-7 w-7 p-0 opacity-50" disabled title={t('premium_required')}>
              <Lock className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Candidate Table Row
// ============================================================

function CandidateTableRow({ candidate, tier, onView, onSave, isSaved }: {
  candidate: DirectoryCandidate;
  tier: CompanyTier;
  onView: () => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  const { t } = useTranslation();
  const isAnonymous = candidate.visibilityMode === 'anonymous';
  const canSeeIdentity = tier !== 'free' && !isAnonymous;

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {canSeeIdentity ? <span className="text-sm font-bold text-primary">{candidate.name.charAt(0)}</span> : isAnonymous ? <Shield className="w-3.5 h-3.5 text-amber-500" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
          <div>
            <p className="text-sm font-medium">{canSeeIdentity ? candidate.name : isAnonymous ? t('anonymous_mode') + ' ' + t('candidate') : '🔒 ' + t('premium_required')}</p>
            <p className="text-xs text-muted-foreground">{candidate.headline}</p>
          </div>
        </div>
      </td>
      <td className="p-3 text-sm text-muted-foreground">{candidate.location}</td>
      <td className="p-3 text-sm">{candidate.experience} {t('years_exp')}</td>
      <td className="p-3">
        <div className="flex gap-1">{candidate.skills.slice(0, 2).map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div>
      </td>
      <td className="p-3"><span className="font-bold text-primary">{candidate.matchScore}%</span></td>
      <td className="p-3"><Progress value={candidate.profileStrength} className="h-1.5 w-16" /></td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0" onClick={onView}><Eye className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0" onClick={onSave}><Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} /></Button>
        </div>
      </td>
    </tr>
  );
}

// ============================================================
// Candidate Profile Modal
// ============================================================

function CandidateProfileModal({ candidate, tier, open, onClose }: {
  candidate: DirectoryCandidate | null;
  tier: CompanyTier;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!candidate) return null;
  const isAnonymous = candidate.visibilityMode === 'anonymous';
  const canSeeIdentity = tier !== 'free' && !isAnonymous;
  const canSeeContact = tier !== 'free' && !isAnonymous;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Poppins]">{t('candidate_profile')}</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {canSeeIdentity ? <span className="text-2xl font-bold text-primary">{candidate.name.charAt(0)}</span> : <Lock className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            {canSeeIdentity ? (
              <h3 className="text-lg font-bold">{candidate.name}</h3>
            ) : (
              <h3 className="text-lg font-bold text-muted-foreground">🔒 {t('upgrade_premium_identity')}</h3>
            )}
            <p className="text-sm text-muted-foreground">{candidate.headline}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{candidate.location}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{candidate.experience} {t('years_exp')}</span>
              {candidate.verified && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />{t('verified')}</span>}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{candidate.matchScore}%</div>
            <p className="text-xs text-muted-foreground">{t('match_score')}</p>
          </div>
        </div>

        {/* About */}
        {candidate.about && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2">{t('about')}</h4>
            <p className="text-sm text-muted-foreground">{candidate.about}</p>
          </div>
        )}

        {/* Skills */}
        <div className="mb-4">
          <h4 className="font-semibold text-sm mb-2">{t('skills')}</h4>
          <div className="flex flex-wrap gap-1.5">{candidate.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div>
        </div>

        {/* Education & Languages */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">{t('education')}</h4>
            <p className="text-sm text-muted-foreground">{candidate.education}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">{t('languages')}</h4>
            <div className="flex flex-wrap gap-1">{candidate.languages.map(l => <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>)}</div>
          </div>
        </div>

        {/* Certifications */}
        {candidate.certifications && candidate.certifications.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2">{t('certifications')}</h4>
            <div className="flex flex-wrap gap-1.5">{candidate.certifications.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}</div>
          </div>
        )}

        {/* Contact Info (Premium) */}
        <div className="mb-4 relative">
          <h4 className="font-semibold text-sm mb-2">{t('contact_info')}</h4>
          {canSeeContact ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              {candidate.email && <p>📧 {candidate.email}</p>}
              {candidate.phone && <p>📱 {candidate.phone}</p>}
              {candidate.portfolio && <p>🔗 {candidate.portfolio}</p>}
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 text-center border border-dashed border-border">
              <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('upgrade_premium_contact')}</p>
              <Button size="sm" className="cursor-pointer mt-2 gap-1"><Sparkles className="w-3 h-3" />{t('upgrade_now')}</Button>
            </div>
          )}
        </div>

        {/* Profile Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-primary">{candidate.profileCompletion}%</p>
            <p className="text-xs text-muted-foreground">{t('profile_completion')}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-green-600">{candidate.profileStrength}%</p>
            <p className="text-xs text-muted-foreground">{t('profile_strength')}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-purple-600">{candidate.matchScore}%</p>
            <p className="text-xs text-muted-foreground">{t('ai_match')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">{t('close')}</Button>
          {canSeeContact && <Button className="cursor-pointer gap-1"><Send className="w-4 h-4" />{t('contact_candidate')}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main Candidate Directory Component
// ============================================================

interface CandidateDirectoryProps {
  activeView: DirectoryView;
  companyTier?: CompanyTier;
}

export default function CandidateDirectory({ activeView, companyTier = 'premium' }: CandidateDirectoryProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<CardViewMode>(() => (localStorage.getItem('cd_view_mode') as CardViewMode) || 'card');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('matchScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCandidate, setSelectedCandidate] = useState<DirectoryCandidate | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedCandidates, setSavedCandidates] = useState<string[]>(['d1', 'd3']);
  const [viewedCandidates, setViewedCandidates] = useState<CandidateView[]>([
    { candidateId: 'd1', viewedAt: '2026-07-18T10:00:00', viewCount: 3 },
    { candidateId: 'd2', viewedAt: '2026-07-17T14:30:00', viewCount: 1 },
  ]);
  const [pipelineCandidates, setPipelineCandidates] = useState<Record<string, string>>({ d1: 'interesting', d4: 'prospect' });
  const [folders] = useState<SavedFolder[]>(DEFAULT_FOLDERS);

  // Filters
  const [filters, setFilters] = useState({
    industry: 'all',
    experience: 'all',
    location: 'all',
    availability: 'all',
    skills: [] as string[],
    openToWork: false,
    verified: false,
    featured: false,
    recentlyActive: false,
    minScore: 0,
    maxScore: 100,
  });

  const debouncedSearch = useDebounceDir(searchQuery, 300);
  const isSearching = searchQuery !== debouncedSearch;

  // Persist view mode
  useEffect(() => { localStorage.setItem('cd_view_mode', viewMode); }, [viewMode]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filters, sortField, sortOrder]);

  const allSkills = useMemo(() => Array.from(new Set(mockDirectoryCandidates.flatMap(c => c.skills))), []);
  const allLocations = useMemo(() => Array.from(new Set(mockDirectoryCandidates.map(c => c.location))), []);
  const allIndustries = useMemo(() => Array.from(new Set(mockDirectoryCandidates.map(c => c.industry))), []);

  // Get candidates based on active view (exclude private & non-discoverable from directory)
  const baseCandidates = useMemo(() => {
    const discoverableOnly = (candidates: DirectoryCandidate[]) =>
      candidates.filter(c => c.visibilityMode !== 'private' && c.discoverable);
    switch (activeView) {
      case 'saved': return mockDirectoryCandidates.filter(c => savedCandidates.includes(c.id));
      case 'viewed': return mockDirectoryCandidates.filter(c => viewedCandidates.some(v => v.candidateId === c.id));
      case 'pipeline': return mockDirectoryCandidates.filter(c => c.id in pipelineCandidates);
      default: return discoverableOnly(mockDirectoryCandidates);
    }
  }, [activeView, savedCandidates, viewedCandidates, pipelineCandidates]);

  // Process candidates (search + filter + sort)
  const processedCandidates = useMemo(() => {
    let result = [...baseCandidates];

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(c => {
        const fields = [c.name, c.headline, c.currentPosition, c.company, c.industry, c.location, c.education, ...c.skills, ...c.languages].map(f => f.toLowerCase());
        return fields.some(f => f.includes(q));
      });
    }

    // Filters
    if (filters.industry !== 'all') result = result.filter(c => c.industry === filters.industry);
    if (filters.experience !== 'all') {
      const ranges: Record<string, [number, number]> = { entry: [0, 2], junior: [2, 4], mid: [4, 6], senior: [6, 10], lead: [10, 100] };
      const r = ranges[filters.experience];
      if (r) result = result.filter(c => c.experience >= r[0] && c.experience < r[1]);
    }
    if (filters.location !== 'all') result = result.filter(c => c.location === filters.location);
    if (filters.availability !== 'all') result = result.filter(c => c.availability === filters.availability);
    if (filters.skills.length > 0) result = result.filter(c => filters.skills.every(s => c.skills.some(cs => cs.toLowerCase() === s.toLowerCase())));
    if (filters.openToWork) result = result.filter(c => c.openToWork);
    if (filters.verified) result = result.filter(c => c.verified);
    if (filters.featured) result = result.filter(c => c.featured);
    if (filters.recentlyActive) result = result.filter(c => c.recentlyActive);
    result = result.filter(c => c.matchScore >= filters.minScore && c.matchScore <= filters.maxScore);

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'matchScore': cmp = a.matchScore - b.matchScore; break;
        case 'profileStrength': cmp = a.profileStrength - b.profileStrength; break;
        case 'experience': cmp = a.experience - b.experience; break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'lastActive': cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime(); break;
        case 'salaryExpectation': cmp = a.salaryExpectation - b.salaryExpectation; break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [baseCandidates, debouncedSearch, filters, sortField, sortOrder]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(processedCandidates.length / ITEMS_PER_PAGE));
  const paginatedCandidates = processedCandidates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Active filters for chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.industry !== 'all') chips.push({ key: 'industry', label: `${t('industry')}: ${filters.industry}` });
    if (filters.experience !== 'all') chips.push({ key: 'experience', label: `${t('experience')}: ${filters.experience}` });
    if (filters.location !== 'all') chips.push({ key: 'location', label: `${t('location')}: ${filters.location}` });
    if (filters.availability !== 'all') chips.push({ key: 'availability', label: `${t('availability')}: ${filters.availability}` });
    filters.skills.forEach(s => chips.push({ key: `skill_${s}`, label: s }));
    if (filters.openToWork) chips.push({ key: 'openToWork', label: t('open_to_work') });
    if (filters.verified) chips.push({ key: 'verified', label: t('verified') });
    if (filters.featured) chips.push({ key: 'featured', label: t('featured') });
    if (filters.recentlyActive) chips.push({ key: 'recentlyActive', label: t('recently_active') });
    if (filters.minScore > 0 || filters.maxScore < 100) chips.push({ key: 'score', label: `${t('match_score')}: ${filters.minScore}-${filters.maxScore}%` });
    return chips;
  }, [filters, t]);

  const removeFilter = useCallback((key: string) => {
    if (key === 'industry') setFilters(p => ({ ...p, industry: 'all' }));
    else if (key === 'experience') setFilters(p => ({ ...p, experience: 'all' }));
    else if (key === 'location') setFilters(p => ({ ...p, location: 'all' }));
    else if (key === 'availability') setFilters(p => ({ ...p, availability: 'all' }));
    else if (key.startsWith('skill_')) setFilters(p => ({ ...p, skills: p.skills.filter(s => s !== key.replace('skill_', '')) }));
    else if (key === 'openToWork') setFilters(p => ({ ...p, openToWork: false }));
    else if (key === 'verified') setFilters(p => ({ ...p, verified: false }));
    else if (key === 'featured') setFilters(p => ({ ...p, featured: false }));
    else if (key === 'recentlyActive') setFilters(p => ({ ...p, recentlyActive: false }));
    else if (key === 'score') setFilters(p => ({ ...p, minScore: 0, maxScore: 100 }));
  }, []);

  const clearAllFilters = () => {
    setFilters({ industry: 'all', experience: 'all', location: 'all', availability: 'all', skills: [], openToWork: false, verified: false, featured: false, recentlyActive: false, minScore: 0, maxScore: 100 });
    setSearchQuery('');
  };

  const handleView = (candidate: DirectoryCandidate) => {
    setSelectedCandidate(candidate);
    setProfileOpen(true);
    // Record view
    setViewedCandidates(prev => {
      const existing = prev.find(v => v.candidateId === candidate.id);
      if (existing) return prev.map(v => v.candidateId === candidate.id ? { ...v, viewedAt: new Date().toISOString(), viewCount: v.viewCount + 1 } : v);
      return [...prev, { candidateId: candidate.id, viewedAt: new Date().toISOString(), viewCount: 1 }];
    });
  };

  const handleSave = (id: string) => {
    setSavedCandidates(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    toast.success(savedCandidates.includes(id) ? t('candidate_removed') : t('candidate_saved'));
  };

  const handlePipeline = (id: string) => {
    setPipelineCandidates(prev => {
      if (id in prev) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: 'prospect' };
    });
    toast.success(t('added_to_pipeline'));
  };

  const handleContact = (candidate: DirectoryCandidate) => {
    if (companyTier === 'free') { toast.error(t('premium_required')); return; }
    toast.success(t('contact_request_sent'));
  };

  // View title
  const viewTitles: Record<DirectoryView, string> = {
    directory: t('candidate_directory'),
    saved: t('saved_candidates'),
    viewed: t('viewed_candidates'),
    contacts: t('contact_requests'),
    pipeline: t('talent_pipeline'),
  };

  // Pipeline view
  if (activeView === 'pipeline') {
    return (
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <h2 className="text-xl font-bold font-[Poppins] mb-6">{t('talent_pipeline')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE_STAGES.map(stage => {
            const stageCandidates = mockDirectoryCandidates.filter(c => pipelineCandidates[c.id] === stage.key);
            return (
              <div key={stage.key} className="border border-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs ms-auto">{stageCandidates.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageCandidates.map(c => (
                    <Card key={c.id} className="cursor-pointer hover:shadow-sm" onClick={() => handleView(c)}>
                      <CardContent className="p-2.5">
                        <p className="text-sm font-medium">{companyTier !== 'free' ? c.name : '🔒'}</p>
                        <p className="text-xs text-muted-foreground">{c.headline}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="outline" className="text-[10px]">{c.skills[0]}</Badge>
                          <span className="text-xs font-bold text-primary">{c.matchScore}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageCandidates.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{t('no_candidates')}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <CandidateProfileModal candidate={selectedCandidate} tier={companyTier} open={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold font-[Poppins]">{viewTitles[activeView]}</h2>
          {activeView === 'directory' && <p className="text-xs text-muted-foreground mt-0.5">{t('discover_talent_desc')}</p>}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('search_candidates')} isSearching={isSearching} />
          <Button variant={showFilters ? 'default' : 'outline'} size="sm" className="cursor-pointer gap-1 shrink-0" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3 h-3" />{t('filter')}
            {activeFilterChips.length > 0 && <span className="w-2 h-2 rounded-full bg-destructive" />}
          </Button>
          <div className="flex border border-border rounded-md">
            <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="sm" className="cursor-pointer h-8 w-8 p-0 rounded-e-none" onClick={() => setViewMode('card')}><LayoutGrid className="w-3.5 h-3.5" /></Button>
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" className="cursor-pointer h-8 w-8 p-0 rounded-s-none" onClick={() => setViewMode('table')}><List className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs mb-1 block">{t('industry')}</Label>
                <Select value={filters.industry} onValueChange={v => setFilters(p => ({ ...p, industry: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{ v: 'all', l: t('all') }, ...allIndustries.map(i => ({ v: i, l: i }))].map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">{t('experience')}</Label>
                <Select value={filters.experience} onValueChange={v => setFilters(p => ({ ...p, experience: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
              <div>
                <Label className="text-xs mb-1 block">{t('location')}</Label>
                <Select value={filters.location} onValueChange={v => setFilters(p => ({ ...p, location: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{ v: 'all', l: t('all') }, ...allLocations.map(l => ({ v: l, l }))].map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">{t('availability')}</Label>
                <Select value={filters.availability} onValueChange={v => setFilters(p => ({ ...p, availability: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="Immediate">{t('immediate')}</SelectItem>
                    <SelectItem value="2 Weeks">2 {t('weeks')}</SelectItem>
                    <SelectItem value="1 Month">1 {t('month')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Score Range */}
            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">{t('match_score')}:</Label>
              <Input type="number" min={0} max={100} value={filters.minScore} onChange={e => setFilters(p => ({ ...p, minScore: parseInt(e.target.value) || 0 }))} className="w-16 h-7 text-xs" />
              <span className="text-muted-foreground">—</span>
              <Input type="number" min={0} max={100} value={filters.maxScore} onChange={e => setFilters(p => ({ ...p, maxScore: parseInt(e.target.value) || 100 }))} className="w-16 h-7 text-xs" />
            </div>
            {/* Toggle Filters */}
            <div className="flex flex-wrap gap-2">
              {[{ key: 'openToWork', label: t('open_to_work') }, { key: 'verified', label: t('verified') }, { key: 'featured', label: t('featured') }, { key: 'recentlyActive', label: t('recently_active') }].map(f => (
                <Badge key={f.key} variant={(filters as any)[f.key] ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setFilters(p => ({ ...p, [f.key]: !(p as any)[f.key] }))}>{f.label}</Badge>
              ))}
            </div>
            {/* Skills */}
            <div>
              <Label className="text-xs mb-1 block">{t('skills')}</Label>
              <div className="flex flex-wrap gap-1.5">{allSkills.map(s => <Badge key={s} variant={filters.skills.includes(s) ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setFilters(p => ({ ...p, skills: p.skills.includes(s) ? p.skills.filter(x => x !== s) : [...p.skills, s] }))}>{s}</Badge>)}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Chips */}
      <FilterChips filters={activeFilterChips} onRemove={removeFilter} onClearAll={clearAllFilters} t={t} />

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{processedCandidates.length} {t('candidates')} {activeFilterChips.length > 0 || debouncedSearch ? `(${t('filtered')})` : ''}</p>
        <Select value={`${sortField}-${sortOrder}`} onValueChange={v => { const [f, o] = v.split('-'); setSortField(f); setSortOrder(o as 'asc' | 'desc'); }}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="matchScore-desc">{t('match_score')} ↓</SelectItem>
            <SelectItem value="matchScore-asc">{t('match_score')} ↑</SelectItem>
            <SelectItem value="profileStrength-desc">{t('profile_strength')} ↓</SelectItem>
            <SelectItem value="experience-desc">{t('experience')} ↓</SelectItem>
            <SelectItem value="experience-asc">{t('experience')} ↑</SelectItem>
            <SelectItem value="name-asc">{t('name')} A-Z</SelectItem>
            <SelectItem value="name-desc">{t('name')} Z-A</SelectItem>
            <SelectItem value="lastActive-desc">{t('recently_active')}</SelectItem>
            <SelectItem value="salaryExpectation-asc">{t('salary')} ↑</SelectItem>
            <SelectItem value="salaryExpectation-desc">{t('salary')} ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {paginatedCandidates.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">{t('no_candidates_found')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('try_different_search')}</p>
          {(activeFilterChips.length > 0 || searchQuery) && <Button variant="outline" size="sm" className="cursor-pointer mt-4" onClick={clearAllFilters}>{t('clear_filters')}</Button>}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedCandidates.map(c => (
            <CandidateCard key={c.id} candidate={c} tier={companyTier} onView={() => handleView(c)} onSave={() => handleSave(c.id)} onPipeline={() => handlePipeline(c.id)} onContact={() => handleContact(c)} isSaved={savedCandidates.includes(c.id)} />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-start font-medium">{t('candidate')}</th>
                <th className="p-3 text-start font-medium">{t('location')}</th>
                <th className="p-3 text-start font-medium">{t('experience')}</th>
                <th className="p-3 text-start font-medium">{t('skills')}</th>
                <th className="p-3 text-start font-medium">{t('match_score')}</th>
                <th className="p-3 text-start font-medium">{t('profile_strength')}</th>
                <th className="p-3 text-start font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCandidates.map(c => (
                <CandidateTableRow key={c.id} candidate={c} tier={companyTier} onView={() => handleView(c)} onSave={() => handleSave(c.id)} isSaved={savedCandidates.includes(c.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" className="cursor-pointer" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button key={page} variant={page === currentPage ? 'default' : 'ghost'} size="sm" className="cursor-pointer w-8 h-8 p-0" onClick={() => setCurrentPage(page)}>{page}</Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="cursor-pointer" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Subscription Banner for Free tier */}
      {companyTier === 'free' && activeView === 'directory' && (
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{t('unlock_full_directory')}</p>
              <p className="text-xs text-muted-foreground">{t('upgrade_directory_desc')}</p>
            </div>
            <Button className="cursor-pointer shrink-0">{t('upgrade_now')}</Button>
          </CardContent>
        </Card>
      )}

      {/* Profile Modal */}
      <CandidateProfileModal candidate={selectedCandidate} tier={companyTier} open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}