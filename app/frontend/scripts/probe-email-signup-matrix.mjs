/**
 * EMAIL SIGNUP MATRIX — real browser, persistent profile
 * ============================================================
 * The single-scenario probe settles in ~2s from a CLEAN browser profile. A real
 * user's App Viewer is not clean: it keeps cookies, localStorage, the persisted
 * zustand auth store and the Supabase session across attempts. This harness
 * therefore reuses ONE persistent profile for every scenario, in the same order
 * a real user would hit them, and reports the first scenario that does not
 * settle — which is the reporting criterion that matters.
 *
 * Scenarios
 *   A  new email                -> Welcome (or "Check your email")
 *   B  same email again         -> secure/verify outcome, never a spinner
 *   C  invalid email            -> validation, never a spinner
 *   D  weak password            -> validation, never a spinner
 *   E  signup while signed in   -> resolves, never a spinner
 *   F  refresh destination      -> no infinite loader
 *
 * Usage: node scripts/probe-email-signup-matrix.mjs [baseUrl]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chromium } from 'playwright';

const BASE = process.env.REPRO_BASE_URL || process.argv[2] || 'http://localhost:3000';
const ARTIFACTS = 'scripts/artifacts';
const WATCH = Number(process.env.PROBE_WATCH || 25);
const STAMP_RUN = Date.now();

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
]
  .filter(Boolean)
  .filter((p) => fs.existsSync(p));

const consoleLines = [];
const pageErrors = [];
const apiResponses = [];
const stamp = () => new Date().toISOString().slice(11, 23);

const DOM_PROBE = () => {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const identified = document.querySelector('[data-loader-id]');
  let fullscreenSpinner = null;
  for (const node of Array.from(document.querySelectorAll('.animate-spin'))) {
    let el = node;
    for (let i = 0; i < 6 && el; i += 1) {
      const cls = typeof el.className === 'string' ? el.className : '';
      if (cls.includes('min-h-screen') || cls.includes('fixed inset-0') || cls.includes('min-h-[100dvh]')) {
        fullscreenSpinner = cls.includes('min-h-screen') ? 'min-h-screen' : 'overlay';
        break;
      }
      el = el.parentElement;
    }
    if (fullscreenSpinner) break;
  }
  const submit = document.querySelector('form button[type="submit"]');
  return {
    route: location.pathname + location.search,
    loaderId: identified ? identified.getAttribute('data-loader-id') : null,
    fullscreenSpinner,
    submit: submit ? { text: clean(submit.textContent), disabled: !!submit.disabled } : null,
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => clean(h.innerText)).filter(Boolean).slice(0, 3),
    toast: Array.from(document.querySelectorAll('[data-sonner-toast]')).map((n) => clean(n.textContent)).slice(0, 3),
    body: clean(document.body.innerText).slice(0, 200),
  };
};

const probe = (page) => page.evaluate(DOM_PROBE).catch((e) => ({ error: String(e.message) }));

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

async function click(page, pattern) {
  const re = new RegExp(pattern, 'i');
  const byRole = page.getByRole('button', { name: re });
  const n = await byRole.count();
  for (let i = 0; i < n; i += 1) {
    const el = byRole.nth(i);
    if (await el.isVisible().catch(() => false)) {
      const label = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label };
    }
  }
  const byText = page.getByText(re);
  const m = await byText.count();
  for (let i = 0; i < m; i += 1) {
    const el = byText.nth(i);
    const text = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (text.length > 70) continue;
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label: text, viaText: true };
    }
  }
  return { clicked: false };
}

/** Walk from a cold /auth to the email signup form, tolerating both entry states. */
async function openEmailSignupForm(page) {
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  let state = await probe(page);
  if (await page.locator('#reg-email').count()) return state;

  if (/Job Seeker/i.test(state.body) && !/Sign up with email/i.test(state.body)) {
    await click(page, '^Job Seeker');
    await page.waitForTimeout(1600);
  }
  if (!(await page.locator('#reg-email').count())) {
    await click(page, 'sign up with email');
    await page.waitForTimeout(1400);
  }
  if (!(await page.locator('#reg-email').count())) {
    await click(page, 'sign up with email');
    await page.waitForTimeout(1400);
  }
  return probe(page);
}

async function fillAndSubmit(page, email, password) {
  await page.locator('#reg-email').fill(email).catch(() => {});
  await page.locator('#reg-password').fill(password).catch(() => {});
  await page.locator('#reg-confirm').fill(password).catch(() => {});
  await page.waitForTimeout(400);
  const submit = page.locator('form button[type="submit"]').last();
  await submit.click({ timeout: 8000 }).catch(() => {});
}

