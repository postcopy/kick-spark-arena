import { Timer } from 'lucide-react';
import { KickPanel } from './KickPanel';
import { GameTimer } from './GameTimer';
import type { GameScore, Side, Athlete } from '@/types/game';
import logo from '@/assets/logo-desafio-relampago.png';

interface GameScreenProps {
  scores: GameScore;
  timeLeft: number;
  isPaused: boolean;
  flashSide: Side | null;
  isIndividual?: boolean;
  athlete?: Athlete | null;
}

export function GameScreen({ scores, timeLeft, isPaused, flashSide, isIndividual, athlete }: GameScreenProps) {
  // Calculate percentages
  const total = scores.red + scores.blue;
  const redPercentage = total > 0 ? (scores.red / total) * 100 : 0;
  const bluePercentage = total > 0 ? (scores.blue / total) * 100 : 0;
  const totalKicks = scores.red + scores.blue;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="h-24 bg-gradient-to-b from-zinc-900 via-black to-black flex items-center justify-between px-10 border-b-2 border-[#FFD700]/40 shadow-lg shadow-black/50">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-2xl bg-[#FFD700]/20 scale-150" />
            <img src={logo} alt="Desafio Relâmpago" className="h-16 w-auto relative z-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white uppercase tracking-widest">
              Desafio Relâmpago
            </span>
            <span className="text-xs text-[#FFD700]/70 uppercase tracking-[0.3em]">
              {isIndividual ? 'Individual' : 'Competição de Chutes'}
            </span>
          </div>
        </div>
        
        {/* Center Timer */}
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm px-8 py-3 rounded-xl border border-[#FFD700]/30 shadow-lg shadow-[#FFD700]/10">
          <Timer className="w-7 h-7 text-[#FFD700]" />
          <GameTimer timeLeft={timeLeft} isPaused={isPaused} compact />
          {isPaused && (
            <span className="text-lg text-[#FFD700] uppercase tracking-wider animate-pulse font-bold">
              Pausado
            </span>
          )}
        </div>

        {/* Controls hint */}
        <div className="flex items-center gap-8 text-white/70 text-base">
          <span className="flex items-center gap-2">
            <kbd className="px-3 py-1.5 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-md font-mono text-lg border border-zinc-600 shadow-md text-white">P</kbd>
            <span>Pausar</span>
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-3 py-1.5 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-md font-mono text-lg border border-zinc-600 shadow-md text-white">R</kbd>
            <span>Reiniciar</span>
          </span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-1 relative">
        {/* Left Panel - Red */}
        <div className="flex-1">
          <KickPanel
            side="red"
            score={scores.red}
            isFlashing={flashSide === 'red' || (isIndividual && flashSide !== null)}
            percentage={isIndividual ? 50 : redPercentage}
          />
        </div>

        {/* Right Panel - Blue */}
        <div className="flex-1">
          <KickPanel
            side="blue"
            score={scores.blue}
            isFlashing={flashSide === 'blue' || (isIndividual && flashSide !== null)}
            percentage={isIndividual ? 50 : bluePercentage}
          />
        </div>

        {/* Individual Mode - Total Score Overlay */}
        {isIndividual && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm px-16 py-10 rounded-3xl border-4 border-[#FFD700] shadow-2xl shadow-[#FFD700]/30">
              <div className="text-[12rem] font-bold text-[#FFD700] leading-none text-center drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                {totalKicks}
              </div>
              <div className="text-2xl text-[#FFD700]/70 text-center uppercase tracking-[0.4em] mt-2">
                chutes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-24 bg-black flex items-center border-t border-white/10">
        {isIndividual && athlete ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-5xl font-bold text-[#FFD700] uppercase tracking-[0.3em]">
              {athlete.name}
            </span>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-5xl font-bold text-[#E10000] uppercase tracking-[0.3em]">
                Vermelho
              </span>
            </div>
            <div className="w-px h-14 bg-white/20" />
            <div className="flex-1 flex items-center justify-center">
              <span className="text-5xl font-bold text-[#0066FF] uppercase tracking-[0.3em]">
                Azul
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
