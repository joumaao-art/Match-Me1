import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/api-client';
import { requireAccount } from '@/services/mobile-account';
import { useAuthStore } from '@/stores';

/** Existing product feedback is separate from profile and matching records. */
export function AccountFeedback({uid}:{uid:string}) {
 const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');
 const copy=(en:string,arabic:string)=>ar?arabic:en;
 const [rating,setRating]=useState(0);const [feedback,setFeedback]=useState('');
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const lock=useRef(false);const alive=useRef(true);
 useEffect(()=>{alive.current=true;let current=true;void apiClient.supabase.from('app_experience_ratings').select('rating,feedback_text').eq('user_id',uid).eq('onboarding_context','onboarding_final_step').maybeSingle().abortSignal(AbortSignal.timeout(10000)).then(r=>{if(current&&useAuthStore.getState().userId===uid){if(r.error)setNotice(copy('Unable to load saved feedback.','تعذر تحميل الملاحظات المحفوظة.'));else if(r.data){setRating(r.data.rating||0);setFeedback(r.data.feedback_text||'');}}});return()=>{current=false;alive.current=false;};},[uid]);
 const save=async()=>{if(lock.current||!rating)return;lock.current=true;setBusy(true);setNotice('');try{await requireAccount(uid);const r=await apiClient.supabase.from('app_experience_ratings').upsert({user_id:uid,rating,feedback_text:feedback.trim().slice(0,2000)||null,skipped:false,onboarding_context:'onboarding_final_step',onboarding_version:'3',platform:window.matchMedia('(max-width:767px)').matches?'mobile':'web',locale:ar?'ar':'en',updated_at:new Date().toISOString()},{onConflict:'user_id,onboarding_context'}).select('id').single().abortSignal(AbortSignal.timeout(10000));if(r.error)throw r.error;await requireAccount(uid);if(alive.current)setNotice(copy('Feedback saved.','تم حفظ الملاحظات.'));}catch{if(alive.current&&useAuthStore.getState().userId===uid)setNotice(copy('Feedback was not confirmed. Your edits are retained; retry.','لم يتم تأكيد الملاحظات. احتُفظ بتعديلاتك؛ أعد المحاولة.'));}finally{lock.current=false;if(alive.current)setBusy(false);}};
 return <section className="space-y-3 border rounded-xl p-4"><h2 className="font-semibold">{copy('Rate your MatchMe experience','قيّم تجربتك في MatchMe')}</h2><div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={copy('Rating','التقييم')}>{[1,2,3,4,5].map(n=><Button key={n} type="button" variant={rating===n?'default':'outline'} role="radio" aria-checked={rating===n} disabled={busy} onClick={()=>setRating(n)}>{n} ★</Button>)}</div><Textarea maxLength={2000} aria-label={copy('Optional feedback','ملاحظات اختيارية')} value={feedback} disabled={busy} onChange={e=>setFeedback(e.target.value)}/><Button disabled={busy||!rating} onClick={()=>void save()}>{copy('Save feedback','حفظ الملاحظات')}</Button>{notice&&<p role="status" className="text-sm">{notice}</p>}</section>;
}
