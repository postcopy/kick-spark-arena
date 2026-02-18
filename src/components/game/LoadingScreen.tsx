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
    <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-700 ${isFadingOut ? 'opacity-0 scale-105' : 'opacity-100'}`}>
      <img src={sfightLogo} alt="S-FIGHT MODO" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center px-6">
        <Progress value={progress} className="h-2 max-w-[500px] w-full bg-white/10" />
        <p className="text-sm text-white/60 font-mono mt-3 uppercase tracking-widest">
          {isComplete
            ? 'Sistema Pronto'
            : `Carregando Sistema... ${Math.round(progress)}%`}
        </p>
      </div>
    </div>
  );
}
