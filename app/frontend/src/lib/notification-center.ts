import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores';
import { apiClient } from '@/services/api-client';
import { assertCommunicationOwner } from '@/services/message.service';

export type NotificationChannel = 'email' | 'push' | 'in_app' | 'sms';
export type NotificationEvent = 'new_match' | 'interview' | 'message' | 'application' | 'company_invite' | 'job_expiry' | 'subscription' | 'admin_notice';
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'dismissed';
export interface Notification {
  id: string; userId: string; event: NotificationEvent; channel: NotificationChannel;
  title: string; body: string; priority: 'low' | 'medium' | 'high' | 'urgent';
  status: NotificationStatus; createdAt: number; actionUrl?: string; actionLabel?: string;
}
export interface NotificationPreferences {
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  events: Record<NotificationEvent, NotificationChannel[]>;
  quietHours: { enabled: boolean; start: string; end: string };
  frequency: 'instant' | 'hourly' | 'daily';
}
const EVENT_COLORS: Record<NotificationEvent, string> = { new_match: '#EC4899', interview: '#8B5CF6', message: '#3B82F6', application: '#10B981', company_invite: '#F59E0B', job_expiry: '#EF4444', subscription: '#6366F1', admin_notice: '#64748B' };
export const NOTIFICATION_TEMPLATES = Object.fromEntries(Object.entries(EVENT_COLORS).map(([event, color]) => [event, { color }])) as Record<NotificationEvent, { color: string }>;
const TABLE = 'app_91d3436dfc_notifications';
function preferencesFrom(userId: string, profile: { notification_enabled?: boolean; account_settings?: Record<string, unknown> } | null): NotificationPreferences {
  const settings = profile?.account_settings?.notifications as { enabled?: boolean; events?: Partial<Record<NotificationEvent, boolean>> } | undefined;
  return { userId, channels: { email: false, push: false, sms: false, in_app: settings?.enabled ?? profile?.notification_enabled !== false },
    events: Object.fromEntries(Object.keys(EVENT_COLORS).map(event => [event, settings?.events?.[event as NotificationEvent] === false ? [] : ['in_app']])) as NotificationPreferences['events'],
    quietHours: { enabled: false, start: '22:00', end: '08:00' }, frequency: 'instant' };
}
export function useNotifications() {
  const userId = useAuthStore(s => s.userId);
  const [unreadCount,setUnreadCount]=useState(0);
  const [totalCount,setTotalCount]=useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(100);
  const base = useRef<Record<string, unknown>>({});
  const identity = useRef(userId); identity.current = userId;
  const sequence = useRef(0);
  const alive = useRef(true);
  const lock = useRef(false);
  const valid = useCallback((uid: string) => alive.current && identity.current === uid && useAuthStore.getState().userId === uid, []);
  const refresh = useCallback(async () => {
    if (!userId) return;
    const n = ++sequence.current;
    try {
      await assertCommunicationOwner(userId);
      const [rows, profile, unread, total] = await Promise.all([
        apiClient.supabase.from(TABLE).select('*').eq('user_id', userId).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit).abortSignal(AbortSignal.timeout(10000)),
        apiClient.supabase.from('job_seeker_profiles').select('account_settings,notification_enabled').eq('user_id', userId).maybeSingle().abortSignal(AbortSignal.timeout(10000)),
        apiClient.supabase.from(TABLE).select('id',{count:'exact',head:true}).eq('user_id',userId).eq('status','unread').abortSignal(AbortSignal.timeout(10000)),
        apiClient.supabase.from(TABLE).select('id',{count:'exact',head:true}).eq('user_id',userId).abortSignal(AbortSignal.timeout(10000)),
      ]);
      if (rows.error || profile.error || unread.error || total.error) throw rows.error || profile.error || unread.error || total.error;
      await assertCommunicationOwner(userId);
      if (!valid(userId) || n !== sequence.current) return;
      setNotifications(rows.data.map(r => ({ id: r.id, userId: r.user_id, event: r.event, channel: 'in_app', title: r.title, body: r.body, priority: 'medium', status: r.status, createdAt: new Date(r.created_at).getTime(), actionUrl: r.action_url?.startsWith('/') && !r.action_url.startsWith('//') ? r.action_url : undefined })));
      setUnreadCount(unread.count||0);setTotalCount(total.count||0);
      base.current = profile.data?.account_settings || {};
      setPreferences(profile.data ? preferencesFrom(userId, profile.data) : null);
      setError('');return true;
    } catch (e) { if (valid(userId) && n === sequence.current) {setError((e as Error).message);setUnreadCount(0);setTotalCount(0);} return false; }
    finally { if (valid(userId) && n === sequence.current) setLoading(false); }
  }, [userId, limit, valid]);
  useEffect(() => {
    alive.current = true; setUnreadCount(0);setTotalCount(0);setLimit(100);setNotifications([]); setPreferences(null); setLoading(true); base.current = {}; setError('');
    return () => { alive.current = false; sequence.current++; };
  }, [userId]);
  useEffect(() => {
    void refresh();
    const onFocus = () => { if (!lock.current) void refresh(); };
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible' && !lock.current) void refresh(); }, 15000);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [refresh]);
  const mutate = async (operation: (uid: string) => PromiseLike<{ data: unknown; error: { message: string } | null }>, requireRow=false) => {
    if (!userId || lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    try { await assertCommunicationOwner(userId); const r = await operation(userId); if (r.error) throw new Error(r.error.message); if(requireRow&&(!Array.isArray(r.data)||r.data.length!==1))throw new Error('Notification unavailable; no change confirmed'); await assertCommunicationOwner(userId); return valid(userId) && await refresh()===true; }
    catch (e) { if (valid(userId)) setError((e as Error).message); return false; }
    finally { lock.current = false; if (valid(userId)) setBusy(false); }
  };
  const status = (id: string, value: NotificationStatus) => mutate(uid => apiClient.supabase.from(TABLE).update({ status: value }).eq('user_id', uid).eq('id', id).select('id').abortSignal(AbortSignal.timeout(10000)),true);
  const updatePreferences = (prefs: NotificationPreferences) => mutate(uid => apiClient.supabase.rpc('update_seeker_account_settings', {
    p_patch: { notifications: { enabled: prefs.channels.in_app, events: Object.fromEntries(Object.keys(EVENT_COLORS).map(event => [event, prefs.events[event as NotificationEvent].includes('in_app')])) } }, p_base: base.current,
  }).abortSignal(AbortSignal.timeout(10000)));
  const grouped = useMemo(() => {
    const result: Record<string, Notification[]> = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const n of notifications) { const group = n.createdAt >= today.getTime() ? 'today' : n.createdAt >= today.getTime() - 86400000 ? 'yesterday' : n.createdAt >= today.getTime() - 7 * 86400000 ? 'this_week' : 'older'; (result[group] ||= []).push(n); }
    return result;
  }, [notifications]);
  return { notifications, preferences, grouped, error, loading, busy, refresh,
    unreadCount,totalCount,
    hasMore: notifications.length < totalCount, loadMore: () => setLimit(n => n + 100),
    markAsRead: (id: string) => status(id, 'read'),
    markAllAsRead: () => mutate(uid => apiClient.supabase.from(TABLE).update({ status: 'read' }).eq('user_id', uid).eq('status', 'unread').select('id').abortSignal(AbortSignal.timeout(10000))),
    archiveNotification: (id: string) => status(id, 'archived'),
    deleteNotification: (id: string) => mutate(uid => apiClient.supabase.from(TABLE).delete().eq('user_id', uid).eq('id', id).select('id').abortSignal(AbortSignal.timeout(10000)),true),
    clearAll: () => mutate(uid => apiClient.supabase.from(TABLE).delete().eq('user_id', uid).select('id').abortSignal(AbortSignal.timeout(10000))), updatePreferences,
  };
}
