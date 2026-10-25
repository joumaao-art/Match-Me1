# Mobile Personal Scrolling Fix

## Scope
Mobile Job Seeker Personal only. Identity, Contact, Compensation and Gender remain in the existing single form; no category navigation, fields or Save actions were added or removed. Desktop presentation and backend functionality are unchanged.

## Root-cause investigation
The active mobile route mounts `MobileProfileAccount`, not the standalone desktop Personal page. Its account section is the page's primary vertical scroller inside the fixed-height seeker shell. The inner content wrapper already has natural height and 16px vertical padding. The form categories have ordinary field spacing, not viewport-sized heights, empty spacers or independent section scroll containers. Bottom-navigation clearance is already reserved once in the outer main container: 64px plus the bottom safe-area inset. No additional navigation offset is needed inside the form.

Two layout risks were identified and corrected:
1. Mobile Save used `sticky bottom-0`. Sticky positioning can display Save above its normal-flow location while the form's remaining scroll extent still exists, making the area after the visible button appear empty. Save now stays at its normal-flow endpoint.
2. The seeker main flex parent lacked an explicit zero minimum height on the mobile Personal route. Adding `min-h-0` provides a bounded, shrinkable parent for the existing account scroller instead of relying on content-derived flex minimum sizing.

The mobile form is explicitly `h-auto min-h-0 flex-none`, preventing artificial viewport stretching. The existing account scroller retains `overflow-y-auto` and gains Personal-only vertical overscroll containment. No page-wide scroll hiding was introduced.

These are source-identified layout causes/risks, not a pixel-measured reproduction of the reported screenshot. The attachment contained text only, and authenticated Personal was not available in the viewer; the exact original blank-space height and post-fix scrollHeight were not measured.

## Changes
- `src/components/seeker/PersonalInformation.tsx`: mobile-only content-driven form sizing; remove mobile Save's sticky/bottom positioning. Keep existing button styling, padding, fields, validation, date confirmation and Save handler.
- `src/components/seeker/MobileProfileAccount.tsx`: retain the primary scroller, adding overscroll containment only for Personal.
- `src/pages/JobSeeker.tsx`: add `min-h-0` only when mobile and Personal are active. Existing shell height and navigation-clearance expression remain unchanged.
- `scripts/personal-scroll-contract.mjs` and baseline/results in `scripts/artifacts/`: targeted source/AST regression evidence.

The last Save button retains 12px wrapper bottom padding followed by the existing 16px content padding. Navigation and its safe-area inset are reserved outside the scroller, not duplicated below the form. Short content leaves natural unused viewport space without adding a form minimum height; long content continues to use the primary scroller.

## Preservation
30 source/AST contracts passed. The full form matches its pre-change source after reversing only the two mobile layout-class edits. Save/validation logic and standalone desktop Personal content are byte-for-byte preserved. Hash checks passed for desktop account, bottom navigation, shared fields/phone/date controls, original date wheels, Personal/account services, navigation contract and global theme CSS. All four categories and their spacing are preserved. Dropdown/date-picker scrolling is unchanged; no new independent form scroller was added.

## Validation
| Check | Result | Evidence |
|---|---|---|
| Personal layout/source contracts | PASS | 30 executed assertions |
| TypeScript | PASS | `pnpm exec tsc --noEmit` |
| Lint | PASS | `pnpm run lint` |
| Production build | PASS | `pnpm run build` |
| Actual viewer Personal acceptance | BLOCKED | Viewer showed a wide guest landing page, not Personal |
| Pixel/scrollHeight regression | BLOCKED | No authenticated mobile measurements |
| Physical keyboard/touch testing | BLOCKED | Not executed |

An initial test asserted the count of all existing overflow-hidden occurrences in the large seeker source incorrectly; the assertion was corrected to check only the relevant Personal layout boundaries. No product source workaround was added for that test failure.

The viewer's negative feedback concerns failure to reach the requested page, not an observed layout defect. No auth bypass, fake preview page, or unchanged repeated viewer request was introduced.

## Requested acceptance
All statuses below concern actual running mobile Personal acceptance. Source validation is supporting evidence, not a substitute for signed-in viewer testing.

| # | Requirement | Status | Evidence / limitation |
|---|---|---|---|
| 1 | Gender ends shortly after Save | BLOCKED | Normal-flow endpoint implemented; not visually measured |
| 2 | Identity no blank scroll tail | BLOCKED | Natural sizing contract PASS; signed-in view unavailable |
| 3 | Contact no blank scroll tail | BLOCKED | Fields preserved; signed-in view unavailable |
| 4 | Compensation no blank scroll tail | BLOCKED | Fields preserved; signed-in view unavailable |
| 5 | Short forms no artificial scrolling | BLOCKED | No mobile form minimum viewport height; no runtime measurement |
| 6 | Long forms fully scrollable | BLOCKED | Primary overflow-y-auto retained; no runtime measurement |
| 7 | Save accessible | BLOCKED | Normal-flow Save and single navigation offset; no screen/keyboard test |
| 8 | Navigation visible and functional | BLOCKED | Component/hash and handlers preserved; signed-in interaction unexecuted |
| 9 | Keyboard does not hide controls | BLOCKED | Physical/virtual keyboard state untested |
| 10 | Dropdown/date pickers work | BLOCKED | Shared controls unchanged; runtime interaction untested |
| 11 | No unintended nested scrolling | BLOCKED | One page-content scroller in inspected hierarchy; no browser scroll-chain measurement |
| 12 | EN/AR layouts correct | BLOCKED | All localized text and direction retained; browser review unavailable |
| 13 | Light/dark unaffected | BLOCKED | Theme/color CSS unchanged; Personal screenshots unavailable |
| 14 | Desktop Personal unchanged | PASS (source) / BLOCKED (visual) | Exact desktop source and branch classes retained; no signed-in desktop screenshot |

| Width | Actual Personal view | Short/long content | Keyboard-open |
|---|---|---|---|
| 320px | BLOCKED | BLOCKED | BLOCKED |
| 360px | BLOCKED | BLOCKED | BLOCKED |
| 375px | BLOCKED | BLOCKED | BLOCKED |
| 390px | BLOCKED | BLOCKED | BLOCKED |
| 412px | BLOCKED | BLOCKED | BLOCKED |

## Result
The mobile-only fix is implemented and code/source validation passed. The final visual success condition is not certified because the viewer did not reach authenticated Personal. Review the signed-in page at the requested widths, scroll to the final Save, open the keyboard and pickers, and compare EN/AR and light/dark before release. No backend/schema/account records were changed.
