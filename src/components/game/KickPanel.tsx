import { cn } from '@/lib/utils';
import type { Side } from '@/types/game';

interface KickPanelProps {
  side: Side;
  score: number;
  isFlashing: boolean;
  showControls?: boolean;
}

export function KickPanel({ side, score, isFlashing, showControls = true }: KickPanelProps) {
  const isRed = side === 'red';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center h-full p-8 transition-all duration-100',
        isRed ? 'bg-game-red/10' : 'bg-game-blue/10',
        isFlashing && (isRed ? 'flash-red' : 'flash-blue')
      )}
    >
      {/* Side border accent */}
      <div
        className={cn(
          'absolute top-0 h-full w-2',
          isRed ? 'left-0 bg-game-red' : 'right-0 bg-game-blue'
        )}
      />

      {/* Glow effect */}
      <div
        className={cn(
          'absolute inset-0 opacity-20',
          isRed ? 'bg-gradient-to-r from-game-red/30 to-transparent' : 'bg-gradient-to-l from-game-blue/30 to-transparent'
        )}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Team label */}
        <span
          className={cn(
            'text-2xl font-bold uppercase tracking-[0.3em] mb-4',
            isRed ? 'text-game-red' : 'text-game-blue'
          )}
        >
          {isRed ? 'RED' : 'BLUE'}
        </span>

        {/* Score */}
        <div
          className={cn(
            'text-[12rem] font-bold leading-none tabular-nums',
            isRed ? 'text-game-red text-glow-red' : 'text-game-blue text-glow-blue'
          )}
        >
          {score}
        </div>

        {/* Label */}
        <span className="text-3xl font-semibold text-foreground/70 uppercase tracking-widest mt-4">
          CHUTES
        </span>

        {/* Key hint */}
        {showControls && (
          <div
            className={cn(
              'mt-8 px-6 py-3 rounded border-2',
              isRed
                ? 'border-game-red/50 bg-game-red/10 text-game-red'
                : 'border-game-blue/50 bg-game-blue/10 text-game-blue'
            )}
          >
            <span className="text-xl font-mono font-bold">
              Press {isRed ? 'A' : 'L'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
