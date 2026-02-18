import { useState } from 'react';
import { ArrowLeft, Swords, Clock, Trophy, Zap, Timer, Shield } from 'lucide-react';
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

const INTENSITY_PRESETS = [
  {
    id: 'sprint',
    label: 'SPRINT',
    subtitle: 'Velocidade',
    meta: '~50 chutes',
    damage: 2.0,
    description: 'Explosão máxima. Quem termina 50 chutes primeiro?',
    Icon: Zap,
    colorClass: 'border-yellow-500/60 bg-yellow-500/10',
    activeClass: 'border-yellow-400 bg-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.3)]',
    iconColor: 'text-yellow-400',
    textColor: 'text-yellow-400',
  },
  {
    id: 'resistance',
    label: 'RESISTÊNCIA',
    subtitle: 'Combate',
    meta: '~100 chutes',
    damage: 1.0,
    description: 'Volume de luta. 100 chutes de pura resistência.',
    Icon: Swords,
    colorClass: 'border-cyan-500/60 bg-cyan-500/10',
    activeClass: 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    iconColor: 'text-cyan-400',
    textColor: 'text-cyan-400',
  },
  {
    id: 'elite',
    label: 'ELITE',
    subtitle: 'Maratona',
    meta: '~200 chutes',
    damage: 0.5,
    description: 'Desafio Olímpico. 200 chutes para testar o limite.',
    Icon: Trophy,
    colorClass: 'border-purple-500/60 bg-purple-500/10',
    activeClass: 'border-purple-400 bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    iconColor: 'text-purple-400',
    textColor: 'text-purple-400',
  },
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
  const [selectedPreset, setSelectedPreset] = useState<string>('resistance');

  const handleStart = () => {
    unlockAudio();
    initFullPreload();
    onStart();
  };

  const selectPreset = (preset: typeof INTENSITY_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    onVestDamageChange(preset.damage);
    onHelmetDamageChange(preset.damage);
  };

  // Find active preset info
  const activePreset = INTENSITY_PRESETS.find(p => p.id === selectedPreset) || INTENSITY_PRESETS[1];

  return (
    <div className="flex flex-col h-full w-full bg-[#0b1120] p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 text-center mb-4 md:mb-6">
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
          <Shield className="w-8 h-8 md:w-10 md:h-10 text-game-red" />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight font-mono">
            CORRIDA DE <span className="text-game-yellow">DEMOLIÇÃO</span>
          </h1>
          <Shield className="w-8 h-8 md:w-10 md:h-10 text-game-blue" />
        </div>
        <p className="text-base md:text-lg text-white/60">
          Destrua seu alvo primeiro! Quem <span className="text-game-yellow font-bold">zerar a META</span> vence.
        </p>
      </header>

      {/* Settings - scrollable area */}
      <main className="flex-1 min-h-0 w-full max-w-2xl mx-auto overflow-y-auto space-y-3 md:space-y-4">
        {/* Intensity Preset Cards */}
        <div className="grid grid-cols-3 gap-3">
          {INTENSITY_PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  isActive ? preset.activeClass : preset.colorClass,
                  "hover:scale-[1.02]"
                )}
              >
                <preset.Icon className={cn("w-8 h-8 mb-2", preset.iconColor)} />
                <div className={cn("font-black text-lg font-mono", preset.textColor)}>
                  {preset.label}
                </div>
                <div className="text-xs text-white/50 font-bold uppercase">{preset.subtitle}</div>
                <div className={cn("text-sm font-bold font-mono mt-1", preset.textColor)}>
                  {preset.meta}
                </div>
                <p className="text-xs text-white/40 mt-2 leading-relaxed">{preset.description}</p>
                {isActive && (
                  <div className={cn("absolute top-2 right-2 w-3 h-3 rounded-full", 
                    preset.id === 'sprint' ? 'bg-yellow-400' : preset.id === 'resistance' ? 'bg-cyan-400' : 'bg-purple-400'
                  )} />
                )}
              </button>
            );
          })}
        </div>

        {/* Round Duration Slider */}
        <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/10">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-game-yellow" />
              <h2 className="text-lg md:text-xl font-bold text-white">TEMPO DO ROUND</h2>
            </div>
            <span className="text-2xl md:text-3xl font-black text-game-yellow font-mono">{roundDuration}s</span>
          </div>
          <Slider
            value={[roundDuration]}
            onValueChange={(values) => onRoundDurationChange(values[0])}
            min={15}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/40 mt-1 font-mono">
            <span>15s</span>
            <span>120s</span>
          </div>
        </div>

        {/* Best Of */}
        <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-game-yellow" />
            <h2 className="text-lg md:text-xl font-bold text-white">FORMATO</h2>
          </div>
          <div className="flex gap-3 md:gap-4">
            {BEST_OF_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onBestOfChange(option.value)}
                className={cn(
                  "flex-1 py-2 md:py-3 px-4 md:px-6 rounded-lg font-bold text-lg md:text-xl transition-all font-mono",
                  bestOf === option.value
                    ? "bg-game-yellow text-black"
                    : "bg-white/10 text-white/50 hover:bg-white/15"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recovery Interval Slider - Only visible when Best of 3 */}
        {bestOf === 3 && (
          <div className="bg-white/5 p-3 md:p-4 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Timer className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                <h2 className="text-lg md:text-xl font-bold text-white">INTERVALO</h2>
              </div>
              <span className="text-2xl md:text-3xl font-black text-green-500 font-mono">{recoveryInterval}s</span>
            </div>
            <Slider
              value={[recoveryInterval]}
              onValueChange={(values) => onRecoveryIntervalChange(values[0])}
              min={5}
              max={60}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1 font-mono">
              <span>5s</span>
              <span>60s</span>
            </div>
          </div>
        )}

        {/* Game Rules Preview */}
        <div className="bg-white/5 p-2 md:p-3 rounded-lg border border-white/10">
          <h3 className="text-xs md:text-sm font-bold text-white/40 uppercase mb-1 md:mb-2 font-mono">REGRAS</h3>
          <ul className="text-xs md:text-sm text-white/50 space-y-0.5 md:space-y-1">
            <li>• META: <span className="text-white font-bold font-mono">100</span> pontos para zerar</li>
            <li>• Dano por chute: <span className={cn("font-bold font-mono", activePreset.textColor)}>{activePreset.damage}</span></li>
            <li>• Meta de chutes: <span className={cn("font-bold font-mono", activePreset.textColor)}>{activePreset.meta}</span></li>
            <li>• Combo: chutes rápidos em sequência (até +4 dano)</li>
            <li>• <span className="text-game-yellow font-bold">Quem zerar primeiro vence!</span></li>
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
            className="flex-1 gap-2 border-white/20 text-white/70 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            Voltar
          </Button>
          <Button
            size="default"
            onClick={handleStart}
            className="flex-1 gap-2 bg-game-yellow text-black hover:bg-game-yellow/90 font-bold text-base md:text-lg font-mono"
          >
            <Shield className="w-4 h-4 md:w-5 md:h-5" />
            INICIAR DUELO
          </Button>
        </div>
        <div className="mt-2 md:mt-3 text-center text-xs md:text-sm text-white/30">
          <kbd className="px-2 py-1 bg-white/10 rounded font-mono">SPACE</kbd> para iniciar
        </div>
      </footer>
    </div>
  );
}
