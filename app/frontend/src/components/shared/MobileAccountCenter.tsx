/**
 * Mobile Account Center — Experience Engine Component
 * 
 * A dedicated mobile account management page with native mobile patterns.
 * Provides access to all account-related features within 1-2 taps.
 * 
 * Sections:
 * - Profile header (avatar, name, email, edit)
 * - Quick actions (subscription badge, profile completion)
 * - Account sections grouped by category
 * - Logout (always visible at bottom)
 * 
 * Features:
 * - Native iOS/Android list patterns
 * - Chevron indicators for navigation
 * - Icon + label + badge layout
 * - Dark mode support
 * - RTL/LTR support
 * - i18n localization
 * - WCAG AA compliant touch targets
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, CreditCard, Bell, Shield, Globe, HelpCircle,
  Receipt, LogOut, ChevronRight, Briefcase, GraduationCap, Award,
  Star, FileText, Video, Eye, BarChart3, Send, Users, Sliders,
  Moon, Sun, Layers, Languages as LanguagesIcon, Bookmark
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/App';
import { changeLanguage } from '@/lib/i18n';

type NavSection = string;

interface AccountMenuItem {
  id: NavSection;
  icon: typeof User;
  labelKey: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  destructive?: boolean;
  external?: boolean;
  action?: () => void;
}

interface AccountMenuGroup {
  titleKey: string;
  items: AccountMenuItem[];
}

interface MobileAccountCenterProps {
  onNavigateToSection: (section: NavSection) => void;
  userName?: string;
  userEmail?: string;
  profileCompletion?: number;
  subscriptionPlan?: string;
  unreadNotifications?: number;
  portalType: 'job_seeker' | 'company';
}

function AccountListItem({ item, onNavigate }: { item: AccountMenuItem; onNavigate: (section: NavSection) => void }) {
  const { t } = useTranslation();
  const Icon = item.icon;

  const handleClick = () => {
    if (item.action) {
      item.action();
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-start',
        'transition-colors duration-150 active:bg-muted/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        'min-h-[48px]',
        item.destructive ? 'text-destructive' : 'text-foreground',
      )}
      aria-label={t(item.labelKey)}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        item.destructive ? 'bg-destructive/10' : 'bg-muted',
      )}>
        <Icon className={cn('w-4.5 h-4.5', item.destructive ? 'text-destructive' : 'text-muted-foreground')} />
      </div>
      <span className="flex-1 text-sm font-medium truncate">{t(item.labelKey)}</span>
      {item.badge && (
        <Badge variant={item.badgeVariant || 'secondary'} className="text-[10px] h-5 shrink-0">
          {item.badge}
        </Badge>
      )}
      {!item.destructive && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 rtl:rotate-180" />
      )}
    </button>
  );
}

export function MobileAccountCenter({
  onNavigateToSection,
  userName = 'Ahmed Hassan',
  userEmail = 'ahmed@example.com',
  profileCompletion = 72,
  subscriptionPlan = 'Free',
  unreadNotifications = 3,
  portalType,
}: MobileAccountCenterProps) {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isDark = document.documentElement.classList.contains('dark');

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
  };

  const toggleLanguage = () => {
    changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  const seekerMenuGroups: AccountMenuGroup[] = [
    {
      titleKey: 'profile_management',
      items: [
        { id: 'profile', icon: User, labelKey: 'profile', badge: `${profileCompletion}%`, badgeVariant: profileCompletion >= 80 ? 'default' : 'secondary' },
        { id: 'cv', icon: FileText, labelKey: 'my_resume' },
        { id: 'experience', icon: Briefcase, labelKey: 'experience' },
        { id: 'education', icon: GraduationCap, labelKey: 'education' },
        { id: 'certificates', icon: Award, labelKey: 'certificates' },
        { id: 'skills', icon: Star, labelKey: 'skills' },
        { id: 'languages', icon: LanguagesIcon, labelKey: 'languages' },
        { id: 'portfolio', icon: Layers, labelKey: 'portfolio' },
        { id: 'video', icon: Video, labelKey: 'video_intro' },
      ],
    },
    {
      titleKey: 'job_activity',
      items: [
        { id: 'saved', icon: Bookmark, labelKey: 'saved_jobs' },
        { id: 'matches', icon: Star, labelKey: 'matches' },
        { id: 'preferences', icon: Sliders, labelKey: 'preferences' },
      ],
    },
    {
      titleKey: 'discoverability',
      items: [
        { id: 'visibility', icon: Eye, labelKey: 'profile_visibility' },
        { id: 'exposure', icon: BarChart3, labelKey: 'exposure_dashboard' },
        { id: 'contact_requests', icon: Send, labelKey: 'contact_requests' },
        { id: 'who_viewed', icon: Users, labelKey: 'who_viewed_profile' },
        { id: 'invitations', icon: Send, labelKey: 'invitations' },
      ],
    },
    {
      titleKey: 'account_settings',
      items: [
        { id: 'notifications', icon: Bell, labelKey: 'notifications', badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined, badgeVariant: 'destructive' },
        { id: 'settings', icon: Settings, labelKey: 'settings' },
        { id: 'subscription_nav', icon: CreditCard, labelKey: 'subscription', badge: subscriptionPlan, action: () => navigate('/seeker/subscription') },
        { id: 'privacy', icon: Shield, labelKey: 'privacy_settings' },
      ],
    },
    {
      titleKey: 'preferences_section',
      items: [
        { id: 'language_toggle', icon: Globe, labelKey: i18n.language === 'en' ? 'switch_to_arabic' : 'switch_to_english', action: toggleLanguage },
        { id: 'dark_mode_toggle', icon: isDark ? Sun : Moon, labelKey: isDark ? 'light_mode' : 'dark_mode', action: toggleDark },
        { id: 'help', icon: HelpCircle, labelKey: 'help_support' },
      ],
    },
  ];

  const companyMenuGroups: AccountMenuGroup[] = [
    {
      titleKey: 'company_management',
      items: [
        { id: 'profile', icon: User, labelKey: 'company_profile' },
        { id: 'branches', icon: Layers, labelKey: 'branches' },
        { id: 'recruiters', icon: Users, labelKey: 'recruiters' },
        { id: 'team', icon: Users, labelKey: 'team_members' },
      ],
    },
    {
      titleKey: 'account_settings',
      items: [
        { id: 'notifications', icon: Bell, labelKey: 'notifications', badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined, badgeVariant: 'destructive' },
        { id: 'settings', icon: Settings, labelKey: 'settings' },
        { id: 'subscription', icon: CreditCard, labelKey: 'subscription', badge: subscriptionPlan },
        { id: 'billing', icon: Receipt, labelKey: 'billing' },
      ],
    },
    {
      titleKey: 'preferences_section',
      items: [
        { id: 'language_toggle', icon: Globe, labelKey: i18n.language === 'en' ? 'switch_to_arabic' : 'switch_to_english', action: toggleLanguage },
        { id: 'dark_mode_toggle', icon: isDark ? Sun : Moon, labelKey: isDark ? 'light_mode' : 'dark_mode', action: toggleDark },
        { id: 'help', icon: HelpCircle, labelKey: 'help_support' },
      ],
    },
  ];

  const menuGroups = portalType === 'job_seeker' ? seekerMenuGroups : companyMenuGroups;

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      {/* Profile Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold font-[Poppins] truncate">{userName}</h2>
            <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] h-5">{subscriptionPlan}</Badge>
              {profileCompletion < 100 && (
                <span className="text-[10px] text-muted-foreground">{profileCompletion}% {t('complete')}</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => onNavigateToSection('profile')}
            aria-label={t('edit_profile')}
          >
            {t('edit')}
          </Button>
        </div>
      </div>

      {/* Menu Groups */}
      {menuGroups.map((group, gi) => (
        <div key={gi} className="mb-2">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t(group.titleKey)}
            </p>
          </div>
          <div className="bg-card border-y border-border divide-y divide-border">
            {group.items.map(item => (
              <AccountListItem
                key={item.id}
                item={item}
                onNavigate={onNavigateToSection}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Logout — Always visible */}
      <div className="mt-4 mb-8 bg-card border-y border-border">
        <AccountListItem
          item={{
            id: 'logout',
            icon: LogOut,
            labelKey: 'logout',
            destructive: true,
            action: signOut,
          }}
          onNavigate={onNavigateToSection}
        />
      </div>
    </div>
  );
}

export default MobileAccountCenter;