import { useState } from 'react';
import { Timer, Play, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  duration: number;
  onDurationChange: (duration: number) => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1 min' },
  { value: 90, label: '1:30' },
  { value: 120, label: '2 min' },
];

export function SetupScreen({ onStart, onBack, duration, onDurationChange }: SetupScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Timer className="w-10 h-10 text-game-yellow" />
          <h1 className="text-5xl font-bold text-foreground">TIME ATTACK</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Configure o tempo da partida
        </p>
      </div>

      {/* Duration Selection */}
      <div className="flex gap-4 mb-12">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onDurationChange(option.value)}
            className={cn(
              'px-8 py-6 text-2xl font-bold rounded-lg border-2 transition-all',
              duration === option.value
                ? 'bg-game-yellow/20 border-game-yellow text-game-yellow'
                : 'bg-game-surface border-border text-foreground hover:border-game-yellow/50'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="w-full max-w-4xl h-48 bg-game-surface rounded-lg border border-border mb-12 flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-game-red/10 border-l-4 border-game-red">
          <span className="text-6xl font-bold text-game-red">RED</span>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 flex items-center justify-center bg-game-blue/10 border-r-4 border-game-blue">
          <span className="text-6xl font-bold text-game-blue">BLUE</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="text-xl px-8 py-6"
        >
          <ChevronLeft className="mr-2 h-6 w-6" />
          Voltar
        </Button>
        <Button
          size="lg"
          onClick={onStart}
          className="text-xl px-12 py-6 bg-game-yellow hover:bg-game-yellow-glow text-background font-bold"
        >
          <Play className="mr-2 h-6 w-6" />
          COMEÇAR
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-8 text-muted-foreground">
        Pressione <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd> para iniciar
      </p>
    </div>
  );
}
