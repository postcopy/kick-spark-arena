// Tournament Header — Shows current match info in the Mat header

import type { Tournament } from '@/types/tournament';

interface TournamentHeaderProps {
  tournament: Tournament;
}

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  if (!tournament.currentCategoryId || !tournament.currentMatchId) return null;

  const cat = tournament.categories.find(c => c.id === tournament.currentCategoryId);
  if (!cat) return null;

  const match = cat.bracket.find(m => m.id === tournament.currentMatchId);
  if (!match) return null;

  const totalMatches = tournament.categories.reduce(
    (s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length, 0
  );
  const finishedMatches = tournament.categories.reduce(
    (s, c) => s + c.bracket.filter(m => m.status === 'FINISHED').length, 0
  );

  const maxRound = Math.max(...cat.bracket.map(m => m.round));
  const roundLabel = match.round === maxRound ? 'FINAL'
    : match.round === maxRound - 1 ? 'SEMIFINAL'
    : match.round === maxRound - 2 ? 'QUARTAS'
    : `ROUND ${match.round}`;

  return (
    <div className="flex items-center gap-3 text-xs font-display">
      <span className="px-2 py-1 border border-wt-manual/40 bg-wt-manual/10 text-wt-manual font-black uppercase tracking-[0.2em] tabular-nums">
        Luta {finishedMatches + 1}/{totalMatches}
      </span>
      <span className="text-wt-fg-secondary font-bold uppercase tracking-[0.25em]">{roundLabel}</span>
      <span className="text-wt-fg-muted">—</span>
      <span className="text-wt-fg-secondary truncate max-w-[200px] uppercase tracking-wider">{cat.name}</span>
    </div>
  );
}
