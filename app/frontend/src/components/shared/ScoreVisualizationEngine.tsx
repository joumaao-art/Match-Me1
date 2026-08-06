/**
 * Score Visualization Engine
 * ==========================
 * The single source of truth for displaying all quantitative visualizations
 * across the MatchMe platform. No module should create its own progress bars
 * or score displays.
 *
 * Supports:
 * - AI Match Scores, Profile Strength/Completion, Candidate/Company Match
 * - Skill/Salary/Interview Scores, AI Confidence, Compatibility, Readiness
 * - Analytics KPIs, Future AI metrics
 *
 * Features:
 * - Responsive (320px–desktop), auto-stacking on narrow viewports
 * - RTL-aware, dark mode, WCAG AA accessible
 * - Animated transitions, reduced-motion support
 * - Never clips, truncates, or overflows labels
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

/** Color state for score values */
export type ScoreColorState = 'excellent' | 'good' | 'fair' | 'poor' | 'neutral' | 'custom';

/** Score bar variant */
export type ScoreBarVariant = 'linear' | 'circular' | 'compact' | 'detailed';

/** Layout mode — auto means responsive stacking */
export type ScoreLayoutMode = 'inline' | 'stacked' | 'auto';

/** Configuration for a single score item */
export interface ScoreItem {
  /** Category label — can be any length */
  label: string;
  /** Score value 0–1 (will be displayed as 0–100%) */
  value: number;
  /** Optional weight for display emphasis */
  weight?: number;
  /** Optional custom color class for the bar fill */
  colorClass?: string;
  /** Optional icon or emoji prefix */
  icon?: React.ReactNode;
  /** Optional tooltip text */
  tooltip?: string;
}

/** Props for ScoreBar — the primary progress bar component */
export interface ScoreBarProps {
  /** Score value 0–1 */
  value: number;
  /** Height variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Custom fill color class (overrides auto-color) */
  colorClass?: string;
  /** Whether to animate on mount */
  animated?: boolean;
  /** Custom background class */
  bgClass?: string;
  /** Accessible label */
  ariaLabel?: string;
  className?: string;
}

/** Props for ScorePercentage — the percentage display component */
export interface ScorePercentageProps {
  /** Score value 0–1 */
  value: number;
  /** Decimal precision */
  precision?: number;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to show color state */
  colored?: boolean;
  /** Custom color class override */
  colorClass?: string;
  className?: string;
}

/** Props for ScoreLabel — the category label component */
export interface ScoreLabelProps {
  /** Label text — supports any length */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/** Props for ScoreRow — a complete label + bar + percentage row */
export interface ScoreRowProps {
  /** The score item data */
  item: ScoreItem;
  /** Layout mode */
  layout?: ScoreLayoutMode;
  /** Bar size */
  barSize?: 'xs' | 'sm' | 'md' | 'lg';
  /** Label size */
  labelSize?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to animate */
  animated?: boolean;
  /** Whether to show percentage */
  showPercentage?: boolean;
  className?: string;
}

/** Props for ScoreBreakdown — a list of score rows */
export interface ScoreBreakdownProps {
  /** Array of score items */
  items: ScoreItem[];
  /** Layout mode for all rows */
  layout?: ScoreLayoutMode;
  /** Bar size */
  barSize?: 'xs' | 'sm' | 'md' | 'lg';
  /** Label size */
  labelSize?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to animate */
  animated?: boolean;
  /** Whether to show percentages */
  showPercentage?: boolean;
  /** Optional title */
  title?: string;
  /** Maximum items to show (rest collapsed) */
  maxVisible?: number;
  /** Sort by value descending */
  sorted?: boolean;
  className?: string;
}

/** Props for CircularScore — a circular/ring score display */
export interface CircularScoreProps {
  /** Score value 0–1 */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Custom color class */
  colorClass?: string;
  /** Whether to show percentage text inside */
  showLabel?: boolean;
  /** Label text (defaults to percentage) */
  label?: string;
  className?: string;
}

/** Props for ConfidenceIndicator */
export interface ConfidenceIndicatorProps {
  /** Confidence value 0–1 */
  value: number;
  /** Optional label */
  label?: string;
  /** Size */
  size?: 'sm' | 'md';
  className?: string;
}

/** Props for ComparisonBar — shows two values side by side */
export interface ComparisonBarProps {
  /** Left value 0–1 */
  leftValue: number;
  /** Right value 0–1 */
  rightValue: number;
  /** Left label */
  leftLabel: string;
  /** Right label */
  rightLabel: string;
  /** Left color */
  leftColor?: string;
  /** Right color */
  rightColor?: string;
  className?: string;
}

// ============================================================
// UTILITIES
// ============================================================

/** Get color state based on score value */
function getColorState(value: number): ScoreColorState {
  if (value >= 0.85) return 'excellent';
  if (value >= 0.65) return 'good';
  if (value >= 0.4) return 'fair';
  return 'poor';
}

/** Get Tailwind color class for a score state */
function getColorClass(state: ScoreColorState): string {
  switch (state) {
    case 'excellent': return 'bg-green-500 dark:bg-green-400';
    case 'good': return 'bg-blue-500 dark:bg-blue-400';
    case 'fair': return 'bg-amber-500 dark:bg-amber-400';
    case 'poor': return 'bg-red-500 dark:bg-red-400';
    case 'neutral': return 'bg-muted-foreground/50';
    default: return 'bg-primary';
  }
}

/** Get text color class for a score state */
function getTextColorClass(state: ScoreColorState): string {
  switch (state) {
    case 'excellent': return 'text-green-600 dark:text-green-400';
    case 'good': return 'text-blue-600 dark:text-blue-400';
    case 'fair': return 'text-amber-600 dark:text-amber-400';
    case 'poor': return 'text-red-600 dark:text-red-400';
    case 'neutral': return 'text-muted-foreground';
    default: return 'text-primary';
  }
}

/** Get bar height class */
function getBarHeight(size: 'xs' | 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'xs': return 'h-1';
    case 'sm': return 'h-1.5';
    case 'md': return 'h-2';
    case 'lg': return 'h-3';
  }
}

