/**
 * Profile Completion & Strength System
 * Reusable component for Job Seeker Dashboard, Profile, and Company Candidate View.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBreakdown } from '@/components/shared/ScoreVisualizationEngine';
import {
  CheckCircle2, Circle, User, Camera, FileText, Briefcase, GraduationCap,
  Star, Award, Layers, Sliders, DollarSign, Clock, Mail, Phone, MapPin,
  Languages as LanguagesIcon, Sparkles, TrendingUp, ChevronRight, Trophy
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

export interface ProfileData {
  hasPhoto: boolean;
  hasHeadline: boolean;
  hasAboutMe: boolean;
  hasLocation: boolean;
  hasPhone: boolean;
  hasVerifiedEmail: boolean;
  hasResume: boolean;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  languagesCount: number;
  certificatesCount: number;
  portfolioCount: number;
  hasJobPreferences: boolean;
  hasSalaryExpectations: boolean;
  hasAvailability: boolean;
  // Quality factors
  headlineLength?: number;
  aboutMeLength?: number;
  avgExperienceDescLength?: number;
  hasBasicInfo: boolean;
}

export interface ProfileCompletionResult {
  percentage: number;
  strength: number;
  strengthLevel: StrengthLevel;
  completionStatus: CompletionStatus;
  checklist: ChecklistItem[];
  recommendations: Recommendation[];
  milestoneMessage?: string;
}

export type StrengthLevel = 'needs_improvement' | 'fair' | 'strong' | 'excellent';
export type CompletionStatus = 'getting_started' | 'building_profile' | 'almost_ready' | 'nearly_complete' | 'profile_complete';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  icon: React.ReactNode;
  section: string;
  weight: number;
}

export interface Recommendation {
  id: string;
  message: string;
  section: string;
  priority: number;
}

// ============================================================
// Calculation Logic
// ============================================================

const WEIGHTS = {
  basicInfo: 10,
  photo: 5,
  headline: 5,
  aboutMe: 10,
  location: 5,
  phone: 5,
  verifiedEmail: 5,
  resume: 10,
  experience: 15,
  education: 10,
  skills: 10,
  languages: 5,
  certificates: 5,
  portfolio: 5,
  jobPreferences: 5,
  salaryExpectations: 2.5,
  availability: 2.5,
};

export function calculateProfileCompletion(data: ProfileData): ProfileCompletionResult {
  // Calculate completion percentage
  let completed = 0;
  if (data.hasBasicInfo) completed += WEIGHTS.basicInfo;
  if (data.hasPhoto) completed += WEIGHTS.photo;
  if (data.hasHeadline) completed += WEIGHTS.headline;
  if (data.hasAboutMe) completed += WEIGHTS.aboutMe;
  if (data.hasLocation) completed += WEIGHTS.location;
  if (data.hasPhone) completed += WEIGHTS.phone;
  if (data.hasVerifiedEmail) completed += WEIGHTS.verifiedEmail;
  if (data.hasResume) completed += WEIGHTS.resume;
  if (data.experienceCount > 0) completed += WEIGHTS.experience;
  if (data.educationCount > 0) completed += WEIGHTS.education;
  if (data.skillsCount >= 3) completed += WEIGHTS.skills;
  if (data.languagesCount > 0) completed += WEIGHTS.languages;
  if (data.certificatesCount > 0) completed += WEIGHTS.certificates;
  if (data.portfolioCount > 0) completed += WEIGHTS.portfolio;
  if (data.hasJobPreferences) completed += WEIGHTS.jobPreferences;
  if (data.hasSalaryExpectations) completed += WEIGHTS.salaryExpectations;
  if (data.hasAvailability) completed += WEIGHTS.availability;

  const percentage = Math.min(100, Math.round(completed));

  // Calculate strength (quality-aware)
  let qualityBonus = 0;
  if (data.headlineLength && data.headlineLength > 20) qualityBonus += 3;
  if (data.aboutMeLength && data.aboutMeLength > 100) qualityBonus += 5;
  if (data.aboutMeLength && data.aboutMeLength > 200) qualityBonus += 3;
  if (data.experienceCount >= 2) qualityBonus += 5;
  if (data.experienceCount >= 3) qualityBonus += 3;
  if (data.avgExperienceDescLength && data.avgExperienceDescLength > 50) qualityBonus += 4;
  if (data.skillsCount >= 5) qualityBonus += 4;
  if (data.skillsCount >= 8) qualityBonus += 3;
  if (data.certificatesCount >= 2) qualityBonus += 3;
  if (data.portfolioCount >= 2) qualityBonus += 3;
  if (data.languagesCount >= 2) qualityBonus += 2;

  const rawStrength = percentage * 0.7 + Math.min(qualityBonus, 30);
  const strength = Math.min(100, Math.round(rawStrength));

  // Determine strength level
  let strengthLevel: StrengthLevel;
  if (strength < 40) strengthLevel = 'needs_improvement';
  else if (strength < 60) strengthLevel = 'fair';
  else if (strength < 85) strengthLevel = 'strong';
  else strengthLevel = 'excellent';

  // Determine completion status
  let completionStatus: CompletionStatus;
  if (percentage <= 25) completionStatus = 'getting_started';
  else if (percentage <= 50) completionStatus = 'building_profile';
  else if (percentage <= 75) completionStatus = 'almost_ready';
  else if (percentage < 100) completionStatus = 'nearly_complete';
  else completionStatus = 'profile_complete';

  // Build checklist
  const checklist: ChecklistItem[] = [
    { id: 'basic_info', label: 'pc_basic_info', completed: data.hasBasicInfo, icon: <User className="w-4 h-4" />, section: 'profile', weight: WEIGHTS.basicInfo },
    { id: 'photo', label: 'pc_photo', completed: data.hasPhoto, icon: <Camera className="w-4 h-4" />, section: 'profile', weight: WEIGHTS.photo },
    { id: 'headline', label: 'pc_headline', completed: data.hasHeadline, icon: <Star className="w-4 h-4" />, section: 'profile', weight: WEIGHTS.headline },
    { id: 'about_me', label: 'pc_about_me', completed: data.hasAboutMe, icon: <User className="w-4 h-4" />, section: 'profile', weight: WEIGHTS.aboutMe },
    { id: 'location', label: 'pc_location', completed: data.hasLocation, icon: <MapPin className="w-4 h-4" />, section: 'profile', weight: WEIGHTS.location },
    { id: 'phone', label: 'pc_phone', completed: data.hasPhone, icon: <Phone className="w-4 h-4" />, section: 'profile', weight: WEIGHTS.phone },
    { id: 'verified_email', label: 'pc_verified_email', completed: data.hasVerifiedEmail, icon: <Mail className="w-4 h-4" />, section: 'settings', weight: WEIGHTS.verifiedEmail },
    { id: 'resume', label: 'pc_resume', completed: data.hasResume, icon: <FileText className="w-4 h-4" />, section: 'cv', weight: WEIGHTS.resume },
    { id: 'experience', label: 'pc_experience', completed: data.experienceCount > 0, icon: <Briefcase className="w-4 h-4" />, section: 'experience', weight: WEIGHTS.experience },
    { id: 'education', label: 'pc_education', completed: data.educationCount > 0, icon: <GraduationCap className="w-4 h-4" />, section: 'education', weight: WEIGHTS.education },
    { id: 'skills', label: 'pc_skills', completed: data.skillsCount >= 3, icon: <Star className="w-4 h-4" />, section: 'skills', weight: WEIGHTS.skills },
    { id: 'languages', label: 'pc_languages', completed: data.languagesCount > 0, icon: <LanguagesIcon className="w-4 h-4" />, section: 'languages', weight: WEIGHTS.languages },
    { id: 'certificates', label: 'pc_certificates', completed: data.certificatesCount > 0, icon: <Award className="w-4 h-4" />, section: 'certificates', weight: WEIGHTS.certificates },
    { id: 'portfolio', label: 'pc_portfolio', completed: data.portfolioCount > 0, icon: <Layers className="w-4 h-4" />, section: 'portfolio', weight: WEIGHTS.portfolio },
    { id: 'preferences', label: 'pc_preferences', completed: data.hasJobPreferences, icon: <Sliders className="w-4 h-4" />, section: 'preferences', weight: WEIGHTS.jobPreferences },
    { id: 'salary', label: 'pc_salary', completed: data.hasSalaryExpectations, icon: <DollarSign className="w-4 h-4" />, section: 'preferences', weight: WEIGHTS.salaryExpectations },
    { id: 'availability', label: 'pc_availability', completed: data.hasAvailability, icon: <Clock className="w-4 h-4" />, section: 'preferences', weight: WEIGHTS.availability },
  ];

  // Build recommendations (incomplete items sorted by weight)
  const recommendations: Recommendation[] = checklist
    .filter(item => !item.completed)
    .sort((a, b) => b.weight - a.weight)
    .map((item, i) => ({
      id: item.id,
      message: `pc_rec_${item.id}`,
      section: item.section,
      priority: i,
    }));

  // Milestone message
  let milestoneMessage: string | undefined;
  if (percentage >= 100) milestoneMessage = 'pc_milestone_100';
  else if (percentage >= 75) milestoneMessage = 'pc_milestone_75';
  else if (percentage >= 50) milestoneMessage = 'pc_milestone_50';
  else if (percentage >= 25) milestoneMessage = 'pc_milestone_25';

  return { percentage, strength, strengthLevel, completionStatus, checklist, recommendations, milestoneMessage };
}

// ============================================================
// Strength Colors & Icons
// ============================================================

function getStrengthConfig(level: StrengthLevel) {
  switch (level) {
    case 'needs_improvement':
      return { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950/30', border: 'border-red-200', icon: '🟥', progressColor: 'bg-red-500' };
    case 'fair':
      return { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950/30', border: 'border-amber-200', icon: '🟨', progressColor: 'bg-amber-500' };
    case 'strong':
      return { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950/30', border: 'border-blue-200', icon: '🟦', progressColor: 'bg-blue-500' };
    case 'excellent':
      return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950/30', border: 'border-green-200', icon: '🟩', progressColor: 'bg-green-500' };
  }
}

// ============================================================
// Components
// ============================================================

/**
 * Full Profile Completion Card with progress bar, checklist, and recommendations.
 * Used on Job Seeker Dashboard and Profile pages.
 */
