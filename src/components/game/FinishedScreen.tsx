import { Trophy, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameResult, Side } from '@/types/game';

interface FinishedScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function FinishedScreen({ result, onPlayAgain, onBackToMenu }: FinishedScreenProps) {
  const { scores, winner } = result;
  const isTie = winner === 'tie';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Winner Announcement */}
      <div className="mb-12 text-center animate-winner">
        <Trophy
          className={cn(
            'w-24 h-24 mx-auto mb-6',
            isTie ? 'text-game-yellow' : winner === 'red' ? 'text-game-red' : 'text-game-blue'
          )}
        />
        <h1
          className={cn(
            'text-6xl font-bold mb-2',
            isTie
              ? 'text-game-yellow text-glow-yellow'
              : winner === 'red'
              ? 'text-game-red text-glow-red'
              : 'text-game-blue text-glow-blue'
          )}
        >
          {isTie ? 'EMPATE!' : `${winner.toUpperCase()} VENCE!`}
        </h1>
        <p className="text-2xl text-muted-foreground">
          Tempo: {result.duration}s
        </p>
      </div>

      {/* Score Cards */}
      <div className="flex gap-8 mb-12">
        {/* Red Score */}
        <div
          className={cn(
            'p-8 rounded-lg border-2 text-center min-w-[200px]',
            winner === 'red'
              ? 'bg-game-red/20 border-game-red box-glow-red'
              : 'bg-game-surface border-border'
          )}
        >
          <span className="text-2xl font-bold text-game-red uppercase tracking-wider">RED</span>
          <div className="text-8xl font-bold text-game-red mt-2">{scores.red}</div>
          <span className="text-lg text-muted-foreground">chutes</span>
        </div>

        {/* VS */}
        <div className="flex items-center">
          <span className="text-4xl font-bold text-muted-foreground">VS</span>
        </div>

        {/* Blue Score */}
        <div
          className={cn(
            'p-8 rounded-lg border-2 text-center min-w-[200px]',
            winner === 'blue'
              ? 'bg-game-blue/20 border-game-blue box-glow-blue'
              : 'bg-game-surface border-border'
          )}
        >
          <span className="text-2xl font-bold text-game-blue uppercase tracking-wider">BLUE</span>
          <div className="text-8xl font-bold text-game-blue mt-2">{scores.blue}</div>
          <span className="text-lg text-muted-foreground">chutes</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBackToMenu}
          className="text-xl px-8 py-6"
        >
          <Home className="mr-2 h-6 w-6" />
          Menu
        </Button>
        <Button
          size="lg"
          onClick={onPlayAgain}
          className="text-xl px-12 py-6 bg-game-yellow hover:bg-game-yellow-glow text-background font-bold"
        >
          <RotateCcw className="mr-2 h-6 w-6" />
          JOGAR DE NOVO
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-8 text-muted-foreground">
        <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd> para jogar novamente •{' '}
        <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">ESC</kbd> para voltar ao menu
      </p>
    </div>
  );
}