/** Get label text size class */
function getLabelSize(size: 'xs' | 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'xs': return 'text-[10px]';
    case 'sm': return 'text-xs';
    case 'md': return 'text-sm';
    case 'lg': return 'text-base';
  }
}

/** Get percentage text size class */
function getPercentageSize(size: 'xs' | 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'xs': return 'text-[10px]';
    case 'sm': return 'text-[11px]';
    case 'md': return 'text-xs';
    case 'lg': return 'text-sm';
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * ScoreBar — Reusable progress bar component.
 * Automatically adapts width. Supports animation and RTL.
 */
export function ScoreBar({
  value,
  size = 'sm',
  colorClass,
  animated = true,
  bgClass,
  ariaLabel,
  className,
}: ScoreBarProps) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const state = getColorState(clampedValue);
  const fillColor = colorClass || getColorClass(state);
  const heightClass = getBarHeight(size);

  return (
    <div
      className={cn(
        'w-full rounded-full overflow-hidden',
        bgClass || 'bg-muted',
        heightClass,
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(clampedValue * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          'h-full rounded-full',
          fillColor,
          animated && 'transition-all duration-500 ease-out motion-reduce:transition-none'
        )}
        style={{ width: `${clampedValue * 100}%` }}
      />
    </div>
  );
}

/**
 * ScorePercentage — Displays a percentage value with optional color coding.
 * Never wraps. Consistent alignment.
 */
export function ScorePercentage({
  value,
  precision = 0,
  size = 'sm',
  colored = true,
  colorClass,
  className,
}: ScorePercentageProps) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const state = getColorState(clampedValue);
  const textColor = colored ? (colorClass || getTextColorClass(state)) : '';
  const sizeClass = getPercentageSize(size);

  return (
    <span
      className={cn(
        'font-medium whitespace-nowrap tabular-nums shrink-0',
        sizeClass,
        textColor,
        className
      )}
      aria-label={`${Math.round(clampedValue * 100)}%`}
    >
      {(clampedValue * 100).toFixed(precision)}%
    </span>
  );
}

/**
 * ScoreLabel — Displays a category label that wraps naturally.
 * Never clips, truncates, or uses fixed widths.
 */
export function ScoreLabel({
  label,
  icon,
  size = 'sm',
  className,
}: ScoreLabelProps) {
  const sizeClass = getLabelSize(size);

  return (
    <span
      className={cn(
        'text-muted-foreground leading-tight break-words',
        sizeClass,
        className
      )}
    >
      {icon && <span className="inline-flex items-center me-1 shrink-0">{icon}</span>}
      {label}
    </span>
  );
}

