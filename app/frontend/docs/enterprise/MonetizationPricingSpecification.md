# MATCHME ENTERPRISE PLATFORM
# Prompt 10 – Monetization, Pricing & Subscription Engine
## Revenue Engine 💰
### Version 1.0

---

## 1. Monetization Strategy Overview

The platform must generate revenue from:

### Primary Revenue Streams

- Employer subscriptions (main revenue driver)
- Pay-per-hire / success fees
- Credits system (boosts, unlocks)
- Premium job seeker features

### Secondary Revenue Streams

- Featured job listings
- Employer branding pages
- Talent database access
- Ads (future phase)

---

## 2. Pricing Model Design

### 2.1 Employer Subscription Plans

#### Tier 1 – Basic

- Limited job postings (e.g., 2–3 active jobs)
- Limited candidate views
- Basic matching
- No advanced analytics

#### Tier 2 – Growth

- More job postings
- Unlimited matches
- Messaging enabled
- Basic analytics
- Interview scheduling

#### Tier 3 – Pro

- Unlimited jobs
- Advanced AI matching
- Full ATS pipeline
- Team collaboration
- Priority support

#### Tier 4 – Enterprise

- Custom pricing
- API access
- Dedicated account manager
- Advanced analytics
- Integrations (HR systems)

---

### 2.2 Pay-Per-Use Model

Charge for:

- Unlock candidate contact details
- Boost job visibility
- Featured listings
- AI-powered shortlist generation

---

### 2.3 Credit System

Introduce credits as a flexible currency.

**Use Cases:**

- Unlock candidate profile
- Boost job
- Send direct invite

**Example:**

- 1 credit = unlock candidate
- 5 credits = featured job

---

### 2.4 Success Fee Model (Optional but HIGH VALUE)

- Charge % of salary on successful hire
- Example: 5%–10% of annual salary

---

### 2.5 Job Seeker Monetization (Optional)

- Profile boost
- AI CV optimization
- Career insights
- Priority visibility to employers

---

## 3. Billing & Payment System

### Features

**Subscription management:**

- Monthly / yearly plans
- Auto-renewals
- Upgrade / downgrade
- Proration logic

**Payments — Integrate with:**

- Stripe
- Local payment gateways (KSA/MENA)
- Apple Pay / Google Pay

**Invoices:**

- Generate PDF invoices
- VAT compliant (important for KSA)
- Store billing history

---

## 4. Access Control (CRITICAL)

Tie features to plans:

| Feature | Basic | Growth | Pro | Enterprise |
|---------|-------|--------|-----|------------|
| Job postings | Limited | More | Unlimited | Unlimited |
| Messaging | ❌ | ✅ | ✅ | ✅ |
| AI Matching | Basic | Medium | Advanced | Advanced |
| Analytics | ❌ | Basic | Advanced | Advanced |
| API Access | ❌ | ❌ | ❌ | ✅ |
| Team Collaboration | ❌ | ❌ | ✅ | ✅ |
| ATS Pipeline | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |

---

## 5. Feature Gating System

Implement middleware that:

- Checks user subscription
- Enables/disables features dynamically

**Example:**

```typescript
if (!user.hasFeature("UNLIMITED_JOBS")) {
  blockAction();
}
```

**Gating Rules:**

- Check on every API request
- Cache subscription status
- Real-time plan changes reflected immediately
- Graceful degradation (show upgrade prompt, not error)

---

## 6. Revenue Optimization Logic

### Smart Upsells

Show upgrade prompts when:

- Employer runs out of job slots
- Wants to message locked candidates
- Needs more visibility
- Reaches analytics limit

### Dynamic Pricing (Future)

Adjust pricing based on:

- Market demand
- Hiring urgency
- Industry
- Region

---

## 7. Analytics & Revenue Dashboard

Track:

- **MRR** (Monthly Recurring Revenue)
- **ARPU** (Average Revenue Per User)
- **Conversion rate** (free → paid)
- **Churn rate**
- **LTV** (Lifetime Value)
- **CAC** (Customer Acquisition Cost)
- Revenue by plan tier
- Revenue by region
- Credit usage patterns
- Upgrade/downgrade trends

---

## 8. Data Model

