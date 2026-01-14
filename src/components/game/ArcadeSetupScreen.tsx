import { ArrowLeft, Swords, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ArcadeSetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  roundDuration: number;
  onRoundDurationChange: (duration: number) => void;
  bestOf: 1 | 3;
  onBestOfChange: (bestOf: 1 | 3) => void;
}

const DURATION_OPTIONS = [45, 60];
const BEST_OF_OPTIONS: Array<{ value: 1 | 3; label: string }> = [
  { value: 1, label: 'RÁPIDO' },
  { value: 3, label: 'MELHOR DE 3' },
];

export function ArcadeSetupScreen({
  onStart,
  onBack,
  roundDuration,
  onRoundDurationChange,
  bestOf,
  onBestOfChange,
}: ArcadeSetupScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Swords className="w-12 h-12 text-game-red" />
          <h1 className="text-5xl font-black text-foreground tracking-tight">
            DUELO <span className="text-game-yellow">ARCADE</span>
          </h1>
          <Swords className="w-12 h-12 text-game-blue" />
        </div>
        <p className="text-xl text-muted-foreground">
          Derrube a barra do rival com combos. <span className="text-game-yellow font-bold">K.O.</span> vence!
        </p>
      </div>

      {/* Settings */}
      <div className="w-full max-w-2xl space-y-8 mb-12">
        {/* Round Duration */}
        <div className="bg-game-surface p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-game-yellow" />
            <h2 className="text-xl font-bold text-foreground">TEMPO DO ROUND</h2>
          </div>
          <div className="flex gap-4">
            {DURATION_OPTIONS.map((duration) => (
              <button
                key={duration}
                onClick={() => onRoundDurationChange(duration)}
                className={cn(
                  "flex-1 py-4 px-6 rounded-lg font-bold text-2xl transition-all",
                  roundDuration === duration
                    ? "bg-game-yellow text-black"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {duration}s
              </button>
            ))}
          </div>
        </div>

        {/* Best Of */}
        <div className="bg-game-surface p-6 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-game-yellow" />
            <h2 className="text-xl font-bold text-foreground">FORMATO</h2>
          </div>
          <div className="flex gap-4">
            {BEST_OF_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onBestOfChange(option.value)}
                className={cn(
                  "flex-1 py-4 px-6 rounded-lg font-bold text-xl transition-all",
                  bestOf === option.value
                    ? "bg-game-yellow text-black"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Game Rules Preview */}
        <div className="bg-game-surface/50 p-4 rounded-lg border border-border/50">
          <h3 className="text-sm font-bold text-muted-foreground uppercase mb-2">REGRAS</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• HP inicial: <span className="text-foreground font-bold">100</span></li>
            <li>• Dano base: <span className="text-foreground font-bold">2</span> + bônus de combo (até +4)</li>
            <li>• Combo: chutes rápidos em sequência (700ms)</li>
            <li>• Especial: <span className="text-game-yellow font-bold">+12 dano</span> quando energia cheia</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex-1 gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Button>
        <Button
          size="lg"
          onClick={onStart}
          className="flex-1 gap-2 bg-game-yellow text-black hover:bg-game-yellow/90 font-bold text-lg"
        >
          <Swords className="w-5 h-5" />
          INICIAR DUELO
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="mt-8 text-sm text-muted-foreground">
        <kbd className="px-2 py-1 bg-secondary rounded font-mono">SPACE</kbd> para iniciar
      </div>
    </div>
  );
}
