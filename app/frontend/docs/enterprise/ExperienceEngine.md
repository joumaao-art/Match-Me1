# MatchMe Experience Engine — Platform Documentation

> **Version**: 2.0 | **Last Updated**: 2026-08-06 | **Status**: Active

## Overview

The Experience Engine is MatchMe's unified framework for building consistent, high-quality user experiences across all platforms and form factors. It defines mandatory patterns, reusable components, and validation systems that ensure every feature meets platform standards.

---

## 1. Mobile-First Standards

### 1.1 Design Principles

| Principle | Rule |
|-----------|------|
| **Viewport-First** | Primary content must fit within one viewport (no scroll for core actions) |
| **Thumb-Friendly** | Touch targets ≥ 44px (preferably 48-56px), bottom-aligned for one-hand use |
| **Progressive Disclosure** | Show essential info first, details on tap/expand |
| **Safe Area Aware** | All fixed elements respect `env(safe-area-inset-*)` |
| **Performance** | First meaningful paint < 1.5s on 3G, 60fps animations |

### 1.2 Layout Architecture

```
┌─────────────────────────────────────┐
│ Header (shrink-0, max 48px)         │
├─────────────────────────────────────┤
│ Sub-header / Chips (shrink-0)       │
├─────────────────────────────────────┤
│                                     │
│ Content Area (flex-1, overflow)     │
│                                     │
├─────────────────────────────────────┤
│ Actions (shrink-0, always visible)  │
├─────────────────────────────────────┤
│ Bottom Nav (56px + safe-area)       │
└─────────────────────────────────────┘
```

**Height Formula**: `calc(100dvh - 56px - env(safe-area-inset-bottom))`

### 1.3 Component Standards

| Component | Mobile Pattern | Implementation |
|-----------|---------------|----------------|
| Navigation | Bottom tab bar (5 tabs max) | `MobileBottomNav.tsx` |
| Account | Grouped list with chevrons | `MobileAccountCenter.tsx` |
| Decision | Swipe cards + action bar | `SwipeCard` + `DecisionActionBar.tsx` |
| Details | Bottom sheet (swipe-to-close) | `BottomSheet.tsx` |
| Stats | 2×2 compact grid | `CardEngine.tsx` (UCSummaryCard) |
| Layout | DecisionScreenLayout | `DecisionScreenLayout.tsx` |

### 1.4 Navigation Rules

- **3-Tap Rule**: Every feature reachable within 3 taps from any screen
- **Bottom Nav**: 5 primary tabs (Dashboard, Discover, Applications, Messages, Account)
- **Account Center**: All settings/profile features accessible via Account tab
- **No Hamburger**: Mobile uses bottom nav exclusively (no sidebar/hamburger)
- **One-Tap Messages**: Direct navigation to inbox (no intermediate screen)

---

## 2. Universal Card Engine

### 2.1 Architecture

The Card Engine provides 10 config-driven card templates rendered through a single `renderCard()` function. Cards are defined as discriminated union types for type safety.

**Types**: `src/lib/card-engine-types.ts`  
**Renderer**: `src/components/shared/CardEngine.tsx`  
**Documentation**: `docs/enterprise/CardEngine.md`

### 2.2 Available Templates

| Template | Use Case | Key Props |
|----------|----------|-----------|
| `summary` | KPI/stat cards | value, trend, icon, color |
| `decision` | Swipe candidates/jobs | score, badges, skills, actions |
| `profile` | User/company profiles | avatar, name, role, stats |
| `list_item` | Feed items | title, subtitle, meta, actions |
| `notification` | Alerts/updates | type, message, timestamp |
| `media` | Images/video cards | src, overlay, caption |
| `action` | CTA cards | title, description, button |
| `comparison` | Plan/feature comparison | items, highlights |
| `timeline` | Activity/history | events, dates, status |
| `empty_state` | No-data placeholders | icon, title, action |

### 2.3 Usage Pattern

```tsx
import { renderCard, UCCardGrid } from '@/components/shared/CardEngine';
import type { UCSummaryCardConfig } from '@/lib/card-engine-types';

const config: UCSummaryCardConfig = {
  type: 'summary',
  title: 'Profile Views',
  value: '1,234',
  trend: { direction: 'up', value: '+12%' },
  icon: Eye,
  color: 'primary',
};

// Single card
{renderCard(config)}

// Grid of cards
<UCCardGrid cards={[config1, config2, config3, config4]} columns={2} />
```

