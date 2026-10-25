import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';
import { loadMatchProfile, SKILL_MATCH_FUNCTION, vacancyMatchScore } from '@/lib/skill-match';
import type { SkillAnalysis, SkillSuggestion, EvidenceSource } from '@/lib/skill-match-core';
import type { DiscoverJob } from '@/lib/seeker-jobs';

export function SkillMatchAssistant({job,score,onSaved,onOpenChange}:{job:DiscoverJob;score:number|null;onSaved:()=>void;onOpenChange?:(open:boolean)=>void}){
 const uid=useAuthStore(s=>s.userId);const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const c=(en:string,arabic:string)=>ar?arabic:en;
 const [open,setOpen]=useState(false);const [analysis,setAnalysis]=useState<SkillAnalysis|null>(null);const [selected,setSelected]=useState<string[]>([]);const [confirmed,setConfirmed]=useState(false);const [more,setMore]=useState(false);const [loading,setLoading]=useState(false);const [saving,setSaving]=useState(false);const [notice,setNotice]=useState('');const [delta,setDelta]=useState<{before:number;after:number}|null>(null);
 const generation=useRef(0);const lock=useRef(false);const owner=useRef({uid,jobId:job.id});owner.current={uid,jobId:job.id};
 const owned=(request:number,account:string,jobId:string)=>generation.current===request&&owner.current.uid===account&&owner.current.jobId===jobId&&useAuthStore.getState().userId===account;
 const changeOpen=(value:boolean)=>{generation.current++;setOpen(value);onOpenChange?.(value);if(!value){setLoading(false);setAnalysis(null);setSelected([]);setConfirmed(false);setDelta(null);}};
 useEffect(()=>()=>{generation.current++;onOpenChange?.(false);},[job.id,uid]);
 const analyze=async()=>{
  if(!uid)return;const request=++generation.current;const account=uid;const jobId=job.id;setLoading(true);setNotice('');setAnalysis(null);setSelected([]);setConfirmed(false);setMore(false);setDelta(null);
  try{const result=await apiClient.supabase.functions.invoke<SkillAnalysis>(SKILL_MATCH_FUNCTION,{body:{jobId},signal:AbortSignal.timeout(30000)});if(result.error||!result.data?.reviewId||!Array.isArray(result.data.requirements))throw new Error('Analysis unavailable');if(owned(request,account,jobId))setAnalysis(result.data);}
  catch{if(owned(request,account,jobId))setNotice(c('Review is unavailable or its request limit was reached. You can close this window and continue swiping.','المراجعة غير متاحة أو تم بلوغ حد الطلبات. يمكنك إغلاق هذه النافذة ومتابعة التصفح.'));}
  finally{if(owned(request,account,jobId))setLoading(false);}
 };
 const launch=()=>{changeOpen(true);void analyze();};
 const save=async()=>{
  if(!uid||!analysis||!selected.length||!confirmed||lock.current)return;
  lock.current=true;setSaving(true);setNotice('');const request=generation.current;const account=uid;const jobId=job.id;
  let persisted=false;
  try{
   const before=await loadMatchProfile(account);
   if(!owned(request,account,jobId))return;
   const result=await apiClient.supabase.rpc('app_91d3436dfc_confirm_skill_review',{p_review:analysis.reviewId,p_selected:selected,p_confirmed:confirmed}).abortSignal(AbortSignal.timeout(12000));
   if(result.error)throw result.error;persisted=true;
   if(owned(request,account,jobId))onSaved();if(useAuthStore.getState().userId===account)window.dispatchEvent(new Event('matchme:profile-changed'));
   const after=await loadMatchProfile(account);
   if(!owned(request,account,jobId))return;
   setDelta({before:vacancyMatchScore(before,job),after:vacancyMatchScore(after,job)});setSelected([]);setConfirmed(false);
   setAnalysis({...analysis,requirements:analysis.requirements.map(r=>({...r,matched:r.matched||selected.includes(r.name),selectable:r.selectable&&!selected.includes(r.name)}))});
   setNotice(c('Confirmed skills saved to Profile → Skills. Employer requirements still apply.','تم حفظ المهارات المؤكدة في الملف ← المهارات. لا تزال متطلبات صاحب العمل سارية.'));
  }catch{if(owned(request,account,jobId))setNotice(persisted?c('Skills were saved, but the score refresh failed. Close and reopen to refresh.','تم حفظ المهارات، لكن تعذر تحديث النسبة. أغلق النافذة وأعد فتحها للتحديث.'):c('Save was not confirmed. Your selection is retained; review again if this vacancy changed or the review expired.','لم يتم تأكيد الحفظ. تم الاحتفاظ باختياراتك؛ أعد المراجعة إذا تغيرت الوظيفة أو انتهت صلاحية المراجعة.'));}
  finally{lock.current=false;if(owner.current.uid===account&&owner.current.jobId===jobId)setSaving(false);}
 };
 const sources:Record<EvidenceSource,string>={experience:c('experience','الخبرة'),education:c('education','التعليم'),certification:c('certification','الشهادات'),resume:c('saved resume information','معلومات السيرة المحفوظة'),profile:c('profile','الملف')};
 const matched=analysis?.requirements.filter(r=>r.matched)||[];const missing=analysis?.requirements.filter(r=>!r.matched)||[];
 const suggested=[...missing].sort((a,b)=>Number(b.evidence.length>0)-Number(a.evidence.length>0)||Number(b.priority==='required')-Number(a.priority==='required'));
 const renderSkill=(r:SkillSuggestion)=><label key={r.name} className="flex gap-3 p-3 rounded-lg border text-sm"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-primary" disabled={!r.selectable||saving} checked={selected.includes(r.name)} onChange={e=>{setSelected(e.target.checked?[...selected,r.name]:selected.filter(s=>s!==r.name));setConfirmed(false);}}/><span className="min-w-0 space-y-1 block"><strong>{r.name}</strong> <span className="text-xs text-muted-foreground">{r.priority==='required'?c('Required','مطلوبة'):c('Preferred','مفضلة')}</span><span className="block text-muted-foreground">{r.source==='structured'?c('Listed in the employer’s required skills.','مدرجة ضمن المهارات المطلوبة لدى صاحب العمل.'):c('Explicitly mentioned in the employer’s requirements:','مذكورة صراحة في متطلبات صاحب العمل:')} {r.source!=='structured'&&r.quote}</span><span className="block text-xs">{r.evidence.length?`${c('Potential support in','دعم محتمل في')}: ${r.evidence.map(s=>sources[s]).join(', ')}. ${c('Not verified; confirm only if genuine.','غير موثقة؛ أكدها فقط إن كنت تمتلكها بالفعل.')}`:c('No supporting evidence found in the available profile information.','لم يتم العثور على دليل داعم في معلومات الملف المتاحة.')}</span>{r.credential&&<span className="block text-xs text-muted-foreground">{c('Professional credentials cannot be added through this assistant. Use the existing qualification section with accurate details.','لا يمكن إضافة المؤهلات المهنية عبر هذا المساعد. استخدم قسم المؤهلات الحالي بمعلومات دقيقة.')}</span>}</span></label>;
 return <div onPointerDown={e=>e.stopPropagation()} className="space-y-1">
  <div className="flex flex-wrap items-center justify-center gap-2"><span className="text-xs text-muted-foreground" aria-live="polite">{c('Match','التوافق')}: {score===null?'—':`${score}%`}</span><Button variant="ghost" className="text-primary gap-1 min-h-11 text-xs" disabled={!uid} onClick={launch}><Sparkles size={15}/>{c('Improve My Match','تحسين التوافق')}</Button></div>
  <Dialog open={open} onOpenChange={changeOpen}><DialogContent dir={ar?'rtl':'ltr'} className="max-h-[85dvh] overflow-y-auto w-[calc(100%_-_24px)] max-w-xl rounded-xl p-5 max-md:top-auto max-md:bottom-0 max-md:translate-y-0 max-md:rounded-b-none" onPointerDown={e=>e.stopPropagation()}>
   <DialogTitle className="pe-6 leading-6">{c('VIA AI Skill Match Assistant','مساعد VIA الذكي لتوافق المهارات')}</DialogTitle><DialogDescription>{job.job_title} — {job.company_name}<span className="block mt-1">{c('Current match','التوافق الحالي')}: {delta?`${delta.after}%`:score===null?'—':`${score}%`}</span></DialogDescription>
   {loading&&<p role="status">{c('Reviewing requirements and your authorized profile…','جارٍ مراجعة المتطلبات وملفك المصرح به…')}</p>}
   {analysis&&<>
    {analysis.mode==='structured'&&<p className="text-xs text-muted-foreground">{c('AI is unavailable. Showing structured and explicitly stated requirements with direct profile evidence only.','الذكاء الاصطناعي غير متاح. تُعرض المتطلبات المنظمة والمذكورة صراحة مع أدلة الملف المباشرة فقط.')}</p>}
    <section><h3 className="font-semibold text-sm mb-2">{c('Matched skills','المهارات المتوافقة')} ({matched.length})</h3><p className="text-sm text-muted-foreground">{matched.length?matched.map(r=>`${r.name} (${r.priority==='required'?c('Required','مطلوبة'):c('Preferred','مفضلة')})`).join(', '):c('No listed skills match these requirements yet.','لا تتوافق مهاراتك المدرجة مع هذه المتطلبات بعد.')}</p></section>
    <section><h3 className="font-semibold text-sm mb-2">{c('Potentially demonstrated skills','مهارات قد تظهرها خبراتك')} ({missing.filter(r=>r.evidence.length).length})</h3><p className="text-xs text-muted-foreground">{c('Possible profile evidence is not proof of proficiency. Suggestions with evidence appear first.','الأدلة المحتملة في الملف ليست إثباتاً للكفاءة. تظهر الاقتراحات المدعومة بأدلة أولاً.')}</p></section>
    <section className="space-y-2"><h3 className="font-semibold text-sm">{c('Missing skills · suggestions','المهارات غير المدرجة · الاقتراحات')} ({missing.length})</h3>{suggested.slice(0,more?suggested.length:5).map(renderSkill)}{!missing.length&&<p className="text-sm">{c('No additional relevant skills identified.','لم يتم تحديد مهارات إضافية ذات صلة.')}</p>}{suggested.length>5&&!more&&<Button variant="ghost" onClick={()=>setMore(true)}>{c('View More','عرض المزيد')}</Button>}</section>
    <p className="text-xs text-muted-foreground">{c('Adding skills does not guarantee a higher score or satisfy licenses, education, experience, or other mandatory employer qualifications.','إضافة المهارات لا تضمن نسبة أعلى ولا تستوفي التراخيص أو التعليم أو الخبرة أو المؤهلات الإلزامية الأخرى.')}</p>
    {selected.length>0&&<label className="border rounded-lg p-3 flex gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-primary" checked={confirmed} disabled={saving} onChange={e=>setConfirmed(e.target.checked)}/><span>{c('Only add skills you genuinely possess. Your profile should accurately reflect your qualifications.','أضف فقط المهارات التي تمتلكها بالفعل. يجب أن يعكس ملفك مؤهلاتك بدقة.')} <strong className="block mt-1">{c('I confirm I genuinely possess the selected skills.','أؤكد أنني أمتلك المهارات المحددة بالفعل.')}</strong></span></label>}
   </>}
   {delta&&<p role="status" className="text-sm font-medium">{delta.before}% → {delta.after}% ({delta.after-delta.before>0?'+':''}{delta.after-delta.before} {c('percentage points','نقطة مئوية')})</p>}
   {notice&&<p role="status" className="text-sm">{notice}</p>}
   <div className="flex flex-wrap gap-2"><Button disabled={!analysis||!selected.length||!confirmed||saving||loading} onClick={()=>void save()}>{saving?c('Saving…','جارٍ الحفظ…'):c('Add Selected Skills','إضافة المهارات المحددة')}</Button><Button variant="outline" className="!bg-transparent !hover:bg-transparent" onClick={()=>changeOpen(false)}>{c('Not Now','ليس الآن')}</Button>{!analysis&&!loading&&<Button variant="ghost" onClick={()=>void analyze()}>{c('Retry Review','إعادة المراجعة')}</Button>}</div>
  </DialogContent></Dialog>
 </div>;
}
