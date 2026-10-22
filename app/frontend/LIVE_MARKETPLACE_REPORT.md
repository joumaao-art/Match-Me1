# MatchMe — Critical MVP Live Data Integration Report

## Outcome
Core marketplace wiring and live Supabase migrations are implemented. The requested browser-level success condition has **NOT been demonstrated**. Available visual validation reached only the guest homepage, not signed-in Company or seeker screens. This report does not classify compilation, contract tests, or rollback-only SQL as end-to-end acceptance.

## 1. Root causes of missing real cards
- Live canonical `public.vacancies` contained **zero records** at audit time. No eligible real vacancy existed to retrieve.
- Company Profile was a hardcoded TechCorp form with browser-local state and a timeout-based fake save. Logo upload only displayed a toast.
- Company dashboard/applicant/pipeline screens used mock arrays, disconnected from persisted vacancy decisions.
- Seeker desktop/mobile dashboards and Matches showed fictional counts and activity.
- The `logos` bucket and storage policies did not exist.
- Company signup ignored profile-write errors/timeouts before navigating. Identity initialization treated timeout-null as success.
- Publication had no live server completeness validation or publication timestamp maintenance.
- Seeker discovery already read canonical vacancies through the shared Supabase client; preferences ranked rather than excluded real records. No evidence found of different Company/seeker environments or AI filtering causing the empty deck.
- RLS allowed every Company to read full seeker profiles, a privacy defect independent of the empty marketplace.

## 2. Company authentication and persistence
Existing Supabase SDK v2 authentication is preserved; no second login system. Signup now checks identity persistence results; timeout outcomes are errors rather than fake readiness. Missing Company identity/profile rows can be repaired idempotently by the owner-scoped live screens. Existing roles are checked and not replaced.

Company Profile now hydrates/saves the authenticated owner's canonical profile. Existing Company name requirement remains; all existing fields are retained: industry, website, phone, country/city, size, founded year, description and culture. Additional nullable country/city/culture columns preserve this form without replacing canonical location. Save success requires a returned backend row. Logo upload accepts PNG/JPEG/WebP up to 2 MB, uses owner-folder Supabase storage, persists the URL, and refreshes it after upload.

Browser logout/relogin, email confirmation delivery and real logo upload were not executed in this environment.

## 3. Vacancy model and publication
No parallel vacancy table. Stable UUID `vacancies.id` relates to `company_profiles.id`; Company ownership resolves through `company_profiles.user_id`.

Existing statuses retained: `draft`, `open`, `closed`, `scheduled`. **open is the canonical Published status**. Expired is derived from expiration date; expired open records are excluded from eligibility and labeled Expired. No live moderation trigger/approval constraint was found; no approval workflow was bypassed.

Post Vacancy now offers explicit Save Draft and Publish. A draft needs a title; incomplete content can be retained. Publishing requires a Company name and vacancy title, description, type/style, country/city, valid ranges and disclosed compensation metadata. The database trigger enforces the publication contract even for direct API writes, preserves ownership, updates timestamps and records first/republication time. Existing qualifications, skills, benefits, education/experience, compensation, expiry persist; nullable seniority was added. Industry is inherited from the canonical Company profile.

Company lists display persisted status, applicant counts and an applicant entry for that exact vacancy. Owner edit/duplicate/delete remain reachable. Vacancies with candidate history cannot be deleted; closing preserves applications/saves.

## 4. Shared environment findings
- Connected project: `ykvlaakotyouojkdydzh`.
- Supabase URL: `https://ykvlaakotyouojkdydzh.supabase.co`.
- Frontend `.env` points to that project and contains an anon key. Shell VITE variables were absent, but Vite reads the frontend environment file.
- Both Company and seeker use singleton `src/services/api-client.ts`, configured through `src/config/env.ts`.
- No service-role credentials were added to frontend code.
- The preview configuration was not modified. Production build passed using this project configuration.
- A separately deployed production origin/environment was not available for independent verification. Android shared-screen mode still requires the previously documented real web origin/package configuration; native runtime was not tested. This report certifies neither separate mobile deployment nor production-origin authentication redirect allowlists.

