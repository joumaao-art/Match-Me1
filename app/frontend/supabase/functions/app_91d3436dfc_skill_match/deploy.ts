export const SKILL_NAMES = ['React','TypeScript','JavaScript','Node.js','Python','Java','Kotlin','Swift','Flutter','React Native','PHP','Laravel','Django','.NET','SQL','PostgreSQL','MongoDB','AWS','Azure','Docker','Kubernetes','DevOps','CI/CD','Linux','UI/UX Design','Figma','Adobe XD','Graphic Design','Product Management','Agile','Scrum','Data Analysis','Data Science','Machine Learning','AI/ML','Power BI','Excel','Digital Marketing','SEO','Content Writing','Copywriting','Social Media','Sales','Business Development','Accounting','Finance','HR Management','Recruitment','Project Management','Customer Service','Customer Relationship Management','Microsoft Office','Communication','Leadership'];
export const SKILL_ALIASES: Record<string,string> = {'crm':'Customer Relationship Management','customer relationship management':'Customer Relationship Management','react.js':'React','reactjs':'React','nodejs':'Node.js','node js':'Node.js','js':'JavaScript','ts':'TypeScript','postgres':'PostgreSQL','amazon web services':'AWS','ms excel':'Excel','microsoft excel':'Excel','ms office':'Microsoft Office','search engine optimization':'SEO','customer support':'Customer Service','إدارة المشاريع':'Project Management','تحليل البيانات':'Data Analysis','خدمة العملاء':'Customer Service','المبيعات':'Sales','التواصل':'Communication','القيادة':'Leadership'};
export function normalizeSkill(value:string):string {
 const clean=value.normalize('NFKC').trim().replace(/\s+/g,' ');
 return SKILL_ALIASES[clean.toLowerCase()] || SKILL_NAMES.find(s=>s.toLowerCase()===clean.toLowerCase()) || clean;
}
export function skillKey(value:string):string { return normalizeSkill(value).toLowerCase(); }
export function uniqueSkills(values:string[]):string[] { return [...new Map(values.filter(s=>typeof s==='string'&&s.trim()).map(s=>[skillKey(s),normalizeSkill(s)])).values()]; }
export const isCredential=(value:string)=>/licen[cs]|certif|credential|\b(pmp|cpa|cfa|rn|md|phd|doctorate|bachelor|master)\b|ترخيص|رخصة|شهادة|بكالوريوس|دكتوراه/i.test(value);
export function containsSkill(text:string,skill:string):boolean {
 const keys=[skill,...Object.entries(SKILL_ALIASES).filter(([,s])=>skillKey(s)===skillKey(skill)).map(([s])=>s)];
 return keys.some(key=>new RegExp(`(^|[^\\p{L}\\p{N}])${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^\\p{L}\\p{N}]|$)`,'iu').test(text));
}
export type SkillPriority='required'|'preferred';
export type EvidenceSource='experience'|'education'|'certification'|'resume'|'profile';
export interface SkillRequirement {name:string;priority:SkillPriority;source:'structured'|'description'|'qualifications';quote:string;credential:boolean}
export interface SkillSuggestion extends SkillRequirement {matched:boolean;evidence:EvidenceSource[];selectable:boolean}
export interface SkillAnalysis {requirements:SkillSuggestion[];mode:'deterministic';reviewId:string;qualificationWarning:boolean}
export interface VacancySkills {required_skills?:string[];preferred_skills?:string[];job_description?:string;qualifications?:string;education_level?:string;seniority_level?:string}
export function extractRequirements(vacancy:VacancySkills):SkillRequirement[] {
 const result:SkillRequirement[]=(vacancy.required_skills||[]).filter(s=>typeof s==='string'&&s.trim()).map(s=>({name:normalizeSkill(s),priority:'required',source:'structured',quote:s,credential:isCredential(s)}));
 for(const s of vacancy.preferred_skills||[])if(typeof s==='string'&&s.trim())result.push({name:normalizeSkill(s),priority:'preferred',source:'structured',quote:s,credential:isCredential(s)});
 for(const source of ['description','qualifications'] as const){
  const text=source==='description'?vacancy.job_description:vacancy.qualifications;
  for(const sentence of (text||'').split(/[\n!?؛]|\.(?:\s|$)/).filter(Boolean)){
   if(!/required|must|essential|mandatory|مطلوب|يشترط|إلزامي|preferred|desirable|nice.to.have|يفضل/i.test(sentence))continue;
   const priority:SkillPriority=/required|must|essential|mandatory|مطلوب|يشترط|إلزامي/i.test(sentence)&&!/preferred|desirable|nice.to.have|يفضل/i.test(sentence)?'required':'preferred';
   for(const name of SKILL_NAMES)if(containsSkill(sentence,name))result.push({name,priority,source,quote:sentence.trim().slice(0,300),credential:isCredential(name)||isCredential(sentence)});
  }
 }
 return deduplicateRequirements(result);
}
export function deduplicateRequirements(values:SkillRequirement[]):SkillRequirement[]{
 const map=new Map<string,SkillRequirement>();
 for(const item of values){const key=skillKey(item.name);const old=map.get(key);if(!old||old.priority!=='required'&&item.priority==='required')map.set(key,item);}
 return [...map.values()].slice(0,100);
}
export function analyzeSkills(requirements:SkillRequirement[],skills:string[],evidence:Partial<Record<EvidenceSource,string[]>>):SkillSuggestion[]{
 const owned=new Set(skills.map(skillKey));
 return requirements.map(r=>({...r,matched:owned.has(skillKey(r.name)),evidence:(Object.entries(evidence) as [EvidenceSource,string[]][]).filter(([,text])=>text.some(t=>containsSkill(t,r.name))).map(([source])=>source),selectable:!r.credential&&!owned.has(skillKey(r.name))})).sort((a,b)=>Number(b.priority==='required')-Number(a.priority==='required')||Number(b.evidence.length>0)-Number(a.evidence.length>0)||a.name.localeCompare(b.name));
}
export function redactEvidence(value:unknown):string {
 return typeof value==='string'?value.replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d ()-]{7,}\d/gi,'[redacted]').slice(0,1500):'';
}



