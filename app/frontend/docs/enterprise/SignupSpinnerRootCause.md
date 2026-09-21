# Job Seeker Signup Infinite Spinner — Root Cause & Execution Trace

Scope: the full-screen spinner that never released during Job Seeker signup.
Status: reproduced, root-caused, fixed, re-verified.

## 1. Spinner owners

Three separate full-screen spinners existed, each owned by its own gate. Any one
of them could hang independently, and all three were reached during a normal
Job Seeker signup:

| # | Component | Gate state | Initial value | Full-screen spinner |
|---|-----------|-----------|---------------|---------------------|
| 1 | `src/App.tsx` (`PageLoader`) | `isLoading` (auth store) | `true` | yes |
| 2 | `src/pages/JobSeekerOnboarding.tsx` | `hydrated` (onboarding store) | `false` | yes |
| 3 | `src/pages/JobSeeker.tsx` | `onboardingChecked` (local state) | `false` | yes |

## 2. Blocking state

All three gates share one shape, and that shape is the defect:

```
const [gated, setGated] = useState(false)     // or a persisted flag defaulting to true
someNetworkRead().then(() => setGated(true))  // release the gate
if (!gated) return <FullScreenSpinner />      // block the whole route
```

A `.then()` callback — or any `await` placed before the setter — does **not** run
when the underlying promise never settles. `catch` does not help either, because a
hanging promise neither resolves nor rejects. The gate therefore stays closed
forever and the full-screen spinner is permanent.

## 3. Blocking operation

The single blocking operation behind all three gates is the Supabase session /
profile read path, which `supabase-js` performs behind an internal async lock:

- `supabase.auth.getSession()` awaits Supabase client initialization.
- `profileService.getUserProfile()` / `getSeekerProfile()` issue `.maybeSingle()`
  reads on `user_profiles` / `job_seeker_profiles`.

When either call is left pending (stalled connection, suspended tab, an
interrupted OAuth/PKCE callback, or a lock held by a concurrent refresh), nothing
ever settles the promise, so nothing ever releases the gate.

`src/stores/auth.store.ts` made this worse: `isLoading` starts as `true` and is
**not** persisted, so a page reload re-arms the closed gate with no local state to
recover from.

## 4. Why the previous fix failed

The earlier repair added `try/catch` around the reads and time-boxed some
bootstrap calls. That was insufficient for two concrete reasons:

1. **`catch` never fires for a hanging promise.** Only a rejection reaches
   `catch`; an indefinitely pending promise reaches nothing. The gate stayed shut.
2. **The `.then()` gate shape was left intact.** The reads that were *not*
   wrapped in a timeout still owned their gate directly, so `JobSeekerOnboarding`'s
   `hydrate()` (which `await`ed `getUserProfile()` *before* `set({ hydrated: true })`)
   and `JobSeeker.tsx`'s onboarding guard both still had an unbounded await in
   front of the setter.

## 5. Exact code fix

Every gate now has **guaranteed completion** — it is released on resolve, on
reject, and on timeout.

1. **`src/App.tsx`** — auth boot: bounded `getSession()` with `.catch`/`.finally`,
   a hard boot timeout, and a bounded destination fallback so boot always ends in
   `isLoading: false`. Development-only `[BootTrace]` lines make each stage visible.
2. **`src/lib/onboarding-engine.ts`** — `hydrate()` is now wrapped in
   `withTimeout(..., BOOTSTRAP_TIMEOUT_MS, ...)` and sets `hydrated: true` on
   *every* path (server state, local mirror, timeout, malformed state, or throw).
3. **`src/pages/JobSeeker.tsx`** — the onboarding guard now has a
   `ONBOARDING_GUARD_TIMEOUT_MS` watchdog plus a single idempotent `settle()`
   called on success, on back-fill, and on failure, so `onboardingChecked` always
   releases the dashboard.
4. **`src/lib/signup-flow.ts`** — shared `BOOTSTRAP_TIMEOUT_MS` + `withTimeout`
   power identity bootstrap and destination resolution, so role/onboarding routing
   can never strand a signup.

## 6. Reproduction evidence

`scripts/repro-signup-spinner-hang.mjs` exercises the exact pre-fix and post-fix
gate shapes against a promise that never settles:

