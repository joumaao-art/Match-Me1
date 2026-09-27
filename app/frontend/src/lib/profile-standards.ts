/**
 * Canonical Job Seeker professional-profile standards.
 *
 * Single source of truth for enums, month-precision date ranges, chronological
 * ordering, total-experience calculation, form validation, legacy-value
 * normalization, and the lazily loaded location dataset. UI, onboarding,
 * profile completion and AI adapters all consume this module.
 */

// ============================================================
// Employment type (requested UX) + future work-style separation
// ============================================================

export const EMPLOYMENT_TYPES = [
  'FULL_TIME', 'PART_TIME', 'REMOTE', 'HYBRID', 'CONTRACT', 'FREELANCE', 'CONSULTANT', 'INTERN',
] as const;
export type EmploymentTypeCode = (typeof EMPLOYMENT_TYPES)[number];

/**
 * The requested list mixes employment relationships with work styles. Each
 * option is mapped onto both dimensions so a later split into separate
 * "employment type" and "work style" fields is a pure derivation, not a
 * destructive migration. `null` means "not stated by this option".
 */
export const EMPLOYMENT_TYPE_DIMENSIONS: Record<EmploymentTypeCode, {
  relationship: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'consultant' | 'intern' | null;
  workStyle: 'remote' | 'hybrid' | null;
}> = {
  FULL_TIME: { relationship: 'full_time', workStyle: null },
  PART_TIME: { relationship: 'part_time', workStyle: null },
  REMOTE: { relationship: null, workStyle: 'remote' },
  HYBRID: { relationship: null, workStyle: 'hybrid' },
  CONTRACT: { relationship: 'contract', workStyle: null },
  FREELANCE: { relationship: 'freelance', workStyle: null },
  CONSULTANT: { relationship: 'consultant', workStyle: null },
  INTERN: { relationship: 'intern', workStyle: null },
};

export const EMPLOYMENT_TYPE_LABEL_KEYS: Record<EmploymentTypeCode, string> = {
  FULL_TIME: 'pp_et_full_time', PART_TIME: 'pp_et_part_time', REMOTE: 'pp_et_remote',
  HYBRID: 'pp_et_hybrid', CONTRACT: 'pp_et_contract', FREELANCE: 'pp_et_freelance',
  CONSULTANT: 'pp_et_consultant', INTERN: 'pp_et_intern',
};

/** Maps any historical spelling ("Full-time", "full_time", "Internship") to the canonical code. */
export function normalizeEmploymentType(raw: string | null | undefined): EmploymentTypeCode | '' {
  if (!raw) return '';
  const k = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if ((EMPLOYMENT_TYPES as readonly string[]).includes(k)) return k as EmploymentTypeCode;
  if (k === 'INTERNSHIP') return 'INTERN';
  if (k === 'FULLTIME') return 'FULL_TIME';
  if (k === 'PARTTIME') return 'PART_TIME';
  if (k === 'CONSULTANCY') return 'CONSULTANT';
  return '';
}

// ============================================================
// Degree + language proficiency
// ============================================================

export const DEGREES = [
  'HIGH_SCHOOL', 'DIPLOMA', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'NOT_APPLICABLE',
] as const;
export type DegreeCode = (typeof DEGREES)[number];
export const DEGREE_LABEL_KEYS: Record<DegreeCode, string> = {
  HIGH_SCHOOL: 'high_school', DIPLOMA: 'pp_degree_diploma', ASSOCIATE: 'associates',
  BACHELOR: 'bachelors', MASTER: 'masters', DOCTORATE: 'phd', NOT_APPLICABLE: 'pp_degree_na',
};

