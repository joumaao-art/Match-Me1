import { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/services/api-client';
import { subscriptionService, type ViaSubscription } from '@/services/subscription.service';
import { useAuthStore } from '@/stores';

export function useViaPremium(uid: string | null, providerRefresh = false) {
 const [active, setActive] = useState(false);
 const [subscription, setSubscription] = useState<ViaSubscription | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const generation = useRef(0);
 const mounted = useRef(false);
 const refresh = useCallback(async () => {
  const request = ++generation.current;
  const owned = () => mounted.current && generation.current === request && useAuthStore.getState().userId === uid;
  if (!uid) { setActive(false); setLoading(false); return; }
  try {
   let providerError = '';
   if (providerRefresh) { const r = await subscriptionService.getState(); providerError = r.error?.message || ''; }
   const [entitlement, record] = await Promise.all([
    apiClient.supabase.rpc('get_via_entitlement').abortSignal(AbortSignal.timeout(10000)),
    subscriptionService.getCurrentSubscription(uid),
   ]);
   if (entitlement.error || record.error) throw entitlement.error || record.error;
   if (owned()) { setActive(entitlement.data === true); setSubscription(record.data); setError(providerError); }
  } catch (e) { if (owned()) { setActive(false); setError((e as Error).message); } }
  finally { if (owned()) setLoading(false); }
 }, [uid, providerRefresh]);
 useEffect(() => {
  mounted.current = true; setActive(false); setSubscription(null); setLoading(true); setError(''); void refresh();
  const reload = () => void refresh();
  const timer = window.setInterval(reload, 30000);
  window.addEventListener('matchme:subscription-changed', reload); window.addEventListener('focus', reload);
  return () => { mounted.current = false; generation.current++; clearInterval(timer); window.removeEventListener('matchme:subscription-changed', reload); window.removeEventListener('focus', reload); };
 }, [refresh]);
 useEffect(() => {
  if (!active || !subscription?.current_period_end) return;
  const remaining = new Date(subscription.current_period_end).getTime() - Date.now();
  const timer = window.setTimeout(() => { setActive(false); void refresh(); }, Math.max(0, Math.min(remaining, 2147483647)));
  return () => clearTimeout(timer);
 }, [active, subscription?.current_period_end, refresh]);
 return { active, subscription, loading, error, refresh };
}

export function viaSwipeReturn(jobId?: string) {
 return `/seeker?view=swipe${jobId ? `&job=${encodeURIComponent(jobId)}&via_return=1` : ''}`;
}
export function safeViaReturn(value: string | null) {
 try { const url = new URL(value || '/seeker?view=swipe', window.location.origin); return url.origin === window.location.origin && url.pathname === '/seeker' && url.searchParams.get('view') === 'swipe' ? `${url.pathname}${url.search}` : '/seeker?view=swipe'; }
 catch { return '/seeker?view=swipe'; }
}
export function openBillingUrl(value: string, kind: 'checkout' | 'portal' = 'checkout') {
 const url = new URL(value);
 if (url.protocol !== 'https:' || url.hostname !== (kind === 'checkout' ? 'checkout.stripe.com' : 'billing.stripe.com')) throw new Error('Invalid secure checkout destination');
 window.location.assign(url.toString());
}
