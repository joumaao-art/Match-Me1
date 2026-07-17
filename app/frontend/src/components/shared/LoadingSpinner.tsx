/**
 * Reusable loading spinner component.
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeMap[size]}`} />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;