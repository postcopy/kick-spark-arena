import { useEffect, useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';

interface CountdownScreenProps {
  countdown: number;
  onMusicStarted?: (audio: HTMLAudioElement) => void;
  shouldStartMusic?: boolean;
  /** Which bg music track to play. Defaults to 'fightModeBg' for backwards compat */
  bgMusicName?: 'fightModeBg' | 'bgTimeAttack' | 'bgArcade' | 'bgReaction';
  onBack?: () => void;
}

const getCountdownStyle = (n: number) => {
  if (n === 3) return 'text-red-400';
  if (n === 2) return 'text-yellow-400';
  if (n === 1) return 'text-green-400';
  return 'text-white';
};

const getCountdownGlow = (n: number) => {
  if (n === 3) return '0 0 60px rgba(239,68,68,0.4)';
  if (n === 2) return '0 0 60px rgba(250,204,21,0.4)';
  if (n === 1) return '0 0 60px rgba(34,197,94,0.4)';
  return '0 0 60px rgba(255,255,255,0.3)';
};

const getCountdownRingColor = (n: number) => {
  if (n === 3) return 'text-red-400';
  if (n === 2) return 'text-yellow-400';
  if (n === 1) return 'text-green-400';
  return 'text-white';
};

export function CountdownScreen({ countdown, onMusicStarted, shouldStartMusic = true, bgMusicName = 'fightModeBg', onBack }: CountdownScreenProps) {
  const [animationKey, setAnimationKey] = useState(countdown);
  const { playWithRef } = useSound();
  const hasStartedMusicRef = useRef(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    // Start music BEFORE visual update to eliminate perceived latency
    if (countdown === 6 && !hasStartedMusicRef.current && shouldStartMusic) {
      hasStartedMusicRef.current = true;
      const audio = playWithRef(bgMusicName, 0.6);
      if (audio && onMusicStarted) {
        onMusicStarted(audio);
      }
    }

    // Trigger flash on FIGHT!
    if (countdown === 0) {
      setShowFlash(true);
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
  const isNumberPhase = !isIntroPhase && !isFight;

  return (
    <div className="flex items-center justify-center h-full w-full bg-[#0A0A0F] overflow-hidden relative">
      {/* Screen flash on FIGHT */}
      {showFlash && <div className="screen-flash" />}

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] pointer-events-none"
        style={{
          background: isFight
            ? 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)'
            : isIntroPhase
              ? 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)'
              : 'radial-gradient(circle, rgba(225,29,72,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Back button */}
      {onBack && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="absolute top-4 left-4 p-3 rounded-xl text-white/20 hover:text-white/50 transition-all z-20"
          aria-label="Voltar ao menu"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Side panels preview — subtle hint */}
      <div className="absolute inset-0 flex pointer-events-none opacity-[0.06]">
        <div className="flex-1 bg-gradient-to-r from-red-500/20 to-transparent" />
        <div className="flex-1 bg-gradient-to-l from-blue-500/20 to-transparent" />
      </div>

      {/* Countdown display with shake on number ticks */}
      <div
        key={animationKey}
        className={cn(
          "relative z-10 flex flex-col items-center justify-center",
          isNumberPhase && "animate-countdown-shake"
        )}
      >
        {isIntroPhase ? (
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <span className="font-mono text-[10px] text-cyan-400/40 uppercase tracking-[0.4em]">Sistema Pronto</span>
            <h1
              className="font-display font-black text-cyan-400 uppercase tracking-tight"
              style={{
                fontSize: 'clamp(2.5rem, 7vmin, 4.5rem)',
                textShadow: '0 0 40px rgba(6,182,212,0.3)'
              }}
            >
              PREPARAR
            </h1>
          </div>
        ) : isFight ? (
          <h1
            className="font-display font-black tracking-tight text-white animate-fight-entrance"
            style={{
              fontSize: 'clamp(6rem, 25vmin, 16rem)',
              textShadow: '0 0 80px rgba(255,255,255,0.4)'
            }}
          >
            FIGHT!
          </h1>
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Expanding ring behind number */}
            <div className={cn("countdown-ring", getCountdownRingColor(countdown))} />

            <h1
              className={cn('font-display font-black animate-countdown-pop', getCountdownStyle(countdown))}
              style={{
                fontSize: 'clamp(10rem, 40vmin, 25rem)',
                textShadow: getCountdownGlow(countdown),
              }}
            >
              {countdown}
            </h1>
          </div>
        )}
      </div>
    </div>
  );
}
