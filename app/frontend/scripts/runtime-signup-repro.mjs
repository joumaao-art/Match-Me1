/**
 * Real-runtime reproduction harness for the Job Seeker signup spinner.
 * ============================================================
 * Driven by a REAL Chromium instance against the REAL dev server, this script
 * is the only acceptable evidence for the signup defect: it collects console
 * output, uncaught page errors, per-request timings, slow/pending requests and
 * — most importantly — the identity of whichever full-screen loader is mounted
 * while the UI is stuck.
 *
 * Usage:
 *   node scripts/runtime-signup-repro.mjs [baseUrl]
 *
 * Environment:
 *   CHROME_PATH     - explicit Chromium/Chrome executable (optional)
 *   REPRO_BASE_URL  - overrides the default base URL
 *   REPRO_HEADFUL   - "1" to watch the run with a visible window
 *   REPRO_EMAIL     - reuse a fixed signup email (default: unique per run)
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.REPRO_BASE_URL || process.argv[2] || 'http://localhost:3000';
const ARTIFACTS = 'scripts/artifacts';

/** Candidate browser executables, first existing one wins. */
const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean).filter((p) => fs.existsSync(p));

const consoleLines = [];
const pageErrors = [];
const requestIssues = [];
const started = new Map();
const timings = [];

const stamp = () => new Date().toISOString().slice(11, 23);

/** Snapshot what the DOM currently shows, including the active loader. */
const DOM_PROBE = () => {
  const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 500);
  const identified = document.querySelector('[data-loader-id]');
  const spinners = Array.from(document.querySelectorAll('.animate-spin'));
  const blocking = spinners.find((node) => {
    let el = node;
    for (let i = 0; i < 5 && el; i += 1) {
      const cls = el.className;
      if (typeof cls === 'string' && (cls.includes('fixed inset-0') || cls.includes('min-h-screen') || cls.includes('min-h-[100dvh]'))) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  });
  const visibleLabels = Array.from(document.querySelectorAll('button, a, [role="button"], .cursor-pointer'))
    .map((n) => (n.innerText || '').replace(/\s+/g, ' ').trim())
    .filter((txt) => txt && txt.length < 60)
    .slice(0, 25);
  return {
    route: location.pathname + location.search,
    loaderId: identified ? identified.getAttribute('data-loader-id') : blocking ? 'unidentified-fullscreen-spinner' : null,
    bodyText,
    visibleLabels: [...new Set(visibleLabels)],
  };
};

const probe = async (page) => {
  try {
    return await page.evaluate(DOM_PROBE);
  } catch (err) {
    return { error: String(err && err.message) };
  }
};

async function clickTextAny(page, pattern) {
  const re = new RegExp(pattern, 'i');
  const locator = page.getByText(re);
  const count = await locator.count();
  const tried = [];
  for (let i = 0; i < count; i += 1) {
    const el = locator.nth(i);
    const txt = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (txt.length > 60) continue; // skip wrappers/containers
    tried.push(txt);
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 5000 }).catch(() => {});
      return { clicked: true, label: txt };
    }
  }
  return { clicked: false, tried: tried.slice(0, 10) };
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(ARTIFACTS, `${name}.png`), fullPage: false }).catch(() => {});
}

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

