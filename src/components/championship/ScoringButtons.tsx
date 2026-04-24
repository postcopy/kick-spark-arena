import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MatchState, MatchSide, ScoreType, formatTime } from '@/types/championship';
import { cn } from '@/lib/utils';
import { Plus, Minus, Undo2 } from 'lucide-react';

/**
 * ScoringButtons — operator input (mesa).
 *
 * Design per spe-ui-design skill §3.2 + §P2 (honestidade técnica):
 *  - AUTO (PSS detecta): CORPO, CABEÇA → borda da cor do atleta.
 *  - MANUAL (operador julga): SOCO, GIRO → borda DOURADA + label "M".
 *    EngFlex não detecta essas técnicas; operador marca manualmente.
 *  - Atalhos de teclado visíveis no canto inferior.
 *  - Sem rounded-lg em botões de ação crítica — retangular, broadcast.
 *  - 1 clique = ponto. Redução de clique sob pressão (P8).
 */
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
  /** Se true, não é detectado pelo PSS — operador julga. */
  manual: boolean;
  getValue: (scoring: MatchState['config']['scoring']) => number;
}

const SCORE_BUTTONS: ScoreButton[] = [
  { type: 'PUNCH',     label: 'SOCO',   manual: true,  getValue: (s) => s.punch },
  { type: 'BODY',      label: 'CORPO',  manual: false, getValue: (s) => s.body },
  { type: 'HEAD',      label: 'CABEÇA', manual: false, getValue: (s) => s.head },
  { type: 'SPIN_BODY', label: 'GIRO',   manual: true,  getValue: (s) => s.spinBody },
];

const BLUE_KEYS = ['Q', 'W', 'E', 'R'];
const RED_KEYS  = ['U', 'I', 'O', 'P'];

function GamjeomCount({ count }: { count: number }) {
  return (
    <span
      className={cn(
        'text-xl font-black tabular-nums min-w-[2ch] text-center tracking-tight',
        count === 0 && 'text-white/40',
        count >= 1 && count <= 2 && 'text-white',
        count >= 3 && count <= 4 && 'text-wt-warning',
        count >= 5 && 'text-wt-danger animate-pulse',
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
    const sideLabel = isBlue ? 'CHUNG' : 'HONG';
    const sideColor = isBlue ? 'bg-chung' : 'bg-hong';
    const sideBorder = isBlue ? 'border-chung' : 'border-hong';
    const sideHover = isBlue ? 'hover:bg-chung-accent' : 'hover:bg-hong-accent';

    return (
      <div className="flex flex-col gap-2">
        {/* Side header — retangular, cor sólida da lateral */}
        <div className={cn(
          'flex items-center justify-between px-3 py-1.5',
          isBlue ? 'bg-chung-bg' : 'bg-hong-bg',
        )}>
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white">
            {sideLabel}
          </span>
          <span className={cn(
            'text-[10px] font-semibold tracking-widest',
            isBlue ? 'text-chung-accent' : 'text-hong-accent',
          )}>
            PONTUAÇÃO
          </span>
        </div>

        {/* Scoring buttons — BODY/HEAD bigger (higher frequency) */}
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: '0.7fr 1.3fr 1.3fr 0.9fr' }}
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
                title={btn.manual
                  ? `${btn.label} — MANUAL (EngFlex não detecta automaticamente)`
                  : `${btn.label} — automático via PSS`}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0 rounded-none',
                  'text-white font-medium transition-all border-2',
                  'disabled:opacity-35 disabled:cursor-not-allowed',
                  isBig ? 'h-20 lg:h-24' : 'h-16 lg:h-20',
                  // AUTO buttons: borda da cor do lado
                  !btn.manual && cn(sideColor, sideBorder, sideHover, 'active:scale-[0.97]'),
                  // MANUAL buttons: borda dourada, fundo mais escuro
                  btn.manual && cn(
                    isBlue ? 'bg-chung-bg active:bg-chung' : 'bg-hong-bg active:bg-hong',
                    'border-wt-manual hover:border-wt-manual active:scale-[0.97]',
                  ),
                )}
              >
                {/* MANUAL indicator — canto superior direito */}
                {btn.manual && (
                  <span className="absolute top-1 right-1.5 text-[9px] font-black tracking-wider text-wt-manual">
                    M
                  </span>
                )}

                <span className={cn(
                  'font-black leading-none tabular-nums tracking-tight',
                  isBig ? 'text-4xl' : 'text-3xl',
                )}>
                  +{value}
                </span>
                <span className={cn(
                  'font-bold leading-tight uppercase mt-1 tracking-wider',
                  isBig ? 'text-sm' : 'text-xs',
                )}>
                  {btn.label}
                </span>

                {/* Keyboard shortcut */}
                <span className="absolute bottom-1 left-1.5 text-[9px] font-mono font-semibold text-white/40">
                  [{keys[i]}]
                </span>

                {isFlashing && (
                  <div className="absolute inset-0 bg-white/30 animate-[flash_0.3s_ease-out_forwards] pointer-events-none" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Gam-jeom row — ação crítica, destacada */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 border',
          isBlue ? 'bg-chung-bg/60 border-chung/30' : 'bg-hong-bg/60 border-hong/30',
        )}>
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.25em]">
            GAM-JEOM
          </span>

          <GamjeomCount count={gamjeomCount} />

          <div className="flex-1" />

          {/* Remove — outline */}
          <button
            onClick={() => onRemoveGamjeom(side)}
            disabled={isRunning || gamjeomCount <= 0}
            className={cn(
              'h-9 w-9 flex items-center justify-center transition-all',
              'border text-white/70 hover:text-white hover:bg-white/10',
              'disabled:opacity-25 disabled:cursor-not-allowed',
              isBlue ? 'border-chung/50' : 'border-hong/50',
            )}
            title="Remover gam-jeom"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Add — filled */}
          <button
            onClick={() => onAddGamjeom(side)}
            disabled={!isRunning}
            className={cn(
              'h-9 px-4 flex items-center gap-2 transition-all font-bold text-sm',
              'text-white active:scale-95',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              isBlue ? 'bg-chung hover:bg-chung-accent' : 'bg-hong hover:bg-hong-accent',
            )}
            title="Adicionar gam-jeom"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[10px] font-mono font-semibold text-white/60 tracking-wider">
              [{isBlue ? 'F1' : 'F2'}]
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-wt-divider p-3 bg-wt-bg-secondary">
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: '1fr 88px 1fr' }}
      >
        {renderPanel('BLUE')}

        {/* Center — timer + undo */}
        <div className="flex flex-col items-center justify-center gap-2 bg-black mx-1">
          <span className="text-2xl font-black text-white tabular-nums leading-none">
            {formatTime(state.timeLeftMs)}
          </span>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 transition-all text-[10px] font-bold tracking-wider uppercase',
              'text-white/60 hover:text-white hover:bg-white/10 border border-white/20',
              'disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:text-white/60 disabled:hover:bg-transparent',
            )}
            title="Desfazer última ação"
          >
            <Undo2 className="h-3 w-3" />
            Desfazer
          </button>
        </div>

        {renderPanel('RED')}
      </div>
    </div>
  );
}
