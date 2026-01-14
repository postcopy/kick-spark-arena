import { Timer } from 'lucide-react';
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
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Panel - Red */}
      <div className="flex-1">
        <KickPanel
          side="red"
          score={scores.red}
          isFlashing={flashSide === 'red'}
        />
      </div>

      {/* Center - Timer */}
      <div className="w-80 flex flex-col items-center justify-center bg-game-surface border-x border-border">
        {/* Mode label */}
        <div className="flex items-center gap-2 mb-8">
          <Timer className="w-6 h-6 text-game-yellow" />
          <span className="text-xl font-semibold text-game-yellow uppercase tracking-wider">
            Time Attack
          </span>
        </div>

        {/* Timer */}
        <GameTimer timeLeft={timeLeft} isPaused={isPaused} />

        {/* Controls hint */}
        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p><kbd className="px-2 py-0.5 bg-secondary rounded font-mono">P</kbd> Pausar</p>
          <p className="mt-1"><kbd className="px-2 py-0.5 bg-secondary rounded font-mono">R</kbd> Reiniciar</p>
        </div>
      </div>

      {/* Right Panel - Blue */}
      <div className="flex-1">
        <KickPanel
          side="blue"
          score={scores.blue}
          isFlashing={flashSide === 'blue'}
        />
      </div>
    </div>
  );
}
