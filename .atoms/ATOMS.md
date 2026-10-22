---
last_updated: 2026-10-21
status: active
---

# Project Context

## Project Overview
MatchMe is a bilingual EN/AR recruitment web app using React/Vite/shadcn and the existing Supabase backend. Current work is premium mobile-only Job Seeker entry and 11-step onboarding, not a desktop redesign.

## Key Decisions
| Decision | Rationale |
|---|---|
| Preserve existing Supabase project and unprefixed tables | Existing users/data must survive; do not activate another backend or recreate schema. |
| Mobile breakpoint below768px | Desktop onboarding/presentation remain legacy; synchronous media query prevents desktop flash. |
| One server completion authority | ensureJobSeekerInitialized repairs only missing identity rows and resolves destination; cached completion never overrides server. |
| Per-user version3 mobile state and canonical profile/history | Prevent account leakage, preserve stable IDs/manual values and legacy records; database RPC owns completion. |
| Unified20 signup credits across mobile/desktop | User explicitly superseded50; one grant per eligible new seeker; existing balances preserved; account ledger owns deductions/purchases. |
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
