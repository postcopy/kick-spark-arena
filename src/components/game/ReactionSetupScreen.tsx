import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';
import { ChevronRight, HelpCircle } from 'lucide-react';
import type { ReactionLevel, ReactionConfig } from '@/types/reaction';
import { REACTION_PRESETS, LEVEL_LABELS } from '@/types/reaction';
import { AthletePickerDialog } from './AthletePickerDialog';
import { MissionBriefing } from './MissionBriefing';
import { SetupTutorialDialog } from './SetupTutorialDialog';
import { useIdleAttention } from '@/hooks/useIdleAttention';
import type { Athlete } from '@/types/game';
import bgMenuModos from '@/assets/menu-modos.jpg';

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
    <div className="flex flex-col h-full w-full bg-[#0b1120] p-4 md:p-6 overflow-hidden relative">
      <img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none" alt="" />

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between mb-2 md:mb-3 relative z-10">
        <h1 className="text-[clamp(1.5rem,4vmin,3rem)] font-black text-white tracking-tighter font-mono uppercase">
          MODO <span className="text-green-400">REAÇÃO</span>
        </h1>
        <button
          onClick={() => setShowTutorial(true)}
          className="flex items-center gap-1.5 font-mono text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden md:inline">AJUDA</span>
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 flex flex-col max-w-6xl w-full mx-auto overflow-hidden gap-2 relative z-10">
        {/* Row 1: Athlete + Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <button
            onClick={() => setShowPicker(true)}
            className={cn(
              "flex items-center justify-between px-6 h-10 md:h-12 transition-all",
              canStart
                ? "bg-transparent border border-white/5 hover:bg-white/5 hover:border-white/10"
                : "bg-green-500/15 border border-green-500/40 hover:bg-green-500/25 animate-pulse"
            )}
          >
            <span className={cn("font-mono font-bold text-sm", canStart ? "text-white" : "text-green-400")}>
              {selectedAthlete ? selectedAthlete.name : isGuest ? 'VISITANTE' : 'SELECIONAR ATLETA'}
            </span>
            <div className="flex items-center gap-2">
              {isHardwareConnected ? (
                <div className="w-2 h-2 rounded-full bg-green-500" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white/20" />
              )}
              <span className="font-mono text-xs text-white/30">
                {isHardwareConnected ? 'HW ON' : 'SEM HW'}
              </span>
            </div>
          </button>

          <div className="flex flex-col gap-1">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => handlePresetSelect(lvl)}
                className={cn(
                  "group flex items-center justify-between px-6 h-10 md:h-12 transition-all duration-200 cursor-pointer",
                  activePreset === lvl
                    ? "bg-green-500 text-black border border-transparent"
                    : "bg-transparent border border-white/5 text-white/20 hover:bg-white/5 hover:text-white/40 hover:border-white/10"
                )}
              >
                <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                  {LEVEL_LABELS[lvl]}
                </span>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-mono text-lg",
                    activePreset === lvl ? "text-black/60" : "text-white/20"
                  )}>
                    {LEVEL_META[lvl]}
                  </span>
                  <ChevronRight className={cn(
                    "transition-all duration-200",
                    activePreset === lvl
                      ? "w-5 h-5 text-black"
                      : "w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1"
                  )} />
                </div>
              </button>
            ))}
            {activePreset === 'custom' && (
              <p className="text-xs text-white/30 font-mono mt-1">PERSONALIZADO</p>
            )}
          </div>
        </div>

        {/* Mission Briefing */}
        <div className="flex-shrink-0">
          <MissionBriefing text={activePreset !== 'custom' ? LEVEL_BRIEFINGS[activePreset as ReactionLevel] || '' : 'CONFIGURAÇÃO PERSONALIZADA: Parâmetros ajustados manualmente.'} />
        </div>

        {/* Row 2: Training Parameters */}
        <div className="bg-black/20 p-3 md:p-4 rounded-xl border border-white/10 flex-shrink-0">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mb-3">
            PARÂMETROS DO TREINO
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                Trabalho (s)
              </label>
              <Input
                type="number" min={5} max={120} value={config.workSec}
                onChange={(e) => updateField('workSec', Number(e.target.value))}
                className="h-8 bg-white/10 border-white/10 text-white font-mono text-sm rounded-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                Descanso (s)
              </label>
              <Input
                type="number" min={5} max={120} value={config.restSec}
                onChange={(e) => updateField('restSec', Number(e.target.value))}
                className="h-8 bg-white/10 border-white/10 text-white font-mono text-sm rounded-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                Rounds
              </label>
              <Input
                type="number" min={1} max={20} value={config.rounds}
                onChange={(e) => updateField('rounds', Number(e.target.value))}
                className="h-8 bg-white/10 border-white/10 text-white font-mono text-sm rounded-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Tempo do alvo (ms)</label>
              <Input
                type="number" min={200} max={3000} step={100} value={config.flashMs}
                onChange={(e) => updateField('flashMs', Number(e.target.value))}
                className="h-8 bg-white/10 border-white/10 text-white font-mono text-sm rounded-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Intervalo mín (ms)</label>
              <Input
                type="number" min={100} max={5000} step={100} value={config.gapMs.min}
                onChange={(e) => updateField('gapMin', Number(e.target.value))}
                className="h-8 bg-white/10 border-white/10 text-white font-mono text-sm rounded-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Intervalo máx (ms)</label>
              <Input
                type="number" min={100} max={5000} step={100} value={config.gapMs.max}
                onChange={(e) => updateField('gapMax', Number(e.target.value))}
                className="h-8 bg-white/10 border-white/10 text-white font-mono text-sm rounded-none"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Cognitive + Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="md:col-span-2 bg-black/20 p-3 md:p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-[0.2em]">Modo Cognitivo (Go/No-Go)</h3>
                <p className="font-mono text-xs text-white/40">Treina inibição de impulso</p>
              </div>
              <Switch
                checked={config.cognitiveMode}
                onCheckedChange={(checked) => onConfigChange({ ...config, cognitiveMode: checked })}
              />
            </div>
            {config.cognitiveMode && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-white/40">Probabilidade Verde (GO)</span>
                  <span className="text-sm font-bold text-green-400 font-mono">{config.goProbability}%</span>
                </div>
                <Slider
                  value={[config.goProbability]}
                  onValueChange={([val]) => onConfigChange({ ...config, goProbability: val })}
                  min={50} max={95} step={5}
                  className="w-full"
                  trackClassName="h-1 bg-white/10 rounded-none"
                  rangeClassName="bg-green-500"
                  thumbClassName="w-3 h-3 rounded-none bg-green-500 border-none"
                />
                <p className="font-mono text-xs text-white/40 text-center">
                  🟢 Verde = Chuta! &nbsp; 🔴 Vermelho = Não chuta!
                </p>
              </div>
            )}
          </div>

          <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", isHardwareConnected ? "bg-green-500" : "bg-white/20")} />
              <span className="font-mono text-xs text-white/60">
                {isHardwareConnected ? 'HW ONLINE' : 'SEM HARDWARE'}
              </span>
            </div>
            <div className="font-mono text-[11px] text-white/40 space-y-1">
              {config.cognitiveMode ? (
                <>
                  <p>🟢 Verde → Chute rápido</p>
                  <p>🔴 Vermelho → Segure!</p>
                </>
              ) : (
                <p>💡 Luz acende → Reaja rápido!</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end max-w-6xl w-full mx-auto relative z-10">
        <div className="hidden md:block md:col-span-2 border-l-2 border-cyan-500/50 pl-4 py-2">
          <h3 className="font-mono text-[0.65rem] font-bold text-cyan-500/60 uppercase tracking-widest mb-1">REGRAS DO SISTEMA</h3>
          <div className="flex gap-4 font-mono text-xs text-white/40">
            <span>⏱ {config.workSec}s trab / {config.restSec}s desc</span>
            <span>🔄 {config.rounds} rounds</span>
            <span>⚡ {config.flashMs}ms flash</span>
            <span>📊 Gap {config.gapMs.min}–{config.gapMs.max}ms</span>
            {config.cognitiveMode && <span>🧠 Go/No-Go {config.goProbability}%</span>}
            <p className="mt-1 text-white/50 font-mono text-xs">
              <span className="text-orange-500 font-bold tracking-wider">SENSOR:</span>{" "}
              Aguarde o reset. O sistema ignora impactos múltiplos simultâneos.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={cn(
              'w-full h-14 font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center',
              canStart
                ? 'bg-green-500 text-black hover:brightness-110'
                : 'bg-white/10 text-white/30 cursor-not-allowed',
              canStart && isIdle && 'animate-pulse'
            )}
            style={canStart ? { clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' } : undefined}
          >
            {canStart ? 'INICIAR TREINO' : 'SELECIONE UM ATLETA'}
          </button>
          <button onClick={onBack} className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors text-center">
            ← VOLTAR
          </button>
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