export function normalizeDegree(raw: string | null | undefined): DegreeCode | '' {
  if (!raw) return '';
  const v = raw.trim().toLowerCase().replace(/[’']/g, '');
  if ((DEGREES as readonly string[]).includes(raw.trim().toUpperCase())) return raw.trim().toUpperCase() as DegreeCode;
  if (v.startsWith('high')) return 'HIGH_SCHOOL';
  if (v.startsWith('diploma')) return 'DIPLOMA';
  if (v.startsWith('assoc')) return 'ASSOCIATE';
  if (v.startsWith('bach')) return 'BACHELOR';
  if (v.startsWith('mast')) return 'MASTER';
  if (v === 'phd' || v.startsWith('doct')) return 'DOCTORATE';
  if (v.startsWith('not')) return 'NOT_APPLICABLE';
  return '';
}

/** Ordered lowest → highest. `advanced` is retired and maps to `fluent`. */
export const LANGUAGE_LEVELS = ['beginner', 'intermediate', 'fluent', 'native'] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];
export const LANGUAGE_LEVEL_LABEL_KEYS: Record<LanguageLevel, string> = {
  beginner: 'beginner', intermediate: 'intermediate', fluent: 'pp_lang_fluent', native: 'pp_lang_native',
};

export function normalizeLanguageLevel(raw: string | null | undefined): LanguageLevel {
  const v = (raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (v === 'advanced' || v === 'fluent' || v === 'proficient') return 'fluent';
  if (v === 'native' || v === 'native_speaker' || v === 'mother_tongue') return 'native';
  if (v === 'basic' || v === 'beginner' || v === 'elementary') return 'beginner';
  return 'intermediate';
}

// ============================================================
// Month-precision dates
// ============================================================

/** Canonical stored form is "YYYY-MM". Legacy "YYYY" and "YYYY-MM-DD" are accepted. */
export function normalizeYearMonth(raw: string | null | undefined): string {
  if (!raw) return '';
  const m = String(raw).trim().match(/^(\d{4})(?:-(\d{1,2}))?/);
  if (!m) return '';
  // A year-only legacy value keeps month unknown; January is used only for math, never invented for display.
  return m[2] ? `${m[1]}-${m[2].padStart(2, '0')}` : m[1];
}

function monthIndex(ym: string): number | null {
  const m = ym.match(/^(\d{4})(?:-(\d{2}))?$/);
  if (!m) return null;
  return Number(m[1]) * 12 + (m[2] ? Number(m[2]) - 1 : 0);
}

export function currentYearMonth(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export interface DateRangeValue { from: string; to: string; current: boolean }

export type DateRangeError = 'from_required' | 'to_required' | 'to_before_from' | 'future_start' | null;

export function validateDateRange(r: DateRangeValue, now: Date = new Date(), allowFutureStart = false): DateRangeError {
  const from = monthIndex(normalizeYearMonth(r.from));
  if (from === null) return 'from_required';
  if (!allowFutureStart && from > (monthIndex(currentYearMonth(now)) as number)) return 'future_start';
  if (r.current) return null;
  const to = monthIndex(normalizeYearMonth(r.to));
  if (to === null) return 'to_required';
  if (to < from) return 'to_before_from';
  return null;
}

// ============================================================
// Chronological ordering
// ============================================================

/** Current first, then most recent end, then most recent start, then stable id. */
export function sortChronological<T extends { id: string } & DateRangeValue>(items: T[], now: Date = new Date()): T[] {
  const nowIdx = monthIndex(currentYearMonth(now)) as number;
  const key = (x: T) => ({
    cur: x.current ? 1 : 0,
    end: x.current ? nowIdx : (monthIndex(normalizeYearMonth(x.to)) ?? -1),
    start: monthIndex(normalizeYearMonth(x.from)) ?? -1,
  });
  return [...items].sort((a, b) => {
    const ka = key(a); const kb = key(b);
    return kb.cur - ka.cur || kb.end - ka.end || kb.start - ka.start || a.id.localeCompare(b.id);
  });
}

/** Certificates: most recent issue date first; undated last; stable by id. */
export function sortCertificates<T extends { id: string; date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const da = monthIndex(normalizeYearMonth(a.date)) ?? -1;
    const db = monthIndex(normalizeYearMonth(b.date)) ?? -1;
    return db - da || a.id.localeCompare(b.id);
  });
}

// ============================================================
// Total professional experience (overlap-merged)
// ============================================================

/**
 * Months are inclusive: Jan 2022 – Dec 2023 is 24 months. Intervals are merged
 * before summing so overlapping or adjacent employment is counted once. A
 * current role runs through the current month.
 */
export function totalExperienceMonths(items: DateRangeValue[], now: Date = new Date()): number {
  const nowIdx = monthIndex(currentYearMonth(now)) as number;
  const intervals: [number, number][] = [];
  for (const it of items) {
    const s = monthIndex(normalizeYearMonth(it.from));
    const e = it.current ? nowIdx : monthIndex(normalizeYearMonth(it.to));
    if (s === null || e === null) continue;
    const end = Math.min(e, nowIdx);
    if (end < s) continue;
    intervals.push([s, end]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0; let cur: [number, number] | null = null;
  for (const iv of intervals) {
    if (!cur) { cur = [...iv]; continue; }
    if (iv[0] <= cur[1] + 1) cur[1] = Math.max(cur[1], iv[1]);
    else { total += cur[1] - cur[0] + 1; cur = [...iv]; }
  }
  if (cur) total += cur[1] - cur[0] + 1;
  return total;
}

export function splitMonths(total: number): { years: number; months: number } {
  return { years: Math.floor(total / 12), months: total % 12 };
}

// ============================================================
// Experience description
// ============================================================

/** Chosen limit: 250 words — roughly 10 concise duty bullets of ~25 words. */
export const EXPERIENCE_DESCRIPTION_MAX_WORDS = 250;

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Future-ready duty extraction: the stored field stays one text value, while
 * consumers can read individual duties by line/bullet today.
 */
export function splitDuties(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, '').trim()).filter(Boolean);
}

// ============================================================
// Domain records + validation
// ============================================================

export interface ExperienceRecord extends DateRangeValue {
  id: string; title: string; company: string; type: EmploymentTypeCode | '';
  country: string; city: string; description: string;
}
export interface EducationRecord extends DateRangeValue {
  id: string; institution: string; degree: DegreeCode | ''; field: string;
  /** Deprecated: retained for historical data only, never shown or required. */
  grade?: string;
}
export interface CertificateRecord {
  id: string; name: string; issuer: string; date: string; expiry: string | null; verified: boolean;
  credentialId?: string;
}
export interface LanguageRecord { id: string; name: string; level: LanguageLevel }

export interface SeekerProfileRecord {
  firstName: string; lastName: string; email: string; mobile: string;
  country: string; city: string; nationalities: string[];
  dob: string; photoUrl: string;
  headline: string; summary: string; openToWork: boolean;
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

/** Required everywhere except `dob` and `photoUrl`. Returns i18n keys. */
export const PROFILE_REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'mobile', 'country', 'city', 'nationalities', 'headline', 'summary'] as const;
export type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number];

