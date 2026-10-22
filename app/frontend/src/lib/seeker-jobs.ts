import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';

export interface DiscoverJob {
 id:string; company_name:string; industry:string; country:string; city:string;
 employment_type:string; min_experience:number; max_experience:number; job_title:string;
 job_description:string; required_skills:string[]; salary_min:number; salary_max:number;
 compatibility_score:number; status:string;
}
export interface JobAction {vacancy_id:string;direction:'left'|'right'|null;saved:boolean;application_status:'pending'|'withdrawn'|null;updated_at:string;}
export async function recordJobAction(jobId:string,action:'left'|'right'|'save'|'unsave'|'undo'|'withdraw'):Promise<void> {
 const {error}=await apiClient.supabase.rpc('record_seeker_job_action',{job_id:jobId,action}).abortSignal(AbortSignal.timeout(12000));
 if(error)throw error;
 window.dispatchEvent(new Event('matchme:jobs-changed'));
 window.dispatchEvent(new Event('matchme:credits-changed'));
}
export async function shareJob(job:DiscoverJob):Promise<'shared'|'copied'> {
 const url=new URL('/seeker',window.location.origin);url.searchParams.set('view','swipe');url.searchParams.set('job',job.id);
 if(navigator.share){await navigator.share({title:job.job_title,text:`${job.job_title} — ${job.company_name}`,url:url.toString()});return 'shared';}
 await navigator.clipboard.writeText(url.toString());return 'copied';
}
export function useSeekerJobs() {
 const uid=useAuthStore(s=>s.userId);
 const [jobs,setJobs]=useState<DiscoverJob[]>([]);const [actions,setActions]=useState<JobAction[]>([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
 const generation=useRef(0);const mounted=useRef(false);
 const refresh=useCallback(async()=>{
  if(!uid)return;const request=++generation.current;
  const owned=()=>mounted.current&&generation.current===request&&useAuthStore.getState().userId===uid;
  try {
   const [vacancies,history]=await Promise.all([
    apiClient.supabase.from('vacancies').select('*,company:company_profiles(company_name,industry)').eq('status','open').order('created_at',{ascending:false}).limit(100).abortSignal(AbortSignal.timeout(10000)),
    apiClient.supabase.from('seeker_job_actions').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)),
   ]);
   if(vacancies.error||history.error)throw vacancies.error||history.error;
    const historicIds=(history.data||[]).filter(a=>a.saved||a.direction==='right').map(a=>a.vacancy_id).filter(id=>!(vacancies.data||[]).some(j=>j.id===id));
    if(historicIds.length){const historic=await apiClient.supabase.from('vacancies').select('*,company:company_profiles(company_name,industry)').in('id',historicIds).abortSignal(AbortSignal.timeout(10000));if(historic.error)throw historic.error;vacancies.data?.push(...(historic.data||[]));}
    if(!owned())return;
   setJobs((vacancies.data||[]).map(j=>({id:j.id,company_name:j.company?.company_name||'',industry:j.company?.industry||'',country:j.country||'',city:j.city||'',employment_type:j.employment_type||'',min_experience:j.min_experience||0,max_experience:j.max_experience||0,job_title:j.job_title,job_description:j.job_description||'',required_skills:j.required_skills||[],salary_min:j.salary_min||0,salary_max:j.salary_max||0,compatibility_score:0,status:j.status})));
   setActions((history.data||[]) as JobAction[]);setError(false);
  }catch{if(owned())setError(true);}finally{if(owned())setLoading(false);}
 },[uid]);
 useEffect(()=>{mounted.current=true;setLoading(true);setJobs([]);setActions([]);void refresh();window.addEventListener('matchme:jobs-changed',refresh);const poll=window.setInterval(()=>void refresh(),30000);return()=>{mounted.current=false;generation.current++;window.clearInterval(poll);window.removeEventListener('matchme:jobs-changed',refresh);};},[refresh]);
 return {jobs,actions,loading,error,refresh};
}
