import { useEffect, useState, useRef } from 'react';
import { Music, Loader2 } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  onReady: () => void;
  skipBgMusic?: boolean; // For reaction mode that doesn't use background music
}

export function LoadingScreen({ onReady, skipBgMusic = false }: LoadingScreenProps) {
  const { waitForAudioReady, getAudioProgress, unlockAudio, initFullPreload } = useSound();
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasStartedRef = useRef(false);
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Ensure audio is unlocked and preloading
    unlockAudio();
    initFullPreload();

    // Define which sounds to wait for based on mode
    const requiredSounds = skipBgMusic 
      ? ['hit', 'hitHeavy', 'countdown3'] as const
      : ['fightModeBg', 'hit', 'hitHeavy', 'countdown3'] as const;

    // Start polling for progress
    progressIntervalRef.current = window.setInterval(() => {
      const currentProgress = getAudioProgress(requiredSounds as any);
      setProgress(currentProgress);
    }, 100);

    // Wait for audio to be ready
    waitForAudioReady(requiredSounds as any, 5000).then(({ ready, progress: finalProgress }) => {
      // Clear progress interval
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setProgress(100);
      setIsComplete(true);

      // Small delay for visual feedback before proceeding
      setTimeout(() => {
        onReady();
      }, 300);
    });

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [waitForAudioReady, getAudioProgress, unlockAudio, initFullPreload, skipBgMusic, onReady]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background p-8">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {/* Icon */}
        <div className={cn(
          "p-6 rounded-full transition-all duration-300",
          isComplete ? "bg-green-500/20" : "bg-game-yellow/20"
        )}>
          {isComplete ? (
            <Music className="w-12 h-12 text-green-500" />
          ) : (
            <Loader2 className="w-12 h-12 text-game-yellow animate-spin" />
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isComplete ? 'Pronto!' : 'Carregando áudio...'}
          </h2>
        <p className="text-muted-foreground">
            {isComplete 
              ? 'Iniciando...' 
              : progress < 50 
                ? 'Baixando música de fundo...'
                : 'Finalizando carregamento...'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-center text-muted-foreground font-mono">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
}