export function validateProfile(p: SeekerProfileRecord): FieldErrors<ProfileRequiredField> {
  const e: FieldErrors<ProfileRequiredField> = {};
  for (const f of PROFILE_REQUIRED_FIELDS) {
    const v = p[f];
    if (Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim()) e[f] = 'pp_err_required';
  }
  if (!e.mobile && !/^\+?[\d\s()-]{7,20}$/.test(p.mobile.trim())) e.mobile = 'pp_err_phone';
  return e;
}

type ExpField = 'title' | 'company' | 'type' | 'country' | 'city' | 'from' | 'to' | 'description';
export function validateExperience(x: Omit<ExperienceRecord, 'id'>, now?: Date): FieldErrors<ExpField> {
  const e: FieldErrors<ExpField> = {};
  if (!x.title.trim()) e.title = 'pp_err_required';
  if (!x.company.trim()) e.company = 'pp_err_required';
  if (!x.type) e.type = 'pp_err_required';
  if (!x.country) e.country = 'pp_err_required';
  if (!x.city) e.city = 'pp_err_required';
  if (!x.description.trim()) e.description = 'pp_err_required';
  else if (countWords(x.description) > EXPERIENCE_DESCRIPTION_MAX_WORDS) e.description = 'pp_err_word_limit';
  applyRangeError(e, validateDateRange(x, now));
  return e;
}

type EduField = 'institution' | 'degree' | 'field' | 'from' | 'to';
export function validateEducation(x: Omit<EducationRecord, 'id'>, now?: Date): FieldErrors<EduField> {
  const e: FieldErrors<EduField> = {};
  if (!x.institution.trim()) e.institution = 'pp_err_required';
  if (!x.degree) e.degree = 'pp_err_required';
  // Field of study does not apply when the degree is "Not Applicable".
  if (x.degree !== 'NOT_APPLICABLE' && !x.field.trim()) e.field = 'pp_err_required';
  applyRangeError(e, validateDateRange(x, now));
  return e;
}

type CertField = 'name' | 'issuer' | 'date' | 'expiry';
export function validateCertificate(x: Omit<CertificateRecord, 'id' | 'verified'>): FieldErrors<CertField> {
  const e: FieldErrors<CertField> = {};
  if (!x.name.trim()) e.name = 'pp_err_required';
  if (!x.issuer.trim()) e.issuer = 'pp_err_required';
  const d = monthIndex(normalizeYearMonth(x.date));
  if (d === null) e.date = 'pp_err_required';
  const ex = x.expiry ? monthIndex(normalizeYearMonth(x.expiry)) : null;
  if (d !== null && ex !== null && ex < d) e.expiry = 'pp_err_to_before_from';
  return e;
}

