import { useEffect, useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';

interface CountdownScreenProps {
  countdown: number;
  onMusicStarted?: (audio: HTMLAudioElement) => void;
  shouldStartMusic?: boolean;
  onBack?: () => void;
}

export function CountdownScreen({ countdown, onMusicStarted, shouldStartMusic = true, onBack }: CountdownScreenProps) {
  const [animationKey, setAnimationKey] = useState(countdown);
  const { playWithRef } = useSound();
  const hasStartedMusicRef = useRef(false);

  useEffect(() => {
    setAnimationKey(countdown);
    
    // Start background music at countdown 6 (music has 3s intro before narrated countdown)
    // Only start if shouldStartMusic is true (new round)
    if (countdown === 6 && !hasStartedMusicRef.current && shouldStartMusic) {
      hasStartedMusicRef.current = true;
      const audio = playWithRef('fightModeBg', 0.6);
      if (audio && onMusicStarted) {
        onMusicStarted(audio);
      }
    }
  }, [countdown, playWithRef, onMusicStarted, shouldStartMusic]);

  // Reset the ref when shouldStartMusic changes to true (new round)
  useEffect(() => {
    if (shouldStartMusic) {
      hasStartedMusicRef.current = false;
    }
  }, [shouldStartMusic]);

  // Intro phase (6, 5, 4) vs countdown phase (3, 2, 1, 0)
  const isIntroPhase = countdown > 3;
  const isFight = countdown === 0;
  
  const displayText = isIntroPhase 
    ? 'VAI COMEÇAR!' 
    : isFight 
      ? 'FIGHT!' 
      : countdown.toString();

  return (
    <div className="flex items-center justify-center h-full w-full bg-background overflow-hidden relative">
      {/* Back button */}
      {onBack && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="absolute top-4 left-4 p-3 rounded-xl bg-black/50 text-white/70 hover:bg-black/70 hover:text-white transition-all z-20"
          aria-label="Voltar ao menu"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Side panels preview */}
      <div className="absolute inset-0 flex pointer-events-none opacity-30">
        <div className="flex-1 bg-game-red/10 border-l-4 border-game-red" />
        <div className="flex-1 bg-game-blue/10 border-r-4 border-game-blue" />
      </div>

      {/* Countdown display */}
      <div
        key={animationKey}
        className={cn(
          'relative z-10 font-bold animate-countdown-pop',
          isIntroPhase 
            ? 'text-6xl md:text-8xl text-muted-foreground animate-pulse' 
            : isFight 
              ? 'text-[clamp(8rem,25vmin,20rem)] text-game-yellow text-glow-yellow' 
              : 'text-[clamp(8rem,25vmin,20rem)] text-foreground'
        )}
      >
        {displayText}
      </div>
    </div>
  );
}
