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
