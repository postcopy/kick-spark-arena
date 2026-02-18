import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';

interface CountdownScreenProps {
  countdown: number;
  onMusicStarted?: (audio: HTMLAudioElement) => void;
  shouldStartMusic?: boolean;
  onBack?: () => void;
}

const getCountdownStyle = (n: number) => {
  if (n === 3) return 'text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.6)]';
  if (n === 2) return 'text-yellow-400 drop-shadow-[0_0_35px_rgba(250,204,21,0.6)]';
  if (n === 1) return 'text-green-500 drop-shadow-[0_0_35px_rgba(34,197,94,0.6)]';
  return 'text-white';
};

export function CountdownScreen({ countdown, onMusicStarted, shouldStartMusic = true, onBack }: CountdownScreenProps) {
  const [animationKey, setAnimationKey] = useState(countdown);
  const { playWithRef } = useSound();
  const hasStartedMusicRef = useRef(false);

  useEffect(() => {
    // Start music BEFORE visual update to eliminate perceived latency
    if (countdown === 6 && !hasStartedMusicRef.current && shouldStartMusic) {
      hasStartedMusicRef.current = true;
      // Fire play synchronously before React commits the visual render
      const audio = playWithRef('fightModeBg', 0.6);
      if (audio && onMusicStarted) {
        onMusicStarted(audio);
      }
    }

    setAnimationKey(countdown);
  }, [countdown, playWithRef, onMusicStarted, shouldStartMusic]);

  useEffect(() => {
    if (shouldStartMusic) {
      hasStartedMusicRef.current = false;
    }
  }, [shouldStartMusic]);

  const isIntroPhase = countdown > 3;
  const isFight = countdown === 0;

  return (
    <div className="flex items-center justify-center h-full w-full bg-[#0b1120] overflow-hidden relative">
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent_70%)]" />

      {/* Back button */}
      {onBack && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="absolute top-4 left-4 p-3 rounded-xl bg-transparent text-white/30 hover:text-white/70 transition-all z-20"
          aria-label="Voltar ao menu"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Side panels preview */}
      <div className="absolute inset-0 flex pointer-events-none opacity-15">
        <div className="flex-1 bg-game-red/10 border-l-4 border-game-red" />
        <div className="flex-1 bg-game-blue/10 border-r-4 border-game-blue" />
      </div>

      {/* Countdown display */}
      <div key={animationKey} className="relative z-10 flex flex-col items-center justify-center">
        {isIntroPhase ? (
          <div className="flex flex-col items-center animate-pulse">
            <AlertTriangle className="text-cyan-400 mb-4" style={{ width: 'clamp(3rem, 8vmin, 5rem)', height: 'clamp(3rem, 8vmin, 5rem)' }} />
            <h1 className="font-mono tracking-[0.3em] text-cyan-400 uppercase" style={{ fontSize: 'clamp(2rem, 6vmin, 4rem)' }}>
              PREPARAR
            </h1>
          </div>
        ) : isFight ? (
          <h1
            className="font-black italic tracking-tighter text-white animate-countdown-pop drop-shadow-[0_0_60px_rgba(255,255,255,0.8)]"
            style={{ fontSize: 'clamp(6rem, 25vmin, 16rem)' }}
          >
            FIGHT!
          </h1>
        ) : (
          <h1
            className={cn('font-black animate-countdown-pop', getCountdownStyle(countdown))}
            style={{ fontSize: 'clamp(10rem, 40vmin, 25rem)' }}
          >
            {countdown}
          </h1>
        )}
      </div>
    </div>
  );
}
