import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/stores';
import { useCreditAccount } from '@/lib/seeker-credits';

const FUNCTION = 'app_91d3436dfc_credit_payments';
interface Pack { quantity: number; amount: number; currency: string; }
interface Transaction { id: number; amount: number; kind: string; created_at: string; }
export function SeekerCreditPanel() {
  const uid = useAuthStore(s => s.userId);
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const copy = useCallback((en: string, arabic: string) => ar ? arabic : en, [ar]);
  const { balance, error } = useCreditAccount(uid);
  const [pack, setPack] = useState<Pack | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [sessionId, setSessionId] = useState(() => new URLSearchParams(window.location.search).get('credit_session'));
  const alive = useRef(false);
  const lock = useRef(false);
  const ownsAccount = useCallback(() => alive.current && useAuthStore.getState().userId === uid, [uid]);
  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const result = await apiClient.supabase.from('seeker_credit_transactions').select('id,amount,kind,created_at').eq('user_id', uid).order('id', { ascending: false }).limit(30).abortSignal(AbortSignal.timeout(10000));
      if (!ownsAccount()) return;
      setHistoryError(!!result.error);
      if (!result.error) setTransactions(result.data || []);
    } catch { if (ownsAccount()) setHistoryError(true); }
  }, [uid, ownsAccount]);
  const verify = useCallback(async (id: string) => {
    if (!uid || lock.current || !ownsAccount()) return;
    lock.current = true; setBusy(true);
    try {
      const result = await apiClient.supabase.functions.invoke<{ balance: number }>(FUNCTION, { body: { action: 'verify', sessionId: id }, signal: AbortSignal.timeout(15000) });
      if (result.error || typeof result.data?.balance !== 'number') throw new Error('Verification unavailable');
      if (!ownsAccount()) return;
      setNotice(copy('Payment verified; your account balance has been updated.', 'تم التحقق من الدفع وتحديث رصيد حسابك.'));
      setSessionId(null);
      window.dispatchEvent(new Event('matchme:credits-changed'));
      void load();
      const url = new URL(window.location.href);
      url.searchParams.delete('credit_session');
      window.history.replaceState(null, '', url);
    } catch {
      if (ownsAccount()) setNotice(copy('Payment could not be verified. No unverified credits were added. Retry without purchasing again.', 'تعذر التحقق من الدفع. لم تتم إضافة رصيد غير مؤكد. أعد المحاولة دون الشراء مجدداً.'));
    } finally { lock.current = false; if (ownsAccount()) setBusy(false); }
  }, [uid, ownsAccount, copy, load]);
  useEffect(() => {
    alive.current = true; setPack(null); setTransactions([]); setNotice('');
    void load();
    let cancelled = false;
    void apiClient.supabase.functions.invoke<Pack>(FUNCTION, { body: { action: 'catalog' }, signal: AbortSignal.timeout(12000) }).then(result => {
      if (cancelled || !ownsAccount()) return;
      if (result.error || !result.data) setNotice(copy('Credit purchases are not configured. No payment will be simulated.', 'لم يتم إعداد شراء الرصيد. لن تتم محاكاة أي دفع.'));
      else setPack(result.data);
    }).catch(() => { if (!cancelled && ownsAccount()) setNotice(copy('Unable to load credit pricing. Try again later.', 'تعذر تحميل سعر الرصيد. حاول لاحقاً.')); });
    const query = new URLSearchParams(window.location.search);
    const id = query.get('credit_session');
    setSessionId(id);
    if (id) void verify(id);
    else if (query.has('credits_cancelled')) setNotice(copy('Checkout cancelled. No purchase credits were added.', 'تم إلغاء الدفع. لم تتم إضافة رصيد شراء.'));
    window.addEventListener('matchme:credits-changed', load);
    return () => { cancelled = true; alive.current = false; window.removeEventListener('matchme:credits-changed', load); };
  }, [uid, ownsAccount, load, copy, verify]);
  const purchase = async () => {
    if (!pack || lock.current || sessionId || !ownsAccount()) return;
    lock.current = true; setBusy(true);
    try {
      const url = new URL(window.location.href); url.searchParams.set('tab', 'billing');
      const result = await apiClient.supabase.functions.invoke<{ url: string }>(FUNCTION, { body: { action: 'checkout', returnUrl: url.toString() }, signal: AbortSignal.timeout(15000) });
      if (result.error || !result.data?.url) throw new Error('Checkout unavailable');
      if (ownsAccount()) window.location.assign(result.data.url);
    } catch { if (ownsAccount()) setNotice(copy('Checkout could not be opened. No credits have been added.', 'تعذر فتح الدفع. لم تتم إضافة رصيد.')); }
    finally { lock.current = false; if (ownsAccount()) setBusy(false); }
  };
  const money = pack ? new Intl.NumberFormat(ar ? 'ar' : 'en', { style: 'currency', currency: pack.currency }) : null;
  const minorDigits = money?.resolvedOptions().maximumFractionDigits ?? 2;
  return <Card><CardContent className="p-4 space-y-4">
    <h2 className="font-semibold">{copy('Swiping credits', 'رصيد التمرير')}</h2>
    <p>{copy('Account balance', 'رصيد الحساب')}: <strong>{balance ?? '—'}</strong></p>
    {error && <p role="alert">{copy('Balance unavailable.', 'الرصيد غير متاح.')}</p>}
    <p className="text-sm text-muted-foreground">{copy('20 free credits once for eligible new Job Seekers. Existing balances are preserved.', '20 رصيداً مجانياً مرة واحدة للباحثين الجدد المؤهلين. الأرصدة الحالية محفوظة.')}</p>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {sessionId && <Button disabled={busy} onClick={() => void verify(sessionId)}>{copy('Retry payment verification', 'إعادة التحقق من الدفع')}</Button>}
    {pack && <Button disabled={busy || !!sessionId} onClick={() => void purchase()}>{copy('Buy', 'شراء')} {pack.quantity} — {money?.format(pack.amount / 10 ** minorDigits)}</Button>}
    <h3 className="text-sm font-medium">{copy('Credit history', 'سجل الرصيد')}</h3>
    {historyError ? <Button variant="outline" onClick={() => void load()}>{copy('Retry history', 'إعادة تحميل السجل')}</Button> : transactions.length ? <ul className="divide-y">{transactions.map(x => <li key={x.id} className="flex justify-between gap-3 py-2 text-sm"><span>{copy(({ signup: 'Signup grant', swipe: 'Swipe', purchase: 'Purchase', legacy_import: 'Existing balance' } as Record<string, string>)[x.kind] || x.kind, ({ signup: 'رصيد التسجيل', swipe: 'تمرير', purchase: 'شراء', legacy_import: 'الرصيد السابق' } as Record<string, string>)[x.kind] || x.kind)}<span className="block text-xs text-muted-foreground">{new Date(x.created_at).toLocaleDateString(ar ? 'ar' : 'en')}</span></span><span dir="ltr">{x.amount > 0 ? '+' : ''}{x.amount}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">{copy('No credit transactions yet.', 'لا توجد معاملات رصيد بعد.')}</p>}
  </CardContent></Card>;
}
