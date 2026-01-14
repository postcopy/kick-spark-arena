import { cn } from '@/lib/utils';
import type { Side } from '@/types/game';

interface HPBarTVProps {
  hp: number;
  maxHP: number;
  side: Side;
  showDamage?: number | null;
  isFlashing?: boolean;
}

export function HPBarTV({ hp, maxHP, side, showDamage, isFlashing }: HPBarTVProps) {
  const percentage = Math.max(0, (hp / maxHP) * 100);
  const isRed = side === 'red';
  const isCritical = percentage <= 25;

  return (
    <div className={cn(
      "relative w-full",
      isFlashing && "animate-damage-shake-tv"
    )}>
      {/* HP Bar Container */}
      <div className={cn(
        "relative overflow-hidden rounded transition-all",
        "h-[var(--hp-bar-height)]",
        isCritical && "animate-hp-critical"
      )}>
        {/* Background */}
        <div className="absolute inset-0 bg-secondary/60" />

        {/* HP Fill with gradient */}
        <div
          className={cn(
            "absolute top-0 h-full transition-all duration-200 ease-out",
            isCritical 
              ? "bg-gradient-to-r from-red-700 via-red-600 to-red-500" 
              : isRed 
                ? "bg-gradient-to-r from-red-800 via-game-red to-red-500" 
                : "bg-gradient-to-l from-blue-800 via-game-blue to-blue-400",
          )}
          style={{ 
            width: `${percentage}%`,
            [isRed ? 'left' : 'right']: 0,
          }}
        />

        {/* Inner glow overlay */}
        <div 
          className={cn(
            "absolute top-0 h-1/3 transition-all duration-200",
            "bg-gradient-to-b from-white/25 to-transparent"
          )}
          style={{ 
            width: `${percentage}%`,
            [isRed ? 'left' : 'right']: 0,
          }}
        />
      </div>

      {/* Damage number popup */}
      {showDamage && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 font-black animate-damage-popup z-10",
          "text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]",
          "text-[clamp(48px,5vw,72px)]",
          isRed ? "right-4" : "left-4"
        )}>
          -{showDamage}
        </div>
      )}

      {/* Flash overlay */}
      {isFlashing && (
        <div className={cn(
          "absolute inset-0 rounded animate-flash-side",
          isRed ? "bg-game-red/40" : "bg-game-blue/40"
        )} />
      )}
    </div>
  );
}
