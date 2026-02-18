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

  const getBorderColor = () => {
    if (winner === 'red') return 'lg:border-r-4 lg:border-game-red';
    if (winner === 'blue') return 'lg:border-r-4 lg:border-game-blue';
    return 'lg:border-r-4 lg:border-game-yellow';
  };

  const getGradientBg = () => {
    if (winner === 'red') return 'bg-gradient-to-r from-red-900/40 to-transparent';
    if (winner === 'blue') return 'bg-gradient-to-r from-blue-900/40 to-transparent';
    return 'bg-gradient-to-r from-yellow-900/30 to-transparent';
  };

  const hasZero = rounds.some(r => r.isKO);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden flex flex-col lg:flex-row bg-[#0b1120] relative">
      <div className="absolute inset-0 bg-arcade-pattern vignette opacity-30" />

      {winner !== 'tie' && <Confetti />}

      {/* ===== PAINEL ESQUERDO: THE CHAMPION ZONE (~60%) ===== */}
      <div className={cn(
        "flex-[3] relative flex flex-col items-center justify-center overflow-hidden p-6 md:p-10",
        getBorderColor(),
        getGradientBg()
      )}>
        {/* Radial glow */}
        <div className={cn(
          "absolute inset-0 opacity-40",
          winner === 'red' && "bg-gradient-radial from-game-red/50 to-transparent",
          winner === 'blue' && "bg-gradient-radial from-game-blue/50 to-transparent",
          winner === 'tie' && "bg-gradient-radial from-game-yellow/40 to-transparent"
        )} />

        {/* WINNER watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[12vmin] font-black tracking-tighter opacity-[0.07] text-white uppercase leading-none">
            WINNER
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Header badge */}
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-game-yellow" />
            <span className="text-xs font-black uppercase tracking-widest text-game-yellow font-mono">
              CORRIDA DE DEMOLIÇÃO
            </span>
            <Shield className="w-4 h-4 text-game-yellow" />
          </div>

          {/* Trophy — epic size */}
          <div className="mb-5 animate-winner">
            {winner !== 'tie' ? (
              <div className="relative inline-block">
                <div className={cn(
                  "p-8 rounded-full",
                  winner === 'red'
                    ? "bg-game-red/20 shadow-[0_0_100px_hsl(var(--game-red-glow)/0.6)]"
                    : "bg-game-blue/20 shadow-[0_0_100px_hsl(var(--game-blue-glow)/0.6)]"
                )}>
                  <Trophy className={cn(
                    "w-[clamp(100px,25vmin,250px)] h-[clamp(100px,25vmin,250px)]",
                    winner === 'red'
                      ? "text-game-red drop-shadow-[0_0_50px_hsl(var(--game-red-glow)/0.7)]"
                      : "text-game-blue drop-shadow-[0_0_50px_hsl(var(--game-blue-glow)/0.7)]"
                  )} />
                </div>
                {hasZero && (
                  <div className="absolute -top-2 -right-2 p-2 bg-game-yellow rounded-full animate-bounce">
                    <Zap className="w-6 h-6 text-black" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-full bg-game-yellow/20 shadow-[0_0_100px_rgba(255,215,0,0.5)]">
                <Swords className="w-[clamp(100px,25vmin,250px)] h-[clamp(100px,25vmin,250px)] text-game-yellow drop-shadow-[0_0_50px_rgba(255,215,0,0.6)]" />
              </div>
            )}
          </div>

          {/* Winner announcement */}
          <div className="animate-winner">
            {winner !== 'tie' ? (
              <>
                <h1 className={cn(
                  "font-black italic mb-1 font-mono leading-none",
                  "text-[clamp(3rem,10vmin,7rem)]",
                  getWinnerColor()
                )}>
                  {getWinnerLabel()}
                </h1>
                <p className="text-[clamp(1rem,3vmin,2rem)] font-bold text-white/80 font-mono">
                  CAMPEÃO DO DUELO!
                </p>
              </>
            ) : (
              <h1 className="text-[clamp(2.5rem,8vmin,5rem)] font-black italic text-game-yellow text-glow-yellow font-mono leading-none">
                DUELO EMPATADO!
              </h1>
            )}
          </div>

          {/* Round Score — displayed in champion zone */}
          <div className="flex items-center gap-4 md:gap-6 mt-6">
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
        </div>
      </div>

      {/* ===== PAINEL DIREITO: MATCH STATS HUD (~40%) ===== */}
      <div className="flex-[2] relative flex flex-col bg-slate-950/80 backdrop-blur-md p-6 md:p-8 z-10">
        {/* Placar Final — topo */}
        <div className="text-center mb-6">
          <h3 className="text-xs font-black text-white/40 uppercase mb-3 tracking-widest font-mono">
            PLACAR FINAL
          </h3>
          <div className="flex items-center justify-center gap-4">
            <span className={cn(
              "font-black font-mono text-[clamp(3rem,8vmin,5rem)] leading-none",
              winner === 'red' ? "text-game-red" : "text-game-red/60"
            )}>
              {redWins}
            </span>
            <span className="text-[clamp(1.5rem,4vmin,3rem)] font-black text-white/20 font-mono">-</span>
            <span className={cn(
              "font-black font-mono text-[clamp(3rem,8vmin,5rem)] leading-none",
              winner === 'blue' ? "text-game-blue" : "text-game-blue/60"
            )}>
              {blueWins}
            </span>
          </div>
        </div>

        {/* Round Cards */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-6">
          <h4 className="text-xs font-black text-white/30 uppercase tracking-widest font-mono mb-3">
            HISTÓRICO DE ROUNDS
          </h4>
          {rounds.map((round, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm",
                "bg-white/5 border-white/10",
                round.winner === 'red' && "border-l-4 border-l-game-red",
                round.winner === 'blue' && "border-l-4 border-l-game-blue"
              )}
            >
              <span className="text-[clamp(11px,1.4vmin,14px)] text-white/50 font-bold font-mono uppercase">
                Round {index + 1}
              </span>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-mono font-black text-[clamp(1rem,2.5vmin,1.5rem)]",
                  round.winner === 'red' ? "text-game-red" : "text-white/40"
                )}>
                  {round.redHP}
                </span>
                <span className="text-white/20 font-mono">—</span>
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

        {/* Botões de Ação — fixos na base */}
        <div className="mt-auto space-y-3">
          <Button
            size="lg"
            onClick={onPlayAgain}
            className="w-full gap-2 bg-gradient-to-r from-yellow-600 to-game-yellow text-black hover:from-yellow-500 hover:to-yellow-400 font-black text-base px-6 shadow-lg font-mono"
          >
            <RotateCcw className="w-4 h-4" />
            JOGAR NOVAMENTE
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onBackToMenu}
            className="w-full gap-2 font-bold border-white/20 text-white/70 hover:bg-white/10"
          >
            <Home className="w-4 h-4" />
            Menu Principal
          </Button>
          <div className="text-center mt-2 text-xs text-white/30">
            <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-xs">SPACE</kbd> para jogar novamente
          </div>
        </div>
      </div>
    </div>
  );
}
