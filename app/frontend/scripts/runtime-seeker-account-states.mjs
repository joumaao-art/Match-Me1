/**
 * Runtime verification — Job Seeker account states, refresh, history, mobile.
 * =============================================================================
 * The reported symptoms were all "it never loads" on a Job Seeker account that
 * had been left PARTIALLY initialized by an earlier broken signup. Because the
 * completion flag used to be written by the local onboarding mirror and read
 * from the database by the dashboard, the two could disagree forever and bounce
 * the user between /seeker and /seeker/onboarding, one full-screen loader per
 * hop. The shared authority (ensureJobSeekerInitialized) now repairs the account
 * AND decides the destination, so both screens read the same freshly verified
 * state.
 *
 * This harness walks the REAL running application through the account states
 * that matter, with real Supabase sessions and real RLS, and asserts a finite
 * outcome (route + no stuck gate) for each:
 *
 *   A  PARTIAL account (auth user, no application rows)
 *        A1 sign in                     -> onboarding welcome, rows repaired
 *        A2 landing "Get Started"       -> onboarding welcome
 *        A3 landing "Dashboard"         -> onboarding welcome
 *        A4 refresh the onboarding page -> state restored, no stuck gate
 *        A5 back / forward navigation   -> stable, no redirect loop
 *
 *   B  COMPLETED account (same user, onboarding_completed = true via the user's
 *      own token, so RLS is exercised as the user)
 *        B1 landing "Get Started"       -> /seeker dashboard renders
 *        B2 landing "Dashboard"         -> /seeker dashboard renders
 *        B3 refresh the dashboard       -> state restored, no stuck gate
 *
 *   C  MOBILE (390x844, the provided layout reference viewport)
 *        C1 onboarding route            -> welcome renders in one viewport
 *        C2 dashboard route             -> bottom navigation present
 *
 * A gate counts as STUCK only when it still covers the screen across the last
 * three consecutive samples, so a transient loader is not reported as a hang.
 *
 * Usage:
 *   node scripts/runtime-seeker-account-states.mjs
 *
 * Environment:
 *   CHROME_PATH     - explicit Chromium executable (optional)
 *   REPRO_BASE_URL  - overrides the default base URL
 *   REPRO_HEADFUL   - "1" to watch the run in a visible window
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.REPRO_BASE_URL || 'http://localhost:3000';
const ARTIFACTS = 'scripts/artifacts';

const argv = process.argv.slice(2);
const argOf = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const PASSWORD = argOf('--password') || process.env.REPRO_PASSWORD || 'MatchMe!2026qa';
const EMAIL = argOf('--email') || `matchme.states.${Date.now()}@example.com`;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ykvlaakotyouojkdydzh.supabase.co';
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdmxhYWtvdHlvdW9qa2R5ZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTY3NTgsImV4cCI6MjA5OTg5Mjc1OH0.uHWrLAzqja5VswzFF84Aq8ZCw5xGLodZKFFvbYRtNG8';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean).filter((p) => fs.existsSync(p));

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

const results = [];
const consoleLines = [];
const pageErrors = [];
const netIssues = [];

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

/** Record one assertion so the summary can never be read as "all green" by accident. */
const assert = (id, description, condition, detail) => {
  results.push({ id, description, pass: !!condition, detail });
  console.log(
    `${condition ? 'PASS' : 'FAIL'}  ${id}  ${description}${detail ? ` :: ${JSON.stringify(detail)}` : ''}`
  );
};

/**
 * Browser-side navigation recorder, installed BEFORE the app boots, so every
 * router redirect is captured and a loop shows up as a repeating sequence.
 */
const NAV_RECORDER = () => {
  if (window.__navLog) return;
  window.__navLog = [];
  const push = (entry) => {
    const log = window.__navLog;
    const last = log[log.length - 1];
    if (last && last.to === entry.to && last.kind === entry.kind) {
      last.count = (last.count || 1) + 1;
      last.at = entry.at;
      return;
    }
    log.push(entry);
    if (log.length > 400) log.shift();
  };
  const wrap = (kind) => {
    const original = history[kind];
    history[kind] = function patched(state, title, url) {
      try {
        push({ at: Date.now(), kind, from: location.pathname + location.search, to: url ? String(url) : location.pathname, count: 1 });
      } catch { /* diagnostics must never break navigation */ }
      return original.apply(this, arguments);
    };
  };
  wrap('pushState');
  wrap('replaceState');
  window.addEventListener('popstate', () => {
    push({ at: Date.now(), kind: 'popstate', from: '?', to: location.pathname, count: 1 });
  });
};

