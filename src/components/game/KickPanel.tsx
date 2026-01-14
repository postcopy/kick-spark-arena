import { cn } from '@/lib/utils';
import { ProgressArc } from './ProgressArc';
import type { Side } from '@/types/game';

interface KickPanelProps {
  side: Side;
  score: number;
  isFlashing: boolean;
  showControls?: boolean;
  percentage?: number;
}

export function KickPanel({ side, score, isFlashing, showControls = true, percentage = 0 }: KickPanelProps) {
  const isRed = side === 'red';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center h-full transition-all duration-100',
        isRed ? 'bg-[#E10000]' : 'bg-[#0066FF]',
        isFlashing && 'brightness-150'
      )}
    >
      {/* Flash overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-white pointer-events-none transition-opacity duration-100',
          isFlashing ? 'opacity-30' : 'opacity-0'
        )}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Progress Arc with Score inside */}
        <div className="relative w-72 h-72">
          <ProgressArc percentage={percentage} side={side} />
          
          {/* Centered content inside arc */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Score */}
            <div className="text-[10rem] font-bold leading-none tabular-nums text-white">
              {score}
            </div>

            {/* Label */}
            <span className="text-2xl font-semibold text-white/70 uppercase tracking-widest -mt-2">
              PONTOS
            </span>

            {/* Percentage */}
            <span className="text-3xl font-bold text-[#FFD700] mt-2">
              {percentage.toFixed(1).replace('.', ',')}%
            </span>
          </div>
        </div>

        {/* Key hint */}
        {showControls && (
          <div className="mt-8 px-6 py-3 rounded-lg bg-white/10 border border-white/20">
            <span className="text-xl font-mono font-bold text-white/80">
              Press {isRed ? 'A' : 'L'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
