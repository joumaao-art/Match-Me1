/**
 * Reusable empty state component.
 * Displays when a list or section has no content.
 */

import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold font-[Poppins] mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="cursor-pointer">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;