import { useEffect, useState, useRef, useMemo } from 'react';
import { useSound } from '@/contexts/SoundContext';

interface LoadingScreenProps {
  onReady: () => void;
  skipBgMusic?: boolean;
}

const BOOT_LOGS = [
  '> INITIALIZING CORE KERNEL...',
  '> LOADING ARENA ASSETS...',
  '> ESTABLISHING NEURAL LINK PROTOCOL...',
  '> CALIBRATING IMPACT SENSORS...',
  '> RUNNING SENSOR DIAGNOSTICS...',
  '> SENSOR THRESHOLD: NOMINAL',
  '> SYNCHRONIZING TARGETS...',
  '> SYSTEM INTEGRITY CHECK... PASSED',
  '> WARNING: HIGH VOLTAGE DETECTED',
  '> ALL SYSTEMS OPERATIONAL',
];

export function LoadingScreen({ onReady, skipBgMusic = false }: LoadingScreenProps) {
  const { waitForAudioReady, unlockAudio, initFullPreload } = useSound();
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

    const MIN_DURATION = 4000;
    const TICK_INTERVAL = 100;
    const totalTicks = MIN_DURATION / TICK_INTERVAL;
    let currentTick = 0;

    progressIntervalRef.current = window.setInterval(() => {
      currentTick++;
      const linearProgress = Math.min((currentTick / totalTicks) * 100, 100);
      setProgress(linearProgress);
      if (currentTick >= totalTicks && progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, TICK_INTERVAL);

    const timerPromise = new Promise(resolve => setTimeout(resolve, MIN_DURATION));
    const audioPromise = waitForAudioReady(requiredSounds as any, 8000);

    Promise.all([timerPromise, audioPromise]).then(() => {
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
  }, [waitForAudioReady, unlockAudio, initFullPreload, skipBgMusic]);

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

        {/* Hardware warning */}
        <div className="mt-6 flex flex-col items-center gap-2 animate-pulse">
          <div className="flex items-center gap-2 text-yellow-500">
            <span className="text-xl">⚠️</span>
            <span className="font-mono font-bold text-sm uppercase tracking-widest">
              PROTOCOLO DO SENSOR
            </span>
          </div>
          <p className="text-white/80 font-mono text-sm text-center max-w-md">
            O sistema ignora chutes colados.
            <br/>
            <span className="text-yellow-400 font-bold text-base mt-1 block">
              CHUTE → RECOLHA A PERNA → CHUTE
            </span>
          </p>
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
