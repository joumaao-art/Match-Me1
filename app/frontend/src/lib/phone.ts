/**
 * Canonical phone-number standard (E.164) shared by signup and Profile.
 *
 * The UI edits two parts — a country (ISO 3166-1 alpha-2 + dialing code) and a
 * national number — while persisted values are always normalized E.164
 * (`+9665XXXXXXXX`). Legacy values that cannot be parsed are returned
 * unchanged so no stored number is ever silently corrupted.
 */

import type { GeoCountry } from './profile-standards';

export const DEFAULT_PHONE_COUNTRY = 'SA';

/** Shared dialing codes resolve to their most common country. */
const DIAL_PRIORITY: Record<string, string> = { '1': 'US', '7': 'RU', '44': 'GB', '61': 'AU', '47': 'NO', '39': 'IT', '262': 'RE', '590': 'GP', '599': 'CW' };

/** Mobile-number rules for the markets MatchMe serves most; others use E.164 length limits. */
const MOBILE_RULES: Record<string, { len: number[]; prefix?: RegExp }> = {
  SA: { len: [9], prefix: /^5/ }, AE: { len: [9], prefix: /^5/ }, KW: { len: [8], prefix: /^[4569]/ },
  QA: { len: [8], prefix: /^[3567]/ }, BH: { len: [8], prefix: /^[36]/ }, OM: { len: [8], prefix: /^[79]/ },
  EG: { len: [10], prefix: /^1/ }, JO: { len: [9], prefix: /^7/ }, LB: { len: [7, 8] },
  US: { len: [10] }, CA: { len: [10] }, GB: { len: [10], prefix: /^7/ }, IN: { len: [10], prefix: /^[6-9]/ },
  PK: { len: [10], prefix: /^3/ },
};

export interface PhoneParts { country: string; dial: string; national: string }

export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/**
 * Keeps only national digits. Removes a pasted "+966"/"00966" prefix and a
 * trunk "0" so "+966 +966 5XXXXXXXX" style duplication cannot be stored.
 */
export function sanitizeNational(raw: string, dial: string, country?: string): string {
  const trimmed = raw.trim();
  let d = trimmed.replace(/\D/g, '');
  const international = trimmed.startsWith('+') || d.startsWith('00');
  if (d.startsWith('00')) d = d.slice(2);
  // Strip every repeated leading copy of the dialing code.
  const rule = country ? MOBILE_RULES[country] : undefined;
  const maxLen = rule ? Math.max(...rule.len) : 14;
  while (dial && d.startsWith(dial) && (international || d.length > maxLen)) d = d.slice(dial.length);
  return d.replace(/^0+/, '').slice(0, 15 - dial.length);
}

export function toE164(dial: string, national: string): string {
  const n = national.replace(/\D/g, '');
  const c = dial.replace(/\D/g, '');
  return n && c ? `+${c}${n}` : '';
}

/** Returns an i18n error key, or null when the number is plausible for the country. */
export function validatePhone(parts: PhoneParts): string | null {
  const n = parts.national;
  if (!n) return 'pp_err_required';
  if (!parts.dial || n.length < 4 || parts.dial.length + n.length > 15) return 'pp_err_phone';
  const rule = MOBILE_RULES[parts.country];
  if (rule && (!rule.len.includes(n.length) || (rule.prefix && !rule.prefix.test(n)))) return 'pp_err_phone';
  return null;
}

export function isValidE164(value: string, countries: GeoCountry[]): boolean {
  if (!/^\+\d{6,15}$/.test(value)) return false;
  const parts = parsePhone(value, countries);
  return !!parts && validatePhone(parts) === null;
}

/** Splits an E.164 (or legacy formatted) value into editable parts. */
export function parsePhone(value: string, countries: GeoCountry[], fallbackCountry = DEFAULT_PHONE_COUNTRY): PhoneParts | null {
  const raw = (value ?? '').trim();
  const fallback = countries.find((c) => c.code === fallbackCountry);
  if (!raw) return fallback ? { country: fallback.code, dial: fallback.dial, national: '' } : null;
  const international = raw.startsWith('+') || raw.startsWith('00');
  const digits = raw.replace(/\D/g, '').replace(/^00/, '');
  if (!international) {
    return fallback ? { country: fallback.code, dial: fallback.dial, national: sanitizeNational(raw, fallback.dial, fallback.code) } : null;
  }
  let best: GeoCountry | undefined;
  for (const c of countries) {
    if (!c.dial || !digits.startsWith(c.dial)) continue;
    if (!best || c.dial.length > best.dial.length) best = c;
    else if (c.dial.length === best.dial.length) {
      const preferred = fallbackCountry === c.code ? c.code : DIAL_PRIORITY[c.dial];
      if (preferred === c.code) best = c;
    }
  }
  if (!best) return null;
  return { country: best.code, dial: best.dial, national: digits.slice(best.dial.length).replace(/^0+/, '') };
}

/** Normalizes a stored value to E.164; unparseable legacy input is returned untouched. */
export function normalizePhoneValue(value: string, countries: GeoCountry[], fallbackCountry = DEFAULT_PHONE_COUNTRY): string {
  if (!value || !countries.length) return value;
  const parts = parsePhone(value, countries, fallbackCountry);
  if (!parts || !parts.national) return value;
  return toE164(parts.dial, parts.national);
}
