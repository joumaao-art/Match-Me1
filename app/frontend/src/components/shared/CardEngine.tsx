/**
 * MatchMe Universal Card Engine
 * 
 * Enterprise Platform Standard — Single source of truth for all card-based
 * interfaces across the MatchMe platform.
 * 
 * Card Types: Decision, Summary, Detail, Expandable, Selectable, Swipe,
 * Analytics, Collection, Notification, Timeline
 * 
 * Features:
 * - Configuration-driven (props over hardcode)
 * - Mobile-first responsive
 * - RTL/LTR compatible
 * - Dark mode aware
 * - WCAG AA accessible
 * - i18n ready
 * - Animation ready (framer-motion)
 * - Performance optimized (memo, lazy)
 * 
 * @module CardEngine
 * @version 1.0.0
 * @platform MatchMe Experience Engine
 */

import { memo, useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Check, X, MoreHorizontal,
  Pin, Heart, Bookmark, Share2, Trash2, Bell, Clock,
  TrendingUp, TrendingDown, Minus, Loader2
} from 'lucide-react';
import type {
  BaseCardConfig, CardVariant, CardDensity, CardElevation, CardRadius,
  CardAnimation, StatusBadgeConfig, MatchBadgeConfig, TagItem, AvatarConfig,
  CardAction, MetadataField, TrendIndicator, MediaPreviewConfig,
  DecisionCardConfig, SummaryCardConfig, DetailCardConfig, DetailSection,
  ExpandableCardConfig, SelectableCardConfig, SwipeCardConfig,
  AnalyticsCardConfig, CollectionCardConfig, NotificationCardConfig,
  TimelineCardConfig, CardEngineOptions, CardConfig
} from '@/lib/card-engine-types';

// ============================================================
// Style Utilities
// ============================================================

const variantStyles: Record<CardVariant, string> = {
  default: 'border bg-card',
  outlined: 'border-2 bg-transparent',
  elevated: 'border-0 shadow-md bg-card',
  filled: 'border-0 bg-muted',
  ghost: 'border-0 bg-transparent shadow-none',
};

const densityPadding: Record<CardDensity, string> = {
  compact: 'p-2 sm:p-3',
  normal: 'p-3 sm:p-4',
  comfortable: 'p-4 sm:p-6',
};

const elevationStyles: Record<CardElevation, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

const radiusStyles: Record<CardRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-2xl',
};

const animationVariants: Record<CardAnimation, object> = {
  none: {},
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slideUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } },
  scale: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } },
  spring: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }, exit: { opacity: 0, scale: 0.9 } },
};

function getBaseClasses(config: BaseCardConfig): string {
  const { variant = 'default', density = 'normal', elevation = 'sm', radius = 'lg', state, interactive } = config;
  return cn(
    variantStyles[variant],
    elevationStyles[elevation],
    radiusStyles[radius],
    interactive && 'cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]',
    state === 'disabled' && 'opacity-50 pointer-events-none',
    state === 'selected' && 'ring-2 ring-primary border-primary',
    state === 'error' && 'border-destructive',
  );
}

// ============================================================
// Shared Building Blocks
// ============================================================

/** Status Badge */
export const UCStatusBadge = memo(function UCStatusBadge({ config }: { config: StatusBadgeConfig }) {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    default: 'default',
    secondary: 'secondary',
    destructive: 'destructive',
    outline: 'outline',
    success: 'default',
    warning: 'secondary',
    info: 'secondary',
  };
  const colorMap: Record<string, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  const Icon = config.icon;
  return (
    <Badge
      variant={variantMap[config.variant] || 'secondary'}
      className={cn('text-[11px] gap-1 h-5 px-1.5', colorMap[config.variant], config.pulse && 'animate-pulse')}
    >
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {config.label}
    </Badge>
  );
});

