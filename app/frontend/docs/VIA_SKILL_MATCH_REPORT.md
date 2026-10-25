# VIA AI Skill Match Assistant — Implementation and Validation Report

## Delivery status
Implemented the optional mobile/desktop review and canonical save path. Supabase analysis endpoint is deployed ACTIVE. The OpenAI key was explicitly skipped: live AI extraction/evidence is not validated and the deployed endpoint falls back to deterministic analysis when no provider key is configured. Full requested authenticated Company→vacancy→Seeker acceptance is NOT established.

## Architecture
1. Existing SwipeView loads actual published vacancies and canonical actions. Both active mobile/desktop branches now expose a compact Improve My Match sparkle action. No automatic review on render or animation.
2. Shared core retains the existing 55-entry skill taxonomy, NFKC/whitespace normalization, conservative EN/AR equivalents, requirement deduplication and direct evidence comparison. Structured required skills remain authoritative. Text requirements require explicit required/preferred wording; unknown priorities are not invented.
3. Authenticated Deno endpoint validates Supabase user, owner profile and published/unexpired vacancy before reading owner experience, education, certificate names and saved resume extraction. No CV download, names/email/phone/DOB/credential IDs are deliberately included. Free-text input is bounded and email/phone/URL patterns redacted; unrestricted free-text can still contain identifiers not recognized by these filters.
4. Optional gpt-5.4 official SDK path extracts explicitly quoted requirements and possible evidence. Output is allowlisted by source, priority, exact employer/profile quotes and practical skill mentions; credential requests are rejected. The AI never sets canonical qualifications or matching scores. Unknown semantic equivalents beyond the conservative shared alias map are not accepted automatically.
5. Private RLS-enabled requirement cache and temporary review records are inaccessible to anonymous/authenticated direct table access. Vacancy-revision hash cache expires after24h; review tokens after20min. Atomic service-only reservation enforces5 reviews/minute and30/day per account. Expired records are pruned on subsequent reviews, not by a scheduled retention job.
6. Explicit selected-skill confirmation calls an authenticated RPC. The server checks owner, expiry, unchanged published vacancy and server-generated allowlist, locks canonical profile, merges with freshest skills, preserves existing entries and deduplicates equivalents. No Preferences, education, experience, billing, decisions or credentials are written.
7. Canonical profile adapter calls the unchanged existing matchingEngine.calculateCompatibility. Old/new values use canonical reads, not fixed increments. Active recommendations use the actual score with existing preference-ranked order for ties and unchanged vacancy eligibility; successful save pins the current vacancy before profile refresh. Completion listeners refresh through existing profile-changed event.

## Files
Added:
- src/lib/skill-match-core.ts — shared taxonomy, normalization, requirements and evidence contracts.
- src/lib/skill-match.ts — canonical profile loading, engine adapter and refresh hook.
- src/components/seeker/SkillMatchAssistant.tsx — EN/AR optional dialog, selection, confirmation, save/error/delta.
- src/native-bridge.d.ts — typing-only declaration for the existing native bridge; fixes pre-existing TypeScript errors without changing billing behavior.
- supabase/migrations/024_via_skill_match.sql — private cache/review tables and server reservation/confirmation functions.
- supabase/functions/app_91d3436dfc_skill_match/index.ts and deploy.ts — endpoint and mechanically assembled source bundle.
- scripts/skill-match-contract.mjs —48 unit/source checks.
Updated:
- src/pages/JobSeeker.tsx — real score/ranking refresh and active branch props.
- MobileSwipePage.tsx, MobileSwipeCard.tsx, DesktopSwipePage.tsx — compact opener, shared assistant and mobile overlay gesture suspension.
- src/lib/onboarding-engine.ts — reexports unchanged taxonomy from shared core; existing picker/parser use the same list.

## Backend integration
Existing project ykvlaakotyouojkdydzh and canonical unprefixed tables preserved. New private app-prefixed tables only; no existing columns, user rows or credits changed by migration. Analysis endpoint uses Supabase service access only after getUser validation, manually scoped owner queries and published vacancy checks. verify_jwt=false permits CORS preflight; POST explicitly validates user token and is not anonymous analysis. Confirmation uses auth.uid(), no client-selected account identifier.

Live schema:2 available published vacancies,46 seeker profiles at inspection. Existing Sales Manager vacancy177f11b8-c341-4112-8247-a64a92150069 exists; no generated production cards/jobs were created. Test profile mutations were rollback-only.

