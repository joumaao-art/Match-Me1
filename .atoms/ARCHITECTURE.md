---
last_updated: 2026-10-25
---

# Architecture Design

## System Overview
Existing MatchMe React/Vite/shadcn frontend at /workspace/app/frontend; Supabase Auth/PostgreSQL/RLS/Storage/Deno Edge Functions in project ykvlaakotyouojkdydzh. Preserve canonical unprefixed production tables. Active VIA assistant is implemented; live AI and authenticated acceptance remain blocked.

## Module Design
| Module | Responsibility |
|---|---|
| Auth/routing | Existing apiClient.supabase singleton and account store; no second auth; mobile breakpoint below768. |
| Active Swipe | JobSeeker SwipeView passes actual currentJob to MobileSwipePage/DesktopSwipePage; legacy JSX after both returns is unreachable. |
| Vacancy/actions | seeker-jobs reads real open vacancies/company joins and canonical seeker_job_actions; recordJobAction sole atomic credit/action authority. |
| Matching | useMatchingEngine wraps shared matchingEngine.calculateCompatibility; SeekerProfile/VacancyProfile adapters needed in active flow; current DiscoverJob score mapping0. |
| Canonical profile | job_seeker_profiles.skills is actual skills authority; canonical-profile currently exposes history/basic fields but not skills. Education/experience owner rows; certificates/languages in professional_details. |
| Skill recommendations | deterministic-v2 provider separates extraction/comparison; explicit taxonomy/CRM equivalence, required-first recommendations, owner cached review and confirmed canonical merge. No external AI integration or keys. |
| Preferences | Independent canonical soft ranking signals; never store actual skills here. |
| Credits/billing | Existing account ledger, signup20, provider-verified subscriptions and canonical action RPC untouched. |
| Existing UI | Separate mobile/desktop, canonical theme/date controls, three mobile tabs, five desktop sidebar links; Company/Admin scoped out of seeker enhancements. |

## Tech Decisions
| Decision | Choice / constraint |
|---|---|
| Backend | Existing Supabase; connection checked. Full frontend README and backend SDK/edge guides still required in restored context. |
| Requirement priorities | DiscoverJob has required_skills but no preferred_skills contract yet; inspect live vacancy schema/text rather than invent priority. |
| Score weights | Existing skills.30/experience.15/location.15/salary.15/industry.10/language.08/availability.07; do not change global scoring or promise increase. |
| Assistant integrity | Auth owner, published/expiry checks, cached vacancy extraction, rate limits, minimized evidence/no PII; reject fabricated credentials and client-forged skill suggestions. |
| Refresh | Retain current card, guard account/job races, reload canonical skills and compute actual old/new engine scores; refresh relevant recommendations/completion. |
| Artifacts | Existing deployed functions use app-prefixed directories; location needs narrowly scoped discovery. Do not create parallel production data. |

## Validation / Limitations
- Active assistant:48 contracts/TypeScript/lint/build,11 rollback SQL checks, credit equality and deployed anonymous401/preflight204 passed. Viewer guest-only; twenty authenticated workflow checks and live provider completion unverified (key skipped).
- Prior source/contracts/lint/build and rollback-only SQL evidence do not establish authenticated browser or device acceptance.
- Preview historically opens guest landing; no authentication bypass or generated fixture cards for acceptance.
- Inherited missing legal/payment/geolocation configuration and TXT-only CV extraction remain outside current feature.