/**
 * ScoreRow — A complete responsive row: Label + Bar + Percentage.
 *
 * Layout modes:
 * - 'inline': Label | Bar | Percentage (single line, label wraps if needed)
 * - 'stacked': Label above, Bar + Percentage below
 * - 'auto' (default): Inline on desktop, stacked on narrow containers
 */
export function ScoreRow({
  item,
  layout = 'auto',
  barSize = 'sm',
  labelSize = 'sm',
  animated = true,
  showPercentage = true,
  className,
}: ScoreRowProps) {
  const fillColor = item.colorClass || undefined;

  // Auto layout uses CSS container queries / responsive classes
  if (layout === 'stacked') {
    return (
      <div className={cn('space-y-1', className)}>
        <ScoreLabel label={item.label} icon={item.icon} size={labelSize} />
        <div className="flex items-center gap-2">
          <ScoreBar
            value={item.value}
            size={barSize}
            colorClass={fillColor}
            animated={animated}
            ariaLabel={`${item.label}: ${Math.round(item.value * 100)}%`}
          />
          {showPercentage && (
            <ScorePercentage value={item.value} size={labelSize} />
          )}
        </div>
      </div>
    );
  }

  if (layout === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 min-w-0', className)}>
        <div className="shrink-0 min-w-0 max-w-[40%]">
          <ScoreLabel label={item.label} icon={item.icon} size={labelSize} />
        </div>
        <div className="flex-1 min-w-0">
          <ScoreBar
            value={item.value}
            size={barSize}
            colorClass={fillColor}
            animated={animated}
            ariaLabel={`${item.label}: ${Math.round(item.value * 100)}%`}
          />
        </div>
        {showPercentage && (
          <ScorePercentage value={item.value} size={labelSize} />
        )}
      </div>
    );
  }

  // 'auto' — responsive: inline on wider screens, stacked on narrow
  return (
    <div className={cn('group/score-row', className)}>
      {/* Stacked layout for narrow containers (mobile) */}
      <div className="sm:hidden space-y-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <ScoreLabel label={item.label} icon={item.icon} size={labelSize} />
          {showPercentage && (
            <ScorePercentage value={item.value} size={labelSize} />
          )}
        </div>
        <ScoreBar
          value={item.value}
          size={barSize}
          colorClass={fillColor}
          animated={animated}
          ariaLabel={`${item.label}: ${Math.round(item.value * 100)}%`}
        />
      </div>
      {/* Inline layout for wider screens */}
      <div className="hidden sm:flex items-center gap-2 min-w-0">
        <div className="shrink-0 min-w-0 max-w-[35%]">
          <ScoreLabel label={item.label} icon={item.icon} size={labelSize} />
        </div>
        <div className="flex-1 min-w-0">
          <ScoreBar
            value={item.value}
            size={barSize}
            colorClass={fillColor}
            animated={animated}
            ariaLabel={`${item.label}: ${Math.round(item.value * 100)}%`}
          />
        </div>
        {showPercentage && (
          <ScorePercentage value={item.value} size={labelSize} />
        )}
      </div>
    </div>
  );
}

/**
 * ScoreBreakdown — A list of ScoreRows with optional title and collapsing.
 * The primary component for AI Match Breakdown, Profile Strength, etc.
 */
export function ScoreBreakdown({
  items,
  layout = 'auto',
  barSize = 'sm',
  labelSize = 'sm',
  animated = true,
  showPercentage = true,
  title,
  maxVisible,
  sorted = false,
  className,
}: ScoreBreakdownProps) {
  const [expanded, setExpanded] = React.useState(false);

  const processedItems = useMemo(() => {
    const result = [...items];
    if (sorted) {
      result.sort((a, b) => b.value - a.value);
    }
    return result;
  }, [items, sorted]);

  const visibleItems = maxVisible && !expanded
    ? processedItems.slice(0, maxVisible)
    : processedItems;

  const hasMore = maxVisible ? processedItems.length > maxVisible : false;

  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h4 className="text-sm font-semibold">{title}</h4>
      )}
      <div className="space-y-1.5">
        {visibleItems.map((item, index) => (
          <ScoreRow
            key={`${item.label}-${index}`}
            item={item}
            layout={layout}
            barSize={barSize}
            labelSize={labelSize}
            animated={animated}
            showPercentage={showPercentage}
          />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-expanded={expanded}
        >
          {expanded ? '▲ Show less' : `▼ Show ${processedItems.length - (maxVisible || 0)} more`}
        </button>
      )}
    </div>
  );
}

