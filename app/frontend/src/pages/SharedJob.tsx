import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';
import { rememberSharedJob, isAvailableJob } from '@/lib/swipe-presentation';

export default function SharedJob() {
 const {id=''}=useParams();const navigate=useNavigate();const {i18n}=useTranslation();const ar=i18n.language.startsWith('ar');const copy=(en:string,arabic:string)=>ar?arabic:en;
 const authenticated=useAuthStore(s=>s.isAuthenticated);
 const [state,setState]=useState<'loading'|'available'|'unavailable'|'private'|'error'>('loading');
 const [title,setTitle]=useState('');const [company,setCompany]=useState('');
 const storeValue=import.meta.env.VITE_MATCHME_PLAY_STORE_URL;let storeUrl:string|null=null;
 try{const u=new URL(storeValue||'');if(u.protocol==='https:'&&u.hostname==='play.google.com'&&u.pathname==='/store/apps/details'&&u.searchParams.get('id'))storeUrl=u.toString();}catch{/* No invented listing. */}
 useEffect(()=>{
  let alive=true;setState('loading');
  if(!/^[0-9a-f-]{36}$/i.test(id)){setState('unavailable');return;}
  void apiClient.supabase.from('vacancies').select('id,job_title,status,expiration_date,company:company_profiles(company_name)').eq('id',id).abortSignal(AbortSignal.timeout(10000)).maybeSingle().then(r=>{
   if(!alive)return;
   if(r.error){setState(authenticated?'error':'private');return;}
   if(!r.data){setState(authenticated?'unavailable':'private');return;}
   setTitle(r.data.job_title);setCompany((r.data.company as unknown as {company_name?:string}|null)?.company_name||'');setState(isAvailableJob(r.data)?'available':'unavailable');
  });
  return()=>{alive=false;};
 },[id,authenticated]);
 const open=()=>{rememberSharedJob(id);navigate(authenticated?`/seeker?view=swipe&job=${encodeURIComponent(id)}`:'/auth?role=job_seeker');};
 return <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-background"><section className="max-w-md w-full border rounded-xl p-6 space-y-4 text-center"><p className="font-semibold text-primary">MatchMe</p><h1 className="text-xl font-semibold">{title||copy('A job opportunity on MatchMe','فرصة عمل على MatchMe')}</h1>{company&&<p className="text-sm text-muted-foreground">{company}</p>}{storeUrl&&state!=='unavailable'&&<a href={storeUrl} onClick={()=>rememberSharedJob(id)} className="block text-primary underline min-h-11 py-3">{copy('Download MatchMe on Google Play','تنزيل MatchMe من Google Play')}</a>}<p role="status" className="text-sm text-muted-foreground">{state==='loading'?copy('Loading job…','جارٍ تحميل الوظيفة…'):state==='unavailable'?copy('This job is no longer available.','هذه الوظيفة لم تعد متاحة.'):state==='private'?copy('Sign in to check availability and view this job.','سجل الدخول للتحقق من توفر الوظيفة وعرضها.'):state==='error'?copy('Unable to load the job. Try opening it in MatchMe.','تعذر تحميل الوظيفة. حاول فتحها في MatchMe.'):copy('View this job and apply in MatchMe.','اعرض هذه الوظيفة وتقدم إليها في MatchMe.')}</p>{state!=='loading'&&state!=='unavailable'&&<Button className="w-full min-h-11" onClick={open}>{authenticated?copy('Open job','فتح الوظيفة'):copy('Login or sign up to view job','سجل الدخول أو أنشئ حساباً لعرض الوظيفة')}</Button>}{state==='unavailable'&&<Button onClick={()=>navigate('/seeker?view=swipe')}>{copy('Browse jobs','تصفح الوظائف')}</Button>}</section></main>;
}
