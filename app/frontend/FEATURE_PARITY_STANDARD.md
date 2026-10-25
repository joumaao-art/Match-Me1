# MatchMe permanent feature parity standard

Any Job Seeker capability introduced on mobile must have equivalent functionality on desktop, and vice versa, unless a specific platform limitation is documented with a supported alternative.

## Required implementation review
- Use the existing Supabase identity, tables, services and authorization rules. Never duplicate application records, credit accounts or subscription entitlements by device.
- Define one validation and data contract before implementing independent platform presentations.
- Preserve mobile Swipe/Dashboard/Profile navigation, safe areas, gestures and green Preferences Save; preserve desktop sidebar, cards, forms and inline Save.
- Require confirmed backend acknowledgement before success. Expose bounded retry, conflict recovery and unavailable-provider states; never fabricate uploads, payments, messages, invitations or analytics.
- Preserve hidden legacy fields and stable record IDs. Changed-field/base comparisons must reject concurrent conflicting edits.
- Clear account-scoped UI/cache on identity changes. Verify owner isolation and Company/Admin permissions without weakening RLS.
- Runtime AI and billing remain server-owned. Build-time PDF generation uses the same saved account/history data on both platforms.

## Required acceptance evidence
For each feature record mobile entry, desktop entry, shared service/RPC, permission requirement, synchronization trigger and evidence status in the parity acceptance manifest.

Run `pnpm run check:parity`, TypeScript, lint and production build. Static/pure contracts do not establish browser acceptance. Run rollback-only authenticated-role database integration checks separately.

Actual signed-in EN/AR acceptance must cover mobile widths 320/360/375/390/412 and desktop widths 1024/1280/1440/1920: navigation, overflow, controls, dialogs, account switching, cross-device writes/readback, credits, verified Premium, original CV and equivalent VIA PDF content. Record PASS, FAIL or BLOCKED with exact evidence; never infer PASS from source inspection or guest rendering.

## Documented platform/dependency boundaries
Configured Auth providers only; private video/avatar storage and directory privacy modes are not configured. Official support chat/email and verified phone-change/deletion workflows require real configuration. Messages/interviews use Company-first application authorization. Separate directory invitations and exposure analytics are not fabricated. Native store billing, actual Stripe lifecycle and PDF reader acceptance require independent release evidence.

This repository rule and its scripts govern repository review/validation only; they do not claim control over Atoms internal agent behavior.
