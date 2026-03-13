import { useEffect, useState, useRef, useMemo } from 'react';
import { useSound } from '@/contexts/SoundContext';

interface LoadingScreenProps {
  onReady: () => void;
  skipBgMusic?: boolean;
  /** Which bg music to preload. Defaults to 'fightModeBg'. Ignored if skipBgMusic=true */
  bgMusicName?: 'fightModeBg' | 'bgTimeAttack' | 'bgArcade' | 'bgReaction';
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

export function LoadingScreen({ onReady, skipBgMusic = false, bgMusicName = 'fightModeBg' }: LoadingScreenProps) {
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
      : [bgMusicName, 'hit', 'hitHeavy', 'countdown3'] as const;

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
  }, [waitForAudioReady, unlockAudio, initFullPreload, skipBgMusic, bgMusicName]);

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
      style={{ backgroundColor: '#0A0A0F' }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-red-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="absolute top-6 left-6 z-20">
        <p className="font-mono text-[10px] text-white/20 tracking-[0.3em] uppercase">
          S-FIGHT PRO [v2.1.0]
        </p>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
        {/* Giant percentage */}
        <div
          className="font-display font-black leading-none tabular-nums"
          style={{ fontSize: 'clamp(80px, 20vw, 140px)', color: '#E11D48' }}
        >
          {Math.round(progress)}
          <span className="text-white/20" style={{ fontSize: '0.5em' }}>%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-[500px] mt-6 relative">
          <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-200 relative"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #E11D48, #F59E0B)',
              }}
            >
              {/* Pulse tip */}
              <div className="absolute right-0 top-0 bottom-0 w-4 rounded-full bg-white/40 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Sensor warning */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <span className="font-mono font-bold text-[10px] uppercase tracking-[0.2em] text-yellow-400/80">
              Protocolo do Sensor
            </span>
          </div>
          <p className="text-white/40 font-mono text-xs text-center max-w-sm mt-1">
            O sistema ignora chutes colados.
          </p>
          <p className="text-white/60 font-display font-bold text-sm text-center mt-0.5">
            CHUTE {"\u2192"} RECOLHA {"\u2192"} CHUTE
          </p>
        </div>
      </div>

      {/* Boot logs */}
      <div className="absolute bottom-8 left-6 right-6 z-20 max-w-[500px] mx-auto">
        <div className="space-y-0.5">
          {visibleLogs.map((log, i) => (
            <p
              key={i}
              className="font-mono text-[10px] tracking-wider text-white/15"
            >
              {log}
              {i === visibleLogs.length - 1 && !isComplete && (
                <span className="animate-pulse ml-1 text-white/30">_</span>
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
