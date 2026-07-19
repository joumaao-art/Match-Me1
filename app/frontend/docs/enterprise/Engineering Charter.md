# MatchMe Engineering Charter

## Objective

This is the foundational document of the MatchMe platform.

It defines the mandatory engineering principles that every future feature, refactoring, bug fix, UI enhancement, API, database change, AI implementation, and architectural decision must follow.

This document is the permanent development constitution of MatchMe.

Every future implementation must comply with these rules.

---

## Mission

MatchMe is an enterprise recruitment platform.

Every engineering decision must prioritize:

1. **Scalability** — Design for growth from day one
2. **Maintainability** — Code should be easy to understand and modify
3. **Reusability** — Build once, use everywhere
4. **Performance** — Fast, efficient, optimized
5. **Security** — Protect data and users at every layer
6. **Accessibility** — Inclusive design for all users
7. **Localization** — Bilingual (EN/AR) with RTL support
8. **Consistency** — Uniform patterns across the platform
9. **Developer Experience** — Clear APIs, good tooling, fast iteration
10. **AI-assisted Development** — Leverage AI for matching, recommendations, and insights
11. **Future Expansion** — Architecture that accommodates new modules without refactoring

---

## Core Principles

Every implementation must follow these principles.

### 1. Reuse Before Creating

Always search for existing components, services, utilities, hooks, APIs, and database tables before creating new ones.

Never duplicate functionality.

**Before writing any new code, ask:**
- Does a shared component already exist?
- Does a service already handle this?
- Does a Platform Engine already cover this?
- Does a database table already store this data?

### 2. Configuration Over Hardcoding

Business rules should be configurable whenever possible.

**Configurable elements include:**
- Menus & Navigation
- Permissions & Roles
- Statuses & Workflows
- Collections & Entities
- Subscriptions & Feature Flags
- Forms & Validation Rules

### 3. Composable Architecture

Build reusable, composable modules.

Avoid tightly coupled implementations.

Every module should be independently testable and deployable.

### 4. Platform-First Development

If functionality could benefit multiple modules, promote it into a Platform Engine.

**Current Platform Engines:**
- Navigation Engine
- Collections Engine
- Permissions Engine
- Workflow Engine
- Notification Engine
- Search Engine
- Localization Engine
- Audit Engine
- Billing Engine
- AI Engine

### 5. Mobile-First Responsive Development

Every feature must work across desktop, tablet, and mobile.

Design mobile-first, then enhance for larger screens.

### 6. Localization-First

Every user-facing string must use the localization system (i18next).

Never hardcode English or Arabic text.

Support RTL layout switching.

Support pluralization and date/number formatting.

### 7. Accessibility-First

Meet WCAG 2.1 AA standards.

Requirements:
- Keyboard navigation for all interactive elements
- Screen reader compatibility (ARIA labels, roles, live regions)
- Focus management (trapping, restoration, skip links)
- Sufficient color contrast
- Semantic HTML structure

### 8. Security-First

Validate everything server-side.

Never trust client input.

Follow the principle of least privilege.

Requirements:
- Row Level Security (RLS) on all database tables
- Server-side permission validation
- Input sanitization
- CSRF/XSS protection
- Secure session management
- Audit logging for sensitive operations

### 9. Performance-First

Every implementation should consider:
- Lazy loading (routes, components, data)
- Pagination (cursor-based for large datasets)
- Caching (multi-layer with TTL)
- Realtime optimization (batching, throttling)
- Background processing (non-blocking operations)
- Virtualization (large lists)
- Memoization (expensive computations)
- Minimal re-rendering

### 10. Documentation-First

Every major architectural change must update documentation.

Document:
- Architecture decisions (ADRs)
- API contracts
- Database schema changes
- Platform Engine extensions
- Component APIs

---

## Platform Engine Rule

Before implementing any feature, ask:

> Does this belong inside an existing Platform Engine?

