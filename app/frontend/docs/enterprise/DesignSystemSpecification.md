# MATCHME ENTERPRISE PLATFORM
# Design System Specification — Prompt 2
# Version 1.0

## Objective

This document establishes the official MatchMe Design System.

It defines every visual, interaction, branding, spacing, typography, motion, accessibility, responsive, and UI standard used throughout the platform.

This document does NOT implement features.

It defines HOW every screen should look, feel, and behave.

Every future implementation must comply with this specification.

This document extends:

- Prompt 0 — Platform Architecture Charter
- Prompt 1 — Enterprise Engineering Standards

---

## Design Philosophy

MatchMe should feel:

- Premium
- Modern
- Clean
- Trustworthy
- Fast
- Human
- Professional
- AI Powered

Every interaction should reduce cognitive load.

Every screen should help users make decisions faster.

Less clutter. More clarity.

---

## Platform Identity

The MatchMe interface should communicate:

- Professionalism
- Trust
- Confidence
- Speed
- AI Intelligence
- Accessibility
- Global Readiness

The visual language should be timeless rather than trendy.

---

## Design Principles

Every interface must follow:

- Mobile First
- Desktop Enhanced
- Consistency
- Progressive Disclosure
- One Primary Action
- Visual Hierarchy
- Minimal Cognitive Load
- High Readability
- Accessibility by Default
- Responsive by Default

---

## Brand System

The Design System controls:

- Logo
- Colors
- Typography
- Spacing
- Icons
- Illustrations
- Photography
- Motion
- Elevation
- Component Styles
- States
- Tokens

No screen may override these standards.

---

## Color System

Semantic colors:

| Token | Purpose |
|-------|---------|
| Primary | `#2563EB` — Main brand actions, links |
| Secondary | `#3B82F6` — Supporting elements |
| Success | `#22C55E` — Positive actions, confirmations |
| Warning | `#F59E0B` — Caution states |
| Danger | `#EF4444` — Destructive actions, errors |
| Information | `#06B6D4` — Informational states |
| Neutral | `#64748B` — Muted text, borders |
| Surface | `#FFFFFF` / `#1E293B` (dark) — Card backgrounds |
| Background | `#F8FAFC` / `#0F172A` (dark) — Page backgrounds |
| Border | `#E2E8F0` / `#334155` (dark) — Dividers |
| Text | `#1E293B` / `#F1F5F9` (dark) — Primary text |
| CTA | `#F97316` — Call-to-action highlights |
| Disabled | `#94A3B8` — Inactive elements |
| Hover | Darken 10% — Interactive hover |
| Focus | Ring `#2563EB` with 2px offset — Focus indicator |
| Selected | `#EFF6FF` / `#1E3A5F` (dark) — Selected items |
| Pressed | Darken 15% — Active press |

Use design tokens. Avoid hardcoded colors.

---

## Typography

| Scale | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 36px / 2.25rem | 700 | Hero sections |
| Heading 1 | 30px / 1.875rem | 700 | Page titles |
| Heading 2 | 24px / 1.5rem | 600 | Section headers |
| Heading 3 | 20px / 1.25rem | 600 | Subsections |
| Heading 4 | 18px / 1.125rem | 600 | Card titles |
| Body Large | 18px / 1.125rem | 400 | Emphasized body |
| Body | 16px / 1rem | 400 | Default text |
| Body Small | 14px / 0.875rem | 400 | Secondary text |
| Caption | 12px / 0.75rem | 400 | Metadata, timestamps |
| Label | 14px / 0.875rem | 500 | Form labels |
| Button | 14px / 0.875rem | 600 | Button text |
| Metadata | 11px / 0.6875rem | 500 | Badges, tags |

Font families:
- Headings: **Poppins** (600, 700)
- Body: **Open Sans** (400, 500, 600)

Typography must support: English, Arabic, RTL, Dynamic font scaling, Accessibility.

---

## Spacing System

8-point spacing system:

| Token | Value |
|-------|-------|
| `space-0.5` | 4px |
| `space-1` | 8px |
| `space-1.5` | 12px |
| `space-2` | 16px |
| `space-3` | 24px |
| `space-4` | 32px |
| `space-5` | 40px |
| `space-6` | 48px |
| `space-8` | 64px |

No arbitrary spacing values.

---

## Grid System

| Viewport | Columns | Gutter | Margin |
|----------|---------|--------|--------|
| Desktop (1024+) | 12 | 24px | 32px |
| Tablet (768–1023) | 8 | 16px | 24px |
| Mobile (320–767) | 4 | 16px | 16px |

Support fluid layouts. Never use fixed-width layouts.

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| Small | 4px | Inputs, chips |
| Medium | 8px | Cards, buttons |
| Large | 12px | Dialogs, sheets |
| Extra Large | 16px | Feature cards |
| Pill | 9999px | Tags, badges |
| Circular | 50% | Avatars |

