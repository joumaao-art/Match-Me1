---
last_updated: 2026-10-21
---

# Architecture Design

## System Overview
MatchMe React/Vite/shadcn with existing Supabase Auth, PostgreSQL/RLS, Storage and Deno Edge Functions. Preserve project ykvlaakotyouojkdydzh and unprefixed production tables.

## Module Design
| Module | Responsibility |
|---|---|
| Existing auth/routing | App, Auth, Index, signup initialization; server completion authority and account-keyed mobile dispatch below768 |
| Mobile onboarding | Version3 semantic registry, exact eleven steps, validated drafts, serialized snapshot saves, completion/back navigation and retry |
| Shared controls | Intentional wheels, bounded search/chips, worldwide dependent location selector, exact EN/AR taxonomies |
| Canonical profile | Education/experience stable UUIDs and owner RLS; existing profile/history adapters |
| Preferences | Roles/keywords/styles/types/seniority distinct soft ranking signals; mobile work types limited to four |
| Credits | Account + ledger; row-locked signup20/deductions; idempotent operation keys and service-only verified purchase |
| Discover | Live vacancies + seeker_job_actions; atomic debit/application, saved/pass/undo/withdraw actions, actual Share/details |
| Payments | app_91d3436dfc_credit_payments; authenticated catalog/checkout/verify and signed webhook; configuration currently blocked |
| Location | app_91d3436dfc_reverse_location; authenticated Mapbox backend lookup; manual fallback when unavailable |

## Tech Decisions
| Decision | Choice / constraint |
|---|---|
| Shared parity services | Independent desktop/mobile shells share profile, preferences, Dashboard, onboarding and account-owned credit/subscription contracts; no duplicate accounts/applications/entitlements. |
| Communications | Migrations024–025 reference canonical applications; Company-first participant RPCs, lifecycle checks, retry keys, RLS and real in-app notifications. |
| Conflict-safe account edits | Migrations023/026–029 implement owner-locked skills/settings/profile/history base comparisons, coherent onboarding snapshots and revision guards; hidden legacy fields retained. |
| Desktop freeze | Separate desktop/mobile presentation around one onboarding controller; existing desktop navigation/cards/native dates retained |
| Persistence | Server owns completed steps; per-user local draft recovery, revision guard, mounted/account/request guards |
| History safety | Server wrapper rejects foreign history UUIDs before internal canonical writes |
| Purchase safety | Configured server price; app/product/user/paid amount validation; browser cannot call grant RPC |
| Migrations |012 additive mobile/credit schema,013 server integrity/live actions,014 ownership/purchase hardening,015 mobile field preservation and idempotent initial-credit trigger/repair |
| Date wheels | Fixed44px block rows and spacers, stable controlled option-value synchronization, ascending unique years, direct calendar serialization; mobile architecture only |
| Deployment artifacts | App-prefixed function directories contain deployed source; credit-payments directory contains readable equivalent implementation |

## Validation / Limitations
- Current complete-parity round: TypeScript,216 contracts plus manifest/static readiness/save guards, lint and2818-module build PASS; Auth circular chunk warning removed.
- Migrations023–031 preserve existing canonical tables/accounts/ledger/entitlements. Authenticated rollback-only tests cover account/history/portfolio/optional conflicts, Company-first communications/interview lifecycle/isolation and notification suppression; fixtures were not committed.
- One current rendering check reached only the desktop guest homepage. Required signed-in EN/AR mobile320/360/375/390/412 and desktop1024/1280/1440/1920, reciprocal cross-device writes and actual CV/PDF-reader acceptance remain BLOCKED.
- Official support chat/email, secure login-phone change/deletion and directory/private-media/analytics capabilities lack complete configured contracts. No simulated success or release-ready claim.
- Real provider/native billing acceptance remains blocked; historical503 is not a current probe. CV automatic extraction remains TXT-only.
- English14-section parity report distinguishes source/SQL/contracts from real browser evidence; complete100% parity is not certified.
