import { ArrowLeft, Zap, Clock, LayoutGrid, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactionLevel } from '@/types/reaction';
import { REACTION_PRESETS, LEVEL_LABELS } from '@/types/reaction';

interface ReactionSetupScreenProps {
  level: ReactionLevel;
  onLevelChange: (level: ReactionLevel) => void;
  onStart: () => void;
  onBack: () => void;
}

const LEVELS: ReactionLevel[] = ['beginner', 'intermediate', 'advanced'];

export function ReactionSetupScreen({ 
  level, 
  onLevelChange, 
  onStart, 
  onBack 
}: ReactionSetupScreenProps) {
  const config = REACTION_PRESETS[level];
  const totalMinutes = Math.floor(config.sessionSeconds / 60);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-shrink-0 w-full flex items-center justify-between p-4 md:px-6 border-b border-border">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-500" />
          <h1 className="text-xl font-bold text-foreground">MODO REAÇÃO</h1>
        </div>
        
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="max-w-lg mx-auto space-y-4 md:space-y-6">
          {/* Level selector */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border">
            <h2 className="text-lg font-bold text-foreground mb-4 text-center">
              Escolha o Nível
            </h2>
            
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onLevelChange(lvl)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all ${
                    level === lvl
                      ? 'bg-green-500 text-white scale-105'
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {LEVEL_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          {/* Config preview */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Configuração da Sessão
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-background p-3 rounded-lg">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-bold text-foreground">{totalMinutes} min</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-background p-3 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Estrutura</p>
                  <p className="font-bold text-foreground">{config.blocks.count}×{config.blocks.workSec}s</p>
                </div>
              </div>
            </div>
            
            <div className="bg-background p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CircleDot className="w-5 h-5 text-green-500" />
                <p className="text-sm font-semibold text-foreground">Intervalo entre blocos</p>
              </div>
              <p className="text-muted-foreground text-sm">{config.blocks.restSec}s para trocar o exercício</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Como Funciona
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/20">
                <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0" />
                <p className="text-foreground font-medium">
                  <span className="text-green-500 font-bold">VERDE</span> = Executa a técnica
                </p>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg bg-red-500/20">
                <div className="w-8 h-8 rounded-full bg-red-500 flex-shrink-0" />
                <p className="text-foreground font-medium">
                  <span className="text-red-500 font-bold">VERMELHO</span> = Congela/Para
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-border">
        <Button 
          onClick={onStart}
          size="lg"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-6"
        >
          INICIAR TREINO
        </Button>
      </footer>
    </div>
  );
}
