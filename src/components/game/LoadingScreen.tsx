import { useEffect, useState, useRef } from 'react';
import { useSound } from '@/contexts/SoundContext';
import { Progress } from '@/components/ui/progress';
import sfightLogo from '@/assets/S-FIGHT-MODO.jpg';

interface LoadingScreenProps {
  onReady: () => void;
  skipBgMusic?: boolean;
}

export function LoadingScreen({ onReady, skipBgMusic = false }: LoadingScreenProps) {
  const { waitForAudioReady, getAudioProgress, unlockAudio, initFullPreload } = useSound();
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasStartedRef = useRef(false);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    unlockAudio();
    initFullPreload();

    const requiredSounds = skipBgMusic 
      ? ['hit', 'hitHeavy', 'countdown3'] as const
      : ['fightModeBg', 'hit', 'hitHeavy', 'countdown3'] as const;

    progressIntervalRef.current = window.setInterval(() => {
      const currentProgress = getAudioProgress(requiredSounds as any);
      setProgress(currentProgress);
    }, 100);

    waitForAudioReady(requiredSounds as any, 5000).then(() => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);
      setIsComplete(true);
    });

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [waitForAudioReady, getAudioProgress, unlockAudio, initFullPreload, skipBgMusic, onReady]);

  // Fade-out + scale-up transition then call onReady
  useEffect(() => {
    if (isComplete && !isFadingOut) {
      setIsFadingOut(true);
      setTimeout(() => onReady(), 700);
    }
  }, [isComplete, isFadingOut, onReady]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#0b1120] relative overflow-hidden">
      {/* Logo with glow / fade-out */}
      <div className={`flex flex-col items-center gap-6 transition-all duration-700 ${isFadingOut ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
        <img
          src={sfightLogo}
          alt="S-FIGHT MODO"
          className="w-full max-w-[500px] px-4"
          style={!isComplete ? { animation: 'logo-glow 2s ease-in-out infinite' } : undefined}
        />

        {/* Thin progress bar */}
        <div className="w-full max-w-[400px] px-4 space-y-2">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-center text-white/40 font-mono">
            {isComplete
              ? 'Pronto!'
              : progress < 50
                ? 'Baixando música de fundo...'
                : progress < 75
                  ? 'Finalizando download...'
                  : 'Decodificando áudio...'}
          </p>
        </div>
      </div>
    </div>
  );
}
