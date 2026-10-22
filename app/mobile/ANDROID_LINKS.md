# Android shared Swipe release preparation

## Implemented scope
The Expo Android project can render the canonical MatchMe mobile web experience in its native WebView by configuring `EXPO_PUBLIC_MATCHME_WEB_ORIGIN` to the actual HTTPS deployment origin. This intentionally reuses its real Supabase authentication, three tabs, Profile/Preferences, credit ledger, decisions, saved jobs, matching hooks, and mobile Swipe card rather than implementing another mock native recruitment system. No Supabase tokens are injected into pages. The WebView uses the canonical site's login/session; the older native scaffold remains the fallback when shared-screen configuration is absent.

Native cold/warm incoming `/jobs/:uuid` links persist the intended job in AsyncStorage until the canonical Swipe page confirms it opened. The site's own pending-job recovery handles login/signup/onboarding. Native Share passes only title, company, and a stable job URL through an origin-validated bridge. Hardware Back follows the WebView history. HTTPS navigation is restricted to the configured origin; external URLs open through the OS. OAuth returning from an external browser is not verified and is not claimed to share a WebView session automatically. Email/password auth remains inside the canonical app.

## External release inputs
- `EXPO_PUBLIC_MATCHME_WEB_ORIGIN`: real controlled HTTPS web origin, without a path/query.
- `MATCHME_ANDROID_PACKAGE`: actual published Android application identifier.
- `MATCHME_ANDROID_SHA256`: comma-separated actual SHA-256 app-signing fingerprints (use the Google Play app-signing certificate for store builds).
- `VITE_MATCHME_PLAY_STORE_URL`: actual Google Play listing, once available. Without it no download button appears.
- Expo 57 build environment with Node 22.13+ and actual Android build/device access.

The dynamic Expo config creates auto-verified HTTPS intent filters only when the origin and real package are configured. The frontend association preparation script rejects absent/invalid fingerprints and never generates a placeholder. Its output belongs at `/.well-known/assetlinks.json`, returned directly as JSON on the same origin. Serve `/jobs/:uuid` via the SPA fallback. Existing generated association output is not overwritten silently.

## Acceptance still required
Use a signed Android build, not Expo Go, to verify domain association, cold and warm links, signed-out login/signup continuation, already-passed/applied/expired/deleted/private jobs, native Share success/cancel, back navigation, app restart, RTL, and 320/360/375/390/412 plus short-height layouts. Test Company metadata create/edit/duplicate/delete and cross-device credits with representative persisted jobs. No native build/device or deferred-install link test has run here. Installation does not automatically carry browser storage into Android; no unsupported deferred-link claim is made.

## Current blockers
No real deployment domain/package/signing fingerprints/store listing were supplied or discovered. The environment runs Node 20.11, below Expo 57's documented minimum. Dependency installation also reported 33 audit vulnerabilities in the native dependency tree; no blind breaking dependency upgrade was performed. Native release remains pending. iOS publishing/universal links are not implemented: no existing published iOS application has been established, and iOS app generation is unsupported in this environment.
