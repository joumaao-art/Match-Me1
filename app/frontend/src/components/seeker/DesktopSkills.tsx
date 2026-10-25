import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SkillPicker } from '@/components/onboarding/OnboardingKit';
import { SKILL_TAXONOMY } from '@/lib/onboarding-engine';
import { apiClient } from '@/services/api-client';
import { requireAccount, type AccountSnapshot } from '@/services/mobile-account';
import { useAuthStore } from '@/stores';

export function DesktopSkills({account,onUpdated}:{account:AccountSnapshot;onUpdated:(account:AccountSnapshot)=>void}) {
 const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');
 const [skills,setSkills]=useState(account.profile.skills??[]);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const lock=useRef(false);
 const save=async()=>{if(lock.current)return;if(!skills.length){setNotice(ar?'اختر مهارة واحدة على الأقل.':'Select at least one skill.');return;}lock.current=true;setBusy(true);setNotice('');try{await requireAccount(account.uid);const result=await apiClient.supabase.from('job_seeker_profiles').update({skills:[...new Set(skills.map(value=>value.trim()).filter(Boolean))]}).eq('user_id',account.uid).select('*').abortSignal(AbortSignal.timeout(10000)).single();if(result.error)throw result.error;if(useAuthStore.getState().userId!==account.uid)return;onUpdated({...account,profile:result.data});setNotice(ar?'تم حفظ المهارات.':'Skills saved.');window.dispatchEvent(new Event('matchme:profile-changed'));}catch{setNotice(ar?'تعذر الحفظ. تم الاحتفاظ بتعديلاتك.':'Save failed. Your edits are retained.');}finally{lock.current=false;setBusy(false);}};
 return <section className="space-y-6"><h1 className="text-xl font-semibold">{ar?'المهارات':'Skills'}</h1><fieldset disabled={busy}><SkillPicker taxonomy={SKILL_TAXONOMY} skills={skills} onChange={setSkills}/></fieldset><Button disabled={busy} onClick={()=>void save()}>{ar?'حفظ':'Save'}</Button>{notice&&<p role="status" className="text-sm">{notice}</p>}</section>;
}
