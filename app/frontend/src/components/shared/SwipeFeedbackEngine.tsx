/**
 * Swipe Feedback Engine — MatchMe Experience Engine
 * 
 * The single source of truth for all swipe interactions across the platform.
 * Controls: card rotation, translation, scaling, overlay labels, overlay colors,
 * overlay opacity, swipe progress, card stacking, animation timing.
 * 
 * Reusable for: Job Discovery, Candidate Discovery, Company Discovery,
 * Marketplace, Saved Items Review, Talent/AI Recommendations.
 * 
 * @accessibility WCAG AA, reduced-motion, screen readers, RTL, high contrast
 * @responsive 320–412px+ mobile, tablets, desktop unchanged
 */

import React, { useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo, type MotionValue } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================================
// Types & Configuration
// ============================================================

export interface SwipeFeedbackConfig {
  /** Swipe distance threshold to trigger action (px) */
  threshold?: number;
  /** Maximum card rotation during drag (degrees) */
  maxRotation?: number;
  /** Drag elasticity (0-1) */
  elasticity?: number;
  /** Scale of background cards in stack */
  stackScale?: number;
  /** Opacity of background cards in stack */
  stackOpacity?: number;
  /** Vertical offset between stacked cards (px) */
  stackOffset?: number;
  /** Exit animation duration (ms) */
  exitDuration?: number;
  /** Spring back duration (ms) */
  springBackDuration?: number;
  /** Enable card stacking visual */
  showStack?: boolean;
  /** Custom right-swipe label (i18n key) */
  rightLabel?: string;
  /** Custom left-swipe label (i18n key) */
  leftLabel?: string;
  /** Custom right-swipe color */
  rightColor?: string;
  /** Custom left-swipe color */
  leftColor?: string;
}

export interface SwipeCardItem {
  id: string | number;
  [key: string]: unknown;
}

export interface SwipeFeedbackEngineProps {
  /** Items in the swipe deck */
  items: SwipeCardItem[];
  /** Current active index */
  activeIndex: number;
  /** Render function for card content */
  renderCard: (item: SwipeCardItem, isActive: boolean) => React.ReactNode;
  /** Called when swipe action is triggered; false restores the card after a failed server action. */
  onSwipe: (direction: 'left' | 'right', item: SwipeCardItem) => void | boolean | Promise<void | boolean>;
  /** Called when card details are tapped */
  onTap?: (item: SwipeCardItem) => void;
  /** Engine configuration */
  config?: SwipeFeedbackConfig;
  /** Additional className for the container */
  className?: string;
  /** Whether swipe is enabled (mobile only by default) */
  enabled?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<SwipeFeedbackConfig> = {
  threshold: 100,
  maxRotation: 15,
  elasticity: 0.7,
  stackScale: 0.95,
  stackOpacity: 0.7,
  stackOffset: 8,
  exitDuration: 300,
  springBackDuration: 400,
  showStack: true,
  rightLabel: 'swipe_apply',
  leftLabel: 'swipe_pass',
  rightColor: '#16a34a', // green-600
  leftColor: '#dc2626', // red-600
};

// ============================================================
// Swipe Overlay Stamp Component
// ============================================================

interface SwipeStampProps {
  label: string;
  color: string;
  opacity: MotionValue<number>;
  position: 'start' | 'end';
  rotation: number;
}

function SwipeStamp({ label, color, opacity, position, rotation }: SwipeStampProps) {
  const positionClass = position === 'end'
    ? 'top-6 end-4 sm:top-8 sm:end-6'
    : 'top-6 start-4 sm:top-8 sm:start-6';

  return (
    <motion.div
      className={`absolute ${positionClass} z-20 pointer-events-none select-none`}
      style={{ opacity, rotate: rotation }}
      aria-hidden="true"
    >
      <div
        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg border-[3px] font-bold text-lg sm:text-xl uppercase tracking-wider"
        style={{
          borderColor: color,
          color: color,
          backgroundColor: 'transparent',
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}

// ============================================================
// Card Stack Background Component
// ============================================================

interface CardStackProps {
  items: SwipeCardItem[];
  activeIndex: number;
  renderCard: (item: SwipeCardItem, isActive: boolean) => React.ReactNode;
  config: Required<SwipeFeedbackConfig>;
  swipeProgress: MotionValue<number>;
}

function CardStack({ items, activeIndex, renderCard, config, swipeProgress }: CardStackProps) {
  // Hooks must be called unconditionally
  const scale = useTransform(swipeProgress, [0, 1], [config.stackScale, 1]);
  const stackOpacity = useTransform(swipeProgress, [0, 1], [config.stackOpacity, 1]);

  const nextIndex = activeIndex + 1;
  if (nextIndex >= items.length || !config.showStack) return null;

  const nextItem = items[nextIndex];

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        scale,
        opacity: stackOpacity,
        y: config.stackOffset,
      }}
      aria-hidden="true"
    >
      <div className="h-full w-full rounded-2xl overflow-hidden shadow-md">
        {renderCard(nextItem, false)}
      </div>
    </motion.div>
  );
}

// ============================================================
// Active Swipe Card Wrapper
// ============================================================

interface ActiveSwipeCardProps {
  item: SwipeCardItem;
  renderCard: (item: SwipeCardItem, isActive: boolean) => React.ReactNode;
  onSwipe: SwipeFeedbackEngineProps['onSwipe'];
  onTap?: (item: SwipeCardItem) => void;
  config: Required<SwipeFeedbackConfig>;
  enabled: boolean;
  swipeProgress: MotionValue<number>;
}

function ActiveSwipeCard({ item, renderCard, onSwipe, onTap, config, enabled, swipeProgress }: ActiveSwipeCardProps) {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  // Card transforms
  const rotate = useTransform(x, [-200, 200], [-config.maxRotation, config.maxRotation]);
  const cardOpacity = useTransform(x, [-250, -150, 0, 150, 250], [0.6, 0.9, 1, 0.9, 0.6]);

  // Stamp opacity - progressive fade in
  const leftStampOpacity = useTransform(x, [-config.threshold * 1.5, -config.threshold * 0.5, 0], [1, 0.4, 0]);
  const rightStampOpacity = useTransform(x, [0, config.threshold * 0.5, config.threshold * 1.5], [0, 0.4, 1]);

  // Swipe progress for card stack (0 = resting, 1 = at threshold)
  const absProgress = useTransform(x, (latest) => {
    const progress = Math.min(Math.abs(latest) / config.threshold, 1);
    return progress;
  });

  // Sync swipe progress to parent
  React.useEffect(() => {
    const unsubscribe = absProgress.on('change', (v) => {
      swipeProgress.set(v);
    });
    return unsubscribe;
  }, [absProgress, swipeProgress]);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    isDragging.current = false;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Check if threshold is met (distance or velocity)
    if (offset > config.threshold || velocity > 500) {
      // Animate card off-screen to the right
      animate(x, window.innerWidth + 200, {
        duration: config.exitDuration / 1000,
        ease: 'easeOut',
        onComplete: async () => {try{if(await onSwipe('right',item)===false)animate(x,0,{type:'spring',stiffness:300,damping:25});}catch{animate(x,0,{type:'spring',stiffness:300,damping:25});}},
      });
    } else if (offset < -config.threshold || velocity < -500) {
      // Animate card off-screen to the left
      animate(x, -(window.innerWidth + 200), {
        duration: config.exitDuration / 1000,
        ease: 'easeOut',
        onComplete: async () => {try{if(await onSwipe('left',item)===false)animate(x,0,{type:'spring',stiffness:300,damping:25});}catch{animate(x,0,{type:'spring',stiffness:300,damping:25});}},
      });
    } else {
      // Spring back to center
      animate(x, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      });
    }
  }, [config.threshold, config.exitDuration, item, onSwipe, x]);

  const handleTap = useCallback(() => {
    if (!isDragging.current && onTap) {
      onTap(item);
    }
  }, [item, onTap]);

  // Reduced motion: disable rotation and use simpler transforms
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const effectiveRotate = prefersReducedMotion ? 0 : rotate;

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        touchAction: enabled ? 'pan-y' : 'auto',
        x,
        rotate: effectiveRotate,
        opacity: cardOpacity,
      }}
      drag={enabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={config.elasticity}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleTap}
      role="article"
      aria-roledescription={t('swipe_card_description')}
      aria-label={t('swipe_card_aria', { id: String(item.id) })}
    >
      {/* PASS stamp (left swipe) */}
      <SwipeStamp
        label={t(config.leftLabel)}
        color={config.leftColor}
        opacity={leftStampOpacity}
        position="start"
        rotation={-12}
      />

      {/* APPLY stamp (right swipe) */}
      <SwipeStamp
        label={t(config.rightLabel)}
        color={config.rightColor}
        opacity={rightStampOpacity}
        position="end"
        rotation={12}
      />

      {/* Card content */}
      <div className="h-full w-full">
        {renderCard(item, true)}
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Swipe Feedback Engine Component
// ============================================================

