import { cn } from '@/lib/utils';
import type { Side } from '@/types/game';

interface ComboIndicatorProps {
  side: Side;
  count: number;
}

export function ComboIndicator({ side, count }: ComboIndicatorProps) {
  const isRed = side === 'red';
  
  return (
    <div className={cn(
      "absolute top-1/2 -translate-y-1/2 z-10 animate-bounce",
      isRed ? "left-8" : "right-8"
    )}>
      <div className={cn(
        "px-4 py-2 rounded-lg font-bold text-2xl uppercase tracking-wider",
        "bg-gradient-to-r shadow-lg",
        isRed 
          ? "from-game-red to-red-700 text-white box-glow-red" 
          : "from-game-blue to-blue-700 text-white box-glow-blue"
      )}>
        COMBO <span className="text-3xl">x{count}</span>
      </div>
    </div>
  );
}
