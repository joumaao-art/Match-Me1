/**
 * SURGICAL PROBE — email/password signup transition
 * ============================================================
 * Performs the EXACT user action reported as broken:
 *
 *   Job Seeker -> Sign Up with Email -> email + password -> Sign Up
 *
 * and records, second by second, what the application actually does:
 *
 *  - the raw Supabase signup response (user present? session present?
 *    email_confirmed_at present?) with secrets redacted
 *  - every follow-up auth/rest call with status, duration and error body
 *  - every full-screen gate currently covering the screen (by data-loader-id)
 *  - the submit button's own busy state ("Loading…" + disabled)
 *  - console trace lines emitted by the app
 *
 * The goal is to name the exact hanging operation, not to guess from visuals.
 *
 * Usage:
 *   node scripts/probe-email-signup-transition.mjs [baseUrl]
 *
 * Environment:
 *   PROBE_LABEL    - label for this run ("new" | "existing" | "invalid" | "weak")
 *   REPRO_EMAIL    - explicit email to submit
 *   REPRO_PASSWORD - explicit password to submit
 *   PROBE_WATCH    - seconds to watch after submit (default 40)
 *   CHROME_PATH    - explicit Chromium executable
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.REPRO_BASE_URL || process.argv[2] || 'http://localhost:3000';
const ARTIFACTS = 'scripts/artifacts';
const LABEL = process.env.PROBE_LABEL || 'new';
const WATCH_SECONDS = Number(process.env.PROBE_WATCH || 40);

const EMAIL =
  process.env.REPRO_EMAIL ||
  (LABEL === 'invalid'
    ? 'not-an-email'
    : LABEL === 'existing'
      ? 'matchme.existing.probe@example.com'
      : `matchme.probe.${Date.now()}@example.com`);

const PASSWORD =
  process.env.REPRO_PASSWORD || (LABEL === 'weak' ? 'abc' : 'MatchMe!2026qa');

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
]
  .filter(Boolean)
  .filter((p) => fs.existsSync(p));

/** Strip anything secret before it can land in a log file. */
const redact = (value) => {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 24 && /^[A-Za-z0-9._-]+$/.test(value)) return `<redacted:${value.length}>`;
    return value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (/password|token|secret|otp|key|refresh|access/i.test(k)) out[k] = '<redacted>';
      else out[k] = redact(v);
    }
    return out;
  }
  return value;
};

const consoleLines = [];
const pageErrors = [];
const apiCalls = [];
const gateTimeline = [];
const stamp = () => new Date().toISOString().slice(11, 23);

