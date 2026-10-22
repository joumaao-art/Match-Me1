import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';
import { migrateMobile, validateMobile, type MobileStep, type MobileDraft, type MobileEducation, type MobileExperience } from './mobile-onboarding';
import { calculateMandatoryCompletion } from '@/components/shared/ProfileCompletion';
import { readHistory } from './canonical-profile';

export const REQUIRED_PROFILE_STEPS: MobileStep[] = ['PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY'];
export function mandatoryProfileChecklist(draft: MobileDraft) {
  return REQUIRED_PROFILE_STEPS.map(step=>({step,completed:Object.keys(validateMobile(step,draft)).length===0}));
}
export function useMandatoryProfile() {
  const uid=useAuthStore(s=>s.userId);
  const [draft,setDraft]=useState<MobileDraft|null>(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    if(!uid)return;
    let alive=true;setDraft(null);
    const refresh=async()=>{
      try {
        const [p,education,experience]=await Promise.all([
          apiClient.supabase.from('job_seeker_profiles').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).single(),
          readHistory('education',uid),readHistory('experience',uid),
        ]);
        if(p.error)throw p.error;
        const d=migrateMobile(null,p.data).draft;
        d.educations=(education||[]) as MobileEducation[];d.experiences=(experience||[]) as MobileExperience[];
        if(alive&&useAuthStore.getState().userId===uid){setDraft(d);setError(false);}
      } catch { if(alive)setError(true); }
    };
    void refresh();window.addEventListener('focus',refresh);window.addEventListener('matchme:profile-changed',refresh);window.addEventListener('matchme:preferences-changed',refresh);
    return()=>{alive=false;window.removeEventListener('focus',refresh);window.removeEventListener('matchme:profile-changed',refresh);window.removeEventListener('matchme:preferences-changed',refresh);};
  },[uid]);
  const checklist=draft?mandatoryProfileChecklist(draft):null;
  const percentage=checklist?calculateMandatoryCompletion(checklist).percentage:null;
  return {draft,checklist,percentage,error};
}