export function SwipeFeedbackEngine({
  items,
  activeIndex,
  renderCard,
  onSwipe,
  onTap,
  config: userConfig,
  className = '',
  enabled = true,
}: SwipeFeedbackEngineProps) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const swipeProgress = useMotionValue(0);

  const activeItem = items[activeIndex];
  if (!activeItem) return null;

  return (
    <div
      className={`relative w-full h-full ${className}`}
      role="region"
      aria-label="Swipe card deck"
    >
      {/* Background stack card */}
      <CardStack
        items={items}
        activeIndex={activeIndex}
        renderCard={renderCard}
        config={config}
        swipeProgress={swipeProgress}
      />

      {/* Active swipeable card */}
      <ActiveSwipeCard
        key={activeItem.id}
        item={activeItem}
        renderCard={renderCard}
        onSwipe={onSwipe}
        onTap={onTap}
        config={config}
        enabled={enabled}
        swipeProgress={swipeProgress}
      />
    </div>
  );
}

// ============================================================
// Hook: useSwipeFeedback — for programmatic swipe triggers
// ============================================================

export interface UseSwipeFeedbackReturn {
  /** Programmatically trigger a left swipe animation */
  triggerLeft: () => void;
  /** Programmatically trigger a right swipe animation */
  triggerRight: () => void;
}

/**
 * Hook for programmatic swipe control (e.g., from action bar buttons).
 * Returns trigger functions that animate the active card off-screen.
 */
export function useSwipeFeedback(
  onSwipe: (direction: 'left' | 'right') => void,
  config?: SwipeFeedbackConfig
): UseSwipeFeedbackReturn {
  const exitDuration = config?.exitDuration ?? DEFAULT_CONFIG.exitDuration;

  const triggerLeft = useCallback(() => {
    onSwipe('left');
  }, [onSwipe]);

  const triggerRight = useCallback(() => {
    onSwipe('right');
  }, [onSwipe]);

  return { triggerLeft, triggerRight };
}

// ============================================================
// Exports
// ============================================================

export type { SwipeFeedbackConfig as SwipeConfig };
export default SwipeFeedbackEngine;