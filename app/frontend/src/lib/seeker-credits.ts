import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';

export async function claimSignupCredits(): Promise<number> {
 const {data,error}=await apiClient.rpc<number>('claim_seeker_signup_credits');
 if(error||data===null)throw error||new Error('Credit grant unavailable');
 window.dispatchEvent(new Event('matchme:credits-changed'));return data;
}
export async function spendSwipeCredit(jobId:string,direction:'left'|'right'):Promise<number> {
 const {data,error}=await apiClient.rpc<number>('spend_seeker_swipe_credit',{operation_key:`swipe:${jobId}:${direction}`});
 if(error||data===null)throw error||new Error('Credit deduction unavailable');
 window.dispatchEvent(new Event('matchme:credits-changed'));return data;
}
export function useCreditAccount(uid:string|null) {
 const [balance,setBalance]=useState<number|null>(null); const [error,setError]=useState(false);
 useEffect(()=>{
  let alive=true;setBalance(null);
  const refresh=async()=>{
   if(!uid)return;
   const r=await apiClient.supabase.from('seeker_credit_accounts').select('balance').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).maybeSingle();
   if(alive){setError(!!r.error);if(!r.error)setBalance(r.data?.balance??0);}
  };
  void refresh();const timer=window.setInterval(()=>void refresh(),15000);
  window.addEventListener('matchme:credits-changed',refresh);window.addEventListener('focus',refresh);
  return ()=>{alive=false;clearInterval(timer);window.removeEventListener('matchme:credits-changed',refresh);window.removeEventListener('focus',refresh);};
 },[uid]);
 return {balance,error};
}
