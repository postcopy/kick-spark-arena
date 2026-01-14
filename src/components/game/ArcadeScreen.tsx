import { cn } from '@/lib/utils';
import { HPBar } from './HPBar';
import { EnergyBar } from './EnergyBar';
import { ComboIndicator } from './ComboIndicator';
import type { UseArcadeStateReturn } from '@/hooks/useArcadeState';

interface ArcadeScreenProps {
  arcadeState: UseArcadeStateReturn;
}

export function ArcadeScreen({ arcadeState }: ArcadeScreenProps) {
  const {
    currentRound,
    timeLeft,
    redState,
    blueState,
    flashSide,
    showCombo,
    showSpecialUsed,
    showKO,
    lastDamage,
    config,
    gameState,
  } = arcadeState;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Background glow effects */}
      <div className={cn(
        "absolute inset-0 opacity-20 transition-opacity duration-300",
        flashSide === 'red' && "bg-gradient-to-r from-game-red/50 to-transparent",
        flashSide === 'blue' && "bg-gradient-to-l from-game-blue/50 to-transparent"
      )} />

      {/* Top Section - HP Bars */}
      <div className="relative z-10 p-4 bg-game-surface/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4">
          {/* Red HP */}
          <div className="flex-1">
            <HPBar
              hp={redState.hp}
              maxHP={config.startingHP}
              side="red"
              showDamage={lastDamage?.side === 'red' ? lastDamage.amount : null}
              isFlashing={flashSide === 'red'}
            />
          </div>

          {/* Round & Time */}
          <div className="flex flex-col items-center px-6 min-w-[140px]">
            <span className="text-sm text-muted-foreground uppercase tracking-wider">
              Round {currentRound}/{config.bestOf}
            </span>
            <span className={cn(
              "text-4xl font-mono font-bold",
              timeLeft <= 10 ? "text-game-red animate-pulse" : "text-foreground"
            )}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Blue HP */}
          <div className="flex-1">
            <HPBar
              hp={blueState.hp}
              maxHP={config.startingHP}
              side="blue"
              showDamage={lastDamage?.side === 'blue' ? lastDamage.amount : null}
              isFlashing={flashSide === 'blue'}
            />
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Combo indicators */}
        {showCombo && (
          <ComboIndicator side={showCombo.side} count={showCombo.count} />
        )}

        {/* Special Used indicator */}
        {showSpecialUsed && (
          <div className={cn(
            "absolute top-1/3 z-20 animate-bounce",
            showSpecialUsed === 'red' ? "left-1/4" : "right-1/4"
          )}>
            <div className="px-6 py-3 bg-game-yellow text-black font-bold text-3xl rounded-lg shadow-lg animate-pulse">
              ⚡ SPECIAL! ⚡
            </div>
          </div>
        )}

        {/* KO Overlay */}
        {showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
            <div className="text-center animate-winner">
              <div className={cn(
                "text-9xl font-black tracking-wider mb-4",
                showKO === 'red' ? "text-game-red text-glow-red" : "text-game-blue text-glow-blue"
              )}>
                K.O.!
              </div>
              <div className={cn(
                "text-4xl font-bold uppercase",
                showKO === 'red' ? "text-game-red" : "text-game-blue"
              )}>
                {showKO === 'red' ? 'VERMELHO' : 'AZUL'} VENCE O ROUND!
              </div>
            </div>
          </div>
        )}

        {/* Round End (time up, not KO) */}
        {gameState === 'round_end' && !showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
            <div className="text-center animate-winner">
              <div className="text-6xl font-black text-game-yellow mb-4">
                TEMPO!
              </div>
              <div className="text-3xl font-bold text-foreground">
                {redState.hp > blueState.hp 
                  ? <span className="text-game-red">VERMELHO VENCE!</span>
                  : blueState.hp > redState.hp 
                    ? <span className="text-game-blue">AZUL VENCE!</span>
                    : <span className="text-muted-foreground">EMPATE!</span>
                }
              </div>
            </div>
          </div>
        )}

        {/* Center decorative VS */}
        {!showKO && gameState !== 'round_end' && (
          <div className="text-8xl font-black text-muted-foreground/20">
            VS
          </div>
        )}

        {/* Side panels */}
        <div className={cn(
          "absolute left-8 top-1/2 -translate-y-1/2 w-48 h-72 rounded-lg border-2 transition-all",
          "bg-game-surface/50",
          flashSide === 'red' ? "border-game-red box-glow-red scale-105" : "border-game-red/30"
        )}>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl font-black text-game-red text-glow-red">
              {redState.hp > 0 ? redState.hp : '💀'}
            </div>
            <div className="text-sm text-muted-foreground mt-2 uppercase">HP</div>
          </div>
        </div>

        <div className={cn(
          "absolute right-8 top-1/2 -translate-y-1/2 w-48 h-72 rounded-lg border-2 transition-all",
          "bg-game-surface/50",
          flashSide === 'blue' ? "border-game-blue box-glow-blue scale-105" : "border-game-blue/30"
        )}>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-5xl font-black text-game-blue text-glow-blue">
              {blueState.hp > 0 ? blueState.hp : '💀'}
            </div>
            <div className="text-sm text-muted-foreground mt-2 uppercase">HP</div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Energy Bars */}
      <div className="relative z-10 p-4 bg-game-surface/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-8">
          {/* Red Energy */}
          <div className="flex-1">
            <EnergyBar
              energy={redState.energy}
              maxEnergy={config.energyMax}
              side="red"
              isSpecialReady={redState.specialReady}
            />
          </div>

          {/* Center label */}
          <div className="text-xs text-muted-foreground uppercase tracking-widest">
            ENERGIA
          </div>

          {/* Blue Energy */}
          <div className="flex-1">
            <EnergyBar
              energy={blueState.energy}
              maxEnergy={config.energyMax}
              side="blue"
              isSpecialReady={blueState.specialReady}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="flex justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <span>
            <kbd className="px-2 py-0.5 bg-secondary rounded font-mono">A</kbd> Vermelho
          </span>
          <span>
            <kbd className="px-2 py-0.5 bg-secondary rounded font-mono">L</kbd> Azul
          </span>
          <span>
            <kbd className="px-2 py-0.5 bg-secondary rounded font-mono">ESC</kbd> Sair
          </span>
        </div>
      </div>
    </div>
  );
}