## 5. RLS and security changes
- RLS remains enabled on Company profiles, seeker profiles, vacancies and decisions.
- Vacancy owner-management policy preserved; active publication read policy now excludes expired records and targets authenticated users. Existing seeker action-history read policy remains.
- Removed broad `Companies can view seeker profiles` policy. Full candidate records remain owner-only through existing policies.
- `get_company_applicants()` returns only applicants to vacancies owned by `auth.uid()`, with stable identities and professional summary fields. Email, phone, DOB, disability, nationalities and CV URL are not projected. Anonymous execution revoked.
- `review_company_application()` checks actual vacancy ownership and updates only active applications with an allowed review status.
- Revoked application direct INSERT/UPDATE/DELETE from anon/authenticated; decisions/reviews stay RPC-owned.
- Revoked TRUNCATE, REFERENCES and TRIGGER privileges on core tables because RLS does not protect those operations.
- Logos are publicly readable branding images; writes/deletes are restricted to the authenticated owner's folder; new uploads require Company role.

The broad candidate-directory implementation remains legacy/demo-backed; removing full-profile access does not create a new public candidate search service. Messages, Career Graph and unrelated enterprise/billing surfaces were not redesigned or certified as production data flows.

## 6. Swipe source, identity and refresh
Swipe uses real `vacancies` joined to canonical Company name/industry/logo; no production jobs were generated or inserted. Cards now retain Company ID as well as vacancy ID. Desktop compensation uses declared currency/pay period rather than inventing USD/month; logo/style/qualifications are canonical. Removed invented Company size/verification and mock seeker skill highlighting from desktop job cards. Existing Swipe visual structure is retained.

Reads order by publication then creation time; focus, explicit change events and 30-second polling refresh real records. Historic saved/applied vacancies are still loaded. Initial discovery remains a bounded newest-100 batch; requested IDs and history can load outside that batch. A broader paginated marketplace is not implemented in this round.

## 7. Matching and fallback
Eligibility is published/active plus existing decision rules. Preferences are ranking signals, not security or hard exclusion filters. The deterministic ranking function handles malformed/unavailable scoring without losing eligible real input records. Equal/failed scores sort newest publication first with stable ID ties. No runtime AI service is indispensable to discovery. Legacy matching modules remain; no AI-generated vacancies enter the live deck. Required completion guards are applied in both mobile and desktop Apply handlers.

## 8. Applications, decisions and dashboards
Canonical application source remains `seeker_job_actions` (user/vacancy composite primary key, right decision, application_status). No duplicate applications table or nonexistent `matches` table is used for the new dashboards.

Existing action RPC maintains Save/Pass/Undo/Apply/withdraw and authoritative credits. Replay costs once per vacancy, including undo/reapply; repeated Apply is idempotent and conflicting prior decisions rejected. UI success follows backend confirmation.

Added Company review state to this canonical application record. Company Applicants/Pipeline filter by exact vacancy, show actual applicants and persist reviewed/interview/accepted/rejected/hired state. Company stats derive from actual vacancies/applications. Seeker Applications reflect actual review status; Matches derive from an active right/application plus Company accepted/hired, not synthetic scores or notifications. Dashboard shows actual applications, matches, saved jobs, credit balance, mandatory completion and application activity, with loading/error/empty states.

## 9. Files and migrations
New:
- `src/lib/company-marketplace.ts`
- `src/lib/vacancy-discovery.ts`
- `src/components/shared/CompanyProfileView.tsx`
- `src/components/shared/CompanyLiveView.tsx`
- `scripts/live-marketplace-contract.mjs`
- `supabase/migrations/018_live_marketplace.sql` — applied live
- `supabase/migrations/019_marketplace_privileges.sql` — applied live

