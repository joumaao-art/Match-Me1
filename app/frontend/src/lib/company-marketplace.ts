import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores';
import type { Vacancy } from '@/types/job.types';

export interface CompanyProfile {
 id:string; user_id:string; company_name:string|null; industry:string|null; size:string|null;
 website:string|null; contact_phone:string|null; country:string|null; city:string|null;
 location:string|null; description:string|null; culture:string|null; founded_year:number|null; logo_url:string|null;
}
export interface CompanyApplicant {
 vacancy_id:string; company_id:string; seeker_user_id:string; job_title:string;
 application_status:'pending'|'withdrawn'; company_status:string; applied_at:string;
 full_name:string|null; headline:string|null; location:string|null; skills:string[]|null;
 experience_years:number|null; education:string|null; bio:string|null;
}
export async function ensureCompanyProfile(uid:string):Promise<CompanyProfile> {
 const base=await authService.createUserProfile(uid,'company');if(base.error)throw new Error(base.error.message);
 const role=await authService.getUserRole(uid);if(role!=='company')throw new Error('Company account required');
 const result=await authService.createRoleProfile(uid,'company','');if(result.error)throw new Error(result.error.message);
 const profile=await apiClient.supabase.from('company_profiles').select('*').eq('user_id',uid).single();
 if(profile.error)throw profile.error;return profile.data as CompanyProfile;
}
export function useCompanyMarketplace() {
 const uid=useAuthStore(s=>s.userId);const generation=useRef(0);
 const [profile,setProfile]=useState<CompanyProfile|null>(null);const [vacancies,setVacancies]=useState<Vacancy[]>([]);
 const [applicants,setApplicants]=useState<CompanyApplicant[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const refresh=useCallback(async()=>{
  const request=++generation.current;
  const owned=()=>generation.current===request&&useAuthStore.getState().userId===uid;
  try {
   if(!uid)throw new Error('Please sign in.');
   const company=await ensureCompanyProfile(uid);
   const [v,a]=await Promise.all([
    apiClient.supabase.from('vacancies').select('*').eq('company_id',company.id).order('created_at',{ascending:false}).abortSignal(AbortSignal.timeout(10000)),
    apiClient.supabase.rpc('get_company_applicants').abortSignal(AbortSignal.timeout(10000)),
   ]);
   if(v.error||a.error)throw v.error||a.error;
   if(owned()){setProfile(company);setVacancies(v.data as Vacancy[]);setApplicants(a.data as CompanyApplicant[]);setError('');}
  }catch(e){if(owned())setError((e as Error).message);}finally{if(owned())setLoading(false);}
 },[uid]);
 useEffect(()=>{
  setProfile(null);setVacancies([]);setApplicants([]);setLoading(true);void refresh();
  window.addEventListener('focus',refresh);window.addEventListener('matchme:jobs-changed',refresh);window.addEventListener('matchme:company-changed',refresh);
  const timer=window.setInterval(()=>void refresh(),30000);
  return()=>{generation.current++;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('matchme:jobs-changed',refresh);window.removeEventListener('matchme:company-changed',refresh);};
 },[refresh]);
 return {profile,vacancies,applicants,loading,error,refresh};
}
