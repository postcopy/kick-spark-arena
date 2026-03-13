import { useEffect, useRef } from 'react';
import { Trophy, RotateCcw, Home, Swords, Zap, Flame } from 'lucide-react';
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

  const isRedWinner = winner === 'red';
  const isBlueWinner = winner === 'blue';
  const isTie = winner === 'tie';
  const hasKO = rounds.some(r => r.isKO);

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] flex flex-col lg:flex-row overflow-hidden">
      {winner !== 'tie' && <Confetti variant={hasKO ? 'golden' : 'standard'} />}

      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background: isTie
            ? 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)'
            : isRedWinner
              ? 'radial-gradient(ellipse, rgba(225,29,72,0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />

      {/* ===== LEFT: CHAMPION ZONE (~60%) ===== */}
      <div className="flex-[3] relative flex flex-col items-center justify-center overflow-hidden p-6 md:p-10">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[14vmin] font-display font-black tracking-tighter opacity-[0.03] text-white uppercase leading-none">
            {isTie ? 'DRAW' : 'WINNER'}
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-4 h-4 text-white/20" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25">
              Corrida de Demolição
            </span>
            <Flame className="w-4 h-4 text-white/20" />
          </div>

          {/* Trophy */}
          <div className="relative mb-6 animate-trophy-bounce">
            {!isTie ? (
              <div className="relative">
                <div className={cn(
                  "p-6 rounded-full",
                  isRedWinner
                    ? "bg-red-500/10 shadow-[0_0_80px_rgba(225,29,72,0.3)]"
                    : "bg-blue-500/10 shadow-[0_0_80px_rgba(59,130,246,0.3)]"
                )}>
                  <Trophy className={cn(
                    "w-[clamp(80px,20vmin,200px)] h-[clamp(80px,20vmin,200px)]",
                    isRedWinner ? "text-red-400" : "text-blue-400",
                  )}
                  style={{
                    filter: isRedWinner
                      ? 'drop-shadow(0 0 40px rgba(225,29,72,0.5))'
                      : 'drop-shadow(0 0 40px rgba(59,130,246,0.5))'
                  }}
                  />
                </div>
                {hasKO && (
                  <div className="absolute -top-1 -right-1 px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center gap-1 animate-bounce">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-black font-mono">K.O.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-full bg-yellow-500/10 shadow-[0_0_80px_rgba(245,158,11,0.2)]">
                <Swords className="w-[clamp(80px,20vmin,200px)] h-[clamp(80px,20vmin,200px)] text-yellow-400"
                  style={{ filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.4))' }}
                />
              </div>
            )}
          </div>

          {/* Winner Title */}
          <div className="animate-scale-in">
            {!isTie ? (
              <>
                <h1 className={cn(
                  "font-display font-black leading-none",
                  "text-[clamp(3rem,10vmin,7rem)]",
                  isRedWinner ? "text-red-400" : "text-blue-400"
                )}
                style={{
                  textShadow: isRedWinner
                    ? '0 0 40px rgba(225,29,72,0.4)'
                    : '0 0 40px rgba(59,130,246,0.4)'
                }}
                >
                  {isRedWinner ? 'VERMELHO' : 'AZUL'}
                </h1>
                <p className="text-[clamp(1rem,2.5vmin,1.8rem)] font-display font-bold text-white/60 mt-1">
                  CAMPEÃO DO DUELO!
                </p>
              </>
            ) : (
              <h1 className="text-[clamp(2.5rem,8vmin,5rem)] font-display font-black text-yellow-400 leading-none"
                style={{ textShadow: '0 0 40px rgba(245,158,11,0.3)' }}
              >
                EMPATE!
              </h1>
            )}
          </div>

          {/* Round Score */}
          <div className="flex items-center gap-5 mt-6 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="text-center">
              <div className={cn(
                "font-black font-mono leading-none tabular-nums",
                "text-[clamp(3rem,8vmin,5rem)]",
                isRedWinner ? "text-red-400" : "text-red-400/40"
              )}>
                {redWins}
              </div>
              <div className={cn(
                "text-[clamp(10px,1.2vmin,13px)] uppercase mt-1 font-bold tracking-wider font-mono",
                isRedWinner ? "text-red-400/80" : "text-white/25"
              )}>
                VERMELHO
              </div>
            </div>

            <Swords className="w-[clamp(20px,3vmin,32px)] h-[clamp(20px,3vmin,32px)] text-white/15" />

            <div className="text-center">
              <div className={cn(
                "font-black font-mono leading-none tabular-nums",
                "text-[clamp(3rem,8vmin,5rem)]",
                isBlueWinner ? "text-blue-400" : "text-blue-400/40"
              )}>
                {blueWins}
              </div>
              <div className={cn(
                "text-[clamp(10px,1.2vmin,13px)] uppercase mt-1 font-bold tracking-wider font-mono",
                isBlueWinner ? "text-blue-400/80" : "text-white/25"
              )}>
                AZUL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: MATCH STATS (~40%) ===== */}
      <div className="flex-[2] relative flex flex-col bg-white/[0.02] border-l border-white/[0.06] p-5 md:p-8 z-10">
        {/* Final Score Header */}
        <div className="text-center mb-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20">Placar Final</span>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className={cn(
              "font-black font-mono text-[clamp(2.5rem,6vmin,4rem)] leading-none tabular-nums",
              isRedWinner ? "text-red-400" : "text-red-400/40"
            )}>
              {redWins}
            </span>
            <span className="text-[clamp(1.5rem,3vmin,2.5rem)] font-black text-white/15 font-mono">&ndash;</span>
            <span className={cn(
              "font-black font-mono text-[clamp(2.5rem,6vmin,4rem)] leading-none tabular-nums",
              isBlueWinner ? "text-blue-400" : "text-blue-400/40"
            )}>
              {blueWins}
            </span>
          </div>
        </div>

        {/* Round History */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/20 block mb-3">
            Histórico de Rounds
          </span>
          {rounds.map((round, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                "bg-white/[0.02] border-white/[0.06]",
                round.winner === 'red' && "border-l-2 border-l-red-500/50",
                round.winner === 'blue' && "border-l-2 border-l-blue-500/50"
              )}
            >
              <span className="text-xs text-white/30 font-mono font-bold uppercase">
                Round {index + 1}
              </span>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-mono font-black text-base tabular-nums",
                  round.winner === 'red' ? "text-red-400" : "text-white/30"
                )}>
                  {round.redHP}
                </span>
                <span className="text-white/15 font-mono text-xs">&mdash;</span>
                <span className={cn(
                  "font-mono font-black text-base tabular-nums",
                  round.winner === 'blue' ? "text-blue-400" : "text-white/30"
                )}>
                  {round.blueHP}
                </span>
                {round.isKO && (
                  <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-black rounded-md border border-yellow-500/30 font-mono">
                    K.O.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-2.5">
          <button
            onClick={onPlayAgain}
            className="btn-juice w-full h-14 rounded-xl font-display font-bold uppercase tracking-wider text-lg bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] transition-all shadow-[0_0_30px_rgba(225,29,72,0.2)] flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            REVANCHE
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full h-12 rounded-xl font-mono uppercase tracking-wider text-sm border border-white/[0.06] hover:border-red-500/20 hover:bg-red-500/5 text-white/40 hover:text-white/60 bg-transparent transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Menu
          </button>
          <div className="text-center mt-1">
            <span className="text-[10px] text-white/15 font-mono">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-[9px]">SPACE</kbd> revanche
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
