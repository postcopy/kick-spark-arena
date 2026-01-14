import { cn } from '@/lib/utils';

interface RhythmBarProps {
  percentage: number; // 0 to 1
  isOnPace: boolean;
}

export function RhythmBar({ percentage, isOnPace }: RhythmBarProps) {
  const cappedPercentage = Math.min(percentage, 1);

  return (
    <div className="relative w-full h-10 bg-black/40 rounded-full overflow-hidden border border-white/20">
      {/* Progress fill */}
      <div
        className={cn(
          'h-full transition-all duration-200 rounded-full',
          isOnPace
            ? 'bg-gradient-to-r from-green-500 to-green-400 animate-pulse'
            : cappedPercentage >= 0.6
            ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
            : 'bg-gradient-to-r from-red-500 to-red-400'
        )}
        style={{ width: `${cappedPercentage * 100}%` }}
      />

      {/* Target line indicator at 100% */}
      <div className="absolute top-0 bottom-0 right-0 w-1 bg-white/80" />

      {/* Glow effect when on pace */}
      {isOnPace && (
        <div className="absolute inset-0 bg-green-400/20 animate-pulse rounded-full" />
      )}
    </div>
  );
}
