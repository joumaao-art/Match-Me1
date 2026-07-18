import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Shield, Lock, Globe, UserCheck, Crown, Star, Sparkles,
  TrendingUp, BarChart3, Users, Building2, Bookmark, Send, Bell,
  CheckCircle2, XCircle, Clock, AlertCircle, MessageSquare, Briefcase,
  Search, Heart, Target, Zap, Award, ChevronRight, Info
} from 'lucide-react';

// ============================================================
// Types & Permission System
// ============================================================

export type SeekerTier = 'free' | 'premium' | 'premium_plus';
export type VisibilityMode = 'public' | 'anonymous' | 'private';
export type ContactRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Permission-based feature flags - extensible for future plans
export interface SeekerPermissions {
  canBeDiscoverable: boolean;
  canSetVisibility: boolean;
  canReceiveContactRequests: boolean;
  canSeeProfileViews: boolean;
  canSeeExposureAnalytics: boolean;
  canBeRecommendedByAI: boolean;
  canBeFeatured: boolean;
  canSeeRecruiterEngagement: boolean;
  canSeeAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasFeaturedBadge: boolean;
  hasPriorityVisibility: boolean;
  hasHigherAIVisibility: boolean;
  hasFeaturedPlacement: boolean;
}

// Permission matrix - easy to extend with new plans
const PERMISSION_MATRIX: Record<string, SeekerPermissions> = {
  free: {
    canBeDiscoverable: false,
    canSetVisibility: false,
    canReceiveContactRequests: false,
    canSeeProfileViews: false,
    canSeeExposureAnalytics: false,
    canBeRecommendedByAI: false,
    canBeFeatured: false,
    canSeeRecruiterEngagement: false,
    canSeeAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasFeaturedBadge: false,
    hasPriorityVisibility: false,
    hasHigherAIVisibility: false,
    hasFeaturedPlacement: false,
  },
  premium: {
    canBeDiscoverable: true,
    canSetVisibility: true,
    canReceiveContactRequests: true,
    canSeeProfileViews: true,
    canSeeExposureAnalytics: true,
    canBeRecommendedByAI: true,
    canBeFeatured: false,
    canSeeRecruiterEngagement: false,
    canSeeAdvancedAnalytics: false,
    hasPrioritySupport: true,
    hasFeaturedBadge: false,
    hasPriorityVisibility: false,
    hasHigherAIVisibility: false,
    hasFeaturedPlacement: false,
  },
  premium_plus: {
    canBeDiscoverable: true,
    canSetVisibility: true,
    canReceiveContactRequests: true,
    canSeeProfileViews: true,
    canSeeExposureAnalytics: true,
    canBeRecommendedByAI: true,
    canBeFeatured: true,
    canSeeRecruiterEngagement: true,
    canSeeAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasFeaturedBadge: true,
    hasPriorityVisibility: true,
    hasHigherAIVisibility: true,
    hasFeaturedPlacement: true,
  },
  // Future plans - just add entries here
  // student: { ... },
  // graduate: { ... },
  // executive: { ... },
  // international: { ... },
  // vip: { ... },
};

export function getPermissions(tier: string): SeekerPermissions {
  return PERMISSION_MATRIX[tier] || PERMISSION_MATRIX.free;
}

interface ContactRequest {
  id: string;
  companyName: string;
  companyLogo?: string;
  recruiterName: string;
  jobTitle?: string;
  message?: string;
  status: ContactRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

interface ProfileView {
  id: string;
  companyName: string;
  companyLogo?: string;
  viewedAt: string;
  industry: string;
}

interface ExposureStats {
  profileViews: number;
  directoryImpressions: number;
  searchAppearances: number;
  aiRecommendations: number;
  savedByCompanies: number;
  contactRequests: number;
  interviewInvitations: number;
  jobOffers: number;
  profileCompletion: number;
  profileStrength: number;
  viewsTrend: number; // percentage change
  impressionsTrend: number;
}

// ============================================================
// Profile Visibility Settings (Premium/Premium+ only)
// ============================================================

export function ProfileVisibilitySettings({ tier }: { tier: SeekerTier }) {
  const { t } = useTranslation();
  const permissions = getPermissions(tier);

  const [settings, setSettings] = useState({
    discoverable: true,
    openToWork: true,
    visibilityMode: 'public' as VisibilityMode,
    hideCurrentEmployer: false,
    hideSalaryExpectations: false,
    allowContactRequests: true,
    allowAIRecommendations: true,
  });

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(t('settings_updated'));
  };