/** Watch every gate for up to `seconds`, recording whenever one is mounted. */
async function watchGates(page, seconds, label) {
  const samples = [];
  for (let i = 0; i < seconds; i += 1) {
    await page.waitForTimeout(1000);
    samples.push({ t: `${i + 1}s`, ...(await probe(page)) });
  }
  const gates = samples.filter((s) => s.loaderId);
  report(`${label} - gate watch (${seconds}s)`, {
    stuckSamples: gates.length,
    activeLoaders: [...new Set(gates.map((s) => s.loaderId))],
    firstStuck: gates[0] || null,
    last: samples[samples.length - 1],
  });
  return { samples, gates };
}

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  console.log(`Base URL: ${BASE}`);
  console.log(`Browser : ${CANDIDATES[0]}`);

  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  // A fresh context == a clean browser profile (no session, no cache).
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  page.on('console', (msg) => consoleLines.push(`[${stamp()}][${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => pageErrors.push(`[${stamp()}] ${err.message}`));
  page.on('request', (req) => started.set(req, Date.now()));
  page.on('requestfailed', (req) =>
    requestIssues.push(`[${stamp()}] FAILED ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`)
  );
  page.on('response', (res) => {
    const req = res.request();
    const ms = started.has(req) ? Date.now() - started.get(req) : null;
    const url = res.url();
    if (/supabase|auth|profile|onboarding/.test(url)) timings.push({ status: res.status(), ms, url: url.slice(0, 130) });
    if (res.status() >= 400) requestIssues.push(`[${stamp()}] HTTP ${res.status()} ${url}${ms != null ? ` (${ms}ms)` : ''}`);
  });
  page.on('requestfinished', (req) => {
    const ms = started.has(req) ? Date.now() - started.get(req) : null;
    if (ms != null && ms > 3000) requestIssues.push(`[${stamp()}] SLOW ${ms}ms ${req.method()} ${req.url().slice(0, 120)}`);
  });

  // ---------- TEST 1: cold boot of the public auth route ----------
  const bootStart = Date.now();
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  const early = await probe(page);
  const watch = await watchGates(page, 6, 'TEST 1 cold boot /auth');
  report('TEST 1 - cold boot', {
    totalMs: Date.now() - bootStart,
    immediatelyAfterDomReady: early,
    settled: watch.samples[watch.samples.length - 1],
  });
  await shot(page, '01-auth-cold-boot');
  if (watch.gates.length === 6) {
    report('VERDICT', 'BLOCKED on a public auth route — signup flow cannot proceed.');
    await browser.close();
    return;
  }

  // ---------- TEST 2: select the Job Seeker role ----------
  const role = await clickTextAny(page, '^Job Seeker');
  await page.waitForTimeout(1500);
  const afterRole = await probe(page);
  report('TEST 2 - Job Seeker role selected', { ...role, afterRole });
  await shot(page, '02-role-seeker');

  // ---------- TEST 3: the signup journey must render provider options ----------
  const gatesAfterRole = afterRole.loaderId ? await watchGates(page, 8, 'TEST 2b role gate watch') : null;
  report('TEST 2b - loader after role selection', gatesAfterRole ? { activeLoaders: gatesAfterRole.gates.map((s) => s.loaderId) } : 'no loader');

  // ---------- TEST 4: email signup form ----------
  const signupEntry = await clickTextAny(page, 'continue with email');
  await page.waitForTimeout(1500);
  const afterEmailEntry = await probe(page);
  report('TEST 4 - email signup opened', { ...signupEntry, afterEmailEntry });
  await shot(page, '04-email-signup');

  const email = process.env.REPRO_EMAIL || `matchme.qa.${Date.now()}@example.com`;
  const password = 'MatchMe!2026qa';
  const fills = [];
  const emailBox = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
  if (await emailBox.count()) await emailBox.fill(email).then(() => fills.push('email')).catch(() => {});
  const pwBoxes = page.locator('input[type="password"]');
  const pwCount = await pwBoxes.count();
  for (let i = 0; i < pwCount; i += 1) {
    await pwBoxes.nth(i).fill(password).then(() => fills.push(`password#${i}`)).catch(() => {});
  }
  const beforeSubmit = await probe(page);
  const submit = await clickTextAny(page, '^Sign Up$');
  report('TEST 5 - signup submitted', { email, fills, ...submit, beforeSubmit });
  await page.waitForTimeout(800);
  await shot(page, '05-after-submit');

  // ---------- TEST 6: does a blocking loader appear after submission? ----------
  const post = await watchGates(page, 25, 'TEST 6 post-submit');
  await shot(page, '06-post-submit-settled');

  report('CONSOLE OUTPUT', consoleLines.length ? consoleLines.join('\n') : '(none)');
  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');
  report('NETWORK ISSUES', requestIssues.length ? requestIssues.join('\n') : '(none)');
  report('SUPABASE/AUTH TIMINGS', JSON.stringify(timings.slice(0, 60), null, 2));

  await browser.close();
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
