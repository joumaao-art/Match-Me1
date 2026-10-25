# Job Seeker Settings Appearance Report

## Implemented
- Added the same compact EN/AR Appearance → Theme radio control to existing mobile and desktop Job Seeker Settings: Light Mode/Sun, Dark Mode/Moon, System Default/Monitor.
- Removed the active desktop Job Seeker sidebar theme icon and its toggle state. Language control, five-item navigation order, footer, widths and Profile/mobile navigation remain unchanged.
- Reused the existing light/dark application function and unchanged CSS tokens. System Default resolves the operating-system preference and listens for changes.
- One canonical preference: `job_seeker_profiles.account_settings.theme`. The existing authenticated, row-locked, conflict-safe `update_seeker_account_settings` RPC now accepts only light/dark/system for the theme key; existing language/notification validation and merge behavior are preserved. No tables, columns or duplicate preferences were created.
- Owner-scoped local cache is applied before runtime configuration and React rendering. Server preference is authoritative on loading, focus, visibility changes, same-browser storage notifications and periodic refresh. Saved legacy local choices migrate only when the server lacks an explicit theme; accounts without an explicit choice use System Default.
- Immediate visual application is distinguished from confirmed server persistence. Failed/conflicting saves show an error and reconcile the server value; they do not falsely mark the selection saved.
- Synchronization is mounted globally but only activates for authenticated Job Seekers, including onboarding and subscription routes. Owner changes/sign-out invalidate pending responses and restore the prior guest/non-seeker appearance. Company/Admin theme behavior and authentication logic were not rewritten.

## Changed implementation
- New shared Job Seeker Appearance UI, synchronization component and account-owned preference service.
- Existing mobile/desktop Support Settings mount the shared control.
- Desktop Job Seeker navigation removes only its standalone theme control.
- Application initialization mounts the scoped synchronizer and applies cached seeker appearance before rendering.
- Existing app-store theme application function is exported without changing its behavior.
- Existing Supabase settings RPC extended for the theme key; no user records changed during development.

## Validation
PASS: 30 theme source/unit checks plus 37 navigation checks (67 total), TypeScript, lint and production build.

Tests cover Light/Dark/System resolution, OS changes, server authority, owner cache isolation, acknowledged persistence, failed-write reconciliation, legacy migration, preservation of unrelated settings, Company save rejection, shared Settings mounting and unchanged navigation. Twelve protected baselines cover authentication, theme tokens, Company/Admin navigation, Profile layouts, mobile bottom tabs, onboarding and credit/subscription logic. The app-store baseline permits only exporting the existing application function.

Database inspection confirmed the existing account-settings JSON column, owner RLS and settings RPC. The deployed RPC definition was read back and verified to include the theme whitelist and validation. No live authenticated account save or two-device synchronization test was performed.

## Running viewer evidence
The actual viewer check rendered the guest landing page, not authenticated Job Seeker Settings. Its visible public-header moon icon belongs to the existing logged-out theme behavior and is intentionally preserved; it is not the removed Job Seeker sidebar icon.

Authenticated mobile/desktop Settings interaction, theme readability across all protected screens, actual refresh/login/cross-device persistence, Arabic layouts and visible initialization flashing remain BLOCKED/unverified. Automated source/unit checks do not substitute for those acceptance tests. No claim that protected App Viewer tests passed is made.

Review Settings → Appearance in authenticated mobile and desktop App Viewer sessions before publishing. Existing CSS tokens are reused unchanged; screen-wide contrast and no-flash visual acceptance require that review.
