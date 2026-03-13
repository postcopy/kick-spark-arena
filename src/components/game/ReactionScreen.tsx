import { ArrowLeft, Check, X, Crosshair } from 'lucide-react';
import type { useReactionState } from '@/hooks/useReactionState';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ReactionScreenProps {
  reactionState: ReturnType<typeof useReactionState>;
  onBack: () => void;
  athleteName?: string;
}

export function ReactionScreen({ reactionState, onBack, athleteName }: ReactionScreenProps) {
  const {
    currentRound,
    totalRounds,
    workTimeLeft,
    isResting,
    restTimeLeft,
    stimulusActive,
    stimulusColor,
    lastReactionTime,
    reactionTimes,
    commissionErrors,
    config,
  } = reactionState;

  const [showReactionTime, setShowReactionTime] = useState(false);
  const [displayedTime, setDisplayedTime] = useState<number | null>(null);
  const [hitFeedback, setHitFeedback] = useState<{ type: 'success' | 'error'; value: string } | null>(null);
  const [showFault, setShowFault] = useState(false);
  const [peripheralFlash, setPeripheralFlash] = useState(false);
  const trackedErrorsRef = useRef(0);
  const prevStimulusRef = useRef(false);

  // Peripheral flash when stimulus activates
  useEffect(() => {
    if (stimulusActive && !prevStimulusRef.current && stimulusColor === 'green') {
      setPeripheralFlash(true);
      const t = window.setTimeout(() => setPeripheralFlash(false), 200);
      return () => window.clearTimeout(t);
    }
    prevStimulusRef.current = stimulusActive;
  }, [stimulusActive, stimulusColor]);

  // Commission error flash
  useEffect(() => {
    if (commissionErrors > trackedErrorsRef.current) {
      trackedErrorsRef.current = commissionErrors;
      setShowFault(true);
      setHitFeedback({ type: 'error', value: 'FALTA!' });
      const faultTimer = window.setTimeout(() => setShowFault(false), 1500);
      const feedbackTimer = window.setTimeout(() => setHitFeedback(null), 500);
      return () => {
        window.clearTimeout(faultTimer);
        window.clearTimeout(feedbackTimer);
      };
    }
  }, [commissionErrors]);

  // Reaction time feedback
  useEffect(() => {
    if (lastReactionTime !== null) {
      setDisplayedTime(lastReactionTime);
      setShowReactionTime(true);
      setHitFeedback({ type: 'success', value: `${lastReactionTime}ms` });
      const feedbackTimer = window.setTimeout(() => setHitFeedback(null), 500);
      const displayTimer = window.setTimeout(() => setShowReactionTime(false), 2000);
      return () => {
        window.clearTimeout(feedbackTimer);
        window.clearTimeout(displayTimer);
      };
    }
  }, [lastReactionTime]);

  const hits = reactionTimes.length;
  const sum = reactionTimes.reduce((a, b) => a + b, 0);
  const avgTime = hits > 0 ? Math.round(sum / hits) : null;
  const bestTime = hits > 0 ? Math.min(...reactionTimes) : null;
  const isCognitive = config.cognitiveMode;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Last 3 hits for combat log
  const lastHits = reactionTimes.slice(-3).reverse().map((time, i) => ({
    index: hits - i,
    time,
  }));

  // Target node states
  const isGo = stimulusActive && stimulusColor === 'green';
  const isNoGo = stimulusActive && stimulusColor === 'red';
  const isHitFeedback = hitFeedback?.type === 'success';
  const isErrorFeedback = hitFeedback?.type === 'error';

  const getTargetBg = () => {
    if (isHitFeedback) return '#06B6D4';
    if (isErrorFeedback) return '#EF4444';
    if (isGo) return '#22C55E';
    if (isNoGo) return '#EF4444';
    return 'transparent';
  };

  const getTargetShadow = () => {
    if (isHitFeedback) return '0 0 60px rgba(6,182,212,0.6), 0 0 120px rgba(6,182,212,0.2)';
    if (isErrorFeedback) return '0 0 60px rgba(239,68,68,0.6), 0 0 120px rgba(239,68,68,0.2)';
    if (isGo) return '0 0 60px rgba(34,197,94,0.6), 0 0 120px rgba(34,197,94,0.2)';
    if (isNoGo) return '0 0 60px rgba(239,68,68,0.6), 0 0 120px rgba(239,68,68,0.2)';
    return 'none';
  };

  const showCrosshair = !stimulusActive && !hitFeedback;

  // ── REST SCREEN ──
  if (isResting) {
    return (
      <div className="h-full w-full flex flex-col bg-[#0A0A0F] overflow-hidden relative">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

        {/* Subtle crosshair in rest */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-72">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.04] -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.04] -translate-y-1/2" />
          </div>
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 relative z-10">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </button>
          <span className="font-mono text-[10px] text-cyan-400/40 uppercase tracking-[0.3em]">Intervalo</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 relative z-10">
          <h2 className="font-display font-black text-3xl md:text-5xl text-cyan-400 uppercase tracking-tight">
            Descanse
          </h2>
          <div className="text-[clamp(60px,20vh,180px)] font-display font-black text-white/90 leading-none"
            style={{ textShadow: '0 0 40px rgba(6,182,212,0.3)' }}
          >
            {restTimeLeft}
          </div>
          <p className="text-cyan-400/60 text-sm font-mono tracking-wider">
            Pr\u00f3ximo: Round {currentRound}/{totalRounds}
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN HUD ──
  return (
    <div
      className="h-full w-full flex flex-col bg-[#0A0A0F] relative overflow-hidden"
      style={{
        boxShadow: peripheralFlash
          ? 'inset 0 0 100px rgba(34,197,94,0.2)'
          : 'none',
        transition: 'box-shadow 0.1s ease-out',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-green-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </button>
          <div className="flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-green-400/60" />
            <span className="font-mono text-white/60 text-sm tracking-wider">
              R{currentRound}/{totalRounds}
            </span>
          </div>
          {athleteName && (
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider hidden md:block">
              {athleteName}
            </span>
          )}
        </div>
        <span
          className={cn(
            "font-mono text-sm font-bold tracking-wider tabular-nums",
            workTimeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white/80'
          )}
        >
          {formatTime(workTimeLeft)}
        </span>
      </div>

      {/* Central area */}
      <div className="flex-1 flex items-center justify-center relative z-10">

        {/* Left Panel: Telemetry */}
        <div className="absolute left-5 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-10">
          <div>
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">M\u00e9dia</div>
            <div className="font-mono font-black text-white/80 text-2xl tabular-nums">
              {avgTime !== null ? `${avgTime}ms` : '--'}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">Melhor</div>
            <div className="font-mono font-black text-cyan-400 text-lg tabular-nums">
              {bestTime !== null ? `${bestTime}ms` : '--'}
            </div>
          </div>
          {isCognitive && (
            <div>
              <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em]">Faltas</div>
              <div className="font-mono font-black text-red-400 text-lg tabular-nums">
                {commissionErrors}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Combat Log */}
        <div className="absolute right-5 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-end z-10">
          {lastHits.map((hit) => (
            <div key={hit.index} className="font-mono text-xs tracking-wider">
              <span className="text-white/20">#{String(hit.index).padStart(2, '0')}</span>
              <span className={cn(
                "ml-2 font-bold tabular-nums",
                hit.time < 400 ? 'text-green-400' : hit.time < 600 ? 'text-cyan-400' : 'text-yellow-400'
              )}>
                {hit.time}ms
              </span>
            </div>
          ))}
        </div>

        {/* Target Node */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border-2 transition-all duration-75"
              style={{
                borderColor: (isGo || isHitFeedback)
                  ? 'rgba(34,197,94,0.8)'
                  : (isNoGo || isErrorFeedback)
                    ? 'rgba(239,68,68,0.8)'
                    : 'rgba(255,255,255,0.06)',
                boxShadow: getTargetShadow(),
              }}
            />

            {/* Inner fill */}
            <div
              className="absolute rounded-full transition-all duration-75"
              style={{
                inset: '4px',
                backgroundColor: getTargetBg(),
                animation: isErrorFeedback ? 'shake 0.3s ease-in-out' : undefined,
              }}
            />

            {/* Crosshair lines */}
            {showCrosshair && (
              <>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06] -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.06] -translate-y-1/2" />
              </>
            )}

            {/* Idle center dot */}
            {showCrosshair && (
              <div className="absolute w-3 h-3 rounded-full bg-white/10 animate-pulse" />
            )}

            {/* Content inside target */}
            <div className="relative z-10 flex items-center justify-center">
              {hitFeedback ? (
                <span
                  className="font-display font-black text-center leading-none"
                  style={{
                    fontSize: 'clamp(2rem, 8vmin, 4rem)',
                    color: isHitFeedback ? '#000' : '#fff',
                  }}
                >
                  {hitFeedback.value}
                </span>
              ) : (
                <>
                  {isCognitive && stimulusActive && stimulusColor === 'green' && (
                    <Check className="w-16 h-16 text-black/60" strokeWidth={3} />
                  )}
                  {isCognitive && stimulusActive && stimulusColor === 'red' && (
                    <X className="w-16 h-16 text-white" strokeWidth={3} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Hits counter */}
          <div className="font-mono font-bold text-green-400/60 text-sm tracking-[0.2em] uppercase">
            HITS: {String(hits).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Commission error overlay */}
      {showFault && !hitFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <span
            className="font-display text-5xl md:text-7xl font-black text-red-400 animate-pulse"
            style={{ textShadow: '0 0 40px rgba(239,68,68,0.5)' }}
          >
            FALTA!
          </span>
        </div>
      )}
    </div>
  );
}
