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
      "flex items-center gap-3",
      isRed ? "flex-row" : "flex-row-reverse"
    )}>
      {/* Energy Bar Container */}
      <div className={cn(
        "relative flex-1 h-5 bg-secondary/40 rounded-full overflow-hidden border-2 transition-all",
        isSpecialReady 
          ? "border-game-yellow animate-special-glow" 
          : (isRed ? "border-game-red/40" : "border-game-blue/40")
      )}>
        {/* Energy Fill */}
        <div
          className={cn(
            "absolute top-0 h-full transition-all duration-150",
            isSpecialReady 
              ? "bg-gradient-to-r from-yellow-600 via-game-yellow to-yellow-400" 
              : (isRed 
                  ? "bg-gradient-to-r from-red-900 via-game-red/80 to-game-red" 
                  : "bg-gradient-to-r from-blue-900 via-game-blue/80 to-game-blue"),
            isRed ? "left-0 rounded-r-full" : "right-0 rounded-l-full"
          )}
          style={{ 
            width: `${percentage}%`,
          }}
        />

        {/* Shine effect */}
        <div 
          className="absolute top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"
          style={{ 
            width: `${percentage}%`,
            [isRed ? 'left' : 'right']: 0,
          }}
        />

        {/* Energy segments */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 border-r border-black/20 last:border-r-0" 
            />
          ))}
        </div>
      </div>

      {/* Special Ready Indicator */}
      {isSpecialReady ? (
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-sm uppercase tracking-wide",
          "bg-gradient-to-r from-yellow-600 to-game-yellow text-black",
          "border-2 border-yellow-400",
          "animate-special-glow"
        )}>
          <Zap className="w-4 h-4 fill-current" />
          <span>ESPECIAL</span>
          <Zap className="w-4 h-4 fill-current" />
        </div>
      ) : (
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded min-w-[60px] justify-center",
          "bg-secondary/40 border border-border"
        )}>
          <Zap className={cn(
            "w-4 h-4",
            isRed ? "text-game-red/60" : "text-game-blue/60"
          )} />
          <span className="text-sm font-mono font-bold text-muted-foreground">
            {energy}
          </span>
        </div>
      )}
    </div>
  );
}