---

## 3. Feature Registry Engine

### 3.1 Purpose

The Feature Registry is the **single source of truth** for all platform features. It enables:

- **Feature Discovery**: Programmatic listing of all features
- **Platform Parity**: Automated gap detection between mobile/desktop
- **Access Control**: Role + subscription tier gating
- **Validation**: Dependency checking, quality scoring
- **Documentation**: Self-documenting feature catalog

### 3.2 Architecture

**Location**: `src/lib/feature-registry.ts`  
**Singleton**: `featureRegistry` (auto-populated with default features)  
**React Hook**: `useFeatureRegistry()`

### 3.3 Feature Definition Schema

```typescript
interface FeatureDefinition {
  id: string;              // Unique kebab-case identifier
  name: string;            // Human-readable name
  description: string;     // Brief description
  category: FeatureCategory;
  roles: UserRole[];       // Which roles can access
  minTier: SubscriptionTier;
  platforms: PlatformSupport[];
  dependencies?: string[];
  i18nKey?: string;
  route?: string;
  parityPriority?: 1-5;   // 1=critical, 5=nice-to-have
  tags?: string[];
}
```

### 3.4 Platform Support Matrix

Each feature declares its support per platform:

```typescript
interface PlatformSupport {
  platform: 'web_mobile' | 'web_desktop' | 'native_android' | 'native_ios';
  status: 'active' | 'beta' | 'planned' | 'deprecated' | 'disabled';
  quality: number;         // 0-100 quality score
  limitations?: string[];
  implementedIn?: string;  // File path
}
```

### 3.5 Validation Engine

The registry includes a built-in validation engine:

```typescript
const result = featureRegistry.validate();
// Returns: { valid: boolean, errors: [], warnings: [] }
```

**Checks performed**:
- Circular dependency detection
- Orphan dependency detection
- Platform coverage gaps
- Quality threshold warnings
- Missing i18n keys
- Missing routes

### 3.6 Parity Reports

Generate automated parity reports comparing platforms:

```typescript
const report = featureRegistry.generateParityReport('web_desktop');
// Returns: { platformScores, gaps, recommendations }
```

**Report includes**:
- Per-platform parity scores (0-100)
- Specific feature gaps with recommendations
- Quality deltas between platforms
- Priority-sorted action items

### 3.7 Access Control

```typescript
// Check if a user can access a feature
featureRegistry.canAccess('discovery-swipe', 'job_seeker', 'free'); // true
featureRegistry.canAccess('profile-video-intro', 'job_seeker', 'free'); // false (premium)

// Check platform availability
featureRegistry.isAvailableOn('nav-bottom-bar', 'web_mobile'); // true
featureRegistry.isAvailableOn('nav-bottom-bar', 'web_desktop'); // false
```

### 3.8 React Integration

```tsx
import { useFeatureRegistry } from '@/lib/feature-registry';

function FeatureGate({ featureId, children }) {
  const { canAccess } = useFeatureRegistry();
  const userRole = useCurrentRole();
  const userTier = useCurrentTier();
  
  if (!canAccess(featureId, userRole, userTier)) {
    return <UpgradePrompt />;
  }
  return children;
}
```

---

## 4. Decision Action Bar

### 4.1 Component

**Location**: `src/components/shared/DecisionActionBar.tsx`

### 4.2 Variants

| Variant | Behavior |
|---------|----------|
| `default` | Inline, centered, standard spacing |
| `compact` | Smaller buttons, tighter spacing |
| `floating` | Fixed position above bottom nav |

### 4.3 Actions

| Action | Icon | Size | Color |
|--------|------|------|-------|
| Pass | ✕ | Large (64px) | Destructive red |
| Save | ★ | Medium (56px) | Amber |
| Like | ♥ | Large (64px) | Green |

### 4.4 Features

- Spring-physics press animations (Framer Motion)
- ARIA labels for accessibility
- Keyboard navigation support
- Disabled state handling
- Safe-area aware positioning

---

## 5. Mobile Account Center

### 5.1 Component

**Location**: `src/components/shared/MobileAccountCenter.tsx`

### 5.2 Sections (Job Seeker)

