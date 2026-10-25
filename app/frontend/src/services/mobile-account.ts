import { apiClient } from '@/services/api-client';
import { env } from '@/config/env';
import { readHistory } from '@/lib/canonical-profile';
import type { CertificateRecord, LanguageRecord, EducationRecord, ExperienceRecord } from '@/lib/profile-standards';

export interface AccountProfile {
 user_id: string; first_name: string | null; last_name: string | null; full_name: string | null;
 phone: string | null; country: string | null; city: string | null; location: string | null;
 date_of_birth: string | null; gender: string | null; cv_url: string | null; cv_file_name: string | null;
 cv_updated_at: string | null; resume_extract: { fileName?: string } | null; skills: string[] | null;
 languages: string[] | null; professional_details: { certificates?: CertificateRecord[]; languages?: LanguageRecord[] };
 notification_enabled: boolean | null; account_settings: Record<string, unknown>;
}
export interface AccountSnapshot { profile: AccountProfile; uid: string; email: string; authPhone: string; displayName: string }
export const PERSONAL_FIELDS = ['first_name','last_name','date_of_birth','phone','country','city','gender'] as const;
export type PersonalDraft = Record<typeof PERSONAL_FIELDS[number], string>;
export function personalDraft(p: AccountProfile): PersonalDraft {
 return Object.fromEntries(PERSONAL_FIELDS.map(k => [k, p[k] || ''])) as PersonalDraft;
}
export function personalPatch(base: AccountProfile, draft: PersonalDraft) {
 return Object.fromEntries(PERSONAL_FIELDS.filter(k => draft[k] !== (base[k] || '')).map(k => [k, k === 'date_of_birth' && !draft[k] ? null : draft[k].trim()]));
}
export async function requireAccount(uid: string) {
 const { data: { user }, error } = await apiClient.auth.getUser();
 if (error || !user || user.id !== uid) throw new Error('Your session has changed. Sign in again.');
 return user;
}
export async function loadAccount(uid: string): Promise<AccountSnapshot> {
 const user = await requireAccount(uid);
 const [profile, base] = await Promise.all([
  apiClient.supabase.from('job_seeker_profiles').select('*').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).single(),
  apiClient.supabase.from('user_profiles').select('display_name').eq('user_id',uid).abortSignal(AbortSignal.timeout(10000)).maybeSingle(),
 ]);
 if (profile.error || base.error) throw profile.error || base.error;
 return { profile: profile.data, uid, email: user.email || '', authPhone: user.phone || '', displayName: base.data?.display_name || profile.data.full_name || '' };
}
export function cvOwnerPath(value: string | null, uid: string): string | null {
 if (!value) return null;
 let path = value;
 if (/^https?:/.test(value)) {
  try { const url = new URL(value); if (url.origin !== new URL(env.supabase.url).origin) return null;
   const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/cvs\/(.+)$/); if (!match) return null; path=decodeURIComponent(match[1]);
  } catch { return null; }
 }
 return path.startsWith(`${uid}/`) && !path.split('/').some(p => p === '..' || p === '.') ? path : null;
}
export async function cvMetadata(a: AccountSnapshot) {
 const path=cvOwnerPath(a.profile.cv_url,a.uid); if(!path)return null;
 const folder=path.slice(0,path.lastIndexOf('/')); const file=path.slice(path.lastIndexOf('/')+1);
 const { data,error }=await apiClient.storage.from('cvs').list(folder,{search:file,limit:100});
 if(error)throw error;
 const object=data?.find(x=>x.name===file); if(!object)return null;
 return { path, name:a.profile.cv_file_name||a.profile.resume_extract?.fileName||file.replace(/^\d+_/,''), updatedAt:a.profile.cv_updated_at||object.updated_at||null };
}
export async function cvLink(uid:string,path:string,download?:string) {
 await requireAccount(uid); if(cvOwnerPath(path,uid)!==path)throw new Error('Invalid CV owner');
 const {data,error}=await apiClient.storage.from('cvs').createSignedUrl(path,120,download?{download}:undefined);
 if(error||!data)throw error||new Error('CV unavailable'); return data.signedUrl;
}
export async function loadResumeData(uid:string) {
 const account=await loadAccount(uid);
 const [experience,education]=await Promise.all([readHistory('experience',uid),readHistory('education',uid)]);
 return {account,experience:experience as ExperienceRecord[],education:education as EducationRecord[]};
}
export const SUPPORT_REPORTS='app_91d3436dfc_support_reports';
export async function submitReport(uid:string,requestKey:string,fields:{category:string;subject:string;description:string},file:File|null) {
 await requireAccount(uid);
 const existing=await apiClient.supabase.from(SUPPORT_REPORTS).select('id').eq('user_id',uid).eq('request_key',requestKey).abortSignal(AbortSignal.timeout(10000)).maybeSingle();
 if(existing.error)throw existing.error; if(existing.data)return existing.data.id;
 let screenshotPath:string|null=null;
 if(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Screenshot must be PNG, JPG or WebP, at most 5 MB.');
  const ext=file.type.split('/')[1]; screenshotPath=`${uid}/${requestKey}.${ext}`;
  const upload=await apiClient.storage.from('support-attachments').upload(screenshotPath,file,{upsert:false});
  if(upload.error){const listed=await apiClient.storage.from('support-attachments').list(uid,{search:`${requestKey}.${ext}`});if(!listed.data?.some(x=>x.name===`${requestKey}.${ext}`))throw upload.error;}
 }
 const result=await apiClient.supabase.from(SUPPORT_REPORTS).insert({user_id:uid,request_key:requestKey,...fields,screenshot_path:screenshotPath}).select('id').single();
 if(result.error){const confirm=await apiClient.supabase.from(SUPPORT_REPORTS).select('id').eq('user_id',uid).eq('request_key',requestKey).maybeSingle();if(confirm.data)return confirm.data.id;throw result.error;}
 return result.data.id;
}
