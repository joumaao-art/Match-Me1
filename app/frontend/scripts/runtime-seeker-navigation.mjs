/**
 * Runtime reproduction harness — Job Seeker "Get started" / "Dashboard" hang.
 * =============================================================================
 * The two reported actions both land on the Job Seeker area:
 *
 *   A) Landing page -> hero "Get started" button
 *   B) Landing page -> header "Dashboard" button
 *
 * Both call the same handler, so this harness drives the REAL buttons in the
 * REAL running application and records what happens afterwards:
 *
 *   - every route transition (history.pushState/replaceState instrumentation,
 *     timestamped) so a redirect LOOP is visible as a repeating sequence
 *   - which full-screen gate is on screen at each 400ms sample (`data-loader-id`)
 *   - whether a gate is STUCK (still covering the screen in the last 3 samples)
 *     or merely TRANSIENT (released on its own)
 *   - Supabase REST/Auth traffic with status + duration
 *   - application console warnings ([SignupFlow], [Onboarding], [BootTrace])
 *   - the account's real row state (user profile / seeker profile / onboarding)
 *     read through the user's own token, which also exercises RLS
 *
 * Account modes:
 *   (default)      create a fresh Job Seeker through the real signup UI
 *   --partial      create an AUTH-ONLY user through the Supabase signup API
 *                  (no application rows at all), then sign in through the UI.
 *                  This reproduces a user left partially initialized by an
 *                  earlier broken signup, which is the reported real account.
 *
 * Usage:
 *   node scripts/runtime-seeker-navigation.mjs [--partial]
 *   node scripts/runtime-seeker-navigation.mjs --email a@b.c --password '...'
 *
 * Environment:
 *   CHROME_PATH    - explicit Chromium executable (optional)
 *   REPRO_BASE_URL - overrides the default base URL
 *   REPRO_HEADFUL  - "1" to watch the run in a visible window
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
const PARTIAL = argv.includes('--partial');
const PROVIDED_EMAIL = argOf('--email');
const PASSWORD = argOf('--password') || process.env.REPRO_PASSWORD || 'MatchMe!2026qa';
const EMAIL = PROVIDED_EMAIL || `matchme.nav.${Date.now()}@example.com`;

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
// Reporting helpers
// ---------------------------------------------------------------------------

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

const consoleLines = [];
const pageErrors = [];
const netIssues = [];
const netLog = [];
const started = new Map();

/**
 * Browser-side navigation recorder.
 * Patches the history API BEFORE the app boots so every redirect the router
 * performs is captured with a timestamp and the stack that triggered it.
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
        push({
          at: Date.now(),
          kind,
          from: location.pathname + location.search,
          to: url ? String(url) : location.pathname + location.search,
          count: 1,
        });
      } catch { /* never break navigation for diagnostics */ }
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
    bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 220),
    headings: Array.from(document.querySelectorAll('h1,h2,h3'))
      .map((h) => (h.innerText || '').trim())
      .filter(Boolean)
      .slice(0, 4),
    navLog: (window.__navLog || []).slice(-40),
  };
};

const probe = async (page) => {
  try {
    return await page.evaluate(DOM_PROBE);
  } catch (err) {
    return { at: Date.now(), route: '?', loaderId: null, error: String(err && err.message), navLog: [] };
  }
};

/** Sample the page every 400ms; a gate counts as stuck if it still covers the screen at the end. */
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
    const r = s.route;
    if (routes[routes.length - 1] !== r) routes.push(r);
  }
  const result = {
    label,
    stuck: stuck ? true : false,
    stuckLoader: stuck ? tail[tail.length - 1].loaderId : null,
    gatesSeen: [...new Set(gates.map((g) => g.loaderId))],
    gateSamples: gates.length,
    routeSequence: routes,
    finalRoute: samples[samples.length - 1]?.route,
    finalBody: samples[samples.length - 1]?.bodyText,
    finalHeadings: samples[samples.length - 1]?.headings,
    navLog: samples[samples.length - 1]?.navLog || [],
  };
  report(label, {
    stuck: result.stuck,
    stuckLoader: result.stuckLoader,
    gatesSeen: result.gatesSeen,
    gateSamples: result.gateSamples,
    routeSequence: result.routeSequence,
    finalRoute: result.finalRoute,
    finalBody: result.finalBody,
    finalHeadings: result.finalHeadings,
  });
  report(`${label} — navigation events`, result.navLog);
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

