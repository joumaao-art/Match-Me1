---
last_updated: 2026-07-17T21:21:26Z
status: active
---

# Project Context

## Project Overview
MatchMe - AI-powered recruitment platform with Tinder-style swipe matching. Bilingual (EN/AR), mobile-first, Supabase backend.

## Key Decisions
| Date | Decision | By | Rationale |
|------|----------|-----|-----------|
| 2026-07-17 | Use Supabase for backend | Alex | User explicitly requested Supabase |
| 2026-07-17 | React web app (not Flutter) | Alex | Platform supports React web, mobile-first responsive |
| 2026-07-17 | Blue accent on white, Poppins/Open Sans | Alex | User specified clean white + blue, design system recommendation |
| 2026-07-17 | i18next for internationalization | Alex | Industry standard for React i18n with RTL support |
| 2026-07-17 | Zustand for state management | Alex | Lightweight, TypeScript-first, persist middleware for auth/settings |
| 2026-07-17 | Repository/Service pattern | Alex | Decouples UI from data layer, testable, swappable backends |
| 2026-07-17 | Expo for mobile app | Alex | User requested React Native/Expo, cross-platform Android support |
| 2026-07-17 | Shared architecture across web+mobile | Alex | Same patterns (services, stores, types) for consistency |
| 2026-09-21 | Engineering language is English; product localization stays EN + AR | Alex | Requested cleanup: classify all Han occurrences, translate accidental engineering text, keep Arabic localization and signup behavior intact. Policy: docs/enterprise/EngineeringLanguagePolicy.md; enforced by scripts/check-cjk-engineering-text.mjs (pnpm run check:language), which flags Han only so Arabic is never touched |
| 2026-09-21 | Locale native display names are approved reference data | Alex | The supported-languages registry and the language reference table list each locale by its own native name; these 4 occurrences are the only Han text in project-owned files and are explicitly approved with reasons in the validator |
| 2026-09-21 | One completion authority for Job Seeker accounts: `ensureJobSeekerInitialized` | Alex | The completion flag was WRITTEN by the local onboarding mirror and READ from the database by the dashboard guard. For a partially initialized account (no `user_profiles` row) `completeOnboarding` is an UPDATE matching zero rows that still reports success, so the two sources disagreed permanently and bounced the user between /seeker and /seeker/onboarding, one full-screen loader per hop — the reported "Get started"/"Dashboard" hang. The shared authority now repairs the account rows and returns the destination in one operation, so writer and reader can no longer disagree |

## Constraints
- Color Palette: Primary #2563EB, Secondary #3B82F6, Background #F8FAFC, Text #1E293B, CTA #F97316
- Typography: Poppins (headings), Open Sans (body)
- Mobile-first responsive design
- Full RTL support for Arabic
- Clean, minimal UI inspired by LinkedIn/Tinder/Linear
- Dark mode support
- Max 8 code files (strategic file organization)
- Platform Architecture Charter (Prompt 0) governs all development — see docs/enterprise/PlatformArchitectureCharter.md
- Enterprise Engineering Standards (Prompt 1) define implementation standards — see docs/enterprise/EngineeringStandards.md
- Design System Specification (Prompt 2) defines all visual/UI standards — see docs/enterprise/DesignSystemSpecification.md
- Component Library Specification (Prompt 3) defines component architecture & philosophy — see docs/enterprise/ComponentLibrarySpecification.md
- Platform Engines Specification (Prompt 4) defines engine architecture & domains — see docs/enterprise/PlatformEnginesSpecification.md