  const handleModeChange = (mode: VisibilityMode) => {
    setSettings(prev => ({ ...prev, visibilityMode: mode }));
    toast.success(t('visibility_mode_updated'));
  };

  // Free users see upgrade banner
  if (!permissions.canSetVisibility) {
    return (
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <h2 className="text-xl font-bold font-[Poppins] mb-2">{t('profile_visibility')}</h2>
        <p className="text-muted-foreground text-sm mb-6">{t('visibility_desc')}</p>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{t('premium_feature')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('upgrade_discoverability_desc')}</p>
            <Button className="cursor-pointer bg-primary">
              <Crown className="w-4 h-4 me-2" />{t('upgrade_to_premium')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold font-[Poppins]">{t('profile_visibility')}</h2>
        {permissions.hasFeaturedBadge && (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
            <Star className="w-3 h-3 me-1" />{t('featured_candidate')}
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-6">{t('visibility_desc')}</p>

      <div className="max-w-2xl space-y-6">
        {/* Discoverability Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              {t('discoverability')}
            </CardTitle>
            <CardDescription>{t('discoverability_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label className="font-medium">{t('discoverable_by_companies')}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t('discoverable_by_companies_desc')}</p>
              </div>
              <Switch
                checked={settings.discoverable}
                onCheckedChange={(v) => handleToggle('discoverable', v)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label className="font-medium">{t('open_to_work')}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t('open_to_work_desc')}</p>
              </div>
              <Switch
                checked={settings.openToWork}
                onCheckedChange={(v) => handleToggle('openToWork', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Visibility Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {t('visibility_mode')}
            </CardTitle>
            <CardDescription>{t('visibility_mode_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Public Mode */}
            <button
              onClick={() => handleModeChange('public')}
              className={`w-full p-4 rounded-lg border-2 text-start transition-all cursor-pointer ${
                settings.visibilityMode === 'public'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className={`w-5 h-5 ${settings.visibilityMode === 'public' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{t('public_mode')}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('public_mode_desc')}</p>
                </div>
                {settings.visibilityMode === 'public' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
            </button>

            {/* Anonymous Mode */}
            <button
              onClick={() => handleModeChange('anonymous')}
              className={`w-full p-4 rounded-lg border-2 text-start transition-all cursor-pointer ${
                settings.visibilityMode === 'anonymous'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                  : 'border-border hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <EyeOff className={`w-5 h-5 ${settings.visibilityMode === 'anonymous' ? 'text-amber-600' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{t('anonymous_mode')}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('anonymous_mode_desc')}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-[10px]">{t('skills_visible')}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{t('experience_visible')}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{t('education_visible')}</Badge>
                    <Badge variant="outline" className="text-[10px] text-amber-600">{t('identity_hidden')}</Badge>
                  </div>
                </div>
                {settings.visibilityMode === 'anonymous' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
              </div>
            </button>

            {/* Private Mode */}
            <button
              onClick={() => handleModeChange('private')}
              className={`w-full p-4 rounded-lg border-2 text-start transition-all cursor-pointer ${
                settings.visibilityMode === 'private'
                  ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                  : 'border-border hover:border-red-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock className={`w-5 h-5 ${settings.visibilityMode === 'private' ? 'text-red-600' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{t('private_mode')}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('private_mode_desc')}</p>
                </div>
                {settings.visibilityMode === 'private' && <CheckCircle2 className="w-5 h-5 text-red-600" />}
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Privacy Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              {t('privacy_controls')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t('hide_current_employer')}</Label>
              <Switch checked={settings.hideCurrentEmployer} onCheckedChange={(v) => handleToggle('hideCurrentEmployer', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('hide_salary_expectations')}</Label>
              <Switch checked={settings.hideSalaryExpectations} onCheckedChange={(v) => handleToggle('hideSalaryExpectations', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('allow_contact_requests')}</Label>
              <Switch checked={settings.allowContactRequests} onCheckedChange={(v) => handleToggle('allowContactRequests', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('allow_ai_recommendations')}</Label>
              <Switch checked={settings.allowAIRecommendations} onCheckedChange={(v) => handleToggle('allowAIRecommendations', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Featured Candidate Status (Premium+ only) */}
        {permissions.canBeFeatured && (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-600" />
                {t('featured_candidate')}
              </CardTitle>
              <CardDescription>{t('featured_candidate_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-background/40 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('featured_status_active')}</p>
                  <p className="text-xs text-muted-foreground">{t('featured_benefits_summary')}</p>
                </div>
                <Badge className="bg-amber-500 text-white">⭐ {t('active')}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-white/40 dark:bg-background/30 rounded">
                  <p className="text-lg font-bold text-amber-600">+15%</p>
                  <p className="text-[10px] text-muted-foreground">{t('visibility_boost')}</p>
                </div>
                <div className="text-center p-2 bg-white/40 dark:bg-background/30 rounded">
                  <p className="text-lg font-bold text-amber-600">⭐</p>
                  <p className="text-[10px] text-muted-foreground">{t('featured_badge')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Contact Requests Manager
// ============================================================

export function ContactRequestsView({ tier }: { tier: SeekerTier }) {
  const { t } = useTranslation();
  const permissions = getPermissions(tier);
  const [requests, setRequests] = useState<ContactRequest[]>([
    { id: '1', companyName: 'TechCorp Saudi', recruiterName: 'Ahmed Al-Rashid', jobTitle: 'Senior Frontend Developer', message: 'We are impressed by your profile and would like to discuss a senior role.', status: 'pending', createdAt: '2026-07-17T10:00:00Z' },
    { id: '2', companyName: 'InnovateTech', recruiterName: 'Sarah Johnson', jobTitle: 'Full Stack Engineer', message: 'Your skills match our team needs perfectly.', status: 'pending', createdAt: '2026-07-16T14:30:00Z' },
    { id: '3', companyName: 'DataDriven Co', recruiterName: 'Mohammed Ali', jobTitle: 'Lead Developer', status: 'accepted', createdAt: '2026-07-14T09:00:00Z', respondedAt: '2026-07-15T11:00:00Z' },
    { id: '4', companyName: 'StartupHub', recruiterName: 'Fatima Hassan', message: 'We have an exciting opportunity for you.', status: 'declined', createdAt: '2026-07-12T16:00:00Z', respondedAt: '2026-07-13T08:00:00Z' },
  ]);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  if (!permissions.canReceiveContactRequests) {
    return (
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <h2 className="text-xl font-bold font-[Poppins] mb-2">{t('contact_requests')}</h2>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mt-4">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{t('premium_feature')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('upgrade_contact_requests_desc')}</p>
            <Button className="cursor-pointer bg-primary">
              <Crown className="w-4 h-4 me-2" />{t('upgrade_to_premium')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAccept = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' as ContactRequestStatus, respondedAt: new Date().toISOString() } : r));
    toast.success(t('contact_request_accepted'));
    setDetailOpen(false);
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' as ContactRequestStatus, respondedAt: new Date().toISOString() } : r));
    toast.success(t('contact_request_declined'));
    setDetailOpen(false);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins]">{t('contact_requests')}</h2>
          <p className="text-sm text-muted-foreground">{t('contact_requests_desc')}</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-primary text-primary-foreground">{pendingCount} {t('pending')}</Badge>
        )}
      </div>

      <div className="space-y-3 max-w-3xl">
        {requests.map(request => (
          <Card key={request.id} className={`transition-all hover:shadow-md cursor-pointer ${request.status === 'pending' ? 'border-primary/30 bg-primary/5' : ''}`}
            onClick={() => { setSelectedRequest(request); setDetailOpen(true); }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{request.companyName}</span>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{request.recruiterName}</p>
                  {request.jobTitle && <p className="text-xs text-primary mt-0.5">{request.jobTitle}</p>}
                  {request.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{request.message}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {requests.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Send className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('no_contact_requests')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {t('contact_request')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{selectedRequest.companyName}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.recruiterName}</p>
                </div>
                {selectedRequest.jobTitle && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('position')}</Label>
                    <p className="text-sm font-medium">{selectedRequest.jobTitle}</p>
                  </div>
                )}
                {selectedRequest.message && (
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('message')}</Label>
                    <p className="text-sm">{selectedRequest.message}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </div>
              </div>
              {selectedRequest.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="cursor-pointer" onClick={() => handleDecline(selectedRequest.id)}>
                    <XCircle className="w-4 h-4 me-1" />{t('decline')}
                  </Button>
                  <Button className="cursor-pointer bg-primary" onClick={() => handleAccept(selectedRequest.id)}>
                    <CheckCircle2 className="w-4 h-4 me-1" />{t('accept')}
                  </Button>
                </DialogFooter>
              )}
              {selectedRequest.status !== 'pending' && (
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <StatusBadge status={selectedRequest.status} />
                  {selectedRequest.respondedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(selectedRequest.respondedAt).toLocaleString()}
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

function StatusBadge({ status }: { status: ContactRequestStatus }) {
  const { t } = useTranslation();
  const config = {
    pending: { label: t('pending'), className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
    accepted: { label: t('accepted'), className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' },
    declined: { label: t('declined'), className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' },
    expired: { label: t('expired'), className: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' },
  };
  const c = config[status];
  return <Badge className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

// ============================================================
// Candidate Exposure Dashboard
// ============================================================

export function ExposureDashboard({ tier }: { tier: SeekerTier }) {
  const { t } = useTranslation();
  const permissions = getPermissions(tier);

  const [stats] = useState<ExposureStats>({
    profileViews: 142,
    directoryImpressions: 1847,
    searchAppearances: 523,
    aiRecommendations: 89,
    savedByCompanies: 34,
    contactRequests: 12,
    interviewInvitations: 5,
    jobOffers: 2,
    profileCompletion: 92,
    profileStrength: 87,
    viewsTrend: 23,
    impressionsTrend: 15,
  });

  const [recentViews] = useState<ProfileView[]>([
    { id: '1', companyName: 'TechCorp Saudi', viewedAt: '2026-07-17T14:30:00Z', industry: 'Technology' },
    { id: '2', companyName: 'InnovateTech', viewedAt: '2026-07-17T10:15:00Z', industry: 'Software' },
    { id: '3', companyName: 'DataDriven Co', viewedAt: '2026-07-16T16:45:00Z', industry: 'Data Analytics' },
    { id: '4', companyName: 'CloudFirst', viewedAt: '2026-07-16T09:00:00Z', industry: 'Cloud Computing' },
    { id: '5', companyName: 'StartupHub', viewedAt: '2026-07-15T11:20:00Z', industry: 'Startups' },
  ]);

  if (!permissions.canSeeExposureAnalytics) {
    return (
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <h2 className="text-xl font-bold font-[Poppins] mb-2">{t('exposure_dashboard')}</h2>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mt-4">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{t('premium_feature')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('upgrade_exposure_desc')}</p>
            <Button className="cursor-pointer bg-primary">
              <Crown className="w-4 h-4 me-2" />{t('upgrade_to_premium')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold font-[Poppins]">{t('exposure_dashboard')}</h2>
          <p className="text-sm text-muted-foreground">{t('exposure_dashboard_desc')}</p>
        </div>
        {permissions.hasFeaturedBadge && (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
            <Star className="w-3 h-3 me-1" />⭐ {t('featured')}
          </Badge>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard icon={Eye} label={t('profile_views')} value={stats.profileViews} trend={stats.viewsTrend} />
        <MetricCard icon={Search} label={t('search_appearances')} value={stats.searchAppearances} trend={12} />
        <MetricCard icon={Bookmark} label={t('saved_by_companies')} value={stats.savedByCompanies} trend={8} />
        <MetricCard icon={Send} label={t('contact_requests')} value={stats.contactRequests} trend={-3} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard icon={Sparkles} label={t('ai_recommendations')} value={stats.aiRecommendations} trend={stats.impressionsTrend} />
        <MetricCard icon={Users} label={t('directory_impressions')} value={stats.directoryImpressions} trend={15} />
        <MetricCard icon={Briefcase} label={t('interview_invitations')} value={stats.interviewInvitations} trend={0} />
        <MetricCard icon={Award} label={t('job_offers')} value={stats.jobOffers} trend={100} />
      </div>

      {/* Profile Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('profile_completion')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={stats.profileCompletion} className="flex-1 h-2" />
              <span className="text-sm font-bold">{stats.profileCompletion}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('profile_strength')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={stats.profileStrength} className="flex-1 h-2" />
              <span className="text-sm font-bold">{stats.profileStrength}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Profile Views */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            {t('recent_profile_views')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentViews.map(view => (
              <div key={view.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{view.companyName}</p>
                  <p className="text-[10px] text-muted-foreground">{view.industry}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(view.viewedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recruiter Engagement (Premium+ only) */}
      {permissions.canSeeRecruiterEngagement && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t('recruiter_engagement')}
            </CardTitle>
            <CardDescription>{t('recruiter_engagement_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">8</p>
                <p className="text-[10px] text-muted-foreground">{t('talent_pipelines_added')}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">5</p>
                <p className="text-[10px] text-muted-foreground">{t('recruiter_industries')}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">React</p>
                <p className="text-[10px] text-muted-foreground">{t('top_searched_skill')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Banner for Premium (not Premium+) */}
      {!permissions.canSeeRecruiterEngagement && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="w-8 h-8 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{t('unlock_advanced_analytics')}</p>
              <p className="text-xs text-muted-foreground">{t('upgrade_to_premium_plus_desc')}</p>
            </div>
            <Button size="sm" className="cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shrink-0">
              <Crown className="w-3 h-3 me-1" />{t('upgrade')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend }: { icon: React.ElementType; label: string; value: number; trend: number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] text-muted-foreground truncate">{label}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-lg font-bold">{value.toLocaleString()}</span>
          {trend !== 0 && (
            <span className={`text-[10px] font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Recruiter Visibility View
// ============================================================

export function RecruiterVisibilityView({ tier }: { tier: SeekerTier }) {
  const { t } = useTranslation();
  const permissions = getPermissions(tier);

  if (!permissions.canSeeProfileViews) {
    return (
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <h2 className="text-xl font-bold font-[Poppins] mb-2">{t('who_viewed_profile')}</h2>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mt-4">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{t('premium_feature')}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t('upgrade_recruiter_visibility_desc')}</p>
            <Button className="cursor-pointer bg-primary">
              <Crown className="w-4 h-4 me-2" />{t('upgrade_to_premium')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const viewers = [
    { company: 'TechCorp Saudi', industry: 'Technology', time: '2 hours ago', saved: true, pipeline: true },
    { company: 'InnovateTech', industry: 'Software', time: '5 hours ago', saved: true, pipeline: false },
    { company: 'DataDriven Co', industry: 'Data Analytics', time: '1 day ago', saved: false, pipeline: false },
    { company: 'CloudFirst', industry: 'Cloud Computing', time: '2 days ago', saved: false, pipeline: true },
    { company: 'StartupHub', industry: 'Startups', time: '3 days ago', saved: false, pipeline: false },
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
      <h2 className="text-xl font-bold font-[Poppins] mb-2">{t('who_viewed_profile')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('who_viewed_profile_desc')}</p>

      <div className="max-w-3xl space-y-3">
        {viewers.map((v, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{v.company}</p>
                  <p className="text-xs text-muted-foreground">{v.industry}</p>
                </div>
                <div className="flex items-center gap-2">
                  {v.saved && <Badge variant="secondary" className="text-[10px]"><Bookmark className="w-2.5 h-2.5 me-0.5" />{t('saved_you')}</Badge>}
                  {v.pipeline && <Badge variant="secondary" className="text-[10px]"><Target className="w-2.5 h-2.5 me-0.5" />{t('in_pipeline')}</Badge>}
                  <span className="text-[10px] text-muted-foreground">{v.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Upgrade Banner Component (for Free users)
// ============================================================

export function DiscoverabilityUpgradeBanner() {
  const { t } = useTranslation();
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 mx-4 sm:mx-6 mt-4">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-start">
            <h3 className="text-base font-bold mb-1">{t('become_discoverable')}</h3>
            <p className="text-sm text-muted-foreground">{t('become_discoverable_desc')}</p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <Badge variant="secondary" className="text-[10px]"><Eye className="w-2.5 h-2.5 me-1" />{t('recruiter_visibility')}</Badge>
              <Badge variant="secondary" className="text-[10px]"><Send className="w-2.5 h-2.5 me-1" />{t('contact_requests')}</Badge>
              <Badge variant="secondary" className="text-[10px]"><BarChart3 className="w-2.5 h-2.5 me-1" />{t('analytics')}</Badge>
              <Badge variant="secondary" className="text-[10px]"><Sparkles className="w-2.5 h-2.5 me-1" />{t('ai_recommendations')}</Badge>
            </div>
          </div>
          <Button className="cursor-pointer bg-primary shrink-0">
            <Crown className="w-4 h-4 me-2" />{t('upgrade_to_premium')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Notification Preferences for Discoverability
// ============================================================

export function DiscoverabilityNotifications({ tier }: { tier: SeekerTier }) {
  const { t } = useTranslation();
  const permissions = getPermissions(tier);
  const [prefs, setPrefs] = useState({
    viewedByCompany: true,
    savedByCompany: true,
    addedToPipeline: true,
    contactRequest: true,
    acceptedContact: true,
    interviewInvitation: true,
    jobOffer: true,
    featuredActivated: true,
    featuredExpired: true,
    subscriptionExpiring: true,
    visibilityDisabled: true,
  });

  if (!permissions.canSeeProfileViews) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          {t('discoverability_notifications')}
        </CardTitle>
        <CardDescription>{t('discoverability_notifications_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('notify_viewed_by_company')}</Label>
          <Switch checked={prefs.viewedByCompany} onCheckedChange={(v) => setPrefs(p => ({...p, viewedByCompany: v}))} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('notify_saved_by_company')}</Label>
          <Switch checked={prefs.savedByCompany} onCheckedChange={(v) => setPrefs(p => ({...p, savedByCompany: v}))} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('notify_added_to_pipeline')}</Label>
          <Switch checked={prefs.addedToPipeline} onCheckedChange={(v) => setPrefs(p => ({...p, addedToPipeline: v}))} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('notify_contact_request')}</Label>
          <Switch checked={prefs.contactRequest} onCheckedChange={(v) => setPrefs(p => ({...p, contactRequest: v}))} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('notify_interview_invitation')}</Label>
          <Switch checked={prefs.interviewInvitation} onCheckedChange={(v) => setPrefs(p => ({...p, interviewInvitation: v}))} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('notify_job_offer')}</Label>
          <Switch checked={prefs.jobOffer} onCheckedChange={(v) => setPrefs(p => ({...p, jobOffer: v}))} />
        </div>
        {permissions.canBeFeatured && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('notify_featured_activated')}</Label>
              <Switch checked={prefs.featuredActivated} onCheckedChange={(v) => setPrefs(p => ({...p, featuredActivated: v}))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('notify_featured_expired')}</Label>
              <Switch checked={prefs.featuredExpired} onCheckedChange={(v) => setPrefs(p => ({...p, featuredExpired: v}))} />
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('notify_subscription_expiring')}</Label>
          <Switch checked={prefs.subscriptionExpiring} onCheckedChange={(v) => setPrefs(p => ({...p, subscriptionExpiring: v}))} />
        </div>
      </CardContent>
    </Card>
  );
}