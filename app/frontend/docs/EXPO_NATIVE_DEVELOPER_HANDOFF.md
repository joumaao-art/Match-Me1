# MatchMe — Updated Expo/React Native Technical Handoff

Date: 2026-10-25. This report supersedes the appearance-failure and native-chrome findings in the earlier compatibility report where explicitly noted below. Retain the existing hybrid architecture; do not rebuild the web app or substitute the dormant mock native screens.

## 1. Executive status

**COMPLETED:** narrow appearance regression assertion correction; complete appearance suite rerun; shared CV metadata validation and account-change safeguards; Android shell appearance synchronization source implementation; web regression/build/render validation; authentication/session audit.

**BLOCKED:** actual Android/iOS native compilation, signed builds, devices/emulators, authenticated web acceptance and cross-device live tests. No IPA/APK/AAB was generated or submitted.

**EXTERNAL DEVELOPMENT REQUIRED:** iOS enablement/configuration; secure native session architecture and provider callback continuation; native document/download integrations; native push; hinge/reserved-region integration where needed; approved native billing/restore/verification; signing/store setup and actual device testing.

No iOS-specific implementation, payment service, subscription logic, matching algorithm, allocation/prices, Supabase schema/RLS or production data was changed. Native functionality remains unverified, even where source improvements are complete.

## 2. Repository and active architecture

- Web source: `app/frontend`; React 18/Vite/shadcn/Tailwind; existing independent desktop/mobile candidate layouts, Company and Admin.
- Mobile source: `app/mobile`; package declarations Expo ~57.0.7, React Native 0.86.0, React 19.2.3; dependencies must be checked against the actual selected SDK/build image externally.
- Entry: `app/mobile/App.tsx` -> `src/screens/MatchMeSharedScreen.tsx` when a real HTTPS origin is configured. Otherwise a bilingual configuration error is rendered. The prototype navigator is not mounted.
- Dynamic config: `app/mobile/app.config.js`, Android-only, MatchMe name, default orientation, keyboard resize, backup disabled, real package validation and HTTPS `/jobs/` intent filter.
- Same existing Supabase project: `ykvlaakotyouojkdydzh`. Canonical existing unprefixed tables must remain authoritative. Session-specific tool prefixes are not permission to migrate production entities.
- Web auth: `src/services/api-client.ts`, `src/services/auth.service.ts`, `src/stores/auth.store.ts`, `src/App.tsx` and existing auth callback routes. Do not instantiate a competing native identity store without an approved session integration design.
- Canonical actions: existing job-action/credit authority; deterministic Improve My Match and current matching weights unchanged.
- Existing compact/native candidate layout retention and bounded Swipe/Dashboard/navigation remain in place. Wide desktop entry and Company/Admin are not forced into candidate mobile presentation.

## 3. Changes completed this round

### Appearance regression assertion — COMPLETED / PASS

The expected Profile hash matches the pre-Personal-scroll-fix source. The test now mechanically reverses **only** the approved Personal-only `overscroll-y-contain` class change for comparison with the original baseline. The application scrolling fix remains untouched, and baseline hashes were not regenerated. Existing narrow normalization of approved navigation changes remains.

All 30 appearance checks completed, covering Light, Dark, System, OS preference transitions, server authority through test doubles, owner cache isolation, acknowledged persistence, failed-save reconciliation, legacy migration, Company exclusion, EN/AR Settings controls, and protected source hashes.

### Android native chrome — COMPLETED SOURCE / BLOCKED DEVICE ACCEPTANCE

`app/mobile/src/lib/appearance-bridge.ts` installs one browser MutationObserver after WebView document load and reports the resolved root dark/light class. Payload contains only `{type:'appearance',theme:'light'|'dark'}`. It does not read, persist or transfer tokens, accounts, settings or files.

The native screen checks the message's origin against the configured web origin before accepting the whitelisted theme, then updates safe-area/error-background colors and contrast-aware Expo StatusBar text. Existing native Share and job-opened messages are retained.

