# Desktop Job Seeker Navigation Cleanup

## Implemented
- Desktop sidebar: **Swipe → Dashboard → Profile → Subscription Overview → Preferences**, using full-row buttons, credit-card/sliders icons and destination-specific active highlighting.
- Existing footer remains **Support & Settings → Logout**, preserving confirmed shared sign-out, red styling, branding, language/theme controls and sidebar width.
- Desktop Profile overview actions are **VIA Resume → Personal** in a two-column layout. Subscription and Logout JSX were removed from the overview; account/CV data, upload/replacement, header information icon and underlying subscription component remain.
- Desktop Swipe Preferences controls were removed; the sidebar opens the existing Preferences route.
- Existing subscription catalog, upgrade/management/checkout services, preference validation/persistence/ranking, authentication and routing remain unchanged. No backend, schema or record writes were performed.
- Mobile sources remain unchanged, including three bottom tabs, Profile subscription/logout and Swipe Preferences.

## Files changed
- `src/components/seeker/DesktopSeekerNavigation.tsx`
- `src/components/seeker/DesktopProfileAccount.tsx`
- `src/components/seeker/DesktopSwipePage.tsx`
- `scripts/desktop-parity-contract.mjs`
- `scripts/seeker-navigation-contract.mjs`
- `docs/JOB_SEEKER_PRODUCT_AUTHORITY.md`

## Validation
**PASS:** TypeScript (`pnpm exec tsc --noEmit`), lint and production build.

**PASS:** 247 source/unit contracts: desktop parity/cleanup 80 (including 56 protected-source hashes), navigation 37, savings/preferences 29, Profile 24, logout 21, mobile Swipe 36, VIA Premium 20. New destinations round-trip through the existing route parser; desktop active-state/row wiring and preserved dirty-preference/auth guards are checked at source level.

**Running viewer:** Executed after validation. Only the MatchMe guest landing page was visible and it rendered coherently. No authenticated Job Seeker page or protected interaction was observed. The results below do not treat source checks as running acceptance.

## Requested acceptance matrix
| # | Requirement | Source/unit evidence | Running acceptance |
|---|---|---|---|
| 1 | No Profile Logout | PASS | BLOCKED |
| 2 | Sidebar confirmed Logout | PASS | BLOCKED |
| 3 | No Profile subscription card | PASS | BLOCKED |
| 4 | Subscription below Profile | PASS | BLOCKED |
| 5 | Existing subscription destination | PASS | BLOCKED |
| 6 | No desktop Swipe Preferences icon | PASS | BLOCKED |
| 7 | Preferences below subscription | PASS | BLOCKED |
| 8 | Existing Preferences destination | PASS | BLOCKED |
| 9 | Preferences edits/save | PASS: existing contract unchanged | BLOCKED |
| 10 | Profile VIA Resume | PASS | BLOCKED |
| 11 | Profile Personal | PASS | BLOCKED |
| 12 | Support & Settings | PASS | BLOCKED |
| 13 | Route-specific active highlighting | PASS | BLOCKED |
| 14 | Requested duplicate actions removed | PASS | BLOCKED |
| 15 | Desktop layout preserved | PASS: width/layout source | BLOCKED |
| 16 | Mobile Profile subscription | PASS: protected hash/entry | BLOCKED |
| 17 | Mobile Profile Logout | PASS: protected hash/entry | BLOCKED |
| 18 | Mobile Swipe Preferences | PASS: protected hash/entry | BLOCKED |
| 19 | Mobile three-tab navigation | PASS | BLOCKED |
| 20 | No mobile layout changes | PASS: protected hashes | BLOCKED |
| 21 | Subscription records intact | No writes; existing services reused | BLOCKED: no live record inspection |
| 22 | Preference records intact | No writes; existing services reused | BLOCKED: no live record inspection |
| 23 | Existing auth service for Logout | PASS: source/unit contracts | BLOCKED: no live sign-out |
| 24 | No account deletion/reset | No data writes; account/CV handlers retained | BLOCKED: no live record inspection |

Browser Back, protected refresh/direct navigation, preference persistence, payment/management and live sign-out were not exercised in an authorized session. Review these in App Viewer before publishing; no signed-in acceptance claim is made.
