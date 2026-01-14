import { cn } from '@/lib/utils';
import { Zap, Swords } from 'lucide-react';
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
    roundResults,
  } = arcadeState;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate round wins
  const redWins = roundResults.filter(r => r.winner === 'red').length;
  const blueWins = roundResults.filter(r => r.winner === 'blue').length;

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Background with pattern and gradient */}
      <div className="absolute inset-0 bg-arcade-pattern vignette" />
      
      {/* Animated side glows */}
      <div className={cn(
        "absolute inset-y-0 left-0 w-1/3 transition-opacity duration-300",
        "bg-gradient-to-r from-game-red/20 to-transparent",
        flashSide === 'red' ? "opacity-100" : "opacity-30"
      )} />
      <div className={cn(
        "absolute inset-y-0 right-0 w-1/3 transition-opacity duration-300",
        "bg-gradient-to-l from-game-blue/20 to-transparent",
        flashSide === 'blue' ? "opacity-100" : "opacity-30"
      )} />

      {/* Top Section - Header with HP Bars */}
      <div className="relative z-10 p-4 bg-gradient-to-b from-black/80 via-game-surface/90 to-transparent border-b border-border/50 backdrop-blur-sm">
        
        {/* Central Header - Logo and Timer */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Left decoration */}
          <div className="flex-1 flex justify-end">
            <div className="h-0.5 flex-1 max-w-32 bg-gradient-to-r from-transparent via-game-red to-game-red/50" />
          </div>

          {/* Center Logo */}
          <div className="flex flex-col items-center px-6">
            <div className="flex items-center gap-2 text-game-yellow">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-widest">ARCADE MODE</span>
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
              DUELO {String(currentRound).padStart(2, '0')}
            </div>
          </div>

          {/* Right decoration */}
          <div className="flex-1 flex justify-start">
            <div className="h-0.5 flex-1 max-w-32 bg-gradient-to-l from-transparent via-game-blue to-game-blue/50" />
          </div>
        </div>

        {/* HP Bars Row */}
        <div className="flex items-start gap-4">
          {/* Red HP */}
          <div className="flex-1">
            <HPBar
              hp={redState.hp}
              maxHP={config.startingHP}
              side="red"
              showDamage={lastDamage?.side === 'red' ? lastDamage.amount : null}
              isFlashing={flashSide === 'red'}
              roundWins={redWins}
              bestOf={config.bestOf}
            />
          </div>

          {/* Timer */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className={cn(
              "text-5xl font-mono font-black tracking-tight",
              timeLeft <= 10 
                ? "text-destructive animate-pulse text-glow-red" 
                : timeLeft <= 30 
                  ? "text-yellow-500" 
                  : "text-foreground"
            )}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Round {currentRound}/{config.bestOf}
            </div>
          </div>

          {/* Blue HP */}
          <div className="flex-1">
            <HPBar
              hp={blueState.hp}
              maxHP={config.startingHP}
              side="blue"
              showDamage={lastDamage?.side === 'blue' ? lastDamage.amount : null}
              isFlashing={flashSide === 'blue'}
              roundWins={blueWins}
              bestOf={config.bestOf}
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
            "absolute top-1/4 z-20 animate-combo-pop",
            showSpecialUsed === 'red' ? "left-1/4" : "right-1/4"
          )}>
            <div className={cn(
              "px-6 py-4 rounded-xl font-black text-3xl uppercase tracking-wide",
              "bg-gradient-to-br from-yellow-500 via-game-yellow to-orange-500",
              "border-2 border-yellow-300",
              "text-black shadow-2xl",
              "animate-special-glow"
            )}>
              <div className="flex items-center gap-2">
                <Zap className="w-8 h-8 fill-current" />
                <span>ESPECIAL!</span>
                <Zap className="w-8 h-8 fill-current" />
              </div>
            </div>
          </div>
        )}

        {/* KO Overlay */}
        {showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30 backdrop-blur-sm">
            <div className="text-center">
              {/* KO Text with 3D effect */}
              <div className={cn(
                "text-[12rem] font-black leading-none animate-ko",
                "text-gradient-gold text-3d-gold"
              )}>
                K.O.
              </div>
              <div className={cn(
                "text-4xl font-black uppercase mt-4 animate-winner",
                showKO === 'red' ? "text-game-red text-glow-red" : "text-game-blue text-glow-blue"
              )}>
                {showKO === 'red' ? 'VERMELHO' : 'AZUL'} VENCE O ROUND!
              </div>
            </div>
          </div>
        )}

        {/* Round End (time up, not KO) */}
        {gameState === 'round_end' && !showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30 backdrop-blur-sm">
            <div className="text-center animate-winner">
              <div className="text-7xl font-black text-gradient-gold text-3d-gold mb-6">
                TEMPO!
              </div>
              <div className="text-4xl font-black">
                {redState.hp > blueState.hp 
                  ? <span className="text-game-red text-glow-red">VERMELHO VENCE!</span>
                  : blueState.hp > redState.hp 
                    ? <span className="text-game-blue text-glow-blue">AZUL VENCE!</span>
                    : <span className="text-game-yellow text-glow-yellow">EMPATE!</span>
                }
              </div>
            </div>
          </div>
        )}

        {/* Center VS decoration */}
        {!showKO && gameState !== 'round_end' && (
          <div className="relative">
            <Swords className="w-32 h-32 text-muted-foreground/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-black text-muted-foreground/20">VS</span>
            </div>
          </div>
        )}

        {/* Side panels with HP display */}
        <div className={cn(
          "absolute left-8 top-1/2 -translate-y-1/2",
          "w-52 rounded-xl border-2 transition-all duration-150",
          "bg-gradient-to-br from-game-surface/90 to-game-surface/50 backdrop-blur-sm",
          flashSide === 'red' 
            ? "border-game-red box-glow-red scale-105" 
            : "border-game-red/40"
        )}>
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="text-sm font-bold text-game-red uppercase tracking-wider mb-2">VERMELHO</div>
            <div className={cn(
              "text-7xl font-black",
              redState.hp > 0 
                ? "text-game-red text-glow-red" 
                : "text-muted-foreground"
            )}>
              {redState.hp > 0 ? redState.hp : '💀'}
            </div>
            <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">HP</div>
            
            {/* Energy mini-bar */}
            <div className="w-full mt-4 h-2 bg-secondary/50 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-150 rounded-full",
                  redState.specialReady 
                    ? "bg-game-yellow animate-pulse" 
                    : "bg-game-red/70"
                )}
                style={{ width: `${(redState.energy / config.energyMax) * 100}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {redState.specialReady ? (
                <span className="text-game-yellow font-bold animate-pulse">⚡ ESPECIAL</span>
              ) : (
                `Energia: ${redState.energy}`
              )}
            </div>
          </div>
        </div>

        <div className={cn(
          "absolute right-8 top-1/2 -translate-y-1/2",
          "w-52 rounded-xl border-2 transition-all duration-150",
          "bg-gradient-to-bl from-game-surface/90 to-game-surface/50 backdrop-blur-sm",
          flashSide === 'blue' 
            ? "border-game-blue box-glow-blue scale-105" 
            : "border-game-blue/40"
        )}>
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="text-sm font-bold text-game-blue uppercase tracking-wider mb-2">AZUL</div>
            <div className={cn(
              "text-7xl font-black",
              blueState.hp > 0 
                ? "text-game-blue text-glow-blue" 
                : "text-muted-foreground"
            )}>
              {blueState.hp > 0 ? blueState.hp : '💀'}
            </div>
            <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">HP</div>
            
            {/* Energy mini-bar */}
            <div className="w-full mt-4 h-2 bg-secondary/50 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-150 rounded-full",
                  blueState.specialReady 
                    ? "bg-game-yellow animate-pulse" 
                    : "bg-game-blue/70"
                )}
                style={{ width: `${(blueState.energy / config.energyMax) * 100}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {blueState.specialReady ? (
                <span className="text-game-yellow font-bold animate-pulse">⚡ ESPECIAL</span>
              ) : (
                `Energia: ${blueState.energy}`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Energy Bars */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-black/80 via-game-surface/90 to-transparent border-t border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-6">
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
          <div className="flex flex-col items-center">
            <Zap className="w-5 h-5 text-game-yellow mb-1" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
              ENERGIA
            </span>
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
        <div className="flex justify-center gap-8 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-game-red/20 border border-game-red/40 rounded font-mono text-game-red">A</kbd>
            <span>Vermelho</span>
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-game-blue/20 border border-game-blue/40 rounded font-mono text-game-blue">L</kbd>
            <span>Azul</span>
          </span>
          <span className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-secondary border border-border rounded font-mono">ESC</kbd>
            <span>Sair</span>
          </span>
        </div>
      </div>
    </div>
  );
}
