import { ArrowLeft, Check, X } from 'lucide-react';
import type { useReactionState } from '@/hooks/useReactionState';
import { useEffect, useRef, useState } from 'react';
import bgMenuModos from '@/assets/menu-modos.jpg';

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

  // ── Target node states ──
  const isGo = stimulusActive && stimulusColor === 'green';
  const isNoGo = stimulusActive && stimulusColor === 'red';
  const isHitFeedback = hitFeedback?.type === 'success';
  const isErrorFeedback = hitFeedback?.type === 'error';

  const getTargetBg = () => {
    if (isHitFeedback) return '#22d3ee';
    if (isErrorFeedback) return '#FF3333';
    if (isGo) return '#4ade80';
    if (isNoGo) return '#FF3333';
    return 'transparent';
  };

  const getTargetShadow = () => {
    if (isHitFeedback) return '0 0 60px #22d3ee, 0 0 120px rgba(34,211,238,0.3)';
    if (isErrorFeedback) return '0 0 60px #FF3333, 0 0 120px rgba(255,51,51,0.3)';
    if (isGo) return '0 0 60px #4ade80, 0 0 120px rgba(74,222,128,0.3)';
    if (isNoGo) return '0 0 60px #FF3333, 0 0 120px rgba(255,51,51,0.3)';
    return 'none';
  };

  const showCrosshair = !stimulusActive && !hitFeedback;

  // ── REST SCREEN ──
  if (isResting) {
    return (
      <div className="h-full w-full flex flex-col bg-slate-950 overflow-hidden relative">
        {/* Background texture */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${bgMenuModos})`, opacity: 0.03 }}
        />
        {/* Subtle crosshair in rest */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-72">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2" />
          </div>
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm relative z-10">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <span className="font-mono text-white/60 text-sm tracking-wider">DESCANSO</span>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-blue-300 uppercase tracking-wider">
            Descanse
          </h2>
          <div className="text-[clamp(60px,20vh,180px)] font-black text-white font-mono animate-pulse">
            {restTimeLeft}
          </div>
          <p className="text-blue-400 text-lg font-mono">
            Próximo: Round {currentRound}/{totalRounds}
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN HUD ──
  return (
    <div
      className="h-full w-full flex flex-col bg-slate-950 relative overflow-hidden"
      style={{
        boxShadow: peripheralFlash
          ? 'inset 0 0 100px rgba(74,222,128,0.3)'
          : 'none',
        transition: 'box-shadow 0.1s ease-out',
      }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${bgMenuModos})`, opacity: 0.03 }}
      />

      {/* ── Header Técnico ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <span className="font-mono text-white text-sm tracking-wider">
            ROUND {currentRound}/{totalRounds}
          </span>
        </div>
        <span
          className={`font-mono text-sm tracking-wider ${
            workTimeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'
          }`}
        >
          {formatTime(workTimeLeft)}
        </span>
      </div>

      {/* ── Central area ── */}
      <div className="flex-1 flex items-center justify-center relative z-10">

        {/* ── Left Panel: Telemetria ── */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
          <div>
            <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Média</div>
            <div className="font-mono font-black text-white text-2xl">
              {avgTime !== null ? `${avgTime}ms` : '--'}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Melhor</div>
            <div className="font-mono font-black text-yellow-400 text-lg">
              {bestTime !== null ? `${bestTime}ms` : '--'}
            </div>
          </div>
          {isCognitive && (
            <div>
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Faltas</div>
              <div className="font-mono font-black text-red-400 text-lg">
                {commissionErrors}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Combat Log ── */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-end z-10">
          {lastHits.map((hit) => (
            <div key={hit.index} className="font-mono text-xs tracking-wider">
              <span className="text-white/30">HIT {String(hit.index).padStart(2, '0')}</span>
              <span className={`ml-2 font-bold ${hit.time < 400 ? 'text-green-400' : 'text-yellow-400'}`}>
                {hit.time}ms
              </span>
            </div>
          ))}
        </div>

        {/* ── Target Node ── */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border-4 transition-all duration-75"
              style={{
                borderColor: (isGo || isHitFeedback)
                  ? '#4ade80'
                  : (isNoGo || isErrorFeedback)
                    ? '#FF3333'
                    : 'rgba(255,255,255,0.1)',
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
                {/* Vertical */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />
                {/* Horizontal */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2" />
              </>
            )}

            {/* Idle center dot */}
            {showCrosshair && (
              <div className="absolute w-4 h-4 rounded-full bg-white/10 animate-pulse" />
            )}

            {/* Content inside target */}
            <div className="relative z-10 flex items-center justify-center">
              {hitFeedback ? (
                <span
                  className="font-black font-mono text-center leading-none"
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
          <div className="font-mono font-bold text-yellow-400 text-sm tracking-[0.2em] uppercase">
            HITS: {String(hits).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Commission error overlay */}
      {showFault && !hitFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <span
            className="text-5xl md:text-7xl font-black text-red-500 animate-pulse"
            style={{ textShadow: '0 0 30px rgba(255,0,0,0.6)' }}
          >
            FALTA!
          </span>
        </div>
      )}
    </div>
  );
}
