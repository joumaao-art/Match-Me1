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

## 8. Verification checklist

- `node scripts/repro-signup-spinner-hang.mjs` — reproduced and fixed
- `npx tsc --noEmit` — pass
- `pnpm run lint` — pass
- `pnpm run build` — pass (7 pages prerendered)
- UI render validation — pass
