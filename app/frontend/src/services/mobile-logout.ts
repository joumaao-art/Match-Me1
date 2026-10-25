import { authService } from '@/services/auth.service';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';
import { logger } from '@/lib/logger';

const PRIVATE_CACHE_KEYS = new Set([
  'matchme_swipes', 'matchme_matches', 'matchme_notifications',
  'matchme_ai_interactions', 'matchme_ai_weights', 'matchme_audit_log',
  'matchme-analytics-events', 'matchme:shared-job',
]);

export function clearSeekerSessionCache(uid: string, storage: Storage): void {
  const ownerKeys = new Set([
    `matchme-job-preferences:${uid}`, `notifications_${uid}`,
    `notification_prefs_${uid}`, `matchme:via-plan:${uid}`,
    `messages_${uid}`, `credits_${uid}`, `applications_${uid}`,
  ]);
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key && (PRIVATE_CACHE_KEYS.has(key) || ownerKeys.has(key) ||
        key.startsWith(`matchme-profile:${uid}:`))) keys.push(key);
  }
  // Preserve onboarding progress/drafts, language, theme, and other accounts.
  keys.forEach(key => bestEffortCleanup(() => storage.removeItem(key)));
}

function bestEffortCleanup(clean: () => void): void {
  try {
    clean();
  } catch {
    // Storage restrictions must not turn confirmed sign-out into a false failure.
    logger.warn('[MobileLogout] Local cleanup unavailable; leaving authenticated document.');
  }
}

export async function logoutMobileSeeker(uid: string, clearQueries: () => void): Promise<void> {
  const owner = useAuthStore.getState();
  if (owner.userId !== uid || owner.userRole !== 'job_seeker') {
    throw new Error('Account changed. Sign in again.');
  }
  const result = await authService.signOut();
  if (result.error) throw new Error(result.error.message);

  // SIGNED_OUT may already reset the store. Never erase a subsequent sign-in.
  const current = useAuthStore.getState();
  if (current.userId && (current.userId !== uid || current.userRole !== 'job_seeker')) {
    throw new Error('Account changed during logout.');
  }
  bestEffortCleanup(() => current.reset());
  bestEffortCleanup(() => apiClient.unsubscribeAll());
  bestEffortCleanup(clearQueries);
  bestEffortCleanup(() => clearSeekerSessionCache(uid, window.localStorage));
  bestEffortCleanup(() => clearSeekerSessionCache(uid, window.sessionStorage));
}
