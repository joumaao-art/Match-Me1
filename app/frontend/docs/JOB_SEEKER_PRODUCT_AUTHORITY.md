# Job Seeker Product Authority

For Job Seeker features, mobile is the authoritative product reference. Desktop must follow mobile functionality while retaining its independent desktop layout.

## Permanent change-control standard
- Inspect the current mobile implementation, not historical desktop specifications, before changing Job Seeker features.
- Define or implement a feature against mobile first; provide equivalent desktop fields, validation, actions, eligibility and persistence.
- Keep platform-specific presentation: mobile bottom navigation and compact controls; desktop sidebar, cards, grids and native forms.
- Do not introduce desktop-only Job Seeker functionality without explicit approval, or restore retired legacy presentation.
- Preserve one canonical Supabase backend and account data. No duplicate mobile/desktop records, browser-owned entitlements, generated production jobs or destructive cleanup.
- Audit shared components/services for both platforms. Report mobile defects separately; do not silently copy defects or change mobile to accommodate desktop.
- Each change must include a parity matrix, source preservation checks, desktop functional acceptance and mobile regression evidence. State PASS, FAIL or BLOCKED; source checks cannot substitute for signed-in browser tests.
- Company and Super Admin are excluded unless separately approved.

## Current integration
Primary destinations are Swipe, Dashboard and Profile. Applications/Saved/Skipped live within Dashboard; original CV, VIA Resume, Personal and subscriptions within Profile. Preferences opens from Swipe or Settings; Experience/Education/Certificates/Skills/Languages and current mobile privacy tools remain in Settings. Retired desktop bookmarks redirect without deleting records.

## Billing purchase path
Desktop Swipe Credits dialog → `/seeker/subscription` → existing `createCheckoutSession` / `create_payment_session` provider boundary → original success/cancel return carrying `via_session` / `via_cancelled` → existing `verifyPayment` / `verify_payment`. Only backend/provider verification owns Premium. Current monthly/yearly catalog, welcome allocation, Pass deductions and Apply exemption are unchanged.
