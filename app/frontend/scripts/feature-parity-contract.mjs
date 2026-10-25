import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const read=path=>readFile(path,'utf8');
const manifest=JSON.parse(await read('parity-acceptance.json'));
assert.deepEqual(manifest.viewports.mobile,[320,360,375,390,412]);
assert.deepEqual(manifest.viewports.desktop,[1024,1280,1440,1920]);
assert.deepEqual(manifest.languages,['en','ar']);
assert.ok(['PASS','FAIL','BLOCKED'].includes(manifest.browserAcceptance));
for(const feature of manifest.features){assert.ok(feature.mobile&&feature.desktop&&feature.contract,`Missing contract for ${feature.id}`);}
const [route,history,onboarding,credits,desktop,privacy,invites,standard]=await Promise.all([
 read('src/pages/JobSeeker.tsx'),read('src/lib/canonical-profile.ts'),read('src/lib/mobile-onboarding.ts'),read('src/components/seeker/SeekerCreditPanel.tsx'),read('src/components/seeker/DesktopAccountFeatures.tsx'),read('src/components/shared/CandidateDiscoverability.tsx'),read('src/components/shared/SeekerInvitations.tsx'),read(manifest.standard)
]);
assert.ok(route.includes('hidden md:flex w-64'));
assert.ok(route.includes('<MobileBottomNav'));
assert.ok(desktop.includes('max-w-2xl'));
assert.ok(history.includes("rpc('save_seeker_history'"));
assert.ok(history.includes('profileBases.get(base)'));
assert.ok(history.includes("'portfolio'"));
assert.ok(onboarding.includes("rpc('load_seeker_onboarding')"));
assert.ok(onboarding.includes('snapshot.clientFlowId'));
assert.ok(credits.includes("key={uid ?? 'signed-out'}"));
assert.ok(credits.includes('request !== historyRequest.current'));
assert.ok(!privacy.includes('toast.success'));
assert.ok(!invites.includes('TechCorp Saudi'));
assert.ok(standard.includes('do not claim control over Atoms internal agent behavior'));
const editor = await read('src/components/seeker/ProfessionalProfile.tsx');
assert.ok(history.includes('const raw = profileBases.get(base);'));
assert.ok(history.includes('profileBases.has(profile)'));
assert.ok(editor.includes('countries.length > 0 && profileReady(profile)'));
assert.ok(editor.includes('disabled={!ready||saver.busy}'));
assert.ok(editor.includes('if (!busy && (!dirty || window.confirm'));
assert.ok(editor.includes('<fieldset disabled={busy} aria-busy={busy}'));
assert.equal((editor.match(/<RecordDialog open=\{open\}[^\n]*busy=\{saver.busy\}/g) || []).length, 4);
assert.ok(editor.includes('alive.current && useAuthStore.getState().userId === owner'));
console.log('PASS parity manifest, shared contract wiring, independent shells, profile readiness/save guards and honest dependency boundaries.');
for(const script of ['mobile-onboarding-contract.mjs','savings-preferences-contract.mjs','mobile-profile-contract.mjs','mobile-dashboard-contract.mjs','mobile-swipe-contract.mjs','seeker-navigation-contract.mjs','via-premium-contract.mjs']){
 const result=spawnSync(process.execPath,[`scripts/${script}`],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
console.log('PASS repository parity contracts. Signed-in browser, live payment and visual PDF acceptance are separate mandatory evidence.');
