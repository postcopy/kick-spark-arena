import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';
import { ChevronRight, HelpCircle, Settings2, Eye, Crosshair, Shield, Zap } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ReactionLevel, ReactionConfig } from '@/types/reaction';
import { REACTION_PRESETS, LEVEL_LABELS } from '@/types/reaction';
import { AthletePickerDialog } from './AthletePickerDialog';
import { MissionBriefing } from './MissionBriefing';
import { SetupTutorialDialog } from './SetupTutorialDialog';
import { useIdleAttention } from '@/hooks/useIdleAttention';
import type { Athlete } from '@/types/game';

interface ReactionSetupScreenProps {
  config: ReactionConfig;
  onConfigChange: (config: ReactionConfig) => void;
  onStart: () => void;
  onBack: () => void;
  isHardwareConnected: boolean;
  selectedAthlete: Athlete | null;
  isGuest: boolean;
  onAthleteChange: (athlete: Athlete | null, isGuest: boolean) => void;
}

const LEVELS: ReactionLevel[] = ['beginner', 'intermediate', 'elite'];

const LEVEL_META: Record<ReactionLevel, string> = {
  beginner: '30s / 3R',
  intermediate: '45s / 5R',
  elite: '60s / 8R',
};

const LEVEL_ICONS: Record<ReactionLevel, typeof Shield> = {
  beginner: Shield,
  intermediate: Eye,
  elite: Zap,
};

const LEVEL_DESC: Record<ReactionLevel, string> = {
  beginner: 'Aquecimento',
  intermediate: 'Padrão',
  elite: 'Limite',
};

const LEVEL_BRIEFINGS: Record<ReactionLevel, string> = {
  beginner: 'MODO INICIANTE: Reflexos básicos com tempos generosos. Ideal para aquecimento.',
  intermediate: 'MODO INTERMEDIÁRIO: Velocidade e consistência. Prepare-se para reagir rápido.',
  elite: 'MODO ELITE: Reflexos no limite. Cada milissegundo conta.',
};

