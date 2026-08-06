# MATCHME ENTERPRISE PLATFORM
# Prompt 5 – Enterprise Data Platform Specification
## Part 4 — Database Standards & Naming Conventions
### Version 1.0

---

# Objective

This document establishes the official database engineering standards for the MatchMe Enterprise Platform.

It defines:

- Database naming conventions
- Schema standards
- Table standards
- Column standards
- Constraint standards
- Index standards
- Views
- Materialized views
- Functions
- Stored procedures
- Triggers
- Migrations
- Versioning
- Performance standards

Every database object across every current and future MatchMe product must follow these standards.

---

# Database Philosophy

The database is part of the platform.

Not part of a feature.

Every schema should feel like it was created by one architect.

Consistency is more important than personal preference.

---

# Database Principles

Every database object must be:

- Canonical
- Versioned
- Auditable
- Documented
- Secure
- Searchable
- Observable
- Extensible
- Performant
- Future Proof

---

# Database Standards

**Use:** `snake_case`

**Avoid:**
- camelCase
- PascalCase
- Spaces
- Abbreviations

Table names remain singular.

**Example**

- candidate
- company
- application
- interview
- invoice
- subscription

**Never**

- candidates
- jobs
- companies

---

# Schema Standards

Schemas represent domains.

**Examples**

- identity
- organization
- people
- recruitment
- workflow
- crm
- marketplace
- billing
- communication
- analytics
- audit
- configuration
- security
- ai
- operations

Do not create feature-specific schemas.

---

# Table Naming

Use singular nouns.

**Example**

- candidate
- company
- job
- application
- conversation
- message
- offer
- resume
- skill
- payment

**Never use:**

- candidate_tbl
- tbl_candidate
- candidate_data

---

# Column Naming

Always use descriptive names.

**Examples**

- candidate_id
- organization_id
- created_at
- updated_at
- deleted_at
- created_by
- updated_by
- status
- version

**Never use**

- cid
- orgid
- dt

---

# Primary Keys

Every table uses:

- `id` UUID
- Immutable
- Generated automatically

Do not expose sequential IDs.

---

# Foreign Keys

Always reference canonical IDs.

**Example**

- candidate_id
- company_id
- organization_id
- job_id
- application_id
- invoice_id

Use explicit foreign keys.

---

# Audit Columns

Every table includes:

- id
- created_at
- updated_at
- created_by
- updated_by
- deleted_at
- deleted_by
- version
- tenant_id
- organization_id

No exceptions.

---

# Soft Deletes

Never permanently delete business entities.

Use:
- deleted_at
- deleted_by

Entities remain recoverable.

---

# Status Standards

Status fields use enumerations.

**Examples**

- draft
- active
- paused
- archived
- deleted
- pending
- approved
- rejected

Avoid free-text status values.

---

# Boolean Naming

Prefix with:

- `is_`
- `has_`
- `can_`

**Examples**

- is_active
- is_verified
- has_resume
- can_publish

---

# Date Naming

Suffix with: `_at`

**Examples**

- published_at
- approved_at
- accepted_at
- completed_at
- scheduled_at

Avoid generic names like "date".

---

# Monetary Values

Always store:

- amount
- currency_code

Never store formatted values.

Support multi-currency.

---

# Address Standards

Separate fields:

- street
- city
- state
- postal_code
- country_code
- latitude
- longitude

Avoid storing addresses in one column.

---

# Localization Standards

Separate:

- language_code
- locale
- timezone

Never infer localization.

---

# Enum Standards

Centralize enums.

**Examples**

- ApplicationStatus
- InterviewType
- SubscriptionPlan
- UserRole
- NotificationChannel

Do not duplicate enums.

---

# Constraint Standards

Every table defines:

- Primary Key
- Foreign Keys
- Unique Constraints
- Check Constraints
- Required Fields
- Tenant Constraints
- Version Constraints

---

# Unique Constraints

**Examples**

- email
- organization_slug
- company_slug
- username

Prevent duplicates at the database level.

---

# Index Standards

Index:

- Foreign Keys
- Search Fields
- Status Fields
- Created At
- Updated At
- Tenant ID
- Organization ID
- Frequently filtered columns

