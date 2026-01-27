import { useState } from 'react';
import { ArrowLeft, Swords, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';

interface ArcadeSetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  roundDuration: number;
  onRoundDurationChange: (duration: number) => void;
  bestOf: 1 | 3;
  onBestOfChange: (bestOf: 1 | 3) => void;
}

const DURATION_OPTIONS = [
  { value: 20, label: '20s', sublabel: 'Kids 4-6' },
  { value: 30, label: '30s', sublabel: 'Kids 7-9' },
  { value: 45, label: '45s', sublabel: 'Juvenil', recommended: true },
  { value: 60, label: '60s', sublabel: 'Adulto' },
];
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
  const { unlockAudio, initFullPreload } = useSound();
  const [isPreparing, setIsPreparing] = useState(false);

  const handleStart = () => {
    unlockAudio();
    initFullPreload();
    setIsPreparing(true);
    setTimeout(() => {
      setIsPreparing(false);
      onStart();
    }, 800);
  };

  return (
    <div className="flex flex-col h-full w-full bg-background p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 text-center mb-4 md:mb-6">
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
          <Swords className="w-8 h-8 md:w-10 md:h-10 text-game-red" />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            DUELO <span className="text-game-yellow">ARCADE</span>
          </h1>
          <Swords className="w-8 h-8 md:w-10 md:h-10 text-game-blue" />
        </div>
        <p className="text-base md:text-lg text-muted-foreground">
          Derrube a barra do rival com combos. <span className="text-game-yellow font-bold">K.O.</span> vence!
        </p>
      </header>

      {/* Settings - scrollable area */}
      <main className="flex-1 min-h-0 w-full max-w-2xl mx-auto overflow-y-auto space-y-3 md:space-y-4">
        {/* Round Duration */}
        <div className="bg-game-surface p-3 md:p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-game-yellow" />
            <h2 className="text-lg md:text-xl font-bold text-foreground">TEMPO DO ROUND</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onRoundDurationChange(option.value)}
                className={cn(
                  "relative py-2 md:py-3 px-3 md:px-4 rounded-lg font-bold transition-all flex flex-col items-center",
                  roundDuration === option.value
                    ? "bg-game-yellow text-black"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                <span className="text-xl md:text-2xl">{option.label}</span>
                <span className={cn(
                  "text-xs md:text-sm font-normal",
                  roundDuration === option.value ? "text-black/70" : "text-muted-foreground"
                )}>
                  {option.sublabel}
                </span>
                {option.recommended && (
                  <span className="absolute -top-2 right-2 px-2 py-0.5 bg-game-gold text-black text-xs font-bold rounded-full">
                    REC
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Best Of */}
        <div className="bg-game-surface p-3 md:p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-game-yellow" />
            <h2 className="text-lg md:text-xl font-bold text-foreground">FORMATO</h2>
          </div>
          <div className="flex gap-3 md:gap-4">
            {BEST_OF_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onBestOfChange(option.value)}
                className={cn(
                  "flex-1 py-2 md:py-3 px-4 md:px-6 rounded-lg font-bold text-lg md:text-xl transition-all",
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
        <div className="bg-game-surface/50 p-2 md:p-3 rounded-lg border border-border/50">
          <h3 className="text-xs md:text-sm font-bold text-muted-foreground uppercase mb-1 md:mb-2">REGRAS</h3>
          <ul className="text-xs md:text-sm text-muted-foreground space-y-0.5 md:space-y-1">
            <li>• HP inicial: <span className="text-foreground font-bold">100</span></li>
            <li>• Dano base: <span className="text-foreground font-bold">2</span> + bônus de combo (até +4)</li>
            <li>• Combo: chutes rápidos em sequência (700ms)</li>
            <li>• Especial: <span className="text-game-yellow font-bold">+12 dano</span> quando energia cheia</li>
          </ul>
        </div>
      </main>

      {/* Footer - Action Buttons */}
      <footer className="flex-shrink-0 pt-3 md:pt-4">
        <div className="flex gap-3 w-full max-w-md mx-auto">
          <Button
            variant="outline"
            size="default"
            onClick={onBack}
            className="flex-1 gap-2"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            Voltar
          </Button>
          <Button
            size="default"
            onClick={handleStart}
            disabled={isPreparing}
            className="flex-1 gap-2 bg-game-yellow text-black hover:bg-game-yellow/90 font-bold text-base md:text-lg"
          >
            <Swords className="w-4 h-4 md:w-5 md:h-5" />
            {isPreparing ? 'Preparando...' : 'INICIAR DUELO'}
          </Button>
        </div>
        <div className="mt-2 md:mt-3 text-center text-xs md:text-sm text-muted-foreground">
          <kbd className="px-2 py-1 bg-secondary rounded font-mono">SPACE</kbd> para iniciar
        </div>
      </footer>
    </div>
  );
}
