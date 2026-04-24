// Next Match Bar — próxima luta e ações pós-final.
//
// spe-ui-design §P3/§P8: retangular, tokens WT, 1 clique pra avançar.

import { Button } from '@/components/ui/button';
import { SkipForward, Trophy, Edit } from 'lucide-react';
import type { Tournament, BracketMatch, Category } from '@/types/tournament';
import { getNextReadyMatch } from '@/hooks/useBracketGenerator';

interface NextMatchBarProps {
  tournament: Tournament;
  currentMatchWinnerSide?: 'RED' | 'BLUE';
  onNextMatch: () => void;
  onOverrideWinner: () => void;
  onGoToTournament: () => void;
}

export function NextMatchBar({
  tournament,
  currentMatchWinnerSide,
  onNextMatch,
  onOverrideWinner,
  onGoToTournament,
}: NextMatchBarProps) {
  let nextMatch: BracketMatch | undefined;
  let nextCat: Category | undefined;

  for (const cat of tournament.categories) {
    const match = getNextReadyMatch(cat.bracket);
    if (match) {
      nextMatch = match;
      nextCat = cat;
      break;
    }
  }

  const allFinished = tournament.status === 'FINISHED';

  return (
    <div className="bg-wt-bg-secondary border-t border-wt-divider px-6 py-3 font-display">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {nextMatch && nextCat && (
            <div className="flex items-baseline gap-3 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted">
                Próxima
              </span>
              <span className="text-wt-manual font-black tabular-nums tracking-wider">
                LUTA {String(nextMatch.matchNumber).padStart(3, '0')}
              </span>
              <span className="text-wt-fg-muted">—</span>
              <span className="text-hong-accent font-bold uppercase">
                {nextMatch.athleteRed?.name || '—'}
              </span>
              <span className="text-wt-fg-muted uppercase text-xs tracking-widest">vs</span>
              <span className="text-chung-accent font-bold uppercase">
                {nextMatch.athleteBlue?.name || '—'}
              </span>
            </div>
          )}
          {allFinished && (
            <div className="flex items-center gap-2 text-wt-manual">
              <Trophy className="h-5 w-5" strokeWidth={2} />
              <span className="font-black uppercase tracking-[0.25em]">Campeonato encerrado</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentMatchWinnerSide && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOverrideWinner}
              className="border-wt-divider text-wt-fg-secondary hover:bg-wt-bg-tertiary hover:text-wt-fg-primary rounded-none uppercase tracking-wider text-[11px] font-bold"
            >
              <Edit className="h-4 w-4 mr-1.5" strokeWidth={2} />
              Alterar vencedor
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onGoToTournament}
            className="border-wt-divider text-wt-fg-secondary hover:bg-wt-bg-tertiary hover:text-wt-fg-primary rounded-none uppercase tracking-wider text-[11px] font-bold"
          >
            <Trophy className="h-4 w-4 mr-1.5" strokeWidth={2} />
            Ver chaves
          </Button>

          {nextMatch && (
            <Button
              onClick={onNextMatch}
              size="sm"
              className="bg-wt-success hover:bg-wt-success/90 text-black font-bold rounded-none uppercase tracking-wider text-[11px]"
            >
              <SkipForward className="h-4 w-4 mr-1.5" strokeWidth={2.5} />
              Próxima luta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
