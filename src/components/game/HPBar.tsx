import { cn } from '@/lib/utils';
import type { Side } from '@/types/game';

interface HPBarProps {
  hp: number;
  maxHP: number;
  side: Side;
  playerName?: string;
  showDamage?: number | null;
  isFlashing?: boolean;
  roundWins?: number;
  bestOf?: number;
}

export function HPBar({ 
  hp, 
  maxHP, 
  side, 
  playerName,
  showDamage, 
  isFlashing,
  roundWins = 0,
  bestOf = 3,
}: HPBarProps) {
  const percentage = Math.max(0, (hp / maxHP) * 100);
  const isRed = side === 'red';
  const isCritical = percentage <= 25;
  const isLow = percentage <= 50;

  const displayName = playerName || (isRed ? 'VERMELHO' : 'AZUL');
  const roundsToShow = Math.ceil(bestOf / 2);

  return (
    <div className={cn(
      "relative w-full",
      isFlashing && "animate-damage-shake"
    )}>
      {/* Player Name + Round Wins Row */}
      <div className={cn(
        "flex items-center gap-3 mb-2",
        isRed ? "flex-row" : "flex-row-reverse"
      )}>
        {/* Player Name */}
        <span className={cn(
          "text-lg font-black uppercase tracking-wide",
          isRed ? "text-game-red" : "text-game-blue"
        )}>
          {displayName}
        </span>

        {/* Round Win Indicators */}
        <div className={cn(
          "flex gap-1.5",
          isRed ? "flex-row" : "flex-row-reverse"
        )}>
          {Array.from({ length: roundsToShow }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full border-2 transition-all",
                i < roundWins
                  ? isRed 
                    ? "bg-game-red border-game-red shadow-[0_0_8px_hsl(var(--game-red-glow)/0.6)]" 
                    : "bg-game-blue border-game-blue shadow-[0_0_8px_hsl(var(--game-blue-glow)/0.6)]"
                  : "bg-transparent border-muted-foreground/40"
              )}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* HP Value */}
        <div className={cn(
          "px-3 py-1 rounded font-mono font-black text-2xl min-w-[70px] text-center",
          "bg-secondary/80 border-2",
          isRed ? "border-game-red/50" : "border-game-blue/50",
          isCritical && "animate-hp-critical"
        )}>
          <span className={cn(
            isCritical ? "text-destructive" : isLow ? "text-yellow-500" : "text-foreground"
          )}>
            {hp}
          </span>
        </div>
      </div>

      {/* HP Bar Container with angled design */}
      <div className={cn(
        "relative h-7 overflow-hidden border-2 transition-all",
        isRed 
          ? "border-game-red/60 rounded-r-lg rounded-l-sm" 
          : "border-game-blue/60 rounded-l-lg rounded-r-sm",
        isFlashing && (isRed ? "border-game-red" : "border-game-blue"),
        isCritical && "border-destructive"
      )}
      style={{
        clipPath: isRed 
          ? 'polygon(0 0, 100% 0, 98% 100%, 0% 100%)' 
          : 'polygon(2% 0, 100% 0, 100% 100%, 0% 100%)'
      }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-secondary/60" />

        {/* HP Fill with gradient */}
        <div
          className={cn(
            "absolute top-0 h-full transition-all duration-200 ease-out",
            isCritical 
              ? "bg-gradient-to-r from-red-700 via-red-600 to-red-500" 
              : isLow 
                ? "bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-500"
                : isRed 
                  ? "bg-gradient-to-r from-red-800 via-game-red to-red-500" 
                  : "bg-gradient-to-r from-blue-800 via-game-blue to-blue-400",
          )}
          style={{ 
            width: `${percentage}%`,
            [isRed ? 'left' : 'right']: 0,
          }}
        />

        {/* Inner glow overlay */}
        <div 
          className={cn(
            "absolute top-0 h-1/2 transition-all duration-200",
            "bg-gradient-to-b from-white/30 to-transparent"
          )}
          style={{ 
            width: `${percentage}%`,
            [isRed ? 'left' : 'right']: 0,
          }}
        />

        {/* Edge highlight */}
        <div className={cn(
          "absolute top-0 bottom-0 w-1",
          isRed ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r",
          "from-white/20 to-transparent"
        )} />

        {/* Damage indicator */}
        {showDamage && (
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 font-black text-xl animate-bounce",
            "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
            isRed ? "right-4" : "left-4"
          )}>
            -{showDamage}
          </div>
        )}
      </div>
    </div>
  );
}
