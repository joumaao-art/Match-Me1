import { preferenceFit, type JobPreferences } from './job-preferences';
import { isAvailableJob } from './swipe-presentation';
import type { DiscoverJob, JobAction } from './seeker-jobs';

export function rankEligibleVacancies(jobs:DiscoverJob[],actions:JobAction[],prefs:JobPreferences,requested?:string|null){
 const decided=new Set(actions.filter(a=>a.direction).map(a=>a.vacancy_id));
 const eligible=jobs.filter(j=>isAvailableJob(j)&&!decided.has(j.id));
 return eligible.map(job=>{
  let score=0;
  try{const fit=preferenceFit(prefs,{title:job.job_title,employmentType:job.employment_type,skills:job.required_skills});if(Number.isFinite(fit))score=Math.round(fit*100);}catch{score=0;}
  return {...job,compatibility_score:score,explanation:undefined};
 }).sort((a,b)=>a.id===requested?-1:b.id===requested?1:b.compatibility_score-a.compatibility_score||String(b.posting_date||b.created_at||'').localeCompare(String(a.posting_date||a.created_at||''))||a.id.localeCompare(b.id));
}