A Light/Dark/System web preference continues to be resolved by the canonical web appearance system, not a second native setting. System preference changes depend on the generated Android/WebView environment propagating color-scheme correctly; this still needs device validation. Native initial load remains light until the page reports its resolved class; no no-flash startup guarantee. Existing root fallback/status bar remains intact. No system-navigation-bar integration or new native dependency was added.

### CV handling — COMPLETED / PASS IN ISOLATED TESTS

`src/lib/cv-file-validation.ts` rejects zero-length, invalid-size, unsupported-extension and explicitly contradictory MIME documents. The existing 10 MB maximum and PDF/DOC/DOCX/TXT formats are preserved. Empty MIME and generic `application/octet-stream` remain allowed with supported extensions because Android document providers can supply them. Filename/MIME validation is not content scanning or a substitute for backend/storage enforcement.

`profileService.uploadCV` revalidates the current authenticated owner after upload and before `attach_profile_cv`; a detected account change does not attach the uploaded object. `loadAccount`, `cvMetadata` and `cvLink` recheck authenticated ownership before returning results after asynchronous requests. Existing owner paths, short-lived signed URLs, upload/attach RPC and UI layouts remain intact.

No automatic deletion is attempted after ambiguous attachment failure: an uploaded but unattached object can remain. External cleanup must reconcile attachment outcome first and must never delete an attached CV. Client prechecks are defense-in-depth, not race-proof authorization; existing server RLS/RPC checks remain authority.

### Authentication and session audit — COMPLETED AUDIT / NATIVE INTEGRATION BLOCKED

The working singleton Supabase auth remains configured with `autoRefreshToken`, `persistSession` and URL session detection. Existing email/password, verification/recovery, Apple/Google redirect and phone OTP methods are preserved. No provider configuration or signup behavior was changed. The dormant native Supabase client is not a secure-session solution and is not mounted by the root.

A native WebView session currently relies on canonical web origin storage. It is not certified Keychain/Keystore persistence, and returning from an external OAuth browser does not automatically create a WebView session. Simply adding SecureStore to the unused native client would not solve the active hybrid session contract and could create conflicting identities. Therefore no insecure token bridge or speculative auth migration was introduced.

The existing auth initializer awaits role lookup inside the auth-state callback. External reviewers should assess callback/SDK lock behavior and account-generation guards in this existing flow before modifying it; this report does not assert a reproduced auth failure. Preserve the established initialization/timeout/onboarding contracts.

## 4. Validation evidence

| Suite/check | Result | Evidence boundary |
|---|---|---|
| Complete appearance regression | PASS — 30 | Source/unit, Supabase responses and OS preference are controlled test doubles |
| New CV/account/appearance browser bridge checks | PASS — 27 | Metadata rejection, upload/owner/error ordering, signed-link owner switch, isolated DOM observer Light/Dark and duplicate guard; native receiver wiring checked as source only |
| Personal scrolling preservation | PASS — 30 | Approved scrolling/Save/forms retained; account-service additions narrowly normalized against historical hash |
| Shared mobile resize contracts | PASS — 20 | Layout-policy/source, not physical folding |
| Seeker navigation | PASS — 37 | Three tabs, route semantics, EN/AR |
| Deterministic Improve My Match | PASS — 62 | No algorithm/credit/provider changes |
| Web lint and production build | PASS | `pnpm run lint && pnpm run build`, exit 0 |
| Available visual rendering | PASS | Guest desktop landing only; existing branding/layout coherent, no login bypass |
| Signed-in Settings/keyboard/RTL live acceptance | BLOCKED | No authenticated acceptance session executed |
| Android/iOS native compile and device tests | BLOCKED | No native build/test execution performed |

Total: **206 completed source/unit/DOM checks** across six suites. Expected error-path logs in the CV test were deliberate rejected operations, not production uploads. Supabase connection was confirmed; no live mutation, schema change or credential change was performed. Light/Dark/System behavior is verified in the completed isolated suite, not certified on physical devices or through real-account persistence.

## 5. Exact external EAS build work

Owner: authorized Expo/React Native release developer. Preserve existing source rather than initializing a replacement app.

