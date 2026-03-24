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
  { type: 'HEAD',      label: 'CABEÇA', getValue: (s) => s.head },
  { type: 'SPIN_BODY', label: 'GIRO',   getValue: (s) => s.spinBody },
];

const BLUE_KEYS = ['1', '2', '3', '4'];
const RED_KEYS  = ['\u21e71', '\u21e72', '\u21e73', '\u21e74'];

function GamjeomCount({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'text-sm font-bold tabular-nums min-w-[1.5ch] text-center',
        count === 0 && 'text-white/50',
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

  // Cleanup flash timeout on unmount
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
        {/* Scoring buttons grid */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: '0.8fr 1.2fr 1.2fr 1fr' }}
        >
          {SCORE_BUTTONS.map((btn, i) => {
            const value = btn.getValue(scoring);
            const key: FlashKey = `${side}-${btn.type}`;
            const isFlashing = flashKey === key;

            return (
              <Button
                key={key}
                onClick={() => handleScore(side, btn.type)}
                disabled={!isRunning}
                className={cn(
                  'relative h-14 lg:h-16 flex flex-col items-center justify-center gap-0.5 rounded-lg',
                  'text-white font-medium transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isBlue
                    ? 'bg-blue-700 hover:bg-blue-600 active:bg-blue-500 active:scale-95'
                    : 'bg-red-700 hover:bg-red-600 active:bg-red-500 active:scale-95',
                )}
              >
                <span className="text-2xl font-black leading-none">+{value}</span>
                <span className="text-xs font-medium leading-none">{btn.label}</span>
                <span className="text-[9px] text-white/30 font-mono leading-none">
                  {keys[i]}
                </span>

                {/* Click flash overlay */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white/30 animate-[flash_0.3s_ease-out_forwards] rounded-lg pointer-events-none" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Gam-jeom row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
              GAM-JEOM
            </span>
            <GamjeomCount count={gamjeomCount} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveGamjeom(side)}
              disabled={!isRunning || gamjeomCount <= 0}
              className="h-10 w-10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddGamjeom(side)}
              disabled={!isRunning}
              className="h-10 w-10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </Button>

            <span className="text-[9px] text-zinc-600 font-mono">
              {isBlue ? 'F1' : 'F2'}
            </span>
          </div>

          {/* Undo button per side */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-400 transition-colors',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-500',
            )}
          >
            <Undo2 className="h-3 w-3" />
            DESFAZER
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-zinc-700 p-4 bg-zinc-900/50">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: '1fr 48px 1fr' }}
      >
        {/* Blue panel */}
        {renderPanel('BLUE')}

        {/* Center divider with timer */}
        <div className="flex flex-col items-center justify-center border-x border-zinc-700">
          <span className="text-lg font-mono text-zinc-300 tabular-nums">
            {formatTime(state.timeLeftMs)}
          </span>
        </div>

        {/* Red panel */}
        {renderPanel('RED')}
      </div>
    </div>
  );
}
