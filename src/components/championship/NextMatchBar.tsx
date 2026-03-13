// Next Match Bar — Shows next fight info and action buttons after match ends

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
  // Find next match
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
    <div className="bg-[hsl(var(--sulsport-dark))] border-t border-[hsl(var(--sulsport-gray))] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {nextMatch && nextCat && (
            <div className="text-sm">
              <span className="text-zinc-500">Próxima: </span>
              <span className="text-[hsl(var(--sulsport-yellow))] font-bold">
                Luta {String(nextMatch.matchNumber).padStart(3, '0')}
              </span>
              <span className="text-zinc-500"> — </span>
              <span className="text-white font-bold">
                {nextMatch.athleteRed?.name || '—'}
              </span>
              <span className="text-zinc-500"> vs </span>
              <span className="text-white font-bold">
                {nextMatch.athleteBlue?.name || '—'}
              </span>
            </div>
          )}
          {allFinished && (
            <div className="flex items-center gap-2 text-[hsl(var(--sulsport-yellow))]">
              <Trophy className="h-5 w-5" />
              <span className="font-bold">CAMPEONATO ENCERRADO</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentMatchWinnerSide && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOverrideWinner}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              <Edit className="h-4 w-4 mr-1" />
              Alterar Vencedor
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onGoToTournament}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Ver Chaves
          </Button>

          {nextMatch && (
            <Button
              onClick={onNextMatch}
              size="sm"
              className="bg-green-600 hover:bg-green-500 text-white font-bold"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Próxima Luta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