1. Export/obtain the complete existing repository, including `app/frontend`, `app/mobile`, existing migrations/functions and docs. Do not export client-secret values or privileged backend keys. Deploy the canonical web experience to the real controlled HTTPS origin; the native app requires that site.
2. Work in `app/mobile`. Establish a Node/package-manager version supported by the selected Expo 57 build toolchain. Audit the existing dual package-lock/pnpm-lock situation and choose one canonical reproducible package-manager workflow; do not regenerate both independently. Verify installed dependency versions, native plugin compatibility and vulnerabilities without blind breaking upgrades.
3. Verify with Expo's supported dependency/doctor tooling. Resolve proven incompatibilities before building. Record the exact SDK, RN, Node, EAS CLI and Android/iOS build-image versions in release evidence.
4. Link the authorized Expo organization/project. Create `eas.json` for development, simulator/test and store builds, and configure the EAS project ID as required. It is currently not a verified release configuration. Add `expo-dev-client` only if choosing a development-client profile that actually needs it, using the SDK-compatible version.
5. Set real `EXPO_PUBLIC_MATCHME_WEB_ORIGIN` and `MATCHME_ANDROID_PACKAGE` in the appropriate build environment. The origin must be plain HTTPS, without credentials/path/query/hash. No service-role key may appear in `EXPO_PUBLIC_*`. The active shell uses the web site's canonical Supabase configuration.
6. External iOS engineer: enable the iOS platform in the existing dynamic config, add the real bundle identifier/team, associated domains, permission descriptions/entitlements and supported tablet/orientation/appearance configuration. Preserve Android overrides. Validate latest suitable Apple SDK/Xcode/EAS image for iPhone Duo; do not infer support from package declarations.
7. Configure Android upload signing and Play app signing. Host verified `assetlinks.json` using the real package and Play app-signing fingerprint on the controlled origin. External iOS engineer must generate/host AASA with the actual team/bundle identifier and supported paths. Serve these association files directly and preserve SPA fallback for application routes.
8. Build development/test artifacts first, then store AAB/IPA. Typical external workflow uses `eas build:configure`, `eas build --platform android --profile <chosen-profile>` and the equivalent `--platform ios`; profiles/credentials must exist first. These are handoff actions, not commands executed here or guarantees of success.
9. Retain build logs and artifact identifiers. A successful compile is only the build gate; execute real-device authentication/file/appearance/action tests before marking functionality complete.
10. Configure App Store Connect/Play Console submission identity and versions, upload to TestFlight/Play Internal Testing through an authorized release workflow, and keep public-store readiness separate from test-track availability.

## 6. Authentication/session integration tasks

**EXTERNAL DEVELOPMENT + PROVIDER ACCESS REQUIRED.**

- Decide one session ownership model for the hybrid shell and canonical Supabase site. Preserve identical users/accounts, RLS and callback role/onboarding authority. No independent admin/login system or duplicate user tables.
- Audit browser session persistence, refresh/expiry, logout, revoked-session handling, background/foreground and process termination in actual WebView builds.
- Implement secure native persistence only through an approved minimal bridge/adapter contract. Namespace by project/account, await readiness before auth bootstrap, validate page origin, whitelist message types, never log/broadcast tokens, clear on logout, avoid insecure AsyncStorage tokens, and retain browser behavior. Native session storage must be tested against the WebView cookie/local-storage model rather than installed on an unused client.
- Implement Apple/Google external-browser/native authentication continuation with state/nonce/PKCE handling appropriate to the chosen provider flow and Supabase SDK. Exchange codes in the correct environment; do not copy arbitrary browser tokens from incoming URLs into a page. Configure provider clients and Supabase redirect allowlists for real release identifiers.
- Preserve signup/login/onboarding recovery and pending-job continuation. Verify email verification/recovery and international phone OTP with the existing providers. Account linking/identity normalization must not create duplicate accounts.
- Add authorized message/application callback destinations where required; reject hostile/expired callbacks and external destinations. Test cold and warm links, signed-out continuation, account switches and private resources.

## 7. Native file handling and permissions

**SHARED VALIDATION COMPLETED; NATIVE PICKER/DOWNLOAD ACCEPTANCE BLOCKED.**

