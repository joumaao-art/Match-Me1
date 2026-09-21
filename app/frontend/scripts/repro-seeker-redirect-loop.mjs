/**
 * Reproduction: Job Seeker redirect loop -> permanent full-screen loading.
 * ===========================================================================
 * REPORTED SYMPTOM
 *   An authenticated Job Seeker clicks "Get started" (hero) or "Dashboard"
 *   (header). Both call one handler that navigates to /seeker. The screen then
 *   shows a full-screen spinner and NEVER settles.
 *
 * HYPOTHESIS UNDER TEST
 *   Two components independently own the same decision and read DIFFERENT
 *   sources of truth, so they bounce the user back and forth forever:
 *
 *     JobSeeker (route guard)  : server `user_profiles.onboarding_completed`
 *     JobSeekerOnboarding      : local persisted onboarding mirror (`completed`)
 *
 *   The mirror can say "completed" while the server flag was never written —
 *   exactly what the earlier broken signup left behind, because
 *   `update({onboarding_completed:true}).eq(...)` matches ZERO rows when the
 *   profile row is missing, and PostgREST reports that as SUCCESS.
 *
 *     /seeker             -> guard: server says incomplete -> go to onboarding
 *     /seeker/onboarding  -> mirror says complete  -> back to /seeker
 *     ... forever, with a full-screen loader on every hop.
 *
 * FIXTURE (built through the app's own APIs, RLS enforced the whole time)
 *   1. auth-only user via the Supabase signup API  -> real session
 *   2. base profile row via REST with the user's own token -> role job_seeker
 *      (proves the RLS INSERT policy works)
 *   3. NO job_seeker_profiles row, NO onboarding_completed flag  <- partial init
 *   4. local onboarding mirror seeded as `completed: true`        <- stale local
 *
 * It fails while the defect exists and passes once ONE authority owns the Job
 * Seeker destination and repairs the account before it routes.
 *
 * Usage:
 *   node scripts/repro-seeker-redirect-loop.mjs
 *   node scripts/repro-seeker-redirect-loop.mjs --email a@b.c --password '...'
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
const PROVIDED_EMAIL = argOf('--email');
const PASSWORD = argOf('--password') || process.env.REPRO_PASSWORD || 'MatchMe!2026qa';
const EMAIL = PROVIDED_EMAIL || `matchme.loop.${Date.now()}@example.com`;

/** Read the configured Supabase project from the app's own .env (no duplicated secrets). */
const envText = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const envValue = (key) => {
  const line = envText.split('\n').find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf('=') + 1).trim() : undefined;
};
const SUPABASE_URL = process.env.SUPABASE_URL || envValue('VITE_SUPABASE_URL') || '';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || envValue('VITE_SUPABASE_ANON_KEY') || '';
const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0];

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean).filter((p) => fs.existsSync(p));

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

const pageErrors = [];
const netIssues = [];

const NAV_RECORDER = () => {
  if (window.__navLog) return;
  window.__navLog = [];
  const wrap = (kind) => {
    const original = history[kind];
    history[kind] = function patched(state, title, url) {
      try {
        window.__navLog.push({
          at: Date.now(),
          kind,
          from: location.pathname,
          to: url ? String(url).split('?')[0] : location.pathname,
        });
        if (window.__navLog.length > 500) window.__navLog.shift();
      } catch { /* diagnostics must never break navigation */ }
      return original.apply(this, arguments);
    };
  };
  wrap('pushState');
  wrap('replaceState');
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
    route: location.pathname,
    loaderId: identified ? identified.getAttribute('data-loader-id') : blocking ? 'unidentified-fullscreen-spinner' : null,
    bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    navLog: (window.__navLog || []).slice(-80),
  };
};

