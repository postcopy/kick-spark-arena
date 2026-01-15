import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameTimer } from './GameTimer';
import type { Athlete } from '@/types/game';

interface SoloGameScreenProps {
  athlete: Athlete;
  kicks: number;
  timeLeft: number;
  isPaused: boolean;
  isFlashing: boolean;
}

export function SoloGameScreen({
  athlete,
  kicks,
  timeLeft,
  isPaused,
  isFlashing,
}: SoloGameScreenProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen bg-background p-8 transition-colors",
      isFlashing && "bg-game-yellow/10"
    )}>
      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            {athlete.avatarUrl ? (
              <img src={athlete.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{athlete.name}</div>
            {athlete.belt && (
              <div className="text-sm text-muted-foreground capitalize">{athlete.belt}</div>
            )}
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="absolute top-24">
        <GameTimer timeLeft={timeLeft} isPaused={isPaused} />
      </div>

      {/* Main Kick Counter */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div
          className={cn(
            "relative p-16 rounded-3xl border-4 transition-all duration-150",
            "border-game-yellow/30 bg-game-surface",
            isFlashing && "border-game-yellow bg-game-yellow/20 scale-105"
          )}
        >
          <div className="text-center">
            <div
              className={cn(
                "text-[12rem] font-black tabular-nums leading-none text-game-yellow transition-transform duration-150",
                isFlashing && "scale-110 text-glow-yellow"
              )}
            >
              {kicks}
            </div>
            <div className="text-2xl text-muted-foreground mt-4 uppercase tracking-wider font-semibold">
              Chutes
            </div>
          </div>

          {/* Flash effect overlay */}
          {isFlashing && (
            <div className="absolute inset-0 bg-game-yellow/10 rounded-3xl animate-pulse" />
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-8 flex gap-4 text-muted-foreground text-sm">
        <span>
          <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">A</kbd> ou{' '}
          <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">L</kbd> para chutar
        </span>
        <span>•</span>
        <span>
          <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">P</kbd> pausar
        </span>
        <span>•</span>
        <span>
          <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">ESC</kbd> sair
        </span>
      </div>

      {/* Paused overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl font-bold text-foreground mb-4">PAUSADO</div>
            <div className="text-lg text-muted-foreground">
              Pressione <kbd className="px-2 py-1 bg-secondary rounded mx-1">P</kbd> para continuar
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
