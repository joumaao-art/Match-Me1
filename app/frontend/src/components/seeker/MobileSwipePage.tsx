import { CreditsPopup } from './CreditsPopup';
import { viaSwipeReturn } from '@/lib/via-premium';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Sliders, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SwipeFeedbackEngine } from '@/components/shared/SwipeFeedbackEngine';
import { MobileSwipeCard } from './MobileSwipeCard';
import type { DiscoverJob } from '@/lib/seeker-jobs';
import { useMandatoryProfile } from '@/lib/mandatory-profile';

export function MobileSwipePage({job,loading,error,balance,busy,premium,onCreditsOpenChange,saved,canUndo,onPass,onApply,onSave,onUndo,onShare,onRetry,unavailable,decision,onBrowse}:{
 job:DiscoverJob|undefined;loading:boolean;error:boolean;balance:number|null;busy:boolean;premium:boolean;onCreditsOpenChange:(open:boolean)=>void;saved:boolean;canUndo:boolean;
 onPass:()=>Promise<boolean|undefined>;onApply:()=>Promise<boolean|undefined>;onSave:()=>void;onUndo:()=>void;onShare:()=>void;onRetry:()=>void;unavailable:boolean;decision?:'left'|'right';onBrowse:()=>void;
}) {
 const {t,i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const copy=(en:string,arabic:string)=>ar?arabic:en;
 const navigate=useNavigate();const completion=useMandatoryProfile();  const [expandedJob,setExpandedJob]=useState<string|null>(null);const expanded=expandedJob===job?.id;
 const [creditsOpen,setCreditsOpen]=useState(false);
 const changeCredits=(open:boolean)=>{setCreditsOpen(open);onCreditsOpenChange(open);};
 const preferences=()=>{const back=viaSwipeReturn(job?.id);navigate(back,{replace:true});navigate(`/seeker?view=preferences&return=${encodeURIComponent(back)}`);};const credits=()=>changeCredits(true);
 const unlock=()=>{const back=viaSwipeReturn(job?.id);changeCredits(false);navigate(back,{replace:true});navigate(`/seeker/subscription?return=${encodeURIComponent(back)}`);};
 const decide=async(direction:'left'|'right')=>{
   if(creditsOpen||busy)return false;
   if(!(direction==='right'&&premium)&&balance===null)return false;
   if(!(direction==='right'&&premium)&&balance===0){credits();return false;}
   if(direction==='right'&&(completion.error||completion.percentage===null)){navigate('/seeker?view=cv&complete=1');return false;}
   if(direction==='right'&&completion.percentage!==null&&completion.percentage<100){navigate('/seeker?view=cv&complete=1');return false;}
   return direction==='left'?onPass():onApply();
 };
 return <section className="flex-1 min-h-0 flex flex-col px-4 pb-3 overflow-hidden" style={{paddingTop:'calc(env(safe-area-inset-top) + 8px)'}}>
   <header dir="ltr" className="flex items-center justify-between gap-2 shrink-0">
     <div className="flex items-center gap-2 min-w-0" aria-label="MatchMe"><span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Sparkles size={20}/></span><span className="font-semibold text-sm">MatchMe</span></div>
     <div className="flex items-center gap-1">
       <Button variant="ghost" className="h-11 px-2 gap-1 text-xs whitespace-nowrap" onClick={credits} aria-label={copy('View Credits','عرض الرصيد')}><Zap size={16}/>{balance??'—'} {copy('Credits','رصيد')}</Button>
       <Button size="icon" variant="ghost" className="h-11 w-11" onClick={preferences} aria-label={t('preferences')}><Sliders size={19}/></Button>
     </div>
   </header>
   <button type="button" onClick={()=>navigate('/seeker?view=cv&complete=1')} className="shrink-0 min-h-11 py-2 text-center text-xs text-muted-foreground rounded focus-visible:ring-2 focus-visible:ring-primary" aria-label={t('complete_profile')}>
     {completion.percentage===null?copy('View your profile','عرض ملفك الشخصي'):completion.percentage===100?<span className="inline-flex items-center gap-1"><CheckCircle2 size={14} className="text-primary"/>{copy('Your profile is 100% complete','ملفك مكتمل بنسبة 100%')}</span>:<span>{copy('Your profile is','ملفك مكتمل بنسبة')} <strong className="text-primary">{completion.percentage}%</strong> {copy('complete','')}</span>}
     {completion.percentage!==null&&<Progress value={completion.percentage} className="h-0.5 mt-2 max-w-44 mx-auto"/>}
   </button>
   <div className="flex-1 min-h-0 flex items-center justify-center pt-2">
     {!loading&&!error&&job&&!unavailable?<div className="relative h-full max-h-[650px] w-full max-w-md">
       <SwipeFeedbackEngine key={job.id} items={[{...job}]} activeIndex={0} enabled={!busy&&!expanded&&!decision&&!creditsOpen} config={{showStack:false,maxRotation:8,threshold:90}} onSwipe={direction=>decide(direction)}
         renderCard={()=> <MobileSwipeCard decision={decision} job={job} busy={busy} saved={saved} canUndo={canUndo} onUndo={onUndo} onShare={onShare} onPass={()=>void decide('left')} onApply={()=>void decide('right')} onSave={onSave} onExpandedChange={value=>setExpandedJob(value?job.id:null)}/>}/>
     </div>:<div className="text-center space-y-3 p-4" role={error?'alert':'status'}>
       <h1 className="text-lg font-semibold">{loading?t('loading'):error?copy('Unable to load jobs','تعذر تحميل الوظائف'):unavailable?copy('This job is no longer available','هذه الوظيفة لم تعد متاحة'):t('no_more_jobs')}</h1>
       {!loading&&<><p className="text-sm text-muted-foreground">{error?t('try_again'):t('check_back_later')}</p><div className="flex flex-wrap gap-2 justify-center"><Button variant="outline" className="!bg-transparent" onClick={onRetry}>{t('try_again')}</Button><Button onClick={preferences}>{t('preferences')}</Button>{canUndo&&<Button variant="outline" className="!bg-transparent" disabled={busy} onClick={onUndo}>{t('undo_last_pass')}</Button>}</div></>}
     </div>}
   </div>
   {(decision||unavailable)&&<button type="button" className="shrink-0 min-h-11 text-sm text-primary" onClick={onBrowse}>{copy('Browse other jobs','تصفح وظائف أخرى')}</button>}
   {balance===0&&<button className="shrink-0 text-xs text-primary min-h-11" onClick={credits}>{copy('No credits remaining — View Credits','لا يوجد رصيد متبقٍ — عرض الرصيد')}</button>}
 <CreditsPopup open={creditsOpen} onOpenChange={changeCredits} balance={balance} onUnlock={unlock}/>
 </section>;
}
