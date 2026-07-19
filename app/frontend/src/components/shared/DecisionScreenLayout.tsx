import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// ============================================================
// DecisionScreenLayout — Experience Engine Standard
// ============================================================
// Reusable layout for all decision-based screens.
// Guarantees: No scrolling on mobile. All elements visible in one viewport.
// Uses CSS flexbox with dynamic height distribution.
//
// Layout stack (mobile):
//   [Header]           — shrink-0, compact
//   [Summary Chips]    — shrink-0, single row
//   [Decision Card]    — flex-1, fills ALL remaining space
//   [Action Bar]       — shrink-0, thumb-friendly
//
// The card area dynamically expands/shrinks based on available viewport.
// Bottom Navigation (56px / h-14) is handled by the parent (JobSeeker.tsx).
// ============================================================

export interface DecisionScreenLayoutProps {
  /** Compact header content (title + badge) */
  header: ReactNode;
  /** Single-row summary chips */
  summaryChips?: ReactNode;
  /** The swipeable decision card area — gets flex-1 */
  card: ReactNode;
  /** Primary action buttons (Like/Pass) */
  actions: ReactNode;
  /** Optional overlay content (match celebration, etc.) */
  overlay?: ReactNode;
}

export function DecisionScreenLayout({
  header,
  summaryChips,
  card,
  actions,
  overlay,
}: DecisionScreenLayoutProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Desktop: standard layout with max-width constraint, scrollable
    return (
      <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        <div className="mb-3">{header}</div>
        {summaryChips && <div className="mb-3">{summaryChips}</div>}
        <div className="flex-1 relative min-h-[400px]">{card}</div>
        <div className="py-4">{actions}</div>
        {overlay}
      </div>
    );
  }

  // Mobile: Full viewport layout — ZERO scrolling
  // Height = 100dvh - 56px (bottom nav) - safe-area-inset-bottom
  return (
    <div
      className="flex flex-col w-full overflow-hidden"
      style={{
        height: 'calc(100dvh - 56px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Header — shrink-0, compact */}
      <div className="shrink-0 px-3 pt-2 pb-0.5">{header}</div>

      {/* Summary Chips — shrink-0, single row */}
      {summaryChips && (
        <div className="shrink-0 px-3 pb-1">{summaryChips}</div>
      )}

      {/* Decision Card — flex-1, fills ALL remaining vertical space */}
      <div className="flex-1 relative min-h-0 px-2 py-1">{card}</div>

      {/* Primary Actions — shrink-0, always visible, never clipped */}
      <div className="shrink-0 px-3 py-2">{actions}</div>

      {/* Overlay */}
      {overlay}
    </div>
  );
}

export default DecisionScreenLayout;