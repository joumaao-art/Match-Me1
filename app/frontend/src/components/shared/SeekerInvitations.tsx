import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Send, CheckCircle2, XCircle, Clock, Building2, MapPin, Briefcase,
  DollarSign, BookmarkPlus, ArrowRight, Calendar, Mail, Star, Eye,
  TrendingUp, BarChart3, Award, Search, Heart, Users, Sparkles,
  FileText, Bell, Target, Zap
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'saved' | 'expired';

interface ReceivedInvitation {
  id: string;
  companyName: string;
  companyLogo?: string;
  recruiterName: string;
  jobTitle: string;
  jobSummary: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  message?: string;
  status: InvitationStatus;
  sentAt: string;
  respondedAt?: string;
  expiresAt: string;
  matchScore?: number;
}

// ============================================================
// Job Seeker Invitations View
// ============================================================

export function SeekerInvitationsView() {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([
    {
      id: '1', companyName: 'TechCorp Saudi', recruiterName: 'Ahmed Al-Rashid',
      jobTitle: 'Senior Frontend Developer', jobSummary: 'Join our growing team building next-gen SaaS products. Work with React, TypeScript, and modern web technologies.',
      location: 'Riyadh, Saudi Arabia', employmentType: 'Full-time', salaryRange: '25,000 - 35,000 SAR',
      message: 'We were impressed by your profile and believe you would be a great fit for our team. We would love to discuss this opportunity with you.',
      status: 'pending', sentAt: '2026-07-18T09:00:00Z', expiresAt: '2026-07-25T09:00:00Z', matchScore: 96,
    },
    {
      id: '2', companyName: 'InnovateTech', recruiterName: 'Sarah Johnson',
      jobTitle: 'Full Stack Engineer', jobSummary: 'Build scalable fintech solutions serving millions of users across the MENA region.',
      location: 'Jeddah, Saudi Arabia', employmentType: 'Full-time', salaryRange: '20,000 - 30,000 SAR',
      status: 'pending', sentAt: '2026-07-17T14:00:00Z', expiresAt: '2026-07-24T14:00:00Z', matchScore: 91,
    },
    {
      id: '3', companyName: 'DataDriven Co', recruiterName: 'Mohammed Ali',
      jobTitle: 'React Developer', jobSummary: 'Work on data visualization dashboards and analytics platforms.',
      location: 'Remote', employmentType: 'Contract', salaryRange: '150-200 SAR/hr',
      message: 'Your React expertise caught our attention. Would you be interested in a contract role?',
      status: 'saved', sentAt: '2026-07-15T10:00:00Z', expiresAt: '2026-07-22T10:00:00Z', matchScore: 84,
    },
    {
      id: '4', companyName: 'CloudFirst', recruiterName: 'Fatima Hassan',
      jobTitle: 'Frontend Lead', jobSummary: 'Lead a team of 5 frontend developers building cloud management tools.',
      location: 'Riyadh, Saudi Arabia', employmentType: 'Full-time', salaryRange: '30,000 - 40,000 SAR',
      status: 'accepted', sentAt: '2026-07-12T11:00:00Z', respondedAt: '2026-07-13T09:00:00Z', expiresAt: '2026-07-19T11:00:00Z', matchScore: 88,
    },
    {
      id: '5', companyName: 'StartupHub', recruiterName: 'Omar Khalid',
      jobTitle: 'Senior Developer', jobSummary: 'Join an early-stage startup building AI-powered recruitment tools.',
      location: 'Dubai, UAE', employmentType: 'Full-time',
      status: 'declined', sentAt: '2026-07-10T08:00:00Z', respondedAt: '2026-07-11T15:00:00Z', expiresAt: '2026-07-17T08:00:00Z',
    },
    {
      id: '6', companyName: 'MegaCorp', recruiterName: 'Layla Ahmed',
      jobTitle: 'Web Developer', jobSummary: 'Maintain and improve corporate web presence.',
      location: 'Dammam, Saudi Arabia', employmentType: 'Full-time',
      status: 'expired', sentAt: '2026-07-01T10:00:00Z', expiresAt: '2026-07-08T10:00:00Z',
    },
  ]);

  const [selectedInvitation, setSelectedInvitation] = useState<ReceivedInvitation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleAccept = (id: string) => {
    setInvitations(prev => prev.map(inv =>
      inv.id === id ? { ...inv, status: 'accepted' as InvitationStatus, respondedAt: new Date().toISOString() } : inv
    ));
    toast.success(t('invitation_accepted_success'));
    setDetailOpen(false);
  };

  const handleDecline = (id: string) => {
    setInvitations(prev => prev.map(inv =>
      inv.id === id ? { ...inv, status: 'declined' as InvitationStatus, respondedAt: new Date().toISOString() } : inv
    ));
    toast.success(t('invitation_declined'));
    setDetailOpen(false);
  };

  const handleSaveForLater = (id: string) => {
    setInvitations(prev => prev.map(inv =>
      inv.id === id ? { ...inv, status: 'saved' as InvitationStatus } : inv
    ));
    toast.success(t('invitation_saved'));
    setDetailOpen(false);
  };

  const filteredInvitations = activeTab === 'all'
    ? invitations
    : invitations.filter(inv => inv.status === activeTab);

  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const savedCount = invitations.filter(i => i.status === 'saved').length;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {t('invitations_to_apply')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('invitations_to_apply_desc')}</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-primary text-primary-foreground animate-pulse">
            {pendingCount} {t('new')}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">{t('all')} ({invitations.length})</TabsTrigger>
          <TabsTrigger value="pending">{t('pending')} ({pendingCount})</TabsTrigger>
          <TabsTrigger value="saved">{t('saved')} ({savedCount})</TabsTrigger>
          <TabsTrigger value="accepted">{t('accepted')}</TabsTrigger>
          <TabsTrigger value="declined">{t('declined')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Invitation List */}
      <div className="space-y-3 max-w-4xl">
        {filteredInvitations.map(inv => (
          <Card
            key={inv.id}
            className={`transition-all hover:shadow-lg cursor-pointer ${inv.status === 'pending' ? 'border-primary/30 bg-primary/5' : ''}`}
            onClick={() => { setSelectedInvitation(inv); setDetailOpen(true); }}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                {/* Company Avatar */}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{inv.jobTitle}</span>
                    <InvStatusBadge status={inv.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{inv.companyName} • {inv.recruiterName}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inv.jobSummary}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{inv.location}</span>
                    <span className="flex items-center gap-0.5"><Briefcase className="w-2.5 h-2.5" />{inv.employmentType}</span>
                    {inv.salaryRange && <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" />{inv.salaryRange}</span>}
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {inv.matchScore && (
                    <div className="text-center">
                      <div className={`text-sm font-bold ${inv.matchScore >= 90 ? 'text-green-600' : 'text-primary'}`}>
                        {inv.matchScore}%
                      </div>
                      <p className="text-[9px] text-muted-foreground">{t('match')}</p>
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground text-end">
                    {inv.status === 'pending' && (
                      <span className="text-amber-600">{t('expires')} {new Date(inv.expiresAt).toLocaleDateString()}</span>
                    )}
                    {inv.status !== 'pending' && (
                      <span>{new Date(inv.sentAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInvitations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('no_invitations')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('no_invitations_desc')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invitation Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedInvitation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {t('invitation_details')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Company & Job */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-sm">{selectedInvitation.jobTitle}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedInvitation.companyName}</p>
                  <p className="text-xs text-muted-foreground">{t('recruiter')}: {selectedInvitation.recruiterName}</p>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('location')}</p>
                      <p className="text-xs font-medium">{selectedInvitation.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t('type')}</p>
                      <p className="text-xs font-medium">{selectedInvitation.employmentType}</p>
                    </div>
                  </div>
                  {selectedInvitation.salaryRange && (
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded col-span-2">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('salary_range')}</p>
                        <p className="text-xs font-medium">{selectedInvitation.salaryRange}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Summary */}
                <div>
                  <p className="text-xs font-medium mb-1">{t('job_summary')}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvitation.jobSummary}</p>
                </div>

                {/* Personal Message */}
                {selectedInvitation.message && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs font-medium text-primary mb-1">{t('personal_message')}</p>
                    <p className="text-sm">{selectedInvitation.message}</p>
                  </div>
                )}

                {/* Match Score */}
                {selectedInvitation.matchScore && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs font-medium">{t('ai_match_score')}: {selectedInvitation.matchScore}%</p>
                      <p className="text-[10px] text-muted-foreground">{t('high_compatibility_with_profile')}</p>
                    </div>
                  </div>
                )}

                {/* Expiration */}
                {selectedInvitation.status === 'pending' && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('expires_on')} {new Date(selectedInvitation.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedInvitation.status === 'pending' && (
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="cursor-pointer" onClick={() => handleDecline(selectedInvitation.id)}>
                    <XCircle className="w-4 h-4 me-1" />{t('decline')}
                  </Button>
                  <Button variant="outline" className="cursor-pointer" onClick={() => handleSaveForLater(selectedInvitation.id)}>
                    <BookmarkPlus className="w-4 h-4 me-1" />{t('save_for_later')}
                  </Button>
                  <Button className="cursor-pointer bg-primary" onClick={() => handleAccept(selectedInvitation.id)}>
                    <CheckCircle2 className="w-4 h-4 me-1" />{t('accept_and_view_job')}
                  </Button>
                </DialogFooter>
              )}
              {selectedInvitation.status === 'saved' && (
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="cursor-pointer" onClick={() => handleDecline(selectedInvitation.id)}>
                    <XCircle className="w-4 h-4 me-1" />{t('decline')}
                  </Button>
                  <Button className="cursor-pointer bg-primary" onClick={() => handleAccept(selectedInvitation.id)}>
                    <CheckCircle2 className="w-4 h-4 me-1" />{t('accept_and_view_job')}
                  </Button>
                </DialogFooter>
              )}
              {(selectedInvitation.status === 'accepted' || selectedInvitation.status === 'declined' || selectedInvitation.status === 'expired') && (
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <InvStatusBadge status={selectedInvitation.status} />
                  {selectedInvitation.respondedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t('responded_on')} {new Date(selectedInvitation.respondedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Enhanced Job Seeker Analytics
// ============================================================

export function SeekerCareerAnalyticsView() {
  const { t } = useTranslation();

  const metrics = [
    { label: t('profile_views'), value: 284, trend: 18, icon: Eye },
    { label: t('search_appearances'), value: 1523, trend: 12, icon: Search },
    { label: t('directory_impressions'), value: 4891, trend: 8, icon: Users },
    { label: t('ai_recommendations'), value: 156, trend: 25, icon: Sparkles },
    { label: t('contact_requests'), value: 23, trend: 15, icon: Send },
    { label: t('invitations_received'), value: 12, trend: 33, icon: Mail },
    { label: t('interview_invitations'), value: 5, trend: 20, icon: Calendar },
    { label: t('offers_received'), value: 2, trend: 100, icon: Award },
    { label: t('resume_views'), value: 89, trend: 10, icon: FileText },
    { label: t('resume_downloads'), value: 34, trend: 5, icon: FileText },
    { label: t('profile_saves'), value: 67, trend: 22, icon: Heart },
    { label: t('featured_performance'), value: 45, trend: 30, icon: Star },
  ];

  // Weekly trend data (simulated)
  const weeklyData = [
    { day: t('mon'), views: 42, searches: 180 },
    { day: t('tue'), views: 38, searches: 165 },
    { day: t('wed'), views: 55, searches: 220 },
    { day: t('thu'), views: 48, searches: 195 },
    { day: t('fri'), views: 35, searches: 150 },
    { day: t('sat'), views: 28, searches: 120 },
    { day: t('sun'), views: 38, searches: 145 },
  ];

  const maxViews = Math.max(...weeklyData.map(d => d.views));

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        {t('career_analytics')}
      </h2>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map((metric, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <metric.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground truncate">{metric.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold">{metric.value.toLocaleString()}</span>
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

      {/* Weekly Trend Chart */}
      <Card className="mb-6 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm">{t('weekly_profile_views')}</CardTitle>
          <CardDescription>{t('last_7_days_performance')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  <div
                    className="w-full max-w-8 bg-gradient-to-t from-primary to-primary/60 rounded-t transition-all"
                    style={{ height: `${(day.views / maxViews) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{day.day}</span>
                <span className="text-[9px] font-medium">{day.views}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Companies Viewing */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm">{t('top_companies_viewing')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'TechCorp Saudi', views: 12, industry: 'Technology', saved: true },
              { name: 'InnovateTech', views: 8, industry: 'Software', saved: true },
              { name: 'DataDriven Co', views: 6, industry: 'Data Analytics', saved: false },
              { name: 'CloudFirst', views: 5, industry: 'Cloud Computing', saved: false },
              { name: 'StartupHub', views: 4, industry: 'Startups', saved: true },
            ].map((company, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{company.name}</p>
                  <p className="text-[10px] text-muted-foreground">{company.industry}</p>
                </div>
                <div className="flex items-center gap-2">
                  {company.saved && <Badge variant="secondary" className="text-[9px]"><Heart className="w-2.5 h-2.5 me-0.5" />{t('saved_you')}</Badge>}
                  <span className="text-xs font-medium text-primary">{company.views} {t('views')}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Status Badge Helper
// ============================================================

function InvStatusBadge({ status }: { status: InvitationStatus }) {
  const { t } = useTranslation();
  const config: Record<InvitationStatus, { label: string; className: string }> = {
    pending: { label: t('pending'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    accepted: { label: t('accepted'), className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    declined: { label: t('declined'), className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
    saved: { label: t('saved_for_later'), className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
    expired: { label: t('expired'), className: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' },
  };
  const c = config[status];
  return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}