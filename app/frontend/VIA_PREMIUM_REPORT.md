# VIA Premium implementation report

## Targeted plan update — 2026-10-22
The new request supersedes the earlier monthly-default and monthly popularity descriptions below. Fresh subscription page openings now select Yearly, ignoring stale stored selections; an existing pending checkout still retains its original plan to avoid a duplicate purchase. Monthly stays first and selectable. Mobile labels derive from the unchanged catalog: Monthly — $10/month and Yearly — $100/year. Most Popular appears only on Yearly, with a subtle mobile border/tint/shadow highlight. Arabic interval copy is updated. Heading, renewal disclosure and Subscribe VIA Premium remain unchanged. Selected canonical plan and month/year billing cycle continue through the existing checkout service; both plans share the same payment-verified entitlement. No backend, catalog, credit, application or billing-system rebuild was performed.

Changed this round: the shared VIA Premium page and its contract test, plus this report/progress notes. TypeScript,20 subscription+29 Swipe+35 navigation+42 onboarding contracts (126 total), lint and production build passed. These are pure/static regression checks, not verified provider transactions. The running viewer again showed only the guest landing page; signed-in mobile default/radio/RTL/checkout acceptance remains NOT RUN. No second viewer check was attempted because there is no legitimate source fix for missing authenticated access without bypassing login. Previous Stripe configuration and sandbox verification release gates remain unresolved; no real charge or paid activation was performed.


## Release status
Implemented the real database and Stripe integration boundary, mobile Credits sheet, localized plan selection, verified-payment return, management, and server-owned application credit exemption. **The final purchase success condition is not verified.** No sandbox transaction completed and no paid account was activated for acceptance. The deployed webhook configuration probe returned HTTP503 `Stripe webhook is not configured`. The running viewer showed the guest landing page only; authenticated mobile acceptance remains NOT RUN.

## 1. Credits popup
The existing mobile Swipe Credits indicator opens a local Vaul sheet in the same view. It uses the same MatchMe Sparkles logo/wordmark as the existing header; no rename to VIA. The centralized balance prop is the focal point, with unknown balance shown as a dash rather than a fabricated value. Exact English CTA: Unlock more now. Close button, backdrop and sheet dismissal are supported, with bottom safe-area padding and accessible title/description. Sheet/overlay z50 cover the existing z40 navigation. Gesture decisions are disabled while open. Existing job polling/focus/event refresh is paused, including suppression of in-flight results while paused; opening/closing does not explicitly fetch or reset the deck.

## 2. Subscription page
Mobile Job Seeker subscription route mounts the dedicated EN/AR purchase experience instead of legacy demo billing. Exact heading and CTA are used, with radio selection, monthly default, account-keyed previous plan selection, monthly marketing-only Most Popular label, readable renewal disclosure and safe-area sticky purchase button. Catalog comes from billing_plans, including a database-only read fallback when the Edge Function is unavailable. Unconfigured checkout is disabled with an explicit message; refresh and payment verification retry are reachable. Plan selection alone neither purchases nor deducts credits. Native checkout is blocked.

## 3. Catalog
Live migration020 created the previously absent canonical billing_plans and subscriptions tables. VIA Premium monthly ID via_premium_monthly is USD1000 minor units ($10) per month. Yearly ID via_premium_yearly is USD10000 minor units ($100) per year. No discounts, promotional price claims or extra subscription benefits added. Provider active recurring prices must match currency, amount, interval and interval_count1 exactly or checkout fails closed. Subscription and catalog browser mutation privileges are revoked; subscriptions are owner-read only.

## 4. Billing provider
Reused Stripe and the existing subscription service architecture, replacing its unsafe legacy verification boundary. Deployed app_91d3436dfc_via_payments version1, ACTIVE, with manual authenticated-user validation and asynchronous Stripe signature verification on the webhook branch. It handles catalog, state, checkout, verify, manage and cancel_pending actions. Existing one-time credit payment handler was preserved. Legacy local verify-payment and stripe-webhook artifacts delegate to the canonical handler rather than maintaining separate unsafe activation logic. Historical unprefixed deployed function inventory/retirement is not independently established; production webhook routing must use the canonical endpoint.

