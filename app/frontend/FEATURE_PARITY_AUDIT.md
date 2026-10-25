# MatchMe feature parity audit — 25 October 2026

## Evidence and interpretation
Source inspection, not authenticated browser acceptance. `Wired` means inspected service integration, not a passing device test. `Demo` means local or fabricated behavior and is not a supported live capability. Supabase project ykvlaakotyouojkdydzh remains canonical. Read-only public table inventory: admin_users, app_91d3436dfc_support_reports, app_experience_ratings, billing_plans, company_profiles, education, experience, job_seeker_profiles, onboarding_events, seeker_credit_accounts, seeker_credit_transactions, seeker_job_actions, subscriptions, user_profiles, vacancies. No messages, matches, conversations, interviews or notifications tables; no corresponding public RPCs were returned. Do not create duplicate application or match records to paper over this absence.

## Pre-change matrix
| Feature | Mobile | Desktop | Shared backend | Function matches | Synchronizes | Layout baseline | Fix / evidence |
|---|---|---|---|---|---|---|---|
| Registration/email login/logout/session/reset | Shared Auth | Shared Auth | Supabase Auth | Same route | Device acceptance unverified | Responsive Auth | Preserve bounded boot/role gates; test actual providers |
| Google/Apple/phone/verification | Configured-provider controls | Same | Auth provider-dependent | Source-shared | Unverified | Shared Auth | Provider/device restrictions require actual acceptance |
| Welcome/onboarding validation/progress | v3 eleven steps | v2 fourteen steps | Separate JSON on same identity | No | No full semantic continuation | Mobile wheels/cards; desktop legacy shell | Bridge validation/progress without replacing presentation; unresolved |
| Legal names/gender/birthday/location | v3 required fields | Full name; different optional fields | Same profile, divergent writers | No | Risk of stale overwrites | Existing independent forms | Canonical changed-field writes and onboarding bridge required |
| Skills | Canonical string list | Fabricated skills/local CRUD | Mobile only | No | No desktop persistence | Mobile editor; desktop cards/dialog | Connect desktop CRUD to canonical skills, do not invent endorsements |
| Education/experience | Canonical profile history | Shared professional editors | Same tables | Onboarding diverges | Reads on entry; acceptance unverified | Existing forms | Preserve IDs and add safe refetch |
| Certificates/languages | Explicit saved JSON | Shared editors | Same professional_details | Source-shared | Acceptance unverified | Existing sections | Keep saved resume source; do not substitute legacy local data |
| Display name/email/mobile overview | Auth/base/account | Profile editor only | Same records | Missing overview | Unverified | Mobile overview; desktop profile cards | Add desktop account section within current cards |
| Original CV upload/date/preview/replace | Owner private storage | Simulated ResumeSection | No desktop integration | No | No | Mobile metadata; desktop dashed upload/card | Reuse private CV service; remove fabricated score/download |
| Personal Information | Changed-field owner RPC | Missing dedicated view | update_mobile_personal | No | Mobile writer real | Mobile page; desktop content panel | Shared form body, independent desktop wrapper |
| VIA Resume/PDF EN/AR | Saved account/history generator | Missing route | Shared generator ready | No | Same saved content once mounted | Mobile page; desktop content panel | Mount shared generation; Arabic visual reader acceptance blocked |
| Subscription overview | Real entitlement/portal | Purchase page; no overview route | subscriptions/provider service | Missing overview | Account-wide authority | Independent shells | Add desktop overview; preserve USD10/100 and verified purchase |
| Discovery/ranking/vacancy metadata | Canonical jobs/ranker | Canonical jobs/ranker | Same vacancies/decisions | Mostly; deep-link preview differs | Poll/focus | Mobile gestures; desktop stack/actions | Fix shared target handling, Share, completion and credits entry |
| Apply/Pass/Save/Undo | Shared recordJobAction | Same handler | seeker_job_actions/ledger | Server-shared; UI gates differ | Events/poll | Existing action bars | Preserve server one-credit replay and eligibility |
| Share | Native/browser/clipboard | Missing desktop control | Same HTTPS job identity | No | N/A | Existing card/header | Add desktop Share control |
| Credits/history | Popup with real ledger | Balance badge only | Canonical ledger | Missing entry | Shared balance | Mobile popup; desktop modal | Reuse ledger panel; no new grants |
| Premium checkout/management/cancel | Existing service | Existing service | Same catalog/entitlement | Source-shared | Refetch | Current billing designs | Sandbox/webhook/native-store acceptance unresolved; no billing redesign |
| Roles/keywords max10 autocomplete | Canonical combined selector | Roles only; extra legacy fields | Desktop direct merge vs shared mobile service | No | Race/overwrite risk | Green mobile Save; desktop inline Save | Share controls and conflict-safe service; retain hidden fields |
| Countries/types/styles/levels | Canonical simplified options | Missing desktop styles/levels | Same JSON, different writers | No | Unverified | Existing preference wrappers | Same visible contract; no hidden-field erasure |
| Dashboard search/categories/counts | Owner RPC/pagination | Old counts/no search/categories | get_seeker_dashboard vs old actions read | No | Records shared, projection differs | Mobile four-grid; desktop links/stats/cards | Share RPC/details; retain desktop arrangement |
| Recent/details/status/history | Canonical dates/history | updated_at used as applied date; no details/history | Same actions | No | Same rows/different display | Independent row/card presentation | Use canonical date/status and shared details |
| Saved/skipped/reconsider/withdraw | Dashboard permitted actions | Saved/list and old applications | Same actions | Missing desktop skipped/detail | Shared records | Existing list/card layouts | Add desktop category browser/details, preserve lifecycle rules |
| Messages/history/send | Mock identities/replies/files | Same responsive mock page | Service targets absent tables | Demo is not parity | No | Conversation list/chat layout | Live Company-first contact backend absent; never certify demo |
| Interview scheduling/hiring notifications | Simulated messaging workflows | Same | No interview/message layer; stages canonical | Not live | No | Existing role screens | Existing canonical stage updates do not establish actual scheduling |
| In-app notification center | Mock/local current-user | Same + embedded mocks | No notification table | Demo | Cross-account risk | Existing notification pages | Remove demo success claims; live delivery layer unresolved |
| Support chat/email | Explicit unavailable configuration | Missing | Official endpoints absent | No entry | N/A | Mobile ordered rows; desktop cards | Expose same honest configuration boundary |
| FAQ/problem report | Real FAQ/owner report storage | Missing | support_reports/private attachments | No | Account-owned storage | Independent wrappers | Mount shared service/form |
| Language/password/logout/security | Actual controls | Actual password/logout; simulated settings save | Auth/shared account preference | Different settings | Partial | Mobile rows; desktop cards | Real shared settings; persist language/account prefs; no fake delivery |
| Privacy/exposure/contact/invitations | Legacy reachable tools | Legacy sidebar/tools | Not established as live | Unverified/demo dependencies | Unverified | Existing role tools | Do not infer authorization from hardcoded premium tier |
| Portfolio/video/photo | Local/fake surfaces reachable | Local/fake surfaces | Not real storage | Not real capability | No | Existing cards/dialog | Must not certify fake uploads; unresolved persistence |
| Cache isolation/refetch | Many account-keyed hooks | Same | Supabase RLS | Global QueryClient not reset | Stale cache risk | No visual effect | Clear/cancel cache on identity transition; account-key page |
| Company | Responsive shared portal; subset canonical | Same portal | Profile/jobs/applicants wired; auxiliary demos | Core source-shared; extras unverified | Unverified | Enterprise nav/cards | Preserve roles/layout; document limits, no native admin invention |
| Super Admin | Responsive web portal | Same | Protected role route; admin extras not certified | Unverified | Unverified | Existing admin nav | No independent/native mobile admin; never expose to seeker |

