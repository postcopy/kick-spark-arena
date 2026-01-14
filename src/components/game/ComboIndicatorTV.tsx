import { cn } from '@/lib/utils';
import type { Side } from '@/types/game';

interface ComboIndicatorTVProps {
  side: Side;
  count: number;
}

export function ComboIndicatorTV({ side, count }: ComboIndicatorTVProps) {
  const isRed = side === 'red';
  
  return (
    <div className={cn(
      "absolute z-20 animate-combo-pop",
      isRed ? "left-8 top-1/3" : "right-8 top-1/3"
    )}>
      <div className={cn(
        "text-center",
        isRed ? "text-left" : "text-right"
      )}>
        <span className={cn(
          "block font-black uppercase tracking-wider",
          "text-[clamp(32px,3.5vw,48px)]",
          "text-game-yellow drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        )}>
          COMBO
        </span>
        <span className={cn(
          "block font-black leading-none",
          "text-[var(--combo-size)]",
          "text-game-yellow",
          "drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
        )}
        style={{
          textShadow: '0 0 40px hsl(45 100% 50% / 0.5)'
        }}
        >
          x{count}
        </span>
      </div>
    </div>
  );
}
