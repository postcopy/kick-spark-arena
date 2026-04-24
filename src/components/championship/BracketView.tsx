// Bracket View — chaveamento single-elim pra TV e preview de setup.
//
// spe-ui-design §P1/§P3: retangular, sem glow, sem pulse decorativo.
// Current match: stripe lateral 1px (wt-manual), sem ring colorido ruidoso.
// Vencedor: atleta vencedor em cor sólida; perdedor opacidade 40%.

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { BracketMatch, Category } from '@/types/tournament';

interface BracketViewProps {
  category: Category;
  currentMatchId?: string;
  compact?: boolean; // for preview in setup page
}

interface RoundColumn {
  round: number;
  matches: BracketMatch[];
  label: string;
}

function getRoundLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'FINAL';
  if (round === totalRounds - 1) return 'SEMIFINAL';
  if (round === totalRounds - 2) return 'QUARTAS';
  return `ROUND ${round}`;
}

export function BracketView({ category, currentMatchId, compact = false }: BracketViewProps) {
  const rounds = useMemo(() => {
    if (category.bracket.length === 0) return [];

    const maxRound = Math.max(...category.bracket.map(m => m.round));
    const columns: RoundColumn[] = [];

    for (let r = 1; r <= maxRound; r++) {
      const matches = category.bracket
        .filter(m => m.round === r)
        .sort((a, b) => a.position - b.position);
      columns.push({
        round: r,
        matches,
        label: getRoundLabel(r, maxRound),
      });
    }
    return columns;
  }, [category.bracket]);

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-wt-fg-muted text-sm uppercase tracking-[0.3em]">
        Nenhuma chave gerada
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col font-display">
      {/* Category Title */}
      <div className="text-center mb-5 border-b border-wt-divider pb-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-wt-fg-muted mb-1">
          Categoria
        </div>
        <h2 className={cn(
          'font-black text-wt-fg-primary uppercase tracking-tight leading-none',
          compact ? 'text-xl' : 'text-3xl',
        )}>
          {category.name}
        </h2>
      </div>

      {/* Bracket Grid */}
      <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden px-4">
        <div className="flex gap-10 mx-auto min-w-max">
          {rounds.map((col) => (
            <div key={col.round} className="flex flex-col items-center">
              {/* Round Label */}
              <div className={cn(
                'mb-4 font-bold text-wt-fg-muted uppercase tracking-[0.35em]',
                compact ? 'text-[9px]' : 'text-[10px]',
              )}>
                {col.label}
              </div>

              {/* Matches */}
              <div
                className="flex flex-col justify-around flex-1"
                style={{ gap: `${Math.pow(2, col.round - 1) * (compact ? 8 : 12)}px` }}
              >
                {col.matches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isCurrent={match.id === currentMatchId}
                    compact={compact}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  isCurrent,
  compact,
}: {
  match: BracketMatch;
  isCurrent: boolean;
  compact: boolean;
}) {
  const isFinished = match.status === 'FINISHED';
  const isBye = match.status === 'BYE';
  const width = compact ? 'w-44' : 'w-56';

  return (
    <div
      className={cn(
        'relative border bg-wt-bg-secondary overflow-hidden transition-colors',
        width,
        isCurrent ? 'border-wt-manual/70' : 'border-wt-divider',
        isBye && 'opacity-40',
      )}
    >
      {/* Current indicator — stripe lateral 1px, sem pulse */}
      {isCurrent && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-wt-manual" />
      )}

      {/* Match number */}
      <div
        className={cn(
          'flex items-center justify-between px-2 border-b border-wt-divider',
          compact ? 'py-1 text-[9px]' : 'py-1.5 text-[10px]',
          'font-bold uppercase tracking-[0.3em] tabular-nums',
          isCurrent
            ? 'bg-wt-manual/10 text-wt-manual'
            : 'bg-wt-bg text-wt-fg-muted',
        )}
      >
        <span>{isBye ? 'BYE' : `Luta ${String(match.matchNumber).padStart(3, '0')}`}</span>
        {isCurrent && <span className="text-wt-manual">• AO VIVO</span>}
      </div>

      {/* Red (HONG) athlete */}
      <AthleteRow
        side="hong"
        name={match.athleteRed?.name}
        isWinner={isFinished && match.winnerSide === 'RED'}
        isLoser={isFinished && match.winnerSide !== 'RED'}
        compact={compact}
      />

      {/* Divider */}
      <div className="h-px bg-wt-divider" />

      {/* Blue (CHUNG) athlete */}
      <AthleteRow
        side="chung"
        name={match.athleteBlue?.name}
        isWinner={isFinished && match.winnerSide === 'BLUE'}
        isLoser={isFinished && match.winnerSide !== 'BLUE'}
        compact={compact}
      />
    </div>
  );
}

function AthleteRow({
  side,
  name,
  isWinner,
  isLoser,
  compact,
}: {
  side: 'hong' | 'chung';
  name?: string;
  isWinner: boolean;
  isLoser: boolean;
  compact: boolean;
}) {
  const sideStripe = side === 'hong' ? 'bg-hong' : 'bg-chung';
  const sideAccent = side === 'hong' ? 'text-hong-accent' : 'text-chung-accent';

  return (
    <div
      className={cn(
        'flex items-stretch',
        compact ? 'h-7' : 'h-9',
        isLoser && 'opacity-40',
      )}
    >
      {/* Side stripe — 2px, cor do atleta */}
      <div className={cn('w-[3px] shrink-0', sideStripe)} />

      <div className="flex-1 flex items-center px-2 min-w-0">
        <span
          className={cn(
            'truncate font-bold',
            compact ? 'text-[11px]' : 'text-sm',
            isWinner ? sideAccent : 'text-wt-fg-secondary',
          )}
        >
          {name || '—'}
        </span>
      </div>
    </div>
  );
}
