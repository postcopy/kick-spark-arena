import { ArrowLeft, Zap, Clock, Repeat, Timer, Wifi, WifiOff, Brain, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useSound } from '@/contexts/SoundContext';
import type { ReactionLevel, ReactionConfig } from '@/types/reaction';
import { REACTION_PRESETS, LEVEL_LABELS } from '@/types/reaction';
import { useState } from 'react';
import { AthletePickerDialog } from './AthletePickerDialog';
import { StudentAvatar } from './StudentAvatar';
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
    <div className="flex flex-col h-full w-full bg-[#0b1120] p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between mb-2 md:mb-3">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-400" />
          <h1 className="text-lg md:text-xl font-bold font-mono text-white tracking-wider">MODO REAÇÃO</h1>
        </div>
        <div className="w-9" />
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 flex flex-col max-w-6xl w-full mx-auto md:overflow-hidden overflow-y-auto gap-3">
        {/* Row 1: Athlete + Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-shrink-0">
          {/* Athlete card */}
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-green-500/30 transition-colors"
          >
            {selectedAthlete ? (
              <>
                <StudentAvatar name={selectedAthlete.name} avatarUrl={selectedAthlete.avatarUrl} belt={selectedAthlete.belt} size="sm" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">{selectedAthlete.name}</p>
                  <p className="text-xs text-white/40">Resultados serão salvos</p>
                </div>
              </>
            ) : isGuest ? (
              <>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-white/40" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">Visitante</p>
                  <p className="text-xs text-white/40">Sem salvar resultados</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">Selecionar Atleta</p>
                  <p className="text-xs text-white/40">Toque para escolher</p>
                </div>
              </>
            )}
          </button>

          {/* Difficulty card */}
          <div className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-white/5">
            <h2 className="text-xs font-bold font-mono text-white/60 uppercase tracking-wider mb-2">Dificuldade</h2>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handlePresetSelect(lvl)}
                  className={`p-2 md:p-3 rounded-lg font-bold text-xs md:text-sm font-mono transition-all ${
                    activePreset === lvl
                      ? 'bg-green-500 text-black scale-105'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {LEVEL_LABELS[lvl]}
                </button>
              ))}
            </div>
            {activePreset === 'custom' && (
              <p className="text-center text-xs text-white/40 mt-2 font-mono">Personalizado</p>
            )}
          </div>
        </div>

        {/* Row 2: Training Parameters */}
        <div className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-white/5 flex-1 min-h-0">
          <h3 className="text-xs font-bold font-mono text-white/60 uppercase tracking-wider mb-2">
            Parâmetros do Treino
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/40 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" /> Trabalho (s)
              </label>
              <Input
                type="number" min={5} max={120} value={config.workSec}
                onChange={(e) => updateField('workSec', Number(e.target.value))}
                className="h-9 bg-white/10 border-white/10 text-white font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 flex items-center gap-1 font-mono">
                <Timer className="w-3 h-3" /> Descanso (s)
              </label>
              <Input
                type="number" min={5} max={120} value={config.restSec}
                onChange={(e) => updateField('restSec', Number(e.target.value))}
                className="h-9 bg-white/10 border-white/10 text-white font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 flex items-center gap-1 font-mono">
                <Repeat className="w-3 h-3" /> Rounds
              </label>
              <Input
                type="number" min={1} max={20} value={config.rounds}
                onChange={(e) => updateField('rounds', Number(e.target.value))}
                className="h-9 bg-white/10 border-white/10 text-white font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 font-mono">Flash máx (ms)</label>
              <Input
                type="number" min={200} max={3000} step={100} value={config.flashMs}
                onChange={(e) => updateField('flashMs', Number(e.target.value))}
                className="h-9 bg-white/10 border-white/10 text-white font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 font-mono">Gap mín (ms)</label>
              <Input
                type="number" min={100} max={5000} step={100} value={config.gapMs.min}
                onChange={(e) => updateField('gapMin', Number(e.target.value))}
                className="h-9 bg-white/10 border-white/10 text-white font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 font-mono">Gap máx (ms)</label>
              <Input
                type="number" min={100} max={5000} step={100} value={config.gapMs.max}
                onChange={(e) => updateField('gapMax', Number(e.target.value))}
                className="h-9 bg-white/10 border-white/10 text-white font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Cognitive + Hardware + Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 flex-shrink-0">
          {/* Cognitive Mode */}
          <div className="md:col-span-2 bg-slate-900/50 p-3 md:p-4 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-xs font-bold font-mono text-white">Modo Cognitivo (Go/No-Go)</h3>
                  <p className="text-xs text-white/40">Treina inibição de impulso</p>
                </div>
              </div>
              <Switch
                checked={config.cognitiveMode}
                onCheckedChange={(checked) => onConfigChange({ ...config, cognitiveMode: checked })}
              />
            </div>
            {config.cognitiveMode && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40 font-mono">Probabilidade Verde (GO)</span>
                  <span className="text-sm font-bold text-green-400 font-mono">{config.goProbability}%</span>
                </div>
                <Slider
                  value={[config.goProbability]}
                  onValueChange={([val]) => onConfigChange({ ...config, goProbability: val })}
                  min={50} max={95} step={5}
                  className="w-full"
                />
                <p className="text-xs text-white/40 text-center">
                  🟢 Verde = Chuta! &nbsp; 🔴 Vermelho = Não chuta!
                </p>
              </div>
            )}
          </div>

          {/* Hardware + Info */}
          <div className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-white/5 space-y-3">
            <div className={`flex items-center gap-2 p-2 rounded-lg ${
              isHardwareConnected ? 'bg-green-500/10' : 'bg-white/5'
            }`}>
              {isHardwareConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-white/30" />
              )}
              <div>
                <p className="text-xs font-bold text-white font-mono">
                  {isHardwareConnected ? 'HW Online' : 'Sem hardware'}
                </p>
                <p className="text-[10px] text-white/40">
                  {isHardwareConnected ? 'Medição automática' : 'Treino visual'}
                </p>
              </div>
            </div>
            <div className="text-[11px] text-white/40 space-y-1">
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
      <footer className="flex-shrink-0 mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end max-w-6xl w-full mx-auto">
        {/* Rules summary */}
        <div className="hidden md:block md:col-span-2 bg-slate-900/50 p-3 rounded-xl border border-white/5">
          <div className="flex gap-4 text-xs text-white/40 font-mono">
            <span>⏱ {config.workSec}s trab / {config.restSec}s desc</span>
            <span>🔄 {config.rounds} rounds</span>
            <span>⚡ {config.flashMs}ms flash</span>
            <span>📊 Gap {config.gapMs.min}–{config.gapMs.max}ms</span>
            {config.cognitiveMode && <span>🧠 Go/No-Go {config.goProbability}%</span>}
          </div>
        </div>

        {/* Start button */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full font-bold font-mono text-base py-5 tracking-wider ${
              canStart
                ? 'bg-green-500 hover:bg-green-600 text-black'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {canStart ? 'INICIAR TREINO' : 'SELECIONE UM ATLETA'}
          </Button>
          <button onClick={onBack} className="text-xs text-white/30 hover:text-white/60 font-mono text-center transition-colors">
            Voltar
          </button>
        </div>
      </footer>

      <AthletePickerDialog
        open={showPicker}
        onOpenChange={setShowPicker}
        onSelect={(athlete, guest) => onAthleteChange(athlete, guest)}
      />
    </div>
  );
}
