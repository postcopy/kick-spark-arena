import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { HPBarTV } from './HPBarTV';
import { EnergyBarTV } from './EnergyBarTV';
import { ComboIndicatorTV } from './ComboIndicatorTV';
import type { UseArcadeStateReturn } from '@/hooks/useArcadeState';

interface ArcadeScreenTVProps {
  arcadeState: UseArcadeStateReturn;
}

export function ArcadeScreenTV({ arcadeState }: ArcadeScreenTVProps) {
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
  const roundsToWin = Math.ceil(config.bestOf / 2);

  // Round indicators component
  const RoundIndicators = ({ wins, side }: { wins: number; side: 'red' | 'blue' }) => (
    <div className={cn(
      "flex gap-2",
      side === 'blue' && "flex-row-reverse"
    )}>
      {Array.from({ length: roundsToWin }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-4 h-4 rounded-full border-2 transition-all",
            i < wins
              ? side === 'red' 
                ? "bg-game-red border-game-red shadow-[0_0_12px_hsl(var(--game-red-glow)/0.8)]" 
                : "bg-game-blue border-game-blue shadow-[0_0_12px_hsl(var(--game-blue-glow)/0.8)]"
              : "bg-transparent border-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Background with subtle grid */}
      <div className="absolute inset-0 bg-tv-grid vignette-light" />
      
      {/* Animated side glows */}
      <div className={cn(
        "absolute inset-y-0 left-0 w-1/4 transition-opacity duration-150",
        "bg-gradient-to-r from-game-red/15 to-transparent",
        flashSide === 'red' ? "opacity-100" : "opacity-20"
      )} />
      <div className={cn(
        "absolute inset-y-0 right-0 w-1/4 transition-opacity duration-150",
        "bg-gradient-to-l from-game-blue/15 to-transparent",
        flashSide === 'blue' ? "opacity-100" : "opacity-20"
      )} />

      {/* ============ TOP HUD - Concentrated ============ */}
      <div className="relative z-10 px-6 pt-4 pb-2">
        
        {/* Row 1: Names + Round Indicators + Timer */}
        <div className="flex items-center justify-between mb-2">
          {/* Left: Red Name + Rounds */}
          <div className="flex items-center gap-4 flex-1">
            <span className={cn(
              "font-black uppercase tracking-wide text-game-red",
              "text-[var(--name-size)]",
              "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            )}>
              VERMELHO
            </span>
            <RoundIndicators wins={redWins} side="red" />
          </div>

          {/* Center: Timer + Round */}
          <div className="flex flex-col items-center px-8">
            <div className={cn(
              "font-mono font-black tracking-tight leading-none",
              "text-[var(--timer-size)]",
              timeLeft <= 10 
                ? "text-destructive animate-pulse" 
                : timeLeft <= 30 
                  ? "text-yellow-500" 
                  : "text-foreground",
              "drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
            )}>
              {formatTime(timeLeft)}
            </div>
            <div className={cn(
              "text-[var(--round-size)] text-muted-foreground uppercase tracking-widest font-bold"
            )}>
              ROUND {currentRound}/{config.bestOf}
            </div>
          </div>

          {/* Right: Rounds + Blue Name */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <RoundIndicators wins={blueWins} side="blue" />
            <span className={cn(
              "font-black uppercase tracking-wide text-game-blue",
              "text-[var(--name-size)]",
              "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            )}>
              AZUL
            </span>
          </div>
        </div>

        {/* Row 2: Giant HP Numbers */}
        <div className="flex items-center justify-between mb-3">
          {/* Red HP */}
          <div className={cn(
            "font-black leading-none",
            "text-[var(--hp-number-size)]",
            redState.hp <= 25 
              ? "text-destructive animate-hp-critical" 
              : "text-game-red",
            "drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          )}
          style={{ textShadow: '0 0 30px hsl(var(--game-red-glow) / 0.4)' }}
          >
            {redState.hp}
          </div>

          {/* Blue HP */}
          <div className={cn(
            "font-black leading-none",
            "text-[var(--hp-number-size)]",
            blueState.hp <= 25 
              ? "text-destructive animate-hp-critical" 
              : "text-game-blue",
            "drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          )}
          style={{ textShadow: '0 0 30px hsl(var(--game-blue-glow) / 0.4)' }}
          >
            {blueState.hp}
          </div>
        </div>

        {/* Row 3: HP Bars (wide, thick) */}
        <div className="flex gap-4">
          <div className="flex-1">
            <HPBarTV
              hp={redState.hp}
              maxHP={config.startingHP}
              side="red"
              showDamage={lastDamage?.side === 'red' ? lastDamage.amount : null}
              isFlashing={flashSide === 'red'}
            />
          </div>
          <div className="flex-1">
            <HPBarTV
              hp={blueState.hp}
              maxHP={config.startingHP}
              side="blue"
              showDamage={lastDamage?.side === 'blue' ? lastDamage.amount : null}
              isFlashing={flashSide === 'blue'}
            />
          </div>
        </div>
      </div>

      {/* ============ MAIN GAME AREA ============ */}
      <div className="flex-1 flex items-center justify-center relative">
        
        {/* Combo indicator */}
        {showCombo && (
          <ComboIndicatorTV side={showCombo.side} count={showCombo.count} />
        )}

        {/* Special Ready indicator - large and central when triggered */}
        {showSpecialUsed && (
          <div className={cn(
            "absolute z-20 animate-combo-pop",
            showSpecialUsed === 'red' ? "left-1/4 top-1/3" : "right-1/4 top-1/3"
          )}>
            <div className={cn(
              "px-8 py-4 rounded-xl font-black uppercase tracking-wide",
              "text-[clamp(36px,4vw,56px)]",
              "bg-gradient-to-r from-yellow-600 to-game-yellow",
              "text-black border-4 border-yellow-400",
              "animate-special-glow"
            )}>
              <div className="flex items-center gap-3">
                <Zap className="w-10 h-10 fill-current" />
                <span>ESPECIAL!</span>
                <Zap className="w-10 h-10 fill-current" />
              </div>
            </div>
          </div>
        )}

        {/* Special Ready indicator - shown when energy is full */}
        {redState.specialReady && !showSpecialUsed && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 animate-combo-pop">
            <div className={cn(
              "px-6 py-3 rounded-lg font-black uppercase tracking-wide",
              "text-[clamp(24px,2.5vw,36px)]",
              "bg-gradient-to-r from-yellow-600 to-game-yellow",
              "text-black border-2 border-yellow-400",
              "animate-special-glow"
            )}>
              ⚡ ESPECIAL PRONTO
            </div>
          </div>
        )}

        {blueState.specialReady && !showSpecialUsed && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10 animate-combo-pop">
            <div className={cn(
              "px-6 py-3 rounded-lg font-black uppercase tracking-wide",
              "text-[clamp(24px,2.5vw,36px)]",
              "bg-gradient-to-r from-yellow-600 to-game-yellow",
              "text-black border-2 border-yellow-400",
              "animate-special-glow"
            )}>
              ESPECIAL PRONTO ⚡
            </div>
          </div>
        )}

        {/* KO Overlay - Giant and simple */}
        {showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
            <div className="text-center animate-ko-tv">
              {/* K.O. text gigante */}
              <div 
                className={cn(
                  "font-black leading-none",
                  "text-[var(--ko-size)]",
                  "text-game-yellow"
                )}
                style={{ 
                  textShadow: '0 8px 0 rgba(0,0,0,0.3), 0 0 80px rgba(255,215,0,0.5)' 
                }}
              >
                K.O.
              </div>
              
              {/* Winner */}
              <div className={cn(
                "font-black uppercase mt-4",
                "text-[clamp(48px,5vw,72px)]",
                showKO === 'red' ? "text-game-red" : "text-game-blue"
              )}
              style={{
                textShadow: showKO === 'red' 
                  ? '0 0 40px hsl(var(--game-red-glow) / 0.6)' 
                  : '0 0 40px hsl(var(--game-blue-glow) / 0.6)'
              }}
              >
                {showKO === 'red' ? 'VERMELHO' : 'AZUL'} VENCE!
              </div>
            </div>
          </div>
        )}

        {/* Round End (time up, not KO) */}
        {gameState === 'round_end' && !showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
            <div className="text-center animate-ko-tv">
              <div 
                className={cn(
                  "font-black",
                  "text-[clamp(120px,12vw,200px)]",
                  "text-game-yellow"
                )}
                style={{ 
                  textShadow: '0 6px 0 rgba(0,0,0,0.3), 0 0 60px rgba(255,215,0,0.4)' 
                }}
              >
                TEMPO!
              </div>
              <div className={cn(
                "font-black uppercase mt-2",
                "text-[clamp(48px,5vw,72px)]"
              )}>
                {redState.hp > blueState.hp 
                  ? <span className="text-game-red" style={{ textShadow: '0 0 30px hsl(var(--game-red-glow) / 0.5)' }}>VERMELHO VENCE!</span>
                  : blueState.hp > redState.hp 
                    ? <span className="text-game-blue" style={{ textShadow: '0 0 30px hsl(var(--game-blue-glow) / 0.5)' }}>AZUL VENCE!</span>
                    : <span className="text-game-yellow" style={{ textShadow: '0 0 30px hsl(var(--game-yellow-glow) / 0.5)' }}>EMPATE!</span>
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ BOTTOM SECTION - Energy Bars (minimal) ============ */}
      <div className="relative z-10 px-6 pb-4 pt-2">
        <div className="flex gap-8">
          {/* Red Energy */}
          <div className="flex-1">
            <EnergyBarTV
              energy={redState.energy}
              maxEnergy={config.energyMax}
              side="red"
              isSpecialReady={redState.specialReady}
            />
          </div>

          {/* Blue Energy */}
          <div className="flex-1">
            <EnergyBarTV
              energy={blueState.energy}
              maxEnergy={config.energyMax}
              side="blue"
              isSpecialReady={blueState.specialReady}
            />
          </div>
        </div>

        {/* Minimal instructions - much smaller for TV */}
        <div className="flex justify-center gap-6 mt-3 text-[10px] text-muted-foreground/50">
          <span>A = Vermelho</span>
          <span>L = Azul</span>
          <span>ESC = Sair</span>
        </div>
      </div>
    </div>
  );
}