No inconsistent radii.

---

## Shadows & Elevation

| Level | Shadow | Use |
|-------|--------|-----|
| 0 | none | Flat elements |
| 1 | `0 1px 3px rgba(0,0,0,0.1)` | Cards, inputs |
| 2 | `0 4px 6px rgba(0,0,0,0.1)` | Dropdowns, popovers |
| 3 | `0 10px 15px rgba(0,0,0,0.1)` | Dialogs, modals |
| 4 | `0 20px 25px rgba(0,0,0,0.15)` | Bottom sheets |

Use shadows consistently. Avoid excessive elevation.

---

## Iconography

| Property | Standard |
|----------|----------|
| Size (sm) | 16px |
| Size (md) | 20px |
| Size (lg) | 24px |
| Size (xl) | 32px |
| Stroke | 1.5px (outlined) |
| Library | Lucide React |
| Interactive | Include hover/focus states |
| Decorative | `aria-hidden="true"` |

Icons should remain consistent across the platform.

---

## Motion System

Animations should communicate: State, Direction, Feedback, Continuity.

| Property | Value |
|----------|-------|
| Duration (fast) | 150ms |
| Duration (normal) | 250ms |
| Duration (slow) | 350ms |
| Duration (emphasis) | 500ms |
| Easing (default) | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Easing (enter) | `cubic-bezier(0, 0, 0.2, 1)` |
| Easing (exit) | `cubic-bezier(0.4, 0, 1, 1)` |
| Easing (spring) | `spring(1, 80, 10, 0)` |

Support: Reduced Motion, Responsive Motion, RTL.

---

## Animation Standards

| Animation | Duration | Easing |
|-----------|----------|--------|
| Page transitions | 250ms | enter |
| Card transitions | 200ms | default |
| Dialogs | 300ms | spring |
| Bottom Sheets | 350ms | spring |
| Swipe animations | dynamic | spring |
| Loading | loop | default |
| Success | 500ms | spring |
| Error | 150ms (shake) | default |
| Navigation | 200ms | enter |

Future modules must reuse these animations.

---

## Layout System

All pages use the Layout Engine.

| Element | Standard |
|---------|----------|
| Header | max 48px mobile, 64px desktop |
| Footer | Optional, safe-area aware |
| Sidebar | 240px desktop, hidden mobile |
| Bottom Nav | 56px + safe-area-inset-bottom |
| Container | max-w-7xl centered |
| Margins | 16px mobile, 24px tablet, 32px desktop |
| Safe Areas | `env(safe-area-inset-*)` respected |

No page may create custom layouts.

---

## Card Standards

All cards must use the Card Engine.

Card types: Decision, Summary, Analytics, Timeline, Collection, Profile, Dashboard, Expandable, Selectable, Swipe.

Cards should maintain:
- Consistent spacing (p-4 mobile, p-6 desktop)
- Consistent shadows (elevation level 1)
- Consistent actions (bottom-aligned)
- Consistent typography (Heading 4 title, Body content)

---

## Button System

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | Primary | White | none |
| Secondary | Transparent | Primary | Primary |
| Tertiary | Transparent | Neutral | none |
| Danger | Danger | White | none |
| Success | Success | White | none |
| Icon | Transparent | Neutral | none |
| Floating | Primary | White | none + shadow |
| Full Width | Primary | White | none |

Every button must support: Hover, Focus, Pressed, Loading, Disabled, RTL.

Minimum touch target: 44px (preferably 48px).

---

## Form System

| Element | Standard |
|---------|----------|
| Text Fields | 44px height, border-radius medium, focus ring |
| Dropdowns | Native on mobile, custom on desktop |
| Checkboxes | 20px, rounded-sm, primary color |
| Radio Buttons | 20px, circular, primary color |
| Date Pickers | Native on mobile, calendar on desktop |
| Search | Icon prefix, clear button, debounced |
| Tags | Pill radius, removable, max visible |
| Validation | Inline below field, danger color |
| Errors | Icon + message, aria-describedby |
| Success | Icon + message, success color |

Forms must remain consistent.

---

## Navigation System

| Type | Use |
|------|-----|
| Sidebar | Desktop primary navigation |
| Bottom Navigation | Mobile primary (5 tabs max) |
| Tabs | In-page section switching |
| Breadcrumbs | Deep navigation context |
| Overflow Menu | Secondary actions |
| Drawer | Mobile secondary navigation |
| Quick Actions | Floating action buttons |

Follow: One Tap = One Destination.

---

## Mobile Standards

Every mobile interface must:

- Support one-handed use (bottom-aligned actions)
- Respect safe areas (`env(safe-area-inset-*)`)
- Avoid horizontal scrolling
- Avoid hidden controls
- Maintain feature parity with desktop
- Use 44px+ touch targets
- Use bottom sheets for details (not new pages)

---

