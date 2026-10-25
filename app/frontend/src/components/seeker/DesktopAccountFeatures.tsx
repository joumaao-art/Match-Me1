import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores';
import { loadAccount, type AccountSnapshot } from '@/services/mobile-account';
import { Overview, Personal, SubscriptionOverview, ViaResume } from './MobileProfileAccount';
import { MobileSupport } from './MobileSupport';

/** Account feature bodies share services; only their surrounding presentation differs. */
export function DesktopAccountFeatures({ section, embedded = false }: { section: string; embedded?: boolean }) {
 const uid = useAuthStore(s => s.userId);
 return <AccountPanel key={uid || 'guest'} uid={uid} section={section} embedded={embedded}/>;
}
function AccountPanel({ uid, section, embedded }: { uid: string | null; section: string; embedded: boolean }) {
 const navigate = useNavigate(); const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
 const [account, setAccount] = useState<AccountSnapshot | null>(null); const [error, setError] = useState(false);
 const [loading, setLoading] = useState(true); const generation = useRef(0); const alive = useRef(false);
 const refresh = useCallback(async () => {
  const request = ++generation.current; setLoading(true);
  try {
   if (!uid) throw new Error('Authentication required');
   const result = await loadAccount(uid);
   if (alive.current && request === generation.current && useAuthStore.getState().userId === uid) { setAccount(result); setError(false); }
  } catch { if (alive.current && request === generation.current) setError(true); }
  finally { if (alive.current && request === generation.current) setLoading(false); }
 }, [uid]);
 useEffect(() => {
  alive.current = true; void refresh();
  // Do not silently replace dirty Personal/Settings forms on window focus.
  const focus = () => { if (['overview','via_resume','subscription_overview'].includes(section)) void refresh(); };
  window.addEventListener('focus', focus); window.addEventListener('matchme:profile-changed', refresh);
  return () => { alive.current = false; generation.current++; window.removeEventListener('focus', focus); window.removeEventListener('matchme:profile-changed', refresh); };
 }, [refresh, section]);
 const go = (view: string) => navigate(`/seeker?view=${view}`);
 const content = error ? <div role="alert" className="space-y-3"><p>{ar ? 'تعذر تحميل الحساب.' : 'Unable to load account.'}</p><Button onClick={() => void refresh()}>{ar ? 'إعادة المحاولة' : 'Retry'}</Button></div>
  : !account ? <p role="status">{ar ? 'جارٍ تحميل الحساب…' : 'Loading account…'}</p>
  : section === 'overview' ? <Overview account={account} desktop onNavigate={go} onUpdated={() => void refresh()}/>
  : section === 'personal' ? <Personal account={account} onSaved={setAccount}/>
  : section === 'via_resume' ? <ViaResume uid={account.uid}/>
  : section === 'subscription_overview' ? <SubscriptionOverview uid={account.uid}/>
  : <MobileSupport section={section === 'settings' ? 'account_settings' : section} account={account} onUpdated={setAccount} onNavigate={go}/>;
 return <section dir={ar ? 'rtl' : 'ltr'} aria-busy={loading} className={embedded ? 'space-y-4' : 'flex-1 p-4 sm:p-6 overflow-y-auto'} data-testid="desktop-account-features"><div className={embedded ? '' : 'max-w-2xl space-y-6'}><Card><CardContent className="p-4 sm:p-6">{content}</CardContent></Card></div></section>;
}
