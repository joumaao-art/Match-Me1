import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Sparkles, Brain, Target, TrendingUp, BarChart3, Users, Building2,
  Bookmark, Send, Bell, CheckCircle2, XCircle, Clock, AlertCircle,
  MessageSquare, Briefcase, Search, Heart, Star, Award, ChevronRight,
  Info, Crown, Zap, Eye, Shield, Lock, Globe, UserCheck, Plus, X,
  FolderOpen, Tag, GripVertical, MoreHorizontal, Edit, Trash2,
  ArrowRight, Calendar, MapPin, DollarSign, FileText, Mail,
  ThumbsUp, ThumbsDown, BookmarkPlus, Filter, SortAsc
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

export type CompanyTier = 'starter' | 'premium' | 'enterprise';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'saved' | 'expired';
export type PipelineStage = 'new_prospect' | 'reviewed' | 'interesting' | 'contact_requested' | 'invitation_sent' | 'invitation_accepted' | 'interview_planned' | 'future_hiring' | 'high_priority' | 'archived';

interface AIMatchFactor {
  factor: string;
  score: number;
  weight: number;
  explanation: string;
}

interface AIRecommendation {
  id: string;
  candidateId: string;
  candidateName: string;
  title: string;
  skills: string[];
  experience: number;
  location: string;
  matchScore: number;
  factors: AIMatchFactor[];
  reason: string;
  availability: string;
  salary: string;
  profileStrength: number;
  isNew: boolean;
  recommendedAt: string;
}

interface Invitation {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  recruiterName: string;
  message?: string;
  status: InvitationStatus;
  sentAt: string;
  respondedAt?: string;
  expiresAt: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
}

interface CandidateFolder {
  id: string;
  name: string;
  color: string;
  count: number;
  isCustom: boolean;
}

interface CandidateTag {
  id: string;
  label: string;
  color: string;
}

