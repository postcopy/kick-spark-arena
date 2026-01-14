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
      "absolute top-1/2 -translate-y-1/2 z-10 animate-combo-pop",
      isRed ? "left-12" : "right-12"
    )}>
      {/* Spark effects */}
      <div className="absolute inset-0 -z-10">
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-2xl animate-spark",
          "delay-0"
        )}>✨</div>
        <div className={cn(
          "absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 text-xl animate-spark",
          "delay-75"
        )} style={{ animationDelay: '0.1s' }}>⚡</div>
        <div className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-2xl animate-spark",
          "delay-150"
        )} style={{ animationDelay: '0.15s' }}>✨</div>
        <div className={cn(
          "absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2 text-xl animate-spark",
        )} style={{ animationDelay: '0.05s' }}>⚡</div>
      </div>

      {/* Main combo box */}
      <div className={cn(
        "relative px-5 py-3 rounded-lg font-black uppercase tracking-wider",
        "border-2 shadow-2xl",
        "bg-gradient-to-br from-yellow-500 via-game-yellow to-orange-500",
        "border-yellow-300",
        "text-black",
        "box-glow-gold"
      )}>
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/10 to-white/30 pointer-events-none" />
        
        {/* Text */}
        <div className="relative flex items-center gap-2">
          <span className="text-xl drop-shadow-sm">COMBO</span>
          <span className={cn(
            "text-4xl font-black",
            "text-gradient-gold",
            "drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]"
          )}
          style={{
            WebkitTextStroke: '1px rgba(0,0,0,0.2)',
          }}
          >
            x{count}
          </span>
        </div>
      </div>
    </div>
  );
}