Avoid unnecessary indexes.

---

# Composite Indexes

Support:

- tenant_id + status
- organization_id + created_at
- candidate_id + application_status

Optimize common queries.

---

# Full-Text Search

Searchable entities expose:

`search_vector` or equivalent search index.

**Supports**

- Jobs
- Candidates
- Companies
- Marketplace
- CRM
- Knowledge

---

# Views

Use views for:

- Reporting
- Dashboards
- Analytics
- Read-only projections

Avoid business logic.

---

# Materialized Views

Use only for:

- Heavy analytics
- Executive dashboards
- AI reporting

Refresh automatically.

---

# Functions

Database functions should:

- Be deterministic where possible
- Avoid business workflows
- Remain versioned
- Be documented

---

# Triggers

Use triggers sparingly.

**Allowed**

- Audit
- Updated timestamp
- Search updates
- Event publishing

**Not allowed**

- Business workflows
- Complex logic
- Notifications

---

# Migration Standards

Every schema change requires:

- Migration ID
- Description
- Author
- Version
- Rollback
- Validation
- Documentation

Migration history is immutable.

---

# Versioning

Every schema supports:

- Current Version
- Migration History
- Rollback Plan
- Compatibility Matrix

---

# Performance Standards

Every query should target:

- Standard queries: <100 ms
- Complex analytics: <1 second
- Long-running jobs: Background execution

---

# Naming Prefixes

| Prefix | Usage |
|--------|-------|
| `pk_` | Primary Key |
| `fk_` | Foreign Key |
| `idx_` | Index |
| `uq_` | Unique Constraint |
| `chk_` | Check Constraint |
| `vw_` | View |
| `mv_` | Materialized View |
| `fn_` | Function |
| `trg_` | Trigger |

**Examples**

- pk_candidate
- fk_application_candidate
- idx_candidate_status
- vw_active_jobs

---

# Security Standards

Support:

- Row-Level Security
- Encryption
- Least Privilege
- Tenant Isolation
- Audit

No direct table access outside approved services.

---

# Documentation Standards

Every database object documents:

- Purpose
- Owner
- Dependencies
- Relationships
- Indexes
- Constraints
- Version
- Consumers

---

# Registry Integration

Register every object in:

- Schema Registry
- Entity Registry
- Relationship Registry
- Migration Registry
- Documentation Registry
- Governance Registry

---

# Validation

Verify:

- ✓ Naming compliance
- ✓ Constraint validation
- ✓ Index optimization
- ✓ Tenant isolation
- ✓ Audit compliance
- ✓ Security
- ✓ Documentation
- ✓ Performance benchmarks
- ✓ Migration validation

---

# Deliverables

Provide:

- Database Standards Manual
- Naming Convention Guide
- Schema Standards
- Migration Standards
- Constraint Catalog
- Index Catalog
- Database Object Registry
- Validation Reports
- Performance Guidelines
- Future Evolution Strategy

---

# Final Platform Rule

Every database object created within MatchMe must comply with this specification.

No engineer, AI coding assistant, migration, extension, or future module may introduce database objects that violate these naming conventions or engineering standards.

This document becomes the official database engineering standard across all current and future MatchMe products.

---

# Strategic Architectural Recommendation

## Database Governance Engine

Introduce a centralized **Database Governance Engine**.

**Purpose**

Continuously validate the enterprise database against architectural standards.

**Responsibilities**

- ✓ Enforce naming conventions.
- ✓ Validate schema consistency.
- ✓ Detect duplicate tables or columns.
- ✓ Verify index health.
- ✓ Monitor migration quality.
- ✓ Detect missing foreign keys.
- ✓ Validate tenant isolation.
- ✓ Ensure audit columns exist.
- ✓ Verify documentation completeness.
- ✓ Recommend query optimizations.
- ✓ Generate schema health reports.
- ✓ Feed metrics into the Platform Intelligence Engine.

The Database Governance Engine becomes the automated guardian of MatchMe's Enterprise Data Platform, ensuring that every schema change, migration, and database object remains consistent with the architectural standards defined in this specification.