export function ProfileCompletionCard({
  profileData,
  onNavigateToSection,
  compact = false,
}: {
  profileData: ProfileData;
  onNavigateToSection: (section: string) => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const result = useMemo(() => calculateProfileCompletion(profileData), [profileData]);
  const strengthConfig = getStrengthConfig(result.strengthLevel);

  return (
    <Card className="overflow-hidden">
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold font-[Poppins] text-sm">{t('pc_title')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-[Poppins] text-primary">{result.percentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={result.percentage} className="h-3 mb-2" />

        {/* Status & Strength */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">{t(result.completionStatus)}</span>
          <Badge variant="outline" className={`text-xs gap-1 ${strengthConfig.color} ${strengthConfig.border}`}>
            <span>{strengthConfig.icon}</span>
            {t(`strength_${result.strengthLevel}`)}
          </Badge>
        </div>

        {/* Matching Impact */}
        <p className="text-xs text-muted-foreground mb-4 italic">{t('pc_matching_impact')}</p>

        {/* Milestone */}
        {result.milestoneMessage && result.percentage === 100 && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">{t(result.milestoneMessage)}</span>
          </div>
        )}
        {result.milestoneMessage && result.percentage < 100 && result.percentage >= 25 && (
          <p className="text-xs text-primary font-medium mb-3">{t(result.milestoneMessage)}</p>
        )}

        {!compact && (
          <>
            {/* Checklist */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('pc_checklist')}</h4>
              {result.checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => !item.completed && onNavigateToSection(item.section)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-start transition-colors ${
                    item.completed
                      ? 'text-muted-foreground'
                      : 'hover:bg-muted cursor-pointer'
                  }`}
                  disabled={item.completed}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${item.completed ? 'line-through opacity-60' : ''}`}>
                    {t(item.label)}
                  </span>
                  {!item.completed && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </button>
              ))}
            </div>

            {/* AI Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />{t('pc_recommendations')}
                </h4>
                {result.recommendations.slice(0, 5).map(rec => (
                  <button
                    key={rec.id}
                    onClick={() => onNavigateToSection(rec.section)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-start hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-xs text-foreground flex-1">{t(rec.message)}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact Profile Strength Badge for use in headers, cards, etc.
 */
export function ProfileStrengthBadge({ profileData }: { profileData: ProfileData }) {
  const { t } = useTranslation();
  const result = useMemo(() => calculateProfileCompletion(profileData), [profileData]);
  const config = getStrengthConfig(result.strengthLevel);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <span>{config.icon}</span>
      <span>{t(`strength_${result.strengthLevel}`)}</span>
    </div>
  );
}

/**
 * Mini Progress Indicator (for dashboard stat cards).
 */
export function ProfileCompletionMini({ profileData, onNavigateToSection }: { profileData: ProfileData; onNavigateToSection: (section: string) => void }) {
  const { t } = useTranslation();
  const result = useMemo(() => calculateProfileCompletion(profileData), [profileData]);
  const config = getStrengthConfig(result.strengthLevel);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigateToSection('profile')}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{t('pc_title')}</span>
          <span className="text-sm font-bold text-primary">{result.percentage}%</span>
        </div>
        <Progress value={result.percentage} className="h-2 mb-2" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t(result.completionStatus)}</span>
          <span className={`text-xs font-medium ${config.color}`}>{config.icon} {t(`strength_${result.strengthLevel}`)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Company/Recruiter View - Shows candidate's profile completion and strength.
 * Does NOT expose internal scoring logic.
 */
export function CandidateProfileStrength({ profileData }: { profileData: ProfileData }) {
  const { t } = useTranslation();
  const result = useMemo(() => calculateProfileCompletion(profileData), [profileData]);
  const config = getStrengthConfig(result.strengthLevel);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{t('pc_title')}</span>
          <span className="text-sm font-bold font-[Poppins]">{result.percentage}%</span>
        </div>
        <Progress value={result.percentage} className="h-1.5" />
      </div>
      <Badge variant="outline" className={`text-[10px] gap-0.5 ${config.color} ${config.border}`}>
        {config.icon} {t(`strength_${result.strengthLevel}`)}
      </Badge>
    </div>
  );
}

/**
 * Admin Analytics Summary Card
 */
export function AdminProfileAnalytics({ profiles }: { profiles: ProfileData[] }) {
  const { t } = useTranslation();

  const analytics = useMemo(() => {
    if (profiles.length === 0) return null;
    const results = profiles.map(p => calculateProfileCompletion(p));
    const avgCompletion = Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length);
    const avgStrength = Math.round(results.reduce((sum, r) => sum + r.strength, 0) / results.length);
    const below50 = results.filter(r => r.percentage < 50).length;
    const above90 = results.filter(r => r.percentage > 90).length;

    const strengthDist = {
      needs_improvement: results.filter(r => r.strengthLevel === 'needs_improvement').length,
      fair: results.filter(r => r.strengthLevel === 'fair').length,
      strong: results.filter(r => r.strengthLevel === 'strong').length,
      excellent: results.filter(r => r.strengthLevel === 'excellent').length,
    };

    // Most commonly incomplete sections
    const incompleteCounts: Record<string, number> = {};
    results.forEach(r => {
      r.checklist.filter(c => !c.completed).forEach(c => {
        incompleteCounts[c.id] = (incompleteCounts[c.id] || 0) + 1;
      });
    });
    const topIncomplete = Object.entries(incompleteCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, count, percentage: Math.round((count / profiles.length) * 100) }));

    return { avgCompletion, avgStrength, below50, above90, strengthDist, topIncomplete, total: profiles.length };
  }, [profiles]);

  if (!analytics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-[Poppins] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          {t('admin_profile_analytics')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold text-primary font-[Poppins]">{analytics.avgCompletion}%</p>
            <p className="text-[10px] text-muted-foreground">{t('admin_avg_completion')}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold text-blue-600 font-[Poppins]">{analytics.avgStrength}%</p>
            <p className="text-[10px] text-muted-foreground">{t('admin_avg_strength')}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold text-red-600 font-[Poppins]">{analytics.below50}</p>
            <p className="text-[10px] text-muted-foreground">{t('admin_below_50')}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold text-green-600 font-[Poppins]">{analytics.above90}</p>
            <p className="text-[10px] text-muted-foreground">{t('admin_above_90')}</p>
          </div>
        </div>

        {/* Strength Distribution */}
        <div>
          <p className="text-xs font-medium mb-2">{t('admin_strength_distribution')}</p>
          <div className="flex gap-1 h-6">
            {analytics.strengthDist.needs_improvement > 0 && <div className="bg-red-500 rounded-sm" style={{ flex: analytics.strengthDist.needs_improvement }} title={`Needs Improvement: ${analytics.strengthDist.needs_improvement}`} />}
            {analytics.strengthDist.fair > 0 && <div className="bg-amber-500 rounded-sm" style={{ flex: analytics.strengthDist.fair }} title={`Fair: ${analytics.strengthDist.fair}`} />}
            {analytics.strengthDist.strong > 0 && <div className="bg-blue-500 rounded-sm" style={{ flex: analytics.strengthDist.strong }} title={`Strong: ${analytics.strengthDist.strong}`} />}
            {analytics.strengthDist.excellent > 0 && <div className="bg-green-500 rounded-sm" style={{ flex: analytics.strengthDist.excellent }} title={`Excellent: ${analytics.strengthDist.excellent}`} />}
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
            <span>🟥 {analytics.strengthDist.needs_improvement}</span>
            <span>🟨 {analytics.strengthDist.fair}</span>
            <span>🟦 {analytics.strengthDist.strong}</span>
            <span>🟩 {analytics.strengthDist.excellent}</span>
          </div>
        </div>

        {/* Top Incomplete Sections */}
        <div>
          <p className="text-xs font-medium mb-2">{t('admin_top_incomplete')}</p>
          <ScoreBreakdown
            items={analytics.topIncomplete.map(item => ({
              label: t(`pc_${item.id}`),
              value: item.percentage / 100,
              colorClass: 'bg-red-400',
            }))}
            layout="auto"
            barSize="sm"
            labelSize="xs"
            animated
            showPercentage
          />
        </div>
      </CardContent>
    </Card>
  );
}