| Group | Items |
|-------|-------|
| Profile Management | Profile, Resume, Experience, Education, Certificates, Skills, Languages, Portfolio, Video Intro |
| Job Activity | Saved Jobs, Matches, Preferences |
| Discoverability | Visibility, Exposure Dashboard, Contact Requests, Who Viewed, Invitations |
| Account Settings | Notifications, Settings, Subscription, Privacy |
| Preferences | Language Toggle, Dark Mode, Help & Support |

### 5.3 Design Patterns

- Native iOS/Android grouped list style
- Icon + Label + Badge + Chevron layout
- Profile header with avatar, name, email, completion %
- Subscription badge
- Destructive logout at bottom (always visible)
- 48px minimum touch targets

---

## 6. Score Visualization Engine

### 6.1 Purpose

The Score Visualization Engine is the **single platform-wide system** for rendering any score, progress, percentage, or funnel metric. It eliminates ad-hoc inline progress bars, ensures consistent responsive behavior (320–412px+ and desktop), full RTL support, and WCAG AA accessibility compliance.

**Location**: `src/components/shared/ScoreVisualizationEngine.tsx`

### 6.2 Available Components

| Component | Use Case | Key Props |
|-----------|----------|-----------|
| `ScoreBar` | Single horizontal progress/score bar | value, max, color, size, showLabel, animated |
| `ScoreLabel` | Standalone formatted score text | value, max, format ('percent' / 'fraction' / 'value'), size |
| `ScoreBreakdown` | List of labeled score bars (factor breakdown) | items[{label, value, max, color}], title, collapsible |
| `ScoreRing` | Circular/ring progress indicator | value, max, size, strokeWidth, color |
| `ConfidenceIndicator` | AI confidence band display | level ('high' / 'medium' / 'low'), label |

### 6.3 Design Principles

| Principle | Implementation |
|-----------|---------------|
| **No Clipping** | Labels use `min-w-[3ch]` + `tabular-nums`; bars use `overflow-hidden` with rounded corners |
| **RTL-Ready** | Uses `start`/`end` logical properties; percentage fills respect `dir` attribute |
| **Responsive** | Bars scale fluidly; labels stack vertically on narrow viewports |
| **Accessible** | `role="progressbar"`, `aria-valuenow/min/max`, `aria-label` on every bar |
| **Reduced Motion** | Animations respect `prefers-reduced-motion: reduce` |
| **Dark Mode** | All color variants support `dark:` Tailwind classes |
| **i18n** | All text uses `t()` keys from `packages/shared/src/i18n` |

### 6.4 Usage Pattern

```tsx
import { ScoreBar, ScoreLabel, ScoreBreakdown } from '@/components/shared/ScoreVisualizationEngine';

// Single bar
<ScoreBar value={78} max={100} color="primary" size="md" showLabel />

// Formatted label
<ScoreLabel value={78} max={100} format="percent" />

// Factor breakdown (AI Match, Pipeline, etc.)
<ScoreBreakdown
  title="AI Match Factors"
  items={[
    { label: 'Skills', value: 92, max: 100, color: 'green' },
    { label: 'Experience', value: 78, max: 100, color: 'blue' },
    { label: 'Culture Fit', value: 65, max: 100, color: 'amber' },
  ]}
  collapsible
/>
```

### 6.5 Migration Status

All platform score/progress UI has been migrated to the engine:

| Component | Before | After |
|-----------|--------|-------|
| `JobSeeker.tsx` (AI Match Breakdown) | Inline `div` bars with clipping issues | `ScoreBreakdown` |
| `CollectionEnterprise.tsx` (Pipeline) | Custom `div` progress bars | `ScoreBreakdown` |
| `ProfileCompletion.tsx` (Sections) | Inline `div` bars | `ScoreBreakdown` |
| `Analytics.tsx` (Funnel + Activity) | Custom bars + inline styles | `ScoreBar` + `ScoreLabel` |
| `BillingAnalytics.tsx` (Revenue/Funnel) | Custom `div` progress bars | `ScoreBar` + `ScoreLabel` |
| `AITalentIntelligence.tsx` (Hiring Funnel) | Custom `div` bars | `ScoreBar` + `ScoreLabel` |

### 6.6 Mandatory Rule

> **All score, progress, percentage, and funnel visualizations MUST use the Score Visualization Engine.**
> Custom inline `<div>` progress bars are prohibited. New features requiring score display must import from `ScoreVisualizationEngine.tsx`.

