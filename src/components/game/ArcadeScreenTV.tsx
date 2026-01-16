import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { UseArcadeStateReturn } from '@/hooks/useArcadeState';
import logoSFight from '@/assets/logo-desafio-relampago.png';
import { FighterMascot, type MascotState } from './FighterMascot';
import type { Side } from '@/types/game';

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

  // Determine mascot state based on game state
  const getMascotState = (side: Side): MascotState => {
    // KO states
    if (showKO) {
      return showKO === side ? 'winner' : 'ko';
    }
    
    // Round end (time up)
    if (gameState === 'round_end') {
      const redWon = redState.hp > blueState.hp;
      const blueWon = blueState.hp > redState.hp;
      if (side === 'red') return redWon ? 'winner' : blueWon ? 'loser' : 'idle';
      return blueWon ? 'winner' : redWon ? 'loser' : 'idle';
    }
    
    // Hit reaction - this side got hit
    if (flashSide === side) return 'hit';
    
    // Attacking - the OTHER side got hit (lastDamage shows who received damage)
    if (lastDamage && lastDamage.side !== side) {
      return 'attacking';
    }
    
    return 'idle';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate round wins
  const redWins = roundResults.filter(r => r.winner === 'red').length;
  const blueWins = roundResults.filter(r => r.winner === 'blue').length;

  // Round stars component
  const RoundStars = ({ wins, maxWins, side }: { wins: number; maxWins: number; side: 'red' | 'blue' }) => (
    <div className={cn("flex gap-2", side === 'blue' && "flex-row-reverse")}>
      {Array.from({ length: maxWins }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-6 h-6 rounded-full border-2 transition-all",
            i < wins
              ? side === 'red' 
                ? "bg-game-red border-game-red shadow-[0_0_15px_hsl(var(--game-red-glow)/0.9)]" 
                : "bg-game-blue border-game-blue shadow-[0_0_15px_hsl(var(--game-blue-glow)/0.9)]"
              : "bg-transparent border-white/30"
          )}
        />
      ))}
    </div>
  );

  const roundsToWin = Math.ceil(config.bestOf / 2);

  return (
    <div className="relative flex flex-col h-[100dvh] bg-black overflow-hidden">
      
      {/* ============ TOP BAR - Names ============ */}
      <div className="relative z-20 h-[8vh] min-h-[60px] bg-black flex items-center justify-between px-6">
        {/* Red Player */}
        <div className="flex items-center gap-6">
          <span className={cn(
            "font-black italic uppercase tracking-wide text-white",
            "text-[clamp(36px,5vw,72px)]",
            "drop-shadow-[0_2px_8px_hsl(var(--game-red-glow)/0.6)]"
          )}>
            VERMELHO
          </span>
          <RoundStars wins={redWins} maxWins={roundsToWin} side="red" />
        </div>

        {/* VS Central */}
        <div className={cn(
          "font-black text-white",
          "text-[clamp(48px,6vw,96px)]",
          "drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
        )}>
          Vs
        </div>

        {/* Blue Player */}
        <div className="flex items-center gap-6">
          <RoundStars wins={blueWins} maxWins={roundsToWin} side="blue" />
          <span className={cn(
            "font-black italic uppercase tracking-wide text-white",
            "text-[clamp(36px,5vw,72px)]",
            "drop-shadow-[0_2px_8px_hsl(var(--game-blue-glow)/0.6)]"
          )}>
            AZUL
          </span>
        </div>
      </div>

      {/* ============ MAIN AREA - Split Screen HP ============ */}
      <div className="flex-1 flex relative">
        
        {/* Red Side - HP as background height */}
        <div className={cn(
          "flex-1 relative bg-black overflow-hidden",
          flashSide === 'red' && "animate-damage-shake-tv"
        )}>
          {/* HP Fill - anchored to bottom, shrinks downward as HP decreases */}
          <div 
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-900 via-game-red to-red-700 transition-all duration-300 ease-out"
            style={{ height: `${redState.hp}%` }}
          />
          
          {/* Inner glow when full */}
          {redState.hp > 75 && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-transparent to-red-500/20 pointer-events-none"
                 style={{ height: `${redState.hp}%` }} />
          )}
          
          {/* Critical pulse overlay */}
          {redState.hp <= 25 && redState.hp > 0 && (
            <div className="absolute inset-0 bg-red-900/30 animate-hp-critical" />
          )}

          {/* Flash overlay on damage */}
          {flashSide === 'red' && (
            <div className="absolute inset-0 bg-white/30 animate-flash-side" />
          )}

          {/* HP Number - Giant, centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-black text-white leading-none",
              "text-[clamp(80px,14vw,220px)]",
              "drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]",
              redState.hp <= 25 && "animate-hp-critical"
            )}
            style={{ textShadow: '0 0 40px hsl(var(--game-red-glow) / 0.4)' }}
            >
              {redState.hp}
            </span>
          </div>

          {/* Damage popup */}
          {lastDamage?.side === 'red' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10">
              <span className="text-white font-black text-[clamp(48px,6vw,96px)] animate-damage-popup drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                -{lastDamage.amount}
              </span>
            </div>
          )}

          {/* Combo indicator */}
          {showCombo?.side === 'red' && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-10 animate-combo-pop">
              <div className="text-center">
                <span className="block text-game-yellow font-black text-[clamp(24px,3vw,48px)] uppercase tracking-widest">
                  COMBO
                </span>
                <span className={cn(
                  "block font-black leading-none text-game-yellow",
                  "text-[clamp(72px,10vw,140px)]",
                  "drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                )}
                style={{ textShadow: '0 0 40px hsl(var(--game-yellow-glow) / 0.6)' }}
                >
                  x{showCombo.count}
                </span>
              </div>
            </div>
          )}

          {/* Special Ready */}
          {redState.specialReady && !showSpecialUsed && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-combo-pop">
              <div className={cn(
                "px-6 py-3 rounded-lg font-black uppercase tracking-wide",
                "text-[clamp(20px,2.5vw,36px)]",
                "bg-gradient-to-r from-yellow-600 to-game-yellow",
                "text-black border-2 border-yellow-400",
                "animate-special-glow flex items-center gap-2"
              )}>
                <Zap className="w-6 h-6 fill-current" />
                ESPECIAL
                <Zap className="w-6 h-6 fill-current" />
              </div>
            </div>
          )}

          {/* Red Mascot */}
          <div className="absolute bottom-[12%] left-6 z-10 pointer-events-none">
            <FighterMascot 
              side="red" 
              state={getMascotState('red')} 
              size="md"
            />
          </div>
        </div>

        {/* Center Divider + Logo + Timer */}
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 flex flex-col items-center justify-center pointer-events-none">
          {/* Vertical line */}
          <div className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
          
          {/* Logo */}
          <div className="relative mb-4">
            <img 
              src={logoSFight} 
              alt="S-Fight" 
              className="h-[clamp(60px,8vh,120px)] w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Timer */}
          <div className={cn(
            "bg-black/90 px-8 py-4 rounded-xl border-2",
            timeLeft <= 10 ? "border-destructive" : timeLeft <= 30 ? "border-yellow-500" : "border-white/20"
          )}>
            <div className={cn(
              "font-mono font-black tracking-tight leading-none text-center",
              "text-[clamp(64px,9vw,140px)]",
              timeLeft <= 10 
                ? "text-destructive animate-pulse" 
                : timeLeft <= 30 
                  ? "text-yellow-500" 
                  : "text-white",
              "drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            )}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Round indicator */}
          <div className={cn(
            "mt-4 text-[clamp(16px,2vw,28px)] text-white/70 uppercase tracking-widest font-bold"
          )}>
            ROUND {currentRound}/{config.bestOf}
          </div>
        </div>

        {/* Blue Side - HP as background height */}
        <div className={cn(
          "flex-1 relative bg-black overflow-hidden",
          flashSide === 'blue' && "animate-damage-shake-tv"
        )}>
          {/* HP Fill - anchored to bottom, shrinks downward as HP decreases */}
          <div 
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-900 via-game-blue to-blue-600 transition-all duration-300 ease-out"
            style={{ height: `${blueState.hp}%` }}
          />
          
          {/* Inner glow when full */}
          {blueState.hp > 75 && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-transparent to-blue-400/20 pointer-events-none"
                 style={{ height: `${blueState.hp}%` }} />
          )}
          
          {/* Critical pulse overlay */}
          {blueState.hp <= 25 && blueState.hp > 0 && (
            <div className="absolute inset-0 bg-blue-900/30 animate-hp-critical" />
          )}

          {/* Flash overlay on damage */}
          {flashSide === 'blue' && (
            <div className="absolute inset-0 bg-white/30 animate-flash-side" />
          )}

          {/* HP Number - Giant, centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-black text-white leading-none",
              "text-[clamp(80px,14vw,220px)]",
              "drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]",
              blueState.hp <= 25 && "animate-hp-critical"
            )}
            style={{ textShadow: '0 0 40px hsl(var(--game-blue-glow) / 0.4)' }}
            >
              {blueState.hp}
            </span>
          </div>

          {/* Damage popup */}
          {lastDamage?.side === 'blue' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10">
              <span className="text-white font-black text-[clamp(48px,6vw,96px)] animate-damage-popup drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                -{lastDamage.amount}
              </span>
            </div>
          )}

          {/* Combo indicator */}
          {showCombo?.side === 'blue' && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-10 animate-combo-pop">
              <div className="text-center">
                <span className="block text-game-yellow font-black text-[clamp(24px,3vw,48px)] uppercase tracking-widest">
                  COMBO
                </span>
                <span className={cn(
                  "block font-black leading-none text-game-yellow",
                  "text-[clamp(72px,10vw,140px)]",
                  "drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                )}
                style={{ textShadow: '0 0 40px hsl(var(--game-yellow-glow) / 0.6)' }}
                >
                  x{showCombo.count}
                </span>
              </div>
            </div>
          )}

          {/* Special Ready */}
          {blueState.specialReady && !showSpecialUsed && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-combo-pop">
              <div className={cn(
                "px-6 py-3 rounded-lg font-black uppercase tracking-wide",
                "text-[clamp(20px,2.5vw,36px)]",
                "bg-gradient-to-r from-yellow-600 to-game-yellow",
                "text-black border-2 border-yellow-400",
                "animate-special-glow flex items-center gap-2"
              )}>
                <Zap className="w-6 h-6 fill-current" />
                ESPECIAL
                <Zap className="w-6 h-6 fill-current" />
              </div>
            </div>
          )}

          {/* Blue Mascot */}
          <div className="absolute bottom-[12%] right-6 z-10 pointer-events-none">
            <FighterMascot 
              side="blue" 
              state={getMascotState('blue')} 
              size="md"
            />
          </div>
        </div>

        {/* Special Used overlay */}
        {showSpecialUsed && (
          <div className={cn(
            "absolute z-30 animate-combo-pop",
            showSpecialUsed === 'red' ? "left-1/4 top-1/3 -translate-x-1/2" : "right-1/4 top-1/3 translate-x-1/2"
          )}>
            <div className={cn(
              "px-10 py-6 rounded-2xl font-black uppercase tracking-wide",
              "text-[clamp(48px,5vw,80px)]",
              "bg-gradient-to-r from-yellow-600 to-game-yellow",
              "text-black border-4 border-yellow-400",
              "animate-special-glow"
            )}>
              <div className="flex items-center gap-4">
                <Zap className="w-12 h-12 fill-current" />
                <span>ESPECIAL!</span>
                <Zap className="w-12 h-12 fill-current" />
              </div>
            </div>
          </div>
        )}

        {/* KO Overlay - Giant and simple */}
        {showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-40">
            <div className="text-center animate-ko-tv">
              <div 
                className={cn(
                  "font-black leading-none",
                  "text-[clamp(200px,28vw,400px)]",
                  "text-game-yellow"
                )}
                style={{ 
                  textShadow: '0 12px 0 rgba(0,0,0,0.4), 0 0 100px rgba(255,215,0,0.6)' 
                }}
              >
                K.O.
              </div>
              
              <div className={cn(
                "font-black uppercase mt-6",
                "text-[clamp(48px,6vw,96px)]",
                showKO === 'red' ? "text-game-red" : "text-game-blue"
              )}
              style={{
                textShadow: showKO === 'red' 
                  ? '0 0 50px hsl(var(--game-red-glow) / 0.7)' 
                  : '0 0 50px hsl(var(--game-blue-glow) / 0.7)'
              }}
              >
                {showKO === 'red' ? 'VERMELHO' : 'AZUL'} VENCE!
              </div>
            </div>
          </div>
        )}

        {/* Round End (time up, not KO) */}
        {gameState === 'round_end' && !showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-40">
            <div className="text-center animate-ko-tv">
              <div 
                className={cn(
                  "font-black",
                  "text-[clamp(140px,16vw,260px)]",
                  "text-game-yellow"
                )}
                style={{ 
                  textShadow: '0 8px 0 rgba(0,0,0,0.4), 0 0 80px rgba(255,215,0,0.5)' 
                }}
              >
                TEMPO!
              </div>
              <div className={cn(
                "font-black uppercase mt-4",
                "text-[clamp(48px,6vw,96px)]"
              )}>
                {redState.hp > blueState.hp 
                  ? <span className="text-game-red" style={{ textShadow: '0 0 40px hsl(var(--game-red-glow) / 0.6)' }}>VERMELHO VENCE!</span>
                  : blueState.hp > redState.hp 
                    ? <span className="text-game-blue" style={{ textShadow: '0 0 40px hsl(var(--game-blue-glow) / 0.6)' }}>AZUL VENCE!</span>
                    : <span className="text-game-yellow" style={{ textShadow: '0 0 40px hsl(var(--game-yellow-glow) / 0.6)' }}>EMPATE!</span>
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============ BOTTOM BAR - Energy (minimal) ============ */}
      <div className="relative z-20 h-[6vh] min-h-[48px] bg-black/80 flex items-center justify-between px-8 border-t border-white/10">
        {/* Red Energy */}
        <div className="flex items-center gap-4 flex-1">
          <span className="text-[clamp(12px,1.5vw,18px)] text-game-red/80 font-bold uppercase">Energia</span>
          <div className="flex-1 max-w-[200px] h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-150 rounded-full",
                redState.specialReady 
                  ? "bg-gradient-to-r from-yellow-500 to-game-yellow animate-pulse" 
                  : "bg-game-red/70"
              )}
              style={{ width: `${(redState.energy / config.energyMax) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls hint (very small) */}
        <div className="text-[10px] text-white/30 flex gap-4">
          <span>A = Vermelho</span>
          <span>L = Azul</span>
          <span>ESC = Sair</span>
        </div>

        {/* Blue Energy */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="flex-1 max-w-[200px] h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-150 rounded-full ml-auto",
                blueState.specialReady 
                  ? "bg-gradient-to-r from-game-yellow to-yellow-500 animate-pulse" 
                  : "bg-game-blue/70"
              )}
              style={{ width: `${(blueState.energy / config.energyMax) * 100}%` }}
            />
          </div>
          <span className="text-[clamp(12px,1.5vw,18px)] text-game-blue/80 font-bold uppercase">Energia</span>
        </div>
      </div>
    </div>
  );
}
