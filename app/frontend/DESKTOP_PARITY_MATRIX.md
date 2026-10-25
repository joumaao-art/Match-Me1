# Mobile → Desktop Job Seeker Feature Matrix

Mobile source was inspected directly before implementation; authenticated baseline screenshots are unavailable in the current environment. The last viewer exposed only guest landing. No live mobile feature is claimed tested from source alone. Mobile and Company/Admin source will be preserved by file hashes.

| Feature | Current mobile route/component, fields/actions/rules | Backend | Desktop inventory / discrepancy | Classification and desktop change | Verification |
|---|---|---|---|---|---|
| Welcome/auth | MobileEntry → Auth: Apple/Google, phone OTP, email/password, existing verification/reset | authService/signup-flow | Already equivalent Auth handlers and desktop signup method card; preserve Company | MATCH existing desktop chooser uses same callbacks; no auth rewrite | pending |
| Onboarding | MobileOnboarding 11 steps, owner drafts, validation, 20 credits, skills/education/experience/preferences | loadMobile/persistMobile/save_mobile_onboarding | Legacy desktop different state/fields/completion journey | UPDATE desktop presentation of current mobile journey using same services | pending |
| Primary navigation | Swipe/Dashboard/Profile; secondary destinations via Profile settings and Dashboard | seeker-navigation | Multi-group sidebar with obsolete direct links | UPDATE three primary sidebar items; retained language/theme security controls | pending |
| Swipe | MobileSwipePage/Card: real jobs, declared salary/type/style, expandable qualifications, credits/preferences, informational completion, Undo/Share/Pass/Save/Apply | useSeekerJobs/rankEligibleVacancies/recordJobAction/mandatoryProfile | Desktop static overlapping cards, no share/credits dialog, old preferences/extra badges | UPDATE independent desktop card and header, same rules/actions | pending |
| Dashboard | MobileDashboard: all/submitted/skipped/saved counts, recent5, search/category/status/date pagination, details/history/unsave/apply/undo/withdraw | get_seeker_dashboard/recordJobAction | LegacyDashboard outdated stats/recent dates/matches | UPDATE desktop four-column category cards and records table; same service/details/actions | pending |
| Profile | MobileProfileAccount account/email/phone/private CV timestamp/upload/download; subscription/VIA/Personal/Logout/info | loadAccount/profileService/private CV APIs | Legacy form with demo resume controls, duplicate personal fields | UPDATE desktop account overview and equivalent actions; preserve desktop width/card grid | pending |
| Personal | Shared PersonalInformationForm four categories; title/name/birthday/contact/optional private compensation/gender | update_mobile_personal | Already shared platform form | MATCH preserve desktop native dates and layout | pending |
| Preferences | MobileSwipePreferences 5 groups; combined10 roles/keywords; countries/types/styles/junior-mid-senior; hidden legacy values preserved; conflict handling | preferencesService | Old desktop salary/industries/controls | UPDATE desktop form with same service/validation; retain hidden data | pending |
| Experience | Settings → ExperienceView shared CRUD/types/word limit/duties advice/duration/order/date range/current | readHistory/writeHistory | Same component used on mobile and desktop | MATCH no shared changes | pending |
| Education/certificates | Settings → EducationView shared CRUD/degree/field/dates/current and certificate section, hidden historical GPA | readHistory/writeHistory/save_profile_section | Same component; standalone Certificates entry outdated | MATCH forms; retire bookmark to Education, remove primary entry | pending |
| Skills | Main Skills route uses MobileSkills newline editor with real persistence; onboarding SkillPicker is searchable multi-select | profile skills | Desktop mock levels/years/endorsements, no real persistence | UPDATE desktop searchable canonical skills; mobile main editor lacks requested autocomplete, report separately | pending |
| Languages | Settings → LanguagesView shared canonical Fluent/Native levels | save_profile_section | Same component used on mobile | MATCH no shared changes | pending |
| Original CV / VIA PDF | Mobile overview upload≤10MB/private link; deterministic VIA PDF preview/download latest profile/history/certificates/languages, sensitive fields omitted | profileService/loadResumeData/generateResume | Legacy ResumeSection fabricated download/score | UPDATE reuse exact original CV and PDF services, hide old resume presentation | pending |
| Credits/Premium | CreditsPopup remaining balance→VIA; ViaPremiumPage canonical $10/$100, yearly popular/save17, checkout/verification/management | credit ledger/subscriptionService | Desktop extra fake usage/addons/coupons/invoices; existing VIA embedded | UPDATE seeker-only subscription shell and desktop credits modal; Company billing unchanged | pending |
| Messages/hiring | Shared messages route/service; runtime messaging not certified; Dashboard actions; Settings includes invitations/contact requests | messageService/company authorization | Shared messages; standalone Matches primary obsolete | MATCH shared messaging; route Matches to Dashboard | pending |
| Support/settings | MobileSupport configured chat/email else honest unavailable; FAQ/report screenshot receipt; language/notifications/password/tools/logout/deletion unavailable | submitReport/notification preference/auth | Desktop settings timers/fake success | UPDATE desktop equivalent support/settings and confirmed Logout | pending |
| Secondary privacy/tools | Mobile Settings visibly contains portfolio/video/visibility/exposure/contact requests/who viewed/invitations | mixed legacy components | These are NOT desktop-only: current mobile exposes them | EXCEPTION retain through Settings only; document mock/incomplete tools rather than delete data or alter mobile | pending |
| Legacy bookmarks | Mobile current routes retained | existing router | desktop direct Applications/Saved/Matches/Certificates | UPDATE desktop redirect to Dashboard category/Education, keep mobile routing unchanged | pending |

