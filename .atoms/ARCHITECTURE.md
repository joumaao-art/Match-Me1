---
last_updated: 2026-07-17T21:21:26Z
---

# Architecture Design

## System Overview
MatchMe is a bilingual (EN/AR) recruitment platform with swipe-based job matching. Frontend is React + TypeScript + Tailwind + Shadcn/ui. Backend is Supabase (Auth, Database, Storage, Edge Functions, Realtime).

## Tech Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- State: React Context + TanStack Query
- i18n: react-i18next with RTL support
- Payments: Stripe (via Supabase Edge Function)
- Animations: Framer Motion (swipe gestures)

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| Auth | Login, Register, Role selection | src/pages/Auth.tsx |
| i18n | Translations, RTL switching | src/lib/i18n.ts |
| Supabase | Client, types, helpers | src/lib/supabase.ts |
| Job Seeker | Profile, Swipe, Dashboard | src/pages/JobSeeker.tsx |
| Company | Profile, Vacancies, Candidates | src/pages/Company.tsx |
| Messaging | Real-time chat | src/pages/Messages.tsx |
| Matching | Score display, match logic | Edge function |
| Subscription | Plans, Stripe checkout | src/pages/Subscription.tsx |

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | Supabase Auth | Built-in email/password, JWT, session management |
| Database | Supabase PostgreSQL | Relational, RLS, real-time subscriptions |
| Storage | Supabase Storage | CVs, logos, profile photos |
| i18n | react-i18next | Mature, supports RTL, namespace separation |
| Swipe UX | Framer Motion | Smooth gesture animations, spring physics |
| Payments | Stripe via Edge Function | Secure server-side, supports Apple/Google Pay |

## File Tree Plan
```
src/
├── lib/
│   ├── supabase.ts        # Supabase client + types
│   └── i18n.ts            # i18n setup + translations
├── pages/
│   ├── Index.tsx          # Landing page
│   ├── Auth.tsx           # Login/Register/Role selection
│   ├── JobSeeker.tsx      # Job Seeker dashboard + swipe
│   ├── Company.tsx        # Company dashboard + vacancies
│   ├── Messages.tsx       # Real-time messaging
│   └── Subscription.tsx   # Plans + Stripe checkout
├── App.tsx                # Router + providers
└── index.css              # Theme + global styles
```

## Implementation Guide
1. Set up Supabase client and i18n with EN/AR translations
2. Build auth flow with role selection (Job Seeker / Company)
3. Build onboarding flows for both roles
4. Build swipe interface for Job Seekers
5. Build company dashboard with candidate management
6. Build messaging (Supabase Realtime)
7. Build subscription with Stripe
8. Create matching algorithm edge function

