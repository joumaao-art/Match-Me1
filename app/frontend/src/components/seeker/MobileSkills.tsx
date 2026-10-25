import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api-client';
import { requireAccount, type AccountSnapshot } from '@/services/mobile-account';
import { useAuthStore } from '@/stores';
export function MobileSkills({account,onUpdated}:{account:AccountSnapshot;onUpdated:(a:AccountSnapshot)=>void}){
 const {i18n}=useTranslation();const c=(en:string,ar:string)=>i18n.language.startsWith('ar')?ar:en;
 const [text,setText]=useState((account.profile.skills||[]).join('\n'));const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const lock=useRef(false);
 const save=async()=>{if(lock.current)return;lock.current=true;setBusy(true);setNotice('');try{await requireAccount(account.uid);const skills=[...new Set(text.split('\n').map(s=>s.trim()).filter(Boolean))];const r=await apiClient.supabase.from('job_seeker_profiles').update({skills}).eq('user_id',account.uid).select('*').single();if(r.error)throw r.error;if(useAuthStore.getState().userId===account.uid){onUpdated({...account,profile:r.data});setNotice(c('Skills saved.','تم حفظ المهارات.'));window.dispatchEvent(new Event('matchme:profile-changed'));}}catch{setNotice(c('Save failed. Your changes are retained.','تعذر الحفظ. تم الاحتفاظ بتعديلاتك.'));}finally{lock.current=false;setBusy(false);}};
 return <div className="space-y-5"><h1 className="text-xl font-semibold">{c('Skills','المهارات')}</h1><label htmlFor="saved-skills" className="block text-sm space-y-2"><span>{c('One skill per line. Add, edit or remove entries, then save.','مهارة واحدة في كل سطر. أضف أو عدّل أو احذف ثم احفظ.')}</span><textarea id="saved-skills" className="w-full min-h-56 border rounded-lg p-3 bg-background" value={text} onChange={e=>setText(e.target.value)} disabled={busy}/></label><Button className="w-full h-12" onClick={()=>void save()} disabled={busy}>{c('Save','حفظ')}</Button>{notice&&<p role="status" className="text-sm">{notice}</p>}</div>;
}
