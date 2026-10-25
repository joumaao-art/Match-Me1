import { yearlySavings } from '@/lib/subscription-savings';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores';
import { apiClient } from '@/services/api-client';
import { subscriptionService, type ViaCatalog, type ViaPlanId } from '@/services/subscription.service';
import { openBillingUrl, safeViaReturn, useViaPremium } from '@/lib/via-premium';
import { nativeBridge } from '@/lib/native-bridge';

export function ViaPremiumPage({ desktop = false }: { desktop?: boolean }) {
 const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const copy = (en: string, arabic: string) => ar ? arabic : en;
 const uid = useAuthStore(s => s.userId); const navigate = useNavigate(); const location = useLocation();
 const query = new URLSearchParams(location.search); const back = safeViaReturn(query.get('return'));
 const backLabel = back.includes('subscription_overview') ? copy('Back to Profile','العودة إلى الملف') : copy('Back to Swipe','العودة إلى التصفح');
 const premium = useViaPremium(uid, true);
 const [catalog, setCatalog] = useState<ViaCatalog | null>(null);
 const [selected, setSelected] = useState<ViaPlanId>('via_premium_yearly');
 const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
 const [loaded, setLoaded] = useState(false); const [retry, setRetry] = useState(0); const lock = useRef(false); const alive = useRef(false);
 const owned = () => alive.current && useAuthStore.getState().userId === uid;
 useEffect(() => { setSelected('via_premium_yearly'); }, [uid]);
 useEffect(() => {
  alive.current = true; let current = true; setLoaded(false); setCatalog(null); setError('');
  const load = async () => {
   const result = await subscriptionService.getCatalog();
   if (!current || useAuthStore.getState().userId !== uid) return;
   if (result.data) setCatalog(result.data);
   else {
    // Catalog remains database-owned even when the provider is unavailable.
    const fallback = await apiClient.supabase.from('billing_plans').select('*').eq('active', true).abortSignal(AbortSignal.timeout(10000));
    if (!current || useAuthStore.getState().userId !== uid) return;
    if (!fallback.error) setCatalog({ plans: fallback.data, configured: false, configurationError: result.error?.message });
    else setError(fallback.error.message);
   }
   if (current) setLoaded(true);
  };
  void load(); return () => { current = false; alive.current = false; };
 }, [uid, retry]);
 const run = async (operation: () => Promise<void>) => {
  if (lock.current) return; lock.current = true; setBusy(true); setError('');
  try { await operation(); } catch (e) { if (owned()) setError((e as Error).message); }
  finally { lock.current = false; if (owned()) setBusy(false); }
 };
 const verify = async (sessionId: string) => {
  const result = await subscriptionService.verifyPayment(sessionId);
  if (result.error || !result.data?.verified) throw result.error || new Error(copy('Payment is still pending. Retry verification; Premium has not been activated.', 'الدفع قيد الانتظار. أعد التحقق؛ لم يتم تفعيل الاشتراك.'));
  if (!owned()) return;
  window.dispatchEvent(new Event('matchme:subscription-changed')); await premium.refresh();
  setNotice(copy('Payment verified. VIA Premium is active.', 'تم تأكيد الدفع وتفعيل VIA Premium.'));
  const clean = new URLSearchParams(location.search); clean.delete('via_session'); clean.delete('success'); navigate({ pathname: location.pathname, search: clean.toString() }, { replace: true });
 };
 const handled = useRef('');
 useEffect(() => {
  const session = new URLSearchParams(location.search).get('via_session');
  if (!session || handled.current === `${uid}:${session}`) return;
  handled.current = `${uid}:${session}`; void run(() => verify(session));
 }, [location.search, uid]);
 useEffect(() => { if (premium.subscription?.status === 'checkout_pending' && premium.subscription.plan) setSelected(premium.subscription.plan); }, [premium.subscription?.status, premium.subscription?.plan]);
 const cancelled = query.has('via_cancelled');
 const session = query.get('via_session') || premium.subscription?.checkout_session_id;
 const pending = premium.subscription?.status === 'checkout_pending';
 const existing = premium.active || !!premium.subscription?.stripe_subscription_id && !['inactive', 'expired'].includes(premium.subscription.status);
 const choose = (id: ViaPlanId) => { if (busy || pending) return; setSelected(id); try { sessionStorage.setItem(`matchme:via-plan:${uid}`, id); } catch { /* Selection still works without storage. */ } };
 const checkout = () => run(async () => {
  const plan = catalog?.plans.find(p => p.id === selected);
  if (!plan || !catalog?.configured) throw new Error(copy('Secure checkout is not configured. No payment or Premium activation occurred.', 'الدفع الآمن غير مُعدّ بعد. لم يتم الدفع أو تفعيل الاشتراك.'));
  if (nativeBridge()) throw new Error(copy('Native subscriptions require approved store billing. External checkout is unavailable.', 'الاشتراك داخل التطبيق يتطلب نظام دفع المتجر المعتمد. الدفع الخارجي غير متاح.'));
  const result = await subscriptionService.createCheckoutSession(plan.id, plan.billing_interval === 'month' ? 'monthly' : 'yearly');
  if (result.error || !result.data?.url) throw result.error || new Error('Checkout unavailable');
  if (owned()) openBillingUrl(result.data.url);
 });
 const manage = () => run(async () => { if (nativeBridge()) throw new Error(copy('Manage your subscription through its original billing platform.', 'أدر اشتراكك عبر منصة الدفع الأصلية.')); const r = await subscriptionService.manage(); if (r.error || !r.data?.url) throw r.error || new Error('Management unavailable'); if (owned()) openBillingUrl(r.data.url, 'portal'); });
 const statusCopy = { inactive: copy('Inactive', 'غير نشط'), checkout_pending: copy('Checkout pending', 'الدفع قيد الانتظار'), active: copy('Active', 'نشط'), payment_failed: copy('Payment failed', 'فشل الدفع'), cancelled: copy('Cancelled · active until paid-through date', 'ملغى · نشط حتى نهاية المدة المدفوعة'), expired: copy('Expired', 'منتهي') };
 const savings = yearlySavings(catalog?.plans || []);
 const configuredPlans = catalog?.plans.filter(p => ['via_premium_monthly', 'via_premium_yearly'].includes(p.id)).sort((a, b) => a.billing_interval === 'month' ? -1 : b.billing_interval === 'month' ? 1 : 0) || [];
 return <section dir={ar ? 'rtl' : 'ltr'} className={desktop ? 'space-y-5' : 'min-h-dvh bg-background flex flex-col'}>
  {!desktop && <header className="px-4 py-3 border-b flex items-center gap-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}><Button size="icon" variant="ghost" aria-label={backLabel} onClick={() => navigate(back)}><ArrowLeft className={ar ? 'rotate-180' : ''} size={20}/></Button><span className="font-semibold">MatchMe</span></header>}
  <div className={desktop ? '' : 'w-full max-w-md mx-auto px-5 pt-7 pb-6 flex-1'}>
   <h1 className="text-2xl font-semibold leading-tight mb-7">{copy('Unlimited applications with VIA Premium', 'طلبات توظيف غير محدودة مع VIA Premium')}</h1>
   {existing ? <div className="rounded-2xl border p-5 space-y-3"><h2 className="font-semibold">VIA Premium</h2><p>{statusCopy[premium.subscription?.status || 'inactive']}</p><p className="text-sm text-muted-foreground">{premium.subscription?.plan === 'via_premium_yearly' ? copy('Yearly', 'سنوي') : copy('Monthly', 'شهري')}{premium.subscription?.current_period_end && ` · ${new Date(premium.subscription.current_period_end).toLocaleDateString(ar ? 'ar' : 'en')}`}</p><Button className="w-full h-12" disabled={busy} onClick={manage}>{copy('Manage Subscription', 'إدارة الاشتراك')}</Button></div> : <fieldset disabled={busy || pending || premium.loading} className="space-y-3"><legend className="sr-only">{copy('Select a subscription plan', 'اختر خطة الاشتراك')}</legend>
    {configuredPlans.map(plan => <label key={plan.id} className={`flex items-center justify-between gap-3 p-5 rounded-2xl border-2 cursor-pointer focus-within:ring-2 focus-within:ring-primary ${!desktop && plan.billing_interval === 'year' ? 'shadow-sm' : ''} ${selected === plan.id ? 'border-primary bg-primary/5' : !desktop && plan.billing_interval === 'year' ? 'border-primary/30 bg-primary/[0.02]' : 'border-border'}`}>
     <span><span className="block font-semibold" dir={ar ? 'rtl' : 'ltr'}>{plan.billing_interval === 'month' ? copy(`Monthly — $${plan.amount / 100}${desktop ? '' : '/month'}`, `شهري — ${plan.amount / 100} دولار${desktop ? '' : '/شهر'}`) : copy(`Yearly — $${plan.amount / 100}${desktop ? '' : '/year'}`, `سنوي — ${plan.amount / 100} دولار${desktop ? '' : '/سنة'}`)}</span>{plan.billing_interval === 'year' && <span className="inline-block mt-2 text-xs font-medium rounded-full bg-primary/10 text-primary px-2 py-1">{copy('Most Popular', 'الأكثر شعبية')}</span>}{plan.billing_interval === 'year' && savings !== null && savings > 0 && <span className="inline-block ms-2 mt-2 text-xs font-semibold text-primary">{copy(`Save ${savings}%`, `وفر ${savings}%`)}</span>}</span>
     <input type="radio" name="via-plan" className="sr-only" value={plan.id} checked={selected === plan.id} onChange={() => choose(plan.id)}/><span aria-hidden="true" className={`w-6 h-6 border rounded-full grid place-items-center ${selected === plan.id ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground'}`}>{selected === plan.id && <Check size={16}/>}</span>
    </label>)}
   </fieldset>}
   {!loaded && <p role="status">{copy('Loading plans…', 'جارٍ تحميل الخطط…')}</p>}
   <p className="text-sm mt-5 mb-4 text-foreground">{copy('Subscription auto renews until cancelled', 'يتجدد الاشتراك تلقائياً حتى يتم إلغاؤه')}</p>
   {pending && <div className="border rounded-xl p-4 space-y-3"><p>{copy('Checkout pending. Complete or cancel it before selecting another plan.', 'الدفع قيد الانتظار. أكمله أو ألغِه قبل اختيار خطة أخرى.')}</p><Button className="w-full" disabled={busy} onClick={checkout}>{copy('Resume secure checkout', 'متابعة الدفع الآمن')}</Button>{session && <Button variant="outline" className="w-full !bg-transparent" disabled={busy} onClick={() => run(() => verify(session))}>{copy('Verify payment', 'التحقق من الدفع')}</Button>}<Button variant="ghost" className="w-full" disabled={busy} onClick={() => run(async () => { const r = await subscriptionService.cancelPending(); if (r.error) throw r.error; await premium.refresh(); setNotice(copy('Checkout cancelled. No paid access was activated.', 'تم إلغاء الدفع. لم يُفعّل الاشتراك.')); })}>{copy('Cancel pending checkout', 'إلغاء الدفع المعلق')}</Button></div>}
   {cancelled && !notice && <p role="status" className="text-sm">{copy('Checkout was cancelled. Premium has not been activated.', 'تم إلغاء الدفع ولم يتم تفعيل الاشتراك.')}</p>}
   {notice && <p role="status" className="text-sm text-primary my-3">{notice}</p>}
   {error && <p role="alert" className="text-sm text-destructive break-words my-3">{ar ? 'تعذر إتمام العملية. أعد المحاولة؛ لا يتم تفعيل الاشتراك دون تأكيد الدفع.' : error}</p>}
   {premium.error && <p role="alert" className="text-sm text-muted-foreground">{copy('Unable to refresh provider status. Retry before checkout.', 'تعذر تحديث حالة الدفع. أعد المحاولة قبل الدفع.')}</p>}
   {loaded && !catalog?.configured && !existing && <p role="status" className="text-sm text-muted-foreground">{copy('Secure checkout is currently unavailable. No payment will be taken.', 'الدفع الآمن غير متاح حالياً. لن يتم تحصيل أي مبلغ.')}</p>}
   {nativeBridge() && <p role="status" className="text-sm mt-3">{copy('Native purchases require approved store billing.', 'الشراء داخل التطبيق يتطلب نظام دفع المتجر المعتمد.')}</p>}
   <Button variant="ghost" className="mt-3" disabled={busy} onClick={() => { setRetry(v => v + 1); void premium.refresh(); }}>{copy('Refresh status', 'تحديث الحالة')}</Button>
   {query.get('via_session') && <Button variant="outline" className="!bg-transparent" disabled={busy} onClick={() => run(() => verify(query.get('via_session')!))}>{copy('Retry payment verification', 'إعادة التحقق من الدفع')}</Button>}
  </div>
  {!existing && !pending && <footer className={desktop ? 'space-y-2' : 'sticky bottom-0 bg-background border-t p-5 space-y-2'} style={{ paddingBottom: desktop ? undefined : 'calc(env(safe-area-inset-bottom) + 20px)' }}><Button className="h-12 w-full" disabled={busy || !loaded || premium.loading || !!premium.error || !catalog?.configured || !!nativeBridge()} onClick={checkout}>{busy ? copy('Please wait…', 'يرجى الانتظار…') : copy('Subscribe VIA Premium', 'اشترك في VIA Premium')}</Button><p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><ShieldCheck size={14}/>{copy('Secure checkout · USD', 'دفع آمن · دولار أمريكي')}</p></footer>}
  {notice && !desktop && <Button className="m-5 h-12" onClick={() => navigate(back)}>{backLabel}</Button>}
 </section>;
}
