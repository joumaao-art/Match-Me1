/**
 * Outcome matrix for the Job Seeker EMAIL signup path.
 * ============================================================
 * The reported defect was a post-submission hang, so this harness asserts the
 * two things a hang violates:
 *   1. the submit control is never left permanently busy, and
 *   2. no full-screen gate is left covering the screen.
 *
 * It exercises every outcome the email signup can end in — a real session, a
 * response that still requires email verification, and an error — plus a
 * refresh on the verification screen, all inside ONE persistent browser
 * profile so reduced/localStorage state from a previous step cannot hide the
 * bug (which is what a fresh context per scenario would do).
 *
 * Usage:
 *   node scripts/probe-signup-outcomes.mjs [baseUrl]
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
const STAMP = Date.now();
const EMAIL = process.env.REPRO_EMAIL || `matchme.outcome.${STAMP}@example.com`;
const PASSWORD = process.env.REPRO_PASSWORD || 'MatchMe!2026qa';
const STRONG = PASSWORD + 'Xy9!';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean).filter((p) => fs.existsSync(p));

const consoleLines = [];
const pageErrors = [];
const networkIssues = [];

const stamp = () => new Date().toISOString().slice(11, 23);

const DOM_PROBE = () => {
  const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
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
  const submitLabels = ['sign up', 'register', 'create account', 'verify', 'resend', 'back to login'];
  const submitish = Array.from(document.querySelectorAll('button')).filter((b) => {
    const txt = (b.innerText || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return submitLabels.some((l) => txt === l || txt.startsWith(l));
  });
  return {
    route: location.pathname + location.search,
    loaderId: identified ? identified.getAttribute('data-loader-id') : blocking ? 'unidentified-fullscreen-spinner' : null,
    busyButtons: submitish.filter((b) => b.disabled).map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim()),
    toasts: Array.from(document.querySelectorAll('[data-sonner-toast], li[role="status"]'))
      .map((n) => (n.innerText || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 4),
    bodyText: bodyText.slice(0, 320),
    showPasswordField: !!document.querySelector('input[type="password"]'),
    verifyScreen: /verify your email/i.test(bodyText),
    registerScreen: /create your account|sign up/i.test(bodyText),
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

const PERSISTED_PAYLOAD = () => {
  const keys = Object.keys(localStorage);
  const authKey = keys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
  const raw = authKey ? localStorage.getItem(authKey) || '' : '';
  return {
    keys,
    hasSupabaseSession: !!authKey,
    pendingRole: localStorage.getItem('matchme-pending-role'),
    pendingEmail: localStorage.getItem('matchme-pending-email'),
    sessionHasAccessToken: /"access_token"\s*:\s*"[^"]+"/.test(raw),
  };
};

async function settleWatch(page, seconds) {
  const samples = [];
  const routes = new Set();
  for (let i = 0; i < seconds; i += 1) {
    await page.waitForTimeout(1000);
    const s = await probe(page);
    routes.add(s.route);
    samples.push({ t: `${i + 1}s`, ...s });
  }
  const gated = samples.filter((s) => s.loaderId);
  const busy = samples.filter((s) => s.busyButtons.length);
  return {
    routes: [...routes],
    gatedSamples: gated.length,
    loaderIds: [...new Set(gated.map((s) => s.loaderId))],
    busySamples: busy.length,
    final: samples[samples.length - 1],
    samples,
  };
}

async function clickByText(page, pattern, { maxLen = 70 } = {}) {
  const wanted = new RegExp(pattern, 'i');
  const buttons = page.getByRole('button', { name: wanted });
  const n = await buttons.count();
  for (let i = 0; i < n; i += 1) {
    const el = buttons.nth(i);
    if (await el.isVisible().catch(() => false)) {
      const label = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label, via: 'button' };
    }
  }
  const texts = page.getByText(wanted);
  const m = await texts.count();
  for (let i = 0; i < m; i += 1) {
    const el = texts.nth(i);
    const txt = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (txt.length > maxLen) continue;
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label: txt, via: 'text' };
    }
  }
  return { clicked: false };
}

async function fillSignupForm(page, email, password, confirm) {
  const filled = [];
  const emailBox = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
  if (await emailBox.count()) {
    await emailBox.fill(email).then(() => filled.push('email')).catch(() => {});
  }
  const passwords = page.locator('input[type="password"]');
  const count = await passwords.count();
  for (let i = 0; i < count; i += 1) {
    await passwords.nth(i).fill(i === 0 ? password : confirm).then(() => filled.push(`password#${i}`)).catch(() => {});
  }
  return filled;
}

/** Walk /auth -> Job Seeker -> Sign up with Email -> the register form. */
async function openRegisterForm(page) {
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const role = await clickByText(page, '^Job Seeker$', { maxLen: 20 });
  await page.waitForTimeout(1200);
  const emailMethod = await clickByText(page, 'sign up with email');
  await page.waitForTimeout(1200);
  return { role, emailMethod, probe: await probe(page) };
}

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  console.log(`Base URL  : ${BASE}`);
  console.log(`Browser   : ${CANDIDATES[0]}`);
  console.log(`Test email: ${EMAIL}`);

  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  // ONE persistent profile for every scenario: state from an earlier signup can
  // no longer mask the defect.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  page.on('console', (msg) => consoleLines.push(`[${stamp()}][${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => pageErrors.push(`[${stamp()}] ${err.message}`));
  page.on('requestfailed', (req) => networkIssues.push(`[${stamp()}] FAILED ${req.method()} ${req.url().slice(0, 120)} :: ${req.failure()?.errorText}`));
  page.on('response', (res) => {
    if (res.status() >= 400) networkIssues.push(`[${stamp()}] HTTP ${res.status()} ${res.url().slice(0, 130)}`);
  });

  const results = {};

  // ---------------------------------------------------------------
  // SCENARIO C — weak password (fastest, leaves no server state)
  // ---------------------------------------------------------------
  await openRegisterForm(page);
  await clickByText(page, '^Company$', { maxLen: 20 }).catch(() => {});
  await page.waitForTimeout(800);
  await openRegisterForm(page);
  await fillSignupForm(page, `weak.${STAMP}@example.com`, 'Ab1!', 'Ab1!');
  await clickByText(page, '^Sign Up$|^Register$|^Create account$');
  const weakWatch = await settleWatch(page, 5);
  results.C_weakPassword = {
    verdict: weakWatch.gatedSamples === 0 && weakWatch.busySamples === 0 ? 'SETTLED' : 'PROBLEM',
    route: weakWatch.final.route,
    toasts: weakWatch.final.toasts,
    busySamples: weakWatch.busySamples,
  };

  // ---------------------------------------------------------------
  // SCENARIO B — invalid email
  // ---------------------------------------------------------------
  const bForm = await openRegisterForm(page);
  await fillSignupForm(page, 'not-an-email', STRONG, STRONG);
  await clickByText(page, '^Sign Up$|^Register$|^Create account$');
  const invalidWatch = await settleWatch(page, 6);
  results.B_invalidEmail = {
    verdict: invalidWatch.gatedSamples === 0 && invalidWatch.busySamples === 0 ? 'SETTLED' : 'PROBLEM',
    route: invalidWatch.final.route,
    toasts: invalidWatch.final.toasts,
    busySamples: invalidWatch.busySamples,
    formWasReachable: bForm.probe?.showPasswordField ?? null,
  };

  // ---------------------------------------------------------------
  // SCENARIO A — brand-new email (the reported path)
  // ---------------------------------------------------------------
  await openRegisterForm(page);
  const aFilled = await fillSignupForm(page, EMAIL, STRONG, STRONG);
  const beforeSubmit = await probe(page);
  await clickByText(page, '^Sign Up$|^Register$|^Create account$');
  await page.waitForTimeout(900);
  const rightAfterSubmit = await probe(page);
  const persistA = await page.evaluate(PERSISTED_PAYLOAD);
  const aWatch = await settleWatch(page, 22);
  await page.screenshot({ path: path.join(ARTIFACTS, 'outcome-A-new-email.png') }).catch(() => {});
  const aOutcome = aWatch.final.verifyScreen
    ? 'verification_required'
    : aWatch.final.route.startsWith('/seeker')
      ? 'authenticated'
      : 'unknown';
  results.A_newEmail = {
    verdict: aWatch.gatedSamples === 0 && aWatch.busySamples === 0 ? 'SETTLED' : 'PROBLEM',
    filled: aFilled,
    formBeforeSubmit: beforeSubmit.showPasswordField,
    rightAfterSubmit: {
      route: rightAfterSubmit.route,
      verifyScreen: rightAfterSubmit.verifyScreen,
      busyButtons: rightAfterSubmit.busyButtons,
      toasts: rightAfterSubmit.toasts,
    },
    persisted: persistA,
    outcome: aOutcome,
    subOutcome:
      aOutcome === 'verification_required'
        ? 'no session issued -> verification screen, zero authenticated writes'
        : 'session issued -> identity bootstrap + role-aware destination',
    finalRoute: aWatch.final.route,
    loaderIds: aWatch.loaderIds,
    busySamples: aWatch.busySamples,
    toasts: aWatch.final.toasts,
  };

  // ---------------------------------------------------------------
  // SCENARIO A2 — refresh on the outcome screen (must NOT re-spin)
  // ---------------------------------------------------------------
  const aRoute = aWatch.final.route;
  await page.reload({ waitUntil: 'domcontentloaded' });
  const a2Watch = await settleWatch(page, 14);
  await page.screenshot({ path: path.join(ARTIFACTS, 'outcome-A2-refresh.png') }).catch(() => {});
  results.A2_refreshOutcome = {
    verdict: a2Watch.gatedSamples === 0 && a2Watch.busySamples === 0 ? 'SETTLED' : 'PROBLEM',
    refreshedRoute: aRoute,
    route: a2Watch.final.route,
    verifyScreen: a2Watch.final.verifyScreen,
    loaderIds: a2Watch.loaderIds,
    pending: await page.evaluate(PERSISTED_PAYLOAD),
  };

  // ---------------------------------------------------------------
  // SCENARIO D — same email submitted again (already registered)
  // ---------------------------------------------------------------
  await openRegisterForm(page);
  await fillSignupForm(page, EMAIL, STRONG, STRONG);
  await clickByText(page, '^Sign Up$|^Register$|^Create account$');
  const dWatch = await settleWatch(page, 20);
  await page.screenshot({ path: path.join(ARTIFACTS, 'outcome-D-duplicate.png') }).catch(() => {});
  results.D_duplicateEmail = {
    verdict: dWatch.gatedSamples === 0 && dWatch.busySamples === 0 ? 'SETTLED' : 'PROBLEM',
    route: dWatch.final.route,
    loaderIds: dWatch.loaderIds,
    busySamples: dWatch.busySamples,
    toasts: dWatch.final.toasts,
  };

  // ---------------------------------------------------------------
  // SCENARIO E — resend verification from the verification screen
  // ---------------------------------------------------------------
  if (aWatch.final.verifyScreen || dWatch.final.verifyScreen) {
    await clickByText(page, 'resend verification email');
    const eWatch = await settleWatch(page, 8);
    results.E_resend = {
      verdict: eWatch.gatedSamples === 0 && eWatch.busySamples === 0 ? 'SETTLED' : 'PROBLEM',
      route: eWatch.final.route,
      toasts: eWatch.final.toasts,
      busySamples: eWatch.busySamples,
    };
  } else {
    results.E_resend = { verdict: 'SKIPPED (no verification screen reached)' };
  }

  report('OUTCOME MATRIX', results);
  report('CONSOLE (filtered)', consoleLines.filter((l) => /error|warn|signup|Signup|onboarding/i.test(l)).slice(0, 40).join('\n') || '(none)');
  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');
  report('NETWORK ISSUES', networkIssues.length ? networkIssues.slice(0, 30).join('\n') : '(none)');

  const problems = Object.entries(results).filter(([, v]) => v.verdict === 'PROBLEM');
  report('SUMMARY', {
    scenarios: Object.keys(results).length,
    problems: problems.map(([k]) => k),
    allSettled: problems.length === 0,
    newEmailOutcomeResolved: results.A_newEmail.outcome !== 'unknown',
  });

  await browser.close();
  if (problems.length) process.exitCode = 1;
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