```
Reproduction results:
  HUNG      pre-fix gate released when the read hangs
  RELEASED  post-fix gate released when the read hangs
  RELEASED  post-fix gate released when the read rejects
  HUNG      pre-fix gate released when the read rejects (control)
```

This isolates the mechanism and proves the repaired contract releases the gate in
every outcome (the script asserts these four results, so a regression fails CI).

## 7. Successful execution trace

Observed after the fix, in-browser, with no session:

| Step | Result |
|------|--------|
| `GET /auth?role=seeker` | form renders immediately; `isLoading` reached `false` |
| Job Seeker role selection | signup screen (Apple / Google / phone / email) renders |
| Email signup branch | Email, Password, Confirm Password, Sign Up all render |
| `GET /seeker` (no session) | redirects to `/auth` — no spinner |
| `GET /seeker/onboarding` (no session) | redirects to `/auth` — no spinner |

Each protected route now terminates in a rendered destination or a redirect,
never in an unbounded spinner.

## 8. The loader that actually blocked the real signup

The gate analysis above explains the *mechanism*, but the loader that a real user
actually saw was a different, fourth gate that no static reading exposed. It was
only found by tracing the live application while signing up.

| Field | Value |
|-------|-------|
| Loader ID | `guest-destination-resolve` |
| Component | `GuestRoute` |
| File | `src/App.tsx` |
| Trigger | The user submits the signup form on `/auth`; auth state flips to authenticated while destination resolution is still pending |
| Effect | `GuestRoute` evaluated "authenticated + no destination yet" and replaced the whole signup UI with a full-screen loader |

The user-visible symptom was "I pressed Sign Up and the spinner never goes away",
but the spinner was a *consequence* of the status transition, not a stuck network
call. Because the signup request itself had already succeeded, no failing request
and no rejection existed for `catch` to report — which is exactly why the earlier
`try/catch`-based repair did not change the symptom.

**Fix:** `GuestRoute` no longer blocks on missing destination. It renders its
children while destination resolution is pending and only redirects once a
destination actually exists. A pending resolution can therefore no longer hide an
in-progress form or a completed signup.

## 9. Real-browser journey verification

`scripts/runtime-signup-e2e.mjs` drives a real Chromium session through the whole
Job Seeker journey and samples the DOM once per second, recording the route, any
`[data-loader-id]` gate, any unidentified full-screen spinner, visible headings,
and body text. A *stuck* loader means the gate was still covering the screen at the
end of the observation window (it must be absent for the last three consecutive
samples), which keeps short-lived lazy-chunk and hydration loaders from being
misreported as defects.

| Check | Observation window | Result |
|-------|--------------------|--------|
| Public `/auth` entry (no session) | 30 s | PASS — no blocking gate |
| Job Seeker signup methods render | 18 s | PASS — no blocking gate |
| Submit email signup → destination | 30 s | PASS — reached `/seeker/onboarding`, no blocking gate |
| Continue past Welcome ("Get started") | 18 s | PASS — reached onboarding *Step 1 of 12, Upload your resume* |
| Refresh `/seeker/onboarding` | 25 s | PASS — no blocking gate |
| Unauthenticated `/seeker/onboarding` | 12 s | PASS — redirected to `/auth`, no blocking gate |

`scripts/runtime-auth-matrix.mjs` covers the non-signup regression paths with the
same stuck-loader criterion:

| Check | Result |
|-------|--------|
| Returning Job Seeker login (`/auth?role=seeker`, real credentials, session confirmed in storage) | PASS — landed on `/seeker/onboarding`, zero stuck loaders |
| Authenticated `/seeker` landing | PASS — onboarding guard routed correctly, zero stuck loaders |
| Company authentication deep link (`/auth?role=company`) | PASS — Company login form renders, zero stuck loaders |

No uncaught page errors were recorded in any run.

## 10. Loader inventory outcome

Every full-screen loader owner now carries an explicit diagnostic identity, so a
future occurrence names itself instead of appearing anonymous:

| Loader ID | Owner | Purpose |
|-----------|-------|---------|
| `auth-boot` | `src/App.tsx` | Auth/session restoration |
| `lazy-route` | `src/App.tsx` | Lazy route chunk fetch (Suspense) |
| `guest-destination-resolve` | `src/App.tsx` | Guest-route destination resolution — **no longer blocks** |
| `job-seeker-onboarding-hydration` | `src/pages/JobSeekerOnboarding.tsx` | Onboarding state hydration |
| `seeker-onboarding-guard` | `src/pages/JobSeeker.tsx` | Dashboard onboarding guard |
| `shared-loading-spinner` | `src/components/shared/LoadingSpinner.tsx` | Shared spinner primitive |

