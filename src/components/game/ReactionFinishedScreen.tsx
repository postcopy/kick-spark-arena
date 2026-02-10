import { Trophy, Zap, Target, Timer, Home, RotateCcw } from 'lucide-react';
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
  onBackToMenu,
}: ReactionFinishedScreenProps) {
  const hasReactionData = result.reactionTimes.length > 0;
  const avgTime = hasReactionData
    ? Math.round(result.reactionTimes.reduce((a, b) => a + b, 0) / result.reactionTimes.length)
    : null;
  const bestTime = hasReactionData ? Math.min(...result.reactionTimes) : null;
  const worstTime = hasReactionData ? Math.max(...result.reactionTimes) : null;

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
          {/* Rounds */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Rounds</span>
            </div>
            <p className="text-3xl md:text-4xl font-black text-foreground">
              {result.roundsCompleted}
            </p>
          </div>

          {/* Total stimuli */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-game-yellow" />
              <span className="text-sm text-muted-foreground">Estímulos</span>
            </div>
            <p className="text-3xl md:text-4xl font-black text-foreground">
              {result.totalStimuli}
            </p>
          </div>

          {hasReactionData && (
            <>
              {/* Average */}
              <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-400">Tempo Médio</span>
                </div>
                <p className="text-3xl md:text-4xl font-black text-green-500">
                  {avgTime}ms
                </p>
              </div>

              {/* Best */}
              <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400">Melhor</span>
                </div>
                <p className="text-3xl md:text-4xl font-black text-green-400">
                  {bestTime}ms
                </p>
              </div>

              {/* Worst - spans full width */}
              <div className="col-span-2 bg-muted/50 p-4 rounded-xl border border-border text-center">
                <span className="text-sm text-muted-foreground">Pior Tempo: </span>
                <span className="text-xl font-black text-foreground">{worstTime}ms</span>
              </div>

              {/* Hits registered */}
              <div className="col-span-2 bg-muted/50 p-3 rounded-xl border border-border text-center">
                <span className="text-sm text-muted-foreground">Golpes Registrados: </span>
                <span className="text-lg font-bold text-foreground">{result.reactionTimes.length}</span>
                <span className="text-sm text-muted-foreground"> / {result.totalStimuli} estímulos</span>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={onBackToMenu} variant="outline" size="lg" className="flex-1 py-6">
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