## Existing mobile limitations (not changed)
- Main Skills editor is newline-based, not autocomplete; searchable SkillPicker exists only in onboarding.
- Mobile Settings exposes legacy portfolio/video/discoverability tools; some operate on mock/local state and are not certified functional. They are current mobile entry points, so cannot be classed desktop-only.
- Official support chat/email depend on configuration; unavailable paths are explicitly disclosed. Secure account deletion and login-phone change are not configured.
- Mobile Dashboard does not expose a Messages button despite shared /messages and historical navigation documentation; desktop will expose messaging through Dashboard as explicitly required, without modifying mobile.
- Automatic CV extraction is TXT-only. Native checkout is blocked pending approved store billing. Real payment sandbox/authorized browser evidence unavailable.
- Mobile onboarding lacks delete controls and duties fields found in shared post-onboarding Experience/Education editors; preserve mobile unchanged and use post-onboarding shared CRUD as reference for those editors.

## Final verification evidence

The `pending` cells above preserve the pre-implementation audit baseline, not the final implementation state. All listed desktop changes are implemented. Final evidence supersedes those initial cells as follows:

| Feature group | Source/contract validation | Authenticated functional/visual acceptance |
|---|---|---|
| Auth | PASS existing equivalent methods inspected; no rewrite | BLOCKED |
| Navigation, Swipe and bookmarks | PASS dedicated desktop and preserved mobile contracts | BLOCKED |
| Dashboard categories/counts/recent/search/details/history/actions | PASS canonical hook/action wiring and24 Dashboard contracts | BLOCKED |
| Profile/CV/VIA Resume/Logout | PASS canonical services and24 Profile/21 Logout contracts | BLOCKED |
| Personal | PASS shared unchanged form and28 contracts | BLOCKED |
| Preferences | PASS shared validation/persistence and29 contracts | BLOCKED |
| Experience/Education/Certificates/Languages | PASS unchanged shared source | BLOCKED |
| Searchable Skills and desktop onboarding | PASS dedicated picker/save wiring and42 onboarding contracts | BLOCKED |
| Credits/VIA Premium | PASS canonical wiring/20 contracts/live USD10/100 catalog | BLOCKED |
| Support and secondary mobile tools/Messages | PASS route preservation and honest unavailable handling; inherited mock/local tools not certified | BLOCKED |
| Mobile/Company/Admin preservation | PASS56 protected file hashes and mobile/role source checks | BLOCKED runtime regression |

342 total source/unit/static contracts, TypeScript, lint and production build passed. One viewer check showed guest landing only. No required authenticated20-item acceptance or mobile/desktop width/RTL comparison is claimed passed. Existing mobile main Skills autocomplete and Settings logout defects are reported separately in DESKTOP_PARITY_REPORT.md. No shared service, schema, production data or package changes.

## Scope safeguards
No new backend/schema, mock vacancies, authentication/payment rewrite, or mobile component/style edit is planned. Desktop-specific copies reuse current service contracts while keeping mobile files unchanged. Existing shared Experience/Education/Languages/Personal controls remain untouched. All runtime acceptance must distinguish source/unit/SQL evidence from actual signed-in browser evidence.
