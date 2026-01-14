import { ArrowLeft, Play, Flame, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo-desafio-relampago.png';

interface IronRhythmSetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  duration: number;
  onDurationChange: (duration: number) => void;
  targetKicks: number;
  onTargetKicksChange: (target: number) => void;
}

const DURATION_OPTIONS = [30, 45, 60, 90];
const TARGET_OPTIONS = [3, 5, 7, 10];
const WINDOW_SEC = 5;

export function IronRhythmSetupScreen({
  onStart,
  onBack,
  duration,
  onDurationChange,
  targetKicks,
  onTargetKicksChange,
}: IronRhythmSetupScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <img src={logo} alt="Desafio Relâmpago" className="h-16 w-auto mx-auto mb-4" />
        <div className="flex items-center justify-center gap-3 mb-2">
          <Flame className="w-10 h-10 text-orange-500" />
          <h1 className="text-5xl font-bold text-foreground">RITMO DE FERRO</h1>
          <Flame className="w-10 h-10 text-orange-500" />
        </div>
        <p className="text-xl text-muted-foreground">
          Mantenha a cadência mínima para acumular tempo
        </p>
      </div>

      {/* Duration Selection */}
      <div className="w-full max-w-2xl mb-8">
        <label className="block text-xl font-semibold text-foreground mb-4 text-center">
          DURAÇÃO
        </label>
        <div className="grid grid-cols-4 gap-4">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => onDurationChange(option)}
              className={cn(
                'py-6 text-2xl font-bold rounded-lg border-2 transition-all',
                duration === option
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                  : 'bg-game-surface border-border text-muted-foreground hover:border-orange-500/50'
              )}
            >
              {option}s
            </button>
          ))}
        </div>
      </div>

      {/* Target Kicks Selection */}
      <div className="w-full max-w-2xl mb-8">
        <label className="block text-xl font-semibold text-foreground mb-4 text-center">
          META DE CHUTES (a cada {WINDOW_SEC} segundos)
        </label>
        <div className="grid grid-cols-4 gap-4">
          {TARGET_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => onTargetKicksChange(option)}
              className={cn(
                'py-6 text-2xl font-bold rounded-lg border-2 transition-all',
                targetKicks === option
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                  : 'bg-game-surface border-border text-muted-foreground hover:border-orange-500/50'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="w-full max-w-2xl mb-8 p-4 bg-game-surface rounded-lg border border-border">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Como funciona:</p>
            <p>
              Você precisa manter pelo menos <span className="text-orange-400 font-bold">{targetKicks} chutes</span> dentro
              de uma janela de <span className="text-orange-400 font-bold">{WINDOW_SEC} segundos</span>.
              Enquanto mantiver o ritmo, seu tempo "em ritmo" acumula.
              Vence quem tiver mais tempo em ritmo ao final!
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="text-xl px-8 py-6"
        >
          <ArrowLeft className="mr-2 h-6 w-6" />
          Voltar
        </Button>
        <Button
          size="lg"
          onClick={onStart}
          className="text-xl px-12 py-6 bg-orange-500 hover:bg-orange-600 text-white font-bold"
        >
          <Play className="mr-2 h-6 w-6" />
          COMEÇAR
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-8 text-muted-foreground">
        <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd> para começar •{' '}
        <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">ESC</kbd> para voltar
      </p>
    </div>
  );
}