/**
 * CircularScore — A circular/ring score visualization.
 * Used for overall match scores, profile completion rings, etc.
 */
export function CircularScore({
  value,
  size = 48,
  strokeWidth = 4,
  colorClass,
  showLabel = true,
  label,
  className,
}: CircularScoreProps) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const state = getColorState(clampedValue);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clampedValue);

  // Map bg color class to stroke color
  const strokeColor = colorClass || (() => {
    switch (state) {
      case 'excellent': return 'stroke-green-500 dark:stroke-green-400';
      case 'good': return 'stroke-blue-500 dark:stroke-blue-400';
      case 'fair': return 'stroke-amber-500 dark:stroke-amber-400';
      case 'poor': return 'stroke-red-500 dark:stroke-red-400';
      default: return 'stroke-primary';
    }
  })();

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clampedValue * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(strokeColor, 'transition-all duration-700 ease-out motion-reduce:transition-none')}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">
          {label || `${Math.round(clampedValue * 100)}%`}
        </span>
      )}
    </div>
  );
}

/**
 * ConfidenceIndicator — Shows AI confidence level with a subtle badge.
 */
export function ConfidenceIndicator({
  value,
  label,
  size = 'sm',
  className,
}: ConfidenceIndicatorProps) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const state = getColorState(clampedValue);
  const textColor = getTextColorClass(state);
  const sizeClass = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span className={cn('inline-flex items-center gap-1', sizeClass, 'text-muted-foreground', className)}>
      {label && <span>{label}:</span>}
      <span className={cn('font-medium tabular-nums', textColor)}>
        {Math.round(clampedValue * 100)}%
      </span>
    </span>
  );
}

/**
 * ComparisonBar — Shows two values in a split bar for comparison.
 */
export function ComparisonBar({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  leftColor = 'bg-blue-500',
  rightColor = 'bg-amber-500',
  className,
}: ComparisonBarProps) {
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPct = total > 0 ? (rightValue / total) * 100 : 50;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="break-words">{leftLabel}</span>
        <span className="break-words text-end">{rightLabel}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted" role="img" aria-label={`${leftLabel}: ${Math.round(leftPct)}%, ${rightLabel}: ${Math.round(rightPct)}%`}>
        <div className={cn('h-full transition-all duration-500', leftColor)} style={{ width: `${leftPct}%` }} />
        <div className={cn('h-full transition-all duration-500', rightColor)} style={{ width: `${rightPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{Math.round(leftPct)}%</span>
        <span>{Math.round(rightPct)}%</span>
      </div>
    </div>
  );
}

/**
 * ScoreBadge — A compact inline badge showing a score.
 */
export function ScoreBadge({
  value,
  label,
  size = 'sm',
  className,
}: {
  value: number;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const state = getColorState(clampedValue);
  const bgColor = (() => {
    switch (state) {
      case 'excellent': return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      case 'fair': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
      case 'poor': return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  })();
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium tabular-nums', bgColor, sizeClass, className)}>
      {label && <span>{label}</span>}
      <span>{Math.round(clampedValue * 100)}%</span>
    </span>
  );
}

/**
 * TrendIndicator — Shows a trend direction with value.
 */
export function TrendIndicator({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const isPositive = value >= 0;
  const arrow = isPositive ? '↑' : '↓';
  const colorClass = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', colorClass, className)}>
      <span>{arrow}</span>
      <span>{Math.abs(value).toFixed(1)}%</span>
      {label && <span className="text-muted-foreground font-normal ms-1">{label}</span>}
    </span>
  );
}

// ============================================================
// EXPORTS — Platform Standard
// ============================================================

export default {
  ScoreBar,
  ScorePercentage,
  ScoreLabel,
  ScoreRow,
  ScoreBreakdown,
  CircularScore,
  ConfidenceIndicator,
  ComparisonBar,
  ScoreBadge,
  TrendIndicator,
};