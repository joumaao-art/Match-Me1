import { useAuthStore } from '@/stores';
import { apiClient } from '@/services/api-client';
import { normalizeEducation, normalizeExperience, type EducationRecord, type ExperienceRecord, type SeekerProfileRecord } from './profile-standards';

const profileBases = new WeakMap<SeekerProfileRecord, Record<string, unknown>>();
const historyBases = new WeakMap<unknown[], unknown[]>();
const monthDate = (v: string) => v ? `${v.length === 4 ? `${v}-01` : v.slice(0, 7)}-01` : null;
async function assertOwner(uid: string) {
  const { data: { user }, error } = await apiClient.auth.getUser();
  if (error || user?.id !== uid || useAuthStore.getState().userId !== uid) throw new Error('Account changed; operation cancelled');
}
function historyFrom(name: string, rows: Record<string, any>[]) {
  return rows.map(x => name === 'education' ? normalizeEducation({ id: x.id, institution: x.institution, degree: x.degree_code || x.degree, field: x.field_of_study, from: x.start_date, to: x.end_date, current: x.is_current, grade: x.grade, country: x.country, city: x.city }) : normalizeExperience({ id: x.id, title: x.job_title, company: x.company_name, type: x.employment_type, from: x.start_date, to: x.end_date, current: x.is_current, country: x.country, city: x.city, description: x.description, industry: x.industry }));
}
export function profileReady(profile: SeekerProfileRecord): boolean { return profileBases.has(profile); }
export function historyReady(items: unknown[]): boolean { return historyBases.has(items); }
export function retainHistoryBase(source: unknown[], normalized: unknown[]) {
  const base = historyBases.get(source);
  if (base) historyBases.set(normalized, base);
}
export async function readHistory(name: string, uid: string): Promise<unknown[] | null> {
  await assertOwner(uid);
  if (name === 'certificates' || name === 'languages' || name === 'portfolio') {
    const r = await apiClient.supabase.from('job_seeker_profiles').select('professional_details').eq('user_id', uid).abortSignal(AbortSignal.timeout(10000)).single();
    if (r.error) throw r.error;
    await assertOwner(uid);
    const items = r.data.professional_details?.[name] || [];
    historyBases.set(items, structuredClone(items));
    return items;
  }
  if (name !== 'education' && name !== 'experience') return null;
  const r = await apiClient.supabase.from(name).select('*').eq('user_id', uid).order('id').abortSignal(AbortSignal.timeout(10000));
  if (r.error) throw r.error;
  await assertOwner(uid);
  const items = historyFrom(name, r.data || []);
  historyBases.set(items, r.data || []);
  return items;
}
export async function writeHistory(name: string, uid: string, items: unknown[], previous: unknown[]): Promise<void> {
  if (!['education', 'experience', 'certificates', 'languages', 'portfolio'].includes(name)) throw new Error('Unsupported profile section');
  const base = historyBases.get(previous);
  if (!base) throw new Error('Reload saved profile records before editing');
  await assertOwner(uid);
  if (name === 'certificates' || name === 'languages' || name === 'portfolio') {
    const r = await apiClient.supabase.rpc('save_seeker_history', { p_section: name, p_rows: items, p_base: base, p_removed: [] }).abortSignal(AbortSignal.timeout(12000));
    if (r.error) throw r.error;
    await assertOwner(uid);
    historyBases.set(items, structuredClone(r.data));
    return;
  }
  const next = (items as { id: string }[]).map(x => ({ ...x, id: /^[0-9a-f-]{36}$/i.test(x.id) ? x.id : crypto.randomUUID() }));
  const rows = next.filter(raw=>{const old=(previous as {id:string}[]).find(x=>x.id===raw.id);return !old||JSON.stringify(raw)!==JSON.stringify(old);}).map(raw => {
    if (name === 'education') {
      const x = raw as EducationRecord;
      return { id: x.id, institution: x.institution, degree: x.degree, degree_code: x.degree, field_of_study: x.field, start_date: monthDate(x.from), end_date: monthDate(x.to), is_current: x.current, ...(x.country !== undefined ? { country: x.country || null } : {}), ...(x.city !== undefined ? { city: x.city || null } : {}), ...(x.grade !== undefined ? { grade: x.grade } : {}) };
    }
    const x = raw as ExperienceRecord;
    return { id: x.id, job_title: x.title, company_name: x.company, employment_type: x.type, start_date: monthDate(x.from), end_date: x.current ? null : monthDate(x.to), is_current: x.current, country: x.country, city: x.city, description: x.description, ...(x.industry !== undefined ? { industry: x.industry || null } : {}) };
  });
  const removed = (previous as { id: string }[]).filter(x => !next.some(n => n.id === x.id)).map(x => x.id);
  const r = await apiClient.supabase.rpc('save_seeker_history', { p_section: name, p_rows: rows, p_base: base, p_removed: removed }).abortSignal(AbortSignal.timeout(12000));
  if (r.error) throw r.error;
  await assertOwner(uid);
  (items as { id: string }[]).forEach((x, i) => { x.id = next[i].id; });
  historyBases.set(items, r.data);
}
export async function readCanonicalProfile(uid: string): Promise<SeekerProfileRecord> {
  await assertOwner(uid);
  const r = await apiClient.supabase.from('job_seeker_profiles').select('*').eq('user_id', uid).abortSignal(AbortSignal.timeout(10000)).single();
  if (r.error) throw r.error;
  const { data: { user } } = await apiClient.auth.getUser();
  if (user?.id !== uid) throw new Error('Account changed');
  const x = r.data;
  const row: SeekerProfileRecord = { firstName: x.first_name || '', lastName: x.last_name || '', email: user.email || '', mobile: x.phone || '', country: x.country || '', city: x.city || '', nationalities: x.nationalities || [], dob: x.date_of_birth || '', photoUrl: x.avatar_url || '', headline: x.headline || '', summary: x.bio || '', openToWork: x.is_available !== false };
  profileBases.set(row, x);
  return row;
}
export async function writeCanonicalProfile(uid: string, p: SeekerProfileRecord, base: SeekerProfileRecord): Promise<void> {
  const fields = { firstName: 'first_name', lastName: 'last_name', mobile: 'phone', country: 'country', city: 'city', nationalities: 'nationalities', dob: 'date_of_birth', headline: 'headline', summary: 'bio', openToWork: 'is_available' } as const;
  const raw = profileBases.get(base);
  if (!raw) throw new Error('Reload saved profile before editing');
  const patch: Record<string, unknown> = {};
  const previous: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(fields)) {
    const k = key as keyof typeof fields;
    previous[column] = raw[column];
    if (JSON.stringify(p[k]) !== JSON.stringify(base[k])) patch[column] = k === 'dob' ? (p[k] || null) : p[k];
  }
  await assertOwner(uid);
  const r = await apiClient.supabase.rpc('update_seeker_profile', { p_patch: patch, p_base: previous }).abortSignal(AbortSignal.timeout(10000));
  if (r.error) throw r.error;
  await assertOwner(uid);
  profileBases.set(p, r.data);
}
