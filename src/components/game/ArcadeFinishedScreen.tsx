import { Trophy, RotateCcw, Home, Swords, Skull, Zap } from 'lucide-react';
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
  const { winner, redWins, blueWins, rounds } = result;

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
      {/* Background pattern */}
      <div className="absolute inset-0 bg-arcade-pattern vignette" />

      {/* Confetti for winner */}
      {winner !== 'tie' && <Confetti />}

      {/* Background glow */}
      <div className={cn(
        "absolute inset-0 opacity-30",
        winner === 'red' && "bg-gradient-radial from-game-red/40 to-transparent",
        winner === 'blue' && "bg-gradient-radial from-game-blue/40 to-transparent",
        winner === 'tie' && "bg-gradient-radial from-game-yellow/30 to-transparent"
      )} />

      {/* Animated side glows */}
      {winner === 'red' && (
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-game-red/20 to-transparent" />
      )}
      {winner === 'blue' && (
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-game-blue/20 to-transparent" />
      )}

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Header badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-game-yellow" />
          <span className="text-sm font-black uppercase tracking-widest text-game-yellow">
            ARCADE MODE
          </span>
          <Zap className="w-5 h-5 text-game-yellow" />
        </div>

        {/* Trophy / Icon */}
        <div className="mb-8 animate-winner">
          {winner !== 'tie' ? (
            <div className="relative inline-block">
              <div className={cn(
                "p-6 rounded-full",
                winner === 'red' ? "bg-game-red/20" : "bg-game-blue/20",
                "box-glow-gold"
              )}>
                <Trophy className={cn(
                  "w-28 h-28",
                  winner === 'red' ? "text-game-red" : "text-game-blue"
                )} />
              </div>
              {hasKO && (
                <div className="absolute -top-2 -right-2 p-2 bg-game-yellow rounded-full animate-bounce">
                  <Skull className="w-8 h-8 text-black" />
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-full bg-game-yellow/20 box-glow-gold">
              <Swords className="w-28 h-28 text-game-yellow" />
            </div>
          )}
        </div>

        {/* Winner announcement */}
        <div className="animate-winner">
          {winner !== 'tie' ? (
            <>
              <h1 className={cn(
                "text-8xl font-black mb-2",
                getWinnerColor()
              )}>
                {getWinnerLabel()}
              </h1>
              <p className="text-3xl font-bold text-foreground/80">
                VENCE O DUELO!
              </p>
            </>
          ) : (
            <h1 className="text-7xl font-black text-game-yellow text-glow-yellow">
              DUELO EMPATADO!
            </h1>
          )}
        </div>

        {/* Round Score */}
        <div className="flex items-center justify-center gap-12 my-10">
          <div className="text-center">
            <div className={cn(
              "text-8xl font-black",
              winner === 'red' ? "text-game-red text-glow-red" : "text-game-red/60"
            )}>
              {redWins}
            </div>
            <div className={cn(
              "text-sm uppercase mt-2 font-bold tracking-wider",
              winner === 'red' ? "text-game-red" : "text-muted-foreground"
            )}>
              VERMELHO
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Swords className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <span className="text-4xl font-black text-muted-foreground/40">×</span>
          </div>

          <div className="text-center">
            <div className={cn(
              "text-8xl font-black",
              winner === 'blue' ? "text-game-blue text-glow-blue" : "text-game-blue/60"
            )}>
              {blueWins}
            </div>
            <div className={cn(
              "text-sm uppercase mt-2 font-bold tracking-wider",
              winner === 'blue' ? "text-game-blue" : "text-muted-foreground"
            )}>
              AZUL
            </div>
          </div>
        </div>

        {/* Round details */}
        <div className="bg-game-surface/70 p-6 rounded-xl border border-border/50 backdrop-blur-sm mb-10 max-w-lg mx-auto">
          <h3 className="text-sm font-black text-muted-foreground uppercase mb-4 tracking-wider">
            DETALHES DOS ROUNDS
          </h3>
          <div className="space-y-3">
            {rounds.map((round, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  round.winner === 'red' 
                    ? "bg-game-red/10 border border-game-red/30" 
                    : round.winner === 'blue'
                      ? "bg-game-blue/10 border border-game-blue/30"
                      : "bg-secondary/50 border border-border/30"
                )}
              >
                <span className="text-muted-foreground font-bold">Round {index + 1}</span>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "font-mono font-black text-xl",
                    round.winner === 'red' ? "text-game-red" : "text-muted-foreground"
                  )}>
                    {round.redHP}
                  </span>
                  <span className="text-muted-foreground/40">—</span>
                  <span className={cn(
                    "font-mono font-black text-xl",
                    round.winner === 'blue' ? "text-game-blue" : "text-muted-foreground"
                  )}>
                    {round.blueHP}
                  </span>
                  {round.isKO && (
                    <span className="px-2 py-0.5 bg-game-yellow/20 text-game-yellow text-xs font-black rounded border border-game-yellow/40">
                      K.O.
                    </span>
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
            className="gap-2 bg-gradient-to-r from-yellow-600 to-game-yellow text-black hover:from-yellow-500 hover:to-yellow-400 font-black text-lg px-8 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            JOGAR NOVAMENTE
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onBackToMenu}
            className="gap-2 font-bold"
          >
            <Home className="w-5 h-5" />
            Menu Principal
          </Button>
        </div>

        {/* Keyboard hint */}
        <div className="mt-8 text-sm text-muted-foreground">
          <kbd className="px-2 py-1 bg-secondary rounded font-mono">SPACE</kbd> para jogar novamente
        </div>
      </div>
    </div>
  );
}
