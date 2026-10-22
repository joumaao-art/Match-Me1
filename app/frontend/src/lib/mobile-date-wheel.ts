import { normalizeYearMonth } from './profile-standards';

export const WHEEL_ROW_HEIGHT = 44;
export function wheelIndex(scrollTop: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(scrollTop / WHEEL_ROW_HEIGHT)));
}
export function chronologicalYears(min: number, max: number): string[] {
  return Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => String(min + i));
}
export function calendarDays(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
export function dateWheelParts(value: string, now: Date) {
  const normalized = normalizeYearMonth(value);
  const [year, month] = normalized.split('-').map(Number);
  const day = Number(value.split('-')[2]);
  return { year: year || now.getFullYear() - 20, month: month >= 1 && month <= 12 ? month : 1, day: day >= 1 && day <= 31 ? day : 1 };
}
/** Calendar components are serialized directly, without timezone conversion. */
export function dateWheelValue(year: number, month: number, day: number, monthOnly: boolean, future: boolean, now: Date): string {
  const latestMonth = !future && year === now.getFullYear() ? now.getMonth() + 1 : 12;
  const mm = Math.max(1, Math.min(month, latestMonth));
  const latestDay = !future && year === now.getFullYear() && mm === now.getMonth() + 1 ? now.getDate() : 31;
  const dd = Math.max(1, Math.min(day, calendarDays(year, mm), latestDay));
  return `${year}-${String(mm).padStart(2, '0')}${monthOnly ? '' : `-${String(dd).padStart(2, '0')}`}`;
}