**If yes:** Extend the engine. Do not create duplicate implementations.

**If no:** Consider whether this should become a new Platform Engine.

---

## Experience Engine Rule

Before building UI, ask:

> Can an existing Experience Engine component be reused?

**If yes:** Reuse it with configuration.

**If no:** Create a reusable Experience Engine component that can serve future modules.

Never create module-specific UI when a reusable component is appropriate.

---

## Database Rules

Before creating tables:

1. Check existing schema for similar structures
2. Reuse relationships and foreign keys
3. Avoid duplicate data storage
4. Normalize entities appropriately
5. Use Supabase best practices
6. Apply Row Level Security to every table
7. Design for scalability (indexes, partitioning considerations)
8. Include `created_at` and `updated_at` timestamps
9. Use UUID primary keys
10. Document schema changes

---

## API Rules

1. Reuse existing endpoints before creating new ones
2. Maintain naming consistency (kebab-case for URLs, camelCase for JSON)
3. Version APIs when breaking changes are introduced
4. Return consistent response shapes (`{ data, error, meta }`)
5. Centralize validation (Zod schemas in shared package)
6. Document all endpoints
7. Rate limit sensitive operations
8. Log all mutations for audit

---

## Supabase Rules

Always use:

- **Supabase Auth** — For all authentication and session management
- **PostgreSQL** — As the primary database
- **Realtime** — For live data synchronization
- **Storage** — For file uploads (images, CVs, documents)
- **Edge Functions** — For server-side logic where appropriate
- **Row Level Security** — On every table, no exceptions
- **Policies** — Granular access control per role
- **Indexes** — On all frequently queried columns

Never bypass Supabase security layers.

---

## React Rules

Use:

- **TypeScript** — Strict mode, no `any` types
- **Functional Components** — No class components
- **Hooks** — Custom hooks for reusable logic
- **Composition** — Prefer composition over inheritance
- **Reusable Components** — Shared UI library (shadcn/ui + custom)
- **Memoization** — `memo`, `useMemo`, `useCallback` where appropriate

Avoid:
- Duplicated logic across components
- Prop drilling (use context or state management)
- Side effects outside `useEffect`
- Direct DOM manipulation

---

## Design System Rules

