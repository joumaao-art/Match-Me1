/**
 * Probe v2 — replicate the app's EXACT signup transaction order and prove
 * which transition breaks. Read-only except for throwaway test accounts.
 *
 * Usage: set -a; . ./.env; set +a; node scripts/probe-signup-flow.mjs
 */

const URL_BASE = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
if (!URL_BASE || !ANON) { console.error('missing env'); process.exit(2); }

const results = [];
const record = (label, ok, detail) => {
  results.push({ label, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

async function req(path, { method = 'GET', body, token, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${URL_BASE}${path}`, {
      method,
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${token || ANON}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* keep raw */ }
    return { status: res.status, json, text };
  } catch (err) {
    return { status: 0, error: `${err?.name}: ${err?.message}` };
  } finally {
    clearTimeout(timer);
  }
}

const email = `probe2.seeker.${Date.now()}@matchme-probe.dev`;
const password = 'Probe!Passw0rd2026';

console.log('=== MatchMe signup pipeline probe v2 ===\n');

// ---------- Step 0: provider pre-flight cache source ----------
console.log('[0] provider availability pre-flight');
{
  const s = await req('/auth/v1/settings');
  const ext = s.json?.external || {};
  record('settings endpoint reachable', s.status === 200, `status=${s.status}`);
  record('google enabled', ext.google === true, `google=${ext.google}`);
  record('apple enabled', ext.apple === true, `apple=${ext.apple}`);
  record('phone enabled', ext.phone === true, `phone=${ext.phone}`);
  record('email enabled', ext.email === true, `email=${ext.email}`);
  record('signup not disabled', s.json?.disable_signup === false, `disable_signup=${s.json?.disable_signup}`);
}

// ---------- Step 1: authenticate (email; the only enabled provider) ----------
console.log('\n[1] authenticate');
const su = await req('/auth/v1/signup', {
  method: 'POST',
  body: { email, password, data: { role: 'job_seeker' } },
});
const token = su.json?.access_token || su.json?.session?.access_token;
const userId = su.json?.user?.id || su.json?.id;
record('signup returns 200', su.status === 200, `status=${su.status}`);
record('session immediately available', !!token, token ? 'session issued' : 'no session');

if (!token || !userId) {
  console.log('\nCannot continue without a session. Aborting.');
  process.exit(1);
}

// ---------- Step 2: idempotent identity creation ----------
console.log('\n[2] ensureJobSeekerIdentity (user_profiles + job_seeker_profiles)');
const upInsert = await req('/rest/v1/user_profiles', {
  method: 'POST',
  token,
  headers: { Prefer: 'return=representation' },
  body: { user_id: userId, role: 'job_seeker', onboarding_completed: false },
});
record('user_profiles insert', upInsert.status === 201, `status=${upInsert.status}`);

// Second run (retry / re-login) — must not throw an unrecoverable error.
const upUpsert = await req('/rest/v1/user_profiles?on_conflict=user_id', {
  method: 'POST',
  token,
  headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  body: { user_id: userId, role: 'job_seeker' },
});
record('user_profiles idempotent re-run (on_conflict=user_id)', upUpsert.status === 200 || upUpsert.status === 201, `status=${upUpsert.status}`);

const spInsert = await req('/rest/v1/job_seeker_profiles', {
  method: 'POST',
  token,
  headers: { Prefer: 'return=representation' },
  body: { user_id: userId, email },
});
record('job_seeker_profiles insert', spInsert.status === 201, `status=${spInsert.status}`);

// ---------- Step 3: THE SUSPECT — how the app currently upserts ----------
console.log('\n[3] onboarding step persistence (current app behaviour)');
// supabase-js .upsert(data) with no onConflict option sends merge-duplicates
// with the PRIMARY KEY as the conflict target (no on_conflict query param).
const appStyleUpsert = await req('/rest/v1/job_seeker_profiles', {
  method: 'POST',
  token,
  headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  body: { user_id: userId, full_name: 'Probe Seeker', skills: ['React'], headline: 'Engineer' },
});
const appStyleOk = appStyleUpsert.status === 200 || appStyleUpsert.status === 201;
record('app-style upsert (no on_conflict) persists step data', appStyleOk,
  `status=${appStyleUpsert.status} ${appStyleUpsert.json?.code || ''} ${appStyleUpsert.json?.message || ''}`);

// Did the data actually land?
const afterAppStyle = await req(`/rest/v1/job_seeker_profiles?user_id=eq.${userId}&select=full_name,skills,headline`, { token });
const landed = afterAppStyle.json?.[0]?.full_name;
record('step data visible after app-style upsert', landed === 'Probe Seeker', `full_name=${landed ?? 'null'}`);

// ---------- Step 4: the corrected upsert ----------
console.log('\n[4] corrected upsert (on_conflict=user_id)');
const fixed = await req('/rest/v1/job_seeker_profiles?on_conflict=user_id', {
  method: 'POST',
  token,
  headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
  body: { user_id: userId, full_name: 'Probe Seeker Fixed', skills: ['React', 'TypeScript'], headline: 'Engineer', city: 'Riyadh', country: 'SA' },
});
const fixedOk = fixed.status === 200 || fixed.status === 201;
record('corrected upsert succeeds', fixedOk, `status=${fixed.status} ${fixed.json?.code || ''}`);
const afterFixed = await req(`/rest/v1/job_seeker_profiles?user_id=eq.${userId}&select=full_name,skills,city,country,plan`, { token });
record('corrected upsert persisted fields',
  afterFixed.json?.[0]?.full_name === 'Probe Seeker Fixed' && afterFixed.json?.[0]?.city === 'Riyadh',
  JSON.stringify(afterFixed.json?.[0]));

// ---------- Step 5: onboarding state sync + analytics + completion ----------
console.log('\n[5] onboarding state, analytics, completion');
const stateSync = await req(`/rest/v1/user_profiles?user_id=eq.${userId}`, {
  method: 'PATCH',
  token,
  headers: { Prefer: 'return=representation' },
  body: { onboarding_state: { version: '1.0', currentStep: 'resume', steps: { welcome: { status: 'done' } }, completed: false } },
});
record('onboarding_state sync (update)', stateSync.status === 200, `status=${stateSync.status}`);

const evt = await req('/rest/v1/onboarding_events', {
  method: 'POST',
  token,
  headers: { Prefer: 'return=representation' },
  body: { user_id: userId, event_name: 'step_completed', step_id: 'welcome', group_id: 'profile', metadata: { fields: ['full_name'] } },
});
record('onboarding_events insert', evt.status === 201, `status=${evt.status} ${evt.json?.code || ''}`);

const done = await req(`/rest/v1/user_profiles?user_id=eq.${userId}`, {
  method: 'PATCH',
  token,
  headers: { Prefer: 'return=representation' },
  body: { onboarding_completed: true },
});
record('onboarding completion flag', done.status === 200, `status=${done.status}`);

// ---------- Step 6: guard reads (what the dashboard + engine see) ----------
console.log('\n[6] route-guard reads');
const guardProfile = await req(`/rest/v1/user_profiles?user_id=eq.${userId}&select=role,onboarding_completed,onboarding_state`, { token });
record('guard can read own role + completion', guardProfile.status === 200 && guardProfile.json?.[0]?.role === 'job_seeker',
  JSON.stringify(guardProfile.json?.[0] || guardProfile.json));

const guardSeeker = await req(`/rest/v1/job_seeker_profiles?user_id=eq.${userId}&select=full_name,skills`, { token });
record('guard can read own seeker profile', guardSeeker.status === 200, `status=${guardSeeker.status}`);

// ---------- Summary ----------
const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILING CHECKS:');
  for (const f of failed) console.log(`  - ${f.label} (${f.detail})`);
  process.exit(1);
}
console.log('All backend transitions verified.');
