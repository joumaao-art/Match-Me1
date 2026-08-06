/**
 * Reusable statistics card component.
 * Mobile-first design with compact layout for 2x2 grids.
 * Supports icons, trends, and responsive sizing.
 * 
 * Now powered by the Universal Card Engine (UCSummaryCard).
 * Preserves the original API for backward compatibility.
 * 
 * @module StatCard
 * @engine CardEngine (Summary Card type)
 */

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UCSummaryCard } from '@/components/shared/CardEngine';
import type { SummaryCardConfig, TrendIndicator } from '@/lib/card-engine-types';

interface StatCardProps {
  label: string;
  value: string | number;
  colorClass?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  compact?: boolean;
  className?: string;
}

export function StatCard({ label, value, colorClass = 'text-primary', icon, trend, compact, className }: StatCardProps) {
  // Map legacy trend format to Card Engine TrendIndicator
  const engineTrend: TrendIndicator | undefined = trend
    ? { value: trend.value, direction: trend.positive ? 'up' : 'down' }
    : undefined;

  // Build Card Engine configuration from legacy props
  const config: SummaryCardConfig = {
    type: 'summary',
    value,
    label,
    icon,
    colorClass,
    trend: engineTrend,
    density: compact ? 'compact' : 'normal',
    variant: 'default',
    elevation: 'none',
    radius: 'xl',
    className: cn('transition-shadow hover:shadow-sm', className),
  };

  return <UCSummaryCard config={config} />;
}

export default StatCard;