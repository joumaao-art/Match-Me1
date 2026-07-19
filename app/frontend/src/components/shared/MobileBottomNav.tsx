/**
 * Mobile Bottom Navigation Bar
 * 
 * Enterprise-grade mobile navigation following Mobile First, Desktop Enhanced philosophy.
 * Replaces hamburger menu on mobile with a persistent bottom navigation bar.
 * 
 * Features:
 * - 5 primary tabs: Dashboard, Discover, Applications, Messages, Profile
 * - Active states with smooth transitions
 * - Notification badges
 * - Dark mode support
 * - RTL/LTR support
 * - i18n localization
 * - WCAG AA compliant (44x44 touch targets)
 * - Safe area padding for notched devices
 * - Haptic-like visual feedback
 */

import { useTranslation } from 'react-i18next';
import { Home, Search, FileText, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileNavTab = 'dashboard' | 'swipe' | 'applications' | 'messages' | 'profile';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: MobileNavTab) => void;
  badges?: Partial<Record<MobileNavTab, number>>;
  className?: string;
}

interface NavItem {
  id: MobileNavTab;
  icon: typeof Home;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: Home, labelKey: 'dashboard' },
  { id: 'swipe', icon: Search, labelKey: 'discover' },
  { id: 'applications', icon: FileText, labelKey: 'applications' },
  { id: 'messages', icon: MessageSquare, labelKey: 'messages' },
  { id: 'profile', icon: User, labelKey: 'profile' },
];

export function MobileBottomNav({ activeTab, onTabChange, badges = {}, className }: MobileBottomNavProps) {
  const { t } = useTranslation();

  // Map complex tabs to their parent nav tab for active state
  const getActiveNavTab = (tab: string): MobileNavTab => {
    const dashboardTabs = ['dashboard', 'notifications', 'settings', 'saved', 'matches'];
    const profileTabs = ['profile', 'cv', 'experience', 'education', 'certificates', 'skills', 'languages', 'portfolio', 'video', 'preferences', 'visibility', 'exposure', 'contact_requests', 'who_viewed', 'invitations'];
    const discoverTabs = ['swipe'];
    const applicationTabs = ['applications'];
    const messageTabs = ['messages'];

    if (profileTabs.includes(tab)) return 'profile';
    if (discoverTabs.includes(tab)) return 'swipe';
    if (applicationTabs.includes(tab)) return 'applications';
    if (messageTabs.includes(tab)) return 'messages';
    if (dashboardTabs.includes(tab)) return 'dashboard';
    return 'dashboard';
  };

  const currentNavTab = getActiveNavTab(activeTab);

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 md:hidden',
        'bg-background/95 backdrop-blur-lg border-t border-border',
        'pb-[env(safe-area-inset-bottom,0px)]',
        className
      )}
      role="navigation"
      aria-label={t('main_navigation')}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentNavTab === item.id;
          const badge = badges[item.id];
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-[56px] min-h-[44px] py-1 px-3 rounded-xl',
                'transition-all duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                'active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}

              {/* Icon with badge */}
              <span className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {badge && badge > 0 && (
                  <span className="absolute -top-1.5 -end-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] mt-0.5 font-medium leading-tight truncate max-w-[56px]',
                  isActive && 'font-semibold'
                )}
              >
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;