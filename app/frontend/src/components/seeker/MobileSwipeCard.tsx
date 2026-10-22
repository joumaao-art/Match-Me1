import { useState, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Undo2, Share2, X, Bookmark, Heart, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoverJob } from '@/lib/seeker-jobs';
import { MOBILE_WORK_TYPES, WORKING_STYLES } from '@/lib/mobile-onboarding-options';
import { compensationText, vacancyDimensions } from '@/lib/swipe-presentation';

export function MobileSwipeCard({job,busy,saved,canUndo,onUndo,onShare,onPass,onSave,onApply,onExpandedChange,decision}:{
 job:DiscoverJob;busy:boolean;saved:boolean;canUndo:boolean;onUndo:()=>void;onShare:()=>void;onPass:()=>void;onSave:()=>void;onApply:()=>void;onExpandedChange:(value:boolean)=>void;decision?:'left'|'right';
}) {
 const {t,i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const copy=(en:string,arabic:string)=>ar?arabic:en;
 const [expanded,setExpanded]=useState(false);const [logoFailed,setLogoFailed]=useState(false);
 const dims=vacancyDimensions(job.employment_type);const type=MOBILE_WORK_TYPES.find(x=>x.code===dims.type);const style=WORKING_STYLES.find(x=>x.code===(job.employment_style||dims.style));
 const salary=compensationText(job,i18n.language);
 const toggle=()=>{setExpanded(!expanded);onExpandedChange(!expanded);};const stop=(e:PointerEvent)=>e.stopPropagation();
 return <article aria-label={job.job_title} className="h-full max-h-full flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
   <div dir="ltr" className="flex justify-end px-2 pt-1 shrink-0" onPointerDown={stop}>
     <Button variant="ghost" size="icon" className="h-11 w-11" disabled={!canUndo||busy} onClick={onUndo} aria-label={t('undo_last_pass')}><Undo2 size={18}/></Button>
     <Button variant="ghost" size="icon" className="h-11 w-11" disabled={busy} onClick={onShare} aria-label={t('share')}><Share2 size={18}/></Button>
   </div>
   <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-2" onPointerDown={expanded?stop:undefined}>
     <div className="text-center space-y-2">
       <div className="h-14 w-14 mx-auto flex items-center justify-center rounded-lg border bg-background">{job.company_logo&&!logoFailed?<img src={job.company_logo} onError={()=>setLogoFailed(true)} alt={job.company_name} className="h-full w-full object-contain p-1"/>:<Building2 className="text-muted-foreground" size={26}/>}</div>
       <p className="text-xs text-muted-foreground">{job.company_name}</p>
       <h1 className="text-lg font-semibold leading-snug break-words">{job.job_title}</h1>
       {salary&&<p className="text-sm font-medium text-primary">{salary}</p>}
       {(job.city||job.country)&&<p className="text-sm flex gap-1 items-center justify-center"><MapPin size={14} className="shrink-0"/>{[job.city,job.country].filter(Boolean).join(', ')}</p>}
       {type&&<p className="text-xs text-muted-foreground">{copy('Employment Type','نوع العمل')}: <span className="text-foreground">{ar?type.ar:type.en}</span></p>}
       {style&&<p className="text-xs text-muted-foreground">{copy('Employment Style','أسلوب العمل')}: <span className="text-foreground">{ar?style.ar:style.en}</span></p>}
       <Button variant="ghost" className="min-h-11 text-primary gap-1" onPointerDown={stop} onClick={toggle} aria-expanded={expanded} aria-controls={`job-details-${job.id}`}>{expanded?copy('View Less','عرض أقل'):copy('View More','عرض المزيد')}{expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</Button>
     </div>
     {expanded&&<section id={`job-details-${job.id}`} className="border-t pt-3 mt-2 space-y-3 text-sm leading-6" onPointerDown={stop}>
       {job.job_description&&<div><h2 className="font-semibold">{t('job_description')}</h2><p className="whitespace-pre-wrap break-words text-muted-foreground">{job.job_description}</p></div>}
       {(job.qualifications||job.education_level||job.required_skills.length>0)&&<div><h2 className="font-semibold">{copy('Qualifications','المؤهلات')}</h2>{job.qualifications&&<p className="whitespace-pre-wrap">{job.qualifications}</p>}{job.education_level&&<p>{job.education_level}</p>}{job.required_skills.length>0&&<p>{t('required_skills')}: {job.required_skills.join(', ')}</p>}</div>}
       {(job.min_experience>0||job.max_experience>0)&&<p>{t('experience')}: {job.min_experience}–{job.max_experience} {copy('years','سنوات')}</p>}
       {job.benefits&&job.benefits.length>0&&<p>{copy('Benefits','المزايا')}: {job.benefits.join(', ')}</p>}
     </section>}
   </div>
   {decision&&<p className="text-xs text-center py-1 text-muted-foreground" role="status">{decision==='right'?copy('Application already recorded','تم تسجيل الطلب مسبقاً'):copy('Previously passed — use eligible Undo to restore','تم تجاوزها مسبقاً — استخدم التراجع المتاح لاستعادتها')}</p>}
   <div dir="ltr" className="grid grid-cols-3 border-t px-4 py-3 shrink-0 bg-card" onPointerDown={stop}>
     <Button variant="outline" size="icon" disabled={busy||!!decision} onClick={onPass} aria-label={t('swipe_pass')} className="h-12 w-12 mx-auto !bg-transparent text-red-600 border-red-200"><X size={23}/></Button>
     <Button variant="outline" size="icon" disabled={busy} onClick={onSave} aria-label={t('save')} aria-pressed={saved} className="h-12 w-12 mx-auto !bg-transparent text-primary"><Bookmark size={22} fill={saved?'currentColor':'none'}/></Button>
     <Button size="icon" disabled={busy||!!decision} onClick={onApply} aria-label={t('swipe_apply')} className="h-12 w-12 mx-auto bg-primary text-primary-foreground"><Heart size={23}/></Button>
   </div>
 </article>;
}
