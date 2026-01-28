import { ArrowLeft, Zap, Timer, Target, AlertTriangle, Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { 
  ReactionConfig, 
  LevelPreset, 
  BEGINNER_PRESET, 
  INTERMEDIATE_PRESET, 
  ADVANCED_PRESET,
  DRILL_DEFINITIONS,
  CUE_VISUALS,
  ReactionCue,
} from '@/types/reaction';
import { cn } from '@/lib/utils';

interface ReactionSetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  config: ReactionConfig;
  onConfigChange: (config: ReactionConfig) => void;
}

const LEVEL_PRESETS: { level: LevelPreset; label: string; config: ReactionConfig }[] = [
  { level: 'beginner', label: 'Iniciante', config: BEGINNER_PRESET },
  { level: 'intermediate', label: 'Intermediário', config: INTERMEDIATE_PRESET },
  { level: 'advanced', label: 'Avançado', config: ADVANCED_PRESET },
];

export function ReactionSetupScreen({ 
  onStart, 
  onBack, 
  config, 
  onConfigChange 
}: ReactionSetupScreenProps) {
  const currentLevel = config.levelPreset;
  const availableDrills = DRILL_DEFINITIONS.filter(d => d.levelPreset === currentLevel || 
    (currentLevel === 'advanced' && d.levelPreset !== 'beginner') ||
    (currentLevel === 'intermediate' && d.levelPreset === 'beginner'));

  const handleLevelChange = (level: LevelPreset) => {
    const preset = LEVEL_PRESETS.find(p => p.level === level);
    if (preset) {
      onConfigChange(preset.config);
    }
  };

  const handleDrillChange = (drillId: string) => {
    const drill = DRILL_DEFINITIONS.find(d => d.id === drillId);
    if (drill) {
      onConfigChange({
        ...config,
        ...drill.config,
      });
    }
  };

  const currentDrill = DRILL_DEFINITIONS.find(d => 
    d.config.drillType === config.drillType && 
    JSON.stringify(d.config.cueSet) === JSON.stringify(config.cueSet)
  ) || DRILL_DEFINITIONS[0];

  // Get legend cues for display
  const legendCues = config.cueSet.filter(c => c !== 'GO' && c !== 'NO_GO');
  const showNoGoLegend = config.noGoRate > 0 || config.drillType === 'goNoGo';

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-4 p-4 border-b border-border">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-purple-500" />
          <h1 className="text-xl font-bold">TREINO DE REAÇÃO</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Level Selection */}
        <div className="bg-game-surface p-4 rounded-lg border border-border">
          <h2 className="text-lg font-bold mb-3">NÍVEL</h2>
          <div className="grid grid-cols-3 gap-2">
            {LEVEL_PRESETS.map(({ level, label }) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all font-medium",
                  currentLevel === level
                    ? "border-purple-500 bg-purple-500/20 text-purple-400"
                    : "border-border hover:border-purple-500/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Drill Selection */}
        <div className="bg-game-surface p-4 rounded-lg border border-border">
          <h2 className="text-lg font-bold mb-3">DRILL</h2>
          <div className="space-y-2">
            {availableDrills.map(drill => (
              <button
                key={drill.id}
                onClick={() => handleDrillChange(drill.id)}
                className={cn(
                  "w-full p-3 rounded-lg border-2 transition-all text-left",
                  currentDrill?.id === drill.id
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-border hover:border-purple-500/50"
                )}
              >
                <div className="font-medium">{drill.name}</div>
                <div className="text-sm text-muted-foreground">{drill.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Fine-tuning */}
        <div className="bg-game-surface p-4 rounded-lg border border-border space-y-4">
          <h2 className="text-lg font-bold">AJUSTES</h2>
          
          {/* Cue Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Duração do Cue</span>
              </div>
              <span className="text-xl font-bold text-purple-500">{config.cueDurationMs}ms</span>
            </div>
            <Slider
              value={[config.cueDurationMs]}
              onValueChange={([value]) => onConfigChange({ ...config, cueDurationMs: value })}
              min={150}
              max={1500}
              step={50}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>150ms (rápido)</span>
              <span>1500ms (lento)</span>
            </div>
          </div>

          {/* Gap Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Intervalo</span>
              </div>
              <span className="text-xl font-bold text-purple-500">{config.gapMinMs}-{config.gapMaxMs}ms</span>
            </div>
            <div className="space-y-2">
              <Slider
                value={[config.gapMinMs]}
                onValueChange={([value]) => onConfigChange({ ...config, gapMinMs: Math.min(value, config.gapMaxMs - 100) })}
                min={100}
                max={1500}
                step={50}
              />
              <Slider
                value={[config.gapMaxMs]}
                onValueChange={([value]) => onConfigChange({ ...config, gapMaxMs: Math.max(value, config.gapMinMs + 100) })}
                min={200}
                max={2000}
                step={50}
              />
            </div>
          </div>

          {/* No-Go Rate (only if not goNoGo drill) */}
          {config.drillType !== 'goNoGo' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Taxa NO-GO</span>
                </div>
                <span className="text-xl font-bold text-red-500">{config.noGoRate}%</span>
              </div>
              <Slider
                value={[config.noGoRate]}
                onValueChange={([value]) => onConfigChange({ ...config, noGoRate: value })}
                min={0}
                max={40}
                step={2}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0% (sem NO-GO)</span>
                <span>40% (muitos)</span>
              </div>
            </div>
          )}

          {/* Session Mode */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Modo de Sessão</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => onConfigChange({ ...config, sessionMode: 'rounds', totalRounds: config.totalRounds || 40 })}
                className={cn(
                  "p-2 rounded-lg border-2 transition-all",
                  config.sessionMode === 'rounds'
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-border hover:border-purple-500/50"
                )}
              >
                Rounds
              </button>
              <button
                onClick={() => onConfigChange({ ...config, sessionMode: 'time', totalTimeSec: config.totalTimeSec || 60 })}
                className={cn(
                  "p-2 rounded-lg border-2 transition-all",
                  config.sessionMode === 'time'
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-border hover:border-purple-500/50"
                )}
              >
                Tempo
              </button>
            </div>
            
            {config.sessionMode === 'rounds' ? (
              <div>
                <div className="flex justify-between mb-2">
                  <span>Total de Rounds</span>
                  <span className="font-bold text-purple-500">{config.totalRounds}</span>
                </div>
                <Slider
                  value={[config.totalRounds || 40]}
                  onValueChange={([value]) => onConfigChange({ ...config, totalRounds: value })}
                  min={10}
                  max={200}
                  step={10}
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between mb-2">
                  <span>Tempo Total</span>
                  <span className="font-bold text-purple-500">{config.totalTimeSec}s</span>
                </div>
                <Slider
                  value={[config.totalTimeSec || 60]}
                  onValueChange={([value]) => onConfigChange({ ...config, totalTimeSec: value })}
                  min={30}
                  max={300}
                  step={15}
                />
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-game-surface p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold">LEGENDA DOS CUES</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {legendCues.map(cue => {
              const visual = CUE_VISUALS[cue as ReactionCue];
              return (
                <div key={cue} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                  <span className={cn("text-3xl", visual.color)}>{visual.symbol}</span>
                  <span className="text-sm">{visual.label}</span>
                </div>
              );
            })}
            {showNoGoLegend && (
              <div className="flex items-center gap-3 p-2 bg-background rounded-lg">
                <span className={cn("text-3xl", CUE_VISUALS['NO_GO'].color)}>{CUE_VISUALS['NO_GO'].symbol}</span>
                <span className="text-sm">NÃO REAJA</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-border">
        <button
          onClick={onStart}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl rounded-xl transition-colors"
        >
          ▶ INICIAR TREINO
        </button>
      </footer>
    </div>
  );
}
