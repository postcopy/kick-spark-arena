import { useState } from 'react';
import { ArrowLeft, Swords, Clock, Trophy, Zap, Timer, Shield } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';
import bgMenuModos from '@/assets/menu-modos.jpg';

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
    activeGlow: 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]',
    barColor: 'bg-yellow-500',
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
    activeGlow: 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    barColor: 'bg-cyan-500',
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
    activeGlow: 'bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    barColor: 'bg-purple-500',
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

  const activePreset = INTENSITY_PRESETS.find(p => p.id === selectedPreset) || INTENSITY_PRESETS[1];

  return (
    <div className="flex flex-col h-full w-full bg-[#0b1120] p-4 md:p-6 overflow-hidden relative">
      {/* Background overlay */}
      <img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.05] pointer-events-none" alt="" />

      {/* Header */}
      <header className="flex-shrink-0 text-center mb-2 md:mb-3 relative z-10">
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-1">
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-game-red" />
          <h1 className="text-[clamp(1.5rem,4vmin,3rem)] font-black text-white tracking-tight font-mono">
            CORRIDA DE <span className="text-game-yellow">DEMOLIÇÃO</span>
          </h1>
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-game-blue" />
        </div>
        <p className="text-sm md:text-base text-white/60">
          Destrua seu alvo primeiro! Quem <span className="text-game-yellow font-bold">zerar a META</span> vence.
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex flex-col overflow-hidden relative z-10">
        {/* Intensity Preset Cards */}
        <div className="flex-1 min-h-0 mb-3 flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 h-full max-h-[500px]">
            {INTENSITY_PRESETS.map((preset) => {
              const isActive = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className={cn(
                    "relative p-4 md:p-5 border transition-all duration-300 text-left overflow-hidden flex flex-col backdrop-blur-sm",
                    isActive
                      ? preset.activeGlow
                      : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className={cn("absolute left-0 top-0 w-1 h-full", preset.barColor)} />
                  )}
                  <preset.Icon className={cn("w-7 h-7 md:w-9 md:h-9 mb-2", preset.iconColor)} />
                  <div className={cn("font-black text-xl md:text-2xl italic font-mono", preset.textColor)}>
                    {preset.label}
                  </div>
                  <div className="text-xs text-white/50 font-bold uppercase">{preset.subtitle}</div>
                  <div className={cn("text-sm font-bold font-mono mt-1", preset.textColor)}>
                    {preset.meta}
                  </div>
                  <p className="text-[0.7rem] leading-tight text-white/60 mt-2 hidden md:block">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex-shrink-0 bg-black/20 p-4 md:p-6 rounded-xl border border-white/10 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* Left Column: Round Duration Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-game-yellow" />
                  <h2 className="text-sm md:text-base font-bold text-white">TEMPO DO ROUND</h2>
                </div>
                <span className="text-xl md:text-2xl font-black text-game-yellow font-mono">{roundDuration}s</span>
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

            {/* Right Column: Format + Interval stacked */}
            <div className="space-y-3">
              {/* Best Of - Segmented Control */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-game-yellow" />
                  <h2 className="text-sm md:text-base font-bold text-white">FORMATO</h2>
                </div>
                <div className="flex bg-black/40 rounded-lg p-1 gap-1">
                  {BEST_OF_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onBestOfChange(option.value)}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-md font-bold text-base font-mono transition-all",
                        bestOf === option.value
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-white/40 bg-transparent hover:text-white/60"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recovery Interval - Only visible when Best of 3 */}
              {bestOf === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                      <h2 className="text-sm md:text-base font-bold text-white">INTERVALO</h2>
                    </div>
                    <span className="text-xl md:text-2xl font-black text-green-500 font-mono">{recoveryInterval}s</span>
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
            </div>
          </div>
        </div>

        {/* Footer: Rules + Action Buttons */}
        <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end">
          {/* Rules - System Note style */}
          <div className="md:col-span-2 bg-transparent border-l-2 border-cyan-500/50 pl-4 py-2">
            <h3 className="text-[0.65rem] font-bold text-cyan-500/60 uppercase tracking-widest mb-1 font-mono">REGRAS DO SISTEMA</h3>
            <ul className="font-mono text-xs text-white/40 space-y-0.5">
              <li>• META: <span className="text-white/70 font-bold">100</span> pts | Dano: <span className={cn("font-bold", activePreset.textColor)}>{activePreset.damage}</span> | Chutes: <span className={cn("font-bold", activePreset.textColor)}>{activePreset.meta}</span></li>
              <li>• Combo: chutes rápidos em sequência (até +4 dano) · <span className="text-game-yellow font-bold">Quem zerar primeiro vence!</span></li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-1 flex flex-col gap-2">
            <button
              onClick={handleStart}
              className="w-full h-14 bg-[#FFD700] text-black font-black uppercase tracking-widest text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
              style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
            >
              <Shield className="w-5 h-5" />
              INICIAR DUELO
            </button>
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors text-xs"
              >
                <ArrowLeft className="w-3 h-3" />
                Voltar
              </button>
              <span className="text-xs text-white/30">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[0.65rem]">SPACE</kbd> iniciar
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
