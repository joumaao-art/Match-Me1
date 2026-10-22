import { apiClient } from '@/services/api-client';
import { normalizeDraft, type OnboardingState } from './onboarding-engine';
import { EMPTY_PREFERENCES, migrateLegacyPreferences, savePreferences, type JobPreferences } from './job-preferences';
import { normalizeEducation, normalizeExperience, type EducationRecord, type ExperienceRecord } from './profile-standards';

export const MOBILE_STEPS = ['PERSONAL_DETAILS','GENDER','BIRTHDAY','CURRENT_LOCATION','SKILLS','EDUCATION','EXPERIENCE','PREFERENCES','SENIORITY','FREE_CREDITS','HOW_IT_WORKS'] as const;
export type MobileStep = typeof MOBILE_STEPS[number];
export type MobileScreen = MobileStep | 'INTRO' | 'COMPLETE';
export type MobileEducation = EducationRecord & { country: string; city: string };
export type MobileExperience = ExperienceRecord & { industry: string };
export interface MobileDraft {
 firstName: string; lastName: string; email: string; mobile: string; headline: string; summary: string;
 nationalities: string[]; cvUrl: string; cvName: string; detectedSkills: string[];
 gender: string; birthday: string; country: string; city: string; skills: string[];
 educations: MobileEducation[]; experiences: MobileExperience[]; noExperience: boolean;
 preferences: JobPreferences;
}
export interface MobileState { version: 3; screen: MobileScreen; done: MobileStep[]; draft: MobileDraft; revision: number; }
export function emptyMobileState(): MobileState {
 return { version:3,screen:'INTRO',done:[],revision:0,draft:{firstName:'',lastName:'',email:'',mobile:'',headline:'',summary:'',nationalities:[],cvUrl:'',cvName:'',detectedSkills:[],gender:'',birthday:'',country:'',city:'',skills:[],educations:[],experiences:[],noExperience:false,preferences:{...EMPTY_PREFERENCES}} };
}
const key = (uid: string) => `matchme-mobile-onboarding:${uid}`;
export function cacheMobile(uid: string, state: MobileState): boolean { try {localStorage.setItem(key(uid),JSON.stringify(state));return true;}catch{return false;} }
export function readMobileCache(uid: string): MobileState | null { try { const raw=JSON.parse(localStorage.getItem(key(uid))||'null'); return raw?.version===3 ? normalizeMobile(raw) : null; } catch {return null;} }
export function normalizeMobile(raw: Partial<MobileState>): MobileState {
 const base=emptyMobileState(); const d={...base.draft,...raw.draft};
 for(const field of ['firstName','lastName','email','mobile','headline','summary','cvUrl','cvName','gender','birthday','country','city'] as const)d[field]=typeof d[field]==='string'?d[field]:'';
 for(const field of ['nationalities','detectedSkills','skills'] as const)d[field]=Array.isArray(d[field])?d[field].filter(v=>typeof v==='string'):[];
 d.educations=Array.isArray(d.educations)?d.educations.filter(x=>x&&typeof x.id==='string').map(x=>({...normalizeEducation(x),country:typeof x.country==='string'?x.country:'',city:typeof x.city==='string'?x.city:''})):[];
 d.experiences=Array.isArray(d.experiences)?d.experiences.filter(x=>x&&typeof x.id==='string').map(x=>({...normalizeExperience(x),industry:typeof x.industry==='string'?x.industry:''})):[];
 d.noExperience=d.noExperience===true;
 return {...base,...raw,version:3,revision:Number.isFinite(raw.revision)?raw.revision!:0,screen:['INTRO','COMPLETE',...MOBILE_STEPS].includes(raw.screen ?? '') ? raw.screen! : 'INTRO',done:Array.isArray(raw.done)?[...new Set(raw.done.filter(s=>MOBILE_STEPS.includes(s)))]:[],draft:{...d,preferences:migrateLegacyPreferences(d.preferences||{})}};
}
/** Only transfer a legacy completion when its data still meets the new step contract. */
export function migrateMobile(legacy: OnboardingState | null, profile: Record<string, unknown> = {}): MobileState {
 const state=emptyMobileState(); const old=normalizeDraft(legacy?.draft); const names=(String(profile.full_name||old.full_name||'')).trim().split(/\s+/);
 state.draft={...state.draft,firstName:String(profile.first_name||names[0]||''),lastName:String(profile.last_name||names.slice(1).join(' ')),email:String(profile.email||''),mobile:String(profile.phone||''),headline:String(profile.headline||old.headline),summary:String(profile.bio||''),nationalities:(profile.nationalities as string[])||[],cvUrl:String(profile.cv_url||old.resume.cvUrl||''),cvName:old.resume.fileName||'',gender:String(profile.gender||old.gender||''),birthday:String(profile.date_of_birth||old.birth_date||''),country:String(profile.country||old.country||''),city:String(profile.city||old.city),skills:(profile.skills as string[])||old.skills,preferences:migrateLegacyPreferences({...old,...(profile.job_preferences as object||{})})};
 state.draft.noExperience=(profile.job_preferences as {noExperience?:boolean}|undefined)?.noExperience===true;
 const map: Partial<Record<MobileStep,string>>={PERSONAL_DETAILS:'profile_setup',GENDER:'gender',BIRTHDAY:'birthday',CURRENT_LOCATION:'current_location',SKILLS:'profile_setup',PREFERENCES:'job_preferences',HOW_IT_WORKS:'discover_tutorial'};
 for(const step of MOBILE_STEPS) {const source=map[step]; if(source && legacy?.steps[source as keyof typeof legacy.steps]?.status==='done' && !Object.keys(validateMobile(step,state.draft)).length) state.done.push(step);}
 state.screen=legacy?.startedAt ? (MOBILE_STEPS.find(s=>!state.done.includes(s))||'PERSONAL_DETAILS') : 'INTRO';
 return state;
}
export function validateMobile(step: MobileStep, d: MobileDraft): Record<string,string> {
 const e:Record<string,string>={}; const need=(field:string,ok:unknown)=>{if(!ok)e[field]='pp_err_required';};
 if(step==='PERSONAL_DETAILS') {
  for(const f of ['firstName','lastName','email','mobile'] as const) need(f,d[f].trim());
  need('nationalities',d.nationalities.length);
  if(d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))e.email='invalid_email';
  if(d.mobile && !/^\+\d{7,15}$/.test(d.mobile))e.mobile='pp_err_phone';
 }
 if(step==='GENDER')need('gender',['male','female','prefer_not_to_say'].includes(d.gender));
 if(step==='BIRTHDAY') {need('birthday',d.birthday); const today=new Date();const max=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;const [y,m,day]=d.birthday.split('-').map(Number);if(d.birthday && (!/^\d{4}-\d{2}-\d{2}$/.test(d.birthday) || !Number.isFinite(y+m+day) || d.birthday>max || y<today.getFullYear()-100 || m<1 || m>12 || day<1 || day>new Date(y,m,0).getDate()))e.birthday='ob_err_birthday';}
 if(step==='CURRENT_LOCATION'){need('country',d.country);need('city',d.city);}
 if(step==='SKILLS')need('skills',d.skills.length);
 const range=(prefix:string,r:{from:string;to:string;current:boolean},education:boolean)=>{
  const now=new Date();const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  need(`${prefix}.from`,/^\d{4}-(0[1-9]|1[0-2])$/.test(r.from));
  if(r.from>ym)e[`${prefix}.from`]='pp_err_future_start';
  if(!r.current || education && r.to) {need(`${prefix}.to`,/^\d{4}-(0[1-9]|1[0-2])$/.test(r.to));if(r.to<r.from)e[`${prefix}.to`]='pp_err_to_before_from';if(!education&&r.to>ym)e[`${prefix}.to`]='pp_err_future_start';}
 };
 if(step==='EDUCATION'){need('educations',d.educations.length);d.educations.forEach(x=>{const p=x.id;need(`${p}.institution`,x.institution.trim());need(`${p}.degree`,['HIGH_SCHOOL','DIPLOMA','BACHELOR','MASTER','DOCTORATE','NOT_APPLICABLE'].includes(x.degree));if(x.degree!=='NOT_APPLICABLE')need(`${p}.field`,x.field);need(`${p}.country`,x.country);need(`${p}.city`,x.city);range(p,x,true);});}
 if(step==='EXPERIENCE'&&!d.noExperience){need('experiences',d.experiences.length);d.experiences.forEach(x=>{for(const f of ['industry','title','company','type'] as const)need(`${x.id}.${f}`,x[f].trim());range(x.id,x,false);});}
 if(step==='PREFERENCES')for(const f of ['expertise','keywords','workingStyles','employmentTypes'] as const)need(f,d.preferences[f].length);
 if(step==='SENIORITY')need('seniorityLevels',d.preferences.seniorityLevels.length);
 return e;
}
async function checked<T>(request:PromiseLike<{data:T|null;error:unknown}>):Promise<T> {
 const result=await request;if(result.error)throw result.error;if(result.data===null)throw new Error('Empty persistence response');return result.data;
}
export async function loadMobile(uid:string):Promise<{state:MobileState;completed:boolean}> {
 const response=await apiClient.supabase.from('user_profiles').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).maybeSingle();if(response.error)throw response.error;
 const base=response.data as Record<string,unknown>|null;if(!base)throw new Error('Account profile unavailable');
 const seeker=await apiClient.supabase.from('job_seeker_profiles').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).maybeSingle();if(seeker.error)throw seeker.error;
 const p=(seeker.data||{}) as Record<string,unknown>;
 let state=base.mobile_onboarding_state ? normalizeMobile(base.mobile_onboarding_state as MobileState) : migrateMobile(base.onboarding_state as OnboardingState|null,p);
 const local=readMobileCache(uid);if(local && local.revision>state.revision)state={...local,done:state.done,screen:state.screen};
 if(!base.mobile_onboarding_state){
  const [education,experience]=await Promise.all([apiClient.supabase.from('education').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)),apiClient.supabase.from('experience').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000))]);
  if(education.error||experience.error)throw education.error||experience.error;
  const serverEducations=(education.data||[]).map(r=>({...normalizeEducation({id:r.id,institution:r.institution,degree:r.degree_code||r.degree,field:r.field_of_study,from:r.start_date,to:r.end_date,current:r.is_current,grade:r.grade}),country:r.country||'',city:r.city||''}));
  const serverExperiences=(experience.data||[]).map(r=>({...normalizeExperience({id:r.id,company:r.company_name,title:r.job_title,type:r.employment_type,from:r.start_date,to:r.end_date,current:r.is_current,description:r.description,country:r.country,city:r.city}),industry:r.industry||''}));
  state.draft.educations=[...state.draft.educations,...serverEducations.filter(x=>!state.draft.educations.some(c=>c.id===x.id))];
  state.draft.experiences=[...state.draft.experiences,...serverExperiences.filter(x=>!state.draft.experiences.some(c=>c.id===x.id))];
 }
 return {state,completed:base.onboarding_completed===true};
}
/** A single writer serializes autosaves and completion transactions. Failed writes remain local. */
let tail:Promise<unknown>=Promise.resolve();
export function persistMobile(uid:string,state:MobileState,step:MobileStep|null=null,finish=false):Promise<MobileState> {
  const snapshot=structuredClone(state);
  const run=async()=>{
  const {data:{session}}=await apiClient.auth.getSession();if(session?.user.id!==uid)throw new Error('Account changed; save cancelled');
  const saved=await checked<MobileState>(apiClient.supabase.rpc('save_mobile_onboarding',{payload:snapshot,completed_step:step,finish}).abortSignal(AbortSignal.timeout(12000)));
  const {data:{session:after}}=await apiClient.auth.getSession();if(after?.user.id!==uid)throw new Error('Account changed; response discarded');
  if(step==='PREFERENCES'||step==='SENIORITY')savePreferences(uid,snapshot.draft.preferences);
  try {
   if(step==='EDUCATION')localStorage.setItem(`matchme-profile:${uid}:education`,JSON.stringify(snapshot.draft.educations));
   if(step==='EXPERIENCE'&&!snapshot.draft.noExperience)localStorage.setItem(`matchme-profile:${uid}:experience`,JSON.stringify(snapshot.draft.experiences));
  }catch{ /* A successful server write must not be reported as failed because of browser quota. */ }
  return normalizeMobile(saved);
 };
 const result=tail.then(run,run);tail=result.catch(()=>undefined);return result;
}
