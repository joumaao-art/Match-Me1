import { apiClient } from '@/services/api-client';
import { requireAccount, type AccountSnapshot, type AccountProfile } from './mobile-account';
import { calendarDays } from '@/lib/mobile-date-wheel';

export const PERSONAL_TITLES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.'] as const;
export const CURRENCY_CODES = ['AED','ARS','AUD','BDT','BGN','BHD','BRL','CAD','CHF','CLP','CNY','COP','CZK','DKK','DZD','EGP','EUR','GBP','HKD','HUF','IDR','ILS','INR','IQD','ISK','JOD','JPY','KES','KRW','KWD','LKR','MAD','MXN','MYR','NGN','NOK','NPR','NZD','OMR','PEN','PHP','PKR','PLN','QAR','RON','RSD','RUB','SAR','SEK','SGD','THB','TND','TRY','TWD','UAH','USD','VND','ZAR'] as const;
const STRING_FIELDS = ['title','first_name','last_name','date_of_birth','phone','country','city','location','gender'] as const;
export type PersonalInformationDraft = Record<typeof STRING_FIELDS[number], string> & {
  compensationAmount: string; compensationCurrency: string; compensationFrequency: string;
};
export function currencyPrecision(code: string): number {
  return ['CLP','ISK','JPY','KRW','VND'].includes(code) ? 0 : ['BHD','IQD','JOD','KWD','OMR','TND'].includes(code) ? 3 : 2;
}
export function personalInformationDraft(profile: AccountProfile): PersonalInformationDraft {
  const value = profile.current_compensation;
  return {
    ...Object.fromEntries(STRING_FIELDS.map(key => [key, profile[key] ?? ''])) as Record<typeof STRING_FIELDS[number], string>,
    compensationAmount: value ? String(value.amount) : '',
    compensationCurrency: value?.currency ?? '', compensationFrequency: value?.frequency ?? '',
  };
}
export function validPersonalBirthday(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  return year >= now.getFullYear()-100 && month >= 1 && month <= 12 && day >= 1 && day <= calendarDays(year,month) && value <= today;
}
export function personalInformationErrors(draft: PersonalInformationDraft, email: string, now = new Date()): Record<string,string> {
  const errors: Record<string,string> = {};
  for (const key of ['first_name','last_name'] as const) {
    const value = draft[key].trim();
    if (!value || [...value].length > 100 || !/^[\p{L}\p{M}\s.'’-]+$/u.test(value) || /[\p{Cc}\p{Cf}]/u.test(value)) errors[key] = 'name';
  }
  if (draft.title && !PERSONAL_TITLES.includes(draft.title as typeof PERSONAL_TITLES[number])) errors.title = 'title';
  if (!validPersonalBirthday(draft.date_of_birth,now)) errors.date_of_birth = 'birthday';
  if (!email.trim()) errors.email = 'required';
  for (const key of ['phone','country','city'] as const) if (!draft[key].trim()) errors[key] = 'required';
  if (draft.phone && !/^\+\d{7,15}$/.test(draft.phone)) errors.phone = 'phone';
  if (!['male','female','prefer_not_to_say'].includes(draft.gender)) errors.gender = 'required';
  const { compensationAmount: amount, compensationCurrency: currency, compensationFrequency: frequency } = draft;
  if (amount || currency || frequency) {
    if (!CURRENCY_CODES.includes(currency as typeof CURRENCY_CODES[number])) errors.compensationCurrency = 'currency';
    if (!['monthly','annually'].includes(frequency)) errors.compensationFrequency = 'frequency';
    const precision = currencyPrecision(currency);
    if (!/^\d+(?:\.\d+)?$/.test(amount) || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > 1e12 || (amount.split('.')[1]?.length ?? 0) > precision) errors.compensationAmount = 'amount';
  }
  return errors;
}
export function personalInformationPatch(base: AccountProfile, draft: PersonalInformationDraft): Record<string,unknown> {
  const patch: Record<string,unknown> = {};
  for (const key of STRING_FIELDS) {
    const value = draft[key].trim();
    if (value !== (base[key] ?? '')) patch[key] = value || (key === 'title' ? null : '');
  }
  const previous = base.current_compensation ?? null;
  const value = draft.compensationAmount || draft.compensationCurrency || draft.compensationFrequency ? {
    amount: Number(draft.compensationAmount), currency: draft.compensationCurrency, frequency: draft.compensationFrequency,
  } : null;
  if (JSON.stringify(previous && [previous.amount,previous.currency,previous.frequency]) !== JSON.stringify(value && [value.amount,value.currency,value.frequency])) patch.current_compensation = value;
  return patch;
}
export async function savePersonalInformation(account: AccountSnapshot, draft: PersonalInformationDraft): Promise<AccountSnapshot> {
  if (Object.keys(personalInformationErrors(draft,account.email)).length) throw new Error('Please correct the required fields.');
  const patch = personalInformationPatch(account.profile,draft);
  if (!Object.keys(patch).length) return account;
  if (account.authPhone && 'phone' in patch) throw new Error('Login phone requires verification.');
  await requireAccount(account.uid);
  const base = { ...account.profile, title: account.profile.title ?? null, current_compensation: account.profile.current_compensation ?? null };
  const result = await apiClient.supabase.rpc('update_mobile_personal', { p_patch: patch, p_base: base }).abortSignal(AbortSignal.timeout(10000));
  if (result.error || !result.data) throw result.error ?? new Error('Save response unavailable.');
  await requireAccount(account.uid);
  return { ...account, profile: result.data, displayName: account.displayName === account.profile.full_name ? result.data.full_name : account.displayName };
}
