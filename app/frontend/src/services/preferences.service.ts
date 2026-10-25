import { apiClient } from './api-client';
import { migrateLegacyPreferences, savePreferences, type JobPreferences } from '@/lib/job-preferences';
import { validPreferenceSelections, mergePreferencePatch, PreferenceConflict, preferenceSelectionCount, type PreferenceRecord } from '@/lib/mobile-preferences';
import { useAuthStore } from '@/stores';

export interface PreferenceSnapshot { raw: PreferenceRecord; prefs: JobPreferences; updatedAt: string; nullable: boolean }
class PreferencesService {
 async load(userId: string): Promise<PreferenceSnapshot> {
  if (!userId || useAuthStore.getState().userId !== userId) throw new Error('Authentication required');
  const r = await apiClient.supabase.from('job_seeker_profiles').select('job_preferences,updated_at').eq('user_id', userId).abortSignal(AbortSignal.timeout(10000)).single();
  if (r.error) throw r.error;
  if (useAuthStore.getState().userId !== userId) throw new Error('Account changed');
  const raw = r.data.job_preferences && typeof r.data.job_preferences === 'object' && !Array.isArray(r.data.job_preferences) ? r.data.job_preferences : {};
  return { raw, prefs: migrateLegacyPreferences(raw), updatedAt: r.data.updated_at, nullable: r.data.job_preferences === null };
 }
 async save(userId: string, base: PreferenceSnapshot, patch: PreferenceRecord): Promise<PreferenceSnapshot> {
  for (let attempt = 0; attempt < 2; attempt++) {
   const latest = await this.load(userId);
   const merged = mergePreferencePatch(base.raw, latest.raw, patch);
   if (!validPreferenceSelections(migrateLegacyPreferences(merged))) throw new Error('Choose at most 10 distinct roles and keywords.');
   // Existing owner RLS remains authoritative; compare both timestamp and original JSON atomically.
   let update = apiClient.supabase.from('job_seeker_profiles').update({ job_preferences: merged }).eq('user_id', userId).eq('updated_at', latest.updatedAt);
   update = latest.nullable ? update.is('job_preferences', null) : update.filter('job_preferences', 'eq', JSON.stringify(latest.raw));
   const r = await update.select('job_preferences,updated_at').abortSignal(AbortSignal.timeout(10000)).maybeSingle();
   if (r.error) throw r.error;
   if (useAuthStore.getState().userId !== userId) throw new Error('Account changed');
   if (r.data) {
    const prefs = migrateLegacyPreferences(r.data.job_preferences); savePreferences(userId, prefs);
    window.dispatchEvent(new Event('matchme:jobs-changed'));
    return { raw: r.data.job_preferences, prefs, updatedAt: r.data.updated_at, nullable: false };
   }
  }
  throw new PreferenceConflict();
 }
}
export const preferencesService = new PreferencesService();
