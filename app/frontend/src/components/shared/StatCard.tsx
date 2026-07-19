/**
 * Reusable statistics card component.
 * Mobile-first design with compact layout for 2x2 grids.
 * Supports icons, trends, and responsive sizing.
 */

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  colorClass?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  compact?: boolean;
  className?: string;
}

export function StatCard({ label, value, colorClass = 'text-primary', icon: Icon, trend, compact, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border',
        compact ? 'p-3' : 'p-4',
        'transition-shadow hover:shadow-sm',
        className
      )}
    >
      <div className={cn('flex items-start', compact ? 'gap-2' : 'gap-3')}>
        {Icon && (
          <div className={cn(
            'rounded-lg flex items-center justify-center shrink-0',
            compact ? 'w-8 h-8' : 'w-10 h-10',
            'bg-primary/5'
          )}>
            <Icon className={cn(compact ? 'w-4 h-4' : 'w-5 h-5', colorClass)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-bold font-[Poppins] tabular-nums',
            compact ? 'text-xl' : 'text-2xl sm:text-3xl',
            colorClass
          )}>
            {value}
          </p>
          <p className={cn(
            'text-muted-foreground truncate',
            compact ? 'text-[11px] mt-0' : 'text-xs sm:text-sm mt-0.5'
          )}>
            {label}
          </p>
          {trend && (
            <p className={cn(
              'text-[10px] mt-0.5 font-medium',
              trend.positive ? 'text-green-600' : 'text-red-500'
            )}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatCard;