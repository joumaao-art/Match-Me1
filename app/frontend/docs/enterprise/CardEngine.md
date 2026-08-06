# Universal Card Engine — Experience Engine Documentation

## Overview

The Universal Card Engine (UCE) is a configuration-driven, reusable card template system that powers all card-based UI across the MatchMe Experience Engine. Instead of building one-off card components for each feature, engineers define a **configuration object** and the engine renders the appropriate card template.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Consumer Code                        │
│  (JobSeeker.tsx, Company.tsx, Admin.tsx, etc.)       │
└──────────────────────┬──────────────────────────────┘
                       │ config: CardConfig
                       ▼
┌─────────────────────────────────────────────────────┐
│              CardEngine.tsx                           │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ UCDecision  │ │ UCSummary   │ │ UCDetail     │  │
│  │ Card        │ │ Card        │ │ Card         │  │
│  └─────────────┘ └─────────────┘ └──────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ UCExpandable│ │ UCSelectable│ │ UCSwipe      │  │
│  │ Card        │ │ Card        │ │ Card         │  │
│  └─────────────┘ └─────────────┘ └──────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ UCAnalytics │ │ UCCollection│ │ UCNotification│ │
│  │ Card        │ │ Card        │ │ Card         │  │
│  └─────────────┘ └─────────────┘ └──────────────┘  │
│  ┌─────────────┐                                    │
│  │ UCTimeline  │  + UCCardGrid (layout utility)     │
│  │ Card        │  + renderCard (dynamic renderer)   │
│  └─────────────┘                                    │
└──────────────────────┬──────────────────────────────┘
                       │ extends
                       ▼
┌─────────────────────────────────────────────────────┐
│           card-engine-types.ts                        │
│  BaseCardConfig, DecisionCardConfig,                 │
│  SummaryCardConfig, DetailCardConfig, etc.           │
│  + Shared Building Blocks (Avatar, Badge, Tag, etc.)│
└─────────────────────────────────────────────────────┘
```

## File Structure

| File | Purpose |
|------|---------|
| `src/lib/card-engine-types.ts` | TypeScript configuration interfaces for all card types |
| `src/components/shared/CardEngine.tsx` | Card template implementations + renderer + grid |
| `src/components/shared/StatCard.tsx` | Legacy wrapper (delegates to UCSummaryCard internally) |

## Card Types

### 1. Decision Card (`UCDecisionCard`)
**Use case:** Swipe-based decisions, match cards, candidate/job comparison.

```tsx
import { UCDecisionCard } from '@/components/shared/CardEngine';

<UCDecisionCard config={{
  type: 'decision',
  title: 'Senior React Developer',
  subtitle: 'TechCorp Inc.',
  avatar: { fallback: 'TC', icon: Building2, size: 'md', shape: 'rounded' },
  matchScore: { score: 92, showPercentage: true, size: 'sm' },
  badges: [{ label: 'Remote', variant: 'info' }],
  tags: [{ id: '1', label: 'React', highlighted: true }],
  density: 'normal',
  interactive: true,
}} />
```

### 2. Summary Card (`UCSummaryCard`)
**Use case:** Dashboard stats, KPIs, metric displays.

```tsx
import { UCSummaryCard } from '@/components/shared/CardEngine';

<UCSummaryCard config={{
  type: 'summary',
  value: '12',
  label: 'Active Vacancies',
  icon: FileText,
  colorClass: 'text-primary',
  density: 'compact',
  variant: 'default',
  radius: 'lg',
  onClick: () => navigate('vacancies'),
}} />
```

### 3. Detail Card (`UCDetailCard`)
**Use case:** Job descriptions, profile views, rich content cards.

```tsx
import { UCDetailCard } from '@/components/shared/CardEngine';

<UCDetailCard config={{
  type: 'detail',
  title: 'Full Stack Engineer',
  subtitle: 'San Francisco, CA',
  avatar: { src: '/logo.png', fallback: 'FS' },
  sections: [
    { title: 'Description', content: 'Build amazing products...' },
    { title: 'Requirements', items: ['5+ years React', 'Node.js'] },
  ],
  tags: [{ id: '1', label: 'TypeScript' }],
  matchScore: { score: 88, showPercentage: true },
}} />
```

### 4. Expandable Card (`UCExpandableCard`)
**Use case:** FAQ items, collapsible content sections, progressive disclosure.

### 5. Selectable Card (`UCSelectableCard`)
**Use case:** Multi-select lists, bulk actions, filter selections.

### 6. Swipe Card (`UCSwipeCard`)
**Use case:** Tinder-style swipe interactions with gesture support.

### 7. Analytics Card (`UCAnalyticsCard`)
**Use case:** Charts, metrics with trends, data visualizations.

### 8. Collection Card (`UCCollectionCard`)
**Use case:** Grouped items, saved lists, talent pools.

### 9. Notification Card (`UCNotificationCard`)
**Use case:** Alerts, messages, system notifications.

### 10. Timeline Card (`UCTimelineCard`)
**Use case:** Activity feeds, history logs, event sequences.

## Shared Building Blocks

All cards share these configurable primitives:

| Block | Interface | Purpose |
|-------|-----------|---------|
| Avatar | `AvatarConfig` | User/company logos with fallback, icon, status |
| Badge | `StatusBadgeConfig` | Status indicators (7 variants) |
| Match Score | `MatchBadgeConfig` | Compatibility percentage display |
| Tag | `TagItem` | Skills, categories, filters |
| Action | `CardAction` | Buttons with icons and variants |
| Trend | `TrendIndicator` | Up/down/neutral metric changes |
| Media | `MediaPreviewConfig` | Image/video/document previews |
| Metadata | `MetadataField` | Key-value info rows |

## Base Configuration

Every card extends `BaseCardConfig`:

```typescript
interface BaseCardConfig {
  id?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost' | 'glass';
  density?: 'compact' | 'normal' | 'comfortable';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  state?: 'default' | 'selected' | 'disabled' | 'loading' | 'error';
  animation?: 'none' | 'fadeIn' | 'slideUp' | 'scale' | 'spring';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  testId?: string;
}
```

## Layout Utility: UCCardGrid

For rendering multiple cards in a responsive grid:

```tsx
import { UCCardGrid } from '@/components/shared/CardEngine';

<UCCardGrid
  cards={cardConfigs}
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap="md"
/>
```

## Dynamic Renderer: renderCard

For rendering cards from dynamic configuration (e.g., from API):

```tsx
import { renderCard } from '@/components/shared/CardEngine';

const config = { type: 'summary', value: '42', label: 'Total' };
return renderCard(config); // Returns appropriate card component
```

## Migration Guide

### From inline Card/CardContent to Card Engine

**Before:**
```tsx
<Card>
  <CardContent className="p-4 text-center">
    <p className="text-2xl font-bold text-primary">12</p>
    <p className="text-xs text-muted-foreground">Matched Jobs</p>
  </CardContent>
</Card>
```

**After:**
```tsx
<UCSummaryCard config={{
  type: 'summary',
  value: '12',
  label: 'Matched Jobs',
  colorClass: 'text-primary',
  density: 'compact',
}} />
```

### From InteractiveStatCard to Card Engine

**Before:**
```tsx
<InteractiveStatCard
  label="Active Vacancies"
  value={5}
  icon={FileText}
  color="text-primary"
  onClick={() => navigate('vacancies')}
/>
```

**After:**
```tsx
<UCSummaryCard config={{
  type: 'summary',
  value: '5',
  label: 'Active Vacancies',
  icon: FileText,
  colorClass: 'text-primary',
  onClick: () => navigate('vacancies'),
  density: 'normal',
  radius: 'lg',
}} />
```

## Design Principles

1. **Configuration over Code** — Define what, not how. The engine handles rendering.
2. **Consistent Density** — All cards respect the same density scale (compact/normal/comfortable).
3. **Composable Building Blocks** — Avatars, badges, tags, and actions are shared across all card types.
4. **Accessible by Default** — ARIA labels, keyboard navigation, focus management built-in.
5. **Dark Mode & RTL** — All cards support dark mode and RTL layout automatically.
6. **Performance** — All card components are wrapped in `React.memo` for render optimization.
7. **Type Safety** — Full TypeScript coverage with discriminated unions for card type switching.

## Accessibility

- All interactive cards have `role="button"` and `tabIndex={0}`
- Keyboard support: Enter/Space to activate
- ARIA labels configurable via `ariaLabel` prop
- Focus rings follow design system standards
- Screen reader announcements for state changes

## Performance

- All card components use `React.memo` to prevent unnecessary re-renders
- Shared utility functions (`getBaseClasses`, `densityPadding`) are extracted and reused
- No inline style objects — all styling via Tailwind CSS classes
- Lazy rendering support via `UCCardGrid` virtualization

## Current Migrations

| Component | Status | Card Type Used |
|-----------|--------|----------------|
| JobSeeker Dashboard Stats | ✅ Migrated | `UCSummaryCard` |
| JobSeeker Recent Matches | ✅ Migrated | `UCDecisionCard` |
| Company Dashboard Stats | ✅ Migrated | `UCSummaryCard` |
| StatCard (shared) | ✅ Migrated | `UCSummaryCard` (internal) |

## Future Migrations

| Component | Target Card Type |
|-----------|-----------------|
| Admin Dashboard Stats | `UCSummaryCard` |
| Candidate Pipeline Cards | `UCDecisionCard` |
| Vacancy List Cards | `UCDetailCard` |
| Notification Items | `UCNotificationCard` |
| Activity Feed | `UCTimelineCard` |
| Subscription Plan Cards | `UCSelectableCard` |