/** Match Score Badge */
export const UCMatchBadge = memo(function UCMatchBadge({ config }: { config: MatchBadgeConfig }) {
  const { score, label, showPercentage = true, size = 'md' } = config;
  const sizeClasses = { sm: 'text-sm px-1.5 py-0.5', md: 'text-base px-2 py-1', lg: 'text-lg px-3 py-1.5' };
  const colorClass = score >= 85 ? 'text-green-600 bg-green-50 dark:bg-green-950/30'
    : score >= 70 ? 'text-primary bg-primary/5'
    : score >= 50 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
    : 'text-muted-foreground bg-muted';

  return (
    <div className={cn('rounded-lg text-center shrink-0', sizeClasses[size], colorClass)}>
      <p className={cn('font-bold font-[Poppins] leading-none', size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base')}>
        {score}{showPercentage && '%'}
      </p>
      {label && <p className="text-[8px] opacity-70 leading-tight mt-0.5">{label}</p>}
    </div>
  );
});

/** Tag Group */
export const UCTagGroup = memo(function UCTagGroup({ tags, max = 5 }: { tags: TagItem[]; max?: number }) {
  const visible = tags.slice(0, max);
  const overflow = tags.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(tag => {
        const Icon = tag.icon;
        return (
          <Badge
            key={tag.id}
            variant={tag.variant === 'default' ? 'default' : tag.variant === 'outline' ? 'outline' : 'secondary'}
            className={cn('text-[11px] py-0 px-1.5 h-5', tag.highlighted && 'ring-1 ring-primary')}
          >
            {Icon && <Icon className="w-2.5 h-2.5 me-0.5" />}
            {tag.label}
          </Badge>
        );
      })}
      {overflow > 0 && (
        <Badge variant="outline" className="text-[11px] py-0 px-1.5 h-5 opacity-50">+{overflow}</Badge>
      )}
    </div>
  );
});

