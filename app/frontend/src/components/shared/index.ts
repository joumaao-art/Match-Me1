/**
 * Shared components barrel export.
 */

export { ErrorBoundary } from './ErrorBoundary';
export { PageLayout } from './PageLayout';
export { Sidebar } from './Sidebar';
export type { NavItem } from './Sidebar';
export { EmptyState } from './EmptyState';
export { StatCard } from './StatCard';
export { LoadingSpinner } from './LoadingSpinner';
export { BackButton } from './BackButton';
export { ProfileCompletionCard, ProfileCompletionMini, ProfileStrengthBadge, CandidateProfileStrength, AdminProfileAnalytics, calculateProfileCompletion } from './ProfileCompletion';
export type { ProfileData, ProfileCompletionResult, StrengthLevel, CompletionStatus } from './ProfileCompletion';
export { ScoreBar, ScorePercentage, ScoreLabel, ScoreRow, ScoreBreakdown, CircularScore, ConfidenceIndicator, ComparisonBar, ScoreBadge, TrendIndicator } from './ScoreVisualizationEngine';
export type { ScoreItem, ScoreBarProps, ScorePercentageProps, ScoreLabelProps, ScoreRowProps, ScoreBreakdownProps, CircularScoreProps, ConfidenceIndicatorProps, ComparisonBarProps, ScoreBarVariant, ScoreLayoutMode, ScoreColorState } from './ScoreVisualizationEngine';
export { SwipeFeedbackEngine, useSwipeFeedback } from './SwipeFeedbackEngine';
export type { SwipeFeedbackConfig, SwipeCardItem, SwipeFeedbackEngineProps } from './SwipeFeedbackEngine';