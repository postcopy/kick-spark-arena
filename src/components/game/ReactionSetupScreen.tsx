import { ArrowLeft, Zap, Clock, Repeat, Timer, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSound } from '@/contexts/SoundContext';
import type { ReactionLevel, ReactionConfig } from '@/types/reaction';
import { REACTION_PRESETS, LEVEL_LABELS } from '@/types/reaction';
import { useState, useEffect } from 'react';

interface ReactionSetupScreenProps {
  config: ReactionConfig;
  onConfigChange: (config: ReactionConfig) => void;
  onStart: () => void;
  onBack: () => void;
  isHardwareConnected: boolean;
}

const LEVELS: ReactionLevel[] = ['beginner', 'intermediate', 'elite'];

export function ReactionSetupScreen({
  config,
  onConfigChange,
  onStart,
  onBack,
  isHardwareConnected,
}: ReactionSetupScreenProps) {
  const { unlockAudio, initFullPreload } = useSound();
  const [activePreset, setActivePreset] = useState<ReactionLevel | 'custom'>(config.level);

  const handlePresetSelect = (level: ReactionLevel) => {
    setActivePreset(level);
    onConfigChange({ ...REACTION_PRESETS[level] });
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
    unlockAudio();
    initFullPreload();
    onStart();
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-shrink-0 w-full flex items-center justify-between p-4 md:px-6 border-b border-border">
        <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-500" />
          <h1 className="text-xl font-bold text-foreground">MODO REAÇÃO</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Preset selector */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border">
            <h2 className="text-lg font-bold text-foreground mb-3 text-center">Dificuldade</h2>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handlePresetSelect(lvl)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all ${
                    activePreset === lvl
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {LEVEL_LABELS[lvl]}
                </button>
              ))}
            </div>
            {activePreset === 'custom' && (
              <p className="text-center text-xs text-muted-foreground mt-2">Personalizado</p>
            )}
          </div>

          {/* Editable fields */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Parâmetros do Treino
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Trabalho (s)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={config.workSec}
                  onChange={(e) => updateField('workSec', Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5" /> Descanso (s)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={config.restSec}
                  onChange={(e) => updateField('restSec', Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5" /> Rounds
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={config.rounds}
                  onChange={(e) => updateField('rounds', Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Flash máx (ms)</label>
                <Input
                  type="number"
                  min={200}
                  max={3000}
                  step={100}
                  value={config.flashMs}
                  onChange={(e) => updateField('flashMs', Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Gap mín (ms)</label>
                <Input
                  type="number"
                  min={100}
                  max={5000}
                  step={100}
                  value={config.gapMs.min}
                  onChange={(e) => updateField('gapMin', Number(e.target.value))}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Gap máx (ms)</label>
                <Input
                  type="number"
                  min={100}
                  max={5000}
                  step={100}
                  value={config.gapMs.max}
                  onChange={(e) => updateField('gapMax', Number(e.target.value))}
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Hardware status */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            isHardwareConnected
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-border bg-muted/50'
          }`}>
            {isHardwareConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {isHardwareConnected ? 'Hardware conectado' : 'Sem hardware'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isHardwareConnected
                  ? 'Tempo de reação será medido automaticamente'
                  : 'Treino visual sem medição de tempo'}
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Como Funciona
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• O círculo acende com uma cor — <span className="text-green-400 font-bold">reaja o mais rápido possível!</span></p>
              <p>• A luz apaga sozinha após o tempo máximo ou quando você chuta o colete.</p>
              {isHardwareConnected && (
                <p>• Seu tempo de reação será exibido na tela após cada golpe.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-border">
        <Button
          onClick={handleStart}
          size="lg"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-6"
        >
          INICIAR TREINO
        </Button>
      </footer>
    </div>
  );
}
