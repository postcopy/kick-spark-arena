import { ArrowLeft, RotateCcw, Zap, Clock, Target, BarChart3 } from 'lucide-react';
import { ReactionSessionResult, CUE_VISUALS, ReactionCue } from '@/types/reaction';
import { cn } from '@/lib/utils';

interface ReactionFinishedScreenProps {
  result: ReactionSessionResult;
  onRepeat: () => void;
  onMenu: () => void;
  onSetRPE: (value: number) => void;
}

export function ReactionFinishedScreen({ 
  result, 
  onRepeat, 
  onMenu,
  onSetRPE,
}: ReactionFinishedScreenProps) {
  const { 
    totalCues, 
    cueDistribution, 
    noGoCount, 
    blocksCompleted, 
    totalDurationSec, 
    averageGapMs,
    rpe,
  } = result;

  // Calculate max for bar chart scaling
  const maxCueCount = Math.max(...Object.values(cueDistribution), 1);

  // Format duration
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-center gap-3">
          <Zap className="w-8 h-8 text-purple-500" />
          <h1 className="text-2xl font-bold text-purple-500">TREINO COMPLETO!</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-game-surface p-4 rounded-lg border border-border text-center">
            <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-black text-foreground">{totalCues}</div>
            <div className="text-sm text-muted-foreground">Estímulos</div>
          </div>
          
          <div className="bg-game-surface p-4 rounded-lg border border-border text-center">
            <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-black text-foreground">{formatDuration(totalDurationSec)}</div>
            <div className="text-sm text-muted-foreground">Duração</div>
          </div>
          
          <div className="bg-game-surface p-4 rounded-lg border border-border text-center">
            <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-black text-foreground">{Math.round(averageGapMs)}ms</div>
            <div className="text-sm text-muted-foreground">Intervalo Médio</div>
          </div>
          
          <div className="bg-game-surface p-4 rounded-lg border border-border text-center">
            <div className="w-6 h-6 text-red-500 mx-auto mb-2 font-bold text-xl">●</div>
            <div className="text-3xl font-black text-foreground">{noGoCount}</div>
            <div className="text-sm text-muted-foreground">NO-GOs</div>
          </div>
        </div>

        {/* Blocks info */}
        {blocksCompleted > 1 && (
          <div className="bg-game-surface p-4 rounded-lg border border-border text-center">
            <div className="text-lg text-muted-foreground">Blocos Completados</div>
            <div className="text-2xl font-bold text-purple-500">{blocksCompleted}</div>
          </div>
        )}

        {/* Cue Distribution */}
        <div className="bg-game-surface p-4 rounded-lg border border-border">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            DISTRIBUIÇÃO DOS CUES
          </h2>
          <div className="space-y-3">
            {Object.entries(cueDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([cue, count]) => {
                const visual = CUE_VISUALS[cue as ReactionCue];
                const percentage = (count / maxCueCount) * 100;
                
                return (
                  <div key={cue} className="flex items-center gap-3">
                    <span className={cn("text-2xl w-10", visual?.color || 'text-foreground')}>
                      {visual?.symbol || cue}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{visual?.label || cue}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                      <div className="h-3 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* RPE Scale */}
        <div className="bg-game-surface p-4 rounded-lg border border-border">
          <h2 className="text-lg font-bold mb-2">COMO VOCÊ SE SENTIU? (RPE)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            1 = Muito fácil, 10 = Exaustivo
          </p>
          <div className="grid grid-cols-10 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
              <button
                key={value}
                onClick={() => onSetRPE(value)}
                className={cn(
                  "aspect-square rounded-lg font-bold text-lg transition-all",
                  rpe === value
                    ? "bg-purple-500 text-white scale-110"
                    : "bg-background hover:bg-purple-500/20",
                  value <= 3 && "text-green-500",
                  value >= 4 && value <= 6 && "text-yellow-500",
                  value >= 7 && value <= 8 && "text-orange-500",
                  value >= 9 && "text-red-500"
                )}
              >
                {value}
              </button>
            ))}
          </div>
          {rpe && (
            <div className="text-center mt-3 text-lg">
              RPE selecionado: <span className="font-bold text-purple-500">{rpe}</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex gap-3">
          <button
            onClick={onMenu}
            className="flex-1 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Menu
          </button>
          <button
            onClick={onRepeat}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Repetir
          </button>
        </div>
      </footer>
    </div>
  );
}
