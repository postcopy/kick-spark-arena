import { Timer, Zap } from 'lucide-react';
import { KickPanel } from './KickPanel';
import { GameTimer } from './GameTimer';
import type { GameScore, Side } from '@/types/game';

interface GameScreenProps {
  scores: GameScore;
  timeLeft: number;
  isPaused: boolean;
  flashSide: Side | null;
}

export function GameScreen({ scores, timeLeft, isPaused, flashSide }: GameScreenProps) {
  // Calculate percentages
  const total = scores.red + scores.blue;
  const redPercentage = total > 0 ? (scores.red / total) * 100 : 0;
  const bluePercentage = total > 0 ? (scores.blue / total) * 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Header */}
      <div className="h-20 bg-black flex items-center justify-between px-10 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Zap className="w-10 h-10 text-[#FFD700]" />
          <span className="text-3xl font-bold text-white uppercase tracking-wider">
            Kick Counter
          </span>
        </div>
        
        {/* Center Timer */}
        <div className="flex items-center gap-4">
          <Timer className="w-6 h-6 text-[#FFD700]" />
          <GameTimer timeLeft={timeLeft} isPaused={isPaused} compact />
          {isPaused && (
            <span className="text-lg text-[#FFD700] uppercase tracking-wider animate-pulse">
              Pausado
            </span>
          )}
        </div>

        {/* Controls hint */}
        <div className="flex items-center gap-6 text-white/50 text-base">
          <span><kbd className="px-3 py-1 bg-white/10 rounded font-mono text-lg">P</kbd> Pausar</span>
          <span><kbd className="px-3 py-1 bg-white/10 rounded font-mono text-lg">R</kbd> Reiniciar</span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-1">
        {/* Left Panel - Red */}
        <div className="flex-1">
          <KickPanel
            side="red"
            score={scores.red}
            isFlashing={flashSide === 'red'}
            percentage={redPercentage}
          />
        </div>

        {/* Right Panel - Blue */}
        <div className="flex-1">
          <KickPanel
            side="blue"
            score={scores.blue}
            isFlashing={flashSide === 'blue'}
            percentage={bluePercentage}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="h-24 bg-black flex items-center border-t border-white/10">
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
      </div>
    </div>
  );
}
