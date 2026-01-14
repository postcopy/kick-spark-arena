import { IronRhythmPanel } from './IronRhythmPanel';
import { GameTimer } from './GameTimer';
import logo from '@/assets/logo-desafio-relampago.png';
import type { GameScore, IronRhythmConfig } from '@/types/game';

interface IronRhythmScreenProps {
  scores: GameScore;
  timeLeft: number;
  isPaused: boolean;
  flashSide: 'red' | 'blue' | null;
  config: IronRhythmConfig;
  uptimeRed: number;
  uptimeBlue: number;
  isOnPaceRed: boolean;
  isOnPaceBlue: boolean;
  kicksInWindowRed: number;
  kicksInWindowBlue: number;
}

export function IronRhythmScreen({
  scores,
  timeLeft,
  isPaused,
  flashSide,
  config,
  uptimeRed,
  uptimeBlue,
  isOnPaceRed,
  isOnPaceBlue,
  kicksInWindowRed,
  kicksInWindowBlue,
}: IronRhythmScreenProps) {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-game-surface border-b border-border">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Desafio Relâmpago" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-foreground">RITMO DE FERRO</h1>
            <p className="text-sm text-muted-foreground">
              Meta: {config.targetKicksPerWindow} chutes / {config.windowSec}s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <GameTimer timeLeft={timeLeft} isPaused={isPaused} />

          <div className="flex gap-2 text-sm text-muted-foreground">
            <kbd className="px-2 py-1 bg-secondary rounded font-mono">P</kbd>
            <span>{isPaused ? 'Continuar' : 'Pausar'}</span>
            <kbd className="px-2 py-1 bg-secondary rounded font-mono ml-2">R</kbd>
            <span>Resetar</span>
          </div>
        </div>
      </header>

      {/* Game Area */}
      <div className="flex-1 grid grid-cols-2">
        <IronRhythmPanel
          side="red"
          totalKicks={scores.red}
          kicksInWindow={kicksInWindowRed}
          targetKicks={config.targetKicksPerWindow}
          uptimeMs={uptimeRed}
          isOnPace={isOnPaceRed}
          isFlashing={flashSide === 'red'}
        />
        <IronRhythmPanel
          side="blue"
          totalKicks={scores.blue}
          kicksInWindow={kicksInWindowBlue}
          targetKicks={config.targetKicksPerWindow}
          uptimeMs={uptimeBlue}
          isOnPace={isOnPaceBlue}
          isFlashing={flashSide === 'blue'}
        />
      </div>

      {/* Footer */}
      <footer className="flex justify-around py-4 bg-game-surface border-t border-border">
        <span className="text-3xl font-bold text-game-red uppercase tracking-widest">
          VERMELHO
        </span>
        <span className="text-3xl font-bold text-game-blue uppercase tracking-widest">
          AZUL
        </span>
      </footer>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-foreground mb-4">PAUSADO</h2>
            <p className="text-xl text-muted-foreground">
              Pressione <kbd className="px-2 py-1 bg-secondary rounded font-mono">P</kbd> para continuar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
