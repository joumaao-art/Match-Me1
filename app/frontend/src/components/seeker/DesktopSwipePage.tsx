import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Heart, Bookmark, Share2, Sliders, Sparkles, Undo2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DesktopCreditsDialog } from './DesktopCreditsDialog';
import { useMandatoryProfile } from '@/lib/mandatory-profile';
import { compensationText, vacancyDimensions } from '@/lib/swipe-presentation';
import { viaSwipeReturn } from '@/lib/via-premium';
import { MOBILE_WORK_TYPES, WORKING_STYLES } from '@/lib/mobile-onboarding-options';
import type { DiscoverJob } from '@/lib/seeker-jobs';

type Props = {
 job:DiscoverJob|undefined; loading:boolean; error:boolean; balance:number|null; busy:boolean; premium:boolean;
 onCreditsOpenChange:(open:boolean)=>void; saved:boolean; canUndo:boolean; onPass:()=>Promise<boolean|undefined>;
 onApply:()=>Promise<boolean|undefined>; onSave:()=>void; onUndo:()=>void; onShare:()=>void; onRetry:()=>void;
 unavailable:boolean; decision?:'left'|'right'; onBrowse:()=>void;
};
export function DesktopSwipePage(props:Props) {
 const {job,loading,error,balance,busy,premium,saved,canUndo,decision,unavailable}=props;
 const {t,i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const c=(en:string,arabic:string)=>ar?arabic:en;
 const navigate=useNavigate();const completion=useMandatoryProfile();const [creditsOpen,setCreditsOpen]=useState(false);const [expanded,setExpanded]=useState<string|null>(null);const [failedLogo,setFailedLogo]=useState<string|null>(null);
 const credits=(open:boolean)=>{setCreditsOpen(open);props.onCreditsOpenChange(open);};
 const preferences=()=>{const back=viaSwipeReturn(job?.id);navigate(`/seeker?view=preferences&return=${encodeURIComponent(back)}`);};
 const decide=async(direction:'left'|'right')=>{
  if(busy||creditsOpen||decision)return;
  if(!(direction==='right'&&premium)&&balance===null)return;
  if(!(direction==='right'&&premium)&&balance===0){credits(true);return;}
  if(direction==='right'&&(completion.error||completion.percentage!==100)){navigate('/seeker/onboarding?repair=1');return;}
  await (direction==='left'?props.onPass():props.onApply());
 };
 const dimensions=job?vacancyDimensions(job.employment_type):null;
 const type=MOBILE_WORK_TYPES.find(option=>option.code===dimensions?.type);
 const style=WORKING_STYLES.find(option=>option.code===(job?.employment_style||dimensions?.style));
 const salary=job?compensationText(job,i18n.language):null;
 return <section dir={ar?'rtl':'ltr'} className="flex-1 min-h-0 overflow-y-auto p-6"><div className="max-w-4xl mx-auto space-y-5">
  <header dir="ltr" className="flex items-center justify-between"><div className="flex gap-2 items-center"><span className="rounded-lg h-9 w-9 bg-primary text-primary-foreground grid place-items-center"><Sparkles size={23}/></span><h1 className="text-xl font-bold font-[Poppins]">MatchMe</h1></div><div className="flex gap-2"><Button variant="ghost" className="gap-2 min-h-11" onClick={()=>credits(true)}><Zap size={18}/>{balance??'—'} {c('Credits','رصيد')}</Button><Button size="icon" variant="ghost" aria-label={t('preferences')} onClick={preferences}><Sliders size={20}/></Button></div></header>
  <div data-testid="desktop-swipe-profile-completion" aria-live="polite" className="text-sm text-muted-foreground cursor-default max-w-md"><span className="flex items-center gap-2">{completion.percentage===100&&<CheckCircle2 size={16} className="text-primary"/>}{c('Profile completion','اكتمال الملف')}: {completion.percentage===null?'—':`${completion.percentage}%`}</span>{completion.percentage!==null&&<Progress className="h-1 mt-2" value={completion.percentage} aria-label={c('Profile completion','اكتمال الملف')}/>}</div>
  {loading||error||!job||unavailable?<div role={error?'alert':'status'} className="border rounded-2xl p-12 text-center space-y-4"><h2 className="text-xl font-semibold">{loading?t('loading'):error?c('Unable to load jobs','تعذر تحميل الوظائف'):unavailable?c('This job is no longer available','هذه الوظيفة لم تعد متاحة'):t('no_more_jobs')}</h2>{!loading&&<div className="flex gap-3 justify-center"><Button variant="outline" className="!bg-transparent !hover:bg-transparent" onClick={props.onRetry}>{t('try_again')}</Button><Button onClick={preferences}>{t('preferences')}</Button>{canUndo&&<Button disabled={busy} onClick={props.onUndo}>{t('undo_last_pass')}</Button>}</div>}</div>:<article className="border bg-card rounded-2xl shadow-lg overflow-hidden" aria-label={job.job_title}>
   <div className="flex justify-end gap-2 p-3" dir="ltr"><Button variant="ghost" disabled={!canUndo||busy} onClick={props.onUndo} className="gap-2"><Undo2 size={18}/>{t('undo_last_pass')}</Button><Button variant="ghost" disabled={busy} onClick={props.onShare} className="gap-2"><Share2 size={18}/>{t('share')}</Button></div>
   <div className="px-6 pb-6 space-y-5"><div className="flex gap-5 items-center"><div className="w-20 h-20 border rounded-xl bg-background grid place-items-center shrink-0">{job.company_logo&&failedLogo!==job.id?<img alt={job.company_name} src={job.company_logo} className="w-full h-full object-contain p-2" onError={()=>setFailedLogo(job.id)}/>:<Building2 size={32} className="text-muted-foreground"/>}</div><div className="min-w-0"><p className="text-sm text-muted-foreground">{job.company_name}</p><h2 className="text-2xl font-bold font-[Poppins] break-words">{job.job_title}</h2>{salary&&<p className="text-primary font-semibold mt-2">{salary}</p>}</div></div>
    <div className="grid grid-cols-3 gap-4 text-sm"><div><p className="text-muted-foreground">{t('location')}</p><p>{[job.city,job.country].filter(Boolean).join(', ')}</p></div><div><p className="text-muted-foreground">{c('Employment Type','نوع العمل')}</p><p>{type?(ar?type.ar:type.en):job.employment_type}</p></div><div><p className="text-muted-foreground">{c('Work Style','أسلوب العمل')}</p><p>{style?(ar?style.ar:style.en):job.employment_style||'—'}</p></div></div>
    <Button variant="ghost" className="text-primary px-0" aria-expanded={expanded===job.id} aria-controls={`desktop-job-details-${job.id}`} onClick={()=>setExpanded(expanded===job.id?null:job.id)}>{expanded===job.id?c('View Less','عرض أقل'):c('View More','عرض المزيد')}</Button>
    {expanded===job.id&&<section id={`desktop-job-details-${job.id}`} className="border-t pt-5 grid grid-cols-2 gap-6 text-sm leading-6"><div><h3 className="font-semibold mb-2">{t('job_description')}</h3><p className="whitespace-pre-wrap break-words">{job.job_description}</p></div><div><h3 className="font-semibold mb-2">{c('Qualifications','المؤهلات')}</h3>{job.qualifications&&<p className="whitespace-pre-wrap">{job.qualifications}</p>}{job.education_level&&<p>{job.education_level}</p>}{job.required_skills.length>0&&<p>{t('required_skills')}: {job.required_skills.join(', ')}</p>}{(job.min_experience>0||job.max_experience>0)&&<p>{t('experience')}: {job.min_experience}–{job.max_experience}</p>}{(job.benefits?.length??0)>0&&<p>{c('Benefits','المزايا')}: {job.benefits.join(', ')}</p>}</div></section>}
   </div>{decision&&<p role="status" className="px-6 text-sm text-muted-foreground pb-3">{decision==='right'?c('Application already recorded','تم تسجيل الطلب مسبقاً'):c('Previously passed — use eligible Undo to restore','تم تجاوزها مسبقاً — استخدم التراجع المتاح لاستعادتها')}</p>}
   <footer dir="ltr" className="border-t p-5 grid grid-cols-3 gap-4"><Button variant="outline" className="!bg-transparent !hover:bg-transparent text-red-700 gap-2 h-12" disabled={busy||!!decision} onClick={()=>void decide('left')}><X size={20}/>{c('Pass','تجاوز')}</Button><Button variant="outline" className="!bg-transparent !hover:bg-transparent text-primary gap-2 h-12" aria-pressed={saved} disabled={busy} onClick={props.onSave}><Bookmark size={20} fill={saved?'currentColor':'none'}/>{c('Save','حفظ')}</Button><Button className="gap-2 h-12" disabled={busy||!!decision} onClick={()=>void decide('right')}><Heart size={20}/>{c('Apply','تقديم')}</Button></footer>
  </article>}
  {(decision||unavailable)&&<Button variant="ghost" onClick={props.onBrowse}>{c('Browse other jobs','تصفح وظائف أخرى')}</Button>}
 </div><DesktopCreditsDialog open={creditsOpen} onOpenChange={credits} balance={balance} onUnlock={()=>{credits(false);navigate(`/seeker/subscription?return=${encodeURIComponent(viaSwipeReturn(job?.id))}`);}}/></section>;
}
