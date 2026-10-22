import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';

export async function claimSignupCredits(): Promise<number> {
 const {data,error}=await apiClient.supabase.rpc('claim_seeker_signup_credits').abortSignal(AbortSignal.timeout(10000));
 if(error||typeof data!=='number')throw error||new Error('Credit grant unavailable');
 window.dispatchEvent(new Event('matchme:credits-changed'));return data;
}
export async function spendSwipeCredit(jobId:string,direction:'left'|'right'):Promise<number> {
 const {data,error}=await apiClient.rpc<number>('spend_seeker_swipe_credit',{operation_key:`swipe:${jobId}:${direction}`});
 if(error||data===null)throw error||new Error('Credit deduction unavailable');
 window.dispatchEvent(new Event('matchme:credits-changed'));return data;
}
export function useCreditAccount(uid:string|null) {
 const [balance,setBalance]=useState<number|null>(null); const [error,setError]=useState(false);
 const role=useAuthStore(s=>s.userRole);
 useEffect(()=>{
  let alive=true;let request=0;setBalance(null);setError(false);
  const owned=()=>alive&&useAuthStore.getState().userId===uid;
  const refresh=async(repair=false)=>{
   if(!uid||role!=='job_seeker')return;
   const generation=++request;
   try{
    if(repair){
     const r=await apiClient.supabase.rpc('claim_seeker_signup_credits').abortSignal(AbortSignal.timeout(10000));
     if(r.error||typeof r.data!=='number')throw r.error||new Error('Credit grant unavailable');
     if(owned()&&generation===request){setBalance(r.data);setError(false);}
    }else{
     const r=await apiClient.supabase.from('seeker_credit_accounts').select('balance').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).single();
     if(r.error)throw r.error;
     if(owned()&&generation===request){setBalance(r.data.balance);setError(false);}
    }
   }catch{if(owned()&&generation===request)setError(true);}
  };
  void refresh(true);
  const reload=()=>void refresh(true);
  const timer=window.setInterval(()=>void refresh(),15000);
  window.addEventListener('matchme:credits-changed',reload);window.addEventListener('focus',reload);
  return ()=>{alive=false;request++;clearInterval(timer);window.removeEventListener('matchme:credits-changed',reload);window.removeEventListener('focus',reload);};
 },[uid,role]);
 return {balance,error};
}