The remaining loaders observed during the runs (`lazy-route`,
`job-seeker-onboarding-hydration`) each released within a second or two and never
persisted to the end of an observation window, which is the expected behaviour for
route-chunk fetching and a bounded hydration read.

## 11. Language audit

A workspace-wide search for CJK characters in application code, configuration,
documentation, scripts, and database migrations returned only intentional
localization metadata:

| File | Occurrence | Verdict |
|------|-----------|---------|
| `src/lib/i18n.ts` | `{ code: 'zh', nativeName: '中文' }`, `{ code: 'ja', nativeName: '日本語' }` | Intentional — language registry display names |
| `supabase/migrations/009_production_realtime_seeds.sql` | `('zh', 'Chinese', '中文')`, `('ja', 'Japanese', '日本語')` | Intentional — language reference table seed data |

No accidental Chinese engineering, debug, or test text remains in the project. All
reports and documentation for this work are therefore written entirely in English.

## 12. Signup outcome contract

The hang was a *classification* defect, so the fix is only trustworthy if all
three possible answers to an email signup settle. The contract was executed
against the real module (loaded through the running dev server, no mocks) plus a
real refresh on the verification screen.

| Response shape | Meaning | Classified as | Settled |
|----------------|---------|---------------|---------|
| user, `email_confirmed_at: null`, no session | confirmation pending | `verification_required` | yes |
| user, `email_confirmed_at` set, **no session** | auto-confirmed but sessionless — the original defect | `verification_required` | yes |
| user, no session, `identities: []` | address already registered | `verification_required` (flagged `alreadyRegistered`) | yes |
| user **and** session | signed in | `authenticated` | yes |
| `error` present | provider rejected | `error` | yes |
| `user: null`, no error | malformed response | `error` | yes |

The invariant that the defect violated is asserted directly: **a session-less
response is never reported as authenticated**, so no authenticated profile write
can be attempted and no dashboard destination can be assumed.

Script: `node scripts/probe-signup-classifier.mjs`.

## 13. Outcome matrix in a real browser

`node scripts/probe-signup-outcomes.mjs` drives the Job Seeker → Sign up with
Email journey in one persistent browser profile, so storage left behind by an
earlier step cannot mask the defect. A scenario passes only when **no
full-screen gate is present for the final samples** and **no submit control is
left disabled**.

| Scenario | Result | Observed destination |
|----------|--------|----------------------|
| Brand-new email (real Supabase session issued) | settled | `/seeker/onboarding` |
| Refresh on the outcome screen | settled | `/seeker/onboarding` unchanged |
| Same email submitted again | settled | `/seeker/onboarding` (no duplicate-submission failure) |
| Weak password | settled, no busy button | `/auth` |
| Invalid email | settled, no busy button | `/auth` |
| Resend verification email | skipped (no verification screen: this project auto-confirms) | — |

Constructor-level control of the session-less case is impossible from a real
signup against this project because the mailer auto-confirms, which is exactly
why that branch is covered by the contract test in section 12 and by a seeded
pending-signup refresh: with `matchme-pending-role` and `matchme-pending-email`
present and no session, `/auth` renders the verification screen for all 12
sampled seconds with zero gates and a re-enabled resend control.

## 14. Verification checklist

- `node scripts/repro-signup-spinner-hang.mjs` — reproduced and fixed
- `node scripts/runtime-signup-e2e.mjs` — full signup journey passes (6/6 checks)
- `node scripts/runtime-auth-matrix.mjs` — regression matrix passes (3/3 checks)
- `node scripts/probe-signup-outcomes.mjs` — outcome matrix passes (no stuck gate, no stuck button)
- `node scripts/probe-signup-classifier.mjs` — outcome contract passes (no session-less response treated as authenticated)
- `npx tsc --noEmit` — pass
- `pnpm run lint` — pass
- `pnpm run build` — pass (7 pages prerendered)
- UI render validation — pass
- Repository-wide CJK audit — only intentional language-registry names remain

