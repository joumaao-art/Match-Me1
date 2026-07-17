---
last_updated: 2026-07-17T21:21:26Z
---

# Requirements & Progress

## Requirements Overview
Build MatchMe - an AI-powered recruitment platform with swipe-based matching between Job Seekers and Companies. Bilingual (EN/AR with RTL), mobile-first, Supabase backend.

## User Stories
- As a Job Seeker, I can create a profile, upload CV, and swipe through job matches
- As a Company, I can post vacancies, view matched candidates, and manage hiring pipeline
- Both roles can message each other after mutual match
- Premium subscriptions unlock additional features via Stripe

## Task Breakdown
- [x] Set up Supabase client, auth context, and i18n (EN/AR with RTL)
- [x] Build role selection, login/register, and auth flows
- [x] Build Job Seeker onboarding profile creation
- [x] Build Company onboarding profile creation
- [x] Build Company job posting and vacancy management
- [x] Build swipe-based job discovery for Job Seekers
- [x] Build matching algorithm (edge function) - prepared client-side, edge function ready when Supabase connected
- [x] Build Company candidate dashboard with accept/reject
- [x] Build real-time messaging between matched users
- [x] Build subscription system with Stripe integration

## Progress Log
- 2026-07-17: Project initialized with Supabase template, dependencies installed
- 2026-07-17: All frontend pages built - Landing, Auth, JobSeeker (swipe+dashboard), Company (dashboard+vacancies+candidates+analytics), Messages, Subscription
- 2026-07-17: Build passes, CheckUI grade 4/5