async function watch(page, seconds, label) {
  const samples = [];
  const steps = Math.round((seconds * 1000) / 400);
  for (let i = 0; i < steps; i += 1) {
    await page.waitForTimeout(400);
    samples.push(await page.evaluate(DOM_PROBE).catch(() => ({ route: '?', loaderId: null, navLog: [] })));
  }
  const last = samples[samples.length - 1];
  const transitions = [];
  for (const s of samples) {
    if (transitions[transitions.length - 1] !== s.route) transitions.push(s.route);
  }
  const bounces = transitions.filter((r, i) => i > 0 && r !== transitions[i - 1]).length;
  const unique = [...new Set(transitions)];
  const loop = bounces >= 4 && unique.length <= 3;
  const result = {
    label,
    loop,
    bounces,
    transitions,
    finalRoute: last.route,
    finalLoader: last.loaderId,
    gatesSeen: [...new Set(samples.filter((s) => s.loaderId).map((s) => s.loaderId))],
    gateSamples: samples.filter((s) => s.loaderId).length,
    navLog: last.navLog,
  };
  report(label, {
    loop,
    routeTransitions: transitions,
    bounceCount: bounces,
    gateSamples: result.gateSamples,
    gatesSeen: result.gatesSeen,
    finalRoute: result.finalRoute,
    finalLoader: result.finalLoader,
    finalBody: last.bodyText,
  });
  if (loop) report(`${label} — navigation loop trace`, result.navLog.slice(-24));
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
      return { clicked: true, label };
    }
  }
  return { clicked: false };
}

/** Read the account's rows with the user's own token (RLS enforced). */
async function accountState(page) {
  const session = await page.evaluate(() => {
    const raw = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(localStorage.getItem(raw));
      const s = parsed?.access_token ? parsed : parsed?.state?.session ?? parsed?.state ?? null;
      return s?.access_token ? { token: s.access_token, userId: s?.user?.id || null } : null;
    } catch {
      return null;
    }
  });
  if (!session?.token) return { error: 'no-supabase-session' };
  const headers = { apikey: SUPABASE_ANON, Authorization: `Bearer ${session.token}` };
  const q = async (table) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text.slice(0, 160); }
    return {
      table,
      status: res.status,
      rows: Array.isArray(body) ? body.length : null,
      onboardingCompleted: Array.isArray(body) ? body[0]?.onboarding_completed ?? null : null,
    };
  };
  return {
    userId: session.userId,
    user_profiles: await q('user_profiles'),
    job_seeker_profiles: await q('job_seeker_profiles'),
  };
}

