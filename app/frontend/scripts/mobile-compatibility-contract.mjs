import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
let checks = 0;
function test(name, run) { run(); checks++; console.log(`PASS ${name}`); }
try {
  const { mobileExperience, isSeekerExperiencePath } = await server.ssrLoadModule('/src/lib/responsive-experience.ts');
  test('desktop entry retains desktop', () => assert.equal(mobileExperience(false, false, false, true), false));
  test('native expanded window retains mobile', () => assert.equal(mobileExperience(false, true, false, true), true));
  test('compact journey retains mobile after unfolding', () => assert.equal(mobileExperience(false, false, true, true), true));
  test('compact windows retain mobile', () => assert.equal(mobileExperience(true, false, false, true), true));
  test('Company/Admin expanded windows are not forced mobile', () => assert.equal(mobileExperience(false, true, true, false), false));
  for (const path of ['/seeker','/seeker/onboarding','/jobs/123','/messages','/subscription','/auth/callback']) {
    test(`candidate route ${path}`, () => assert.equal(isSeekerExperiencePath(path, ''), true));
  }
  for (const path of ['/company','/admin','/company/jobs','/seeker-other']) {
    test(`excluded route ${path}`, () => assert.equal(isSeekerExperiencePath(path, ''), false));
  }
  test('Company authentication is excluded', () => assert.equal(isSeekerExperiencePath('/auth', '?role=company'), false));
  const hook = await readFile('src/hooks/use-mobile.tsx', 'utf8');
  test('resize hook has no actions, reloads or storage writes', () => assert.ok(!/recordJobAction|location\.reload|setItem|signOut/.test(hook)));
  const nav = await readFile('src/components/shared/MobileBottomNav.tsx', 'utf8');
  test('navigation visibility uses experience rather than CSS width', () => { assert.ok(nav.includes('if (!mobile) return null')); assert.ok(!nav.includes('md:hidden')); });
  const seeker = await readFile('src/pages/JobSeeker.tsx', 'utf8');
  test('desktop sidebar and bottom clearance follow retained experience', () => { assert.ok(seeker.includes("isMobile ? 'hidden' : 'hidden md:flex'")); assert.ok(seeker.includes("${isMobile ? '' : ' md:pb-0'}")); });
  const swipe = await readFile('src/components/seeker/MobileSwipePage.tsx', 'utf8');
  const dashboard = await readFile('src/components/shared/MobileDashboard.tsx', 'utf8');
  test('expanded mobile content has bounded containers', () => { assert.ok(swipe.includes('max-w-3xl mx-auto')); assert.ok(dashboard.includes('max-w-3xl mx-auto')); });
  console.log(`${checks} web resize policy/source checks passed. No native device execution.`);
} finally { await server.close(); }