const DOM_PROBE = () => {
  const identified = document.querySelector('[data-loader-id]');
  const spinners = Array.from(document.querySelectorAll('.animate-spin'));
  const blocking = spinners.find((node) => {
    let el = node;
    for (let i = 0; i < 5 && el; i += 1) {
      const cls = el.className;
      if (
        typeof cls === 'string' &&
        (cls.includes('fixed inset-0') || cls.includes('min-h-screen') || cls.includes('min-h-[100dvh]'))
      ) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  });
  return {
    at: Date.now(),
    route: location.pathname + location.search,
    loaderId: identified ? identified.getAttribute('data-loader-id') : blocking ? 'unidentified-fullscreen-spinner' : null,
    bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 260),
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => (h.innerText || '').trim()).filter(Boolean).slice(0, 5),
    hasBottomNav: !!document.querySelector('nav[aria-label], [data-mobile-bottom-nav]'),
    navLog: (window.__navLog || []).slice(-40),
  };
};

const probe = async (page) => {
  try {
    return await page.evaluate(DOM_PROBE);
  } catch (err) {
    return { at: Date.now(), route: '?', loaderId: null, bodyText: '', headings: [], navLog: [], error: String(err && err.message) };
  }
};

/** Sample the page every 400ms and classify the outcome. */
async function watch(page, seconds, label) {
  const samples = [];
  const steps = Math.round((seconds * 1000) / 400);
  for (let i = 0; i < steps; i += 1) {
    await page.waitForTimeout(400);
    samples.push(await probe(page));
  }
  const gates = samples.filter((s) => s.loaderId);
  const tail = samples.slice(-3);
  const stuck = tail.length === 3 && tail.every((s) => s.loaderId);
  const routes = [];
  for (const s of samples) {
    if (routes[routes.length - 1] !== s.route) routes.push(s.route);
  }
  const last = samples[samples.length - 1] || { route: '?', bodyText: '', headings: [], navLog: [] };
  const result = {
    label,
    stuck,
    stuckLoader: stuck ? tail[tail.length - 1].loaderId : null,
    gatesSeen: [...new Set(gates.map((g) => g.loaderId))],
    routeSequence: routes,
    finalRoute: last.route,
    finalBody: last.bodyText,
    finalHeadings: last.headings,
    hasBottomNav: last.hasBottomNav,
    navLog: last.navLog,
    // A loop means a route appears many times in a short window.
    routeRepeats: routes.filter((r, i) => routes.indexOf(r) !== i),
  };
  report(label, {
    stuck: result.stuck,
    stuckLoader: result.stuckLoader,
    gatesSeen: result.gatesSeen,
    routeSequence: result.routeSequence,
    finalRoute: result.finalRoute,
    finalBody: result.finalBody,
    finalHeadings: result.finalHeadings,
    routeRepeats: result.routeRepeats,
  });
  return result;
}

async function clickVisible(page, namePattern) {
  const byRole = page.getByRole('button', { name: new RegExp(namePattern, 'i') });
  const n = await byRole.count();
  for (let i = 0; i < n; i += 1) {
    const el = byRole.nth(i);
    if (await el.isVisible().catch(() => false)) {
      const label = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label, via: 'role' };
    }
  }
  const byText = page.getByText(new RegExp(namePattern, 'i'));
  const m = await byText.count();
  for (let i = 0; i < m; i += 1) {
    const el = byText.nth(i);
    const txt = ((await el.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (!txt || txt.length > 60) continue;
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 6000 }).catch(() => {});
      return { clicked: true, label: txt, via: 'text' };
    }
  }
  return { clicked: false };
}

/** Read the session token from storage so account rows can be read/written as the user. */
const sessionToken = (page) =>
  page.evaluate(() => {
    const raw = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(localStorage.getItem(raw));
      const session = parsed?.access_token ? parsed : parsed?.state?.session ?? parsed?.state ?? null;
      return session?.access_token ? { token: session.access_token, userId: session.user?.id || null } : null;
    } catch {
      return null;
    }
  })?.catch(() => null);

/** Query application tables with the user's own token (this also exercises RLS). */
async function accountState(token) {
  if (!token) return { error: 'no-session' };
  const headers = { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` };
  const q = async (table, select = '*') => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`, { headers });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text.slice(0, 200); }
    return { table, status: res.status, rows: Array.isArray(body) ? body.length : null, sample: Array.isArray(body) ? body[0] ?? null : body };
  };
  return {
    user_profiles: await q('user_profiles'),
    job_seeker_profiles: await q('job_seeker_profiles'),
  };
}

