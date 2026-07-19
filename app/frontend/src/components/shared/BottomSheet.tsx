import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================
// BottomSheet — Reusable Experience Engine Component
// ============================================================
// Platform standard for Level 2 content display.
// Features: swipe-to-close, drag handle, smooth animations,
// RTL support, dark mode, accessibility, responsive.
// ============================================================

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Height as percentage of viewport (0-100). Default: 85 */
  maxHeight?: number;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Snap points as percentages [collapsed, expanded] */
  snapPoints?: [number, number];
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  maxHeight = 85,
  showCloseButton = true,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const y = useMotionValue(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 300 || info.offset.y > 150) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background rounded-t-2xl shadow-2xl border-t border-border overflow-hidden"
            style={{ maxHeight: `${maxHeight}vh`, y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-label={title || t('details')}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <h3 className="text-base font-semibold font-[Poppins] truncate">
                  {title}
                </h3>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer h-8 w-8 shrink-0"
                    onClick={onClose}
                    aria-label={t('close')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-3">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;