const main = async () => {
  if (!CANDIDATES.length) {
    console.error('No Chromium executable found. Set CHROME_PATH.');
    process.exit(2);
  }
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('Supabase configuration missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
    process.exit(2);
  }
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  console.log(`Base URL : ${BASE}`);
  console.log(`Browser  : ${CANDIDATES[0]}`);
  console.log(`Account  : ${EMAIL}`);

  // --- FIXTURE 1: auth-only user -> real session ------------------------------
  let session = null;
  if (!PROVIDED_EMAIL) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    session = await res.json().catch(() => null);
    report('FIXTURE 1 — auth-only user created', {
      status: res.status,
      hasAccessToken: !!session?.access_token,
      userId: session?.user?.id,
    });
    if (!session?.access_token) {
      console.error('Could not create a session; aborting.');
      process.exit(2);
    }
  }

  // --- FIXTURE 2: base profile row via REST with the user's own token ---------
  // Deliberately NOT creating job_seeker_profiles and NOT setting
  // onboarding_completed: this is the partially initialized account state.
  if (session?.access_token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: session.user.id, role: 'job_seeker' }),
    });
    const text = await res.text();
    report('FIXTURE 2 — base profile row inserted with the user token (RLS)', {
      status: res.status,
      response: text.slice(0, 200),
      note: 'job_seeker_profiles intentionally absent, onboarding_completed intentionally false',
    });
  }

  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: process.env.REPRO_HEADFUL !== '1',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });

  // --- FIXTURE 3/4: seed the real session + a stale "completed" local mirror --
  if (session?.access_token) {
    const stored = JSON.stringify({
      access_token: session.access_token,
      token_type: session.token_type || 'bearer',
      expires_in: session.expires_in || 3600,
      expires_at: Math.floor(Date.now() / 1000) + (session.expires_in || 3600),
      refresh_token: session.refresh_token,
      user: session.user,
    });
    await context.addInitScript(
      ({ key, value }) => {
        try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
      },
      { key: `sb-${PROJECT_REF}-auth-token`, value: stored }
    );
  }
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'matchme-onboarding',
        JSON.stringify({
          state: {
            userId: null,
            state: {
              version: '1.0',
              startedAt: '2026-01-01T00:00:00.000Z',
              currentStep: 'tutorial',
              steps: {
                welcome: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
                basics: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
                birthday: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
                location: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
                target_countries: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
                preferences: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
                rating: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
                tutorial: { status: 'done', at: '2026-01-01T00:00:00.000Z' },
              },
              draft: { full_name: 'Recovered Seeker', skills: ['React', 'TypeScript'], plan: 'seeker-free' },
              completed: true,
            },
          },
          version: 0,
        })
      );
    } catch { /* ignore */ }
  });
  await context.addInitScript(NAV_RECORDER);

  const page = await context.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    if (!req.url().includes('/api/config')) netIssues.push(`FAILED ${req.method()} ${req.url().slice(0, 120)}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('/api/config')) {
      netIssues.push(`HTTP ${res.status()} ${res.url().slice(0, 120)}`);
    }
  });

  // --- TEST 1: the landing page as a signed-in Job Seeker --------------------
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const landing = await watch(page, 6, 'TEST 1 — signed-in landing page');

  // --- TEST 2: hero "Get started" (reported action A) ------------------------
  const heroClick = await clickVisible(page, '^Get started$|Get started');
  const getStarted = await watch(page, 14, 'TEST 2 — "Get started" click');

  // --- TEST 3: header "Dashboard" (reported action B) -----------------------
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const headerClick = await clickVisible(page, '^Dashboard$');
  const dashboard = await watch(page, 14, 'TEST 3 — "Dashboard" click');

  // --- TEST 4/5: the two destinations directly ------------------------------
  await page.goto(`${BASE}/seeker`, { waitUntil: 'domcontentloaded' });
  const directSeeker = await watch(page, 14, 'TEST 4 — direct /seeker');

  await page.goto(`${BASE}/seeker/onboarding`, { waitUntil: 'domcontentloaded' });
  const directOnboarding = await watch(page, 14, 'TEST 5 — direct /seeker/onboarding');

  // --- Account rows through the user's own token ----------------------------
  const rows = await accountState(page);
  report('ACCOUNT DATA STATE (user token -> RLS)', rows);
  await page.screenshot({ path: path.join(ARTIFACTS, 'loop-repro-final.png') }).catch(() => {});

  report('UNCAUGHT PAGE ERRORS', pageErrors.length ? pageErrors.join('\n') : '(none)');
  report('NETWORK ISSUES (excluding /api/config fallback)', netIssues.length ? netIssues.join('\n') : '(none)');

  const cases = { landing, getStarted, dashboard, directSeeker, directOnboarding };
  const loops = Object.entries(cases).filter(([, r]) => r.loop);
  report('REDIRECT LOOP VERDICT', {
    perAction: Object.fromEntries(Object.entries(cases).map(([k, r]) => [k, r.loop ? 'LOOP' : 'NO LOOP'])),
    repeatedSequences: loops.map(([k, r]) => ({ action: k, transitions: r.transitions })),
    loadersDuringLoop: [...new Set(loops.flatMap(([, r]) => r.gatesSeen))],
    verdict: loops.length
      ? 'REPRODUCED — infinite loading is a redirect loop between /seeker and /seeker/onboarding (two owners reading different sources of truth)'
      : 'NOT REPRODUCED',
  });
  report('CLICK TARGETS', { heroGetStarted: heroClick, headerDashboard: headerClick });

  await browser.close();
  process.exit(loops.length ? 1 : 0);
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(2);
});
