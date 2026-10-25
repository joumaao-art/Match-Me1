import { create } from 'zustand';
import { apiClient } from '@/services/api-client';
import { requireAccount } from '@/services/mobile-account';
import { useAuthStore, useAppStore } from '@/stores';
import { applyTheme } from '@/stores/app.store';

export type SeekerTheme = 'light' | 'dark' | 'system';
export function isSeekerTheme(value: unknown): value is SeekerTheme { return value === 'light' || value === 'dark' || value === 'system'; }
export function resolvedSeekerTheme(theme: SeekerTheme, systemDark: boolean): 'light' | 'dark' { return theme === 'system' ? systemDark ? 'dark' : 'light' : theme; }
const cacheKey = (uid: string) => `matchme-seeker-appearance:${uid}`;
export function readThemeCache(uid: string): SeekerTheme | null {
  try { const value = localStorage.getItem(cacheKey(uid)); return isSeekerTheme(value) ? value : null; } catch { return null; }
}
function cache(uid: string, theme: SeekerTheme) { try { localStorage.setItem(cacheKey(uid), theme); } catch { /* Server persistence remains authoritative. */ } }
export function legacyLocalTheme(): SeekerTheme | null {
  try {
    const name = useAppStore.persist.getOptions().name;
    const value = JSON.parse(localStorage.getItem(name) || 'null')?.state?.theme;
    return isSeekerTheme(value) ? value : null;
  } catch { return null; }
}
interface AppearanceState { owner: string | null; theme: SeekerTheme; loading: boolean; saving: boolean; error: boolean; saved: boolean }
export const useSeekerAppearance = create<AppearanceState>(() => ({ owner: null, theme: 'system', loading: false, saving: false, error: false, saved: false }));
let generation = 0;
let base: Record<string, unknown> = {};
let guestDark: boolean | null = null;
let guestColorScheme = '';
const media = () => window.matchMedia?.('(prefers-color-scheme: dark)');
export function applySeekerTheme(theme: SeekerTheme) {
  const resolved = resolvedSeekerTheme(theme, media()?.matches === true);
  applyTheme(resolved);
  document.documentElement.style.colorScheme = resolved;
}
function owns(uid: string) { const auth = useAuthStore.getState(); return auth.isAuthenticated && auth.userRole === 'job_seeker' && auth.userId === uid; }
function claim(uid: string) {
  if (guestDark === null) { guestDark = document.documentElement.classList.contains('dark'); guestColorScheme = document.documentElement.style.colorScheme; }
  const theme = readThemeCache(uid) || legacyLocalTheme() || 'system';
  useSeekerAppearance.setState({ owner: uid, theme, loading: true, saving: false, error: false, saved: false });
  applySeekerTheme(theme);
}
export function bootstrapSeekerTheme() {
  const auth = useAuthStore.getState();
  if (auth.userId && auth.userRole === 'job_seeker') claim(auth.userId);
}
export function releaseSeekerTheme() {
  generation++;
  base = {};
  if (guestDark !== null) { applyTheme(guestDark ? 'dark' : 'light'); document.documentElement.style.colorScheme = guestColorScheme; guestDark = null; }
  useSeekerAppearance.setState({ owner: null, theme: 'system', loading: false, saving: false, error: false, saved: false });
}
async function readSettings(uid: string) {
  await requireAccount(uid);
  const result = await apiClient.supabase.from('job_seeker_profiles').select('account_settings').eq('user_id', uid).abortSignal(AbortSignal.timeout(10000)).single();
  if (result.error || !result.data) throw result.error || new Error('Settings unavailable');
  return (result.data.account_settings || {}) as Record<string, unknown>;
}
async function writeSettings(uid: string, theme: SeekerTheme, settings: Record<string, unknown>) {
  await requireAccount(uid);
  const result = await apiClient.supabase.rpc('update_seeker_account_settings', { p_patch: { theme }, p_base: settings }).abortSignal(AbortSignal.timeout(10000));
  if (result.error || !result.data) throw result.error || new Error('Theme save unavailable');
  return (result.data.account_settings || {}) as Record<string, unknown>;
}
export async function refreshSeekerTheme(uid: string) {
  if (!owns(uid) || useSeekerAppearance.getState().saving) return;
  if (useSeekerAppearance.getState().owner !== uid) claim(uid);
  const request = ++generation;
  try {
    let settings = await readSettings(uid);
    if (!owns(uid) || request !== generation) return;
    // Migrate an explicitly persisted legacy local choice only when the server has no theme.
    const legacy = legacyLocalTheme();
    if (!isSeekerTheme(settings.theme) && legacy) {
      try { settings = await writeSettings(uid, legacy, settings); }
      catch { settings = await readSettings(uid); }
    }
    if (!owns(uid) || request !== generation) return;
    base = settings;
    const theme = isSeekerTheme(settings.theme) ? settings.theme : 'system';
    cache(uid, theme); applySeekerTheme(theme);
    useSeekerAppearance.setState({ theme, loading: false, error: false, saved: false });
  } catch {
    if (owns(uid) && request === generation) useSeekerAppearance.setState({ loading: false, error: true });
  }
}
export async function saveSeekerTheme(uid: string, theme: SeekerTheme): Promise<boolean> {
  const state = useSeekerAppearance.getState();
  if (!owns(uid) || state.owner !== uid || state.loading || state.saving || !isSeekerTheme(theme)) return false;
  const request = ++generation;
  useSeekerAppearance.setState({ theme, saving: true, saved: false, error: false });
  applySeekerTheme(theme);
  try {
    const settings = await writeSettings(uid, theme, base);
    if (!owns(uid) || request !== generation) return false;
    base = settings;
    const confirmed = isSeekerTheme(settings.theme) ? settings.theme : 'system';
    cache(uid, confirmed); applySeekerTheme(confirmed);
    useSeekerAppearance.setState({ theme: confirmed, saving: false, saved: true });
    return true;
  } catch {
    if (owns(uid) && request === generation) {
      useSeekerAppearance.setState({ saving: false, error: true });
      // A failed/conflicting write never replaces the local saved cache.
      try {
        const settings = await readSettings(uid);
        if (!owns(uid) || request !== generation) return false;
        base = settings;
        const confirmed = isSeekerTheme(settings.theme) ? settings.theme : 'system';
        cache(uid, confirmed); applySeekerTheme(confirmed);
        useSeekerAppearance.setState({ theme: confirmed });
      } catch { /* The visible selection is unsaved; Retry remains available. */ }
    }
    return false;
  }
}
export function startSeekerThemeSync(uid: string) {
  if (useSeekerAppearance.getState().owner !== uid) claim(uid);
  void refreshSeekerTheme(uid);
  const refresh = () => { if (!document.hidden) void refreshSeekerTheme(uid); };
  const systemChange = () => { if (owns(uid) && useSeekerAppearance.getState().theme === 'system') applySeekerTheme('system'); };
  const storageChange = (event: StorageEvent) => { if (event.key === cacheKey(uid)) refresh(); };
  const preference = media();
  preference?.addEventListener?.('change', systemChange);
  window.addEventListener('focus', refresh);
  window.addEventListener('storage', storageChange);
  document.addEventListener('visibilitychange', refresh);
  const timer = setInterval(refresh, 60000);
  return () => { clearInterval(timer); preference?.removeEventListener?.('change', systemChange); window.removeEventListener('focus', refresh); window.removeEventListener('storage', storageChange); document.removeEventListener('visibilitychange', refresh); releaseSeekerTheme(); };
}
