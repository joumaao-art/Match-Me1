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

## Constraints
- Color Palette: Primary #2563EB, Secondary #3B82F6, Background #F8FAFC, Text #1E293B, CTA #F97316
- Typography: Poppins (headings), Open Sans (body)
- Mobile-first responsive design
- Full RTL support for Arabic
- Clean, minimal UI inspired by LinkedIn/Tinder/Linear
- Dark mode support
- Max 8 code files (strategic file organization)
- Platform Architecture Charter (Prompt 0) governs all development — see docs/enterprise/PlatformArchitectureCharter.md


