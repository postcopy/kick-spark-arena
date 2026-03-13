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
    <div className="flex items-center gap-3 text-xs">
      <span className="px-2 py-1 rounded bg-[hsl(var(--sulsport-yellow))]/20 text-[hsl(var(--sulsport-yellow))] font-bold uppercase">
        Luta {finishedMatches + 1}/{totalMatches}
      </span>
      <span className="text-zinc-400 font-bold uppercase">{roundLabel}</span>
      <span className="text-zinc-500">—</span>
      <span className="text-zinc-400 truncate max-w-[200px]">{cat.name}</span>
    </div>
  );
}