## Executed validation
- TypeScript application check: PASS after adding the native Window declaration.
-48 skill normalization/evidence/priority/credential/score/UI-source/SQL-source checks: PASS.
- ESLint and production build: PASS.
-11 rollback-only SQL checks on existing profile/vacancy records: PASS — confirmation, forged skill, foreign owner, preservation/equivalent deduplication, idempotent retry, concurrent existing skill preservation, untouched Preferences, expired review, changed vacancy, anonymous confirmation and rate limit.
- Additional rollback-only full canonical credit-account snapshot equality after review/save: PASS. Initial test used an incorrect table name and failed before mutation; corrected to seeker_credit_accounts and passed.
- Live permissions: private tables RLS enabled; anonymous SELECT and authenticated direct UPDATE denied; begin-review unavailable to authenticated role; confirmation available to authenticated role.
- Deployed HTTP OPTIONS204 and unauthenticated POST401: PASS.
- App Viewer check executed: guest landing only. Authenticated Swipe/dialog/mobile/RTL cannot be evaluated from that screenshot. No authentication bypass, synthetic card evidence or unjustified second viewer check.

## Twenty requested acceptance checks
All rows below distinguish supporting automated evidence from actual authenticated portal acceptance, which remains blocked/unexecuted.

| # | Requested workflow | Evidence / remaining limit |
|---|---|---|
|1|Company publishes vacancy|required fields/existing2 open rows inspected; actual Company publish action NOT RUN.|
|2|Seeker opens vacancy in Swipe|real job pipeline wired; signed-in rendered card NOT RUN.|
|3|Improve My Match visible|both active components wired; signed-in visibility NOT RUN.|
|4|Correct missing skills|unit direct comparison PASS; live provider and authenticated review NOT RUN.|
|5|No duplicated listed skills|normalization and rollback SQL PASS; portal NOT RUN.|
|6|Select suggestions|checkbox/source contract present; real user interaction NOT RUN.|
|7|Genuine confirmation required|UI guard and server rejection PASS; portal NOT RUN.|
|8|Selected skills saved to Supabase|rollback-only merge/readback PASS; committed user save NOT RUN.|
|9|Profile Skills reflects additions|same canonical column; authenticated Profile refresh NOT RUN.|
|10|Actual-engine score recalculated|existing engine tests PASS; signed-in delta NOT RUN.|
|11|No artificial increase|irrelevant/preferred-only addition unit score unchanged PASS; portal NOT RUN.|
|12|Mandatory qualifications not bypassed|credentials nonselectable, no credential/action writes; existing eligibility unchanged, actual employer review NOT RUN.|
|13|Close without changes|close invalidates review state, no save path; real close/gesture acceptance NOT RUN.|
|14|Pass/Save/Apply remain functional|canonical action handlers untouched; current-request committed actions NOT RUN.|
|15|No AI review credits|source and rollback canonical account equality PASS; signed-in balance observation NOT RUN.|
|16|Mobile/desktop share skills|shared canonical read/save path; cross-device acceptance NOT RUN.|
|17|Layouts intact|small insertion, independent layouts retained; authenticated widths/short heights NOT RUN.|
|18|AI failure does not block Swipe|fallback/error/close path implemented, action handlers independent; signed-in failure simulation NOT RUN.|
|19|EN/AR works|all new product copy bilingual, RTL dialog; actual Arabic device/keyboard/visual acceptance NOT RUN.|
|20|Company/Admin unaffected|no Company/Admin source or business function changes; authenticated regression NOT RUN.|

## Known limitations and release gate
- OpenAI key skipped; no live provider completion claimed. Structured fallback is the currently available feature path when the key is absent.
- Existing vacancy schema has no preferred_skills field: preferred skills are identified only from explicit employer text. Existing engine scores structured required skills, not extracted preferred skills; adding a preferred suggestion can legitimately produce zero change.
- Score is compatibility, not a professional-license/education eligibility certification. Existing mandatory profile/action checks remain; this feature adds no qualification bypass and no new credential-verification engine.
- Resume analysis uses existing stored extracted fields only; no new PDF/DOCX extraction was implemented. Existing CV extraction limitation remains.
- Manual SQL role claims and rollback fixtures test server contracts, not real signed-in browser sessions or concurrency under load.
- Full success condition remains unverified pending a genuine signed-in Company→published vacancy→Seeker review/confirmation/save workflow and mobile/desktop EN/AR acceptance.
