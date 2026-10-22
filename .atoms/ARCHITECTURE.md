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
| Desktop freeze | Separate mobile onboarding; existing desktop structure retained, shared credit policy corrected to20 |
| Persistence | Server owns completed steps; per-user local draft recovery, revision guard, mounted/account/request guards |
| History safety | Server wrapper rejects foreign history UUIDs before internal canonical writes |
| Purchase safety | Configured server price; app/product/user/paid amount validation; browser cannot call grant RPC |
| Migrations |012 additive mobile/credit schema,013 server integrity/live actions,014 foreign-history and nullable purchase hardening |
| Deployment artifacts | App-prefixed function directories contain deployed source; credit-payments directory contains readable equivalent implementation |

## Validation / Limitations
- Latest22 pure contract checks, TypeScript, lint and production build passed.
- Rollback-only SQL checks cover credit replay, step validation/completion, RLS and history ownership;35 accounts/350 balance preserved.
- Only desktop homepage UI inspected; mobile widths/RTL/signed-in A–W, concurrent device behavior and real Stripe lifecycle unexecuted.
- Approved legal absent; Stripe setup missing; Mapbox skipped; CV automatic extraction TXT-only.
- Broader legacy demo subscription/dashboard/Company surfaces not certified by this onboarding implementation.
