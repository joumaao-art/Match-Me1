import { useTranslation } from 'react-i18next';
import { Heart, Home, User, Globe, CreditCard, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortalBrand, { getPortalBrandConfig } from '@/components/shared/PortalBrand';
import { activeSeekerMobileTab } from '@/lib/seeker-navigation';
import { changeLanguage } from '@/lib/i18n';
import { useAuthStore } from '@/stores';
import { DesktopProfileLogout } from './DesktopProfileLogout';

const destinations = [
  { id:'swipe', Icon:Heart },
  { id:'dashboard', Icon:Home },
  { id:'profile', Icon:User },
  { id:'subscription_overview', Icon:CreditCard },
  { id:'preferences', Icon:Sliders },
];

export function DesktopSeekerNavigation({ active, onNavigate }: { active:string; onNavigate:(section:string)=>void }) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const uid = useAuthStore(s=>s.userId);
  const destination = ['subscription_overview','preferences'].includes(active) ? active : activeSeekerMobileTab(active);
  const label = (id:string) => id==='subscription_overview' ? (ar?'نظرة عامة على الاشتراك':'Subscription Overview') : t(id);
  return <div className="flex flex-col h-full">
    <header className="p-4 border-b">
      <PortalBrand config={getPortalBrandConfig('job_seeker')}/>
      <div className="flex gap-1 mt-3">
        <Button size="icon" variant="ghost" aria-label={t('language')} onClick={()=>changeLanguage(ar?'en':'ar')}><Globe size={17}/></Button>
      </div>
    </header>
    <nav aria-label={ar?'التنقل الرئيسي':'Primary navigation'} className="flex-1 p-3 space-y-2">
      {destinations.map(({id,Icon})=><button key={id} type="button" onClick={()=>onNavigate(id)} aria-current={destination===id?'page':undefined} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-start ${destination===id?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:bg-muted'}`}><Icon size={18} className="shrink-0"/><span>{label(id)}</span></button>)}
    </nav>
    <footer className="p-4 border-t">
      <button type="button" className="text-sm text-muted-foreground min-h-11" onClick={()=>onNavigate('support')}>{ar?'الدعم والإعدادات':'Support & Settings'}</button>
      {uid&&<DesktopProfileLogout uid={uid}/>}
    </footer>
  </div>;
}
