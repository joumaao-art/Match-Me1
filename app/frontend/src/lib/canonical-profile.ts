import { apiClient } from '@/services/api-client';
import { normalizeEducation, normalizeExperience, type EducationRecord, type ExperienceRecord, type SeekerProfileRecord } from './profile-standards';

const monthDate=(v:string)=>v ? `${v.slice(0,7).length===4?`${v.slice(0,4)}-01`:v.slice(0,7)}-01` : null;
export async function readHistory(name:string,uid:string):Promise<unknown[]|null> {
 if(name!=='education'&&name!=='experience')return null;
 const r=await apiClient.supabase.from(name).select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000));if(r.error)throw r.error;
 return (r.data||[]).map(x=>name==='education'?normalizeEducation({id:x.id,institution:x.institution,degree:x.degree_code||x.degree,field:x.field_of_study,from:x.start_date,to:x.end_date,current:x.is_current,grade:x.grade,country:x.country,city:x.city}):normalizeExperience({id:x.id,title:x.job_title,company:x.company_name,type:x.employment_type,from:x.start_date,to:x.end_date,current:x.is_current,country:x.country,city:x.city,description:x.description,industry:x.industry}));
}
export async function writeHistory(name:string,uid:string,items:unknown[],previous:unknown[]):Promise<void> {
 if(name!=='education'&&name!=='experience')return;
 const next=(items as {id:string}[]).map(x=>({...x,id:/^[0-9a-f-]{36}$/i.test(x.id)?x.id:crypto.randomUUID()}));
 const rows=next.map(raw=>{
  if(name==='education'){const x=raw as EducationRecord;return {id:x.id,user_id:uid,institution:x.institution,degree:x.degree,degree_code:x.degree,field_of_study:x.field,start_date:monthDate(x.from),end_date:monthDate(x.to),is_current:x.current,country:x.country||null,city:x.city||null,...(x.grade?{grade:x.grade}:{})};}
  const x=raw as ExperienceRecord;return {id:x.id,user_id:uid,job_title:x.title,company_name:x.company,employment_type:x.type,start_date:monthDate(x.from),end_date:x.current?null:monthDate(x.to),is_current:x.current,country:x.country,city:x.city,description:x.description,industry:x.industry||null};
 });
 if(rows.length){const r=await apiClient.supabase.from(name).upsert(rows,{onConflict:'id'}).abortSignal(AbortSignal.timeout(10000));if(r.error)throw r.error;}
 const removed=(previous as {id:string}[]).filter(x=>/^[0-9a-f-]{36}$/i.test(x.id)&&!next.some(n=>n.id===x.id)).map(x=>x.id);
 if(removed.length){const r=await apiClient.supabase.from(name).delete().eq('user_id',uid).in('id',removed).abortSignal(AbortSignal.timeout(10000));if(r.error)throw r.error;}
 (items as {id:string}[]).forEach((x,i)=>{x.id=next[i].id;});
}
export async function readCanonicalProfile(uid:string):Promise<SeekerProfileRecord> {
 const r=await apiClient.supabase.from('job_seeker_profiles').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).maybeSingle();if(r.error)throw r.error;const x=r.data||{};
 return {firstName:x.first_name||'',lastName:x.last_name||'',email:x.email||'',mobile:x.phone||'',country:x.country||'',city:x.city||'',nationalities:x.nationalities||[],dob:x.date_of_birth||'',photoUrl:x.avatar_url||'',headline:x.headline||'',summary:x.bio||'',openToWork:x.is_available!==false};
}
export async function writeCanonicalProfile(uid:string,p:SeekerProfileRecord):Promise<void> {
 const r=await apiClient.supabase.from('job_seeker_profiles').update({first_name:p.firstName,last_name:p.lastName,full_name:`${p.firstName} ${p.lastName}`.trim(),email:p.email,phone:p.mobile,country:p.country,city:p.city,nationalities:p.nationalities,date_of_birth:p.dob||null,avatar_url:p.photoUrl,headline:p.headline,bio:p.summary,is_available:p.openToWork}).eq('user_id',uid).abortSignal(AbortSignal.timeout(10000));if(r.error)throw r.error;
}
