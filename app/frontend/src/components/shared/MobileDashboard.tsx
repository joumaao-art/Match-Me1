/**
 * Mobile-Optimized Dashboard for Job Seekers
 * 
 * Follows Mobile First, Desktop Enhanced philosophy.
 * Clear information hierarchy with progressive disclosure.
 * 
 * Sections (in priority order):
 * 1. Greeting + AI Match Score
 * 2. Quick Actions
 * 3. Statistics (compact 2x2 grid)
 * 4. Today's Recommendation (collapsible)
 * 5. Profile Completion (compact)
 * 6. Recent Activity (collapsible)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Heart, Briefcase, Eye, MessageSquare, Sparkles, ChevronDown, ChevronUp,
  Building2, MapPin, TrendingUp, Zap, Target, ArrowRight
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { cn } from '@/lib/utils';

interface MobileDashboardProps {
  onNavigateToSection: (section: string) => void;
  unreadMessages?: number | null;
  profileCompletion?: number;
}

// Collapsible section wrapper for progressive disclosure
function CollapsibleSection({ title, defaultOpen = false, children, badge }: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-start hover:bg-muted/50 transition-colors active:bg-muted"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-[Poppins]">{title}</span>
          {badge && <Badge variant="secondary" className="text-[10px] h-5">{badge}</Badge>}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-3 pb-3 border-t border-border pt-3">{children}</div>}
    </div>
  );
}

export function MobileDashboard({ onNavigateToSection, profileCompletion = 72, unreadMessages = null }: MobileDashboardProps) {
  const { t } = useTranslation();

  const stats = [
    { label: t('matched_jobs'), value: '12', colorClass: 'text-primary', icon: Heart, section: 'matches' },
    { label: t('applications'), value: '28', colorClass: 'text-orange-500', icon: Briefcase, section: 'applications' },
    { label: t('interviews'), value: '3', colorClass: 'text-green-600', icon: Target, section: 'applications' },
    { label: t('profile_views'), value: '89', colorClass: 'text-purple-600', icon: Eye, section: 'who_viewed' },
  ];

  const quickActions = [
    { label: t('swipe'), icon: Heart, section: 'swipe', color: 'bg-primary/10 text-primary' },
    { label: t('applications'), icon: Briefcase, section: 'applications', color: 'bg-primary/10 text-primary' },
    { label: t('matches'), icon: Heart, section: 'matches', color: 'bg-primary/10 text-primary' },
    { label: t('messages'), icon: MessageSquare, section: 'messages', color: 'bg-green-600/10 text-green-600' },
    { label: t('preferences'), icon: Sparkles, section: 'preferences', color: 'bg-purple-600/10 text-purple-600' },
  ];

  const todayRecommendation = {
    company: 'TechCorp',
    role: 'Senior Frontend Developer',
    score: 94,
    location: 'Dubai, UAE',
    salary: '$8K-12K',
  };

  const recentActivity = [
    { type: 'match', text: t('new_match_notification', { company: 'TechCorp' }), time: '5m' },
    { type: 'view', text: t('profile_viewed_notification'), time: '2h' },
    { type: 'app', text: t('application_reviewed_notification'), time: '1d' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Mobile-optimized content with safe bottom padding for nav */}
      <div className="p-4 pb-6 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">

        {/* Section 1: Greeting + AI Match Score */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold font-[Poppins] text-foreground">
              {t('greeting_morning')}, Ahmed 👋
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {t('dashboard_subtitle')}
            </p>
          </div>
          {/* AI Match Score Badge */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30">
              <span className="text-sm font-bold text-primary font-[Poppins]">94</span>
            </div>
            <span className="text-[9px] text-muted-foreground mt-0.5 font-medium">{t('ai_score')}</span>
          </div>
        </div>

        {/* Section 2: Quick Actions - horizontal scroll on mobile */}
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.section}
              onClick={() => onNavigateToSection(action.section)}
              className={cn(
                'flex min-w-0 items-center gap-2 px-3 py-2.5 rounded-xl',
                action.section==='messages' && 'col-span-2',
                'border border-border bg-card',
                'transition-all active:scale-95 hover:shadow-sm',
                'min-h-[44px]'
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', action.color)}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-start">{action.label}</span>
              {action.section==='messages' && unreadMessages!==null && unreadMessages>0 && <Badge aria-label={`${t('unread')}: ${unreadMessages}`} className="ms-auto text-[10px]">{unreadMessages>99?'99+':unreadMessages}</Badge>}
            </button>
          ))}
        </div>

        {/* Section 3: Statistics - compact 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              colorClass={s.colorClass}
              icon={s.icon}
              compact
            />
          ))}
        </div>

        {/* Section 4: Today's Recommendation */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{t('todays_recommendation')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{todayRecommendation.role}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {todayRecommendation.company} · {todayRecommendation.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="default" className="text-xs font-bold">{todayRecommendation.score}%</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onNavigateToSection('swipe')}
                  aria-label={t('view_recommendation')}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Profile Completion - compact */}
        <div className="bg-card border border-border rounded-xl p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold font-[Poppins]">{t('profile_completion')}</span>
              <Badge variant={profileCompletion >= 80 ? 'default' : 'secondary'} className="text-[10px] h-5">
                {profileCompletion}%
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary"
              onClick={() => onNavigateToSection('profile')}
            >
              {t('complete_profile')}
              <ArrowRight className="w-3 h-3 ms-1" />
            </Button>
          </div>
          <Progress value={profileCompletion} className="h-2" />
          {profileCompletion < 80 && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {t('profile_completion_hint')}
            </p>
          )}
        </div>

        {/* Section 6: Recent Activity - collapsible */}
        <CollapsibleSection title={t('recent_activity')} badge={`${recentActivity.length}`}>
          <div className="space-y-2.5">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 shrink-0',
                  activity.type === 'match' ? 'bg-primary' :
                  activity.type === 'view' ? 'bg-purple-500' : 'bg-green-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{activity.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Section 7: Recent Matches - collapsible */}
        <CollapsibleSection title={t('recent_matches')} badge="3" defaultOpen>
          <div className="space-y-2">
            {[
              { company: 'TechCorp', role: 'Senior Frontend Developer', score: 94, hasMessage: true },
              { company: 'DataFlow', role: 'Full Stack Engineer', score: 87, hasMessage: false },
              { company: 'FinanceHub', role: 'Mobile Developer', score: 82, hasMessage: true },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
                onClick={() => onNavigateToSection('matches')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{m.role}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{m.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-primary">{m.score}%</span>
                  {m.hasMessage && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Section 8: Career Tips - collapsible */}
        <CollapsibleSection title={t('career_tips')}>
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">{t('career_tip_1')}</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">{t('career_tip_2')}</p>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

export default MobileDashboard;