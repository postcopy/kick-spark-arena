import { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, User, Gauge } from 'lucide-react';
import { LowBatteryAlert } from './EquipmentStatus';
import type { GameScore, Side, Athlete } from '@/types/game';
import type { EquipmentSlot, EquipmentState } from '@/types/serial';
import { cn } from '@/lib/utils';

interface GameScreenProps {
  scores: GameScore;
  timeLeft: number;
  isPaused: boolean;
  flashSide: Side | null;
  isIndividual?: boolean;
  athlete?: Athlete | null;
  totalDuration?: number;
  onPause?: () => void;
  equipment?: Map<EquipmentSlot, EquipmentState>;
}

export function GameScreen({
  scores,
  timeLeft,
  isPaused,
  flashSide,
  isIndividual,
  athlete,
  totalDuration = 60,
  onPause,
  equipment
}: GameScreenProps) {
  const [showPauseHint, setShowPauseHint] = useState(true);

  const total = scores.red + scores.blue;
  const totalKicks = scores.red + scores.blue;

  // CPM real-time
  const elapsedSeconds = totalDuration - timeLeft;
  const cpm = elapsedSeconds > 0 ? Math.round((totalKicks / elapsedSeconds) * 60) : 0;

  // Duo metrics
  const redCpm = elapsedSeconds > 0 ? Math.round((scores.red / elapsedSeconds) * 60) : 0;
  const blueCpm = elapsedSeconds > 0 ? Math.round((scores.blue / elapsedSeconds) * 60) : 0;
  const totalDuo = scores.red + scores.blue;
  const redPercent = totalDuo > 0 ? (scores.red / totalDuo) * 100 : 50;
  const scoreDiff = Math.abs(scores.red - scores.blue);

  // Day PB
  const [dayPB, setDayPB] = useState<number | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kickcounter_dayRecord');
      if (stored) {
        const record = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        if (record.date === today) setDayPB(record.bestTotal);
      }
    } catch (e) {
      console.error("Erro ao ler PB", e);
    }
  }, []);

  // Progress
  const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 100;
  const timerPulse = timeLeft <= 5 && !isPaused;
  const isLowTime = timeLeft <= 10;
  const isCriticalTime = timeLeft <= 5;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gauge
  const gaugeMax = 200;

  useEffect(() => {
    const timer = setTimeout(() => setShowPauseHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleTapPause = useCallback(() => {
    onPause?.();
  }, [onPause]);

  // Progress bar color
  const progressColor = isCriticalTime
    ? 'bg-red-500'
    : isLowTime
      ? 'bg-orange-400'
      : 'bg-orange-500';

  const progressGlow = isCriticalTime
    ? 'rgba(239,68,68,0.5)'
    : isLowTime
      ? 'rgba(251,146,60,0.4)'
      : 'rgba(249,115,22,0.3)';

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden relative select-none bg-[#0A0A0F]"
      onClick={handleTapPause}
    >
      {/* Low Battery Alert */}
      {equipment && <LowBatteryAlert equipment={equipment} />}

      {/* Pause Overlay */}
      {isPaused && (
        <div
          className="absolute inset-0 bg-[#0A0A0F]/90 backdrop-blur-sm z-30 flex items-center justify-center"
          onClick={handleTapPause}
        >
          <div className="text-center">
            {isIndividual ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <Gauge className="w-8 h-8 text-orange-400" />
                </div>
                <h2 className="text-xl font-display font-bold text-white/80 mb-3">
                  Corrida Pausada
                </h2>
                <p className="text-sm text-white/30 border border-white/10 rounded-lg px-6 py-2.5 cursor-pointer hover:bg-white/5 transition-colors">
                  Toque para retomar
                </p>
              </>
            ) : (
              <>
                <h2
                  className="font-display font-black text-orange-500 mb-4 animate-pulse"
                  style={{ fontSize: 'clamp(3rem, 12vh, 6rem)' }}
                >
                  PAUSADO
                </h2>
                <p className="text-lg text-white/30">
                  Toque para continuar
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center">
        {isIndividual ? (
          /* ========== INDIVIDUAL MODE - Racing Dashboard ========== */
          <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">

            {/* Ambient glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
              style={{
                background: `radial-gradient(ellipse, rgba(249,115,22,${flashSide ? '0.15' : '0.04'}) 0%, transparent 70%)`,
                transition: 'background 150ms',
              }}
            />

            {/* === TOP: Timer Zone === */}
            <div className="w-full px-6 pt-4 flex-shrink-0 relative z-[1]">
              {/* Race progress track */}
              <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden relative">
                {/* Tick marks */}
                {[25, 50, 75].map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-0 bottom-0 w-px bg-white/[0.08]"
                    style={{ left: `${tick}%` }}
                  />
                ))}
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    progressColor,
                    isCriticalTime && "animate-pulse"
                  )}
                  style={{
                    width: `${progress}%`,
                    boxShadow: `0 0 20px ${progressGlow}`,
                  }}
                />
              </div>

              {/* Timer */}
              <div className="text-center mt-3">
                <span
                  className={cn(
                    "font-mono font-black tabular-nums",
                    isCriticalTime ? "text-red-400" : isLowTime ? "text-orange-300" : "text-white/90",
                    timerPulse && "animate-pulse"
                  )}
                  style={{ fontSize: 'clamp(2.5rem, 7vh, 5rem)' }}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* === CENTER: Dashboard Grid === */}
            <div className="grid grid-cols-12 gap-4 md:gap-6 flex-1 items-center px-6 md:px-8 relative z-[1]">

              {/* Left: Stats */}
              <div className="col-span-3 flex flex-col gap-4">
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-orange-400/60" />
                    <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-mono">Recorde</span>
                  </div>
                  <span className="text-4xl font-bold text-white/80 font-mono tabular-nums">
                    {dayPB ?? '--'}
                  </span>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-orange-400/60" />
                    <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-mono">M\u00e9dia</span>
                  </div>
                  <span className="text-4xl font-bold text-white/80 font-mono tabular-nums">
                    {elapsedSeconds > 5 ? Math.round(totalKicks / (elapsedSeconds / 60)) : '--'}
                  </span>
                  <span className="text-sm text-white/20 ml-1.5">k/min</span>
                </div>
              </div>

              {/* Center: Hero Counter */}
              <div className="col-span-6 flex flex-col items-center justify-center">
                <span
                  key={totalKicks}
                  className={cn(
                    'font-display font-black text-orange-400 leading-none tabular-nums',
                    flashSide ? 'animate-[hit-pulse_150ms_ease-out]' : ''
                  )}
                  style={{
                    fontSize: 'clamp(10rem, 18vw, 24rem)',
                    filter: `drop-shadow(0 0 60px rgba(249,115,22,${flashSide ? '0.6' : '0.3'}))`,
                    transition: 'filter 150ms',
                  }}
                >
                  {totalKicks}
                </span>
                <span className="text-lg text-white/20 uppercase tracking-[0.5em] font-mono mt-2">
                  CHUTES
                </span>
              </div>

              {/* Right: Tachometer */}
              <div className="col-span-3 flex flex-col items-center justify-center">
                <div className="relative" style={{ width: 'clamp(7rem, 12vw, 12rem)', height: 'clamp(7rem, 12vw, 12rem)' }}>
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    {/* Background arc */}
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8"
                      strokeDasharray={`${Math.PI * 50 * 0.75} ${Math.PI * 50 * 0.25}`}
                      strokeDashoffset={Math.PI * 50 * 0.375}
                      strokeLinecap="round"
                    />
                    {/* Progress arc */}
                    <circle cx="60" cy="60" r="50" fill="none"
                      stroke={cpm > 150 ? "#22c55e" : "#F97316"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.PI * 50 * 0.75} ${Math.PI * 50 * 0.25}`}
                      strokeDashoffset={Math.PI * 50 * 0.375 + (Math.PI * 50 * 0.75) * (1 - Math.min(cpm, gaugeMax) / gaugeMax)}
                      style={{ transition: 'stroke-dashoffset 300ms ease-out, stroke 300ms' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white/90 font-mono tabular-nums">{cpm}</span>
                    <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-mono">CPM</span>
                  </div>
                </div>
                <div className="flex justify-between w-full px-3 mt-1">
                  <span className="text-[10px] text-white/15 font-mono">0</span>
                  <span className="text-[10px] text-white/15 font-mono">200</span>
                </div>
              </div>
            </div>

            {/* === BOTTOM BAR === */}
            <div className="w-full bg-white/[0.02] border-t border-white/[0.04] flex items-center justify-between px-6 md:px-10 py-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-white/20" />
                <span className="text-xs text-white/30 font-mono">{athlete?.name || 'Visitante'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/70 animate-pulse" />
                <span className="text-[10px] text-white/20 font-mono">Ativo</span>
              </div>
              <span className="text-[10px] text-white/15 font-mono hidden md:block">[P] Pausar  [ESC] Sair</span>
            </div>

            {/* Impact Flash + Ripple */}
            {flashSide && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none z-[2]"
                  style={{
                    boxShadow: 'inset 0 0 120px rgba(249,115,22,0.15)',
                    animation: 'pulse 150ms ease-out',
                  }}
                />
                <div className="impact-ripple z-[3]" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)' }} />
              </>
            )}
          </div>
        ) : (
          /* ========== DUO MODE - Racing Split Screen ========== */
          <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">

            {/* === HEADER: Race Timer === */}
            <div className="w-full px-6 pt-4 flex-shrink-0 relative z-[1]">
              <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden relative">
                {[25, 50, 75].map((tick) => (
                  <div key={tick} className="absolute top-0 bottom-0 w-px bg-white/[0.08]" style={{ left: `${tick}%` }} />
                ))}
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    progressColor,
                    isCriticalTime && "animate-pulse"
                  )}
                  style={{ width: `${progress}%`, boxShadow: `0 0 20px ${progressGlow}` }}
                />
              </div>
              <div className="text-center mt-2">
                <span
                  className={cn(
                    "font-mono font-black tabular-nums",
                    isCriticalTime ? "text-red-400" : isLowTime ? "text-orange-300" : "text-white/90",
                    timerPulse && "animate-pulse"
                  )}
                  style={{ fontSize: 'clamp(2rem, 5vh, 4rem)' }}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* === ARENA GRID === */}
            <div className="grid grid-cols-12 gap-3 md:gap-4 flex-1 items-center px-6 md:px-10 relative z-[1]">

              {/* Red Lane */}
              <div className={cn(
                "col-span-5 rounded-2xl border-l-[3px] border-red-500/40 px-6 md:px-8 py-4 transition-all duration-100 flex flex-col justify-center items-center h-full",
                flashSide === 'red'
                  ? "bg-red-500/10 border-red-500/60"
                  : "bg-red-500/[0.03]"
              )}>
                <span
                  className="text-red-400 font-display font-black leading-none tabular-nums"
                  style={{
                    fontSize: 'clamp(7rem, 18vw, 20rem)',
                    filter: `drop-shadow(0 0 30px rgba(239,68,68,${flashSide === 'red' ? '0.5' : '0.2'}))`,
                    transition: 'filter 100ms',
                  }}
                >
                  {scores.red}
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg text-white/25 uppercase tracking-[0.3em] font-mono">HITS</span>
                  <span className="text-base text-white/15 font-mono tabular-nums">{redCpm} cpm</span>
                </div>
              </div>

              {/* VS Center */}
              <div className="col-span-2 flex flex-col items-center justify-center gap-4">
                <span className="text-3xl font-display font-black text-white/10">VS</span>

                {/* Race position bar */}
                <div className="h-3 w-full bg-white/[0.04] rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-full transition-all duration-300"
                    style={{
                      width: `${redPercent}%`,
                      background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                      boxShadow: scores.red >= scores.blue ? '0 0 10px rgba(239,68,68,0.4)' : 'none'
                    }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 rounded-r-full transition-all duration-300"
                    style={{
                      width: `${100 - redPercent}%`,
                      background: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)',
                      boxShadow: scores.blue > scores.red ? '0 0 10px rgba(59,130,246,0.4)' : 'none'
                    }}
                  />
                </div>

                {/* Score diff */}
                {scoreDiff > 0 && (
                  <span className={cn(
                    "text-3xl font-display font-black tabular-nums",
                    scores.red > scores.blue ? "text-red-400/80" : "text-blue-400/80"
                  )}>
                    +{scoreDiff}
                  </span>
                )}
                <span className="text-xs text-white/20 font-mono tabular-nums">
                  Total: {totalDuo}
                </span>
              </div>

              {/* Blue Lane */}
              <div className={cn(
                "col-span-5 rounded-2xl border-r-[3px] border-blue-500/40 px-6 md:px-8 py-4 transition-all duration-100 flex flex-col justify-center items-center h-full",
                flashSide === 'blue'
                  ? "bg-blue-500/10 border-blue-500/60"
                  : "bg-blue-500/[0.03]"
              )}>
                <span
                  className="text-blue-400 font-display font-black leading-none tabular-nums"
                  style={{
                    fontSize: 'clamp(7rem, 18vw, 20rem)',
                    filter: `drop-shadow(0 0 30px rgba(59,130,246,${flashSide === 'blue' ? '0.5' : '0.2'}))`,
                    transition: 'filter 100ms',
                  }}
                >
                  {scores.blue}
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg text-white/25 uppercase tracking-[0.3em] font-mono">HITS</span>
                  <span className="text-base text-white/15 font-mono tabular-nums">{blueCpm} cpm</span>
                </div>
              </div>
            </div>

            {/* === FOOTER === */}
            <div className="w-full bg-white/[0.02] border-t border-white/[0.04] flex items-center justify-between px-6 md:px-10 py-2.5 relative z-[1]">
              <span className="text-xs font-bold text-red-400/60 uppercase tracking-[0.2em]">Vermelho</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/70 animate-pulse" />
                  <span className="text-[10px] text-white/20 font-mono">Ativo</span>
                </div>
                <span className="text-[10px] text-white/15 font-mono hidden md:block">[P] Pausar  [ESC] Sair</span>
              </div>
              <span className="text-xs font-bold text-blue-400/60 uppercase tracking-[0.2em]">Azul</span>
            </div>

            {/* Impact Flash + Ripple */}
            {flashSide && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none z-[2]"
                  style={{
                    boxShadow: `inset 0 0 100px ${flashSide === 'red' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)'}`,
                    animation: 'pulse 150ms ease-out',
                  }}
                />
                <div
                  className="impact-ripple z-[3]"
                  style={{
                    background: `radial-gradient(circle, ${flashSide === 'red' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'} 0%, transparent 70%)`,
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
