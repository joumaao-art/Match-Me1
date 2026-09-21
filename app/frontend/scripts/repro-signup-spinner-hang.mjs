/**
 * Infinite Job Seeker signup spinner — executable reproduction
 * ============================================================
 * Reproduces the EXACT gate pattern that owned each full-screen spinner and
 * proves why it could hang forever, then proves the repaired bounded contract
 * always releases.
 *
 * The three spinner gates in the app all share one shape:
 *
 *   const [gated, setGated] = useState(false)   // or store flag defaulting true
 *   someNetworkRead().then(() => setGated(true))
 *   if (!gated) return <FullScreenSpinner />
 *
 * A `.then()` (or an `await` before the setter) does NOT settle when the
 * underlying promise never settles. `catch` does not help either, because a
 * hanging promise neither resolves nor rejects. That is the root cause.
 *
 * Run: node scripts/repro-signup-spinner-hang.mjs
 */

import assert from 'node:assert/strict';

const TIMEOUT_MS = 120;

/** A read that never settles — a hung fetch / stalled supabase-js initialize. */
const neverSettlingRead = () => new Promise(() => {});

/** The bounded helper used by the repaired code (mirror of lib/signup-flow). */
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/** Wait longer than the timeout, without waiting for the hung read itself. */
const drain = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------
// 1. PRE-FIX: the original gate shape. Reproduces the hang.
// ---------------------------------------------------------------
async function preFixGate() {
  const gate = { released: false }; // mirrors isLoading: true / hydrated: false / onboardingChecked: false

  // <-- the original code, verbatim in shape
  neverSettlingRead().then(() => {
    gate.released = true;
  });
  // no catch, no timeout, no finally

  await drain(TIMEOUT_MS * 3);
  return gate.released;
}

// ---------------------------------------------------------------
// 2. POST-FIX: bounded + guaranteed completion.
// ---------------------------------------------------------------
async function postFixGate() {
  const gate = { released: false };

  const watchdog = setTimeout(() => {
    gate.released = true; // watchdog releases the gate
  }, TIMEOUT_MS);

  withTimeout(neverSettlingRead(), TIMEOUT_MS, null)
    .then(() => {
      gate.released = true;
    })
    .catch(() => {
      gate.released = true;
    })
    .finally(() => clearTimeout(watchdog));

  await drain(TIMEOUT_MS * 3);
  return gate.released;
}

// ---------------------------------------------------------------
// 3. POST-FIX under rejection: a thrown read must also release.
// ---------------------------------------------------------------
async function postFixGateOnRejection() {
  const gate = { released: false };
  const rejectingRead = () => Promise.reject(new Error('malformed auth callback URL'));

  await Promise.resolve(rejectingRead())
    .then(() => {
      gate.released = true;
    })
    .catch(() => {
      gate.released = true; // previously: unhandled rejection, gate stayed closed
    });

  return gate.released;
}

const results = {
  'pre-fix gate released when the read hangs': await preFixGate(),
  'post-fix gate released when the read hangs': await postFixGate(),
  'post-fix gate released when the read rejects': await postFixGateOnRejection(),
  'pre-fix gate released when the read rejects (control)': await (async () => {
    const gate = { released: false };
    // The unhandled rejection can never reach the setter, so the gate stays shut.
    Promise.reject(new Error('boom')).then(() => {
      gate.released = true;
    }).catch(() => {});
    await drain(TIMEOUT_MS);
    return gate.released;
  })(),
};

console.log('Reproduction results:');
for (const [label, value] of Object.entries(results)) {
  console.log(`  ${value ? 'RELEASED' : 'HUNG    '}  ${label}`);
}

// The reproduction is only meaningful if the defect is actually reproduced.
assert.equal(results['pre-fix gate released when the read hangs'], false, 'pre-fix must hang');
assert.equal(results['pre-fix gate released when the read rejects (control)'], false, 'pre-fix must hang on rejection');
assert.equal(results['post-fix gate released when the read hangs'], true, 'post-fix must release');
assert.equal(results['post-fix gate released when the read rejects'], true, 'post-fix must release on rejection');

console.log('\nRoot cause reproduced, and the repaired contract releases the gate in every outcome.');
