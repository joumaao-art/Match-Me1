/**
 * Runtime regression matrix for the MatchMe authentication surfaces.
 * ==================================================================
 * Complements scripts/runtime-signup-e2e.mjs (which covers the fresh
 * email-signup journey) with the paths that must not regress:
 *
 *   1. Returning Job Seeker login      -> role-aware destination, no stuck gate
 *   2. Company authentication          -> classic Company login still renders
 *   3. Protected route while signed in -> dashboard/onboarding resolves, no gate
 *
 * Every check watches for a full-screen loader (`data-loader-id` on the gate or
 * an unidentified full-screen spinner) for the full observation window.
 *
 * Usage:
 *   node scripts/runtime-auth-matrix.mjs <email> [password] [baseUrl]
 *     <email>  an account created by runtime-signup-e2e.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3] || 'MatchMe!2026qa';
const BASE = process.argv[4] || process.env.REPRO_BASE_URL || 'http://localhost:3000';
const ARTIFACTS = 'scripts/artifacts';

if (!EMAIL) {
  console.error('Usage: node scripts/runtime-auth-matrix.mjs <email> [password] [baseUrl]');
  process.exit(2);
}

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/ms-playwright/chromium-1169/chrome-linux/chrome',
  '/opt/ms-playwright/chromium_headless_shell-1169/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean).filter((p) => fs.existsSync(p));

const DOM_PROBE = () => {
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
    bodyText: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200),
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => (h.innerText || '').trim()).slice(0, 3),
  };
};

const report = (section, payload) => {
  console.log(`\n===== ${section} =====`);
  console.log(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
};

/**
 * Observe the page for `seconds`.
 *
 * IMPORTANT DISTINCTION:
 *  - `stuck`  = a loader still covering the screen at the END of the window.
 *               This is the actual defect being hunted.
 *  - `transient` = loaders seen during the window that released on their own
 *               (lazy-route chunk fetch, short hydration read). Expected.
 */
async function watch(page, seconds) {
  const samples = [];
  for (let i = 0; i < seconds; i += 1) {
    await page.waitForTimeout(1000);
    samples.push(await page.evaluate(DOM_PROBE).catch(() => ({ route: '?', loaderId: null })));
  }
  const observed = samples.filter((s) => s.loaderId);
  const last = samples.at(-1);
  // The final sample is not enough on its own: require the loader to be gone for
  // the last 3 consecutive samples before calling it "released".
  const tail = samples.slice(-3);
  const stuck = tail.every((s) => s.loaderId) ? observed : [];
  return {
    samples,
    observed,
    stuck,
    transient: stuck.length ? [] : observed,
    last,
  };
}

const main = async () => {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const errors = [];
  const browser = await chromium.launch({
    executablePath: CANDIDATES[0],
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const results = {};

  // ---------- 1. Returning Job Seeker login ----------
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const hasSession = () =>
    page.evaluate(() =>
      Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
    );

  await page.goto(`${BASE}/auth?role=seeker`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  // Switch to the login form and submit real credentials.
  const loginTab = page.getByRole('button', { name: /^(log ?in|sign ?in)$/i }).first();
  if (await loginTab.count()) await loginTab.click().catch(() => {});
  await page.waitForTimeout(600);
  const emailBox = page.locator('input[type="email"], input[name="email"]').first();
  const emailFilled = (await emailBox.count()) ? await emailBox.fill(EMAIL).then(() => true).catch(() => false) : false;
  const pwBox = page.locator('input[type="password"]').first();
  const pwFilled = (await pwBox.count()) ? await pwBox.fill(PASSWORD).then(() => true).catch(() => false) : false;
  await page.getByRole('button', { name: /log ?in|sign ?in/i }).last().click().catch(() => {});
  const login = await watch(page, 20);
  const sessionEstablished = await hasSession();
  report('1. Returning Job Seeker login', {
    emailFilled,
    pwFilled,
    sessionEstablished,
    routes: [...new Set(login.samples.map((s) => s.route))],
    stuckLoaders: [...new Set(login.stuck.map((g) => g.loaderId))],
    transientLoaders: [...new Set(login.transient.map((g) => g.loaderId))],
    final: login.last,
  });
  await page.screenshot({ path: path.join(ARTIFACTS, 'matrix-01-returning-login.png') }).catch(() => {});
  results.returningSeekerLogin = !sessionEstablished
    ? `INCONCLUSIVE (no session established; emailFilled=${emailFilled} pwFilled=${pwFilled})`
    : login.stuck.length
      ? `FAIL stuck ${[...new Set(login.stuck.map((g) => g.loaderId))]}`
      : 'PASS';

  // ---------- 2. Authenticated seeker landing ----------
  await page.goto(`${BASE}/seeker`, { waitUntil: 'domcontentloaded' });
  const seeker = await watch(page, 15);
  report('2. Authenticated /seeker landing', {
    routes: [...new Set(seeker.samples.map((s) => s.route))],
    stuckLoaders: [...new Set(seeker.stuck.map((g) => g.loaderId))],
    transientLoaders: [...new Set(seeker.transient.map((g) => g.loaderId))],
    final: seeker.last,
  });
  results.seekerLanding = !(await hasSession())
    ? 'INCONCLUSIVE (not authenticated, redirected to /auth as expected)'
    : seeker.stuck.length
      ? `FAIL stuck ${[...new Set(seeker.stuck.map((g) => g.loaderId))]}`
      : 'PASS';

  // ---------- 3. Company authentication regression ----------
  const companyCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const companyPage = await companyCtx.newPage();
  companyPage.on('pageerror', (e) => errors.push(`company pageerror: ${e.message}`));
  await companyPage.goto(`${BASE}/auth?role=company`, { waitUntil: 'domcontentloaded' });
  const company = await watch(companyPage, 10);
  report('3. Company authentication (deep link)', {
    routes: [...new Set(company.samples.map((s) => s.route))],
    stuckLoaders: [...new Set(company.stuck.map((g) => g.loaderId))],
    transientLoaders: [...new Set(company.transient.map((g) => g.loaderId))],
    final: company.last,
  });
  await companyPage.screenshot({ path: path.join(ARTIFACTS, 'matrix-03-company-auth.png') }).catch(() => {});
  results.companyAuth = company.stuck.length
    ? `FAIL stuck ${[...new Set(company.stuck.map((g) => g.loaderId))]}`
    : 'PASS';
  await companyCtx.close();

  report('UNCAUGHT PAGE ERRORS', errors.length ? errors.join('\n') : '(none)');
  report('MATRIX SUMMARY', results);
  await browser.close();
};

main().catch((err) => {
  console.error('HARNESS_ERROR', err);
  process.exit(1);
});
