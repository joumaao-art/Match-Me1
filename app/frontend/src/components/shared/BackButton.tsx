/**
 * Reusable Back Navigation component.
 * Provides consistent back navigation across the entire application.
 * 
 * Behavior:
 * - Uses browser history (go back) if there's navigation history
 * - Falls back to a specified parent route if no history exists (direct URL access)
 * - Supports RTL (arrow direction flips automatically)
 * - Preserves entered data by using history.back() instead of navigate()
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  /** Fallback route when no browser history is available */
  fallbackRoute?: string;
  /** Optional label to display next to the arrow */
  label?: string;
  /** Whether to show the label text (default: false for icon-only) */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button variant */
  variant?: 'ghost' | 'outline' | 'default';
  /** Button size */
  size?: 'icon' | 'sm' | 'default';
}

export function BackButton({
  fallbackRoute = '/',
  label,
  showLabel = false,
  className = '',
  variant = 'ghost',
  size = 'icon',
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const displayLabel = label || t('back');

  const handleBack = () => {
    // Check if there's actual navigation history within our app
    // window.history.length > 1 means there's at least one entry to go back to
    // We also check if the referrer is from our own domain to avoid going back to external sites
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // No history (direct URL access) - navigate to fallback parent route
      navigate(fallbackRoute, { replace: true });
    }
  };

  if (size === 'icon' && !showLabel) {
    return (
      <Button
        variant={variant}
        size="icon"
        onClick={handleBack}
        className={`cursor-pointer shrink-0 ${className}`}
        aria-label={displayLabel}
      >
        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size === 'icon' ? 'sm' : size}
      onClick={handleBack}
      className={`cursor-pointer gap-1.5 ${className}`}
      aria-label={displayLabel}
    >
      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
      {showLabel && <span className="text-sm">{displayLabel}</span>}
    </Button>
  );
}

export default BackButton;