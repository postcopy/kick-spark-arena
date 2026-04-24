import { MatchState, formatTime } from '@/types/championship';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

/**
 * ScoreboardMain — operator view (mesa).
 *
 * Design conforme spe-ui-design skill §3.1:
 *  - Split 50/50 vertical (CHUNG esq, HONG dir).
 *  - Fundo escuro não saturado (--chung-bg / --hong-bg).
 *  - Números em font display condensada bold, retangular (sem rounded).
 *  - Zero gradiente decorativo, zero text-shadow cosmético.
 *  - Tipografia broadcast: hierarquia de tamanho como única ênfase.
 *  - Highlight de liderança via cor do número (branco→chung/hong-accent),
 *    nunca amarelo genérico "bingo".
 */
interface ScoreboardMainProps {
  state: MatchState;
  onResetMatch?: () => void;
}

export function ScoreboardMain({ state, onResetMatch }: ScoreboardMainProps) {
  const isRunning = state.status === 'RUNNING';
  const isMedical = state.isMedicalTime;
  const isMatchEnd = state.status === 'MATCH_END';

  const winnerSide: 'RED' | 'BLUE' | null =
    state.roundWinsRed > state.roundWinsBlue ? 'RED'
    : state.roundWinsBlue > state.roundWinsRed ? 'BLUE'
    : null;
  const winnerName = winnerSide === 'RED' ? state.config.athleteRed?.name || 'HONG'
    : winnerSide === 'BLUE' ? state.config.athleteBlue?.name || 'CHUNG'
    : 'EMPATE';

  const renderRoundIndicators = (wins: number, maxRounds: number) => {
    const needed = maxRounds === 1 ? 1 : 2;
    return Array.from({ length: needed }).map((_, i) => (
      <span key={i} className="text-xl leading-none">{i < wins ? '●' : '○'}</span>
    ));
  };

  return (
    <div className="h-full flex items-stretch gap-[2px] bg-black p-[2px] relative font-display">
      {/* ─── MATCH END Overlay ─── */}
      {isMatchEnd && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
          <div className="text-center space-y-8 px-8">
            <div className="text-xs font-semibold tracking-[0.4em] text-white/60 uppercase">Luta encerrada</div>
            <div className={cn(
              "text-7xl font-black uppercase tracking-tight leading-none",
              winnerSide === 'RED' ? "text-[hsl(var(--hong-accent))]"
              : winnerSide === 'BLUE' ? "text-[hsl(var(--chung-accent))]"
              : "text-white"
            )}>
              {winnerSide ? winnerName : 'EMPATE'}
            </div>
            <div className="text-white/70 text-base tabular-nums tracking-wider">
              CHUNG {state.roundWinsBlue} — {state.roundWinsRed} HONG
            </div>
            {onResetMatch && (
              <Button
                onClick={onResetMatch}
                className="h-12 px-8 bg-white text-black hover:bg-white/90 font-bold uppercase tracking-wider rounded-none"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Nova luta
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ─── CHUNG (Blue) ─── */}
      <AthleteColumn
        side="BLUE"
        athlete={state.config.athleteBlue}
        score={state.roundScoreBlue}
        leading={state.roundScoreBlue > state.roundScoreRed}
        gamjeom={state.gamjeomBlue}
        hits={state.hitsBlue}
        roundWins={state.roundWinsBlue}
        maxRounds={state.config.maxRounds}
        renderRoundIndicators={renderRoundIndicators}
      />

      {/* ─── CENTER (Timer + Round + Match #) ─── */}
      <div className="w-60 flex flex-col bg-[hsl(var(--wt-bg-secondary))]">
        {/* Match number */}
        <div className="flex-1 flex flex-col items-center justify-center border-b border-[hsl(var(--wt-divider))]">
          <span className="text-[11px] font-semibold tracking-[0.3em] text-white/50 uppercase">Luta</span>
          <span className="text-3xl font-black text-white tabular-nums mt-1">
            {state.config.matchNumber || '001'}
          </span>
        </div>

        {/* Timer — central, retangular, alto contraste */}
        <div className={cn(
          "h-28 flex items-center justify-center border-y-2",
          state.isBreakTime ? "bg-[hsl(var(--wt-bg-tertiary))] border-[hsl(var(--wt-divider))]"
          : isMedical ? "bg-[hsl(var(--wt-warning))] border-[hsl(var(--wt-warning))]"
          : state.timeLeftMs <= 5000 && isRunning ? "bg-[hsl(var(--wt-danger))] border-[hsl(var(--wt-danger))]"
          : state.isGoldenRound ? "bg-[hsl(var(--wt-manual))] border-[hsl(var(--wt-manual))]"
          : "bg-white border-white"
        )}>
          <div className={cn(
            "text-[88px] font-black leading-none tabular-nums tracking-tight",
            state.isBreakTime ? "text-white"
            : isMedical ? "text-black"
            : state.timeLeftMs <= 5000 && isRunning ? "text-white animate-[timer-blink-fast_0.25s_ease-in-out_infinite]"
            : state.timeLeftMs <= 10000 && isRunning ? "text-black animate-[timer-blink_0.5s_ease-in-out_infinite]"
            : state.isGoldenRound ? "text-black"
            : "text-black"
          )}>
            {state.isBreakTime ? formatTime(state.breakTimeLeftMs || 0) : formatTime(state.timeLeftMs)}
          </div>
        </div>

        {/* Status line */}
        <div className="h-8 flex items-center justify-center">
          {state.isBreakTime && !isMatchEnd && (
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">Intervalo</span>
          )}
          {!state.isBreakTime && !isRunning && !isMatchEnd && (
            <span className={cn(
              "text-xs font-bold uppercase tracking-[0.25em]",
              isMedical ? "text-[hsl(var(--wt-warning))] animate-pulse" : "text-white/70 animate-pulse"
            )}>
              {isMedical ? 'Tempo médico' : 'Pausado'}
            </span>
          )}
          {isRunning && !state.isBreakTime && (
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[hsl(var(--wt-success))]">Em luta</span>
          )}
        </div>

        {/* Round */}
        <div className="flex-1 flex flex-col items-center justify-center border-t border-[hsl(var(--wt-divider))]">
          {state.isGoldenRound ? (
            <>
              <span className="text-[11px] font-bold tracking-[0.3em] text-[hsl(var(--wt-manual))] uppercase">Golden</span>
              <span className="text-4xl font-black text-[hsl(var(--wt-manual))] mt-0.5">ROUND</span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-semibold tracking-[0.3em] text-white/50 uppercase">Round</span>
              <span className="text-5xl font-black text-white tabular-nums mt-0.5">{state.round}</span>
            </>
          )}
        </div>
      </div>

      {/* ─── HONG (Red) ─── */}
      <AthleteColumn
        side="RED"
        athlete={state.config.athleteRed}
        score={state.roundScoreRed}
        leading={state.roundScoreRed > state.roundScoreBlue}
        gamjeom={state.gamjeomRed}
        hits={state.hitsRed}
        roundWins={state.roundWinsRed}
        maxRounds={state.config.maxRounds}
        renderRoundIndicators={renderRoundIndicators}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

interface AthleteColumnProps {
  side: 'BLUE' | 'RED';
  athlete?: { id: string; name: string; country?: string };
  score: number;
  leading: boolean;
  gamjeom: number;
  hits: number;
  roundWins: number;
  maxRounds: 1 | 3;
  renderRoundIndicators: (wins: number, maxRounds: number) => React.ReactNode;
}

function AthleteColumn({
  side, athlete, score, leading, gamjeom, hits, roundWins, maxRounds, renderRoundIndicators,
}: AthleteColumnProps) {
  const isBlue = side === 'BLUE';
  const labelSide = isBlue ? 'CHUNG' : 'HONG';
  const defaultName = isBlue ? 'CHUNG' : 'HONG';
  const accentVar = isBlue ? 'var(--chung-accent)' : 'var(--hong-accent)';
  const bgVar = isBlue ? 'var(--chung-bg)' : 'var(--hong-bg)';

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: `hsl(${bgVar})` }}
    >
      {/* Top stripe — cor do lado, 6px, única ornamentação estrutural */}
      <div
        className="h-[6px] w-full"
        style={{ backgroundColor: `hsl(${isBlue ? 'var(--chung)' : 'var(--hong)'})` }}
      />

      {/* Header: label + name + country */}
      <div className={cn("px-6 pt-4 pb-3", isBlue ? "text-left" : "text-right")}>
        <div className={cn("flex items-center gap-3", !isBlue && "justify-end")}>
          <div className="text-[11px] font-bold tracking-[0.35em] text-white/70">{labelSide}</div>
          {leading && (
            <div className="text-[9px] font-bold tracking-[0.25em] text-black bg-white px-2 py-[2px]">
              LIDERA
            </div>
          )}
        </div>
        <div className="text-[22px] font-bold text-white truncate leading-tight mt-1 uppercase tracking-wide">
          {athlete?.name || defaultName}
        </div>
        {athlete?.country && (
          <div className="text-[11px] font-mono text-white/60 mt-0.5 tracking-[0.15em]">
            {athlete.country}
          </div>
        )}
      </div>

      {/* Score — broadcast hero number */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="font-black tabular-nums leading-none"
          style={{
            fontSize: 'clamp(120px, 22vw, 280px)',
            letterSpacing: '-0.05em',
            color: leading ? `hsl(${accentVar})` : '#FFFFFF',
          }}
        >
          {score}
        </div>
      </div>

      {/* Footer stats — retangular, sem rounded, divisor sutil */}
      <div className="h-24 grid grid-cols-3 bg-black/40">
        <StatCell label="GAM-JEOM" value={gamjeom} highlight={gamjeom >= 3} />
        <StatCell label="ROUNDS" custom={
          <div className="flex gap-1.5 text-white">{renderRoundIndicators(roundWins, maxRounds)}</div>
        } />
        <StatCell label="GOLPES" value={hits} />
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight, custom }: {
  label: string; value?: number; highlight?: boolean; custom?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border-l border-white/10 first:border-l-0">
      <div className="text-[10px] font-bold tracking-[0.25em] text-white/60 uppercase">{label}</div>
      {custom ?? (
        <div className={cn(
          "font-black tabular-nums text-[28px] leading-tight mt-1",
          highlight ? "text-[hsl(var(--wt-warning))]"
          : value === 0 ? "text-white/40"
          : "text-white"
        )}>
          {value}
        </div>
      )}
    </div>
  );
}
