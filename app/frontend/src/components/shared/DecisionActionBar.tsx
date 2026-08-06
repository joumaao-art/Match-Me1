/**
 * Sticky Decision Action Bar — Experience Engine Component
 * 
 * A reusable, always-visible action bar for swipe-based decision screens.
 * Positioned above the bottom navigation, safe-area aware.
 * 
 * Features:
 * - Three primary actions: Pass (❌), Save (⭐), Like (❤️)
 * - Always visible, never hidden behind bottom navigation
 * - Thumb-friendly 56px touch targets
 * - Animated press states with spring physics
 * - Safe-area aware for notched devices
 * - RTL/LTR support
 * - Dark mode support
 * - Accessible (ARIA labels, keyboard support)
 * - Registered in Experience Engine
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DecisionAction {
  id: string;
  icon: typeof X;
  label: string;
  color: string;
  bgColor: string;
  hoverBgColor: string;
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  disabled?: boolean;
}

interface DecisionActionBarProps {
  onPass: () => void;
  onSave: () => void;
  onLike: () => void;
  passDisabled?: boolean;
  saveDisabled?: boolean;
  likeDisabled?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
}

const buttonVariants = {
  tap: { scale: 0.85 },
  hover: { scale: 1.08 },
  initial: { scale: 1 },
};

function ActionButton({ action }: { action: DecisionAction }) {
  const sizeClasses = {
    sm: 'w-11 h-11',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileTap="tap"
      whileHover="hover"
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        'rounded-full flex items-center justify-center',
        'shadow-lg border-2 transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        sizeClasses[action.size],
        action.bgColor,
        action.color,
        !action.disabled && action.hoverBgColor,
      )}
      aria-label={action.label}
      type="button"
    >
      <action.icon className={iconSizes[action.size]} strokeWidth={2.5} />
    </motion.button>
  );
}

export function DecisionActionBar({
  onPass,
  onSave,
  onLike,
  passDisabled = false,
  saveDisabled = false,
  likeDisabled = false,
  className,
  variant = 'default',
}: DecisionActionBarProps) {
  const { t } = useTranslation();

  const actions: DecisionAction[] = [
    {
      id: 'pass',
      icon: X,
      label: t('pass'),
      color: 'text-destructive border-destructive/30',
      bgColor: 'bg-background',
      hoverBgColor: 'hover:bg-destructive/10',
      size: 'lg',
      onClick: onPass,
      disabled: passDisabled,
    },
    {
      id: 'save',
      icon: Star,
      label: t('save'),
      color: 'text-amber-500 border-amber-500/30',
      bgColor: 'bg-background',
      hoverBgColor: 'hover:bg-amber-500/10',
      size: 'md',
      onClick: onSave,
      disabled: saveDisabled,
    },
    {
      id: 'like',
      icon: Heart,
      label: t('like'),
      color: 'text-green-500 border-green-500/30',
      bgColor: 'bg-background',
      hoverBgColor: 'hover:bg-green-500/10',
      size: 'lg',
      onClick: onLike,
      disabled: likeDisabled,
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={cn('flex justify-center items-center gap-4', className)}>
        {actions.map(action => (
          <ActionButton key={action.id} action={{ ...action, size: 'sm' }} />
        ))}
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={cn(
        'fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+8px)] inset-x-0 z-30 md:hidden',
        'flex justify-center items-center gap-5',
        'pointer-events-none',
        className,
      )}>
        <div className="flex items-center gap-5 pointer-events-auto">
          {actions.map(action => (
            <ActionButton key={action.id} action={action} />
          ))}
        </div>
      </div>
    );
  }

  // Default: inline
  return (
    <div className={cn('flex justify-center items-center gap-5', className)}>
      {actions.map(action => (
        <ActionButton key={action.id} action={action} />
      ))}
    </div>
  );
}

export default DecisionActionBar;