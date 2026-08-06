# MATCHME ENTERPRISE PLATFORM
# Enterprise Engineering Standards — Prompt 1
# Version 1.0

## Objective

This document defines the official engineering standards for the MatchMe platform.

It establishes how code must be written, organized, tested, documented, secured, optimized, and maintained.

Every implementation must comply with this document.

Prompt 0 (Platform Architecture Charter) defines the architecture.

Prompt 1 defines how engineers implement that architecture.

These standards apply to:

- Job Seeker Portal
- Company Portal
- Super Admin Portal
- AI Services
- Marketplace
- CRM
- ATS
- Future MatchMe products

---

## Engineering Philosophy

Every implementation must prioritize:

- Readability
- Reusability
- Maintainability
- Scalability
- Performance
- Security
- Accessibility
- Testability
- Documentation
- Simplicity

Write code that future developers can understand quickly.

Avoid clever code.

Prefer clear code.

---

## Development Principles

Always:

- ✓ Extend existing systems.
- ✓ Reuse components.
- ✓ Reuse engines.
- ✓ Reuse layouts.
- ✓ Reuse hooks.
- ✓ Reuse services.

Never duplicate functionality.

Never create isolated implementations.

---

## Project Structure

Organize code by feature.

```
src/
  app/
  features/
  shared/
    engines/
    components/
    hooks/
    services/
    providers/
  lib/
  types/
  utils/
  constants/
  config/
  styles/
  assets/
  tests/
```

Each folder should have a clear responsibility.

---

## Feature Modules

Each feature should contain:

```
components/
hooks/
services/
types/
utils/
pages/
tests/
constants/
```

Do not scatter feature files throughout the project.

---

## Component Standards

Components must be:

- Small
- Reusable
- Composable
- Independent
- Configurable

Avoid page-specific components whenever possible.

Every reusable component belongs in the Component Library.

---

## Component Rules

Components should:

- Receive data through props.
- Avoid unnecessary internal state.
- Avoid business logic.
- Avoid database access.
- Avoid API calls unless specifically designed as a container component.
- Separate presentation from logic.

---

## Hooks Standards

Reusable logic belongs inside hooks.

Examples:

- `useAuth()`
- `useProfile()`
- `useSearch()`
- `useMessaging()`
- `useSubscription()`
- `useSwipe()`
- `useResponsive()`

Avoid duplicated logic.

---

## Services

Business logic belongs in services.

Examples:

- `AuthenticationService`
- `MessagingService`
- `MatchingService`
- `SearchService`
- `SubscriptionService`
- `BillingService`
- `NotificationService`
- `AnalyticsService`

Never place business logic inside UI components.

---

## TypeScript Standards

Strict mode is mandatory.

Avoid:

- `any`
- `unknown` workarounds
- unsafe casting

Create explicit types.

Prefer interfaces for object contracts.

Use utility types where appropriate.

---

## Naming Conventions

| Category | Convention |
|----------|-----------|
| Components | PascalCase |
| Hooks | useSomething |
| Services | SomethingService |
| Utilities | camelCase |
| Constants | UPPER_SNAKE_CASE |
| Types | PascalCase |
| Interfaces | Descriptive names |
| Database tables | snake_case |
| Database columns | snake_case |

Avoid abbreviations unless universally understood.

---

## State Management

Keep state as local as possible.

Use shared state only when necessary.

Avoid unnecessary global state.

Separate:

- UI state
- Business state
- Server state
- Authentication state

---

## API Standards

Every API should support:

- Pagination
- Sorting
- Filtering
- Searching
- Error handling
- Consistent response formats
- Versioning

Never expose internal implementation details.

---

## Database Standards

All database changes must include:

- Migration
- Indexes
- Foreign keys
- Constraints
- RLS review
- Audit fields: `created_at`, `updated_at`, `deleted_at` (if soft deletes)

Avoid breaking schema changes.

---

## Supabase Standards

Every table must review:

- RLS
- Policies
- Indexes
- Storage
- Realtime
- Security

Never expose sensitive data through the frontend.

