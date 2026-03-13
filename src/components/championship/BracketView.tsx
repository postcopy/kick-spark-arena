// Bracket View — Single elimination bracket visualization for TV and setup preview

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
      <div className="flex items-center justify-center h-full text-zinc-500 text-xl">
        Nenhuma chave gerada
      </div>
    );
  }

  const gapY = compact ? 'gap-1' : 'gap-2';

  return (
    <div className="w-full h-full flex flex-col">
      {/* Category Title */}
      <div className="text-center mb-4">
        <h2 className={cn(
          "font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider",
          compact ? "text-lg" : "text-2xl"
        )}>
          {category.name}
        </h2>
      </div>

      {/* Bracket Grid */}
      <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden px-4">
        <div className="flex gap-8 mx-auto min-w-max">
          {rounds.map((col) => (
            <div key={col.round} className="flex flex-col items-center">
              {/* Round Label */}
              <div className={cn(
                "mb-3 font-bold text-white/50 uppercase tracking-wider",
                compact ? "text-[10px]" : "text-xs"
              )}>
                {col.label}
              </div>

              {/* Matches */}
              <div className={cn("flex flex-col justify-around flex-1", gapY)}
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
  const width = compact ? 'w-40' : 'w-52';

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      width,
      isCurrent && "ring-2 ring-[hsl(var(--sulsport-yellow))] animate-pulse",
      isFinished ? "border-white/20" : "border-white/10",
      isBye && "opacity-50",
    )}>
      {/* Match number */}
      <div className={cn(
        "text-center text-[10px] font-bold uppercase tracking-wider py-0.5",
        isCurrent
          ? "bg-[hsl(var(--sulsport-yellow))] text-black"
          : "bg-white/5 text-white/40"
      )}>
        {isBye ? 'BYE' : `LUTA ${String(match.matchNumber).padStart(3, '0')}`}
      </div>

      {/* Red athlete (top) */}
      <div className={cn(
        "flex items-center px-2 border-b border-white/10",
        compact ? "h-7" : "h-9",
        isFinished && match.winnerSide === 'RED'
          ? "bg-[hsl(var(--sulsport-red))]/30"
          : "bg-[hsl(var(--sulsport-red))]/10",
      )}>
        <span className={cn(
          "truncate font-bold",
          compact ? "text-[11px]" : "text-sm",
          isFinished && match.winnerSide === 'RED' ? "text-white" : "text-white/70",
        )}>
          {match.athleteRed?.name || '—'}
        </span>
      </div>

      {/* Blue athlete (bottom) */}
      <div className={cn(
        "flex items-center px-2",
        compact ? "h-7" : "h-9",
        isFinished && match.winnerSide === 'BLUE'
          ? "bg-[hsl(var(--sulsport-blue))]/30"
          : "bg-[hsl(var(--sulsport-blue))]/10",
      )}>
        <span className={cn(
          "truncate font-bold",
          compact ? "text-[11px]" : "text-sm",
          isFinished && match.winnerSide === 'BLUE' ? "text-white" : "text-white/70",
        )}>
          {match.athleteBlue?.name || '—'}
        </span>
      </div>
    </div>
  );
}
