import { ArrowLeft, Check, X } from 'lucide-react';
import type { useReactionState } from '@/hooks/useReactionState';
import { useEffect, useRef, useState } from 'react';

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

  // Fade out reaction time display after 2s
  const [showReactionTime, setShowReactionTime] = useState(false);
  const [displayedTime, setDisplayedTime] = useState<number | null>(null);

  // Visual impact feedback on stimulus circle
  const [hitFeedback, setHitFeedback] = useState<{ type: 'success' | 'error'; value: string } | null>(null);

  // Commission error "FALTA!" flash
  const [showFault, setShowFault] = useState(false);
  const trackedErrorsRef = useRef(0);

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

  // Computed stats
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

  // Determine stimulus circle style
  const getStimulusStyle = () => {
    if (hitFeedback?.type === 'success') {
      return {
        backgroundColor: '#22d3ee',
        boxShadow: '0 0 60px 20px rgba(34,211,238,0.5), 0 0 120px 40px rgba(34,211,238,0.2)',
        transform: 'scale(1.08)',
        transition: 'transform 0.1s ease-out, background-color 0.05s',
      };
    }
    if (hitFeedback?.type === 'error') {
      return {
        backgroundColor: '#FF3333',
        boxShadow: '0 0 80px 30px rgba(255,51,51,0.5), 0 0 140px 50px rgba(255,51,51,0.2)',
        animation: 'shake 0.3s ease-in-out',
      };
    }
    if (!stimulusActive || !stimulusColor) {
      return {
        backgroundColor: '#1e293b',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
      };
    }
    if (stimulusColor === 'red') {
      return {
        backgroundColor: '#FF3333',
        boxShadow: '0 0 60px 20px rgba(255,51,51,0.4), 0 0 120px 40px rgba(255,51,51,0.15)',
      };
    }
    return {
      backgroundColor: '#39FF14',
      boxShadow: '0 0 60px 20px rgba(57,255,20,0.4), 0 0 120px 40px rgba(57,255,20,0.15)',
    };
  };

  if (isResting) {
    return (
      <div className="h-full w-full flex flex-col bg-blue-950 overflow-hidden">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <h2 className="text-3xl md:text-5xl font-black text-blue-300 uppercase tracking-wider">
            Descanse
          </h2>
          <div className="text-[clamp(60px,20vh,180px)] font-black text-white animate-pulse">
            {restTimeLeft}
          </div>
          <p className="text-blue-400 text-lg">
            Próximo: Round {currentRound}/{totalRounds}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 pb-24 relative overflow-hidden">
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-center px-4 py-3 bg-black/30 gap-2">
        <div className="text-white/80 font-bold text-lg tracking-wider uppercase">
          Round {currentRound}/{totalRounds}
        </div>
        {athleteName && (
          <span className="text-white/40 text-sm font-medium">· {athleteName}</span>
        )}
      </div>

      {/* Giant Timer */}
      <div className="flex-shrink-0 flex flex-col items-center pt-2">
        <div
          className={`font-mono font-black leading-none ${
            workTimeLeft <= 5
              ? 'text-red-500 animate-pulse'
              : 'text-white'
          }`}
          style={{ fontSize: 'clamp(4rem, 15vh, 10rem)' }}
        >
          {formatTime(workTimeLeft)}
        </div>
        <div className="text-3xl md:text-4xl font-bold text-yellow-400 mt-1 tracking-wider">
          HITS: {String(hits).padStart(2, '0')}
        </div>
      </div>

      {/* Stimulus circle */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 'clamp(150px, 35vmin, 320px)',
            height: 'clamp(150px, 35vmin, 320px)',
            ...getStimulusStyle(),
          }}
        >
          {hitFeedback ? (
            <span
              className="font-black font-mono text-center leading-none text-white"
              style={{ fontSize: 'clamp(1.5rem, 6vmin, 3rem)' }}
            >
              {hitFeedback.value}
            </span>
          ) : (
            <>
              {isCognitive && stimulusActive && stimulusColor === 'green' && (
                <Check className="w-16 h-16 text-white" strokeWidth={3} />
              )}
              {isCognitive && stimulusActive && stimulusColor === 'red' && (
                <X className="w-16 h-16 text-white" strokeWidth={3} />
              )}
            </>
          )}
        </div>

        {/* Commission error feedback */}
        {showFault && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <span
              className="text-5xl md:text-7xl font-black text-red-500 animate-pulse"
              style={{ textShadow: '0 0 30px rgba(255,0,0,0.6)' }}
            >
              FALTA!
            </span>
          </div>
        )}

        {/* Reaction time feedback */}
        <div className="h-12 flex items-center justify-center">
          {showReactionTime && displayedTime !== null && (
            <span
              className="text-2xl md:text-3xl font-black text-green-400 animate-fade-in"
              style={{
                opacity: showReactionTime ? 1 : 0,
                transition: 'opacity 0.3s ease-out',
              }}
            >
              {displayedTime}ms
            </span>
          )}
        </div>
      </div>

      {/* Live Stats Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-black/60 backdrop-blur-md border-t border-white/10 py-4 z-20">
        <div className="grid grid-cols-3 text-center">
          {/* Último */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
              Último
            </div>
            <div
              className={`text-xl md:text-2xl font-black ${
                lastReactionTime !== null && lastReactionTime < 500
                  ? 'text-green-400'
                  : 'text-white'
              }`}
            >
              {lastReactionTime !== null ? `${lastReactionTime}ms` : '--'}
            </div>
          </div>
          {/* Média */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
              Média
            </div>
            <div className="text-xl md:text-2xl font-black text-white">
              {avgTime !== null ? `${avgTime}ms` : '--'}
            </div>
          </div>
          {/* 3rd column: Melhor or FALTAS */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
              {isCognitive ? 'Faltas' : 'Melhor'}
            </div>
            <div className={`text-xl md:text-2xl font-black ${isCognitive ? 'text-red-400' : 'text-yellow-400'}`}>
              {isCognitive
                ? commissionErrors
                : bestTime !== null ? `${bestTime}ms` : '--'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