## Decision Screen Standards

Decision Screens must use:

- Decision Header (compact, shrink-0)
- Decision Card (flex-1, no scroll)
- Expandable Sections (progressive disclosure)
- Sticky Action Bar (shrink-0, safe-area aware)
- Bottom Navigation (56px + safe area)
- Progressive Disclosure (Level 1 → Level 2 via bottom sheet)

---

## Score Visualization Standards

All scores must use the Score Visualization Engine:

- Match Score (ScoreBar, ScoreRing)
- Progress Bars (ScoreBar)
- Circular Scores (ScoreRing)
- Confidence Indicators (ConfidenceIndicator)
- Badges (inline with color coding)
- Trend Indicators (up/down/neutral with color)

No custom score components.

---

## Swipe Standards

Swipe interactions must use the Swipe Feedback Engine:

- Card Rotation (max 15°)
- Apply Overlay (green, right swipe)
- Pass Overlay (red, left swipe)
- Card Stack (3 visible, decreasing scale/opacity)
- Gesture Animations (spring physics)
- Threshold (120px to trigger)

---

## Empty States

Every module requires:

- Illustration (relevant to context)
- Title (clear, actionable)
- Description (helpful guidance)
- Primary Action (main CTA)
- Secondary Action (optional alternative)

---

## Loading States

Use:

- Skeletons (for content areas)
- Progress Indicators (for operations)
- Optimistic Updates (for instant feedback)

Never display blank screens.

---

## Error States

Display:

- Clear explanation (user-friendly language)
- Recovery action (retry button)
- Support link (if appropriate)

Never expose technical errors.

---

## Accessibility

Support:

- WCAG AA (4.5:1 text contrast, 3:1 UI contrast)
- RTL (logical properties: start/end)
- Screen Readers (ARIA labels, roles, live regions)
- Keyboard Navigation (focus visible, tab order)
- Reduced Motion (`prefers-reduced-motion`)
- High Contrast (`prefers-contrast: more`)
- Dynamic Font Scaling (rem-based, no px for text)

Accessibility is mandatory.

---

## Responsive Standards

Support widths: 320, 360, 375, 390, 412, 768, 1024, Desktop.

Every component must be responsive.

Height formula (mobile): `calc(100dvh - 56px - env(safe-area-inset-bottom))`

---

## Theme System

Support:

- Light (default)
- Dark (system preference or manual toggle)
- System (auto-detect)
- Future custom themes (token-based)

Use CSS custom properties / Tailwind dark: classes.

Never hardcode color values.

---

## Localization

Support:

- English (LTR)
- Arabic (RTL)
- Future languages

Layouts must adapt automatically via `dir` attribute.

Use logical CSS properties (`margin-inline-start` not `margin-left`).

---

## Illustration Style

Illustrations should communicate:

- Growth
- Careers
- Success
- Learning
- Professionalism

Avoid generic stock artwork. Prefer custom, brand-aligned illustrations.

---

## AI Experience

AI should appear:

- Helpful (suggestions, not commands)
- Transparent (show confidence, explain reasoning)
- Explainable (why this recommendation?)
- Non-intrusive (dismissible, optional)

Never overwhelming.

---

## Design Tokens

Create reusable tokens for:

- Colors (semantic + palette)
- Typography (scale + weights)
- Spacing (8-point system)
- Radius (standardized)
- Shadows (elevation levels)
- Motion (durations + easings)
- Borders (widths + styles)
- Opacity (levels)
- Transitions (presets)
- Breakpoints (responsive)

No hardcoded visual values.

---

## Component Library Integration

Every component must consume the Design System.

Never override: Typography, Spacing, Colors, Elevation, Radius, Icons, Motion.

---

## Platform Validation

Every implementation must verify:

- ✓ Visual consistency
- ✓ Responsive layouts
- ✓ Accessibility
- ✓ RTL
- ✓ Theme support (light + dark)
- ✓ Motion (respects reduced-motion)
- ✓ Design tokens (no hardcoded values)
- ✓ Component reuse

---

## Final Design Rules

Before creating any UI ask:

1. Does a reusable component already exist?
2. Does the Design System define this?
3. Does the Card Engine already solve this?
4. Is this Mobile First?
5. Is it accessible?
6. Is it responsive?
7. Is it RTL compatible?
8. Is it token-based?
9. Is it reusable?
10. Will it still feel consistent in five years?

If any answer is No, improve the implementation before writing code.

---

## Final Platform Rule

The MatchMe Design System becomes the single source of truth for every visual element across:

- Job Seeker Portal
- Company Portal
- Super Admin Portal
- Marketplace
- CRM
- ATS
- AI Copilot
- Analytics
- Mobile
- Tablet
- Desktop
- Future products

No future screen, component, or feature may introduce its own visual language outside this Design System.

Consistency is a product feature.

Every future implementation must extend the Design System rather than bypass it.