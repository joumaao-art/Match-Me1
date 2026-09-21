/**
 * End-to-end real-runtime test of the Job Seeker signup flow.
 * ============================================================
 * Goes further than the spinner harness: it performs an ACTUAL signup against
 * the configured Supabase project (mailer auto-confirm is enabled, so a new
 * account receives a live session immediately), then follows the app to its
 * post-signup destination while watching every full-screen gate, the console,
 * page errors and network failures.
 *
 * It also re-loads the destination to prove a refresh does not re-create a
 * spinner, which is the behaviour originally reported as broken.
 *
 * Usage:
 *   node scripts/runtime-signup-e2e.mjs [baseUrl]
 *
 * Environment:
 *   CHROME_PATH    - explicit Chromium/Chrome executable (optional)
 *   REPRO_BASE_URL - overrides the default base URL
 *   REPRO_HEADFUL  - "1" to watch the run with a visible window
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.REPRO_BASE_URL || process.argv[2] || 'http://localhost:3000';
const ARTIFACTS = 'scripts/artifacts';
const EMAIL = process.env.REPRO_EMAIL || `matchme.qa.${Date.now()}@example.com`;
const PASSWORD = process.env.REPRO_PASSWORD || 'MatchMe!2026qa';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean).filter((p) => fs.existsSync(p));

const consoleLines = [];
const pageErrors = [];
const issues = [];
const timings = [];
const started = new Map();
const stamp = () => new Date().toISOString().slice(11, 23);

const DOM_PROBE = () => {
  const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const identified = document.querySelector('[data-loader-id]');
  const spinners = Array.from(document.querySelectorAll('.animate-spin'));
  const blocking = spinners.find((node) => {
    let el = node;
    for (let i = 0; i < 5 && el; i += 1) {
      const cls = el.className;
      if (typeof cls === 'string' && (cls.includes('fixed inset-0') || cls.includes('min-h-screen') || cls.includes('min-h-[100dvh]'))) return true;
      el = el.parentElement;
    }
    return false;
  });
  return {
    route: location.pathname + location.search,
    loaderId: identified ? identified.getAttribute('data-loader-id') : blocking ? 'unidentified-fullscreen-spinner' : null,
    bodyText,
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => (h.innerText || '').trim()).slice(0, 4),
  };
};

const probe = async (page) => {
  try {
    return await page.evaluate(DOM_PROBE);
  } catch (err) {
    return { error: String(err && err.message) };
  }
};

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

async function clickButton(page, namePattern) {
  const btn = page.getByRole('button', { name: new RegExp(namePattern, 'i') });
  const n = await btn.count();
  for (let i = 0; i < n; i += 1) {
    const el = btn.nth(i);
    if (await el.isVisible().catch(() => false)) {
      const label = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label };
    }
  }
  const fallback = page.getByText(new RegExp(namePattern, 'i'));
  const m = await fallback.count();
  for (let i = 0; i < m; i += 1) {
    const el = fallback.nth(i);
    const txt = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (txt.length > 60) continue;
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label: txt, viaText: true };
    }
  }
  return { clicked: false };
}

async function watchGates(page, seconds, label) {
  const samples = [];
  const routes = new Set();
  for (let i = 0; i < seconds; i += 1) {
    await page.waitForTimeout(1000);
    const s = await probe(page);
    routes.add(s.route);
    samples.push({ t: `${i + 1}s`, ...s });
  }
  const gates = samples.filter((s) => s.loaderId);
  report(`${label} - gate watch (${seconds}s)`, {
    stuckSamples: gates.length,
    activeLoaders: [...new Set(gates.map((s) => s.loaderId))],
    routesVisited: [...routes],
    firstStuck: gates[0] || null,
    last: samples[samples.length - 1],
  });
  return { samples, gates };
}

async function sessionSnapshot(page) {
  return page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      out[k] = (localStorage.getItem(k) || '').length;
    }
    const authKey = Object.keys(out).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    return { keys: out, hasSupabaseSession: !!authKey };
  });
}

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  console.log(`Base URL : ${BASE}`);
  console.log(`Browser  : ${CANDIDATES[0]}`);
  console.log(`Test email: ${EMAIL}`);

  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  page.on('console', (msg) => consoleLines.push(`[${stamp()}][${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => pageErrors.push(`[${stamp()}] ${err.message}`));
  page.on('request', (req) => started.set(req, Date.now()));
  page.on('requestfailed', (req) => issues.push(`[${stamp()}] FAILED ${req.method()} ${req.url().slice(0, 120)} :: ${req.failure()?.errorText}`));
  page.on('response', (res) => {
    const req = res.request();
    const ms = started.has(req) ? Date.now() - started.get(req) : null;
    const url = res.url();
    if (url.includes('/auth/v1/') || url.includes('/rest/v1/')) timings.push({ status: res.status(), ms, url: url.replace(BASE, '').slice(0, 110) });
    if (res.status() >= 400) issues.push(`[${stamp()}] HTTP ${res.status()} ${url.slice(0, 130)}${ms != null ? ` (${ms}ms)` : ''}`);
  });

  // -------------------------------------------------------------
  // TEST 1 — public signup entry renders (clean profile)
  // -------------------------------------------------------------
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  const t1 = await watchGates(page, 4, 'TEST 1 public /auth');
  report('TEST 1 - public signup entry', { finalRoute: t1.samples.at(-1).route, body: t1.samples.at(-1).bodyText });
  await page.screenshot({ path: path.join(ARTIFACTS, 'e2e-01-auth.png') }).catch(() => {});

  // -------------------------------------------------------------
  // TEST 2 — Job Seeker signup methods render
  // -------------------------------------------------------------
  const role = await clickButton(page, '^Job Seeker');
  await page.waitForTimeout(1500);
  const t2 = await probe(page);
  report('TEST 2 - Job Seeker signup methods', { ...role, after: t2 });
  const t2gates = await watchGates(page, 5, 'TEST 2b after role select');
  await page.screenshot({ path: path.join(ARTIFACTS, 'e2e-02-signup-methods.png') }).catch(() => {});

  // -------------------------------------------------------------
  // TEST 3 — email signup form
  // -------------------------------------------------------------
  const toEmail = await clickButton(page, 'sign up with email');
  await page.waitForTimeout(1200);
  report('TEST 3 - email signup form', { ...toEmail, after: await probe(page) });

  const filled = [];
  const emailBox = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
  if (await emailBox.count()) await emailBox.fill(EMAIL).then(() => filled.push('email')).catch(() => {});
  const pw = page.locator('input[type="password"]');
  const pwCount = await pw.count();
  for (let i = 0; i < pwCount; i += 1) await pw.nth(i).fill(PASSWORD).then(() => filled.push(`password#${i}`)).catch(() => {});
  report('TEST 3b - form filled', { filled, before: await probe(page) });

  // -------------------------------------------------------------
  // TEST 4 — submit; then watch the destination for a stuck gate
  // -------------------------------------------------------------
  const submit = await clickButton(page, '^Sign Up$|^Register$|^Create account$');
  await page.waitForTimeout(700);
  const rightAfterSubmit = await probe(page);
  const sessionAfterSubmit = await sessionSnapshot(page);
  report('TEST 4 - submitted', { ...submit, rightAfterSubmit, sessionAfterSubmit });
  await page.screenshot({ path: path.join(ARTIFACTS, 'e2e-04-after-submit.png') }).catch(() => {});

  const t4 = await watchGates(page, 30, 'TEST 4b post-signup destination');
  await page.screenshot({ path: path.join(ARTIFACTS, 'e2e-05-destination.png') }).catch(() => {});

  // -------------------------------------------------------------
  // TEST 4c — continue from the Welcome screen into the journey
  // -------------------------------------------------------------
  const startJourney = await clickButton(page, 'get started|start|begin');
  await page.waitForTimeout(1200);
  const t4c = await watchGates(page, 18, 'TEST 4c onboarding journey');
  await page.screenshot({ path: path.join(ARTIFACTS, 'e2e-07-onboarding-step.png') }).catch(() => {});
  report('TEST 4c - onboarding journey continued', {
    ...startJourney,
    finalRoute: t4c.samples.at(-1).route,
    headings: t4c.samples.at(-1).headings,
  });

  // -------------------------------------------------------------
  // TEST 5 — refresh the destination (reported failure mode)
  // -------------------------------------------------------------
  const dest = t4.samples.at(-1).route;
  await page.reload({ waitUntil: 'domcontentloaded' });
  const t5 = await watchGates(page, 25, `TEST 5 refresh ${dest}`);
  await page.screenshot({ path: path.join(ARTIFACTS, 'e2e-06-after-refresh.png') }).catch(() => {});

  // -------------------------------------------------------------
  // TEST 6 — unauthenticated protected route redirects (clean profile)
  // -------------------------------------------------------------
  const cleanCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const cleanPage = await cleanCtx.newPage();
  const cleanWatch = [];
  await cleanPage.goto(`${BASE}/seeker/onboarding`, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 12; i += 1) {
    await cleanPage.waitForTimeout(1000);
    cleanWatch.push(await cleanPage.evaluate(DOM_PROBE));
  }
  report('TEST 6 - unauthenticated /seeker/onboarding', {
    routes: [...new Set(cleanWatch.map((s) => s.route))],
    stuckLoaders: [...new Set(cleanWatch.filter((s) => s.loaderId).map((s) => s.loaderId))],
    final: cleanWatch.at(-1),
  });
  await cleanCtx.close();

  report('CONSOLE OUTPUT', consoleLines.length ? consoleLines.join('\n') : '(none)');
  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');
  report('NETWORK ISSUES', issues.length ? issues.join('\n') : '(none)');
  report('SUPABASE TIMINGS', JSON.stringify(timings.slice(0, 50), null, 2));
  report('FINAL SUMMARY', {
    test1_publicEntry: t1.gates.length === 0 ? 'PASS (no blocking gate)' : `BLOCKED ${[...new Set(t1.gates.map((g) => g.loaderId))]}`,
    test2_methods: t2gates.gates.length === 0 ? 'PASS' : `BLOCKED ${[...new Set(t2gates.gates.map((g) => g.loaderId))]}`,
    test4_postSignup: t4.gates.length === 0 ? 'PASS (no blocking gate)' : `BLOCKED ${[...new Set(t4.gates.map((g) => g.loaderId))]}`,
    test4c_journey: t4c.gates.length === 0 ? 'PASS' : `BLOCKED ${[...new Set(t4c.gates.map((g) => g.loaderId))]}`,
    test5_refresh: t5.gates.length === 0 ? 'PASS' : `BLOCKED ${[...new Set(t5.gates.map((g) => g.loaderId))]}`,
  });

  await browser.close();
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
