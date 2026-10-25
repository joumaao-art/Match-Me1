# Subscription Savings and Mobile Swipe Preferences — Acceptance Summary

## Result
The requested implementation is accepted using independently verified Supabase evidence and the user's successful signed-in manual tests. The user reports no issues in Company profile persistence, legitimate vacancy publishing, that vacancy on seeker Swipe, the owning Company's applicant dashboard, Preferences after logout/login, VIA pricing, unsaved navigation protection, same-card return, combined selection limit/duplicate rejection and Arabic usability.

These manual results are not agent-executed browser tests. The agent cannot access the user's authenticated App Viewer session; no signed-in screenshots were received. Independent browser execution remains unavailable, but the manual acceptance results are recorded as PASS rather than discarded.

## Delivered behavior
- Yearly savings derive from the actual active same-currency catalog; USD10 monthly versus USD100 yearly displays Save 17%. Yearly remains default and the only Most Popular plan. Existing checkout and entitlement handling were not changed.
- Mobile-only compact MatchMe header with one accessible green Save Preferences control and five sections: combined roles/keywords, countries, Job Type, Work Style and Level. Desktop Preferences layout remains unchanged.
- Canonical removable role/keyword chips, total limit10 and case-insensitive duplicate rejection; canonical ISO countries; separate relationship/style fields; hidden legacy levels and unrelated preference fields preserved.
- Existing Supabase profile load/save, modified-field patches, three-way conflict detection and atomic timestamp/JSON comparison. Backend acknowledgement precedes success, shared refresh and Swipe return.
- Unsaved Back/tab/reload protection, canonical preference ranking of real vacancies and existing EN/AR support.

## Independent verification
Correct existing Supabase project `ykvlaakotyouojkdydzh` and frontend endpoint: PASS. JSONB schema and owner RLS: PASS. Rollback-only authorized save/readback, hidden-field preservation, stale-write rejection and cross-account isolation: PASS. REST JSON equality filter parsing: PASS.

The user-confirmed test vacancy is Sales Executive, UUID `0c988c65-2e17-4294-9954-ba31072f2f61`, published October25 by Tech. Its persisted open status, seeker/Company join, committed pending application and owning Company applicant projection were verified. Canonical Preferences with all six visible fields exist for the inspected applicant. Database presence alone is not proof of the user's logout/login sequence; that sequence is supported by manual observation.

Live VIA catalog: USD1000 monthly/USD10000 yearly in minor units, active and same currency. Actual retrieved real-vacancy payload preference scores change with matching criteria; prior decisions remain excluded.

Previously completed TypeScript,155 contracts, lint and build passed. No application source changed during recovery, so unchanged validation was not repeated. Prior visual validation covered the guest landing only.

## Preservation and limitations
No new project, database reset, schema migration, generated vacancy, RLS bypass or committed production-record change was performed by the agent in this recovery round. Temporary authorization fixtures were rolled back. No confirmed defect required rebuilding completed functionality.

Independent signed-in screenshots, exhaustive multi-device/desktop regression and overlapping real browser concurrency remain unexecuted. Previous payment sandbox/provider-release checks remain outside the verified pricing-display scope; this acceptance is not certification of production purchase readiness.
