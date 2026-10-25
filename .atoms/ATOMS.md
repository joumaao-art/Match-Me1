---
last_updated: 2026-10-21
status: active
---

# Project Context

## Project Overview
MatchMe is a bilingual EN/AR recruitment web app using React/Vite/shadcn and the existing Supabase backend. Job Seeker mobile is the authoritative functional reference; desktop follows it using an independent professional sidebar, cards and forms. Company and Super Admin are outside this rule.

## Key Decisions
| Decision | Rationale |
|---|---|
| Approved mobile-only date confirmation | Wrap existing wheels/month-year/native date controls without redesign; draft changes commit only on explicit confirmation, saved dates load locked, Edit/Cancel stay field-local. Preserve form Save/onboarding autosave and existing expected-graduation option; no schema or desktop/Company/Admin behavior changes. |
| Approved desktop-only navigation cleanup | Five desktop sidebar destinations: Swipe, Dashboard, Profile, Subscription Overview, Preferences. Footer Support & Settings/confirmed Logout unchanged; Profile actions VIA Resume/Personal only. Mobile three-tab navigation, Profile subscription/logout and Swipe Preferences remain unchanged; no backend/auth/billing changes. |
| Permanent Job Seeker mobile → desktop authority | Define Job Seeker features against current mobile first; desktop must provide equivalent fields, rules, actions and shared persistence with independent layout. No unapproved desktop-only features; retain mobile regressions and desktop parity checks. Company/Admin excluded. |
| Mobile Profile account overview | Reuse existing Supabase/Auth/billing; owner-checked Personal patch RPC, private original CV with storage timestamp, separate deterministic selectable VIA PDF; additive professional JSON and support-report table only. Missing support chat/email and verified login-phone change/deletion flows explicitly unavailable. |
| Mobile Dashboard canonical extension | Existing seeker_job_actions remains sole source; add nullable event dates and new-event history, retain legacy statuses without inventing old submission/interview dates; Company RPC owns new recruitment stages. Search/counts use owner-scoped paginated RPC; preserve desktop Dashboard component/layout. |
| VIA Premium uses existing Stripe service and canonical subscriptions | USD10 monthly/USD100 yearly; only provider-verified paid terms exempt Apply credits; Pass and balances unchanged. Native external checkout blocked pending store billing. |
| Preserve existing Supabase project and unprefixed tables | Existing users/data must survive; do not activate another backend or recreate schema. |
| Mobile breakpoint below768px | Desktop onboarding follows the current mobile workflow with native desktop dates; synchronous media query preserves separate presentation. |
| One server completion authority | ensureJobSeekerInitialized repairs only missing identity rows and resolves destination; cached completion never overrides server. |
| Per-user version3 mobile state and canonical profile/history | Prevent account leakage, preserve stable IDs/manual values and legacy records; database RPC owns completion. |
| Unified20 signup credits across mobile/desktop | User explicitly superseded50; server identity-insert grants once, shared initialization repairs missing entitlements; imported entitlements/balances preserved and ledger owns deductions/purchases. |
| Critical MVP Company → vacancy → seeker → application workflow | Current scope replaces disconnected core screens; no production filler data or parallel vacancy/application database. |
| Canonical applications remain seeker_job_actions | Company review column supplies actual mutual acceptance; owner-authorized projection excludes candidate email/phone/DOB/disability/CV. |
| Publication uses existing open status | open means Published; server checks completeness/expiry, drafts stay editable; no moderation triggers or approvals found in live schema. |
| English engineering; EN/AR product | Preserve RTL and Arabic; language checker retains approved locale-native registry names. |
| No invented legal content or fake success | Missing approved legal text and provider/extraction configuration must be reported as blockers. |

## Constraints
- Preserve auth/routes, Company/Admin, desktop visual layout and existing balances/history.
- Exact sequence: INTRO, PERSONAL_DETAILS, GENDER, BIRTHDAY, CURRENT_LOCATION, SKILLS, EDUCATION, EXPERIENCE, PREFERENCES, SENIORITY, FREE_CREDITS, HOW_IT_WORKS, COMPLETE, Discover.
- Exact tagline: Get Hired VIA us. Slim completion progress; no numeric counters. Required applicable fields; CV optional; manual values never overwritten.
- Colors: primary #2563EB, secondary #3B82F6, background #F8FAFC, text #1E293B, CTA #F97316. Poppins headings/Open Sans body; approved existing MatchMe branding, dark mode and RTL.
- User requests actual acceptance evidence A–W at320/360/375/390/412 plus Arabic/desktop; never claim unexecuted tests passed.
- Preview managed by platform; no browser diagnostics during implementation. One current-request UI check passed desktop homepage only; no second check is allowed after a passing first result. Required mobile/Arabic/signed-in A–W evidence remains unexecuted.
- Current release blockers: approved legal text missing; credit-payment configuration returns503; reverse geocoding token skipped; TXT-only automatic CV extraction. Real Discover actions are wired; broader legacy subscription/demo surfaces are not certified.
