import { DesktopProfileLogout } from './DesktopProfileLogout';
import { useAuthStore } from '@/stores';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Heart, Home, User, Globe, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortalBrand, {getPortalBrandConfig} from '@/components/shared/PortalBrand';
import { activeSeekerMobileTab } from '@/lib/seeker-navigation';
import { changeLanguage } from '@/lib/i18n';

export function DesktopSeekerNavigation({active,onNavigate}:{active:string;onNavigate:(section:string)=>void}) {
 const {t,i18n}=useTranslation();const navigate=useNavigate();const [dark,setDark]=useState(document.documentElement.classList.contains('dark'));
 const uid=useAuthStore(s=>s.userId);
 const destination=activeSeekerMobileTab(active);
 return <div className="flex flex-col h-full"><header className="p-4 border-b"><PortalBrand config={getPortalBrandConfig('job_seeker')}/><div className="flex gap-1 mt-3"><Button size="icon" variant="ghost" aria-label={t('language')} onClick={()=>changeLanguage(i18n.language.startsWith('ar')?'en':'ar')}><Globe size={17}/></Button><Button size="icon" variant="ghost" aria-label={t(dark?'light_mode':'dark_mode')} onClick={()=>{document.documentElement.classList.toggle('dark');setDark(!dark);}}>{dark?<Sun size={17}/>:<Moon size={17}/>}</Button></div></header><nav aria-label={i18n.language.startsWith('ar')?'التنقل الرئيسي':'Primary navigation'} className="flex-1 p-3 space-y-2">{[{id:'swipe',Icon:Heart},{id:'dashboard',Icon:Home},{id:'profile',Icon:User}].map(({id,Icon})=><button key={id} type="button" onClick={()=>onNavigate(id)} aria-current={destination===id?'page':undefined} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm ${destination===id?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:bg-muted'}`}><Icon size={18}/>{t(id)}</button>)}</nav><footer className="p-4 border-t"><button type="button" className="text-sm text-muted-foreground min-h-11" onClick={()=>onNavigate('support')}>{i18n.language.startsWith('ar')?'الدعم والإعدادات':'Support & Settings'}</button>{uid&&<DesktopProfileLogout uid={uid}/>}</footer></div>;
}
