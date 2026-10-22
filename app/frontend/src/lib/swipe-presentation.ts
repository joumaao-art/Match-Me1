import { normalizeEmploymentType, EMPLOYMENT_TYPE_DIMENSIONS } from './profile-standards';
import type { DiscoverJob, JobAction } from './seeker-jobs';

export function vacancyDimensions(value: string) {
  const code = normalizeEmploymentType(value);
  return code ? { type: EMPLOYMENT_TYPE_DIMENSIONS[code].relationship ? code : '', style: EMPLOYMENT_TYPE_DIMENSIONS[code].workStyle || '' } : { type: '', style: '' };
}
export function isAvailableJob(job: {status:string;expiration_date?:string|null}) {
  if(job.status!=='open')return false;
  if(!job.expiration_date)return true;
  const date=job.expiration_date.slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date)&&date>=new Date().toISOString().slice(0,10);
}
export function compensationText(job: DiscoverJob, locale: string): string | null {
  if (job.show_salary === false || !job.salary_currency || !job.salary_period) return null;
  const amounts=[job.salary_min,job.salary_max].filter(n=>typeof n==='number'&&Number.isFinite(n)&&n>0);
  if(!amounts.length)return null;
  const number=new Intl.NumberFormat(locale);
  const range=amounts.length===2&&amounts[0]!==amounts[1]?`${number.format(Math.min(...amounts))}–${number.format(Math.max(...amounts))}`:number.format(amounts[0]);
  const periods:Record<string,string>=locale.startsWith('ar')?{hour:'ساعة',day:'يوم',week:'أسبوع',month:'شهر',year:'سنة'}:{hour:'hour',day:'day',week:'week',month:'month',year:'year'};
  if(!periods[job.salary_period]||!/^[A-Z]{3}$/.test(job.salary_currency))return null;
  return `${job.salary_currency} ${range} / ${periods[job.salary_period]}`;
}
export function latestEligiblePass(actions: JobAction[], jobs: DiscoverJob[]): string | null {
  return [...actions].filter(a => a.direction === 'left' && jobs.some(j => j.id === a.vacancy_id && isAvailableJob(j))).sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0]?.vacancy_id || null;
}
const pendingKey = 'matchme:shared-job';
export function rememberSharedJob(id: string) { if (/^[\w-]{1,100}$/.test(id)) { try { localStorage.setItem(pendingKey,id); } catch { /* The URL still retains the job. */ } } }
export function pendingSharedJobUrl(): string | null { try { const id=localStorage.getItem(pendingKey); return id && /^[\w-]{1,100}$/.test(id) ? `/seeker?view=swipe&job=${encodeURIComponent(id)}` : null; } catch { return null; } }
export function clearPendingSharedJob() { try { localStorage.removeItem(pendingKey); } catch { /* No persistent storage. */ } }
