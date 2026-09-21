/**
 * Decisive reproduction of the MatchMe Job Seeker signup deadlock.
 * ============================================================
 * supabase-js routes every PostgREST request through fetchWithAuth ->
 * _getSessionToken() -> auth.getSession(). So when the onAuthStateChange
 * callback `await`s a data-layer query, it re-enters the auth client from
 * INSIDE the auth call that is still awaiting that very callback.
 *
 * This script measures that interlock directly, and proves the deferred
 * (non-blocking) callback shape resolves instantly.
 *
 * Usage: set -a; . ./.env; set +a; node scripts/probe-auth-deadlock.mjs
 */

try {
  const ws = await import('ws');
  globalThis.WebSocket = ws.WebSocket ?? ws.default;
} catch {
  // Node 20 has no native WebSocket. This probe never uses Realtime, so a
  // constructor stub is enough for the client to initialize.
  globalThis.WebSocket = class WebSocketStub {
    constructor() { throw new Error('Realtime is not used by this probe'); }
    static get OPEN() { return 1; }
  };
}

const { createClient } = await import('@supabase/supabase-js');

const URL_BASE = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
if (!URL_BASE || !ANON) { console.error('missing env'); process.exit(2); }

const PASSWORD = 'Probe!Passw0rd2026';

function makeStorage() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  };
}

function makeClient() {
  return createClient(URL_BASE, ANON, {
    auth: {
      storage: makeStorage(),
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Resolve with 'resolved' or 'HUNG' after `ms`. */
async function withTimeout(promise, ms) {
  const started = Date.now();
  const outcome = await Promise.race([
    promise.then(() => 'resolved').catch((e) => `rejected:${e?.message ?? e}`),
    new Promise((r) => setTimeout(() => r('HUNG'), ms)),
  ]);
  return { outcome, ms: Date.now() - started };
}

// ------------------------------------------------------------
// 1. Seed a real account (mailer_autoconfirm=true -> session issued)
// ------------------------------------------------------------
const seeder = makeClient();
const email = `probe.deadlock.${Date.now()}@matchme-probe.dev`;
const signup = await seeder.auth.signUp({ email, password: PASSWORD, options: { data: { role: 'job_seeker' } } });
if (signup.error) { console.error('seed signup failed:', signup.error.message); process.exit(2); }
const userId = signup.data.user?.id;
console.log(`seeded account for deadlock probe: user_id_present=${!!userId}`);
await seeder.auth.signOut();

// ------------------------------------------------------------
// 2. Test A — the CURRENT app shape: callback awaits a data query
// ------------------------------------------------------------
console.log('\n[A] onAuthStateChange callback that AWAITS a PostgREST query (current app shape)');
{
  const client = makeClient();
  let callbackRan = false;
  client.auth.onAuthStateChange(async (event, session) => {
    if (event !== 'SIGNED_IN' || !session?.user) return;
    callbackRan = true;
    // This is exactly what App.tsx does: fetch role / profile from PostgREST.
    const res = await client.from('user_profiles').select('role').eq('user_id', session.user.id).maybeSingle();
    console.log(`    -> in-callback query finished: status=${res.status ?? 'n/a'} error=${res.error?.message ?? 'none'}`);
  });

  const res = await withTimeout(client.auth.signInWithPassword({ email, password: PASSWORD }), 8000);
  console.log(`    signInWithPassword: callbackRan=${callbackRan} outcome=${res.outcome} elapsed=${res.ms}ms`);
  await client.auth.signOut().catch(() => {});
}

// ------------------------------------------------------------
// 3. Test A2 — callback awaits auth.getSession() (lock re-entry)
// ------------------------------------------------------------
console.log('\n[A2] onAuthStateChange callback that AWAITS auth.getSession()');
{
  const client = makeClient();
  let done = false;
  client.auth.onAuthStateChange(async (event, session) => {
    if (event !== 'SIGNED_IN' || !session?.user) return;
    const s = await client.auth.getSession();
    done = true;
    console.log(`    -> in-callback getSession finished: has_session=${!!s.data.session}`);
  });
  const res = await withTimeout(client.auth.signInWithPassword({ email, password: PASSWORD }), 8000);
  console.log(`    signInWithPassword: getSessionReturned=${done} outcome=${res.outcome} elapsed=${res.ms}ms`);
  await client.auth.signOut().catch(() => {});
}

// ------------------------------------------------------------
// 4. Test B — the FIX: callback defers work out of the auth call
// ------------------------------------------------------------
console.log('\n[B] onAuthStateChange callback that DEFERS the query (proposed fix shape)');
{
  const client = makeClient();
  let deferredRan = false;
  client.auth.onAuthStateChange((event, session) => {
    if (event !== 'SIGNED_IN' || !session?.user) return;
    // Hand off to the next macrotask: never await inside the listener.
    setTimeout(async () => {
      const res = await client.from('user_profiles').select('role').eq('user_id', session.user.id).maybeSingle();
      deferredRan = true;
      console.log(`    -> deferred query finished: rows=${res.data ? 1 : 0} error=${res.error?.message ?? 'none'}`);
    }, 0);
  });
  const res = await withTimeout(client.auth.signInWithPassword({ email, password: PASSWORD }), 8000);
  console.log(`    signInWithPassword: outcome=${res.outcome} elapsed=${res.ms}ms`);
  await new Promise((r) => setTimeout(r, 1500)); // let the deferred work land
  console.log(`    deferred work completed=${deferredRan}`);
  await client.auth.signOut().catch(() => {});
}

// ------------------------------------------------------------
// 5. Test C — signUp itself: does it also wait on the callback?
// ------------------------------------------------------------
console.log('\n[C] signUp with an awaiting listener (new-user path)');
{
  const client = makeClient();
  const freshEmail = `probe.deadlock.signup.${Date.now()}@matchme-probe.dev`;
  let callbackRan = false;
  client.auth.onAuthStateChange(async (event, session) => {
    if (event !== 'SIGNED_IN' || !session?.user) return;
    callbackRan = true;
    await client.from('user_profiles').select('role').eq('user_id', session.user.id).maybeSingle();
  });
  const res = await withTimeout(client.auth.signUp({ email: freshEmail, password: PASSWORD, options: { data: { role: 'job_seeker' } } }), 8000);
  console.log(`    signUp: callbackRan=${callbackRan} outcome=${res.outcome} elapsed=${res.ms}ms`);
}

console.log('\n=== deadlock probe complete ===');
