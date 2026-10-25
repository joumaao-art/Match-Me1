import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { releaseSeekerTheme, startSeekerThemeSync } from '@/lib/seeker-appearance';

export function SeekerThemeSync() {
  const uid = useAuthStore(state => state.userId);
  const role = useAuthStore(state => state.userRole);
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const loading = useAuthStore(state => state.isLoading);
  useEffect(() => {
    if (loading) return;
    if (!authenticated || !uid || role !== 'job_seeker') { releaseSeekerTheme(); return; }
    return startSeekerThemeSync(uid);
  }, [uid, role, authenticated, loading]);
  return null;
}
