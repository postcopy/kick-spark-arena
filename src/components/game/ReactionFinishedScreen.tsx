import { Trophy, Zap, Target, Activity, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactionResult } from '@/types/reaction';
import { LEVEL_LABELS } from '@/types/reaction';

interface ReactionFinishedScreenProps {
  result: ReactionResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function ReactionFinishedScreen({ 
  result, 
  onPlayAgain, 
  onBackToMenu 
}: ReactionFinishedScreenProps) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gradient-to-b from-green-900/50 to-background">
      {/* Header */}
      <header className="flex-shrink-0 pt-6 md:pt-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-8 h-8 md:w-10 md:h-10 text-game-yellow" />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground">
            TREINO COMPLETO!
          </h1>
          <Trophy className="w-8 h-8 md:w-10 md:h-10 text-game-yellow" />
        </div>
        
        <p className="text-muted-foreground text-lg">
          Nível: <span className="text-green-500 font-bold">{LEVEL_LABELS[result.level]}</span>
        </p>
      </header>

      {/* Stats */}
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-md w-full">
          {/* Blocks completed */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Blocos</span>
            </div>
            <p className="text-3xl md:text-4xl font-black text-foreground">
              {result.blocksCompleted}
            </p>
          </div>
          
          {/* Total signals */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-game-yellow" />
              <span className="text-sm text-muted-foreground">Sinais</span>
            </div>
            <p className="text-3xl md:text-4xl font-black text-foreground">
              {result.totalSignals}
            </p>
          </div>
          
          {/* GO signals */}
          <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-400">VAI!</span>
            </div>
            <p className="text-3xl md:text-4xl font-black text-green-500">
              {result.goSignals}
            </p>
          </div>
          
          {/* STOP signals */}
          <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-400">PARA!</span>
            </div>
            <p className="text-3xl md:text-4xl font-black text-red-500">
              {result.stopSignals}
            </p>
          </div>
        </div>
      </main>

      {/* Footer - Actions */}
      <footer className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            onClick={onBackToMenu}
            variant="outline"
            size="lg"
            className="flex-1 py-6"
          >
            <Home className="w-5 h-5 mr-2" />
            Menu
          </Button>
          
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-6"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Jogar Novamente
          </Button>
        </div>
      </footer>
    </div>
  );
}
