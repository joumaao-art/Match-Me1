import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let passed = 0;
const test = (name, run) => { run(); passed++; console.log(`PASS ${name}`); };
try {
  const nav = await server.ssrLoadModule('/src/lib/seeker-navigation.ts');
  test('exact three tabs in physical left-to-right order', () => assert.deepEqual(nav.SEEKER_MOBILE_TABS.map(t => t.id), ['swipe', 'dashboard', 'profile']));
  for (const tab of ['swipe', 'dashboard', 'profile']) {
    test(`${tab} route round trips`, () => { const url = new URL(nav.seekerSectionUrl(tab), 'https://example.com'); assert.equal(nav.seekerSection(url.pathname, url.search), tab); });
    test(`${tab} highlights its own destination`, () => assert.equal(nav.activeSeekerMobileTab(tab), tab));
  }
  for (const section of ['cv','experience','education','certificates','skills','languages','preferences','settings']) test(`${section} highlights Profile`, () => assert.equal(nav.activeSeekerMobileTab(section), 'profile'));
  for (const section of ['applications','matches','saved']) test(`${section} highlights Dashboard`, () => assert.equal(nav.activeSeekerMobileTab(section), 'dashboard'));
  test('Messages never highlights an unrelated tab', () => assert.equal(nav.activeSeekerMobileTab('messages'), null));
  test('Messages retains existing route', () => assert.equal(nav.seekerSectionUrl('messages'), '/messages'));
  test('legacy Discover deep link opens Swipe', () => assert.equal(nav.seekerSection('/seeker/discover', ''), 'swipe'));
  test('legacy query Discover opens Swipe', () => assert.equal(nav.seekerSection('/seeker', '?view=discover'), 'swipe'));
  test('legacy Account opens Profile', () => assert.equal(nav.seekerSection('/seeker/account', ''), 'profile'));
  test('unknown routes fall back without loading', () => assert.equal(nav.seekerSection('/seeker/unknown', ''), 'dashboard'));
  test('query route takes precedence over old path', () => assert.equal(nav.seekerSection('/seeker/discover', '?view=profile'), 'profile'));
  test('no arbitrary or invalid badge count accepted', () => { for (const value of [null,undefined,-1,1.5,'2',NaN,Infinity]) assert.equal(nav.accurateBadgeCount(value), null); });
  test('actual zero and positive unread counts accepted', () => { assert.equal(nav.accurateBadgeCount(0),0); assert.equal(nav.accurateBadgeCount(12),12); });
  const bar = await readFile('src/components/shared/MobileBottomNav.tsx', 'utf8');
  test('RTL preserves physical order with localized label direction', () => { assert.ok(bar.includes('dir="ltr"')); assert.ok(bar.includes("i18n.language.startsWith('ar') ? 'rtl' : 'ltr'")); });
  test('bar is mobile-only and safe-area aware', () => { assert.ok(bar.includes('md:hidden')); assert.ok(bar.includes('safe-area-inset-bottom')); assert.ok(bar.includes('grid-cols-3 h-16')); });
  test('labels are unwrapped and targets accessible', () => { assert.ok(bar.includes('whitespace-nowrap')); assert.ok(bar.includes('min-h-11')); assert.ok(bar.includes('aria-current')); });
  test('bottom bar has no fabricated badges or Messages item', () => { assert.ok(!bar.includes('badges')); assert.ok(!bar.includes("id: 'messages'")); });
  const dashboard = await readFile('src/components/shared/MobileDashboard.tsx','utf8');
  test('Dashboard exposes Messages, Applications and Matches shortcuts', () => { for (const section of ['messages','applications','matches']) assert.ok(dashboard.includes(`section: '${section}'`)); });
  test('Messages badge stays on Messages shortcut', () => assert.ok(dashboard.includes("action.section==='messages' && unreadMessages!==null && unreadMessages>0")));
  for (const language of ['en','ar']) {
    const translations = await server.ssrLoadModule(`/packages/shared/src/i18n/${language}.ts`);
    const strings = translations[language];
    test(`${language} Swipe label and onboarding reference`, () => { assert.equal(strings.discover, strings.swipe); assert.ok(strings.swipe); assert.ok(!strings.ob_tutorial_done.includes('Discover')); assert.ok(!strings.ob_tutorial_done.includes('اكتشف')); });
  }
  console.log(`${passed} seeker navigation checks passed.`);
} finally { await server.close(); }
