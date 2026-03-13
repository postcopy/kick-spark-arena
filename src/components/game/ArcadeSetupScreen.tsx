import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';
import { ChevronRight, HelpCircle, Settings2, Swords, Shield, Flame } from 'lucide-react';
import { MissionBriefing } from './MissionBriefing';
import { SetupTutorialDialog } from './SetupTutorialDialog';
import { useIdleAttention } from '@/hooks/useIdleAttention';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  { value: 1, label: 'R\u00c1PIDO' },
  { value: 3, label: 'MELHOR DE 3' },
];

const INTENSITY_PRESETS = [
  { id: 'sprint', label: 'LEVE', meta: '50 HP', damage: 2.0, icon: Shield, desc: 'Combate r\u00e1pido' },
  { id: 'resistance', label: 'M\u00c9DIO', meta: '100 HP', damage: 1.0, icon: Swords, desc: 'Luta padr\u00e3o' },
  { id: 'elite', label: 'PESADO', meta: '200 HP', damage: 0.5, icon: Flame, desc: 'Resist\u00eancia total' },
];

const BRIEFING_TEXTS: Record<string, string> = {
  sprint: 'COMBATE R\u00c1PIDO: Pouca vida, muito dano. Foco em explos\u00e3o e precis\u00e3o.',
  resistance: 'LUTA PADR\u00c3O: Equil\u00edbrio entre ataque e defesa. O formato cl\u00e1ssico.',
  elite: 'RESIST\u00caNCIA TOTAL: Muita vida, pouco dano. Maratona de combate.',
};

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
  const [showTutorial, setShowTutorial] = useState(false);
  const isIdle = useIdleAttention(5000);

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
    <div className="flex flex-col h-full w-full bg-[#0A0A0F] p-4 md:p-6 overflow-hidden relative">
      {/* Ambient red glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between mb-4 md:mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Swords className="w-5 h-5 text-red-400/60" />
            <span className="font-mono text-[10px] text-red-400/40 uppercase tracking-[0.3em]">Duelo</span>
          </div>
          <h1 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight">
            Corrida de Demoli\u00e7\u00e3o
          </h1>
        </div>
        <button
          onClick={() => setShowTutorial(true)}
          className="text-white/20 hover:text-white/40 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto flex flex-col overflow-hidden relative z-10">
        {/* Intensity Presets - Weight Classes */}
        <div className="flex-shrink-0 mb-4">
          <p className="text-white/20 text-xs mb-3">Classe de combate</p>
          <div className="flex flex-col gap-2">
            {INTENSITY_PRESETS.map((preset) => {
              const isActive = selectedPreset === preset.id;
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className={cn(
                    "group flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.99]",
                    isActive
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isActive ? "bg-red-500/20" : "bg-white/5"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? "text-red-400" : "text-white/25")} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className={cn(
                      "block font-display font-bold text-lg",
                      isActive ? "text-red-400" : "text-white/50"
                    )}>
                      {preset.label}
                    </span>
                    <span className="block text-[10px] text-white/25">{preset.desc}</span>
                  </div>
                  <span className={cn(
                    "font-mono text-sm",
                    isActive ? "text-red-400/60" : "text-white/20"
                  )}>
                    {preset.meta}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <MissionBriefing text={BRIEFING_TEXTS[selectedPreset] || ''} />

        {/* Advanced Controls - Collapsible */}
        <Collapsible className="flex-shrink-0 my-3">
          <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-white/25" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Ajustes avan\u00e7ados</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/15 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 bg-white/[0.02] p-4 md:p-5 rounded-xl border border-white/[0.06] data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Round Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Tempo do Round</span>
                  <span className="font-mono text-white/60 text-lg font-bold">{roundDuration}s</span>
                </div>
                <Slider
                  value={[roundDuration]}
                  onValueChange={(values) => onRoundDurationChange(values[0])}
                  min={15}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between font-mono text-[10px] text-white/15 mt-1">
                  <span>15s</span>
                  <span>120s</span>
                </div>
              </div>

              {/* Format + Interval */}
              <div className="space-y-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25 block mb-2">Formato</span>
                  <div className="flex bg-white/[0.03] rounded-lg p-1 gap-1">
                    {BEST_OF_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onBestOfChange(option.value)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg font-bold text-sm font-mono transition-all",
                          bestOf === option.value
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "text-white/30 bg-transparent hover:text-white/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {bestOf === 3 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Intervalo</span>
                      <span className="font-mono text-white/60 text-lg font-bold">{recoveryInterval}s</span>
                    </div>
                    <Slider
                      value={[recoveryInterval]}
                      onValueChange={(values) => onRecoveryIntervalChange(values[0])}
                      min={5}
                      max={60}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Footer: Rules + Start */}
        <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-auto">
          {/* Rules */}
          <div className="md:col-span-2 rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-3">
            <p className="text-white/30 text-xs leading-relaxed">
              <span className="text-red-400 font-bold">REGRAS:</span>{" "}
              Meta: {activePreset.meta} | Dano: {activePreset.damage}x | Quem zerar primeiro vence!
            </p>
            <p className="text-white/20 text-[10px] mt-1">
              Sensor detecta apenas impactos limpos. Chute {"\u2192"} Recolha {"\u2192"} Chute.
            </p>
          </div>

          {/* Action */}
          <div className="md:col-span-1 flex flex-col gap-2">
            <button
              onClick={handleStart}
              className={cn(
                "w-full h-14 rounded-xl font-display font-bold uppercase tracking-wider text-lg transition-all flex items-center justify-center gap-3",
                "bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] shadow-[0_0_30px_rgba(225,29,72,0.2)]",
                isIdle && "animate-pulse"
              )}
            >
              <Swords className="w-5 h-5" />
              LUTAR!
            </button>
            <div className="flex items-center justify-between">
              <button onClick={onBack} className="text-white/20 hover:text-white/40 transition-colors text-[10px] font-mono tracking-wider">
                \u2190 VOLTAR
              </button>
              <span className="text-[10px] text-white/15 font-mono">
                <kbd className="px-1 py-0.5 bg-white/5 rounded text-[9px]">SPACE</kbd> iniciar
              </span>
            </div>
          </div>
        </div>
      </main>

      <SetupTutorialDialog open={showTutorial} onOpenChange={setShowTutorial} accentColor="bg-red-500" />
    </div>
  );
}