/** Provider boundary: extraction/comparison remain independent of UI, confirmation and scoring. */
export interface SkillRecommendationProvider {
 readonly id:string;
 extract(vacancy:VacancySkills):SkillRequirement[];
 compare(requirements:SkillRequirement[],skills:string[]):SkillSuggestion[];
}
export const deterministicSkillProvider:SkillRecommendationProvider={
 id:'deterministic-v2',
 extract:extractRequirements,
 compare:(requirements,skills)=>analyzeSkills(requirements,skills,{}),
};

import { createClient } from 'npm:@supabase/supabase-js@2';


const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST, OPTIONS'};
Deno.serve(async req=>{
 const requestId=crypto.randomUUID();
 const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return respond({error:'Method not allowed'},405);
 console.info(JSON.stringify({requestId,method:req.method,contentLength:req.headers.get('content-length')}));
 try{
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
  if(!token)return respond({error:'Authentication required'},401);
  const auth=await admin.auth.getUser(token);
  if(auth.error||!auth.data.user)return respond({error:'Authentication required'},401);
  let body;try{body=await req.json();}catch{return respond({error:'Invalid body'},400);}
  if(!body||typeof body.jobId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.jobId))return respond({error:'Invalid vacancy'},400);
  const uid=auth.data.user.id;
  const reserved=await admin.rpc('app_91d3436dfc_begin_skill_review',{p_user:uid,p_job:body.jobId});
  if(reserved.error)return respond({error:'Review unavailable or rate limit reached'},429);
  const [job,profile]=await Promise.all([
   admin.from('vacancies').select('*').eq('id',body.jobId).single(),
   admin.from('job_seeker_profiles').select('skills').eq('user_id',uid).single(),
  ]);
  if(job.error||profile.error)throw new Error('Authorized data unavailable');
  if(job.data.status!=='open'||job.data.expiration_date&&job.data.expiration_date.slice(0,10)<new Date().toISOString().slice(0,10))return respond({error:'Vacancy unavailable'},409);
  const revision=JSON.stringify({id:body.jobId,updated:job.data.updated_at,required:job.data.required_skills,preferred:job.data.preferred_skills,description:job.data.job_description,qualifications:job.data.qualifications});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(revision)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const cacheKey=`${deterministicSkillProvider.id}:${hash}`;
  const cached=await admin.from('app_91d3436dfc_skill_requirement_cache').select('requirements').eq('cache_key',cacheKey).gt('expires_at',new Date().toISOString()).maybeSingle();
  const requirements=cached.data?.requirements||deterministicSkillProvider.extract(job.data);
  if(!cached.data){const result=await admin.from('app_91d3436dfc_skill_requirement_cache').upsert({cache_key:cacheKey,requirements,expires_at:new Date(Date.now()+86400000).toISOString()},{onConflict:'cache_key'});if(result.error)console.warn(JSON.stringify({requestId,step:'cache',code:result.error.code}));}
  const suggestions=deterministicSkillProvider.compare(requirements,profile.data.skills||[]);
  const saved=await admin.from('app_91d3436dfc_skill_reviews').update({allowed_skills:suggestions.filter(r=>r.selectable).map(r=>r.name)}).eq('id',reserved.data).eq('user_id',uid);
  if(saved.error)throw saved.error;
  console.info(JSON.stringify({requestId,step:'review-complete',count:suggestions.length,provider:deterministicSkillProvider.id}));
  return respond({requirements:suggestions,reviewId:reserved.data,mode:'deterministic',qualificationWarning:!!job.data.qualifications||!!job.data.education_level||suggestions.some(r=>r.credential)});
 }catch(error){console.error(JSON.stringify({requestId,step:'review-failed',message:error instanceof Error?error.message:'Review unavailable'}));return respond({error:'Review unavailable. Swipe remains available.'},503);}
});