## 5. Checkout behavior
Path: Swipe → Credits sheet → Unlock → /seeker/subscription → explicit Subscribe → server checkout session → Stripe hosted checkout → preserved return query with via_session and success, or via_cancelled → server verification. Return origin and pathname are validated. Frontend redirect accepts only HTTPS checkout.stripe.com or billing.stripe.com. No card fields are stored in MatchMe. Account advisory checkout reservation, pending-plan conflict rejection and Stripe idempotency key prevent duplicate submissions. Existing nonterminal provider subscriptions must be managed rather than repurchased. Pending checkout can resume, be verified or explicitly expired/cancelled. Provider failure does not activate access. Server confirmation validates session ownership/app/product, paid status, exact amount/currency, price and quantity, then retrieves provider subscription and paid invoice. Webhooks refresh the latest provider state rather than trusting browser redirect parameters.

## 6. Entitlements and lifecycle
get_via_entitlement is an authenticated server RPC backed by has_via_premium. Only canonical plans in active or paid-through cancelled state with verified_at and future current_period_end grant access. Provider updates handle inactive, active, payment_failed, cancelled and expired; checkout reservation handles checkout_pending. Pending, failed, unverified and expired records never grant access. Existing record and paid-through date are visible with Manage Subscription. Stripe portal is the web renewal/cancellation management path. Exact invoice amount is enforced; prorations, discounts, taxes or provider adjustments that change the requested amount are not silently accepted and require explicit billing policy/configuration reconciliation.

## 7. Credits and application rules
Only the existing canonical record_seeker_job_action right-action debit guard was changed. Active VIA Premium eligible applications do not debit or replace standard balance. Pass remains credit-based; Save/Undo retain existing behavior. Vacancy availability, existing role check, account lock, duplicate idempotency and conflicting-decision rejection remain intact. Existing mandatory-profile client restriction remains unchanged. Premium does not create a parallel application system or bypass the server's existing vacancy restrictions.

## 8. Mobile/desktop synchronization and return
Both platforms use the same Supabase account, subscription rows and server entitlement RPC. Mobile and desktop Apply controls recognize server-derived Premium; the server still decides entitlement at write time. Hook refreshes on focus, subscription events and bounded polling, and expires access at the paid-through timestamp. Account/mount/generation guards prevent cross-account state updates. Subscription navigation preserves the current vacancy UUID in the Swipe return anchor and replaces the previous history entry so browser Back also returns to that card. Closed/unavailable jobs are not resurrected. The three-tab bar remains Swipe | Dashboard | Profile. Desktop route chrome/navigation are retained; seeker plan/subscription contents now use the canonical purchase/status component instead of mocked subscription authority. Desktop Company billing and unrelated legacy usage/add-on/demo history surfaces were not certified or converted in this scope.

## 9. English/Arabic and native dependencies
Requested English copy is exact; prices are derived from the canonical catalog. Arabic translations cover sheet, options, label, disclosure, status, return and recovery. RTL direction is applied while retaining top-left existing MatchMe branding. Device RTL and keyboard/gesture behavior are not acceptance-verified. The Android shared-screen bridge blocks external subscription checkout/management. No claim of Apple/Google production billing compliance is made: current official requirements, regional exceptions and approved store billing/receipt verification must be evaluated and implemented before native purchase release. No native store payment integration was added.