## Visual baseline from inspected source
- Mobile breakpoint below768px; physical Swipe/Dashboard/Profile bottom bar with safe-area clearance. Swipe fixed actions/gestures; Dashboard logo/search header and four-button grid; Profile compact overview. Green Preferences top-right Save stays unchanged.
- Desktop md sidebar w64, independent scrollable main panel; Dashboard max-w4xl links two-column, stats md four-column, completion card and recent cards; Profile max-w2xl cards, two-column fields, inline Save; Preferences max-w2xl and inline Save. Add capabilities in these wrappers, never mount the mobile page shell on desktop.
- EN/AR/dark palette and existing fonts preserved. Baseline authenticated screenshots unavailable through permitted implementation tooling; source structure is not screenshot evidence. No browser or preview diagnostic bypass used.

## Implementation order
1. Shared account feature bodies with desktop-specific profile/CV/Personal/VIA/subscription/support wrappers; canonical desktop skills.
2. Shared conflict-safe preference contract and selectors with unchanged platform Save placement.
3. Canonical desktop Dashboard counts/search/details/history and deep-link/Share/credit actions; preserve grid/card/sidebar design.
4. Identity cache isolation and safe focus/event refresh.
5. Review onboarding and absent live messaging/notifications against safe additive backend options; unresolved features remain explicitly incomplete, not simulated.
6. Permanent parity standard, contract checks, lint/build, database authorization checks and available rendering validation. Record every required signed-in/device acceptance as PASS/FAIL/BLOCKED on actual evidence.