1. Use only shared components from the component library
2. Use shared design tokens (colors, spacing, typography, shadows)
3. Follow the 4px/8px spacing system
4. Follow the typography scale (Poppins headings, Open Sans body)
5. Follow the color system (Primary #2563EB, Secondary #3B82F6, Background #F8FAFC)
6. No inconsistent UI — every element must align with the design system
7. Support dark mode via CSS variables
8. Support RTL via logical properties (`start`/`end` instead of `left`/`right`)

---

## Localization Rules

Support:

- **English** — Primary language
- **Arabic** — Full RTL support
- **Pluralization** — Proper plural forms for both languages
- **Number/Date Formatting** — Locale-aware formatting
- **Future Language Packs** — Architecture supports adding new languages

Implementation:
- All strings via `t()` function (i18next)
- Translation keys in `packages/shared/src/i18n/`
- No hardcoded text in components
- Test both LTR and RTL layouts

---

## Performance Rules

Every implementation should consider:

| Technique | When to Use |
|-----------|-------------|
| Virtualization | Lists > 50 items |
| Memoization | Expensive computations, stable references |
| Caching | Frequently accessed data, API responses |
| Realtime efficiency | Batch updates, throttle subscriptions |
| Background loading | Non-critical data, prefetching |
| Minimal rendering | Avoid unnecessary re-renders |
| Code splitting | Route-level lazy loading |
| Image optimization | Responsive images, lazy loading, WebP |

---

## Testing Rules

Every feature should include:

| Test Type | Purpose |
|-----------|---------|
| Unit Tests | Individual functions, hooks, utilities |
| Integration Tests | Component interactions, API calls |
| Permission Tests | RBAC validation, RLS policies |
| Localization Tests | All languages render correctly |
| Accessibility Tests | WCAG compliance, keyboard navigation |
| Performance Tests | Load times, bundle sizes, memory |
| Regression Tests | Existing functionality preserved |

---

## Architectural Review Checklist

Before implementing anything, verify:

- [ ] Existing reusable component available?
- [ ] Existing reusable service available?
- [ ] Existing Platform Engine covers this?
- [ ] Existing database table stores this data?
- [ ] Existing API endpoint handles this?
- [ ] Existing hook provides this logic?
- [ ] Existing utility function does this?
- [ ] Existing design pattern applies?

**If any answer is YES → Reuse it.**

---

## Prohibited Practices

Do NOT:

| Practice | Reason |
|----------|--------|
| Duplicate components | Increases maintenance burden |
| Duplicate services | Creates inconsistency |
| Duplicate APIs | Confuses consumers |
| Duplicate database tables | Wastes storage, causes sync issues |
| Hardcode business rules | Prevents configuration |
| Hardcode permissions | Bypasses RBAC |
| Hardcode localization | Breaks i18n |
| Bypass security | Exposes vulnerabilities |
| Ignore RTL | Excludes Arabic users |
| Ignore accessibility | Excludes users with disabilities |
| Create inconsistent UI | Damages user experience |
| Introduce technical debt knowingly | Compounds future costs |

---

## Definition of Done

A feature is complete only if it is:

- [ ] **Reusable** — Can be used by other modules
- [ ] **Localized** — All strings use i18n (EN + AR)
- [ ] **Accessible** — WCAG 2.1 AA compliant
- [ ] **Responsive** — Works on mobile, tablet, desktop
- [ ] **Secure** — Server-side validation, RLS, least privilege
- [ ] **Performant** — Lazy loaded, paginated, cached where appropriate
- [ ] **Documented** — Architecture decisions recorded
- [ ] **Tested** — Unit, integration, and permission tests
- [ ] **Integrated with Platform Engines** — Uses existing engines
- [ ] **Uses the Experience Engine** — Shared UI components
- [ ] **Uses shared components** — From the component library
- [ ] **Uses shared services** — From the service layer

---

## Mandatory Pre-Implementation Review

Before implementing any future feature, enhancement, refactoring, or bug fix, always perform the following sequence:

1. Review the Engineering Charter
2. Review the Enterprise Platform Blueprint
3. Review the Engineering Standards Guide
4. Review the Experience Engine & Design System
5. Review the Database Architecture
6. Review the API Standards
7. Review the AI Architecture (if applicable)
8. Identify reusable Platform Engines, components, services, APIs, hooks, and database structures
9. Confirm that no duplicate functionality will be introduced
10. Only then begin implementation

**If any proposed implementation violates these standards, stop and recommend an alternative that aligns with the MatchMe platform architecture.**

---

## Platform Engines Registry

| Engine | Status | Description |
|--------|--------|-------------|
| Navigation Engine | ✅ Active | Config-driven sidebar, breadcrumbs, routing |
| Collections Engine | ✅ Active | Universal entity collections with enterprise features |
| Permissions Engine | ✅ Active | RBAC, feature flags, subscription entitlements |
| Workflow Engine | ✅ Active | State machines, automation triggers/actions |
| Notification Engine | ✅ Active | Multi-channel (in-app, email, push, SMS) |
| Search Engine | ✅ Active | Full-text search, filters, facets |
| Localization Engine | ✅ Active | i18next, EN/AR, RTL, pluralization |
| Audit Engine | ✅ Active | Activity tracking, compliance logging |
| Billing Engine | ✅ Active | Subscriptions, payments, entitlements |
| AI Engine | ✅ Active | Matching, recommendations, insights |

---

## Document History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-07-19 | 1.0.0 | Engineering Team | Initial Engineering Charter created |

---

*This document is the mandatory development standard for every future MatchMe implementation. All team members must review and comply with these standards before beginning any work.*