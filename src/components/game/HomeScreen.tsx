import { Timer, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-desafio-relampago.png';

interface HomeScreenProps {
  onStartSetup: () => void;
}

export function HomeScreen({ onStartSetup }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Logo / Title */}
      <div className="mb-12 text-center">
        <img src={logo} alt="Desafio Relâmpago" className="h-24 w-auto mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-foreground tracking-tight">
          DESAFIO <span className="text-game-yellow">RELÂMPAGO</span>
        </h1>
        <p className="text-xl text-muted-foreground mt-4">
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
