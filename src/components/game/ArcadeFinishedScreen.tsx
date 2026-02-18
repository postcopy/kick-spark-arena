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

      {/* Dramatic radial glow — stronger */}
      <div className={cn(
        "absolute inset-0 opacity-40",
        winner === 'red' && "bg-gradient-radial from-game-red/50 to-transparent",
        winner === 'blue' && "bg-gradient-radial from-game-blue/50 to-transparent",
        winner === 'tie' && "bg-gradient-radial from-game-yellow/40 to-transparent"
      )} />
      {/* Secondary concentrated glow */}
      <div className={cn(
        "absolute inset-0 opacity-20",
        winner === 'red' && "bg-gradient-radial from-game-red/60 via-transparent to-transparent",
        winner === 'blue' && "bg-gradient-radial from-game-blue/60 via-transparent to-transparent",
        winner === 'tie' && "bg-gradient-radial from-game-yellow/50 via-transparent to-transparent"
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

        {/* Trophy / Icon — larger with glow */}
        <div className="mb-4 animate-winner">
          {winner !== 'tie' ? (
            <div className="relative inline-block">
              <div className={cn(
                "p-6 rounded-full",
                winner === 'red' 
                  ? "bg-game-red/20 shadow-[0_0_60px_hsl(var(--game-red-glow)/0.5)]" 
                  : "bg-game-blue/20 shadow-[0_0_60px_hsl(var(--game-blue-glow)/0.5)]"
              )}>
                <Trophy className={cn(
                  "w-[clamp(80px,15vmin,160px)] h-[clamp(80px,15vmin,160px)]",
                  winner === 'red' 
                    ? "text-game-red drop-shadow-[0_0_30px_hsl(var(--game-red-glow)/0.6)]" 
                    : "text-game-blue drop-shadow-[0_0_30px_hsl(var(--game-blue-glow)/0.6)]"
                )} />
              </div>
              {hasZero && (
                <div className="absolute -top-1 -right-1 p-1.5 bg-game-yellow rounded-full animate-bounce">
                  <Zap className="w-5 h-5 text-black" />
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-full bg-game-yellow/20 shadow-[0_0_60px_rgba(255,215,0,0.4)]">
              <Swords className="w-[clamp(80px,15vmin,160px)] h-[clamp(80px,15vmin,160px)] text-game-yellow drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]" />
            </div>
          )}
        </div>

        {/* Winner announcement — dramatic typography */}
        <div className="animate-winner">
          {winner !== 'tie' ? (
            <>
              <h1 className={cn(
                "font-black mb-1 font-mono leading-none",
                "text-[clamp(3rem,10vmin,6rem)]",
                getWinnerColor()
              )}>
                {getWinnerLabel()}
              </h1>
              <p className="text-[clamp(1rem,3vmin,2rem)] font-bold text-white/80 font-mono">
                CAMPEÃO DO DUELO!
              </p>
            </>
          ) : (
            <h1 className="text-[clamp(2.5rem,8vmin,5rem)] font-black text-game-yellow text-glow-yellow font-mono leading-none">
              DUELO EMPATADO!
            </h1>
          )}
        </div>

        {/* Round Score — responsive */}
        <div className="flex items-center justify-center gap-4 md:gap-6 my-6">
          <div className="text-center">
            <div className={cn(
              "font-black font-mono leading-none",
              "text-[clamp(3rem,8vmin,5rem)]",
              winner === 'red' ? "text-game-red text-glow-red" : "text-game-red/60"
            )}>
              {redWins}
            </div>
            <div className={cn(
              "text-[clamp(10px,1.5vmin,14px)] uppercase mt-1 font-bold tracking-wider font-mono",
              winner === 'red' ? "text-game-red" : "text-white/40"
            )}>
              VERMELHO
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Swords className="w-[clamp(24px,4vmin,40px)] h-[clamp(24px,4vmin,40px)] text-white/20 mb-1" />
            <span className="text-[clamp(1.5rem,4vmin,3rem)] font-black text-white/20 font-mono">×</span>
          </div>

          <div className="text-center">
            <div className={cn(
              "font-black font-mono leading-none",
              "text-[clamp(3rem,8vmin,5rem)]",
              winner === 'blue' ? "text-game-blue text-glow-blue" : "text-game-blue/60"
            )}>
              {blueWins}
            </div>
            <div className={cn(
              "text-[clamp(10px,1.5vmin,14px)] uppercase mt-1 font-bold tracking-wider font-mono",
              winner === 'blue' ? "text-game-blue" : "text-white/40"
            )}>
              AZUL
            </div>
          </div>
        </div>

        {/* Round details — Data Grid style */}
        <div className="bg-[#0b1120]/80 p-4 rounded-xl border border-white/10 backdrop-blur-sm mb-6 max-w-lg mx-auto">
          <h3 className="text-xs font-black text-white/40 uppercase mb-3 tracking-wider font-mono">
            DETALHES DOS ROUNDS
          </h3>
          <div className="divide-y divide-white/5">
            {rounds.map((round, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between py-2.5 px-3",
                  index === 0 && "pt-0"
                )}
              >
                <span className="text-[clamp(12px,1.5vmin,16px)] text-white/50 font-bold font-mono">Round {index + 1}</span>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-mono font-black text-[clamp(1rem,2.5vmin,1.5rem)]",
                    round.winner === 'red' ? "text-game-red" : "text-white/40"
                  )}>
                    {round.redHP}
                  </span>
                  <span className="text-white/20">—</span>
                  <span className={cn(
                    "font-mono font-black text-[clamp(1rem,2.5vmin,1.5rem)]",
                    round.winner === 'blue' ? "text-game-blue" : "text-white/40"
                  )}>
                    {round.blueHP}
                  </span>
                  {round.isKO && (
                    <span className="px-2 py-0.5 bg-game-yellow/20 text-game-yellow text-[clamp(10px,1.2vmin,13px)] font-black rounded border border-game-yellow/40 font-mono shadow-[0_0_12px_rgba(255,215,0,0.4)]">
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
