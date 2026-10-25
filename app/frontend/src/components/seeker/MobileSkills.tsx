import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { saveProfileSkills, type AccountSnapshot } from '@/services/mobile-account';
import { useAuthStore } from '@/stores';
export function MobileSkills({account,onUpdated}:{account:AccountSnapshot;onUpdated:(a:AccountSnapshot)=>void}){
 const {i18n}=useTranslation();const c=(en:string,ar:string)=>i18n.language.startsWith('ar')?ar:en;
 const [text,setText]=useState((account.profile.skills||[]).join('\n'));const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const lock=useRef(false);
 const base=useRef(account.profile.skills||[]);
 const save=async()=>{if(lock.current)return;lock.current=true;setBusy(true);setNotice('');try{const skills=text.split('\n').map(s=>s.trim()).filter(Boolean);const saved=await saveProfileSkills(account.uid,base.current,skills);if(useAuthStore.getState().userId===account.uid){base.current=saved;onUpdated({...account,profile:{...account.profile,skills:saved}});setNotice(c('Skills saved.','تم حفظ المهارات.'));window.dispatchEvent(new Event('matchme:profile-changed'));}}catch(e){setNotice((e as Error).message);}finally{lock.current=false;setBusy(false);}};
 return <div className="space-y-5"><h1 className="text-xl font-semibold">{c('Skills','المهارات')}</h1><label htmlFor="saved-skills" className="block text-sm space-y-2"><span>{c('One skill per line. Add, edit or remove entries, then save.','مهارة واحدة في كل سطر. أضف أو عدّل أو احذف ثم احفظ.')}</span><textarea id="saved-skills" className="w-full min-h-56 border rounded-lg p-3 bg-background" value={text} onChange={e=>setText(e.target.value)} disabled={busy}/></label><Button className="w-full h-12" onClick={()=>void save()} disabled={busy}>{c('Save','حفظ')}</Button>{notice&&<p role="status" className="text-sm">{notice}</p>}</div>;
}
