import { useState } from 'react';
import { ArrowLeft, Swords, Clock, Trophy, Shirt, HardHat, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';

interface ArcadeSetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  roundDuration: number;
  onRoundDurationChange: (duration: number) => void;
  vestDamage: number;
  onVestDamageChange: (damage: number) => void;
  helmetDamage: number;
  onHelmetDamageChange: (damage: number) => void;
  bestOf: 1 | 3;
  onBestOfChange: (bestOf: 1 | 3) => void;
  recoveryInterval: number;
  onRecoveryIntervalChange: (interval: number) => void;
}

const BEST_OF_OPTIONS: Array<{ value: 1 | 3; label: string }> = [
  { value: 1, label: 'RÁPIDO' },
  { value: 3, label: 'MELHOR DE 3' },
];

// Presets for quick setup with recovery intervals
const PRESETS = [
  { label: 'Kids', duration: 20, vest: 3, helmet: 5, recovery: 10 },
  { label: 'Juvenil', duration: 45, vest: 2, helmet: 3, recovery: 15 },
  { label: 'Adulto', duration: 60, vest: 1, helmet: 2, recovery: 20 },
];

export function ArcadeSetupScreen({
  onStart,
  onBack,
  roundDuration,
  onRoundDurationChange,
  vestDamage,
  onVestDamageChange,
  helmetDamage,
  onHelmetDamageChange,
  bestOf,
  onBestOfChange,
  recoveryInterval,
  onRecoveryIntervalChange,
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

  const applyPreset = (preset: typeof PRESETS[0]) => {
    onRoundDurationChange(preset.duration);
    onVestDamageChange(preset.vest);
    onHelmetDamageChange(preset.helmet);
    onRecoveryIntervalChange(preset.recovery);
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
        {/* Preset Buttons */}
        <div className="flex justify-center gap-2 mb-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 text-xs md:text-sm font-bold rounded-full bg-secondary text-muted-foreground hover:bg-game-yellow hover:text-black transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Round Duration Slider */}
        <div className="bg-game-surface p-3 md:p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-game-yellow" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">TEMPO DO ROUND</h2>
            </div>
            <span className="text-2xl md:text-3xl font-black text-game-yellow">{roundDuration}s</span>
          </div>
          <Slider
            value={[roundDuration]}
            onValueChange={(values) => onRoundDurationChange(values[0])}
            min={15}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>15s</span>
            <span>120s</span>
          </div>
        </div>

        {/* Vest Damage Slider */}
        <div className="bg-game-surface p-3 md:p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Shirt className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">DANO DO COLETE</h2>
            </div>
            <span className="text-2xl md:text-3xl font-black text-foreground">{vestDamage}</span>
          </div>
          <Slider
            value={[vestDamage]}
            onValueChange={(values) => onVestDamageChange(values[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* Helmet Damage Slider */}
        <div className="bg-game-surface p-3 md:p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <HardHat className="w-5 h-5 md:w-6 md:h-6 text-game-yellow" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">DANO DO CAPACETE</h2>
            </div>
            <span className="text-2xl md:text-3xl font-black text-game-yellow">{helmetDamage}</span>
          </div>
          <Slider
            value={[helmetDamage]}
            onValueChange={(values) => onHelmetDamageChange(values[0])}
            min={1}
            max={15}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span>15</span>
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

        {/* Recovery Interval Slider - Only visible when Best of 3 */}
        {bestOf === 3 && (
          <div className="bg-game-surface p-3 md:p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Timer className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                <h2 className="text-lg md:text-xl font-bold text-foreground">INTERVALO</h2>
              </div>
              <span className="text-2xl md:text-3xl font-black text-green-500">{recoveryInterval}s</span>
            </div>
            <Slider
              value={[recoveryInterval]}
              onValueChange={(values) => onRecoveryIntervalChange(values[0])}
              min={5}
              max={60}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5s</span>
              <span>60s</span>
            </div>
          </div>
        )}

        {/* Game Rules Preview */}
        <div className="bg-game-surface/50 p-2 md:p-3 rounded-lg border border-border/50">
          <h3 className="text-xs md:text-sm font-bold text-muted-foreground uppercase mb-1 md:mb-2">REGRAS</h3>
          <ul className="text-xs md:text-sm text-muted-foreground space-y-0.5 md:space-y-1">
            <li>• HP inicial: <span className="text-foreground font-bold">100</span></li>
            <li>• <Shirt className="w-3 h-3 inline" /> Colete: <span className="text-foreground font-bold">{vestDamage}</span> dano</li>
            <li>• <HardHat className="w-3 h-3 inline text-game-yellow" /> Capacete: <span className="text-game-yellow font-bold">{helmetDamage}</span> dano</li>
            <li>• Combo: chutes rápidos em sequência (até +4 dano)</li>
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
