import { EXPERTISE_TAXONOMY, expertiseLabel, type JobPreferences } from './job-preferences';
import { SKILL_TAXONOMY } from './onboarding-engine';

export const MOBILE_PREFERENCE_FIELDS = ['expertise', 'keywords', 'targetCountries', 'employmentTypes', 'workingStyles', 'seniorityLevels'] as const;
export type PreferenceField = typeof MOBILE_PREFERENCE_FIELDS[number];
export type PreferenceRecord = Record<string, unknown>;
export const normalizeKeyword = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
export const PREFERENCE_KEYWORDS = [...new Set([...SKILL_TAXONOMY, ...EXPERTISE_TAXONOMY.flatMap(r => r.keywords)].map(normalizeKeyword))].sort();
export function preferenceSelectionCount(prefs: Pick<JobPreferences, 'expertise' | 'keywords'>) { return prefs.expertise.length + prefs.keywords.length; }
export function canAddPreference(prefs: Pick<JobPreferences, 'expertise' | 'keywords'>, kind: 'role' | 'keyword', value: string): boolean {
 if (preferenceSelectionCount(prefs) >= 10) return false;
 const candidate = normalizeKeyword(kind === 'role' ? expertiseLabel(value, 'en') : value);
 return ![...prefs.expertise.flatMap(code => [code, expertiseLabel(code, 'en'), expertiseLabel(code, 'ar')]), ...prefs.keywords].some(v => normalizeKeyword(v) === candidate)
  && !(kind === 'role' && prefs.expertise.some(v => normalizeKeyword(v) === normalizeKeyword(value)));
}
export function visiblePreferencePatch(base: JobPreferences, draft: JobPreferences): PreferenceRecord {
 return Object.fromEntries(MOBILE_PREFERENCE_FIELDS.filter(field => JSON.stringify(base[field]) !== JSON.stringify(draft[field])).map(field => [field, draft[field]]));
}
export class PreferenceConflict extends Error { constructor() { super('Preferences changed on another device. Your edits are retained. Review the latest values before retrying.'); } }
/** Three-way merge only user-modified keys; hidden and concurrent unrelated fields remain intact. */
export function mergePreferencePatch(base: PreferenceRecord, latest: PreferenceRecord, patch: PreferenceRecord): PreferenceRecord {
 for (const field of Object.keys(patch)) {
  if (!MOBILE_PREFERENCE_FIELDS.includes(field as PreferenceField)) throw new Error('Unsupported preference field');
  const old = JSON.stringify(base[field] ?? []), current = JSON.stringify(latest[field] ?? []), proposed = JSON.stringify(patch[field]);
  if (current !== old && current !== proposed) throw new PreferenceConflict();
 }
 return { ...latest, ...patch };
}
