# Personal Information Implementation Report

## Implemented

Job Seeker → Profile → Personal now uses one shared form/save contract on mobile and desktop, with exactly four ordered categories:

1. **Identity:** Title (Dr., Mr., Mrs., Ms.; Select title placeholder), mandatory Legal First Name, Legal Last Name and Birthday.
2. **Contact:** registered read-only Email, international Mobile with searchable calling codes, and Address with searchable dependent Country/City plus preserved existing address details.
3. **Compensation:** optional Current Compensation, stored as one nullable record containing amount, standardized currency code and monthly/annual frequency. Searchable international currencies, currency-dependent decimal precision, editing and explicit clearing are supported.
4. **Gender:** mandatory Male, Female or Prefer not to say.

Mobile retains the existing Profile shell, three-tab navigation, safe-area clearance, full-width Save and established day/month/year scrolling birthday picker. Desktop retains its existing sidebar, profile page, typography, max-width and card/form styling, adds a reachable Personal entry, and uses native date entry with desktop field columns. The new desktop Personal route no longer falls through to Swipe. Back to Profile is reachable.

Both platforms load the same existing Supabase Job Seeker profile and authenticated email. Unicode names are supported and trimmed. Calendar/future/100-year birthday validation follows existing mobile onboarding policy; the shared age calculation is reused. Country-specific phone validation is reused, and verified login phones remain read-only because the current project has no secure phone-change flow. Email is not changed through a profile update.

One Save validates mandatory fields, sends only modified fields through the existing owner-authorized `update_mobile_personal` RPC, detects stale-field conflicts, prevents duplicate requests, checks backend confirmation and retains draft edits on failure. Opening the form makes no profile write. Address details and unrelated phone data are not overwritten by other edits.

## Canonical data and privacy

Applied additive migration 023: nullable `title` (text) and `current_compensation` (JSONB) on the existing `job_seeker_profiles` table, with title and currency/amount/frequency constraints. No duplicate profile table, backfill, saved-value reset, authentication/onboarding reset, subscription or Company/Admin data change was made.

The existing owner-only RLS remains enabled. Company applicant projections still exclude Gender and Current Compensation; no public or other-seeker access was added. Compensation is not used by VIA Resume generation, onboarding, completion or matching code. Missing/present compensation produces the same mandatory completion checklist. The field has no assumed default currency. Existing offered/expected salary structures are unchanged.

## Files changed

- `src/components/seeker/PersonalInformation.tsx`: shared form and desktop Personal shell.
- `src/services/personal-information.ts`: canonical draft, patch, validation and shared save.
- `src/services/mobile-account.ts`: nullable canonical Title/Compensation types.
- `src/components/seeker/MobileProfileAccount.tsx`: mounts shared form; superseded Personal implementation removed.
- `src/components/seeker/ProfessionalProfile.tsx`: desktop Personal entry; existing editor/layout retained.
- `src/pages/JobSeeker.tsx`: desktop Personal route.
- `src/components/shared/ProfileFields.tsx`: exports existing searchable combobox for currency reuse.
- `supabase/migrations/023_personal_categories.sql`: additive migration and extended existing RPC.
- `scripts/personal-information-contract.mjs`: focused contracts.

## Validation performed

- **PASS:** 28 Personal unit/static/service contracts, 24 existing Profile contracts, 21 Logout contracts and 35 navigation contracts (108 total). Mocked service tests are not live browser persistence evidence.
- **PASS:** TypeScript, ESLint and production build. One unnecessary regex escape found by lint was corrected before final successful validation.
- **PASS:** deployed schema checkpoint confirms nullable fields, constraints, owner-only RLS and unchanged Company projection.
- **PASS:** live rollback-only backend save/readback/edit/clear, unchanged phone/address/preferences/CV/plan, stale-field conflict rejection, prohibited email update, invalid/future birthday rejection, required gender, monetary validation, non-seeker rejection, no duplicate profile and authenticated foreign-row isolation. Test profile changes were rolled back; no test compensation/title remains committed.
- **Viewer limitation:** the actual running viewer showed only the guest MatchMe landing. It did not expose signed-in mobile/desktop Personal. No bypass, fabricated session or authenticated PASS claim was added.

## Running application acceptance

Every result below concerns actual authenticated App Viewer execution, not static/unit/backend evidence.

| # | Test | Result |
|---|---|---|
| 1 | Identity first | BLOCKED |
| 2 | Four Title options | BLOCKED |
| 3 | Legal First Name loads/saves | BLOCKED |
| 4 | Legal Last Name loads/saves | BLOCKED |
| 5 | Birthday loads/saves | BLOCKED |
| 6 | Contact second | BLOCKED |
| 7 | Email loads and secure-change rules | BLOCKED |
| 8 | Saved Mobile calling code/number | BLOCKED |
| 9 | Country/City dropdown interaction | BLOCKED |
| 10 | Compensation third | BLOCKED |
| 11 | Current Compensation optional | BLOCKED |
| 12 | Currency/amount/frequency save | BLOCKED |
| 13 | Compensation edit/clear | BLOCKED |
| 14 | Missing compensation does not affect displayed completion | BLOCKED |
| 15 | Gender fourth | BLOCKED |
| 16 | Three Gender options | BLOCKED |
| 17 | Existing values preserved in rendered form | BLOCKED |
| 18 | Persistence after refresh/logout/login | BLOCKED |
| 19 | Mobile/desktop rendered data consistency | BLOCKED |
| 20 | Existing mobile/desktop layout preservation | BLOCKED |
| 21 | English/Arabic interactive rendering | BLOCKED |
| 22 | Authenticated loading/navigation regressions | BLOCKED |

All 22 browser tests are blocked by guest-only viewer access. Available automated and rollback-only backend validation passed; authenticated device layout, taps, refresh/relogin and cross-platform acceptance remain unverified.
