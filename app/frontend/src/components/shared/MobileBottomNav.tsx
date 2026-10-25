import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { Home, PanelsTopLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEEKER_MOBILE_TABS, activeSeekerMobileTab, type MobileNavTab } from '@/lib/seeker-navigation';
export type { MobileNavTab } from '@/lib/seeker-navigation';

const icons = { swipe: PanelsTopLeft, dashboard: Home, profile: User };
export function MobileBottomNav({ activeTab, onTabChange, className }: {
  activeTab: string;
  onTabChange: (tab: MobileNavTab) => void;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const mobile = useIsMobile();
  const current = activeSeekerMobileTab(activeTab);
  if (!mobile) return null;
  return <nav aria-label={t('main_navigation')} className={cn('fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border pb-[env(safe-area-inset-bottom,0px)]', className)}>
    <div dir="ltr" className="grid grid-cols-3 h-16 max-w-2xl mx-auto">
      {SEEKER_MOBILE_TABS.map(item => {
        const Icon = icons[item.id];
        const active = current === item.id;
        return <button key={item.id} type="button" onClick={() => onTabChange(item.id)} aria-label={t(item.labelKey)} aria-current={active ? 'page' : undefined}
          className={cn('relative min-w-0 min-h-11 flex flex-col items-center justify-center gap-1 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary transition-colors', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
          {active && <span aria-hidden="true" className="absolute top-1 h-0.5 w-5 rounded-full bg-primary" />}
          <Icon aria-hidden="true" className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
          <span dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'} className={cn('text-[11px] leading-4 whitespace-nowrap', active ? 'font-semibold' : 'font-medium')}>{t(item.labelKey)}</span>
        </button>;
      })}
    </div>
  </nav>;
}
export default MobileBottomNav;
