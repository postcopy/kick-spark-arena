import { ArrowLeft } from 'lucide-react';
import type { useReactionState } from '@/hooks/useReactionState';
import { useEffect, useState } from 'react';

interface ReactionScreenProps {
  reactionState: ReturnType<typeof useReactionState>;
  onBack: () => void;
}

export function ReactionScreen({ reactionState, onBack }: ReactionScreenProps) {
  const {
    currentRound,
    totalRounds,
    workTimeLeft,
    isResting,
    restTimeLeft,
    stimulusActive,
    lastReactionTime,
    reactionTimes,
  } = reactionState;

  // Fade out reaction time display after 2s
  const [showReactionTime, setShowReactionTime] = useState(false);
  const [displayedTime, setDisplayedTime] = useState<number | null>(null);

  useEffect(() => {
    if (lastReactionTime !== null) {
      setDisplayedTime(lastReactionTime);
      setShowReactionTime(true);
      const timer = window.setTimeout(() => setShowReactionTime(false), 2000);
      return () => window.clearTimeout(timer);
    }
  }, [lastReactionTime]);

  // Computed stats
  const hits = reactionTimes.length;
  const sum = reactionTimes.reduce((a, b) => a + b, 0);
  const avgTime = hits > 0 ? Math.round(sum / hits) : null;
  const bestTime = hits > 0 ? Math.min(...reactionTimes) : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isResting) {
    return (
      <div className="h-full w-full flex flex-col bg-blue-950">
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
          <div className="text-[clamp(80px,22vw,200px)] font-black text-white animate-pulse">
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
    <div className="h-full w-full flex flex-col bg-slate-950 pb-24">
      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-center px-4 py-3 bg-black/30">
        <div className="text-white/80 font-bold text-lg tracking-wider uppercase">
          Round {currentRound}/{totalRounds}
        </div>
      </div>

      {/* Giant Timer */}
      <div className="flex-shrink-0 flex flex-col items-center pt-2">
        <div
          className={`font-mono font-black leading-none ${
            workTimeLeft <= 5
              ? 'text-red-500 animate-pulse'
              : 'text-white'
          }`}
          style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}
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
          className="rounded-full transition-none"
          style={{
            width: 'clamp(180px, 40vw, 350px)',
            height: 'clamp(180px, 40vw, 350px)',
            backgroundColor: stimulusActive ? '#39FF14' : '#1e293b',
            boxShadow: stimulusActive
              ? '0 0 60px 20px rgba(57,255,20,0.4), 0 0 120px 40px rgba(57,255,20,0.15)'
              : 'inset 0 0 40px rgba(0,0,0,0.5)',
          }}
        />

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
          {/* Melhor */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-widest mb-1">
              Melhor
            </div>
            <div className="text-xl md:text-2xl font-black text-yellow-400">
              {bestTime !== null ? `${bestTime}ms` : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
