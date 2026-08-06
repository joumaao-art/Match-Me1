/**
 * MatchMe Universal Card Engine — Type Definitions
 * 
 * Configuration API for the Card Engine platform capability.
 * All card types are configured through these interfaces rather than
 * hardcoded implementations.
 * 
 * @module CardEngineTypes
 * @version 1.0.0
 * @platform MatchMe Experience Engine
 */

import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

// ============================================================
// Core Configuration
// ============================================================

/** Card visual variant */
export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled' | 'ghost';

/** Card content density */
export type CardDensity = 'compact' | 'normal' | 'comfortable';

/** Card elevation level */
export type CardElevation = 'none' | 'sm' | 'md' | 'lg';

/** Card border radius */
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Card state */
export type CardState = 'idle' | 'loading' | 'error' | 'empty' | 'disabled' | 'selected' | 'active';

/** Card animation preset */
export type CardAnimation = 'none' | 'fadeIn' | 'slideUp' | 'scale' | 'spring';

/** Responsive breakpoint */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ============================================================
// Shared Building Block Types
// ============================================================

/** Status badge configuration */
export interface StatusBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  icon?: LucideIcon;
  pulse?: boolean;
}

/** Match score badge */
export interface MatchBadgeConfig {
  score: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/** Tag/chip item */
export interface TagItem {
  id: string;
  label: string;
  variant?: 'default' | 'outline' | 'secondary';
  icon?: LucideIcon;
  removable?: boolean;
  highlighted?: boolean;
}

/** Avatar configuration */
export interface AvatarConfig {
  src?: string;
  fallback: string;
  icon?: LucideIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'rounded' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

/** Action button */
export interface CardAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
}

/** Metadata field */
export interface MetadataField {
  id: string;
  label?: string;
  value: string | number;
  icon?: LucideIcon;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  copyable?: boolean;
}

/** Trend indicator */
export interface TrendIndicator {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
  period?: string;
}

/** Media preview */
export interface MediaPreviewConfig {
  type: 'image' | 'video' | 'document' | 'avatar';
  src?: string;
  alt?: string;
  fallbackIcon?: LucideIcon;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:4';
  lazy?: boolean;
}

// ============================================================
// Base Card Configuration
// ============================================================

/** Base configuration shared by all card types */
export interface BaseCardConfig {
  /** Unique identifier */
  id?: string;
  /** Visual variant */
  variant?: CardVariant;
  /** Content density */
  density?: CardDensity;
  /** Shadow elevation */
  elevation?: CardElevation;
  /** Border radius */
  radius?: CardRadius;
  /** Current state */
  state?: CardState;
  /** Entry animation */
  animation?: CardAnimation;
  /** Whether card is interactive (clickable) */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  ariaLabel?: string;
  /** Test ID */
  testId?: string;
}

// ============================================================
// Decision Card
// ============================================================

export interface DecisionCardConfig extends BaseCardConfig {
  type: 'decision';
  /** Primary title */
  title: string;
  /** Subtitle or secondary info */
  subtitle?: string;
  /** Avatar/logo */
  avatar?: AvatarConfig;
  /** Match score */
  matchScore?: MatchBadgeConfig;
  /** Status badges */
  badges?: StatusBadgeConfig[];
  /** Tags/skills */
  tags?: TagItem[];
  /** Metadata row */
  metadata?: MetadataField[];
  /** Primary actions (like/pass/save/share) */
  actions?: CardAction[];
  /** Expandable for details */
  expandable?: boolean;
  /** Swipeable */
  swipeable?: boolean;
  /** On swipe callback */
  onSwipe?: (direction: 'left' | 'right') => void;
}

// ============================================================
// Summary Card
// ============================================================

export interface SummaryCardConfig extends BaseCardConfig {
  type: 'summary';
  /** Card title */
  title?: string;
  /** Primary value (stat/metric) */
  value: string | number;
  /** Value label */
  label: string;
  /** Icon */
  icon?: LucideIcon;
  /** Value color class */
  colorClass?: string;
  /** Trend indicator */
  trend?: TrendIndicator;
  /** Description text */
  description?: string;
  /** Footer actions */
  actions?: CardAction[];
}

// ============================================================
// Detail Card
// ============================================================

export interface DetailCardConfig extends BaseCardConfig {
  type: 'detail';
  /** Header */
  title: string;
  subtitle?: string;
  /** Avatar/media */
  avatar?: AvatarConfig;
  media?: MediaPreviewConfig;
  /** Rich content sections */
  sections?: DetailSection[];
  /** Metadata */
  metadata?: MetadataField[];
  /** Tags */
  tags?: TagItem[];
  /** Actions */
  actions?: CardAction[];
  /** Match score */
  matchScore?: MatchBadgeConfig;
}

export interface DetailSection {
  id: string;
  title?: string;
  content: ReactNode | string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// ============================================================
// Expandable Card
// ============================================================

export interface ExpandableCardConfig extends BaseCardConfig {
  type: 'expandable';
  /** Collapsed header content */
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Preview content (shown when collapsed) */
  preview?: ReactNode | string;
  /** Expanded content (lazy loaded) */
  expandedContent: ReactNode;
  /** Default state */
  defaultExpanded?: boolean;
  /** Controlled expand state */
  expanded?: boolean;
  /** On toggle */
  onToggle?: (expanded: boolean) => void;
  /** Animate height */
  animateHeight?: boolean;
}

// ============================================================
// Selectable Card
// ============================================================

export interface SelectableCardConfig extends BaseCardConfig {
  type: 'selectable';
  /** Content */
  title: string;
  subtitle?: string;
  avatar?: AvatarConfig;
  metadata?: MetadataField[];
  tags?: TagItem[];
  /** Selection */
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  /** Selection mode */
  selectionMode?: 'single' | 'multi';
  /** Checkbox position */
  checkboxPosition?: 'start' | 'end';
  /** Actions (shown on selection) */
  actions?: CardAction[];
}

// ============================================================
// Swipe Card
// ============================================================

export interface SwipeCardConfig extends BaseCardConfig {
  type: 'swipe';
  /** Content */
  title: string;
  subtitle?: string;
  avatar?: AvatarConfig;
  matchScore?: MatchBadgeConfig;
  tags?: TagItem[];
  metadata?: MetadataField[];
  /** Swipe callbacks */
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Swipe labels */
  leftLabel?: string;
  rightLabel?: string;
  /** Undo support */
  undoable?: boolean;
  onUndo?: () => void;
  /** Detail view trigger */
  onViewDetails?: () => void;
}

// ============================================================
// Analytics Card
// ============================================================

export interface AnalyticsCardConfig extends BaseCardConfig {
  type: 'analytics';
  /** Title */
  title: string;
  /** Primary metric */
  value: string | number;
  /** Value label */
  label?: string;
  /** Trend */
  trend?: TrendIndicator;
  /** Chart placeholder (render prop) */
  chart?: ReactNode;
  /** Comparison data */
  comparison?: { label: string; value: string | number; trend?: TrendIndicator }[];
  /** Period selector */
  period?: string;
  /** Icon */
  icon?: LucideIcon;
  /** Color */
  colorClass?: string;
}

// ============================================================
// Collection Card
// ============================================================

export interface CollectionCardConfig extends BaseCardConfig {
  type: 'collection';
  /** Collection name */
  title: string;
  /** Item count */
  count: number;
  /** Description */
  description?: string;
  /** Color accent */
  color?: string;
  /** Preview items (thumbnails/avatars) */
  previews?: AvatarConfig[];
  /** Collection type badge */
  collectionType?: 'manual' | 'smart' | 'ai' | 'shared';
  /** Pinned */
  pinned?: boolean;
  /** Actions */
  actions?: CardAction[];
  /** Last updated */
  updatedAt?: string;
}

// ============================================================
// Notification Card
// ============================================================

export interface NotificationCardConfig extends BaseCardConfig {
  type: 'notification';
  /** Title/message */
  title: string;
  /** Description */
  description?: string;
  /** Icon */
  icon?: LucideIcon;
  /** Priority */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  /** Read state */
  read?: boolean;
  /** Timestamp */
  timestamp?: string;
  /** Action URL */
  actionUrl?: string;
  /** Actions */
  actions?: CardAction[];
  /** Dismissible */
  dismissible?: boolean;
  onDismiss?: () => void;
}

// ============================================================
// Timeline Card
// ============================================================

export interface TimelineCardConfig extends BaseCardConfig {
  type: 'timeline';
  /** Event title */
  title: string;
  /** Description */
  description?: string;
  /** Timestamp */
  timestamp: string;
  /** Icon */
  icon?: LucideIcon;
  /** Event type (for color coding) */
  eventType?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  /** Actor */
  actor?: AvatarConfig & { name: string };
  /** Is last item (no connector line) */
  isLast?: boolean;
  /** Metadata */
  metadata?: MetadataField[];
}

// ============================================================
// Union Type
// ============================================================

export type CardConfig =
  | DecisionCardConfig
  | SummaryCardConfig
  | DetailCardConfig
  | ExpandableCardConfig
  | SelectableCardConfig
  | SwipeCardConfig
  | AnalyticsCardConfig
  | CollectionCardConfig
  | NotificationCardConfig
  | TimelineCardConfig;

// ============================================================
// Card Engine API
// ============================================================

/** Card Engine render options */
export interface CardEngineOptions {
  /** Grid layout mode */
  layout?: 'list' | 'grid' | 'masonry';
  /** Grid columns */
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  /** Gap between cards */
  gap?: 'sm' | 'md' | 'lg';
  /** Enable virtualization for large lists */
  virtualize?: boolean;
  /** Animation stagger delay (ms) */
  staggerDelay?: number;
  /** Empty state configuration */
  emptyState?: { icon?: LucideIcon; title: string; description?: string; action?: CardAction };
  /** Loading skeleton count */
  skeletonCount?: number;
}

/** Responsive card configuration override */
export interface ResponsiveOverride {
  breakpoint: Breakpoint;
  density?: CardDensity;
  variant?: CardVariant;
  hideFields?: string[];
  showFields?: string[];
}