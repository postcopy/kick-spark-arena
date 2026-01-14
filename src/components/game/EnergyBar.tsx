import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { Side } from '@/types/game';

interface EnergyBarProps {
  energy: number;
  maxEnergy: number;
  side: Side;
  isSpecialReady: boolean;
}

export function EnergyBar({ energy, maxEnergy, side, isSpecialReady }: EnergyBarProps) {
  const percentage = (energy / maxEnergy) * 100;
  const isRed = side === 'red';

  return (
    <div className={cn(
      "flex items-center gap-2",
      isRed ? "flex-row" : "flex-row-reverse"
    )}>
      {/* Energy Bar Container */}
      <div className={cn(
        "relative flex-1 h-4 bg-secondary/30 rounded-full overflow-hidden border",
        isSpecialReady 
          ? "border-game-yellow animate-pulse" 
          : (isRed ? "border-game-red/30" : "border-game-blue/30")
      )}>
        {/* Energy Fill */}
        <div
          className={cn(
            "absolute top-0 h-full transition-all duration-150",
            isSpecialReady 
              ? "bg-gradient-to-r from-game-yellow to-yellow-400" 
              : (isRed ? "bg-gradient-to-r from-game-red/70 to-game-red" : "bg-gradient-to-r from-game-blue/70 to-game-blue"),
            isRed ? "left-0 rounded-r-full" : "right-0 rounded-l-full"
          )}
          style={{ 
            width: `${percentage}%`,
          }}
        />

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Special Ready Indicator */}
      {isSpecialReady && (
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded bg-game-yellow/20 border border-game-yellow animate-pulse"
        )}>
          <Zap className="w-4 h-4 text-game-yellow fill-game-yellow" />
          <span className="text-xs font-bold text-game-yellow uppercase">SPECIAL</span>
        </div>
      )}

      {/* Energy value */}
      {!isSpecialReady && (
        <span className="text-sm font-mono text-muted-foreground w-8 text-center">
          {energy}
        </span>
      )}
    </div>
  );
}
