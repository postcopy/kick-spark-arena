import { useEffect, useRef } from 'react';
import { Trophy, RotateCcw, Home, Swords, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';
import { cn } from '@/lib/utils';
import type { ArcadeResult } from '@/types/game';
import { useSound } from '@/contexts/SoundContext';

interface ArcadeFinishedScreenProps {
  result: ArcadeResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function ArcadeFinishedScreen({ result, onPlayAgain, onBackToMenu }: ArcadeFinishedScreenProps) {
  const { winner, redWins, blueWins, rounds } = result;
  const { play } = useSound();
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      if (winner === 'red') {
        play('victoryRed');
      } else if (winner === 'blue') {
        play('victoryBlue');
      } else {
        play('victory');
      }
    }
  }, [play, winner]);

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

  const hasZero = rounds.some(r => r.isKO);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0b1120] relative">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-arcade-pattern vignette opacity-30" />

      {winner !== 'tie' && <Confetti />}

      <div className={cn(
        "absolute inset-0 opacity-20",
        winner === 'red' && "bg-gradient-radial from-game-red/40 to-transparent",
        winner === 'blue' && "bg-gradient-radial from-game-blue/40 to-transparent",
        winner === 'tie' && "bg-gradient-radial from-game-yellow/30 to-transparent"
      )} />

      <div className="relative z-10 text-center">
        {/* Header badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-game-yellow" />
          <span className="text-xs font-black uppercase tracking-widest text-game-yellow font-mono">
            CORRIDA DE DEMOLIÇÃO
          </span>
          <Shield className="w-4 h-4 text-game-yellow" />
        </div>

        {/* Trophy / Icon */}
        <div className="mb-4 animate-winner">
          {winner !== 'tie' ? (
            <div className="relative inline-block">
              <div className={cn(
                "p-4 rounded-full",
                winner === 'red' ? "bg-game-red/20" : "bg-game-blue/20",
                "box-glow-gold"
              )}>
                <Trophy className={cn(
                  "w-16 h-16 md:w-20 md:h-20",
                  winner === 'red' ? "text-game-red" : "text-game-blue"
                )} />
              </div>
              {hasZero && (
                <div className="absolute -top-1 -right-1 p-1.5 bg-game-yellow rounded-full animate-bounce">
                  <Zap className="w-5 h-5 text-black" />
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-full bg-game-yellow/20 box-glow-gold">
              <Swords className="w-16 h-16 md:w-20 md:h-20 text-game-yellow" />
            </div>
          )}
        </div>

        {/* Winner announcement */}
        <div className="animate-winner">
          {winner !== 'tie' ? (
            <>
              <h1 className={cn(
                "text-5xl md:text-6xl font-black mb-1 font-mono",
                getWinnerColor()
              )}>
                {getWinnerLabel()}
              </h1>
              <p className="text-xl md:text-2xl font-bold text-white/80 font-mono">
                ZEROU A META!
              </p>
            </>
          ) : (
            <h1 className="text-4xl md:text-5xl font-black text-game-yellow text-glow-yellow font-mono">
              DUELO EMPATADO!
            </h1>
          )}
        </div>

        {/* Round Score */}
        <div className="flex items-center justify-center gap-4 md:gap-6 my-6">
          <div className="text-center">
            <div className={cn(
              "text-5xl md:text-6xl font-black font-mono",
              winner === 'red' ? "text-game-red text-glow-red" : "text-game-red/60"
            )}>
              {redWins}
            </div>
            <div className={cn(
              "text-xs uppercase mt-1 font-bold tracking-wider font-mono",
              winner === 'red' ? "text-game-red" : "text-white/40"
            )}>
              VERMELHO
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Swords className="w-8 h-8 text-white/20 mb-1" />
            <span className="text-3xl font-black text-white/20 font-mono">×</span>
          </div>

          <div className="text-center">
            <div className={cn(
              "text-5xl md:text-6xl font-black font-mono",
              winner === 'blue' ? "text-game-blue text-glow-blue" : "text-game-blue/60"
            )}>
              {blueWins}
            </div>
            <div className={cn(
              "text-xs uppercase mt-1 font-bold tracking-wider font-mono",
              winner === 'blue' ? "text-game-blue" : "text-white/40"
            )}>
              AZUL
            </div>
          </div>
        </div>

        {/* Round details */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm mb-6 max-w-lg mx-auto">
          <h3 className="text-xs font-black text-white/40 uppercase mb-3 tracking-wider font-mono">
            DETALHES DOS ROUNDS
          </h3>
          <div className="space-y-2">
            {rounds.map((round, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  round.winner === 'red' 
                    ? "bg-game-red/10 border border-game-red/30" 
                    : round.winner === 'blue'
                      ? "bg-game-blue/10 border border-game-blue/30"
                      : "bg-white/5 border border-white/10"
                )}
              >
                <span className="text-sm text-white/50 font-bold font-mono">Round {index + 1}</span>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-mono font-black text-lg",
                    round.winner === 'red' ? "text-game-red" : "text-white/40"
                  )}>
                    {round.redHP}
                  </span>
                  <span className="text-white/20">—</span>
                  <span className={cn(
                    "font-mono font-black text-lg",
                    round.winner === 'blue' ? "text-game-blue" : "text-white/40"
                  )}>
                    {round.blueHP}
                  </span>
                  {round.isKO && (
                    <span className="px-1.5 py-0.5 bg-game-yellow/20 text-game-yellow text-xs font-black rounded border border-game-yellow/40 font-mono">
                      ZERO!
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={onPlayAgain}
            className="gap-2 bg-gradient-to-r from-yellow-600 to-game-yellow text-black hover:from-yellow-500 hover:to-yellow-400 font-black text-base px-6 shadow-lg font-mono"
          >
            <RotateCcw className="w-4 h-4" />
            JOGAR NOVAMENTE
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onBackToMenu}
            className="gap-2 font-bold border-white/20 text-white/70 hover:bg-white/10"
          >
            <Home className="w-4 h-4" />
            Menu Principal
          </Button>
        </div>

        <div className="mt-4 text-xs text-white/30">
          <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-xs">SPACE</kbd> para jogar novamente
        </div>
      </div>
      </div>
    </div>
  );
}