- Test the existing WebView HTML file chooser with PDF/DOC/DOCX/TXT from local/cloud document providers, cancellation, repeated selection, generic/empty MIME and large/empty files. If inadequate, implement a documented Expo DocumentPicker/FileSystem adapter with real files, not mock success.
- Keep all attachment storage owner-scoped and server-authorized; derive attachment owner from verified Supabase identity. Do not expose CVs publicly or pass unrestricted signed URLs to untrusted bridge messages.
- Implement truthful progress/cancel/error handling where the native transfer API supports it; do not simulate percentage progress. Recheck account/attachment generation before displaying results.
- Implement native save/share/preview of original signed CVs and generated VIA PDF blobs. Current shell allows external HTTPS/mailto/tel only; native blob/download handling is not complete. Constrain MIME, filename, size, trusted origin and transfer limits, expire temporary files and clean them safely.
- Reconcile orphan uploads after known RPC failure without deleting attached documents; retry ambiguous operations only after confirming their result.
- Do not request broad storage/camera/photo permission for document picking without an API need. Add camera/photo permissions only for an existing approved capture feature. Inspect generated manifests and iOS purpose strings on the selected SDK; no unrelated permission prompts.

## 8. Notifications

**NOT IMPLEMENTED — real native push pipeline.**

- Audit existing actual backend events for messages, application changes, interviews and relevant alerts; isolate/remove inherited demo notification seeding from production through an approved targeted change.
- Install SDK-compatible Expo notification support, configure real EAS project/APNs/FCM credentials, channels and runtime permissions, then register owner-scoped device tokens.
- Handle token rotation/logout/account switch, permission denial/revocation and stored preferences. Use event idempotency/deduplication so multiple devices or repeated deliveries do not generate duplicate notifications/actions.
- Add secure server-owned delivery and authorized deep links; never treat browser Notification permission or local demo notifications as native delivery evidence.
- Validate foreground, background and terminated-state delivery on actual release-like builds. Do not add a paid provider without approval.

## 9. Billing, subscriptions and credits

**UNCHANGED; NATIVE STORE PURCHASE INTEGRATION NOT IMPLEMENTED.**

- Existing native-platform request marker, web Stripe paths, prices, credit ledger and backend entitlements are preserved. No new payment dependency/service or subscription change in this round.
- Release owner must assess applicable platform/region policies for VIA Premium digital subscriptions. Existing web checkout is not automatically permitted in every native distribution scenario.
- Obtain explicit approval before selecting or adding any native billing integration. If required, implement StoreKit/Play Billing purchase, pending/cancel handling, restoration and backend verification/notifications using canonical entitlements. Never mark Premium active from a client-only purchase result or fake checkout completion.
- Test active web subscribers on both devices, restore/account switch, refunds/revocation through provider events, duplicate events and credit consistency. Do not change prices/allocations implicitly.

## 10. Appearance, navigation and foldables

- Android source theme bridge complete; verify native status-bar contrast, error shell, startup flashes, system scheme propagation, process reload and OS navigation controls on actual builds. No native navigation-bar API integration added.
- Existing mobile Swipe | Dashboard | Profile, component retention, bounded widths, keyboard resize, orientation and four-edge safe areas preserved. Test short-height windows and text scaling; root responsive policy does not guarantee hinge avoidance.
- Android: use a supported window/hinge API bridge only if needed to avoid occluded controls; safe areas alone are not folding posture information. Test Galaxy Z Fold/Pixel Fold-like compact/expanded/partially-folded, portrait/landscape and multi-window modes.
- iPhone Duo: external iOS developer must assess Apple's official preparation guidance, required build SDK, reserved division regions and adaptive system bars. No iOS-specific API/config or Swift migration implemented here.
- Keep current card, expanded details, Profile drafts, onboarding and preferences across resize. Separately test process death/background restoration. Window-resize handlers must never apply jobs, save drafts automatically without authority, or deduct credits.

## 11. Required signing/account inputs

