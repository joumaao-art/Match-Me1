import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api-client';
import { loadAccount, requireAccount, type AccountSnapshot } from '@/services/mobile-account';
import { useAuthStore } from '@/stores';
const fields=['disability','acquisition_source','acquisition_other'] as const;
type OptionalDraft=Record<typeof fields[number],string>;
export function OptionalAccountInformation({account,onUpdated}:{account:AccountSnapshot;onUpdated:(a:AccountSnapshot)=>void}) {
 const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const copy=(en:string,arabic:string)=>ar?arabic:en;
 const [base,setBase]=useState<Record<string,unknown>>(account.profile as unknown as Record<string,unknown>);
 const [draft,setDraft]=useState<OptionalDraft>(()=>Object.fromEntries(fields.map(k=>[k,String((account.profile as unknown as Record<string,unknown>)[k]||'')])) as OptionalDraft);
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const lock=useRef(false);const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const reload=async()=>{if(lock.current||!window.confirm(copy('Discard unsaved optional edits and reload saved information?','تجاهل التعديلات الاختيارية غير المحفوظة وإعادة تحميل البيانات؟')))return;lock.current=true;setBusy(true);try{const latest=await loadAccount(account.uid);if(alive.current&&useAuthStore.getState().userId===account.uid){const profile=latest.profile as unknown as Record<string,unknown>;setBase(profile);setDraft(Object.fromEntries(fields.map(k=>[k,String(profile[k]||'')])) as OptionalDraft);onUpdated(latest);setNotice('');}}catch{if(alive.current)setNotice(copy('Reload failed. Your edits are retained.','تعذرت إعادة التحميل. تم الاحتفاظ بتعديلاتك.'));}finally{lock.current=false;if(alive.current)setBusy(false);}};
 const save=async()=>{
  if(lock.current)return;
  const patch=Object.fromEntries(fields.filter(k=>draft[k]!==String(base[k]||'')).map(k=>[k,draft[k].trim()||null]));
  if(!Object.keys(patch).length)return;
  lock.current=true;setBusy(true);setNotice('');
  try{await requireAccount(account.uid);const r=await apiClient.supabase.rpc('update_seeker_optional_profile',{p_patch:patch,p_base:base}).abortSignal(AbortSignal.timeout(10000));if(r.error)throw r.error;await requireAccount(account.uid);if(alive.current&&useAuthStore.getState().userId===account.uid){setBase(r.data);setDraft(Object.fromEntries(fields.map(k=>[k,String(r.data[k]||'')])) as OptionalDraft);onUpdated({...account,profile:r.data});setNotice(copy('Optional information saved.','تم حفظ المعلومات الاختيارية.'));window.dispatchEvent(new Event('matchme:profile-changed'));}}
  catch{if(alive.current)setNotice(copy('Save failed or values changed elsewhere. Your edits are retained; reload the account to resolve conflicts.','تعذر الحفظ أو تغيّرت البيانات في مكان آخر. تم الاحتفاظ بتعديلاتك؛ أعد تحميل الحساب لحل التعارض.'));}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 return <section className="space-y-4"><h2 className="font-medium">{copy('Optional account information','معلومات الحساب الاختيارية')}</h2><p className="text-xs text-muted-foreground">{copy('These fields are optional and do not affect onboarding completion.','هذه الحقول اختيارية ولا تؤثر على إكمال التعريف.')}</p><fieldset disabled={busy} className="space-y-4">{fields.map((k,index)=><label key={k} className="block text-sm space-y-2"><span>{copy(['Disability / accommodation information','How did you hear about MatchMe?','Other source details'][index],['معلومات الإعاقة / التسهيلات','كيف سمعت عن MatchMe؟','تفاصيل المصدر الآخر'][index])}</span><Input value={draft[k]} maxLength={1000} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/></label>)}</fieldset><Button disabled={busy} onClick={()=>void save()}>{copy('Save optional information','حفظ المعلومات الاختيارية')}</Button>{notice&&<div className="space-y-2"><p role="status" className="text-sm">{notice}</p><Button variant="outline" disabled={busy} onClick={()=>void reload()}>{copy('Reload saved information','إعادة تحميل البيانات المحفوظة')}</Button></div>}</section>;
}
