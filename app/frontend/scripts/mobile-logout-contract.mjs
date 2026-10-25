import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}
globalThis.WebSocket = class { static OPEN=1; static CONNECTING=0; static CLOSED=3; };
globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();
globalThis.window = {
  atob: globalThis.atob, btoa: globalThis.btoa, console,
  location: { origin: 'https://example.com' }, dispatchEvent: () => {},
  localStorage, sessionStorage,
};
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let count = 0;
const test = async (name, check) => { await check(); count++; console.log(`PASS ${name}`); };
try {
  const { clearSeekerSessionCache, logoutMobileSeeker } = await server.ssrLoadModule('/src/services/mobile-logout.ts');
  const { authService } = await server.ssrLoadModule('/src/services/auth.service.ts');
  const { apiClient } = await server.ssrLoadModule('/src/services/api-client.ts');
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.store.ts');
  const storage = new MemoryStorage();
  const privateKeys = ['matchme_swipes', 'matchme_matches', 'matchme_notifications', 'matchme_ai_interactions', 'matchme_ai_weights', 'matchme_audit_log', 'matchme-analytics-events', 'matchme:shared-job', 'matchme-profile:owner:experience', 'matchme-profile:owner:education', 'matchme-job-preferences:owner', 'notifications_owner', 'notification_prefs_owner', 'matchme:via-plan:owner', 'messages_owner', 'credits_owner', 'applications_owner'];
  const preserved = ['matchme-mobile-onboarding:owner', 'matchme-profile:other:experience', 'matchme-job-preferences:other', 'messages_other', 'credits_other', 'applications_other', 'language', 'theme'];
  [...privateKeys, ...preserved].forEach(key => storage.setItem(key, 'original'));
  clearSeekerSessionCache('owner', storage);
  await test('all known owner and legacy private caches cleared', () => privateKeys.forEach(key => assert.equal(storage.getItem(key), null)));
  await test('onboarding, other owners and appearance settings preserved', () => preserved.forEach(key => assert.equal(storage.getItem(key), 'original')));
  await test('single storage removal failure does not stop remaining cleanup', () => {
    const restricted = new MemoryStorage();
    restricted.setItem('credits_owner', '1'); restricted.setItem('messages_owner', 'private');
    restricted.removeItem = key => { if (key === 'credits_owner') throw new Error('denied'); restricted.values.delete(key); };
    clearSeekerSessionCache('owner', restricted);
    assert.equal(restricted.getItem('messages_owner'), null);
  });

  const originalSignOut = authService.signOut;
  const originalUnsubscribe = apiClient.unsubscribeAll;
  let calls = 0, queryClears = 0, subscriptionsCleared = 0;
  const owner = () => useAuthStore.setState({ userId: 'owner', userRole: 'job_seeker', isAuthenticated: true });
  apiClient.unsubscribeAll = () => { subscriptionsCleared++; };
  try {
    authService.signOut = async () => { calls++; return { data: null, error: { message: 'Network unavailable' } }; };
    owner(); localStorage.setItem('messages_owner', 'private');
    await test('returned sign-out error retains auth, caches and subscriptions', async () => {
      await assert.rejects(logoutMobileSeeker('owner', () => queryClears++), /Network unavailable/);
      assert.equal(useAuthStore.getState().isAuthenticated, true);
      assert.equal(localStorage.getItem('messages_owner'), 'private');
      assert.equal(queryClears, 0); assert.equal(subscriptionsCleared, 0);
    });
    await test('wrong owner cannot sign out current account', async () => {
      const before = calls;
      await assert.rejects(logoutMobileSeeker('foreign', () => queryClears++), /Account changed/);
      assert.equal(calls, before);
    });
    await test('Company and Admin cannot use seeker helper', async () => {
      const before = calls;
      for (const role of ['company', 'admin']) {
        useAuthStore.setState({ userRole: role });
        await assert.rejects(logoutMobileSeeker('owner', () => queryClears++), /Account changed/);
      }
      assert.equal(calls, before);
    });
    owner();
    authService.signOut = async () => { calls++; throw new Error('Rejected request'); };
    await test('rejected sign-out retains auth and caches', async () => {
      await assert.rejects(logoutMobileSeeker('owner', () => queryClears++), /Rejected request/);
      assert.equal(useAuthStore.getState().userId, 'owner');
      assert.equal(localStorage.getItem('messages_owner'), 'private');
    });
    authService.signOut = async () => ({ data: null, error: null });
    await test('confirmed success resets auth and clears both cache stores', async () => {
      sessionStorage.setItem('credits_owner', '20');
      localStorage.setItem('matchme-mobile-onboarding:owner', 'progress');
      await logoutMobileSeeker('owner', () => queryClears++);
      assert.equal(useAuthStore.getState().isAuthenticated, false);
      assert.equal(useAuthStore.getState().userId, null);
      assert.equal(queryClears, 1); assert.equal(subscriptionsCleared, 1);
      assert.equal(localStorage.getItem('messages_owner'), null);
      assert.equal(sessionStorage.getItem('credits_owner'), null);
      assert.equal(localStorage.getItem('matchme-mobile-onboarding:owner'), 'progress');
    });
    owner();
    authService.signOut = async () => { useAuthStore.getState().reset(); return { data: null, error: null }; };
    await test('SIGNED_OUT listener resetting first still completes cleanup', async () => {
      await logoutMobileSeeker('owner', () => queryClears++);
      assert.equal(queryClears, 2);
    });
    owner();
    authService.signOut = async () => {
      useAuthStore.setState({ userId: 'new-owner', userRole: 'company', isAuthenticated: true });
      return { data: null, error: null };
    };
    await test('new account during sign-out is not reset or cleared', async () => {
      const before = queryClears;
      await assert.rejects(logoutMobileSeeker('owner', () => queryClears++), /Account changed during logout/);
      assert.equal(useAuthStore.getState().userId, 'new-owner');
      assert.equal(useAuthStore.getState().isAuthenticated, true);
      assert.equal(queryClears, before);
    });
    owner(); authService.signOut = async () => ({ data: null, error: null });
    await test('denied storage access cannot block successful logout redirect path', async () => {
      Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
      await logoutMobileSeeker('owner', () => { throw new Error('cleanup failure'); });
      assert.equal(useAuthStore.getState().isAuthenticated, false);
      Object.defineProperty(window, 'localStorage', { configurable: true, value: localStorage });
    });
  } finally { authService.signOut = originalSignOut; apiClient.unsubscribeAll = originalUnsubscribe; }

  const ui = await readFile('src/components/seeker/MobileProfileLogout.tsx', 'utf8');
  const account = await readFile('src/components/seeker/MobileProfileAccount.tsx', 'utf8');
  const route = await readFile('src/pages/JobSeeker.tsx', 'utf8');
  const app = await readFile('src/App.tsx', 'utf8');
  const helper = await readFile('src/services/mobile-logout.ts', 'utf8');
  await test('Logout mounted immediately below Personal', () => assert.match(account, /label=\{copy\('Personal'[\s\S]*?<\/nav><MobileProfileLogout uid=\{account.uid\}/));
  await test('entire native button opens dialog without sign-out', () => assert.match(ui, /data-testid="mobile-profile-logout" onClick=\{\(\)=>\{setError\(''\);setOpen\(true\);\}\}/));
  await test('required dialog text and English/Arabic actions present', () => {
    for (const text of ['Log out?', 'Are you sure you want to log out of your MatchMe account?', 'Cancel', 'Logout', 'تسجيل الخروج', 'إلغاء']) assert.ok(ui.includes(text));
  });
  await test('Cancel uses dialog close primitive, not sign-out', () => assert.match(ui, /<AlertDialogCancel disabled=\{busy\}[^>]*>\{copy\('Cancel','إلغاء'\)\}<\/AlertDialogCancel>/));
  await test('confirmation has duplicate and busy-close protection', () => {
    assert.ok(ui.includes('if(lock.current)return;')); assert.ok(ui.includes('if(!lock.current)setOpen(value)'));
    assert.ok(ui.includes('onClick={()=>void confirm()}')); assert.ok(ui.includes('role="alert"'));
  });
  await test('existing shared service used; no destructive data writes', () => {
    assert.ok(helper.includes('await authService.signOut()'));
    assert.ok(!/\.delete\(|\.from\(|\.rpc\(|storage\.clear\(/.test(helper));
  });
  await test('success uses fresh guest document and history replacement', () => assert.ok(ui.includes("window.location.replace('/')")));
  await test('existing unauthenticated protected-route replacement retained', () => assert.match(app, /if \(!isAuthenticated\)[\s\S]*?<Navigate to=\{ROUTES.AUTH\}[^>]*replace/));
  await test('mobile-only mounting and safe-area clearance retained', () => {
    assert.ok(route.includes('if (isMobile && MOBILE_ACCOUNT_SECTIONS.includes(activeTab))'));
    assert.ok(route.includes('pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0'));
    assert.ok(route.includes('<MobileBottomNav'));
    assert.ok(route.includes('return <DesktopProfileAccount'));
  });
  await test('row size, red contrast and physical left icon preserved', () => {
    assert.ok(ui.includes('w-full min-h-14')); assert.ok(ui.includes('text-red-700 dark:text-red-400'));
    assert.ok(ui.includes('dir="ltr"')); assert.ok(ui.indexOf('<LogOut size={20}') < ui.indexOf("{copy('Logout'"));
  });
  console.log(`${count} logout unit/static contracts passed; no authenticated browser or live sign-out claims.`);
} finally { await server.close(); }
