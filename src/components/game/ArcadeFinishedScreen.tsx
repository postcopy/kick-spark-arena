import { Trophy, RotateCcw, Home, Swords, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';
import { cn } from '@/lib/utils';
import type { ArcadeResult } from '@/types/game';

interface ArcadeFinishedScreenProps {
  result: ArcadeResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function ArcadeFinishedScreen({ result, onPlayAgain, onBackToMenu }: ArcadeFinishedScreenProps) {
  const { winner, redWins, blueWins, rounds, bestOf } = result;

  const getWinnerColor = () => {
    if (winner === 'red') return 'text-game-red text-glow-red';
    if (winner === 'blue') return 'text-game-blue text-glow-blue';
    return 'text-game-yellow text-glow-yellow';
  };

  const getWinnerLabel = () => {
    if (winner === 'red') return 'VERMELHO';
    if (winner === 'blue') return 'AZUL';
    return 'EMPATE';
  };

  const hasKO = rounds.some(r => r.isKO);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Confetti for winner */}
      {winner !== 'tie' && <Confetti />}

      {/* Background glow */}
      <div className={cn(
        "absolute inset-0 opacity-20",
        winner === 'red' && "bg-gradient-radial from-game-red/50 to-transparent",
        winner === 'blue' && "bg-gradient-radial from-game-blue/50 to-transparent",
        winner === 'tie' && "bg-gradient-radial from-game-yellow/30 to-transparent"
      )} />

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Trophy / Icon */}
        <div className="mb-6 animate-winner">
          {winner !== 'tie' ? (
            <div className="relative inline-block">
              <Trophy className={cn(
                "w-24 h-24 mx-auto",
                winner === 'red' ? "text-game-red" : "text-game-blue"
              )} />
              {hasKO && (
                <div className="absolute -top-2 -right-2">
                  <Skull className="w-10 h-10 text-game-yellow" />
                </div>
              )}
            </div>
          ) : (
            <Swords className="w-24 h-24 mx-auto text-game-yellow" />
          )}
        </div>

        {/* Winner announcement */}
        <h1 className={cn(
          "text-6xl font-black mb-4 animate-winner",
          getWinnerColor()
        )}>
          {winner !== 'tie' ? (
            <>
              {getWinnerLabel()}
              <br />
              <span className="text-4xl">VENCE O DUELO!</span>
            </>
          ) : (
            'DUELO EMPATADO!'
          )}
        </h1>

        {/* Round Score */}
        <div className="flex items-center justify-center gap-8 my-8">
          <div className="text-center">
            <div className="text-6xl font-black text-game-red text-glow-red">
              {redWins}
            </div>
            <div className="text-sm text-muted-foreground uppercase mt-1">VERMELHO</div>
          </div>

          <div className="text-4xl font-bold text-muted-foreground">
            ×
          </div>

          <div className="text-center">
            <div className="text-6xl font-black text-game-blue text-glow-blue">
              {blueWins}
            </div>
            <div className="text-sm text-muted-foreground uppercase mt-1">AZUL</div>
          </div>
        </div>

        {/* Round details */}
        <div className="bg-game-surface/50 p-4 rounded-lg border border-border mb-8 max-w-md mx-auto">
          <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3">DETALHES DOS ROUNDS</h3>
          <div className="space-y-2">
            {rounds.map((round, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Round {index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-mono font-bold",
                    round.winner === 'red' ? "text-game-red" : "text-muted-foreground"
                  )}>
                    {round.redHP}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className={cn(
                    "font-mono font-bold",
                    round.winner === 'blue' ? "text-game-blue" : "text-muted-foreground"
                  )}>
                    {round.blueHP}
                  </span>
                  {round.isKO && (
                    <span className="text-game-yellow text-xs font-bold">K.O.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={onPlayAgain}
            className="gap-2 bg-game-yellow text-black hover:bg-game-yellow/90 font-bold"
          >
            <RotateCcw className="w-5 h-5" />
            JOGAR NOVAMENTE
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onBackToMenu}
            className="gap-2"
          >
            <Home className="w-5 h-5" />
            Menu Principal
          </Button>
        </div>
      </div>
    </div>
  );
}