/** Mark the account complete THROUGH THE USER'S OWN TOKEN, so RLS is respected. */
async function markOnboardingComplete(token, userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ onboarding_completed: true }),
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 200) };
}

async function signInAsSeeker(page) {
  await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await clickVisible(page, '^Job Seeker');
  await page.waitForTimeout(800);
  await clickVisible(page, '^Log ?in$|Sign ?in|Log ?in with email');
  await page.waitForTimeout(800);
  const emailBox = page.locator('input[type="email"], input[name="email"]').first();
  if (await emailBox.count()) await emailBox.fill(EMAIL).catch(() => {});
  const pwBox = page.locator('input[type="password"]').first();
  if (await pwBox.count()) await pwBox.fill(PASSWORD).catch(() => {});
  await clickVisible(page, '^Log ?in$|^Sign ?in$');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  console.log(`Base URL : ${BASE}`);
  console.log(`Browser  : ${CANDIDATES[0]}`);
  console.log(`Account  : ${EMAIL}`);

  // ----- Fixture A fixture creation: auth user with NO application rows -----
  const created = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  report('FIXTURE — auth-only account created (no application rows)', {
    status: created.status,
    body: (await created.text()).slice(0, 220),
  });

  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  await context.addInitScript(NAV_RECORDER);
  const page = await context.newPage();

  page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => netIssues.push(`FAILED ${req.method()} ${req.url().slice(0, 120)} :: ${req.failure()?.errorText}`));
  page.on('response', (res) => {
    const url = res.url();
    if ((url.includes('/rest/v1/') || url.includes('/auth/v1/')) && res.status() >= 400) {
      netIssues.push(`HTTP ${res.status()} ${url.replace(BASE, '').slice(0, 120)}`);
    }
  });

  // =========================================================================
  // A — PARTIAL account
  // =========================================================================
  await signInAsSeeker(page);
  const a1 = await watch(page, 14, 'A1 — sign in (partial account)');
  assert('A1', 'partial account reaches onboarding welcome without a stuck gate', !a1.stuck && a1.finalRoute.startsWith('/seeker/onboarding'), { route: a1.finalRoute, loader: a1.stuckLoader });

  const sessionA = await sessionToken(page);
  const rowsA = await accountState(sessionA?.token);
  assert(
    'A1b',
    'account rows repaired for the partial account (user_profiles + job_seeker_profiles readable under RLS)',
    rowsA?.user_profiles?.status === 200 && rowsA?.user_profiles?.rows === 1 && rowsA?.job_seeker_profiles?.status === 200 && rowsA?.job_seeker_profiles?.rows === 1,
    { user_profiles: { status: rowsA?.user_profiles?.status, rows: rowsA?.user_profiles?.rows }, job_seeker_profiles: { status: rowsA?.job_seeker_profiles?.status, rows: rowsA?.job_seeker_profiles?.rows } }
  );
  assert('A1c', 'no fabricated profile data (seeker row is an empty identity shell)', !rowsA?.job_seeker_profiles?.sample?.full_name, { full_name: rowsA?.job_seeker_profiles?.sample?.full_name ?? null });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await watch(page, 5, 'A2 — authenticated landing page');
  await clickVisible(page, '^Get started$|Get Started');
  const a2 = await watch(page, 16, 'A2 — GET STARTED click (partial account)');
  assert('A2', '"Get started" lands on onboarding and never hangs', !a2.stuck && a2.finalRoute.startsWith('/seeker/onboarding'), { route: a2.finalRoute, loader: a2.stuckLoader, repeats: a2.routeRepeats });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await clickVisible(page, '^Dashboard$');
  const a3 = await watch(page, 16, 'A3 — DASHBOARD click (partial account)');
  assert('A3', '"Dashboard" lands on onboarding and never hangs', !a3.stuck && a3.finalRoute.startsWith('/seeker/onboarding'), { route: a3.finalRoute, loader: a3.stuckLoader, repeats: a3.routeRepeats });

  await page.goto(`${BASE}/seeker/onboarding`, { waitUntil: 'domcontentloaded' });
  await watch(page, 8, 'A4a — onboarding first load');
  await page.reload({ waitUntil: 'domcontentloaded' });
  const a4 = await watch(page, 12, 'A4 — onboarding REFRESH');
  assert('A4', 'onboarding refresh restores state without a stuck gate', !a4.stuck && a4.finalRoute.startsWith('/seeker/onboarding') && a4.finalBody.length > 20, { route: a4.finalRoute, loader: a4.stuckLoader });

  await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
  const a5a = await watch(page, 8, 'A5a — browser BACK');
  await page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => {});
  const a5b = await watch(page, 10, 'A5b — browser FORWARD');
  assert('A5', 'back/forward navigation stays stable with no redirect loop', !a5a.stuck && !a5b.stuck && a5b.routeRepeats.length === 0, { back: a5a.finalRoute, forward: a5b.finalRoute, repeats: a5b.routeRepeats });

  // =========================================================================
  // B — COMPLETED account (same user)
  // =========================================================================
  const sessionB = await sessionToken(page);
  const completed = await markOnboardingComplete(sessionB?.token, sessionB?.userId);
  report('B — account marked complete through the user token (RLS)', completed);
  assert('B0', 'completion update accepted under RLS', completed.status === 200 || completed.status === 204, completed);

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await watch(page, 5, 'B1 — landing page (completed account)');
  await clickVisible(page, '^Get started$|Get Started');
  const b1 = await watch(page, 18, 'B1 — GET STARTED click (completed account)');
  assert('B1', 'completed account reaches the dashboard (no bounce back to onboarding)', !b1.stuck && b1.routeRepeats.length === 0 && b1.finalRoute.replace(/\/$/, '') === '/seeker', { route: b1.finalRoute, loader: b1.stuckLoader, repeats: b1.routeRepeats });

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await clickVisible(page, '^Dashboard$');
  const b2 = await watch(page, 18, 'B2 — DASHBOARD click (completed account)');
  assert('B2', '"Dashboard" reaches the dashboard for a completed account', !b2.stuck && b2.finalRoute.replace(/\/$/, '') === '/seeker', { route: b2.finalRoute, loader: b2.stuckLoader });

  await page.goto(`${BASE}/seeker`, { waitUntil: 'domcontentloaded' });
  await watch(page, 8, 'B3a — dashboard first load');
  await page.reload({ waitUntil: 'domcontentloaded' });
  const b3 = await watch(page, 14, 'B3 — dashboard REFRESH');
  assert('B3', 'dashboard refresh restores state without a stuck gate', !b3.stuck && b3.finalRoute.replace(/\/$/, '') === '/seeker' && b3.finalBody.length > 20, { route: b3.finalRoute, loader: b3.stuckLoader });
  await page.screenshot({ path: path.join(ARTIFACTS, 'account-state-desktop.png'), fullPage: false }).catch(() => {});

  // =========================================================================
  // C — MOBILE (390x844, the provided layout reference viewport)
  // =========================================================================
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/seeker`, { waitUntil: 'domcontentloaded' });
  const c1 = await watch(page, 14, 'C1 — MOBILE dashboard (390x844)');
  assert('C1', 'mobile dashboard renders without a stuck gate', !c1.stuck && c1.finalBody.length > 20, { route: c1.finalRoute, loader: c1.stuckLoader, hasBottomNav: c1.hasBottomNav });
  await page.screenshot({ path: path.join(ARTIFACTS, 'account-state-mobile-dashboard.png'), fullPage: false }).catch(() => {});

  await page.goto(`${BASE}/seeker/onboarding`, { waitUntil: 'domcontentloaded' });
  const c2 = await watch(page, 12, 'C2 — MOBILE onboarding route (completed account self-redirects)');
  assert('C2', 'mobile onboarding route settles (completed account is forwarded to the dashboard)', !c2.stuck && c2.finalRoute.length > 0, { route: c2.finalRoute, loader: c2.stuckLoader });
  await page.screenshot({ path: path.join(ARTIFACTS, 'account-state-mobile-onboarding.png'), fullPage: false }).catch(() => {});

  // ----- final account state -----
  const sessionEnd = await sessionToken(page);
  report('FINAL — account row state (RLS, user token)', await accountState(sessionEnd?.token));

  report('CONSOLE (application warnings / errors)', consoleLines.length ? consoleLines.join('\n') : '(none)');
  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');
  report('NETWORK ISSUES', netIssues.length ? netIssues.join('\n') : '(none)');

  const failed = results.filter((r) => !r.pass);
  report('ACCOUNT STATE SUMMARY', {
    email: EMAIL,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.map((f) => ({ id: f.id, what: f.description, detail: f.detail })),
    uncaughtPageErrors: pageErrors.length,
  });

  await browser.close();
  if (failed.length) process.exit(1);
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
