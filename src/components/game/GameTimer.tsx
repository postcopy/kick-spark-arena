import { cn } from '@/lib/utils';

interface GameTimerProps {
  timeLeft: number;
  isPaused?: boolean;
}

export function GameTimer({ timeLeft, isPaused = false }: GameTimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 10;

  return (
    <div className="flex flex-col items-center">
      {/* Timer display */}
      <div
        className={cn(
          'text-[8rem] font-bold tabular-nums leading-none transition-colors',
          isLow ? 'text-game-red text-glow-red animate-pulse-glow' : 'text-game-yellow text-glow-yellow'
        )}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>

      {/* Paused indicator */}
      {isPaused && (
        <div className="mt-4 px-6 py-2 bg-game-yellow/20 border border-game-yellow/50 rounded">
          <span className="text-xl font-semibold text-game-yellow uppercase tracking-wider">
            PAUSADO
          </span>
        </div>
      )}
    </div>
  );
}
