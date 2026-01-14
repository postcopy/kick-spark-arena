import { cn } from '@/lib/utils';
import { RhythmBar } from './RhythmBar';
import type { Side } from '@/types/game';
import { Check, AlertTriangle } from 'lucide-react';

interface IronRhythmPanelProps {
  side: Side;
  totalKicks: number;
  kicksInWindow: number;
  targetKicks: number;
  uptimeMs: number;
  isOnPace: boolean;
  isFlashing: boolean;
  showControls?: boolean;
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function IronRhythmPanel({
  side,
  totalKicks,
  kicksInWindow,
  targetKicks,
  uptimeMs,
  isOnPace,
  isFlashing,
  showControls = true,
}: IronRhythmPanelProps) {
  const isRed = side === 'red';
  const percentage = kicksInWindow / targetKicks;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center h-full transition-all duration-100 p-8',
        isRed ? 'bg-[#E10000]' : 'bg-[#0066FF]',
        isFlashing && 'brightness-150'
      )}
    >
      {/* Flash overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-white pointer-events-none transition-opacity duration-100',
          isFlashing ? 'opacity-30' : 'opacity-0'
        )}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Status indicator */}
        <div
          className={cn(
            'flex items-center gap-3 px-6 py-3 rounded-full mb-8 transition-all',
            isOnPace
              ? 'bg-green-500/30 border-2 border-green-400'
              : 'bg-yellow-500/30 border-2 border-yellow-400'
          )}
        >
          {isOnPace ? (
            <Check className="w-8 h-8 text-green-300" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-yellow-300" />
          )}
          <span
            className={cn(
              'text-3xl font-bold uppercase tracking-wider',
              isOnPace ? 'text-green-300' : 'text-yellow-300'
            )}
          >
            {isOnPace ? 'EM RITMO' : 'CAINDO'}
          </span>
        </div>

        {/* Rhythm bar */}
        <div className="w-full mb-6">
          <div className="flex justify-between text-white/70 mb-2 text-lg">
            <span>Ritmo</span>
            <span>{kicksInWindow}/{targetKicks}</span>
          </div>
          <RhythmBar percentage={percentage} isOnPace={isOnPace} />
        </div>

        {/* Uptime display */}
        <div className="text-center mb-6">
          <div className="text-2xl text-white/70 uppercase tracking-wider mb-1">
            Tempo em Ritmo
          </div>
          <div className="text-7xl font-bold text-white tabular-nums">
            {formatUptime(uptimeMs)}
          </div>
        </div>

        {/* Total kicks */}
        <div className="text-center">
          <span className="text-5xl font-bold text-white/90">{totalKicks}</span>
          <span className="text-xl text-white/60 ml-2">chutes totais</span>
        </div>

        {/* Key hint */}
        {showControls && (
          <div className="mt-8 px-6 py-3 rounded-lg bg-white/10 border border-white/20">
            <span className="text-xl font-mono font-bold text-white/80">
              Press {isRed ? 'A' : 'L'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