/** Read the account's application rows with the user's own token (also proves RLS access). */
async function accountState(page) {
  return page.evaluate(async () => {
    const raw = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!raw) return { error: 'no-supabase-session-in-localStorage' };
    let session = null;
    try {
      const parsed = JSON.parse(localStorage.getItem(raw));
      session = parsed?.access_token ? parsed : parsed?.state?.session ?? parsed?.state ?? null;
    } catch { /* ignore */ }
    const token = session?.access_token;
    const userId = session?.user?.id || null;
    if (!token) return { error: 'no-access-token', keys: Object.keys(localStorage) };
    const base = session?.user?.aud ? null : null;
    return { userId, token, aud: session?.user?.aud || base };
  }).then(async (info) => {
    if (!info?.token) return info;
    const headers = { apikey: SUPABASE_ANON, Authorization: `Bearer ${info.token}` };
    const q = async (table, select = '*') => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`, { headers });
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text.slice(0, 200); }
      return { table, status: res.status, rows: Array.isArray(body) ? body.length : null, body };
    };
    const out = { userId: info.userId, queries: [] };
    out.queries.push(await q('user_profiles'));
    out.queries.push(await q('job_seeker_profiles'));
    return out;
  }).catch((err) => ({ error: String(err && err.message) }));
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

  console.log(`Base URL  : ${BASE}`);
  console.log(`Browser   : ${CANDIDATES[0]}`);
  console.log(`Mode      : ${PROVIDED_EMAIL ? 'provided account' : PARTIAL ? 'auth-only account (partial init)' : 'fresh signup'}`);
  console.log(`Account   : ${EMAIL}`);

  // ----- auth-only account creation (partial-initialization reproduction) -----
  if (PARTIAL && !PROVIDED_EMAIL) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const body = await res.text();
    report('AUTH-ONLY USER CREATED (no application rows)', { status: res.status, body: body.slice(0, 300) });
  }

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
  page.on('request', (req) => started.set(req, Date.now()));
  page.on('requestfailed', (req) =>
    netIssues.push(`FAILED ${req.method()} ${req.url().slice(0, 140)} :: ${req.failure()?.errorText}`)
  );
  page.on('response', (res) => {
    const url = res.url();
    const req = res.request();
    const ms = started.has(req) ? Date.now() - started.get(req) : null;
    if (url.includes('/auth/v1/') || url.includes('/rest/v1/')) {
      const entry = { status: res.status(), ms, url: url.replace(BASE, '').slice(0, 130) };
      netLog.push(entry);
      if (res.status() >= 400) netIssues.push(`HTTP ${res.status()} ${entry.url}${ms != null ? ` (${ms}ms)` : ''}`);
    }
  });

  // ---------------------------------------------------------------
  // STEP 0 — reach an authenticated Job Seeker
  // ---------------------------------------------------------------
  const steps = {};

  if (PROVIDED_EMAIL || PARTIAL) {
    // Sign in through the real login UI.
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
    steps.login = await watch(page, 14, 'STEP 0 — sign in (partial/existing account)');
  } else {
    // Fresh signup through the real UI.
    await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await clickVisible(page, '^Job Seeker');
    await page.waitForTimeout(900);
    await clickVisible(page, 'sign up with email');
    await page.waitForTimeout(900);
    const emailBox = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailBox.count()) await emailBox.fill(EMAIL).catch(() => {});
    const pwBoxes = page.locator('input[type="password"]');
    const pwCount = await pwBoxes.count();
    for (let i = 0; i < pwCount; i += 1) await pwBoxes.nth(i).fill(PASSWORD).catch(() => {});
    await clickVisible(page, '^Sign Up$|^Register$|^Create account$');
    steps.signup = await watch(page, 10, 'STEP 0 — fresh signup submit');
  }

  const sessionInfo = await page.evaluate(() =>
    Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
  );
  report('STEP 0 — session established', { hasSupabaseSession: sessionInfo, lastRoute: steps.login?.finalRoute || steps.signup?.finalRoute });

  // ---------------------------------------------------------------
  // STEP 1 — landing page -> hero "Get started"
  // ---------------------------------------------------------------
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const landing = await watch(page, 6, 'STEP 1a — authenticated landing page');
  const heroClick = await clickVisible(page, '^Get started$|Get started');
  const getStarted = await watch(page, 20, 'STEP 1b — GET STARTED click (hero button)');

  // ---------------------------------------------------------------
  // STEP 2 — land on the destination, then click the header "Dashboard"
  // ---------------------------------------------------------------
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const headerClick = await clickVisible(page, '^Dashboard$');
  const dashboard = await watch(page, 20, 'STEP 2 — DASHBOARD click (header button)');

  // ---------------------------------------------------------------
  // STEP 3 — direct /seeker navigation (isolates the route guard)
  // ---------------------------------------------------------------
  await page.goto(`${BASE}/seeker`, { waitUntil: 'domcontentloaded' });
  const directSeeker = await watch(page, 20, 'STEP 3 — direct /seeker navigation');

  // ---------------------------------------------------------------
  // STEP 4 — direct /seeker/onboarding navigation
  // ---------------------------------------------------------------
  await page.goto(`${BASE}/seeker/onboarding`, { waitUntil: 'domcontentloaded' });
  const directOnboarding = await watch(page, 20, 'STEP 4 — direct /seeker/onboarding navigation');

  // ---------------------------------------------------------------
  // STEP 5 — account row state (through the user's own token -> RLS)
  // ---------------------------------------------------------------
  const rows = await accountState(page);
  report('STEP 5 — account data state (RLS-checked, user token)', rows);
  await page.screenshot({ path: path.join(ARTIFACTS, 'nav-final.png') }).catch(() => {});

  report('CONSOLE (application warnings / errors)', consoleLines.length ? consoleLines.join('\n') : '(none)');
  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');
  report('NETWORK ISSUES', netIssues.length ? netIssues.join('\n') : '(none)');
  report('SUPABASE REQUESTS', netLog.slice(0, 60));

  const verdict = (r) => (!r ? 'N/A' : r.stuck ? `STUCK on ${r.stuckLoader}` : `OK (final ${r.finalRoute})`);
  report('NAVIGATION HARNESS SUMMARY', {
    mode: PROVIDED_EMAIL ? 'provided' : PARTIAL ? 'partial-init' : 'fresh',
    email: EMAIL,
    login_or_signup: verdict(steps.login || steps.signup),
    heroGetStarted: verdict(getStarted),
    headerDashboard: verdict(dashboard),
    directSeeker: verdict(directSeeker),
    directOnboarding: verdict(directOnboarding),
    getStartedClicked: heroClick,
    dashboardClicked: headerClick,
  });

  await browser.close();
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
