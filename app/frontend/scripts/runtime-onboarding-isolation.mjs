/**
 * Runtime verification — onboarding start state and cross-account isolation.
 *
 * Reproduces the reported "new Job Seeker starts at Step 12" defect: the
 * onboarding mirror lives under one global localStorage key
 * (`matchme-onboarding`). User A's progress was reused by User B whenever B had
 * no server-side onboarding_state yet.
 *
 *   T1 User A (real account) progressed to the `plan` step (Step 12) in this browser
 *   T2 User B, a brand-new account, signs in in the SAME browser -> must see Welcome
 *   T3 Get Started -> next registry step (`resume`)
 *   T4 Refresh -> step restored for User B, not User A
 *   T5 User A with COMPLETED mirror, then User B -> Welcome
 *   T6 Mobile 390x844 and desktop 1440x900 -> Welcome renders
 *
 * Usage: node scripts/runtime-onboarding-isolation.mjs
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.REPRO_BASE_URL || 'http://localhost:3000';
const PASSWORD = 'MatchMe!2026qa';
const SUPABASE_URL = 'https://ykvlaakotyouojkdydzh.supabase.co';
const REF = 'ykvlaakotyouojkdydzh';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdmxhYWtvdHlvdW9qa2R5ZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTY3NTgsImV4cCI6MjA5OTg5Mjc1OH0.uHWrLAzqja5VswzFF84Aq8ZCw5xGLodZKFFvbYRtNG8';
const CHROME = ['/opt/ms-playwright/chromium-1169/chrome-linux/chrome'].find((p) => fs.existsSync(p));

const results = [];
const check = (id, desc, ok, detail) => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}${detail ? ` :: ${detail}` : ''}`);
};

async function signUp(tag) {
  const email = `matchme.iso.${tag}.${Date.now()}@example.com`;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, data: { role: 'job_seeker' } }),
  });
  let body = await res.json();
  if (!body.access_token) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    body = await r.json();
  }
  if (!body.access_token) throw new Error(`No session for ${email}: ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

/** A mirror owned by User A at Step 12 (`plan`), steps 1-11 done. */
function mirrorFor(userId, completed) {
  const order = ['welcome', 'resume', 'review', 'basics', 'demographics', 'birthday', 'location',
    'target_countries', 'preferences', 'notifications', 'rating'];
  const steps = Object.fromEntries(order.map((id) => [id, { status: 'done', at: new Date().toISOString() }]));
  return JSON.stringify({
    state: { userId, state: { version: '1.0', startedAt: new Date().toISOString(), currentStep: 'plan', steps, draft: {}, completed } },
    version: 0,
  });
}

async function openAs(page, session, mirror) {
  await page.goto(`${BASE}/`);
  await page.evaluate(([key, value, m]) => {
    localStorage.clear();
    localStorage.setItem(key, value);
    if (m) localStorage.setItem('matchme-onboarding', m);
  }, [`sb-${REF}-auth-token`, JSON.stringify(session), mirror]);
  await page.goto(`${BASE}/seeker/onboarding`);
  await page.waitForTimeout(6000);
}

const onWelcome = async (page) => {
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('matchme-onboarding') || '{}')?.state?.state?.currentStep);
  const text = await page.locator('body').innerText();
  return { step: s, welcome: /start building my profile|get started/i.test(text), url: page.url() };
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const A = await signUp('a');
  const B = await signUp('b');
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  await openAs(page, A, mirrorFor(A.user.id, false));
  const a = await onWelcome(page);
  check('T1', 'User A resumes at own saved Step 12 (plan)', a.step === 'plan', JSON.stringify(a));

  // Keep A's mirror, switch the session to brand-new User B.
  const aMirror = await page.evaluate(() => localStorage.getItem('matchme-onboarding'));
  await openAs(page, B, aMirror);
  const b = await onWelcome(page);
  check('T2', 'New User B starts at Step 1 Welcome', b.step === 'welcome' && b.welcome, JSON.stringify(b));

  await page.getByRole('button', { name: /start building my profile|get started/i }).first().click();
  await page.waitForTimeout(3000);
  const b2 = await onWelcome(page);
  check('T3', 'Get Started advances to next registry step (resume)', b2.step === 'resume', JSON.stringify(b2));

  await page.reload();
  await page.waitForTimeout(6000);
  const b3 = await onWelcome(page);
  check('T4', 'Refresh restores User B step, not User A', b3.step === 'resume', JSON.stringify(b3));

  const C = await signUp('c');
  await openAs(page, C, mirrorFor(A.user.id, true));
  const c = await onWelcome(page);
  check('T5', 'New user after COMPLETED User A starts at Welcome', c.step === 'welcome' && c.welcome && c.url.includes('/seeker/onboarding'), JSON.stringify(c));

  const D = await signUp('d');
  const mobile = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
  await openAs(mobile, D, mirrorFor(A.user.id, false));
  const d = await onWelcome(mobile);
  check('T6', 'Mobile 390x844 new user sees Welcome', d.step === 'welcome' && d.welcome, JSON.stringify(d));
} finally {
  await browser.close();
}
const passed = results.filter(Boolean).length;
console.log(`\nSUMMARY ${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