interface RecruiterNote {
  id: string;
  candidateId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PipelineCandidate {
  id: string;
  name: string;
  title: string;
  stage: PipelineStage;
  matchScore: number;
  tags: CandidateTag[];
  assignedTo?: string;
  lastActivity: string;
  notes: number;
  daysInStage: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  assignedCandidates: number;
}

// ============================================================
// AI Recommendation Engine
// ============================================================

export function AIRecommendationsView({ tier }: { tier: CompanyTier }) {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([
    {
      id: '1', candidateId: 'c1', candidateName: 'Ahmed Al-Rashid', title: 'Senior Frontend Developer',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js'],
      experience: 7, location: 'Riyadh, Saudi Arabia', matchScore: 96,
      factors: [
        { factor: 'skills_match', score: 98, weight: 0.25, explanation: '5/5 required skills matched' },
        { factor: 'experience_match', score: 95, weight: 0.15, explanation: '7 years matches 5-8 requirement' },
        { factor: 'industry_match', score: 90, weight: 0.10, explanation: 'SaaS/Technology background' },
        { factor: 'education_match', score: 85, weight: 0.08, explanation: 'CS degree from top university' },
        { factor: 'language_match', score: 100, weight: 0.07, explanation: 'Arabic + English fluent' },
        { factor: 'availability_match', score: 100, weight: 0.10, explanation: 'Immediately available' },
        { factor: 'location_match', score: 95, weight: 0.08, explanation: 'Same city' },
        { factor: 'salary_compatibility', score: 88, weight: 0.07, explanation: 'Within budget range' },
        { factor: 'profile_strength', score: 92, weight: 0.05, explanation: 'Strong profile completion' },
        { factor: 'activity_level', score: 90, weight: 0.05, explanation: 'Active in last 24h' },
      ],
      reason: 'Perfect skills match with strong local experience in SaaS products',
      availability: 'Immediately', salary: '25,000 - 30,000 SAR', profileStrength: 92,
      isNew: true, recommendedAt: '2026-07-18T08:00:00Z',
    },
    {
      id: '2', candidateId: 'c2', candidateName: 'Sarah Johnson', title: 'Full Stack Engineer',
      skills: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
      experience: 5, location: 'Jeddah, Saudi Arabia', matchScore: 91,
      factors: [
        { factor: 'skills_match', score: 90, weight: 0.25, explanation: '4/5 required skills matched' },
        { factor: 'experience_match', score: 88, weight: 0.15, explanation: '5 years matches requirement' },
        { factor: 'industry_match', score: 85, weight: 0.10, explanation: 'Fintech background' },
        { factor: 'remote_preference', score: 95, weight: 0.08, explanation: 'Open to hybrid' },
        { factor: 'employment_type', score: 100, weight: 0.07, explanation: 'Full-time preferred' },
        { factor: 'profile_completion', score: 95, weight: 0.05, explanation: '95% complete profile' },
      ],
      reason: 'Strong full-stack skills with fintech domain expertise',
      availability: '2 weeks notice', salary: '20,000 - 25,000 SAR', profileStrength: 95,
      isNew: true, recommendedAt: '2026-07-18T07:30:00Z',
    },
    {
      id: '3', candidateId: 'c3', candidateName: 'Mohammed Ali', title: 'Lead Developer',
      skills: ['React', 'TypeScript', 'Python', 'System Design', 'Team Lead'],
      experience: 10, location: 'Riyadh, Saudi Arabia', matchScore: 88,
      factors: [
        { factor: 'skills_match', score: 85, weight: 0.25, explanation: '4/5 skills + leadership' },
        { factor: 'experience_match', score: 100, weight: 0.15, explanation: '10 years exceeds requirement' },
        { factor: 'hiring_history', score: 80, weight: 0.05, explanation: 'Similar to past successful hires' },
      ],
      reason: 'Experienced leader with architecture skills, overqualified but strong culture fit',
      availability: '1 month notice', salary: '35,000 - 40,000 SAR', profileStrength: 88,
      isNew: false, recommendedAt: '2026-07-17T14:00:00Z',
    },
    {
      id: '4', candidateId: 'c4', candidateName: 'Fatima Hassan', title: 'Frontend Developer',
      skills: ['React', 'Vue.js', 'CSS', 'Figma', 'UX'],
      experience: 4, location: 'Dubai, UAE', matchScore: 84,
      factors: [
        { factor: 'skills_match', score: 82, weight: 0.25, explanation: '3/5 skills matched' },
        { factor: 'location_match', score: 70, weight: 0.08, explanation: 'Willing to relocate' },
        { factor: 'culture_fit', score: 90, weight: 0.05, explanation: 'Design-oriented mindset' },
      ],
      reason: 'Strong design sense with frontend skills, open to relocation',
      availability: 'Immediately', salary: '18,000 - 22,000 SAR', profileStrength: 80,
      isNew: false, recommendedAt: '2026-07-16T10:00:00Z',
    },
  ]);
  const [selectedRec, setSelectedRec] = useState<AIRecommendation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const newCount = recommendations.filter(r => r.isNew).length;

  const handleDismiss = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
    toast.success(t('recommendation_dismissed'));
  };

  const handleSave = (id: string) => {
    toast.success(t('candidate_saved'));
  };