---

## 7. Platform Standards

### 7.1 Mandatory Patterns

| Pattern | Rule |
|---------|------|
| **Card Engine** | All stat/summary/decision cards MUST use Card Engine templates |
| **Score Visualization Engine** | All score/progress/funnel bars MUST use ScoreVisualizationEngine components |
| **Feature Registry** | All new features MUST be registered before implementation |
| **i18n** | All user-visible text MUST use `t()` with keys in EN + AR |
| **RTL** | All layouts MUST support RTL (use `start`/`end` not `left`/`right`) |
| **Dark Mode** | All components MUST support dark mode via Tailwind `dark:` |
| **Accessibility** | WCAG AA minimum, ARIA labels on interactive elements |
| **Mobile-First** | Design mobile layout first, enhance for desktop |

### 7.2 Component Hierarchy

```
Platform Engines (reusable infrastructure)
├── Card Engine (config-driven cards)
├── Collection Engine (entity management)
├── Score Visualization Engine (scores/progress/funnels)
├── Matching Engine (swipe + AI)
├── Billing Engine (subscriptions)
├── Feature Registry (feature catalog)
└── i18n Engine (translations)

Experience Components (UI building blocks)
├── DecisionScreenLayout (viewport management)
├── DecisionActionBar (swipe actions)
├── MobileBottomNav (navigation)
├── MobileAccountCenter (account management)
├── BottomSheet (detail overlays)
└── StatCard → Card Engine (delegated)
```

### 7.3 Quality Gates

Before any feature ships:

1. ✅ Registered in Feature Registry with platform support matrix
2. ✅ i18n keys added (EN + AR)
3. ✅ Mobile layout tested at 390×844 viewport
4. ✅ Dark mode verified
5. ✅ RTL layout verified
6. ✅ Touch targets ≥ 44px
7. ✅ Lint + build pass
8. ✅ Card Engine used for any card-like UI
9. ✅ Score Visualization Engine used for any score/progress/funnel UI

---

## 8. Current Platform Parity Status

### 8.1 Parity Scores (as of 2026-08-06)

| Platform | Score | Active | Beta | Planned |
|----------|-------|--------|------|---------|
| Web Desktop | 95% | 28 | 0 | 0 |
| Web Mobile | 85% | 26 | 0 | 1 |
| Native Android | — | — | — | — |
| Native iOS | — | — | — | — |

### 8.2 Known Mobile Gaps

| Feature | Gap | Priority |
|---------|-----|----------|
| Search & Filter | Limited filter UI on small screens | P2 |
| Subscription Plans | Plan comparison table cramped | P2 |
| Billing & Invoices | Invoice table not responsive | P3 |
| Collections | Grid layout cramped, bulk actions harder | P3 |
| Admin Analytics | Charts too small, heatmap unreadable | P5 |
| Video Introduction | Camera API integration pending | P4 |

### 8.3 Recommendations

1. Improve mobile search/filter with bottom-sheet filter panels
2. Redesign subscription comparison as swipeable cards on mobile
3. Make billing invoices a vertical card list on mobile
4. Add responsive breakpoints to collection grid
5. Consider separate mobile-optimized admin views (low priority)

---

## Appendix: File Map

| File | Purpose |
|------|---------|
| `src/lib/card-engine-types.ts` | Card Engine type definitions |
| `src/components/shared/CardEngine.tsx` | Card Engine renderer |
| `src/lib/feature-registry.ts` | Feature Registry + validation |
| `src/components/shared/DecisionActionBar.tsx` | Decision actions |
| `src/components/shared/MobileAccountCenter.tsx` | Account center |
| `src/components/shared/MobileBottomNav.tsx` | Bottom navigation |
| `src/components/shared/DecisionScreenLayout.tsx` | Layout engine |
| `src/components/shared/BottomSheet.tsx` | Detail overlays |
| `src/components/shared/ScoreVisualizationEngine.tsx` | Score/progress/funnel engine |
| `src/components/shared/StatCard.tsx` | Legacy → Card Engine |
| `docs/enterprise/CardEngine.md` | Card Engine docs |
| `docs/enterprise/ExperienceEngine.md` | This document |
| `docs/enterprise/Engineering Charter.md` | Engineering principles |