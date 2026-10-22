## Task Breakdown

| Current mobile onboarding phase | Implementation | Validation |
|---|---|---|
| Mobile entry, eleven steps, canonical persistence and recovery | done | in_progress |
| Account isolation, intentional wheels and malformed draft recovery | done | done |
| Real Discover, saved jobs and application actions | done | in_progress |
| Unified20 grant, deductions and preserved balances | done | done |
| Credit checkout/verification integration | blocked | blocked |
| TypeScript, lint and production build | done | done |
| Approved legal sheets and required mobile A–W acceptance evidence | blocked | blocked |

## Progress Log
- Scope: MOBILE-ONLY guest entry/onboarding below768; existing Supabase/auth/routes, Company/Admin and desktop presentation retained; EN/AR product.
- Exact sequence: INTRO → PERSONAL_DETAILS → GENDER → BIRTHDAY → CURRENT_LOCATION → SKILLS → EDUCATION → EXPERIENCE → PREFERENCES → SENIORITY → FREE_CREDITS → HOW_IT_WORKS → COMPLETE → actual Discover.
- Mobile version3 registry, completion-based progress, optional CV, shared controls, exact selectors, multi-entry history, no-experience confirmation and server-authoritative saves/retry implemented.
- Account-keyed page, mounted/request guards, immutable queued save snapshots, safe malformed preferences/cache quota handling and server response reconciliation added.
- Discover reads live vacancies/actions; Save, swipe/application, Undo, withdrawal and Share use real persistence/browser APIs. Saved/shared links open job details; action refresh includes bounded30s polling. Live vacancies currently empty, not replaced with demo jobs.
- Supabase migrations012–014 record additive schema/functions. Browser cannot grant purchase credits; server rejects forged completion, invalid chronology and foreign history IDs.
- Unified20 once per eligible new seeker across mobile/desktop. Live35 credit accounts still total350; existing balances preserved.
- Rollback-only SQL checks passed signup idempotency, deductions/replays, saved/pending application, service purchase replay, full eleven-step completion, invalid dates, RLS isolation/no recursion; latest checks passed foreign history/null purchase rejection. Fixtures rolled back; these are not browser/concurrency/Stripe evidence.
- Authenticated credit-payments and reverse-location functions deployed; canonical deployed source artifacts exist under app-prefixed function directories. Checkout return selects Billing; verification retry reachable; account guards prevent stale response UI changes.
- Latest validation:22 pure onboarding contract checks, TypeScript, lint and production build passed after final source fixes (2405 modules). These tests do not prove mobile rendering or signed-in flows.
- One UI check previously passed desktop homepage only; second check not permitted after passing first. Required320/360/375/390/412, Arabic/RTL, keyboard, signed-in and A–W App Viewer evidence remain UNEXECUTED.
- Release blockers: approved legal text absent; Stripe configuration probe503 (price/site/secret/webhook setup incomplete); reverse-location requires skipped Mapbox token; automatic CV extraction TXT-only (PDF/DOCX upload/manual entry available).
- Existing broader subscription/invoices/trials/dashboard and Company application surfaces retain legacy/demo behavior outside this onboarding change; do not claim billing/recruitment product-wide completion.
- User requested no further questions. Preserve current app; report blocked release and remaining evidence without fabricated success or deployment recommendation.
