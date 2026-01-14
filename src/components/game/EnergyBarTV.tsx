import { cn } from '@/lib/utils';
import type { Side } from '@/types/game';

interface EnergyBarTVProps {
  energy: number;
  maxEnergy: number;
  side: Side;
  isSpecialReady: boolean;
}

export function EnergyBarTV({ energy, maxEnergy, side, isSpecialReady }: EnergyBarTVProps) {
  const percentage = (energy / maxEnergy) * 100;
  const isRed = side === 'red';

  return (
    <div className={cn(
      "flex flex-col gap-1",
      isRed ? "items-start" : "items-end"
    )}>
      {/* Minimal label */}
      <span className={cn(
        "text-xs font-bold uppercase tracking-widest",
        isRed ? "text-game-red/60" : "text-game-blue/60"
      )}>
        ENERGIA
      </span>

      {/* Thin energy bar */}
      <div className={cn(
        "w-full rounded-full overflow-hidden transition-all",
        "h-[var(--energy-bar-height)]",
        isSpecialReady 
          ? "ring-2 ring-game-yellow/60" 
          : "bg-secondary/30"
      )}>
        <div
          className={cn(
            "h-full transition-all duration-150 rounded-full",
            isSpecialReady 
              ? "bg-gradient-to-r from-yellow-600 via-game-yellow to-yellow-400" 
              : isRed 
                ? "bg-game-red/60" 
                : "bg-game-blue/60"
          )}
          style={{ 
            width: `${percentage}%`,
            marginLeft: isRed ? 0 : 'auto',
            marginRight: isRed ? 'auto' : 0,
          }}
        />
      </div>
    </div>
  );
}
