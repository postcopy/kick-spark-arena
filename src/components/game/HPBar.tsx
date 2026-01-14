import { cn } from '@/lib/utils';
import type { Side } from '@/types/game';

interface HPBarProps {
  hp: number;
  maxHP: number;
  side: Side;
  showDamage?: number | null;
  isFlashing?: boolean;
}

export function HPBar({ hp, maxHP, side, showDamage, isFlashing }: HPBarProps) {
  const percentage = Math.max(0, (hp / maxHP) * 100);
  
  // Color changes based on HP percentage
  const getHPColor = () => {
    if (percentage > 60) return 'from-green-500 to-green-600';
    if (percentage > 30) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-700';
  };

  const isRed = side === 'red';

  return (
    <div className={cn(
      "relative w-full",
      isRed ? "pr-2" : "pl-2"
    )}>
      {/* HP Label */}
      <div className={cn(
        "flex items-center gap-2 mb-1",
        isRed ? "justify-start" : "justify-end"
      )}>
        <span className={cn(
          "text-sm font-bold uppercase tracking-wider",
          isRed ? "text-game-red" : "text-game-blue"
        )}>
          {isRed ? 'VERMELHO' : 'AZUL'}
        </span>
        <span className="text-xl font-mono font-bold text-foreground">
          {hp}
        </span>
      </div>

      {/* HP Bar Container */}
      <div className={cn(
        "relative h-6 bg-secondary/50 rounded overflow-hidden border-2",
        isRed ? "border-game-red/30" : "border-game-blue/30",
        isFlashing && (isRed ? "animate-pulse bg-game-red/20" : "animate-pulse bg-game-blue/20")
      )}>
        {/* HP Fill */}
        <div
          className={cn(
            "absolute top-0 h-full bg-gradient-to-r transition-all duration-300 ease-out",
            getHPColor(),
            isRed ? "left-0 rounded-r" : "right-0 rounded-l"
          )}
          style={{ 
            width: `${percentage}%`,
            [isRed ? 'left' : 'right']: 0,
          }}
        />

        {/* Damage indicator */}
        {showDamage && (
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 text-white font-bold text-lg animate-bounce",
            isRed ? "right-4" : "left-4"
          )}>
            -{showDamage}
          </div>
        )}

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