const DOM_PROBE = () => {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const identified = document.querySelector('[data-loader-id]');
  const submit = document.querySelector('form button[type="submit"]');

  // Any spinner that is stretched across the viewport counts as a full-screen gate
  // even when it carries no diagnostic id.
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

  return {
    route: location.pathname + location.search,
    loaderId: identified ? identified.getAttribute('data-loader-id') : null,
    fullscreenSpinner,
    submit: submit
      ? {
          text: clean(submit.textContent),
          disabled: submit.disabled,
        }
      : null,
    headings: Array.from(document.querySelectorAll('h1,h2,h3'))
      .map((h) => clean(h.innerText))
      .filter(Boolean)
      .slice(0, 3),
    toast: Array.from(document.querySelectorAll('[data-sonner-toast], li[data-sonner-toast]'))
      .map((n) => clean(n.textContent))
      .slice(0, 3),
    body: clean(document.body.innerText).slice(0, 220),
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

async function clickByTextOrRole(page, pattern) {
  const css = new RegExp(pattern, 'i');
  const roleBtn = page.getByRole('button', { name: css });
  const n = await roleBtn.count();
  for (let i = 0; i < n; i += 1) {
    const el = roleBtn.nth(i);
    if (await el.isVisible().catch(() => false)) {
      const text = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label: text, via: 'role' };
    }
  }
  const textNodes = page.getByText(css);
  const m = await textNodes.count();
  for (let i = 0; i < m; i += 1) {
    const el = textNodes.nth(i);
    const text = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (text.length > 70) continue;
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label: text, via: 'text' };
    }
  }
  return { clicked: false };
}

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  console.log(`PROBE      : ${LABEL}`);
  console.log(`Base URL   : ${BASE}`);
  console.log(`Email      : ${EMAIL}`);
  console.log(`Password   : ${PASSWORD.length} chars`);
  console.log(`Browser    : ${CANDIDATES[0]}`);

  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLines.push(`[${stamp()}][${msg.type()}] ${text}`);
  });
  page.on('pageerror', (err) => pageErrors.push(`[${stamp()}] ${err.message}`));

  // Capture the auth calls that decide signup outcome. Bodies are redacted, but
  // the STRUCTURE (user/session/email_confirmed_at presence) is preserved.
  page.on('response', async (res) => {
    const url = res.url();
    if (!/\/auth\/v1\/|\/rest\/v1\//.test(url)) return;
    const entry = {
      at: stamp(),
      status: res.status(),
      method: res.request().method(),
      url: url.replace(BASE, '').slice(0, 100),
    };
    try {
      const text = await res.text();
      if (/\/auth\/v1\/(signup|token|user)/.test(url) || res.status() >= 400) {
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          /* not json */
        }
        if (json && typeof json === 'object') {
          entry.body = redact({
            hasUser: !!json.user,
            hasSession: !!json.session,
            userEmailConfirmedAt: json.user?.email_confirmed_at ?? null,
            identitiesCount: Array.isArray(json.user?.identities) ? json.user.identities.length : null,
            userId: json.user?.id ? `${String(json.user.id).slice(0, 8)}…` : null,
            error: json.error ?? null,
            errorCode: json.error_code ?? null,
            msg: json.msg ?? null,
            code: json.code ?? null,
          });
        } else {
          entry.bodyRaw = text.slice(0, 220);
        }
      }
    } catch {
      /* body unavailable */
    }
    apiCalls.push(entry);
  });

  // ---------------------------------------------------------------
  // STEP 1 — open the Job Seeker signup entry (exactly as a user does:
  // landing on /auth, choosing Job Seeker, then "Sign up with Email").
  // NOTE: /auth?role=seeker forces the LOGIN view by design, so the harness
  // must not use it when the goal is the signup form.
  // ---------------------------------------------------------------
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const step1 = await probe(page);
  report('STEP 1 — /auth', step1);

  const role = await clickByTextOrRole(page, '^Job Seeker');
  await page.waitForTimeout(1800);
  report('STEP 1b — choose Job Seeker', { ...role, after: await probe(page) });

  // ---------------------------------------------------------------
  // STEP 2 — Job Seeker signup methods -> Sign up with Email
  // ---------------------------------------------------------------
  let toEmail = { clicked: false };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    toEmail = await clickByTextOrRole(page, 'sign up with email');
    await page.waitForTimeout(1400);
    if (await page.locator('#reg-email').count()) break;
  }
  report('STEP 2 — open email signup form', { ...toEmail, after: await probe(page) });

  // ---------------------------------------------------------------
  // STEP 3 — fill the form exactly as a user would
  // ---------------------------------------------------------------
  const filled = {};
  const emailBox = page.locator('#reg-email');
  if (await emailBox.count()) {
    await emailBox.fill(EMAIL);
    filled.email = 'reg-email';
  } else {
    const generic = page.locator('input[type="email"], input[autocomplete="email"]').first();
    if (await generic.count()) {
      await generic.fill(EMAIL);
      filled.email = 'generic';
    }
  }
  // Dedicated ids first; fall back to every password field so "confirm password"
  // is filled too (an empty confirm field silently blocks the form).
  const pwByld = page.locator('#reg-password');
  if (await pwByld.count()) {
    await pwByld.fill(PASSWORD).catch(() => {});
    filled.password = 'reg-password';
  }
  const confirmBox = page.locator('#reg-confirm');
  if (await confirmBox.count()) {
    await confirmBox.fill(PASSWORD).catch(() => {});
    filled.confirm = 'reg-confirm';
  }
  const pwBoxes = page.locator('input[type="password"]');
  const pwCount = await pwBoxes.count();
  for (let i = 0; i < pwCount; i += 1) {
    const value = await pwBoxes.nth(i).inputValue().catch(() => '');
    if (!value) await pwBoxes.nth(i).fill(PASSWORD).catch(() => {});
  }
  filled.passwordFields = pwCount;
  await page.waitForTimeout(400);
  report('STEP 3 — form filled', { filled, dom: await probe(page) });

  // ---------------------------------------------------------------
  // STEP 4 — SUBMIT (the reported failure point)
  // ---------------------------------------------------------------
  const submit = page.locator('form button[type="submit"]').last();
  const beforeSubmit = await probe(page);
  const submitInfo = await submit
    .click({ timeout: 8000 })
    .then(() => ({ clicked: true }))
    .catch((err) => ({ clicked: false, error: String(err.message).slice(0, 90) }));

  for (let i = 0; i < WATCH_SECONDS; i += 1) {
    await page.waitForTimeout(1000);
    const state = await probe(page);
    gateTimeline.push({ t: `+${i + 1}s`, ...state });
    if (i === 0 || i === 2 || i === 5 || i === 9 || i === 19 || i === WATCH_SECONDS - 1) {
      await page
        .screenshot({ path: path.join(ARTIFACTS, `probe-${LABEL}-${String(i + 1).padStart(2, '0')}s.png`) })
        .catch(() => {});
    }
  }

  const gates = gateTimeline.filter((s) => s.loaderId || s.fullscreenSpinner);
  const final = gateTimeline[gateTimeline.length - 1];
  const tail = gateTimeline.slice(-3);
  const stuckAt = tail.every((s) => s.loaderId || s.fullscreenSpinner)
    ? (tail[0].loaderId || tail[0].fullscreenSpinner)
    : null;

  report('STEP 4 — submit', { beforeSubmit, submitInfo, afterSubmit: gateTimeline[0] });

  report('STEP 4b — gate timeline (1s samples)', {
    samples: WATCH_SECONDS,
    gateSamples: gates.length,
    loaderIdsSeen: [...new Set(gates.map((s) => s.loaderId || s.fullscreenSpinner))],
    firstGate: gates[0] || null,
    final,
    stuckAt,
  });

  report('STEP 4c — submit button state over time', gateTimeline.map((s) => ({ t: s.t, submit: s.submit, route: s.route })));

  report('AUTH / REST CALLS', apiCalls.length ? apiCalls : '(none)');

  report('APP CONSOLE', consoleLines.length ? consoleLines.join('\n') : '(none)');
  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');

  const verdict = {
    probe: LABEL,
    email: EMAIL,
    finalRoute: final.route,
    finalHeadings: final.headings,
    stuckLoader: stuckAt,
    submitButtonStuckBusy: final.submit?.disabled === true && /loading/i.test(final.submit?.text || ''),
    reachedVerifyScreen: /verify|check your email/i.test(`${final.headings.join(' ')} ${final.body}`),
    reachedWelcome: /welcome/i.test(`${final.headings.join(' ')} ${final.body}`),
    signupResponse: apiCalls.find((c) => c.url.includes('/auth/v1/signup'))?.body || null,
  };
  report('PROBE VERDICT', verdict);
  report('CLASSIFICATION', stuckAt
    ? `STUCK — full-screen gate "${stuckAt}" still covering the app after ${WATCH_SECONDS}s`
    : verdict.submitButtonStuckBusy
      ? `STUCK (form-level) — submit button still busy after ${WATCH_SECONDS}s; no full-screen gate`
      : `SETTLED — reached ${final.route} with no blocking gate`);

  await browser.close();
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
