import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownScreenProps {
  countdown: number;
}

export function CountdownScreen({ countdown }: CountdownScreenProps) {
  const [animationKey, setAnimationKey] = useState(countdown);

  useEffect(() => {
    setAnimationKey(countdown);
  }, [countdown]);

  const displayText = countdown === 0 ? 'GO!' : countdown.toString();
  const isGo = countdown === 0;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Side panels preview */}
      <div className="absolute inset-0 flex pointer-events-none opacity-30">
        <div className="flex-1 bg-game-red/10 border-l-4 border-game-red" />
        <div className="flex-1 bg-game-blue/10 border-r-4 border-game-blue" />
      </div>

      {/* Countdown number */}
      <div
        key={animationKey}
        className={cn(
          'relative z-10 text-[20rem] font-bold animate-countdown-pop',
          isGo ? 'text-game-yellow text-glow-yellow' : 'text-foreground'
        )}
      >
        {displayText}
      </div>
    </div>
  );
}
