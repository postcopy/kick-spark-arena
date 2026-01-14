import { Zap, Timer, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomeScreenProps {
  onStartSetup: () => void;
}

export function HomeScreen({ onStartSetup }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Logo / Title */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Zap className="w-16 h-16 text-game-yellow" />
          <h1 className="text-6xl font-bold text-foreground tracking-tight">
            KICK<span className="text-game-yellow">COUNTER</span>
          </h1>
          <Zap className="w-16 h-16 text-game-yellow" />
        </div>
        <p className="text-xl text-muted-foreground">
          Sistema de Competição de Chutes
        </p>
      </div>

      {/* Mode Card */}
      <div
        onClick={onStartSetup}
        className="group cursor-pointer w-full max-w-lg p-8 bg-game-surface border-2 border-game-yellow/30 rounded-lg hover:border-game-yellow/60 hover:bg-game-surface-elevated transition-all"
      >
        <div className="flex items-center gap-6">
          <div className="p-4 bg-game-yellow/10 rounded-lg group-hover:bg-game-yellow/20 transition-colors">
            <Timer className="w-12 h-12 text-game-yellow" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              TIME ATTACK
            </h2>
            <p className="text-lg text-muted-foreground">
              Quem fizer mais chutes no tempo definido vence!
            </p>
          </div>
          <Target className="w-8 h-8 text-muted-foreground group-hover:text-game-yellow transition-colors" />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-12 flex gap-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd>
          <span>Iniciar</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1 bg-secondary rounded text-sm font-mono">A</kbd>
          <span>Chute Vermelho</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1 bg-secondary rounded text-sm font-mono">L</kbd>
          <span>Chute Azul</span>
        </div>
      </div>
    </div>
  );
}