Changed:
- `src/pages/Company.tsx`
- `src/pages/JobSeeker.tsx`
- `src/pages/Auth.tsx`
- `src/components/shared/PersistedVacanciesView.tsx`
- `src/components/shared/MobileDashboard.tsx`
- `src/lib/seeker-jobs.ts`
- `src/lib/signup-flow.ts`
- `src/lib/swipe-presentation.ts`
- `src/types/job.types.ts`

No system preview configuration, SEO content, auth credentials, production job fixtures or existing balances were overwritten.

## 10. Validation results
### Available checks
| Check | Result | Evidence boundary |
|---|---|---|
| TypeScript | PASS | Source type validation |
| ESLint | PASS | Source lint |
| Production build | PASS | Vite build/prerender completed |
| Marketplace contracts | PASS — 13 | Pure/static contracts, not portal interactions |
| Existing premium Swipe contracts | PASS — 29 | Pure/static contracts, not signed-in browser tests |
| Live migration/schema/RLS verification | PASS | New columns/bucket present; four core RLS flags true |
| Authenticated SQL transaction | PASS | Real connected database with existing user identities and `authenticated` role; all test writes rolled back |
| Visual rendering | PASS, guest homepage only | Signed-in flows not reached |

Rollback-only SQL verified incomplete publish rejection; complete publish and exact seeker/Company join read; seeker write rejection; saved/pass/undo/apply persistence; duplicate application prevention; one debit; owning Company applicant visibility and accepted review; seeker review visibility; foreign Company write/review/read denial; full private candidate row isolation. This is **not** real account registration, browser login, or portal-created vacancy evidence. No fixture job/profile changes/credit deductions remain after rollback.

### Mandatory actual-running-MVP acceptance
| Test | Result | Reason |
|---|---|---|
| A — Company registration/profile refresh | NOT RUN | No legitimate authenticated browser account/verification session reached |
| B — Portal-created published vacancy/list | NOT RUN | No signed-in Company portal interaction performed |
| C — Exact vacancy rendered in seeker Swipe | NOT RUN | No separate eligible seeker session/card screenshot reached |
| D — Heart/application and Company applicant UI | NOT RUN | Database transaction passed; browser actions not executed |
| E — Logout/relogin persistence in both portals | NOT RUN | Cannot substitute SQL identity switching for actual auth sessions |
| F — Actual MVP unauthorized access attempts | NOT RUN in browser | Authenticated database ownership/privacy checks PASS, browser/API session tests absent |

**Overall requested end-to-end acceptance: NOT PASSED / unverified.** No failed browser step is concealed as PASS; unexecuted steps are explicitly NOT RUN.

## 11. Blockers and exact resolution
1. Actual authenticated MVP acceptance remains the release gate. Using the running App Viewer with two independently registered/verified accounts, execute A–F: save Company profile/logo; create a unique explicitly labeled acceptance vacancy; Publish; switch to a completed seeker; verify exact UUID/Company/logo/content card; Apply; switch to owner and verify applicant/count; relogin both; attempt another Company's edit/private-profile access. Record screenshots and canonical IDs. Close the acceptance vacancy afterward. Do not populate production with demo filler.
2. If email verification is required, use accessible legitimate test mailboxes and complete the normal confirmation link; verify the intended preview/published origin and `/auth/callback` allowlist in Supabase. Do not disable confirmation or fabricate a session.
3. Verify the published deployment and any configured Android shared-screen origin use this same Supabase project before claiming cross-environment readiness.
4. Previously known unrelated payment/location/legal/native configuration blockers remain outside this marketplace repair. Messages and other legacy/demo enterprise features are preserved but not newly certified.

The implemented core can now be exercised through the existing Company and seeker navigation. The final success condition must still be established through the actual signed-in MVP, not inferred from this report.