  const handleInvite = (rec: AIRecommendation) => {
    setSelectedRec(rec);
    setInviteDialogOpen(true);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            {t('ai_recommendations')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('ai_recommendations_desc')}</p>
        </div>
        {newCount > 0 && (
          <Badge className="bg-primary text-primary-foreground animate-pulse">
            {newCount} {t('new')}
          </Badge>
        )}
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-4 max-w-4xl">
        {recommendations.map(rec => (
          <Card key={rec.id} className={`transition-all hover:shadow-lg cursor-pointer ${rec.isNew ? 'border-primary/30 bg-primary/5' : ''}`}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">{rec.candidateName.charAt(0)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{rec.candidateName}</span>
                    {rec.isNew && <Badge className="bg-green-100 text-green-700 text-[10px]">{t('new')}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.title} • {rec.experience} {t('years')}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{rec.location}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rec.skills.slice(0, 4).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                    ))}
                    {rec.skills.length > 4 && (
                      <Badge variant="outline" className="text-[10px]">+{rec.skills.length - 4}</Badge>
                    )}
                  </div>

                  {/* AI Reason */}
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />{rec.reason}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{rec.availability}</span>
                    <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" />{rec.salary}</span>
                    <span className="flex items-center gap-0.5"><Award className="w-2.5 h-2.5" />{rec.profileStrength}%</span>
                  </div>
                </div>

                {/* Match Score + Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${rec.matchScore >= 90 ? 'text-green-600' : rec.matchScore >= 80 ? 'text-primary' : 'text-amber-600'}`}>
                      {rec.matchScore}%
                    </div>
                    <p className="text-[9px] text-muted-foreground">{t('ai_match')}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSave(rec.id); }}>
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDismiss(rec.id); }}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" className="h-7 px-2 cursor-pointer bg-primary text-[10px]" onClick={(e) => { e.stopPropagation(); handleInvite(rec); }}>
                      <Send className="w-3 h-3 me-1" />{t('invite')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {recommendations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('no_recommendations_yet')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('ai_learning_preferences')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Match Score Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedRec && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  {t('ai_match_breakdown')}
                </DialogTitle>
                <DialogDescription>{selectedRec.candidateName} - {selectedRec.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{selectedRec.matchScore}%</p>
                  <p className="text-xs text-muted-foreground">{t('overall_ai_match_score')}</p>
                </div>
                {selectedRec.factors.map((factor, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-8 text-center">
                      <span className={`text-sm font-bold ${factor.score >= 90 ? 'text-green-600' : factor.score >= 70 ? 'text-primary' : 'text-amber-600'}`}>
                        {factor.score}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{t(factor.factor)}</p>
                      <p className="text-[10px] text-muted-foreground">{factor.explanation}</p>
                    </div>
                    <Progress value={factor.score} className="w-16 h-1.5" />
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite to Apply Dialog */}
      <InviteToApplyDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        candidate={selectedRec}
      />
    </div>
  );
}

// ============================================================
// Invite to Apply Dialog (Company sends invitation)
// ============================================================