function applyRangeError(e: Record<string, string | undefined>, err: DateRangeError) {
  if (err === 'from_required') e.from = 'pp_err_required';
  if (err === 'future_start') e.from = 'pp_err_future_start';
  if (err === 'to_required') e.to = 'pp_err_required';
  if (err === 'to_before_from') e.to = 'pp_err_to_before_from';
}

// ============================================================
// Legacy normalization (read path — preserves historical data)
// ============================================================

export function normalizeExperience(raw: Partial<ExperienceRecord> & { id: string }): ExperienceRecord {
  return {
    id: raw.id, title: raw.title ?? '', company: raw.company ?? '',
    type: normalizeEmploymentType(raw.type as string), country: raw.country ?? '', city: raw.city ?? '',
    from: normalizeYearMonth(raw.from), to: raw.current ? '' : normalizeYearMonth(raw.to),
    current: !!raw.current, description: raw.description ?? '',
  };
}

export function normalizeEducation(raw: Partial<EducationRecord> & { id: string }): EducationRecord {
  return {
    id: raw.id, institution: raw.institution ?? '', degree: normalizeDegree(raw.degree as string),
    field: raw.field ?? '', from: normalizeYearMonth(raw.from),
    to: raw.current ? '' : normalizeYearMonth(raw.to), current: !!raw.current, grade: raw.grade,
  };
}

// ============================================================
// Location dataset (lazy, country-scoped)
// ============================================================

export interface GeoCountry { code: string; en: string; dial: string }

let countriesPromise: Promise<GeoCountry[]> | null = null;
const cityCache = new Map<string, Promise<string[]>>();

/** ~12 KB index of all ISO 3166-1 countries, fetched once on first use. */
export function loadCountries(): Promise<GeoCountry[]> {
  countriesPromise ??= fetch('/geo/countries.json')
    .then((r) => { if (!r.ok) throw new Error(`countries ${r.status}`); return r.json(); })
    .catch((err) => { countriesPromise = null; throw err; });
  return countriesPromise;
}

/** Cities for one ISO country, fetched only when that country is selected. */
export function loadCities(countryCode: string): Promise<string[]> {
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return Promise.resolve([]);
  let p = cityCache.get(code);
  if (!p) {
    p = fetch(`/geo/cities/${code}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => { cityCache.delete(code); return []; });
    cityCache.set(code, p);
  }
  return p;
}

/** Localized country name via the platform Intl API; falls back to the English dataset name. */
export function countryLabel(code: string, lang: string, fallback?: string): string {
  if (!code) return '';
  try {
    const n = new Intl.DisplayNames([lang === 'ar' ? 'ar' : 'en'], { type: 'region' }).of(code);
    if (n && n !== code) return n;
  } catch { /* unsupported runtime */ }
  return fallback ?? code;
}

/** Legacy free-text country ("UAE", "Egypt") → ISO code when resolvable. */
export function resolveCountryCode(raw: string, countries: GeoCountry[]): string {
  const v = raw.trim();
  if (!v) return '';
  if (/^[A-Za-z]{2}$/.test(v) && countries.some((c) => c.code === v.toUpperCase())) return v.toUpperCase();
  const alias: Record<string, string> = { uae: 'AE', ksa: 'SA', uk: 'GB', usa: 'US', us: 'US' };
  if (alias[v.toLowerCase()]) return alias[v.toLowerCase()];
  return countries.find((c) => c.en.toLowerCase() === v.toLowerCase())?.code ?? '';
}

/** Legacy free-text nationality ("Egyptian") → ISO code via demonym table. */
const DEMONYMS: Record<string, string> = {
  egyptian: 'EG', saudi: 'SA', emirati: 'AE', lebanese: 'LB', jordanian: 'JO', syrian: 'SY',
  kuwaiti: 'KW', qatari: 'QA', bahraini: 'BH', omani: 'OM', iraqi: 'IQ', moroccan: 'MA',
  tunisian: 'TN', algerian: 'DZ', palestinian: 'PS', yemeni: 'YE', sudanese: 'SD',
  indian: 'IN', pakistani: 'PK', filipino: 'PH', bangladeshi: 'BD', british: 'GB',
  american: 'US', canadian: 'CA', french: 'FR', german: 'DE', turkish: 'TR',
};
export function resolveNationalities(raw: string | string[], countries: GeoCountry[]): string[] {
  const parts = Array.isArray(raw) ? raw : raw.split(/[,/;]+/);
  const codes = parts.map((p) => DEMONYMS[p.trim().toLowerCase()] ?? resolveCountryCode(p, countries)).filter(Boolean);
  return [...new Set(codes)];
}
