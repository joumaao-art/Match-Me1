import { calendarDays } from './mobile-date-wheel';

export function validConfirmationDate(value: string, monthOnly = false, allowYearOnly = false): boolean {
  if (allowYearOnly && /^\d{4}$/.test(value)) return Number(value) > 0;
  const match = value.match(monthOnly ? /^(\d{4})-(\d{2})$/ : /^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  return year > 0 && month >= 1 && month <= 12 && (monthOnly || day >= 1 && day <= calendarDays(year, month));
}

export function confirmationDateLabel(value: string, lang: string, monthOnly = false): string {
  if (/^\d{4}$/.test(value)) return value;
  if (!validConfirmationDate(value, monthOnly)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(2000, month - 1, day || 1);
  date.setFullYear(year);
  return new Intl.DateTimeFormat(lang, monthOnly ? { month: 'short', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function confirmationRangeError(from: string, to: string): string | undefined {
  if (!from || !to) return undefined;
  const index = (v: string) => { const [y, m] = v.split('-').map(Number); return y * 12 + (m || 1); };
  return index(to) < index(from) ? 'pp_err_to_before_from' : undefined;
}

export function hasUnconfirmedDates(root: ParentNode = document): boolean {
  return !!root.querySelector('[data-date-editing="true"]');
}