/** Avatar */
export const UCAvatar = memo(function UCAvatar({ config }: { config: AvatarConfig }) {
  const { src, fallback, icon: Icon, size = 'md', shape = 'rounded', status } = config;
  const sizeClasses = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
  const shapeClasses = { circle: 'rounded-full', rounded: 'rounded-lg', square: 'rounded-none' };
  const statusColors = { online: 'bg-green-500', offline: 'bg-gray-400', busy: 'bg-red-500', away: 'bg-amber-500' };

  return (
    <div className="relative shrink-0">
      <div className={cn(sizeClasses[size], shapeClasses[shape], 'bg-primary/10 flex items-center justify-center overflow-hidden')}>
        {src ? (
          <img src={src} alt={fallback} className="w-full h-full object-cover" loading="lazy" />
        ) : Icon ? (
          <Icon className={cn('text-primary', size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5')} />
        ) : (
          <span className={cn('font-semibold text-primary', size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-xs' : 'text-sm')}>
            {fallback.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      {status && (
        <span className={cn('absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full border-2 border-background', statusColors[status])} />
      )}
    </div>
  );
});

/** Card Actions Bar */
export const UCCardActions = memo(function UCCardActions({ actions, compact }: { actions: CardAction[]; compact?: boolean }) {
  const visible = actions.filter(a => !a.hidden);
  if (visible.length === 0) return null;

  return (
    <div className={cn('flex items-center', compact ? 'gap-1' : 'gap-2')}>
      {visible.map(action => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant={action.variant || 'ghost'}
            size={compact ? 'sm' : (action.size === 'lg' ? 'lg' : action.size === 'sm' ? 'sm' : 'default')}
            onClick={action.onClick}
            disabled={action.disabled || action.loading}
            className="cursor-pointer gap-1"
          >
            {action.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : Icon && <Icon className={cn(compact ? 'w-3 h-3' : 'w-4 h-4')} />}
            {!compact && action.label}
          </Button>
        );
      })}
    </div>
  );
});

/** Metadata Row */
export const UCMetadata = memo(function UCMetadata({ fields }: { fields: MetadataField[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {fields.map(field => {
        const Icon = field.icon;
        return (
          <span key={field.id} className="flex items-center gap-1 text-xs text-muted-foreground">
            {Icon && <Icon className="w-3 h-3" />}
            {field.label && <span className="font-medium">{field.label}:</span>}
            <span>{field.value}</span>
          </span>
        );
      })}
    </div>
  );
});

/** Trend Indicator */
export const UCTrend = memo(function UCTrend({ trend }: { trend: TrendIndicator }) {
  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const color = trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-500' : 'text-muted-foreground';
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-medium', color)}>
      <Icon className="w-3 h-3" />
      {Math.abs(trend.value)}%
      {trend.period && <span className="text-muted-foreground font-normal ms-0.5">{trend.period}</span>}
    </span>
  );
});

/** Media Preview */
export const UCMediaPreview = memo(function UCMediaPreview({ config }: { config: MediaPreviewConfig }) {
  const { type, src, alt, fallbackIcon: FallbackIcon, aspectRatio = '16:9', lazy = true } = config;
  const ratioClasses = { '1:1': 'aspect-square', '4:3': 'aspect-[4/3]', '16:9': 'aspect-video', '3:4': 'aspect-[3/4]' };

  return (
    <div className={cn('w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center', ratioClasses[aspectRatio])}>
      {src ? (
        <img src={src} alt={alt || ''} className="w-full h-full object-cover" loading={lazy ? 'lazy' : 'eager'} />
      ) : FallbackIcon ? (
        <FallbackIcon className="w-8 h-8 text-muted-foreground/30" />
      ) : (
        <div className="w-8 h-8 rounded bg-muted-foreground/10" />
      )}
    </div>
  );
});

/** Loading Skeleton */
export const UCLoadingSkeleton = memo(function UCLoadingSkeleton({ density = 'normal' }: { density?: CardDensity }) {
  return (
    <div className={cn('rounded-lg border bg-card animate-pulse', densityPadding[density])}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
});

// ============================================================
// Card Type Implementations
// ============================================================

/** Decision Card — Quick evaluation (Jobs, Candidates, Companies) */
export const UCDecisionCard = memo(function UCDecisionCard({ config }: { config: DecisionCardConfig }) {
  const { title, subtitle, avatar, matchScore, badges, tags, metadata, actions, onClick, className } = config;

  return (
    <div
      className={cn(getBaseClasses(config), densityPadding[config.density || 'normal'], className)}
      onClick={onClick}
      onKeyDown={config.interactive && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      role={config.interactive ? 'button' : undefined}
      tabIndex={config.interactive ? 0 : undefined}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      {/* Header: Avatar + Title + Score */}
      <div className="flex items-start gap-3">
        {avatar && <UCAvatar config={avatar} />}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 font-[Poppins]">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        {matchScore && <UCMatchBadge config={matchScore} />}
      </div>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {badges.map((b, i) => <UCStatusBadge key={i} config={b} />)}
        </div>
      )}

      {/* Metadata */}
      {metadata && metadata.length > 0 && (
        <div className="mt-2">
          <UCMetadata fields={metadata} />
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-2">
          <UCTagGroup tags={tags} />
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border">
          <UCCardActions actions={actions} compact />
        </div>
      )}
    </div>
  );
});

/** Summary Card — Concise information (Dashboard, Stats) */
export const UCSummaryCard = memo(function UCSummaryCard({ config }: { config: SummaryCardConfig }) {
  const { title, value, label, icon: Icon, colorClass = 'text-primary', trend, description, actions, onClick, className } = config;
  const density = config.density || 'normal';

  return (
    <div
      className={cn(getBaseClasses(config), densityPadding[density], className)}
      onClick={onClick}
      role={config.interactive ? 'button' : undefined}
      tabIndex={config.interactive ? 0 : undefined}
      aria-label={config.ariaLabel || label}
      data-testid={config.testId}
    >
      {title && <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>}
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn('rounded-lg flex items-center justify-center shrink-0 bg-primary/5', density === 'compact' ? 'w-8 h-8' : 'w-10 h-10')}>
            <Icon className={cn(density === 'compact' ? 'w-4 h-4' : 'w-5 h-5', colorClass)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('font-bold font-[Poppins] tabular-nums', density === 'compact' ? 'text-xl' : 'text-2xl', colorClass)}>
            {value}
          </p>
          <p className={cn('text-muted-foreground truncate', density === 'compact' ? 'text-[11px]' : 'text-xs mt-0.5')}>
            {label}
          </p>
          {trend && <div className="mt-1"><UCTrend trend={trend} /></div>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border">
          <UCCardActions actions={actions} compact />
        </div>
      )}
    </div>
  );
});

/** Detail Card — Rich information (Job Description, Profile) */
export const UCDetailCard = memo(function UCDetailCard({ config }: { config: DetailCardConfig }) {
  const { title, subtitle, avatar, media, sections, metadata, tags, actions, matchScore, onClick, className } = config;

  return (
    <div
      className={cn(getBaseClasses(config), densityPadding[config.density || 'normal'], className)}
      onClick={onClick}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      {/* Media */}
      {media && <div className="mb-3"><UCMediaPreview config={media} /></div>}

      {/* Header */}
      <div className="flex items-start gap-3">
        {avatar && <UCAvatar config={avatar} />}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight font-[Poppins]">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {matchScore && <UCMatchBadge config={matchScore} />}
      </div>

      {/* Metadata */}
      {metadata && metadata.length > 0 && (
        <div className="mt-3"><UCMetadata fields={metadata} /></div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-3"><UCTagGroup tags={tags} /></div>
      )}

      {/* Sections */}
      {sections && sections.length > 0 && (
        <div className="mt-4 space-y-3">
          {sections.map(section => (
            <DetailSectionBlock key={section.id} section={section} />
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <UCCardActions actions={actions} />
        </div>
      )}
    </div>
  );
});

function DetailSectionBlock({ section }: { section: DetailSection }) {
  const [expanded, setExpanded] = useState(section.defaultExpanded !== false);

  if (section.collapsible) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-start cursor-pointer"
        >
          {section.title && <h4 className="text-sm font-semibold">{section.title}</h4>}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-1.5 text-sm text-muted-foreground">{section.content}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div>
      {section.title && <h4 className="text-sm font-semibold mb-1.5">{section.title}</h4>}
      <div className="text-sm text-muted-foreground">{section.content}</div>
    </div>
  );
}

/** Expandable Card — Expand/Collapse with animated height */
export const UCExpandableCard = memo(function UCExpandableCard({ config }: { config: ExpandableCardConfig }) {
  const { title, subtitle, icon: Icon, preview, expandedContent, defaultExpanded = false, expanded: controlledExpanded, onToggle, animateHeight = true, onClick, className } = config;
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = useCallback(() => {
    const next = !isExpanded;
    setInternalExpanded(next);
    onToggle?.(next);
  }, [isExpanded, onToggle]);

  return (
    <div
      className={cn(getBaseClasses(config), densityPadding[config.density || 'normal'], className)}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      <button
        onClick={handleToggle}
        className="flex items-center justify-between w-full text-start cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.div>
      </button>

      {/* Preview (shown when collapsed) */}
      {!isExpanded && preview && (
        <div className="mt-2 text-sm text-muted-foreground">{preview}</div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={animateHeight ? { height: 0, opacity: 0 } : undefined}
            animate={animateHeight ? { height: 'auto', opacity: 1 } : undefined}
            exit={animateHeight ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border">
              {expandedContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/** Selectable Card — Single/Multi selection for workflows */
export const UCSelectableCard = memo(function UCSelectableCard({ config }: { config: SelectableCardConfig }) {
  const { title, subtitle, avatar, metadata, tags, selected = false, onSelect, checkboxPosition = 'start', actions, onClick, className } = config;

  const handleClick = useCallback(() => {
    onSelect?.(!selected);
    onClick?.();
  }, [selected, onSelect, onClick]);

  const checkbox = (
    <div
      className={cn(
        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
        selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
      )}
    >
      {selected && <Check className="w-3 h-3 text-primary-foreground" />}
    </div>
  );

  return (
    <div
      className={cn(
        getBaseClasses({ ...config, state: selected ? 'selected' : config.state }),
        densityPadding[config.density || 'normal'],
        'cursor-pointer',
        className
      )}
      onClick={handleClick}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      <div className="flex items-center gap-3">
        {checkboxPosition === 'start' && checkbox}
        {avatar && <UCAvatar config={avatar} />}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          {metadata && metadata.length > 0 && <div className="mt-1"><UCMetadata fields={metadata} /></div>}
          {tags && tags.length > 0 && <div className="mt-1.5"><UCTagGroup tags={tags} max={3} /></div>}
        </div>
        {checkboxPosition === 'end' && checkbox}
      </div>

      {/* Bulk actions (shown when selected) */}
      {selected && actions && actions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <UCCardActions actions={actions} compact />
        </div>
      )}
    </div>
  );
});

/** Swipe Card — Gesture-based decisions */
export const UCSwipeCard = memo(function UCSwipeCard({ config }: { config: SwipeCardConfig }) {
  const { title, subtitle, avatar, matchScore, tags, metadata, onSwipeLeft, onSwipeRight, leftLabel, rightLabel, onViewDetails, className } = config;

  return (
    <div
      className={cn(getBaseClasses(config), densityPadding[config.density || 'normal'], className)}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {avatar && <UCAvatar config={avatar} />}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight line-clamp-2 font-[Poppins]">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
        </div>
        {matchScore && <UCMatchBadge config={matchScore} />}
      </div>

      {/* Metadata */}
      {metadata && metadata.length > 0 && <div className="mt-2"><UCMetadata fields={metadata} /></div>}

      {/* Tags */}
      {tags && tags.length > 0 && <div className="mt-2"><UCTagGroup tags={tags} /></div>}

      {/* Swipe Actions */}
      <div className="flex justify-center items-center gap-4 mt-4 pt-3 border-t border-border">
        <Button
          size="lg"
          variant="outline"
          className="rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-white cursor-pointer w-12 h-12"
          onClick={onSwipeLeft}
          aria-label={leftLabel || 'Pass'}
        >
          <X className="w-5 h-5" />
        </Button>
        {onViewDetails && (
          <Button size="lg" variant="outline" className="rounded-full cursor-pointer w-10 h-10" onClick={onViewDetails} aria-label="Details">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="lg"
          className="rounded-full bg-green-500 hover:bg-green-600 text-white cursor-pointer w-12 h-12"
          onClick={onSwipeRight}
          aria-label={rightLabel || 'Like'}
        >
          <Check className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
});

/** Analytics Card — Charts, KPIs, Metrics */
export const UCAnalyticsCard = memo(function UCAnalyticsCard({ config }: { config: AnalyticsCardConfig }) {
  const { title, value, label, trend, chart, comparison, period, icon: Icon, colorClass = 'text-primary', onClick, className } = config;

  return (
    <div
      className={cn(getBaseClasses(config), densityPadding[config.density || 'normal'], className)}
      onClick={onClick}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn('w-4 h-4', colorClass)} />}
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        {period && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{period}</span>}
      </div>

      {/* Primary Metric */}
      <div className="flex items-end gap-2">
        <p className={cn('text-2xl font-bold font-[Poppins] tabular-nums', colorClass)}>{value}</p>
        {label && <p className="text-xs text-muted-foreground mb-0.5">{label}</p>}
        {trend && <div className="mb-0.5"><UCTrend trend={trend} /></div>}
      </div>

      {/* Chart */}
      {chart && <div className="mt-3">{chart}</div>}

      {/* Comparisons */}
      {comparison && comparison.length > 0 && (
        <div className="mt-3 pt-2 border-t border-border space-y-1.5">
          {comparison.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{c.value}</span>
                {c.trend && <UCTrend trend={c.trend} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/** Collection Card — Folders, Lists, Saved Items */
export const UCCollectionCard = memo(function UCCollectionCard({ config }: { config: CollectionCardConfig }) {
  const { title, count, description, color, previews, collectionType, pinned, actions, updatedAt, onClick, className } = config;
  const typeLabels: Record<string, string> = { manual: 'Manual', smart: 'Smart', ai: 'AI', shared: 'Shared' };

  return (
    <div
      className={cn(getBaseClasses({ ...config, interactive: true }), densityPadding[config.density || 'normal'], className)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      {/* Color accent bar */}
      {color && <div className="w-full h-1 rounded-full mb-3" style={{ backgroundColor: color }} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
            <h3 className="font-semibold text-sm leading-tight truncate">{title}</h3>
          </div>
          {description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>}
        </div>
        <Badge variant="secondary" className="text-[11px] shrink-0 ms-2">{count}</Badge>
      </div>

      {/* Collection type */}
      {collectionType && (
        <Badge variant="outline" className="text-[10px] mt-2 h-4 px-1">
          {typeLabels[collectionType] || collectionType}
        </Badge>
      )}

      {/* Preview avatars */}
      {previews && previews.length > 0 && (
        <div className="flex -space-x-2 rtl:space-x-reverse mt-3">
          {previews.slice(0, 4).map((p, i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center overflow-hidden">
              {p.src ? <img src={p.src} alt={p.fallback} className="w-full h-full object-cover" /> : <span className="text-[9px] font-medium text-primary">{p.fallback.slice(0, 2)}</span>}
            </div>
          ))}
          {previews.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">+{previews.length - 4}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {(updatedAt || (actions && actions.length > 0)) && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          {updatedAt && <span className="text-[10px] text-muted-foreground">{updatedAt}</span>}
          {actions && <UCCardActions actions={actions} compact />}
        </div>
      )}
    </div>
  );
});

/** Notification Card — Alerts, Messages, Updates */
export const UCNotificationCard = memo(function UCNotificationCard({ config }: { config: NotificationCardConfig }) {
  const { title, description, icon: Icon, priority = 'normal', read = false, timestamp, actions, dismissible, onDismiss, onClick, className } = config;
  const priorityColors: Record<string, string> = {
    low: 'text-muted-foreground',
    normal: 'text-primary',
    high: 'text-amber-600',
    urgent: 'text-destructive',
  };

  return (
    <div
      className={cn(
        getBaseClasses(config),
        densityPadding[config.density || 'normal'],
        !read && 'border-primary/30 bg-primary/5',
        className
      )}
      onClick={onClick}
      role={config.interactive ? 'button' : undefined}
      tabIndex={config.interactive ? 0 : undefined}
      aria-label={config.ariaLabel || title}
      data-testid={config.testId}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', read ? 'bg-muted-foreground/20' : 'bg-primary')} />

        {/* Icon */}
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted', priorityColors[priority])}>
            <Icon className="w-4 h-4" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm leading-tight', !read && 'font-medium')}>{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          {timestamp && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />{timestamp}
            </p>
          )}
        </div>

        {/* Dismiss */}
        {dismissible && (
          <Button size="sm" variant="ghost" className="shrink-0 cursor-pointer w-6 h-6 p-0" onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="mt-2 ps-5">
          <UCCardActions actions={actions} compact />
        </div>
      )}
    </div>
  );
});

/** Timeline Card — Activities, History, Pipeline */
export const UCTimelineCard = memo(function UCTimelineCard({ config }: { config: TimelineCardConfig }) {
  const { title, description, timestamp, icon: Icon, eventType = 'neutral', actor, isLast, metadata, className } = config;
  const eventColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    success: 'bg-green-100 text-green-600 dark:bg-green-900/30',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    neutral: 'bg-muted text-muted-foreground',
  };

  return (
    <div className={cn('flex gap-3', className)} data-testid={config.testId}>
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', eventColors[eventType])}>
          {Icon ? <Icon className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">{title}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 ms-2">{timestamp}</span>
        </div>

        {/* Actor */}
        {actor && (
          <div className="flex items-center gap-2 mt-2">
            <UCAvatar config={{ ...actor, size: 'xs' }} />
            <span className="text-xs text-muted-foreground">{actor.name}</span>
          </div>
        )}

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className="mt-2"><UCMetadata fields={metadata} /></div>
        )}
      </div>
    </div>
  );
});

// ============================================================
// Card Engine Renderer — Universal entry point
// ============================================================

/** Render any card from configuration */
export function renderCard(config: CardConfig): ReactNode {
  const animation = config.animation || 'none';
  const motionProps = animation !== 'none' ? animationVariants[animation] : {};

  const cardElement = (() => {
    switch (config.type) {
      case 'decision': return <UCDecisionCard config={config} />;
      case 'summary': return <UCSummaryCard config={config} />;
      case 'detail': return <UCDetailCard config={config} />;
      case 'expandable': return <UCExpandableCard config={config} />;
      case 'selectable': return <UCSelectableCard config={config} />;
      case 'swipe': return <UCSwipeCard config={config} />;
      case 'analytics': return <UCAnalyticsCard config={config} />;
      case 'collection': return <UCCollectionCard config={config} />;
      case 'notification': return <UCNotificationCard config={config} />;
      case 'timeline': return <UCTimelineCard config={config} />;
      default: return null;
    }
  })();

  if (animation !== 'none') {
    return <motion.div {...motionProps}>{cardElement}</motion.div>;
  }

  return cardElement;
}

/** Card Grid — Renders a list of cards with layout options */
export const UCCardGrid = memo(function UCCardGrid({ cards, options = {} }: { cards: CardConfig[]; options?: CardEngineOptions }) {
  const { layout = 'list', columns, gap = 'md', staggerDelay = 50, emptyState, skeletonCount = 3 } = options;

  const gapClasses = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' };
  const colClasses = columns
    ? `grid-cols-${columns.xs || 1} sm:grid-cols-${columns.sm || columns.xs || 1} md:grid-cols-${columns.md || 2} lg:grid-cols-${columns.lg || 3}`
    : layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1';

  // Empty state
  if (cards.length === 0 && emptyState) {
    const EmptyIcon = emptyState.icon;
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {EmptyIcon && <EmptyIcon className="w-12 h-12 text-muted-foreground/30 mb-3" />}
        <h3 className="text-sm font-medium mb-1">{emptyState.title}</h3>
        {emptyState.description && <p className="text-xs text-muted-foreground mb-3">{emptyState.description}</p>}
        {emptyState.action && (
          <Button variant={emptyState.action.variant || 'default'} size="sm" onClick={emptyState.action.onClick} className="cursor-pointer">
            {emptyState.action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid', layout === 'list' ? 'grid-cols-1' : colClasses, gapClasses[gap])}>
      {cards.map((card, index) => (
        <motion.div
          key={card.id || index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * (staggerDelay / 1000), duration: 0.2 }}
        >
          {renderCard(card)}
        </motion.div>
      ))}
    </div>
  );
});

// ============================================================
// Re-export types for convenience
// ============================================================

export type {
  CardConfig, DecisionCardConfig, SummaryCardConfig, DetailCardConfig,
  ExpandableCardConfig, SelectableCardConfig, SwipeCardConfig,
  AnalyticsCardConfig, CollectionCardConfig, NotificationCardConfig,
  TimelineCardConfig, CardEngineOptions, BaseCardConfig,
  StatusBadgeConfig, MatchBadgeConfig, TagItem, AvatarConfig,
  CardAction, MetadataField, TrendIndicator, MediaPreviewConfig,
  CardVariant, CardDensity, CardElevation, CardRadius, CardAnimation,
  DetailSection
};