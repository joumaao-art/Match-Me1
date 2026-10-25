import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

let count = 0;
const test = (name, check) => { check(); count++; console.log(`PASS ${name}`); };
const source = path => readFile(path, 'utf8');
const baseline = JSON.parse(await source('scripts/artifacts/desktop-parity-baseline.json'));
for (const [path, expected] of Object.entries(baseline)) {
  const actual = createHash('sha256').update(await readFile(path)).digest('hex');
  test(`protected source unchanged: ${path}`, () => assert.equal(actual, expected));
}
const route = await source('src/pages/JobSeeker.tsx');
const app = await source('src/App.tsx');
const nav = await source('src/components/seeker/DesktopSeekerNavigation.tsx');
const swipe = await source('src/components/seeker/DesktopSwipePage.tsx');
const dashboard = await source('src/components/seeker/DesktopDashboard.tsx');
const profile = await source('src/components/seeker/DesktopProfileAccount.tsx');
const preferences = await source('src/components/seeker/DesktopPreferences.tsx');
const onboarding = await source('src/pages/DesktopSeekerOnboarding.tsx');
const subscription = await source('src/pages/Subscription.tsx');
const logout = await source('src/components/seeker/DesktopProfileLogout.tsx');
const skills = await source('src/components/seeker/DesktopSkills.tsx');
test('exactly three desktop primary destinations', () => assert.deepEqual([...nav.matchAll(/\{id:'([^']+)',Icon:/g)].map(m=>m[1]), ['swipe','dashboard','profile']));
test('desktop sidebar and mobile bottom navigation remain separate', () => { assert.ok(route.includes('<DesktopSeekerNavigation')); assert.ok(route.includes('<MobileBottomNav')); });
test('mobile primary routing preserved', () => { for (const text of ['if(isMobile)return <MobileSwipePage','if (isMobile && MOBILE_ACCOUNT_SECTIONS.includes(activeTab))','return <MobileDashboard']) assert.ok(route.includes(text)); });
test('desktop Swipe reuses canonical handlers', () => { assert.ok(route.includes('if(!isMobile)return <DesktopSwipePage')); for (const text of ['recordJobAction(currentJob.id,dir)',"recordJobAction(currentJob.id,'save')","recordJobAction(lastPass,'undo')",'rankEligibleVacancies']) assert.ok(route.includes(text)); });
test('completion indicator is informational', () => { const indicator=swipe.slice(swipe.indexOf('<div data-testid="desktop-swipe-profile-completion"'),swipe.indexOf('{loading||error')); assert.ok(indicator.includes('<Progress')); assert.ok(!/onClick|tabIndex|role="button"/.test(indicator)); });
test('desktop Swipe has explicit actions and safe credit/eligibility gates', () => { for (const text of ['props.onSave','props.onUndo','props.onShare',"decide('left')","decide('right')",'balance===null','balance===0','completion.percentage!==100','DesktopCreditsDialog']) assert.ok(swipe.includes(text)); });
test('Dashboard canonical categories, recent data, details and search', () => { for (const text of ["category:'all'","category:'submitted'","category:'skipped'","category:'saved'","useSeekerDashboard('all','','',false,true)",'APPLICATION_STATUSES','status_history','state.searching','state.setPage','MessageSquare']) assert.ok(dashboard.includes(text)); });
test('Dashboard native desktop rows and category bookmarks', () => { assert.ok(dashboard.includes('grid-cols-[2fr_1fr_1fr_auto]')); assert.ok(dashboard.includes("params.get('category')")); });
test('account/CV/PDF use same canonical services', () => { for (const text of ['loadAccount(uid)','cvMetadata(account)','cvLink(account.uid','profileService.uploadCV','generateResume(await loadResumeData(uid)','DesktopProfileLogout']) assert.ok(profile.includes(text)); });
test('preference fields reuse mobile validation and conflict-safe persistence', () => { for (const text of ['canAddPreference','preferenceSelectionCount','visiblePreferencePatch','preferencesService.save','PreferenceConflict','MOBILE_WORK_TYPES','WORKING_STYLES','SENIORITY','CountryMultiSelector']) assert.ok(preferences.includes(text)); });
test('skills searchable and owner persisted', () => { for (const text of ['SkillPicker','SKILL_TAXONOMY','requireAccount','skills','onUpdated']) assert.ok(skills.includes(text)); });
test('onboarding uses authoritative services and desktop date inputs', () => { for (const text of ['loadMobile(uid','persistMobile(uid','validateMobile(','DesktopDateControl','max-w-4xl','grid-cols-3']) assert.ok(onboarding.includes(text)); assert.ok(app.includes("<MobileOnboarding key={userId ?? 'guest'} /> : <DesktopSeekerOnboarding")); });
test('only Job Seeker subscription redirects to canonical desktop shell', () => assert.ok(subscription.includes("role==='job_seeker'?(mobile?<ViaPremiumPage/>:<DesktopSeekerSubscription/>):<DesktopSubscription/>")));
test('desktop logout confirms and reuses cache-safe shared signout', () => { for (const text of ['AlertDialogCancel','if(lock.current)return','logoutMobileSeeker(uid','queryClient.clear()',"window.location.replace('/')"]) assert.ok(logout.includes(text)); });
console.log(`${count} desktop parity source contracts passed; signed-in workflows and visual acceptance are not established by these checks.`);
