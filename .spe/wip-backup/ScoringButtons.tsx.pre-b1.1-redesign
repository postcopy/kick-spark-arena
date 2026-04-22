import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MatchState, MatchSide, ScoreType, formatTime } from '@/types/championship';
import { cn } from '@/lib/utils';
import { Plus, Minus, Undo2 } from 'lucide-react';

interface ScoringButtonsProps {
  state: MatchState;
  onScore: (side: MatchSide, type: ScoreType) => void;
  onAddGamjeom: (side: MatchSide) => void;
  onRemoveGamjeom: (side: MatchSide) => void;
  onUndo: () => void;
  canUndo: boolean;
}

type FlashKey = `${MatchSide}-${ScoreType}`;

interface ScoreButton {
  type: ScoreType;
  label: string;
  getValue: (scoring: MatchState['config']['scoring']) => number;
}

const SCORE_BUTTONS: ScoreButton[] = [
  { type: 'PUNCH',     label: 'SOCO',   getValue: (s) => s.punch },
  { type: 'BODY',      label: 'CORPO',  getValue: (s) => s.body },
  { type: 'HEAD',      label: 'CABECA', getValue: (s) => s.head },
  { type: 'SPIN_BODY', label: 'GIRO',   getValue: (s) => s.spinBody },
];

const BLUE_KEYS = ['1', '2', '3', '4'];
const RED_KEYS  = ['\u21e71', '\u21e72', '\u21e73', '\u21e74'];

function GamjeomCount({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'text-lg font-black tabular-nums min-w-[2ch] text-center',
        count === 0 && 'text-white/40',
        count >= 1 && count <= 2 && 'text-white',
        count >= 3 && count <= 4 && 'text-yellow-400',
        count >= 5 && 'text-red-400 animate-pulse',
      )}
    >
      {count}
    </span>
  );
}

export function ScoringButtons({
  state,
  onScore,
  onAddGamjeom,
  onRemoveGamjeom,
  onUndo,
  canUndo,
}: ScoringButtonsProps) {
  const isRunning = state.status === 'RUNNING';
  const { scoring } = state.config;

  const [flashKey, setFlashKey] = useState<FlashKey | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleScore = useCallback(
    (side: MatchSide, type: ScoreType) => {
      onScore(side, type);
      const key: FlashKey = `${side}-${type}`;
      setFlashKey(key);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashKey((prev) => (prev === key ? null : prev)), 300);
    },
    [onScore],
  );

  const renderPanel = (side: MatchSide) => {
    const isBlue = side === 'BLUE';
    const keys = isBlue ? BLUE_KEYS : RED_KEYS;
    const gamjeomCount = isBlue ? state.gamjeomBlue : state.gamjeomRed;

    return (
      <div className="flex flex-col gap-2">
        {/* Side label */}
        <div className={cn(
          'text-center py-1 rounded-t-lg text-xs font-bold uppercase tracking-widest',
          isBlue ? 'bg-blue-800/50 text-blue-300' : 'bg-red-800/50 text-red-300',
        )}>
          {isBlue ? 'PONTUACAO AZUL' : 'PONTUACAO VERMELHO'}
        </div>

        {/* Scoring buttons — CORPO and CABECA are bigger */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: '0.6fr 1.3fr 1.3fr 0.8fr' }}
        >
          {SCORE_BUTTONS.map((btn, i) => {
            const value = btn.getValue(scoring);
            const key: FlashKey = `${side}-${btn.type}`;
            const isFlashing = flashKey === key;
            const isBig = btn.type === 'BODY' || btn.type === 'HEAD';

            return (
              <Button
                key={key}
                onClick={() => handleScore(side, btn.type)}
                disabled={!isRunning}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 rounded-lg',
                  'text-white font-medium transition-all',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  isBig ? 'h-16 lg:h-20' : 'h-14 lg:h-16',
                  isBlue
                    ? 'bg-blue-700 hover:bg-blue-600 active:bg-blue-500 active:scale-95'
                    : 'bg-red-700 hover:bg-red-600 active:bg-red-500 active:scale-95',
                )}
              >
                <span className={cn('font-black leading-none', isBig ? 'text-3xl' : 'text-2xl')}>
                  +{value}
                </span>
                <span className={cn('font-semibold leading-none', isBig ? 'text-sm' : 'text-xs')}>
                  {btn.label}
                </span>
                <span className="text-[9px] text-white/25 font-mono leading-none">
                  {keys[i]}
                </span>

                {isFlashing && (
                  <div className="absolute inset-0 bg-white/30 animate-[flash_0.3s_ease-out_forwards] rounded-lg pointer-events-none" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Gam-jeom row — colored buttons */}
        <div className={cn(
          'flex items-center gap-3 px-2 py-1.5 rounded-lg',
          isBlue ? 'bg-blue-950/40' : 'bg-red-950/40',
        )}>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
            GAM-JEOM
          </span>

          <GamjeomCount count={gamjeomCount} />

          {/* Remove button — outline style */}
          <button
            onClick={() => onRemoveGamjeom(side)}
            disabled={isRunning || gamjeomCount <= 0}
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center transition-all',
              'border-2 disabled:opacity-30 disabled:cursor-not-allowed',
              isBlue
                ? 'border-blue-500/50 text-blue-400 hover:bg-blue-800/50 hover:border-blue-400'
                : 'border-red-500/50 text-red-400 hover:bg-red-800/50 hover:border-red-400',
            )}
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Add button — filled with side color + key hint inside */}
          <button
            onClick={() => onAddGamjeom(side)}
            disabled={!isRunning}
            className={cn(
              'h-9 px-3 rounded-full flex items-center gap-1.5 transition-all font-bold text-sm',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              isBlue
                ? 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-400'
                : 'bg-red-600 text-white hover:bg-red-500 active:bg-red-400',
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="text-[9px] font-mono text-white/50">{isBlue ? 'F1' : 'F2'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-zinc-700 p-3 bg-zinc-900/50">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: '1fr 80px 1fr' }}
      >
        {/* Blue panel */}
        {renderPanel('BLUE')}

        {/* Center divider — timer + undo */}
        <div className="flex flex-col items-center justify-center gap-2 bg-zinc-950 rounded-lg mx-1">
          <span className="text-xl font-mono font-bold text-amber-400 tabular-nums">
            {formatTime(state.timeLeftMs)}
          </span>

          {/* Single undo button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all',
              'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800',
              'disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:text-zinc-500 disabled:hover:bg-transparent',
            )}
          >
            <Undo2 className="h-3 w-3" />
            DESFAZER
          </button>
        </div>

        {/* Red panel */}
        {renderPanel('RED')}
      </div>
    </div>
  );
}