/** Sample once per second; a gate in the last 3 samples = stuck. */
async function watch(page, label, seconds = WATCH) {
  const samples = [];
  for (let i = 0; i < seconds; i += 1) {
    await page.waitForTimeout(1000);
    samples.push({ t: `+${i + 1}s`, ...(await probe(page)) });
  }
  const gates = samples.filter((s) => s.loaderId || s.fullscreenSpinner);
  const tail = samples.slice(-3);
  const stuckAt = tail.every((s) => s.loaderId || s.fullscreenSpinner)
    ? tail[0].loaderId || tail[0].fullscreenSpinner
    : null;
  const final = samples[samples.length - 1];
  const busyTail = tail.every((s) => s.submit?.disabled && /loading/i.test(s.submit?.text || ''));
  const verdict = stuckAt
    ? `STUCK (${stuckAt})`
    : busyTail
      ? 'STUCK (submit button busy)'
      : 'SETTLED';
  report(label, {
    verdict,
    stuckLoader: stuckAt,
    gateSamples: gates.length,
    loaderIdsSeen: [...new Set(gates.map((s) => s.loaderId || s.fullscreenSpinner))],
    routes: [...new Set(samples.map((s) => s.route))],
    final,
  });
  return { verdict, stuckAt, final, samples };
}

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'matchme-profile-'));

  const newEmail = `matchme.matrix.${STAMP_RUN}@example.com`;
  const PASSWORD = 'MatchMe!2026qa';

  console.log(`Base URL     : ${BASE}`);
  console.log(`Persistent   : ${profileDir}`);
  console.log(`New email    : ${newEmail}`);

  const browser = await chromium.launchPersistentContext(profileDir, {
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    viewport: { width: 390, height: 844 },
  });
  const page = browser.pages()[0] || (await browser.newPage());

  page.on('console', (m) => consoleLines.push(`[${stamp()}][${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => pageErrors.push(`[${stamp()}] ${e.message}`));
  page.on('response', async (res) => {
    const url = res.url();
    if (!/\/auth\/v1\/(signup|token)/.test(url)) return;
    let shape = null;
    try {
      const json = JSON.parse(await res.text());
      shape = {
        hasUser: !!json.user,
        hasSession: !!json.session,
        emailConfirmedAt: json.user?.email_confirmed_at ?? null,
        identities: Array.isArray(json.user?.identities) ? json.user.identities.length : null,
        error: json.error ?? json.msg ?? json.error_code ?? null,
      };
    } catch {
      /* non-json */
    }
    apiResponses.push({ at: stamp(), status: res.status(), url: url.replace(BASE, '').slice(0, 60), shape });
  });

  const results = {};

  // ---- A: new email -------------------------------------------------------
  report('A — preflight form', await openEmailSignupForm(page));
  await fillAndSubmit(page, newEmail, PASSWORD);
  results.A_newEmail = await watch(page, 'A — NEW EMAIL → destination');
  await page.screenshot({ path: path.join(ARTIFACTS, 'matrix-A-new.png') }).catch(() => {});

  // ---- F: refresh the destination while a session exists ------------------
  await page.reload({ waitUntil: 'domcontentloaded' });
  results.F_refresh = await watch(page, 'F — REFRESH destination with live session');

  // ---- B: same email again (existing account) ----------------------------
  report('B — preflight form', await openEmailSignupForm(page));
  const bPre = await probe(page);
  if (bPre.submit) {
    await fillAndSubmit(page, newEmail, PASSWORD);
    results.B_existingEmail = await watch(page, 'B — EXISTING EMAIL again');
  } else {
    results.B_existingEmail = { verdict: `NO-FORM (already authenticated on ${bPre.route})`, stuckAt: bPre.loaderId };
    report('B — form not reachable', bPre);
  }
  await page.screenshot({ path: path.join(ARTIFACTS, 'matrix-B-existing.png') }).catch(() => {});

  // ---- C: invalid email --------------------------------------------------
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const cPre = await openEmailSignupForm(page);
  if (cPre.submit) {
    await fillAndSubmit(page, 'not-an-email', PASSWORD);
    results.C_invalidEmail = await watch(page, 'C — INVALID EMAIL', 12);
  } else {
    results.C_invalidEmail = { verdict: 'NO-FORM' };
  }
  await page.screenshot({ path: path.join(ARTIFACTS, 'matrix-C-invalid.png') }).catch(() => {});

  // ---- D: weak password --------------------------------------------------
  const dPre = await openEmailSignupForm(page);
  if (dPre.submit) {
    await fillAndSubmit(page, `matchme.weak.${STAMP_RUN}@example.com`, 'abc');
    results.D_weakPassword = await watch(page, 'D — WEAK PASSWORD', 12);
  } else {
    results.D_weakPassword = { verdict: 'NO-FORM' };
  }
  await page.screenshot({ path: path.join(ARTIFACTS, 'matrix-D-weak.png') }).catch(() => {});

  report('AUTH RESPONSES', apiResponses.length ? apiResponses : '(none)');
  report('APP CONSOLE', consoleLines.length ? consoleLines.slice(-60).join('\n') : '(none)');
  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');
  report(
    'MATRIX SUMMARY',
    Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { verdict: v.verdict, route: v.final?.route }]))
  );

  await browser.close();
  fs.rmSync(profileDir, { recursive: true, force: true });
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