---

## Error Handling

Every operation should return:

- Success
- Warning
- Recoverable Error
- Fatal Error

Never display raw system errors to users.

Always log technical details.

Display user-friendly messages.

---

## Logging Standards

Log:

- Errors
- Warnings
- Authentication
- Permission failures
- API failures
- AI failures
- Unexpected states

Never log sensitive user data.

---

## Security Standards

Validate:

- Frontend
- Backend
- Database

Never trust client input.

Enforce authorization server-side.

Review every endpoint for security implications.

---

## Accessibility Standards

Every implementation must support:

- WCAG AA
- Keyboard navigation
- Screen readers
- RTL
- Reduced motion
- Dynamic font scaling
- High contrast

Accessibility is mandatory.

---

## Responsive Standards

Support:

320, 360, 375, 390, 412, 768, 1024, Desktop

Never implement desktop-first layouts.

Mobile First. Desktop Enhanced.

---

## Performance Standards

Use:

- Lazy loading
- Memoization
- Virtualization
- Image optimization
- Code splitting
- Caching

Avoid unnecessary renders.

---

## Component Reuse

Before creating: Button, Card, Dialog, Bottom Sheet, Avatar, Chip, Progress Bar, Search, Navigation, Timeline, Score Bar —

Check whether an existing reusable component already exists.

If yes: Reuse it.

If not: Extend the Component Library.

---

## Platform Engine Integration

Every implementation must reuse existing platform engines.

Examples:

- Layout Engine
- Card Engine
- Decision Screen Engine
- Swipe Feedback Engine
- Workflow Engine
- Notification Engine
- Score Visualization Engine
- Feature Registry
- Responsive Validation Engine

Do not duplicate responsibilities.

---

## AI Standards

AI must:

- Explain recommendations where appropriate.
- Expose confidence when relevant.
- Respect permissions.
- Respect privacy.
- Never bypass business rules.

---

## Testing Standards

Every implementation requires:

- Unit Tests
- Integration Tests
- End-to-End Tests
- Accessibility Validation
- Responsive Validation
- Regression Testing
- Performance Testing
- Security Review

---

## Documentation Standards

Every implementation must include:

- Purpose
- Architecture impact
- Files modified
- Components reused
- New components
- Routes
- Database changes
- API changes
- Permissions
- Tests
- Known limitations
- Future recommendations

---

## Pull Request Standards

Every implementation summary must include:

- Objective
- Approach
- Files modified
- Components created
- Components reused
- Database changes
- API changes
- Engine updates
- Testing completed
- Known risks
- Future improvements

---

## Code Review Checklist

Before completing any task verify:

- ✓ No duplicate components.
- ✓ No duplicate business logic.
- ✓ No hardcoded values.
- ✓ No unnecessary dependencies.
- ✓ No console errors.
- ✓ No TypeScript errors.
- ✓ No lint errors.
- ✓ No accessibility violations.
- ✓ No responsive regressions.
- ✓ Desktop preserved.
- ✓ Mobile optimized.
- ✓ Feature Registry updated.
- ✓ Documentation updated.

---

## Mandatory Completion Rule

A task is NOT complete after writing code.

A task is complete only after:

- Architecture review
- Code review
- Testing
- Responsive validation
- Accessibility validation
- Performance review
- Security review
- Documentation
- Feature Registry update
- Final verification

---

## Final Engineering Rule

Every future implementation must answer these questions before new code is written:

1. Does this already exist?
2. Can an existing engine be reused?
3. Can an existing component be reused?
4. Can an existing service be extended?
5. Can an existing hook be reused?
6. Can this be configured instead of rebuilt?
7. Will this increase technical debt?
8. Will this remain maintainable in five years?
9. Is it fully responsive?
10. Is it fully accessible?
11. Is it secure?
12. Is it properly documented?

If any answer is "No", improve the implementation before proceeding.

The goal of MatchMe is not merely to ship features—it is to build a scalable, maintainable, secure, enterprise-grade platform that can evolve for years without accumulating unnecessary technical debt.