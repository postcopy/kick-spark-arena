import { useEffect, useState, useRef, useMemo } from 'react';
import { useSound } from '@/contexts/SoundContext';

interface LoadingScreenProps {
  onReady: () => void;
  skipBgMusic?: boolean;
}

const BOOT_LOGS = [
  '> INITIALIZING CORE KERNEL...',
  '> LOADING ARENA ASSETS [MODULE 1/4]...',
  '> ESTABLISHING NEURAL LINK PROTOCOL...',
  '> CALIBRATING SENSORS...',
  '> LOADING ARENA ASSETS [MODULE 2/4]...',
  '> SYSTEM INTEGRITY CHECK... PASSED',
  '> LOADING ARENA ASSETS [MODULE 3/4]...',
  '> WARNING: HIGH VOLTAGE DETECTED',
  '> LOADING ARENA ASSETS [MODULE 4/4]...',
  '> ALL SYSTEMS OPERATIONAL',
];

export function LoadingScreen({ onReady, skipBgMusic = false }: LoadingScreenProps) {
  const { waitForAudioReady, getAudioProgress, unlockAudio, initFullPreload } = useSound();
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasStartedRef = useRef(false);
  const progressIntervalRef = useRef<number | null>(null);

  // Determine how many log lines to show based on progress
  const visibleLogs = useMemo(() => {
    const count = Math.floor((progress / 100) * BOOT_LOGS.length);
    return BOOT_LOGS.slice(0, Math.min(count + 1, BOOT_LOGS.length));
  }, [progress]);

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
  }, [waitForAudioReady, getAudioProgress, unlockAudio, initFullPreload, skipBgMusic]);

  // Fade-out + scale-up transition then call onReady
  useEffect(() => {
    if (isComplete && !isFadingOut) {
      setIsFadingOut(true);
      setTimeout(() => onReady(), 700);
    }
  }, [isComplete, isFadingOut, onReady]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-700 boot-scanlines ${isFadingOut ? 'opacity-0 scale-105' : 'opacity-100'}`}
      style={{
        backgroundColor: '#0b1120',
        boxShadow: 'inset 0 0 150px 60px rgba(0,0,0,0.8)',
      }}
    >
      {/* Header */}
      <div className="absolute top-6 left-6 z-20">
        <p className="font-mono text-xs text-white/40 tracking-widest uppercase">
          S-FIGHT ARENA OS [VERSION 2.1.0]
        </p>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
        {/* Giant percentage */}
        <div
          className="font-mono font-black italic leading-none animate-glitch-shake"
          style={{ fontSize: 'clamp(80px, 20vw, 140px)', color: '#FFD700' }}
        >
          {Math.round(progress)}%
        </div>

        {/* Industrial progress bar */}
        <div className="w-full max-w-[600px] mt-6 relative">
          {/* Track */}
          <div className="h-6 w-full bg-white/5 border border-white/10 relative overflow-hidden">
            {/* Ruler ticks */}
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${(i + 1) * 10}%` }}
              />
            ))}
            {/* Fill */}
            <div
              className="h-full transition-all duration-200 relative"
              style={{ width: `${progress}%`, backgroundColor: '#FFD700' }}
            >
              {/* Pulse tip */}
              <div className="absolute right-0 top-0 bottom-0 w-3 animate-pulse-tip" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Boot logs */}
      <div className="absolute bottom-8 left-6 right-6 z-20 max-w-[600px] mx-auto">
        <div className="space-y-1">
          {visibleLogs.map((log, i) => (
            <p
              key={i}
              className="font-mono text-xs tracking-wide"
              style={{ color: 'rgba(34,211,238,0.5)' }}
            >
              {log}
              {i === visibleLogs.length - 1 && !isComplete && (
                <span className="animate-pulse ml-1">_</span>
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