You/release owners must provide access to: real controlled origin and association hosting; actual Android package and Apple bundle/team identifiers; Expo/EAS project; Apple Developer/App Store Connect; Play Console; secure Android/Apple signing workflow; existing Supabase/auth provider consoles; APNs/FCM if push is approved; store product configuration if native billing is approved; privacy/legal/store artwork and reviewer accounts; real device/emulator coverage.

Credentials alone do not implement missing native integrations. Native iOS implementation remains outside this environment's supported scope; no local or cloud device/build success is inferred.

## 12. Device and functional acceptance gates

All native rows currently **BLOCKED**. Required device coverage: small/standard/large Android smartphones; Android foldables folded/unfolded/partially folded; Android tablet and multi-window; small/standard/large iPhones; iPhone Duo folded/unfolded/other supported poses; iPad/tablet configurations; supported Android emulators/iOS simulators.

Execute each with real authenticated accounts and backend data:
1. Signup.
2. Login, including offered provider methods.
3. Onboarding and continuation.
4. Swipe, details and current match percentage.
5. Apply with canonical authorization/idempotency.
6. Pass.
7. Save/unsave.
8. Credits, cross-device consistency and no duplicate deductions.
9. Improve My Match, genuine-skill confirmation and real score refresh.
10. Dashboard categories/statuses/search where implemented.
11. Profile editing and retained drafts.
12. CV upload/replacement/preview/download/VIA PDF.
13. Messaging.
14. Real notifications and authorized destinations.
15. Subscription state/purchase/restore where approved.
16. Settings.
17. Logout, revocation and account switching.
18. English/Arabic and RTL.
19. Light/Dark/System including native chrome.
20. Session persistence, refresh, expiry and process restart.
21. Dynamic resizing/orientation/multi-window.
22. Fold/unfold activity preservation, without duplicate applications/credits.

Additionally test offline/reconnect and failed requests, hostile URLs, cancelled native actions, expired/deleted/private/already-actioned jobs, permission denial and interruption during uploads/purchases. Record device/OS/build/account, steps, actual results and PASS/FAIL/BLOCKED individually. Preview screenshots cannot close native gates.

## 13. Files changed this round

- `app/frontend/scripts/seeker-appearance-contract.mjs` — one approved Profile class normalization; original baseline preserved.
- `app/frontend/src/lib/cv-file-validation.ts` — new metadata validator.
- `app/frontend/src/services/profile.service.ts` — CV validator and post-upload owner recheck only.
- `app/frontend/src/services/mobile-account.ts` — post-request account/CV owner rechecks.
- `app/frontend/scripts/mobile-handoff-contract.mjs` — new isolated validation tests.
- `app/frontend/scripts/personal-scroll-contract.mjs` — narrowly normalize approved account-service guards for historical hash check.
- `app/frontend/scripts/artifacts/personal-scroll-results.json` — test-generated result.
- `app/mobile/src/lib/appearance-bridge.ts` — new token-free browser observer.
- `app/mobile/src/screens/MatchMeSharedScreen.tsx` — origin-validated resolved-theme receiver and contrast-aware shell/status bar.
- This handoff and concise project notes.

No new npm/native dependencies. No frontend/mobile layout rewrite, iOS config enablement, EAS profile/signing setup, auth service/store rewrite, backend deployment, schema/RLS change, live upload/account mutation or billing change. Existing production web build pipeline generated its normal outputs; no SEO content edited.

## 14. Release sequence and completion criteria

1. Review these source changes in the existing web experience and approve release-owner access/handoff.
2. External developer establishes reproducible SDK/EAS build foundation and enables iOS within the same project.
3. Close native session/provider, files/deep links and permission contracts with working end-to-end tests.
4. Add real push and approved store billing integrations where required.
5. Validate appearance/accessibility/foldable/device matrix and protected functional regressions.
6. Create signed EAS artifacts and distribute via TestFlight/Play Internal Testing, with correct privacy/metadata/reviewer requirements.
7. Public release only after signed native build/device evidence and applicable store review. Mark incomplete gates BLOCKED, not PASS.

The architecture is retained. This round closes the known appearance assertion issue and adds tested shared safeguards; it does not complete or certify the native release objective.
