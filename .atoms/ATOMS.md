---
last_updated: 2026-10-25
status: active
---

# Project Context

## Project Overview
MatchMe is an EN/AR React/Vite/shadcn recruitment app using existing Supabase project ykvlaakotyouojkdydzh. Active request: attachment paste-text (18), VIA AI Skill Match Assistant on real Job Seeker Swipe cards, mobile and desktop. Implementation and secure Supabase endpoint delivered; available validation passed, but live AI (key skipped) and authenticated acceptance remain unverified.

## Key Decisions
| Decision | Rationale |
|---|---|
| Preserve Supabase and unprefixed canonical tables | Existing auth/data/history remain; no new backend/template or parallel profiles/applications. |
| Optional explicit assistant | Compact Improve My Match opener; never auto-open, deduct credits or block Pass/Save/Apply/Share. |
| Canonical skills only | Merge genuinely confirmed selected skills into job_seeker_profiles.skills; preserve existing, normalize/deduplicate, authenticate and validate server-side. Preferences are not skills storage. |
| Hybrid requirement analysis | Structured deterministic first; runtime gpt-5.4 only where unstructured extraction/equivalence/evidence/explanations need it; backend cache/rate limits/privacy/fallback. |
| Real matching score | Existing matching engine computes old/new scores; no fixed or guaranteed increase, no credentials inferred or mandatory qualifications bypassed. |
| Independent mobile/desktop | Maintain existing layouts and gestures; shared business logic, EN/AR and RTL. Company/Admin behavior protected. |
| Existing mobile authority | Desktop seeker functionality follows canonical mobile rules, independently laid out. |
| Existing credit/payment authority | Signup20 once; canonical ledger/actions and provider-verified premium entitlement only. Do not alter billing. |
| Prior UI improvements preserved | Mobile natural Personal scrolling, scoped icon accessibility, confirmed date wheels, canonical account_settings.theme, three mobile tabs and five desktop sidebar destinations. |
| Honest acceptance evidence | Real Company→published vacancy→authenticated Seeker required; guest viewer/source tests never substitute authenticated acceptance. |

## Constraints
- Active attachment requires matched/missing/potentially demonstrated skill categories; Required/Preferred labels, reasons and profile evidence; initial five and View More only when needed; explicit genuine-skills confirmation before save.
- Refresh canonical profile, real current-card score, recommendations/completion without account/job races or fake success.
- Preserve auth, canonical history/CV, credits, actions, Share/details, gestures, desktop and Company/Admin.
- Runtime backend guides must be read before implementation; existing Supabase remains selected despite Atoms Cloud inactive status.
- Preview is platform-managed; no browser diagnostics during implementation. New request has zero UI checks used; maximum two per request under stated rules.
- Inherited blockers: approved legal text absent, earlier Stripe configuration503, skipped reverse-geocoding token, TXT-only automatic CV extraction; do not certify broader release.