```sql
-- Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT NOT NULL, -- 'basic', 'growth', 'pro', 'enterprise'
    billing_cycle TEXT, -- 'monthly', 'yearly'
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB NOT NULL,
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    plan_id UUID REFERENCES plans(id),
    status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'trialing'
    billing_cycle TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    subscription_id UUID REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT, -- 'succeeded', 'failed', 'pending', 'refunded'
    payment_method TEXT,
    stripe_payment_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue'
    due_date DATE,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credits
CREATE TABLE credits (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    balance INTEGER DEFAULT 0,
    total_purchased INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    type TEXT NOT NULL, -- 'purchase', 'use', 'refund', 'bonus'
    amount INTEGER NOT NULL,
    description TEXT,
    reference_type TEXT, -- 'candidate_unlock', 'job_boost', 'direct_invite'
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags (per plan)
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY,
    plan_id UUID REFERENCES plans(id),
    feature_key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    limit_value INTEGER, -- null = unlimited
    metadata JSONB,
    UNIQUE(plan_id, feature_key)
);
```

---

## 9. Multi-Tenant Billing

- Each company = tenant
- Separate billing per company
- Support multiple users under one subscription
- Company admin manages billing
- Usage tracked per company, not per user

---

## 10. Discounts & Promotions

Support:

- Promo codes
- Free trials (7-day, 14-day, 30-day)
- Limited-time discounts
- Annual billing discount (e.g., 2 months free)
- Referral credits
- Partner discounts

---

## 11. Compliance & Tax

- VAT support (KSA requirement — 15%)
- Invoice numbering (sequential, auditable)
- Payment audit logs
- Tax calculation per region
- Export-ready financial reports
- ZATCA e-invoicing compliance (Saudi Arabia)

---

## 12. Performance Requirements

- Billing accuracy = 100%
- Real-time subscription updates
- Scalable to thousands of companies
- Payment processing < 3s
- Invoice generation < 5s
- Credit balance updates: real-time

---

## 13. API Endpoints

### Subscriptions

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/subscriptions` | GET | Get current subscription |
| `/subscriptions` | POST | Create subscription |
| `/subscriptions` | PATCH | Upgrade/downgrade |
| `/subscriptions/cancel` | POST | Cancel subscription |

### Payments

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/payments` | GET | Payment history |
| `/payments/method` | POST | Add payment method |
| `/payments/checkout` | POST | Create checkout session |

### Credits

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/credits/balance` | GET | Get credit balance |
| `/credits/purchase` | POST | Purchase credits |
| `/credits/use` | POST | Use credits |
| `/credits/history` | GET | Transaction history |

### Invoices

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/invoices` | GET | List invoices |
| `/invoices/:id/pdf` | GET | Download invoice PDF |

### Plans

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/plans` | GET | List available plans |
| `/plans/compare` | GET | Compare plans |

---

## 14. Events Published

- SubscriptionCreated
- SubscriptionUpgraded
- SubscriptionDowngraded
- SubscriptionCancelled
- SubscriptionRenewed
- PaymentSucceeded
- PaymentFailed
- InvoiceGenerated
- CreditsPurchased
- CreditsUsed
- TrialStarted
- TrialExpired
- PromoCodeApplied
- FeatureLimitReached
- UpsellTriggered

Events integrate with Analytics Engine and Platform Intelligence Engine.

---

## 15. Future Monetization Features

- Marketplace for recruiters
- Sponsored candidates
- AI hiring assistant (paid add-on)
- Data insights subscription
- White-label solutions
- Partner API monetization

---

## 16. Output Requirements

**For Employers:**

- Subscription dashboard
- Billing history
- Credit balance
- Usage tracking
- Plan comparison
- Upgrade prompts

**For Admin:**

- Revenue dashboard (MRR, ARPU, churn)
- Plan management
- Pricing control
- Discount management
- Financial reports

---

## 17. Success Criteria

- High conversion rate (free → paid): target 5–10%
- Low churn: < 5% monthly
- High LTV: > 12x monthly plan cost
- Clear value per tier (measurable ROI for employers)
- Credit system drives engagement

---

## 18. Integration with Platform Engines

The Monetization Engine integrates with:

- **API Gateway** — enforces feature gating per request
- **Security Engine** — validates subscription status
- **Analytics Engine** — tracks revenue metrics
- **Notification Engine** — sends billing alerts
- **Event Platform** — publishes subscription lifecycle events
- **Workflow Engine** — automates trial → paid transitions
- **Platform Intelligence Engine** — predicts churn, recommends pricing

---

## 19. Final Platform Rule

Every paid feature within MatchMe is governed by the Monetization Engine.

No feature is accessible without subscription validation. No payment is untracked. No invoice is non-compliant.

The Monetization Engine is the revenue backbone of MatchMe — converting platform value into sustainable business growth.