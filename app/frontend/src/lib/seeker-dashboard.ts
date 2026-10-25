import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';
import type { DiscoverJob, JobAction } from './seeker-jobs';

export type DashboardCategory = 'all' | 'submitted' | 'skipped' | 'saved' | 'search';
export interface DashboardRow { action: JobAction; job: DiscoverJob }
export interface DashboardData { rows: DashboardRow[]; total: number; counts: Record<Exclude<DashboardCategory, 'search'>, number>; latestPass: string | null }
export function useSeekerDashboard(category: DashboardCategory, query: string, status: string, oldest: boolean, overview: boolean) {
 const uid = useAuthStore(s => s.userId);
 const [data, setData] = useState<DashboardData | null>(null);
 const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
 const [debounced, setDebounced] = useState(''); const [page, setPage] = useState(0);
 const generation = useRef(0); const mounted = useRef(false);
 useEffect(() => { const timer = window.setTimeout(() => { setDebounced(query.trim()); setPage(0); }, 300); return () => window.clearTimeout(timer); }, [query]);
 const size = overview ? 5 : 25;
 const refresh = useCallback(async () => {
  const request = ++generation.current;
  const owned = () => mounted.current && request === generation.current && useAuthStore.getState().userId === uid;
  if (!uid) { if (owned()) { setLoading(false); setError(true); } return; }
  setLoading(true);
  try {
   const result = await apiClient.supabase.rpc('get_seeker_dashboard', { p_category: category, p_query: debounced, p_status: status, p_oldest: oldest, p_offset: page * size, p_limit: size }).abortSignal(AbortSignal.timeout(10000));
   if (result.error) throw result.error;
   if (owned()) { setData(result.data as DashboardData); setError(false); }
  } catch { if (owned()) setError(true); }
  finally { if (owned()) setLoading(false); }
 }, [uid, category, debounced, status, oldest, page, size]);
 useEffect(() => { setData(null); setPage(0); }, [uid, category, status, oldest, overview]);
 useEffect(() => {
  mounted.current = true; void refresh();
  const visible = () => { if (!document.hidden) void refresh(); };
  window.addEventListener('matchme:jobs-changed', refresh); window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', visible);
  const timer = window.setInterval(visible, 15000);
  return () => { mounted.current = false; generation.current++; window.clearInterval(timer); window.removeEventListener('matchme:jobs-changed', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visible); };
 }, [refresh]);
 return { data, loading, error, refresh, page, setPage, size, searching: debounced !== query.trim() };
}