## 10. Files changed
- src/components/seeker/CreditsPopup.tsx
- src/components/seeker/ViaPremiumPage.tsx
- src/components/seeker/MobileSwipePage.tsx
- src/lib/via-premium.ts
- src/lib/seeker-jobs.ts
- src/services/subscription.service.ts
- src/pages/JobSeeker.tsx
- src/pages/Subscription.tsx
- supabase/migrations/020_via_premium.sql
- supabase/functions/create-checkout-session/index.ts
- supabase/functions/app_91d3436dfc_via_payments/index.ts
- supabase/functions/verify-payment/index.ts
- supabase/functions/stripe-webhook/index.ts
- scripts/via-premium-contract.mjs
- scripts/mobile-swipe-contract.mjs
- scripts/seeker-navigation-contract.mjs (stale formatting/renamed shortcut test anchors corrected)

## 11. Tests executed
- Supabase connection verified existing project; canonical action RPC inspected after migration.
- TypeScript no-emit check passed.
- 17 VIA Premium pure/static contracts passed.
- 29 Swipe contracts passed.
- 35 navigation contracts passed after fixing stale test anchors (initial suite stopped on those anchors).
- 42 onboarding contracts passed. Total123 contract assertions; these are not browser/payment acceptance.
- Final pnpm run lint && pnpm run build passed;2424 transformed modules.
- Authenticated rollback-only SQL passed: active zero-credit Apply without balance/ledger change, duplicate idempotency, conflicting-decision and closed vacancy rejection, Premium Pass still requiring credits, paid-through cancellation access, expiry/pending/failed/unverified denial, owner RLS and subscription browser-mutation rejection, free Pass deduction, Save/Undo/reapply single-debit policy. All temporary vacancy/subscription and balance changes rolled back; no production paid fixture remains from these tests.
- Canonical Edge Function deployed ACTIVE. Unsigned webhook/configuration probe returned503, no fake success.
- One running viewer check completed: coherent guest landing only, not signed-in purchase flow. No authenticated bypass or fake demonstration added.

## 12. NOT RUN and release gates
NOT RUN: real signed-in mobile320/360/375/390/412/short-height Credits tap/drag/backdrop/card preservation, plan radio interaction/keyboard/RTL, desktop signed-in purchase/management regression, concurrent checkout race through provider, logout/relogin and cross-device synchronization, sandbox monthly/yearly payment success/failure/cancellation, renewal/payment failure/paid-through cancellation webhooks, actual provider amount/receipt and verified unlimited applications after checkout. No real users charged.

Required provider setup (names only, never browser secrets):
- STRIPE_SECRET_KEY in Supabase Edge Function secrets; use test mode for acceptance.
- APP_91d3436dfc_SITE_URL matching the deployed web origin and /seeker/subscription return route.
- APP_91d3436dfc_STRIPE_VIA_MONTHLY_PRICE_ID: active USD10/month recurring price, interval_count1.
- APP_91d3436dfc_STRIPE_VIA_YEARLY_PRICE_ID: active USD100/year recurring price, interval_count1.
- APP_91d3436dfc_STRIPE_WEBHOOK_SECRET matching this endpoint. Probe establishes key and/or webhook configuration absent; individual price/site values were not authenticated-probed, so their presence is unconfirmed.
- Endpoint: https://ykvlaakotyouojkdydzh.supabase.co/functions/v1/app_91d3436dfc_via_payments?webhook=true . Listen for checkout.session.completed/expired, customer.subscription.created/updated/deleted, invoice.paid and invoice.payment_failed. Existing credit webhook configuration must remain intact; this app-specific shared secret must match both endpoints if reused, or deployment must reconcile their secrets.
- Stripe account Business Name and configured Billing Portal for term-end cancellation and renewal management. Portal plan switching/proration should not be enabled without reconciling the exact-price policy.
- Approved native store billing/receipt verification and device/store acceptance before native subscriptions.

## Final assessment
The requested implementation boundary is in place and local/database checks pass, but the full final success condition remains blocked by unconfigured provider and unexecuted authenticated/sandbox acceptance. Review in App Viewer; do not enable production purchasing or represent verified subscription activation until the above gates are completed.