export function ReactionSetupScreen({
  config,
  onConfigChange,
  onStart,
  onBack,
  isHardwareConnected,
  selectedAthlete,
  isGuest,
  onAthleteChange,
}: ReactionSetupScreenProps) {
  const { unlockAudio, initFullPreload } = useSound();
  const [activePreset, setActivePreset] = useState<ReactionLevel | 'custom'>(config.level);
  const [showPicker, setShowPicker] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const isIdle = useIdleAttention(5000);

  const canStart = selectedAthlete !== null || isGuest === true;

  const handlePresetSelect = (level: ReactionLevel) => {
    setActivePreset(level);
    onConfigChange({ ...REACTION_PRESETS[level], cognitiveMode: config.cognitiveMode, goProbability: config.goProbability });
  };

  const updateField = (field: string, value: number) => {
    setActivePreset('custom');
    if (field === 'gapMin') {
      onConfigChange({ ...config, level: config.level, gapMs: { ...config.gapMs, min: value } });
    } else if (field === 'gapMax') {
      onConfigChange({ ...config, level: config.level, gapMs: { ...config.gapMs, max: value } });
    } else {
      onConfigChange({ ...config, level: config.level, [field]: value } as ReactionConfig);
    }
  };

  const handleStart = () => {
    if (!canStart) return;
    unlockAudio();
    initFullPreload();
    onStart();
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0F] p-4 md:p-6 overflow-hidden relative">
      {/* Ambient green glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between mb-4 md:mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-5 h-5 text-green-400/60" />
            <span className="font-mono text-[10px] text-green-400/40 uppercase tracking-[0.3em]">Missão</span>
          </div>
          <h1 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight">
            Centro de Treinamento
          </h1>
        </div>
        <button
          onClick={() => setShowTutorial(true)}
          className="text-white/20 hover:text-white/40 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto overflow-hidden relative z-10">
        {/* Athlete Selector */}
        <button
          onClick={() => setShowPicker(true)}
          className={cn(
            "flex-shrink-0 flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all mb-3",
            canStart
              ? "bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]"
              : "bg-green-500/10 border-green-500/30 hover:bg-green-500/15 animate-pulse"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              canStart ? "bg-green-500/20" : "bg-green-500/30"
            )}>
              <Crosshair className={cn("w-4 h-4", canStart ? "text-green-400" : "text-green-300")} />
            </div>
            <span className={cn("font-display font-bold text-base", canStart ? "text-white" : "text-green-400")}>
              {selectedAthlete ? selectedAthlete.name : isGuest ? 'VISITANTE' : 'SELECIONAR ATLETA'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isHardwareConnected ? "bg-green-500" : "bg-white/20")} />
            <span className="font-mono text-[10px] text-white/25">
              {isHardwareConnected ? 'ONLINE' : 'SEM HW'}
            </span>
          </div>
        </button>

        {/* Difficulty Levels */}
        <div className="flex-shrink-0 mb-3">
          <p className="text-white/20 text-xs mb-3">Nível de dificuldade</p>
          <div className="flex flex-col gap-2">
            {LEVELS.map((lvl) => {
              const isActive = activePreset === lvl;
              const Icon = LEVEL_ICONS[lvl];
              return (
                <button
                  key={lvl}
                  onClick={() => handlePresetSelect(lvl)}
                  className={cn(
                    "group flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all duration-200 active:scale-[0.99]",
                    isActive
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isActive ? "bg-green-500/20" : "bg-white/5"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? "text-green-400" : "text-white/25")} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className={cn(
                      "block font-display font-bold text-lg",
                      isActive ? "text-green-400" : "text-white/50"
                    )}>
                      {LEVEL_LABELS[lvl]}
                    </span>
                    <span className="block text-[10px] text-white/25">{LEVEL_DESC[lvl]}</span>
                  </div>
                  <span className={cn(
                    "font-mono text-sm",
                    isActive ? "text-green-400/60" : "text-white/20"
                  )}>
                    {LEVEL_META[lvl]}
                  </span>
                </button>
              );
            })}
            {activePreset === 'custom' && (
              <p className="text-[10px] text-white/20 font-mono ml-1">PARÂMETROS PERSONALIZADOS</p>
            )}
          </div>
        </div>

        <MissionBriefing text={activePreset !== 'custom' ? LEVEL_BRIEFINGS[activePreset as ReactionLevel] || '' : 'CONFIGURAÇÃO PERSONALIZADA: Parâmetros ajustados manualmente.'} />

        {/* Advanced Controls - Collapsible */}
        <Collapsible className="flex-shrink-0 my-3">
          <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-white/25" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">
                {activePreset === 'custom' ? 'Parâmetros personalizados' : 'Personalizar parâmetros'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/15 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 bg-white/[0.02] p-4 md:p-5 rounded-xl border border-white/[0.06] data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Trabalho (s)</label>
                <Input
                  type="number" min={5} max={120} value={config.workSec}
                  onChange={(e) => updateField('workSec', Number(e.target.value))}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white font-mono text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Descanso (s)</label>
                <Input
                  type="number" min={5} max={120} value={config.restSec}
                  onChange={(e) => updateField('restSec', Number(e.target.value))}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white font-mono text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Rounds</label>
                <Input
                  type="number" min={1} max={20} value={config.rounds}
                  onChange={(e) => updateField('rounds', Number(e.target.value))}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white font-mono text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Tempo alvo (ms)</label>
                <Input
                  type="number" min={200} max={3000} step={100} value={config.flashMs}
                  onChange={(e) => updateField('flashMs', Number(e.target.value))}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white font-mono text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Gap mín (ms)</label>
                <Input
                  type="number" min={100} max={5000} step={100} value={config.gapMs.min}
                  onChange={(e) => updateField('gapMin', Number(e.target.value))}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white font-mono text-sm rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/25">Gap máx (ms)</label>
                <Input
                  type="number" min={100} max={5000} step={100} value={config.gapMs.max}
                  onChange={(e) => updateField('gapMax', Number(e.target.value))}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white font-mono text-sm rounded-lg"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Cognitive Mode + Rules Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-shrink-0">
          <div className="md:col-span-2 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold text-white/60 uppercase tracking-[0.15em]">Modo Cognitivo (Go/No-Go)</h3>
                <p className="font-mono text-[10px] text-white/25 mt-0.5">Treina inibição de impulso</p>
              </div>
              <Switch
                checked={config.cognitiveMode}
                onCheckedChange={(checked) => onConfigChange({ ...config, cognitiveMode: checked })}
              />
            </div>
            {config.cognitiveMode && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-white/25 uppercase tracking-wider">Probabilidade GO</span>
                  <span className="text-sm font-bold text-green-400 font-mono">{config.goProbability}%</span>
                </div>
                <Slider
                  value={[config.goProbability]}
                  onValueChange={([val]) => onConfigChange({ ...config, goProbability: val })}
                  min={50} max={95} step={5}
                  className="w-full"
                />
                <p className="font-mono text-[10px] text-white/25 text-center">
                  Verde = Chuta! &nbsp; Vermelho = Segura!
                </p>
              </div>
            )}
          </div>

          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.06] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-2 h-2 rounded-full", isHardwareConnected ? "bg-green-500" : "bg-white/20")} />
              <span className="font-mono text-[10px] text-white/30">
                {isHardwareConnected ? 'HW ONLINE' : 'SEM HARDWARE'}
              </span>
            </div>
            <div className="font-mono text-[10px] text-white/25 space-y-1">
              {config.cognitiveMode ? (
                <>
                  <p>Verde = Chute rápido</p>
                  <p>Vermelho = Segure!</p>
                </>
              ) : (
                <p>Luz acende = Reaja rápido!</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end max-w-5xl w-full mx-auto relative z-10">
        <div className="hidden md:block md:col-span-2 rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-3">
          <p className="text-white/30 text-xs leading-relaxed">
            <span className="text-green-400 font-bold">REGRAS:</span>{" "}
            {config.workSec}s trab / {config.restSec}s desc | {config.rounds} rounds | {config.flashMs}ms flash | Gap {config.gapMs.min}\u2013{config.gapMs.max}ms
            {config.cognitiveMode && ` | Go/No-Go ${config.goProbability}%`}
          </p>
          <p className="text-white/20 text-[10px] mt-1">
            Sensor detecta apenas impactos limpos. Aguarde o reset entre estímulos.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              "w-full h-14 rounded-xl font-display font-bold uppercase tracking-wider text-lg transition-all flex items-center justify-center gap-3",
              canStart
                ? "bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                : "bg-white/[0.04] text-white/25 cursor-not-allowed",
              canStart && isIdle && "animate-pulse"
            )}
          >
            <Crosshair className="w-5 h-5" />
            {canStart ? 'INICIAR MISSÃO' : 'SELECIONE ATLETA'}
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
      </footer>

      <AthletePickerDialog
        open={showPicker}
        onOpenChange={setShowPicker}
        onSelect={(athlete, guest) => onAthleteChange(athlete, guest)}
      />

      <SetupTutorialDialog open={showTutorial} onOpenChange={setShowTutorial} accentColor="bg-green-500" />
    </div>
  );
}
