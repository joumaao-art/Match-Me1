import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';
import { matchingEngine, type SeekerProfile } from './matching-engine';
import { migrateLegacyPreferences } from './job-preferences';
import { uniqueSkills } from './skill-match-core';
import type { DiscoverJob } from './seeker-jobs';

export const SKILL_MATCH_FUNCTION='app_91d3436dfc_skill_match';
export function canonicalMatchProfile(uid:string,p:Record<string,unknown>):SeekerProfile {
 const prefs=migrateLegacyPreferences(p.job_preferences as Parameters<typeof migrateLegacyPreferences>[0]);
 return {id:uid,skills:uniqueSkills(Array.isArray(p.skills)?p.skills:[]),experienceYears:Number(p.experience_years)||0,location:{country:String(p.country||''),city:String(p.city||'')},expectedSalaryMin:Number(prefs.salaryMin)||0,expectedSalaryMax:Number(prefs.salaryMax)||0,preferredIndustries:prefs.industries,languages:(Array.isArray(p.languages)?p.languages:[]).map(name=>({name:String(name),level:''})),availability:p.is_available?'immediate':'negotiable',preferredLocations:[...prefs.locations,...prefs.targetCountries],willingToRelocate:prefs.willingToRelocate,openToRemote:prefs.workingStyles.includes('remote')};
}
export function vacancyMatchScore(profile:SeekerProfile,job:DiscoverJob):number {
 return matchingEngine.calculateCompatibility(profile,{id:job.id,companyId:job.company_id||'',requiredSkills:uniqueSkills(job.required_skills),minExperience:job.min_experience,maxExperience:job.max_experience,location:{country:job.country,city:job.city},salaryMin:job.salary_min,salaryMax:job.salary_max,industry:job.industry,requiredLanguages:[],employmentType:job.employment_type,isRemote:(job.employment_style||job.employment_type).toLowerCase().includes('remote')});
}
export async function loadMatchProfile(uid:string):Promise<SeekerProfile>{
 const result=await apiClient.supabase.from('job_seeker_profiles').select('skills,experience_years,country,city,job_preferences,languages,is_available').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).single();
 if(result.error)throw result.error;return canonicalMatchProfile(uid,result.data);
}
export function useCanonicalMatchProfile(){
 const uid=useAuthStore(s=>s.userId);const [profile,setProfile]=useState<SeekerProfile|null>(null);const generation=useRef(0);
 const refresh=useCallback(async()=>{const request=++generation.current;if(!uid)return null;const result=await loadMatchProfile(uid);if(request===generation.current&&useAuthStore.getState().userId===uid)setProfile(result);return result;},[uid]);
 useEffect(()=>{setProfile(null);const update=()=>void refresh().catch(()=>{});update();window.addEventListener('matchme:profile-changed',update);window.addEventListener('matchme:preferences-changed',update);window.addEventListener('focus',update);return()=>{generation.current++;window.removeEventListener('matchme:profile-changed',update);window.removeEventListener('matchme:preferences-changed',update);window.removeEventListener('focus',update);};},[refresh]);
 return {profile:profile?.id===uid?profile:null,refresh};
}