function InviteToApplyDialog({ open, onOpenChange, candidate }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: AIRecommendation | null;
}) {
  const { t } = useTranslation();
  const [selectedJob, setSelectedJob] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const mockJobs = [
    { id: 'j1', title: 'Senior Frontend Developer', location: 'Riyadh', type: 'Full-time', salary: '25K-35K SAR' },
    { id: 'j2', title: 'Full Stack Engineer', location: 'Jeddah', type: 'Full-time', salary: '20K-30K SAR' },
    { id: 'j3', title: 'React Developer', location: 'Remote', type: 'Contract', salary: '150-200 SAR/hr' },
  ];

  const handleSend = async () => {
    if (!selectedJob) { toast.error(t('select_job_first')); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    toast.success(t('invitation_sent_success'));
    onOpenChange(false);
    setSelectedJob('');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            {t('invite_to_apply')}
          </DialogTitle>
          <DialogDescription>
            {candidate ? `${t('inviting')} ${candidate.candidateName}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Select Job */}
          <div>
            <Label className="text-xs font-medium">{t('select_job_opening')}</Label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('choose_job')} />
              </SelectTrigger>
              <SelectContent>
                {mockJobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    <div>
                      <span className="font-medium">{job.title}</span>
                      <span className="text-muted-foreground text-xs ms-2">{job.location} • {job.type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Preview */}
          {selectedJob && (
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                {(() => {
                  const job = mockJobs.find(j => j.id === selectedJob);
                  return job ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{job.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />{job.location}
                        <Briefcase className="w-3 h-3 ms-2" />{job.type}
                        <DollarSign className="w-3 h-3 ms-2" />{job.salary}
                      </div>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          )}

          {/* Personal Message */}
          <div>
            <Label className="text-xs font-medium">{t('personal_message_optional')}</Label>
            <textarea
              className="w-full mt-1 p-2 text-sm border rounded-md resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t('invitation_message_placeholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Expiration */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('invitation_expires_in_7_days')}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button className="cursor-pointer bg-primary" onClick={handleSend} disabled={sending}>
            {sending ? <Clock className="w-4 h-4 me-1 animate-spin" /> : <Send className="w-4 h-4 me-1" />}
            {t('send_invitation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Company Invitations Manager
// ============================================================

export function CompanyInvitationsView({ tier }: { tier: CompanyTier }) {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<Invitation[]>([
    { id: '1', candidateId: 'c1', candidateName: 'Ahmed Al-Rashid', jobId: 'j1', jobTitle: 'Senior Frontend Developer', recruiterName: 'HR Team', message: 'We were impressed by your profile...', status: 'pending', sentAt: '2026-07-18T09:00:00Z', expiresAt: '2026-07-25T09:00:00Z', location: 'Riyadh', employmentType: 'Full-time', salaryRange: '25K-35K SAR' },
    { id: '2', candidateId: 'c2', candidateName: 'Sarah Johnson', jobId: 'j2', jobTitle: 'Full Stack Engineer', recruiterName: 'HR Team', status: 'accepted', sentAt: '2026-07-16T14:00:00Z', respondedAt: '2026-07-17T10:00:00Z', expiresAt: '2026-07-23T14:00:00Z', location: 'Jeddah', employmentType: 'Full-time' },
    { id: '3', candidateId: 'c3', candidateName: 'Mohammed Ali', jobId: 'j1', jobTitle: 'Senior Frontend Developer', recruiterName: 'HR Team', status: 'declined', sentAt: '2026-07-14T11:00:00Z', respondedAt: '2026-07-15T08:00:00Z', expiresAt: '2026-07-21T11:00:00Z', location: 'Riyadh', employmentType: 'Full-time' },
    { id: '4', candidateId: 'c4', candidateName: 'Fatima Hassan', jobId: 'j3', jobTitle: 'React Developer', recruiterName: 'HR Team', status: 'expired', sentAt: '2026-07-05T10:00:00Z', expiresAt: '2026-07-12T10:00:00Z', location: 'Remote', employmentType: 'Contract' },
  ]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = filterStatus === 'all' ? invitations : invitations.filter(i => i.status === filterStatus);
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === 'pending').length,
    accepted: invitations.filter(i => i.status === 'accepted').length,
    declined: invitations.filter(i => i.status === 'declined').length,
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            {t('invitations_sent')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('invitations_sent_desc')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">{t('total_sent')}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('pending')}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground">{t('pending')}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('accepted')}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-600">{stats.accepted}</p>
            <p className="text-[10px] text-muted-foreground">{t('accepted')}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('declined')}>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-red-600">{stats.declined}</p>
            <p className="text-[10px] text-muted-foreground">{t('declined')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invitation List */}
      <div className="space-y-3 max-w-4xl">
        {filtered.map(inv => (
          <Card key={inv.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{inv.candidateName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{inv.candidateName}</span>
                    <InvitationStatusBadge status={inv.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{inv.jobTitle}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <MapPin className="w-2.5 h-2.5" />{inv.location}
                    <Briefcase className="w-2.5 h-2.5 ms-1" />{inv.employmentType}
                    {inv.salaryRange && <><DollarSign className="w-2.5 h-2.5 ms-1" />{inv.salaryRange}</>}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-[10px] text-muted-foreground">{t('sent')}: {new Date(inv.sentAt).toLocaleDateString()}</p>
                  {inv.respondedAt && (
                    <p className="text-[10px] text-muted-foreground">{t('responded')}: {new Date(inv.respondedAt).toLocaleDateString()}</p>
                  )}
                  {inv.status === 'pending' && (
                    <p className="text-[10px] text-amber-600">{t('expires')}: {new Date(inv.expiresAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const { t } = useTranslation();
  const config: Record<InvitationStatus, { label: string; className: string }> = {
    pending: { label: t('pending'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    accepted: { label: t('accepted'), className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    declined: { label: t('declined'), className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
    saved: { label: t('saved'), className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    expired: { label: t('expired'), className: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' },
  };
  const c = config[status];
  return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

// ============================================================
// Enhanced Saved Candidates with Folders
// ============================================================

export function EnhancedSavedCandidatesView({ tier }: { tier: CompanyTier }) {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<CandidateFolder[]>([
    { id: '1', name: 'Engineering', color: '#3B82F6', count: 12, isCustom: false },
    { id: '2', name: 'Marketing', color: '#10B981', count: 5, isCustom: false },
    { id: '3', name: 'Finance', color: '#F59E0B', count: 3, isCustom: false },
    { id: '4', name: 'Sales', color: '#EF4444', count: 8, isCustom: false },
    { id: '5', name: 'Executive', color: '#8B5CF6', count: 2, isCustom: false },
    { id: '6', name: 'Future Hiring', color: '#6366F1', count: 15, isCustom: false },
    { id: '7', name: 'Arabic Speakers', color: '#14B8A6', count: 7, isCustom: true },
    { id: '8', name: 'Remote Ready', color: '#EC4899', count: 9, isCustom: true },
  ]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#14B8A6', '#EC4899'];
    setFolders(prev => [...prev, {
      id: Date.now().toString(),
      name: newFolderName,
      color: colors[Math.floor(Math.random() * colors.length)],
      count: 0,
      isCustom: true,
    }]);
    setNewFolderName('');
    setNewFolderDialog(false);
    toast.success(t('folder_created'));
  };

  const handleDeleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    toast.success(t('folder_deleted'));
  };

  const totalSaved = folders.reduce((sum, f) => sum + f.count, 0);

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            {t('saved_candidates')}
          </h2>
          <p className="text-sm text-muted-foreground">{totalSaved} {t('candidates_saved_total')}</p>
        </div>
        <Button size="sm" className="cursor-pointer bg-primary" onClick={() => setNewFolderDialog(true)}>
          <Plus className="w-4 h-4 me-1" />{t('new_folder')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('search_folders')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {folders
          .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(folder => (
          <Card key={folder.id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => setActiveFolder(folder.id)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${folder.color}20` }}>
                    <FolderOpen className="w-4 h-4" style={{ color: folder.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{folder.name}</p>
                    <p className="text-[10px] text-muted-foreground">{folder.count} {t('candidates')}</p>
                  </div>
                </div>
                {folder.isCustom && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('create_new_folder')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={t('folder_name')}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setNewFolderDialog(false)}>{t('cancel')}</Button>
            <Button className="cursor-pointer bg-primary" onClick={handleCreateFolder}>{t('create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Advanced Talent Pipeline (10 stages)
// ============================================================

export function AdvancedTalentPipelineView({ tier }: { tier: CompanyTier }) {
  const { t } = useTranslation();
  const stages: { id: PipelineStage; label: string; color: string }[] = [
    { id: 'new_prospect', label: t('new_prospect'), color: '#6B7280' },
    { id: 'reviewed', label: t('reviewed'), color: '#3B82F6' },
    { id: 'interesting', label: t('interesting'), color: '#8B5CF6' },
    { id: 'contact_requested', label: t('contact_requested'), color: '#F59E0B' },
    { id: 'invitation_sent', label: t('invitation_sent'), color: '#EC4899' },
    { id: 'invitation_accepted', label: t('invitation_accepted'), color: '#10B981' },
    { id: 'interview_planned', label: t('interview_planned'), color: '#06B6D4' },
    { id: 'future_hiring', label: t('future_hiring'), color: '#6366F1' },
    { id: 'high_priority', label: t('high_priority'), color: '#EF4444' },
    { id: 'archived', label: t('archived'), color: '#9CA3AF' },
  ];

  const [candidates, setCandidates] = useState<PipelineCandidate[]>([
    { id: '1', name: 'Ahmed Al-Rashid', title: 'Senior Frontend Dev', stage: 'interesting', matchScore: 96, tags: [{ id: 't1', label: 'Urgent', color: '#EF4444' }, { id: 't2', label: 'Frontend', color: '#3B82F6' }], assignedTo: 'HR Team', lastActivity: '2h ago', notes: 3, daysInStage: 2 },
    { id: '2', name: 'Sarah Johnson', title: 'Full Stack Engineer', stage: 'invitation_sent', matchScore: 91, tags: [{ id: 't3', label: 'Leadership', color: '#8B5CF6' }], assignedTo: 'HR Team', lastActivity: '5h ago', notes: 1, daysInStage: 1 },
    { id: '3', name: 'Mohammed Ali', title: 'Lead Developer', stage: 'interview_planned', matchScore: 88, tags: [{ id: 't4', label: 'Executive', color: '#F59E0B' }], lastActivity: '1d ago', notes: 5, daysInStage: 3 },
    { id: '4', name: 'Fatima Hassan', title: 'Frontend Developer', stage: 'new_prospect', matchScore: 84, tags: [{ id: 't5', label: 'Graduate', color: '#10B981' }], lastActivity: '3d ago', notes: 0, daysInStage: 5 },
    { id: '5', name: 'Omar Khalid', title: 'Backend Engineer', stage: 'reviewed', matchScore: 87, tags: [{ id: 't6', label: 'Immediate Joiner', color: '#EC4899' }], lastActivity: '1d ago', notes: 2, daysInStage: 1 },
    { id: '6', name: 'Layla Ahmed', title: 'DevOps Engineer', stage: 'contact_requested', matchScore: 82, tags: [], lastActivity: '2d ago', notes: 1, daysInStage: 4 },
    { id: '7', name: 'Khalid Mansour', title: 'Data Engineer', stage: 'high_priority', matchScore: 93, tags: [{ id: 't7', label: 'Arabic Speaker', color: '#14B8A6' }, { id: 't1', label: 'Urgent', color: '#EF4444' }], assignedTo: 'CTO', lastActivity: '30m ago', notes: 7, daysInStage: 1 },
    { id: '8', name: 'Noor Salim', title: 'UX Designer', stage: 'future_hiring', matchScore: 79, tags: [{ id: 't8', label: 'Relocation', color: '#6366F1' }], lastActivity: '5d ago', notes: 1, daysInStage: 10 },
  ]);

  const [selectedCandidate, setSelectedCandidate] = useState<PipelineCandidate | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const handleMoveStage = (candidateId: string, newStage: PipelineStage) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: newStage, daysInStage: 0 } : c));
    toast.success(t('candidate_moved'));
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedCandidate) return;
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, notes: c.notes + 1 } : c));
    setNewNote('');
    setNoteDialogOpen(false);
    toast.success(t('note_added'));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {t('talent_pipeline')}
          </h2>
          <p className="text-sm text-muted-foreground">{candidates.length} {t('candidates_in_pipeline')}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setViewMode('kanban')}>
            <GripVertical className="w-3.5 h-3.5 me-1" />{t('kanban')}
          </Button>
          <Button size="sm" variant={viewMode === 'list' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setViewMode('list')}>
            <SortAsc className="w-3.5 h-3.5 me-1" />{t('list')}
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageCandidates = candidates.filter(c => c.stage === stage.id);
            return (
              <div key={stage.id} className="min-w-[240px] max-w-[280px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ backgroundColor: `${stage.color}10` }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-medium truncate">{stage.label}</span>
                  <Badge variant="secondary" className="text-[9px] ms-auto">{stageCandidates.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageCandidates.map(candidate => (
                    <Card key={candidate.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => { setSelectedCandidate(candidate); setNoteDialogOpen(true); }}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">{candidate.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{candidate.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{candidate.title}</p>
                          </div>
                          <span className={`text-[10px] font-bold ${candidate.matchScore >= 90 ? 'text-green-600' : 'text-primary'}`}>
                            {candidate.matchScore}%
                          </span>
                        </div>
                        {/* Tags */}
                        {candidate.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {candidate.tags.map(tag => (
                              <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Meta */}
                        <div className="flex items-center justify-between mt-2 text-[9px] text-muted-foreground">
                          <span>{candidate.lastActivity}</span>
                          <div className="flex items-center gap-1">
                            {candidate.notes > 0 && <span className="flex items-center gap-0.5"><FileText className="w-2.5 h-2.5" />{candidate.notes}</span>}
                            {candidate.assignedTo && <span className="flex items-center gap-0.5"><UserCheck className="w-2.5 h-2.5" />{candidate.assignedTo}</span>}
                          </div>
                        </div>
                        {/* Stage Move */}
                        <div className="flex gap-1 mt-2">
                          <Select onValueChange={(v) => handleMoveStage(candidate.id, v as PipelineStage)}>
                            <SelectTrigger className="h-6 text-[9px]">
                              <SelectValue placeholder={t('move_to')} />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.filter(s => s.id !== stage.id).map(s => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2 max-w-4xl">
          {candidates.sort((a, b) => b.matchScore - a.matchScore).map(candidate => {
            const stage = stages.find(s => s.id === candidate.stage);
            return (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedCandidate(candidate); setNoteDialogOpen(true); }}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{candidate.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{candidate.name}</span>
                        <span className={`text-[10px] font-bold ${candidate.matchScore >= 90 ? 'text-green-600' : 'text-primary'}`}>{candidate.matchScore}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{candidate.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {candidate.tags.slice(0, 2).map(tag => (
                        <span key={tag.id} className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>{tag.label}</span>
                      ))}
                      {stage && (
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: stage.color, color: stage.color }}>
                          {stage.label}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{candidate.daysInStage}d</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedCandidate?.name} - {t('notes')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Existing Notes */}
            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedCandidate && selectedCandidate.notes > 0 && (
                <>
                  <div className="p-2 bg-muted/50 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">HR Team</span>
                      <span className="text-[10px] text-muted-foreground">2h ago</span>
                    </div>
                    <p className="text-muted-foreground">{t('strong_candidate_note')}</p>
                  </div>
                </>
              )}
            </div>
            {/* Add Note */}
            <textarea
              className="w-full p-2 text-sm border rounded-md resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t('add_note_placeholder')}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setNoteDialogOpen(false)}>{t('close')}</Button>
            <Button className="cursor-pointer bg-primary" onClick={handleAddNote} disabled={!newNote.trim()}>
              <Plus className="w-4 h-4 me-1" />{t('add_note')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Team Collaboration (Enterprise)
// ============================================================

export function TeamCollaborationView({ tier }: { tier: CompanyTier }) {
  const { t } = useTranslation();

  const [team] = useState<TeamMember[]>([
    { id: '1', name: 'Ahmed (HR Manager)', role: 'admin', assignedCandidates: 15 },
    { id: '2', name: 'Sarah (Recruiter)', role: 'recruiter', assignedCandidates: 23 },
    { id: '3', name: 'Mohammed (Hiring Manager)', role: 'hiring_manager', assignedCandidates: 8 },
    { id: '4', name: 'Fatima (Junior Recruiter)', role: 'recruiter', assignedCandidates: 12 },
  ]);

  const [activityFeed] = useState([
    { id: '1', user: 'Sarah', action: 'moved_to_interview', candidate: 'Ahmed Al-Rashid', time: '2h ago' },
    { id: '2', user: 'Mohammed', action: 'added_note', candidate: 'Sarah Johnson', time: '3h ago' },
    { id: '3', user: 'Ahmed', action: 'sent_invitation', candidate: 'Omar Khalid', time: '5h ago' },
    { id: '4', user: 'Fatima', action: 'saved_candidate', candidate: 'Layla Ahmed', time: '1d ago' },
    { id: '5', user: 'Sarah', action: 'approved_hire', candidate: 'Khalid Mansour', time: '1d ago' },
  ]);

  if (tier !== 'enterprise') {
    return (
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <h2 className="text-xl font-bold font-[Poppins] mb-2">{t('team_collaboration')}</h2>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mt-4">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{t('enterprise_feature')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('team_collaboration_upgrade_desc')}</p>
            <Button className="cursor-pointer bg-primary">
              <Crown className="w-4 h-4 me-2" />{t('upgrade_to_enterprise')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        {t('team_collaboration')}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('team_members')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{member.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{member.assignedCandidates} {t('assigned')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('activity_feed')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityFeed.map(activity => (
              <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-primary">{activity.user.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{t(activity.action)}</span>{' '}
                    <span className="font-medium">{activity.candidate}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{activity.time}</p>
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
// Company Talent Analytics
// ============================================================

export function TalentAnalyticsView({ tier }: { tier: CompanyTier }) {
  const { t } = useTranslation();

  const metrics = [
    { label: t('candidate_searches'), value: 1247, trend: 12, icon: Search },
    { label: t('directory_views'), value: 3891, trend: 8, icon: Eye },
    { label: t('saved_candidates'), value: 156, trend: 15, icon: Bookmark },
    { label: t('contact_requests'), value: 45, trend: -3, icon: Send },
    { label: t('invitations_sent'), value: 32, trend: 20, icon: Mail },
    { label: t('invitations_accepted'), value: 18, trend: 25, icon: CheckCircle2 },
    { label: t('invitations_declined'), value: 8, trend: -10, icon: XCircle },
    { label: t('pipeline_size'), value: 89, trend: 5, icon: Target },
    { label: t('interviews_scheduled'), value: 12, trend: 33, icon: Calendar },
    { label: t('offers_made'), value: 5, trend: 0, icon: FileText },
    { label: t('hires'), value: 3, trend: 50, icon: UserCheck },
    { label: t('recruiter_productivity'), value: 87, trend: 4, icon: TrendingUp },
    { label: t('hiring_conversion_rate'), value: 9.4, trend: 2, icon: BarChart3 },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary" />
        {t('talent_analytics')}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl">
        {metrics.map((metric, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <metric.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground truncate">{metric.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold">
                  {typeof metric.value === 'number' && metric.value > 100
                    ? metric.value.toLocaleString()
                    : metric.label.includes('rate') ? `${metric.value}%` : metric.value}
                </span>
                {metric.trend !== 0 && (
                  <span className={`text-[10px] font-medium ${metric.trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {metric.trend > 0 ? '↑' : '↓'}{Math.abs(metric.trend)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Funnel */}
      <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm">{t('hiring_funnel')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { stage: t('directory_views'), count: 3891, pct: 100 },
              { stage: t('saved_candidates'), count: 156, pct: 4 },
              { stage: t('contact_requests'), count: 45, pct: 1.2 },
              { stage: t('invitations_sent'), count: 32, pct: 0.8 },
              { stage: t('invitations_accepted'), count: 18, pct: 0.5 },
              { stage: t('interviews_scheduled'), count: 12, pct: 0.3 },
              { stage: t('offers_made'), count: 5, pct: 0.13 },
              { stage: t('hires'), count: 3, pct: 0.08 },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-36 truncate">{item.stage}</span>
                <div className="flex-1">
                  <div className="h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                      style={{ width: `${Math.max(item.pct, 2)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium w-12 text-end">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}