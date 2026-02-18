import { useState } from 'react';
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
  { id: 'sprint', label: 'SPRINT', meta: 'TARGET: 50', damage: 2.0 },
  { id: 'resistance', label: 'RESISTÊNCIA', meta: 'TARGET: 100', damage: 1.0 },
  { id: 'elite', label: 'ELITE', meta: 'TARGET: 200', damage: 0.5 },
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
      <img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none" alt="" />

      {/* Header — terminal style, left-aligned */}
      <header className="flex-shrink-0 text-left mb-4 md:mb-6 relative z-10">
        <h1 className="text-[clamp(1.5rem,4vmin,3rem)] font-black text-white tracking-tighter font-mono uppercase">
          CORRIDA DE <span className="text-[#FFD700]">DEMOLIÇÃO</span>
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex flex-col overflow-hidden relative z-10">
        {/* Intensity Preset Cards — flat horizontal bars */}
        <div className="flex-shrink-0 mb-4 md:mb-6">
          <div className="flex flex-col gap-2">
            {INTENSITY_PRESETS.map((preset) => {
              const isActive = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className={cn(
                    "flex items-center justify-between px-6 h-14 md:h-16 transition-all duration-200",
                    isActive
                      ? "bg-[#FFD700] text-black border border-transparent"
                      : "bg-transparent border border-white/5 text-white/20 hover:text-white/40 hover:border-white/10"
                  )}
                >
                  <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                    {preset.label}
                  </span>
                  <span className={cn(
                    "font-mono text-lg md:text-xl",
                    isActive ? "text-black/60" : "text-white/20"
                  )}>
                    {preset.meta}
                  </span>
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
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">TEMPO DO ROUND</span>
                <span className="font-mono text-white/70 text-xl md:text-2xl font-black">{roundDuration}s</span>
              </div>
              <Slider
                value={[roundDuration]}
                onValueChange={(values) => onRoundDurationChange(values[0])}
                min={15}
                max={120}
                step={5}
                className="w-full"
                trackClassName="h-1 bg-white/10 rounded-none"
                rangeClassName="bg-[#FFD700]"
                thumbClassName="w-3 h-3 rounded-none bg-[#FFD700] border-none"
              />
              <div className="flex justify-between font-mono text-xs text-white/30 mt-1">
                <span>15s</span>
                <span>120s</span>
              </div>
            </div>

            {/* Right Column: Format + Interval stacked */}
            <div className="space-y-3">
              {/* Best Of - Segmented Control */}
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 block mb-2">FORMATO</span>
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
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">INTERVALO</span>
                    <span className="font-mono text-white/70 text-xl md:text-2xl font-black">{recoveryInterval}s</span>
                  </div>
                  <Slider
                    value={[recoveryInterval]}
                    onValueChange={(values) => onRecoveryIntervalChange(values[0])}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                    trackClassName="h-1 bg-white/10 rounded-none"
                    rangeClassName="bg-[#FFD700]"
                    thumbClassName="w-3 h-3 rounded-none bg-[#FFD700] border-none"
                  />
                  <div className="flex justify-between font-mono text-xs text-white/30 mt-1">
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
          <div className="md:col-span-2 border-l-2 border-cyan-500/50 pl-4 py-2">
            <h3 className="font-mono text-[0.65rem] font-bold text-cyan-500/60 uppercase tracking-widest mb-1">REGRAS DO SISTEMA</h3>
            <ul className="font-mono text-xs text-white/40 space-y-0.5">
              <li>• META: <span className="text-white/70 font-bold">100</span> pts | Dano: <span className="text-white/70 font-bold">{activePreset.damage}</span> | Chutes: <span className="text-white/70 font-bold">{activePreset.meta}</span></li>
              <li>• Combo: chutes rápidos em sequência (até +4 dano) · <span className="text-[#FFD700] font-bold">Quem zerar primeiro vence!</span></li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-1 flex flex-col gap-2">
            <button
              onClick={handleStart}
              className="w-full h-14 bg-[#FFD700] text-black font-black uppercase tracking-widest text-lg hover:brightness-110 transition-all flex items-center justify-center"
              style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
            >
              INICIAR DUELO
            </button>
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="text-white/30 hover:text-white/60 transition-colors text-xs font-mono"
              >
                ← VOLTAR
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
