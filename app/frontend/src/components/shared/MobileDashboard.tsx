import { useMandatoryProfile } from '@/lib/mandatory-profile';
import { useCreditAccount } from '@/lib/seeker-credits';
import { useSeekerJobs } from '@/lib/seeker-jobs';
import { useAuthStore } from '@/stores';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Briefcase, MessageSquare, Sparkles, Bookmark, Zap } from 'lucide-react';

interface MobileDashboardProps {
 onNavigateToSection:(section:string)=>void; unreadMessages?:number|null; profileCompletion?:number;
}
export function MobileDashboard({onNavigateToSection,unreadMessages=null}:MobileDashboardProps){
 const {t,i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const copy=(en:string,arabic:string)=>ar?arabic:en;
 const uid=useAuthStore(s=>s.userId);const {balance}=useCreditAccount(uid);const completion=useMandatoryProfile();
 const {jobs,actions,loading,error,refresh}=useSeekerJobs();
 const active=actions.filter(a=>a.direction==='right'&&a.application_status==='pending');
 const matches=active.filter(a=>['accepted','hired'].includes(a.company_status||''));
 const stats=[{label:t('applications'),value:active.length,section:'applications',icon:Briefcase},{label:t('matches'),value:matches.length,section:'matches',icon:Heart},{label:t('saved_jobs'),value:actions.filter(a=>a.saved).length,section:'saved',icon:Bookmark},{label:copy('Available credits','الرصيد المتاح'),value:balance??'—',section:'billing',icon:Zap}];
 const links=[{label:t('swipe'),section:'swipe',icon:Heart},{label:t('applications'),section:'applications',icon:Briefcase},{label:t('matches'),section:'matches',icon:Heart},{label:t('messages'),section:'messages',icon:MessageSquare},{label:t('preferences'),section:'preferences',icon:Sparkles}];
 const activity=actions.filter(a=>a.direction==='right').sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).slice(0,5);
 return <div className="flex-1 overflow-y-auto" dir={ar?'rtl':'ltr'}><div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto"><h2 className="text-xl font-bold">{t('dashboard')}</h2><div className="grid grid-cols-2 gap-2">{links.map(l=><Button key={l.section} variant="outline" className={`justify-start h-12 gap-2 ${l.section==='messages'?'col-span-2':''}`} onClick={()=>onNavigateToSection(l.section)}><l.icon size={18}/>{l.label}{l.section==='messages'&&unreadMessages!==null&&unreadMessages>0&&<Badge className="ms-auto">{unreadMessages}</Badge>}</Button>)}</div>{loading?<p role="status">{t('loading')}</p>:error?<div role="alert"><p>{copy('Unable to load dashboard data.','تعذر تحميل بيانات لوحة التحكم.')}</p><Button onClick={()=>void refresh()}>{t('try_again')}</Button></div>:<><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{stats.map(s=><button key={s.section} className="text-start" onClick={()=>onNavigateToSection(s.section)}><Card><CardContent className="p-4"><s.icon size={18} className="text-primary mb-2"/><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card></button>)}</div><Card><CardContent className="p-4 space-y-3"><div className="flex justify-between"><h3 className="font-semibold">{t('profile_completion')}</h3><span>{completion.percentage===null?'—':`${completion.percentage}%`}</span></div>{completion.percentage!==null&&<Progress value={completion.percentage}/>}<Button variant="outline" onClick={()=>onNavigateToSection('profile')}>{t('complete_profile')}</Button></CardContent></Card><h3 className="font-semibold">{t('recent_activity')}</h3><div className="space-y-2">{activity.map(a=>{const job=jobs.find(j=>j.id===a.vacancy_id);return <Card key={a.vacancy_id}><CardContent className="p-3"><p className="text-sm font-medium">{job?.job_title||copy('Vacancy unavailable','الوظيفة غير متاحة')}</p><p className="text-xs text-muted-foreground">{job?.company_name} · {t(a.application_status==='withdrawn'?'withdrawn':a.company_status||'pending')} · {new Date(a.updated_at).toLocaleDateString(i18n.language)}</p></CardContent></Card>;})}{!activity.length&&<p className="text-sm text-muted-foreground">{copy('No applications yet. Explore real published jobs in Swipe.','لا توجد طلبات بعد. استكشف الوظائف المنشورة في Swipe.')}</p>}</div></>}</div></div>;
}
export default MobileDashboard;
