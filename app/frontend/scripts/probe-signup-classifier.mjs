/**
 * Deterministic verification of the email-signup outcome contract.
 * ============================================================
 * The live Supabase project answers an email signup with a real session, so the
 * "verification still required" branch (a confirmed user with NO session) is
 * the branch a live run can miss. It is also the branch that produced the
 * reported hang, so it is asserted here against the REAL module.
 *
 * Two real-runtime checks, no mocks:
 *   PART 1 — the app's own `/src/lib/signup-flow.ts` classifier is loaded into
 *            the browser through the running dev server and called with the
 *            exact response shapes Supabase can return.
 *   PART 2 — the verification screen survives a refresh: the pending-signup
 *            handoff is seeded in localStorage, the page reloaded, and the UI
 *            is watched for a stuck gate and a permanently busy button.
 *
 * Usage:
 *   node scripts/probe-signup-classifier.mjs [baseUrl]
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.REPRO_BASE_URL || process.argv[2] || 'http://localhost:3000';
const ARTIFACTS = 'scripts/artifacts';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean).filter((p) => fs.existsSync(p));

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

const DOM_PROBE = () => {
  const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
  const identified = document.querySelector('[data-loader-id]');
  const blocking = Array.from(document.querySelectorAll('.animate-spin')).find((node) => {
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
    verifyScreen: /verify your email/i.test(bodyText),
    showsEmail: /matchme\.verify\.|@example\.com/i.test(bodyText),
    resendDisabled: Array.from(document.querySelectorAll('button')).some(
      (b) => /resend/i.test(b.innerText || '') && b.disabled
    ),
    bodyText: bodyText.slice(0, 240),
  };
};

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // -----------------------------------------------------------------
  // PART 1 — the real classifier against every response shape
  // -----------------------------------------------------------------
  const classifier = await page.evaluate(async () => {
    const url = '/src/lib/signup-flow.ts';
    try {
      const mod = await import(/* @vite-ignore */ url);
      const fixtures = {
        // Email confirmation pending: user present, still unconfirmed, no session.
        pendingNoSession: {
          data: { user: { id: 'u-1', email: 'a@b.c', email_confirmed_at: null, identities: [{ id: 'i' }] }, session: null },
          error: null,
        },
        // Auto-confirmed but STILL no session — the exact shape that caused the hang.
        confirmedNoSession: {
          data: { user: { id: 'u-2', email: 'a@b.c', email_confirmed_at: '2026-09-21T00:00:00Z', identities: [{ id: 'i' }] }, session: null },
          error: null,
        },
        // Address already registered: no session, empty identity list, no error.
        alreadyRegistered: {
          data: { user: { id: 'u-3', email: 'a@b.c', email_confirmed_at: '2026-09-21T00:00:00Z', identities: [] }, session: null },
          error: null,
        },
        // Session issued: the only success shape that may run authenticated writes.
        withSession: {
          data: {
            user: { id: 'u-4', email: 'a@b.c', email_confirmed_at: '2026-09-21T00:00:00Z', identities: [{ id: 'i' }] },
            session: { access_token: 'token', user: { id: 'u-4' } },
          },
          error: null,
        },
        // Error responses must stay errors.
        authError: { data: { user: null, session: null }, error: { message: 'User already registered', code: 'user_already_exists' } },
        noUser: { data: { user: null, session: null }, error: null },
      };

      const out = {};
      for (const [name, fixture] of Object.entries(fixtures)) {
        const r = mod.classifySignupOutcome(fixture.data, fixture.error);
        out[name] = { outcome: r.outcome, userId: r.userId, alreadyRegistered: r.alreadyRegistered, message: r.message };
      }
      const EXPECTED = {
        pendingNoSession: 'verification_required',
        confirmedNoSession: 'verification_required',
        alreadyRegistered: 'verification_required',
        withSession: 'authenticated',
        authError: 'error',
        noUser: 'error',
      };
      const mismatches = Object.keys(EXPECTED).filter((k) => out[k].outcome !== EXPECTED[k]);
      return {
        loaded: true,
        results: out,
        expected: EXPECTED,
        mismatches,
        alreadyRegisteredFlagged: out.alreadyRegistered.alreadyRegistered === true,
        // Guard the regression directly: a session-less response must never be
        // reported as authenticated.
        sessionlessNeverAuthenticated:
          out.pendingNoSession.outcome !== 'authenticated' &&
          out.confirmedNoSession.outcome !== 'authenticated' &&
          out.alreadyRegistered.outcome !== 'authenticated',
      };
    } catch (err) {
      return { loaded: false, error: String(err && err.message) };
    }
  });

  // -----------------------------------------------------------------
  // PART 2 — verification screen after a refresh (no session at all)
  // -----------------------------------------------------------------
  const verifyEmail = `matchme.verify.${Date.now()}@example.com`;
  await page.evaluate(
    ([role, mail]) =>
      new Promise((resolve) => {
        // Emulate a user who signed up, was told to check their inbox, and
        // reloaded the page before confirming.
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-') || k === 'matchme-token' || k === 'matchme-role')
          .forEach((k) => localStorage.removeItem(k));
        localStorage.setItem('matchme-pending-role', role);
        localStorage.setItem('matchme-pending-email', mail);
        resolve(true);
      }),
    ['job_seeker', verifyEmail]
  );

  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  const samples = [];
  for (let i = 0; i < 12; i += 1) {
    await page.waitForTimeout(1000);
    samples.push(await page.evaluate(DOM_PROBE));
  }
  await page.screenshot({ path: path.join(ARTIFACTS, 'classifier-verify-refresh.png') }).catch(() => {});
  const gated = samples.filter((s) => s.loaderId);
  const verifyReached = samples.filter((s) => s.verifyScreen).length;
  const last = samples[samples.length - 1];

  const summary = {
    part1_classifierLoaded: classifier.loaded === true,
    part1_outcomeMismatches: classifier.mismatches ?? ['MODULE_NOT_LOADED'],
    part1_sessionlessNeverAuthenticated: classifier.sessionlessNeverAuthenticated === true,
    part1_alreadyRegisteredFlagged: classifier.alreadyRegisteredFlagged === true,
    part2_verifyScreenReached: verifyReached > 0,
    part2_verifyScreenStableSamples: `${verifyReached}/${samples.length}`,
    part2_gatedSamples: gated.length,
    part2_loaderIds: [...new Set(gated.map((s) => s.loaderId))],
    part2_resendNeverStuckDisabled: samples.every((s) => !s.resendDisabled),
    part2_finalRoute: last.route,
    part2_showsEmail: last.showsEmail,
    overallPass:
      classifier.loaded === true &&
      (classifier.mismatches ?? ['x']).length === 0 &&
      classifier.sessionlessNeverAuthenticated === true &&
      classifier.alreadyRegisteredFlagged === true &&
      verifyReached > 0 &&
      gated.length === 0 &&
      samples.every((s) => !s.resendDisabled),
  };

  report('CLASSIFIER RESULTS', classifier.results ?? classifier);
  report('VERIFICATION SCREEN AFTER REFRESH', {
    route: last.route,
    verifyScreenSamples: `${verifyReached}/${samples.length}`,
    loaderIds: [...new Set(gated.map((s) => s.loaderId))],
    showsEmail: last.showsEmail,
    finalBody: last.bodyText,
  });
  report('SIGNUP OUTCOME CONTRACT', summary);

  await browser.close();
  if (!summary.overallPass) process.exitCode = 1;
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
