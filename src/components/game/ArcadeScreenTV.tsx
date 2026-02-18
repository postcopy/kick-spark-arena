import { cn } from '@/lib/utils';
import { Shield, HardHat } from 'lucide-react';
import type { UseArcadeStateReturn } from '@/hooks/useArcadeState';
import logoSFight from '@/assets/logo-desafio-relampago.png';
import { BatteryBadge } from './EquipmentStatus';
import type { Side } from '@/types/game';
import type { EquipmentSlot, EquipmentState } from '@/types/serial';

interface ArcadeScreenTVProps {
  arcadeState: UseArcadeStateReturn;
  equipment?: Map<EquipmentSlot, EquipmentState>;
}

export function ArcadeScreenTV({ arcadeState, equipment }: ArcadeScreenTVProps) {
  const {
    currentRound,
    timeLeft,
    redState,
    blueState,
    flashSide,
    showCombo,
    showKO,
    lastDamage,
    config,
    gameState,
    roundResults,
    recoveryCountdown,
  } = arcadeState;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const redWins = roundResults.filter(r => r.winner === 'red').length;
  const blueWins = roundResults.filter(r => r.winner === 'blue').length;
  const roundsToWin = Math.ceil(config.bestOf / 2);

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

  const displayHP = (hp: number) => Math.round(hp);

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0b1120] overflow-hidden">
      
      {/* ============ TOP BAR ============ */}
      <div className="relative z-20 h-[8vh] min-h-[60px] bg-[#0b1120] flex items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          <span className={cn(
            "font-black italic uppercase tracking-wide text-white font-mono",
            "text-[clamp(36px,5vmin,72px)]",
            "drop-shadow-[0_2px_8px_hsl(var(--game-red-glow)/0.6)]"
          )}>
            VERMELHO
          </span>
          <RoundStars wins={redWins} maxWins={roundsToWin} side="red" />
        </div>

        <div className={cn(
          "font-black text-white/40 font-mono",
          "text-[clamp(32px,4vmin,64px)]"
        )}>
          VS
        </div>

        <div className="flex items-center gap-6">
          <RoundStars wins={blueWins} maxWins={roundsToWin} side="blue" />
          <span className={cn(
            "font-black italic uppercase tracking-wide text-white font-mono",
            "text-[clamp(36px,5vmin,72px)]",
            "drop-shadow-[0_2px_8px_hsl(var(--game-blue-glow)/0.6)]"
          )}>
            AZUL
          </span>
        </div>
      </div>

      {/* ============ MAIN AREA ============ */}
      <div className="flex-1 flex relative">
        
        {/* Red Side */}
        <div className={cn(
          "flex-1 relative bg-[#0b1120] overflow-hidden",
          flashSide === 'red' && "animate-damage-shake-tv"
        )}>
          <div 
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-900/80 via-game-red/60 to-red-700/40 transition-all duration-300 ease-out"
            style={{ height: `${redState.hp}%` }}
          />
          
          {redState.hp <= 25 && redState.hp > 0 && (
            <div className="absolute inset-0 bg-red-900/30 animate-hp-critical" />
          )}

          {flashSide === 'red' && (
            <div className="absolute inset-0 bg-white/30 animate-flash-side" />
          )}

          {/* META label */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10">
            <span className="text-[clamp(12px,2vmin,24px)] font-bold uppercase tracking-[0.3em] text-white/30 font-mono">
              META
            </span>
          </div>

          {/* HP Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-black text-white leading-none font-mono",
              "text-[clamp(80px,14vmin,220px)]",
              "drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]",
              redState.hp <= 25 && "animate-hp-critical"
            )}
            style={{ textShadow: '0 0 40px hsl(var(--game-red-glow) / 0.4)' }}
            >
              {displayHP(redState.hp)}
            </span>
          </div>

          {/* Shield icon */}
          <div className={cn(
            "absolute bottom-[12%] left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-transform duration-100",
            flashSide === 'red' && "animate-damage-shake"
          )}>
            <Shield 
              className={cn(
                "w-[clamp(48px,8vmin,96px)] h-[clamp(48px,8vmin,96px)] text-game-red/40",
                flashSide === 'red' && "text-white/60"
              )} 
              strokeWidth={1.5}
            />
          </div>

          {/* Damage popup */}
          {lastDamage?.side === 'red' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10">
              <span className={cn(
                "font-black font-mono animate-damage-popup drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]",
                "text-[clamp(48px,6vmin,96px)]",
                lastDamage.hitType === 'helmet' ? "text-game-yellow" : "text-white"
              )}>
                -{lastDamage.amount % 1 === 0 ? lastDamage.amount : lastDamage.amount.toFixed(1)}
              </span>
              {lastDamage.hitType === 'helmet' && (
                <div className="flex items-center justify-center gap-2 animate-combo-pop">
                  <HardHat className="w-6 h-6 text-game-yellow" />
                  <span className="text-game-yellow text-xl font-black uppercase font-mono">
                    CABEÇA!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Combo */}
          {showCombo?.side === 'red' && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-10 animate-combo-pop">
              <div className="text-center">
                <span className="block text-game-yellow font-black text-[clamp(24px,3vmin,48px)] uppercase tracking-widest font-mono">
                  COMBO
                </span>
                <span className={cn(
                  "block font-black leading-none text-game-yellow font-mono",
                  "text-[clamp(72px,10vmin,140px)]",
                  "drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                )}
                style={{ textShadow: '0 0 40px hsl(var(--game-yellow-glow) / 0.6)' }}
                >
                  x{showCombo.count}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center Divider */}
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          
          <div className="relative mb-4">
            <img 
              src={logoSFight} 
              alt="S-Fight" 
              className="h-[clamp(60px,8vh,120px)] w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            />
          </div>

          <div className={cn(
            "bg-[#0b1120]/90 px-8 py-4 rounded-xl border-2",
            timeLeft <= 10 ? "border-destructive" : timeLeft <= 30 ? "border-yellow-500" : "border-white/20"
          )}>
            <div className={cn(
              "font-mono font-black tracking-tight leading-none text-center",
              "text-[clamp(64px,9vmin,140px)]",
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

          <div className="mt-4 text-[clamp(16px,2vmin,28px)] text-white/40 uppercase tracking-widest font-bold font-mono">
            ROUND {currentRound}/{config.bestOf}
          </div>
        </div>

        {/* Blue Side */}
        <div className={cn(
          "flex-1 relative bg-[#0b1120] overflow-hidden",
          flashSide === 'blue' && "animate-damage-shake-tv"
        )}>
          <div 
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-900/80 via-game-blue/60 to-blue-600/40 transition-all duration-300 ease-out"
            style={{ height: `${blueState.hp}%` }}
          />
          
          {blueState.hp <= 25 && blueState.hp > 0 && (
            <div className="absolute inset-0 bg-blue-900/30 animate-hp-critical" />
          )}

          {flashSide === 'blue' && (
            <div className="absolute inset-0 bg-white/30 animate-flash-side" />
          )}

          {/* META label */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10">
            <span className="text-[clamp(12px,2vmin,24px)] font-bold uppercase tracking-[0.3em] text-white/30 font-mono">
              META
            </span>
          </div>

          {/* HP Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-black text-white leading-none font-mono",
              "text-[clamp(80px,14vmin,220px)]",
              "drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]",
              blueState.hp <= 25 && "animate-hp-critical"
            )}
            style={{ textShadow: '0 0 40px hsl(var(--game-blue-glow) / 0.4)' }}
            >
              {displayHP(blueState.hp)}
            </span>
          </div>

          {/* Shield icon */}
          <div className={cn(
            "absolute bottom-[12%] left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-transform duration-100",
            flashSide === 'blue' && "animate-damage-shake"
          )}>
            <Shield 
              className={cn(
                "w-[clamp(48px,8vmin,96px)] h-[clamp(48px,8vmin,96px)] text-game-blue/40",
                flashSide === 'blue' && "text-white/60"
              )} 
              strokeWidth={1.5}
            />
          </div>

          {/* Damage popup */}
          {lastDamage?.side === 'blue' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10">
              <span className={cn(
                "font-black font-mono animate-damage-popup drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]",
                "text-[clamp(48px,6vmin,96px)]",
                lastDamage.hitType === 'helmet' ? "text-game-yellow" : "text-white"
              )}>
                -{lastDamage.amount % 1 === 0 ? lastDamage.amount : lastDamage.amount.toFixed(1)}
              </span>
              {lastDamage.hitType === 'helmet' && (
                <div className="flex items-center justify-center gap-2 animate-combo-pop">
                  <HardHat className="w-6 h-6 text-game-yellow" />
                  <span className="text-game-yellow text-xl font-black uppercase font-mono">
                    CABEÇA!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Combo */}
          {showCombo?.side === 'blue' && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-10 animate-combo-pop">
              <div className="text-center">
                <span className="block text-game-yellow font-black text-[clamp(24px,3vmin,48px)] uppercase tracking-widest font-mono">
                  COMBO
                </span>
                <span className={cn(
                  "block font-black leading-none text-game-yellow font-mono",
                  "text-[clamp(72px,10vmin,140px)]",
                  "drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                )}
                style={{ textShadow: '0 0 40px hsl(var(--game-yellow-glow) / 0.6)' }}
                >
                  x{showCombo.count}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* KO Overlay — winner zeroed their target */}
        {showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-40">
            <div className="text-center animate-ko-tv">
              <div 
                className={cn(
                  "font-black leading-none font-mono",
                  "text-[clamp(160px,22vmin,320px)]",
                  "text-game-yellow"
                )}
                style={{ textShadow: '0 12px 0 rgba(0,0,0,0.4), 0 0 100px rgba(255,215,0,0.6)' }}
              >
                ZERO!
              </div>
              
              <div className={cn(
                "font-black uppercase mt-6 font-mono",
                "text-[clamp(48px,6vmin,96px)]",
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
              
              {recoveryCountdown > 0 && (
                <div className="mt-8">
                  <span className="text-white/60 text-[clamp(18px,2vmin,28px)] uppercase tracking-wider font-mono">
                    Próximo round em
                  </span>
                  <div className="text-[clamp(80px,10vmin,140px)] font-black text-green-500 animate-pulse font-mono">
                    {recoveryCountdown}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Round End (time up) — LOWER HP wins */}
        {gameState === 'round_end' && !showKO && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-40">
            <div className="text-center animate-ko-tv">
              <div 
                className={cn(
                  "font-black font-mono",
                  "text-[clamp(140px,16vmin,260px)]",
                  "text-game-yellow"
                )}
                style={{ textShadow: '0 8px 0 rgba(0,0,0,0.4), 0 0 80px rgba(255,215,0,0.5)' }}
              >
                TEMPO!
              </div>
              <div className={cn(
                "font-black uppercase mt-4 font-mono",
                "text-[clamp(48px,6vmin,96px)]"
              )}>
                {redState.hp < blueState.hp 
                  ? <span className="text-game-red" style={{ textShadow: '0 0 40px hsl(var(--game-red-glow) / 0.6)' }}>VERMELHO VENCE!</span>
                  : blueState.hp < redState.hp 
                    ? <span className="text-game-blue" style={{ textShadow: '0 0 40px hsl(var(--game-blue-glow) / 0.6)' }}>AZUL VENCE!</span>
                    : <span className="text-game-yellow" style={{ textShadow: '0 0 40px hsl(var(--game-yellow-glow) / 0.6)' }}>EMPATE!</span>
                }
              </div>
              
              {recoveryCountdown > 0 && (
                <div className="mt-8">
                  <span className="text-white/60 text-[clamp(18px,2vmin,28px)] uppercase tracking-wider font-mono">
                    Próximo round em
                  </span>
                  <div className="text-[clamp(80px,10vmin,140px)] font-black text-green-500 animate-pulse font-mono">
                    {recoveryCountdown}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ BOTTOM BAR ============ */}
      <div className="relative z-20 h-[5vh] min-h-[40px] bg-[#0b1120]/80 flex items-center justify-between px-8 border-t border-white/10">
        {equipment && (
          <div className="flex items-center gap-2">
            <BatteryBadge equipment={equipment.get(1)} compact />
            <BatteryBadge equipment={equipment.get(3)} compact />
          </div>
        )}

        <div className="text-[10px] text-white/30 flex gap-4 font-mono mx-auto">
          <span>A = Vermelho</span>
          <span>L = Azul</span>
          <span>ESC = Sair</span>
        </div>

        {equipment && (
          <div className="flex items-center gap-2">
            <BatteryBadge equipment={equipment.get(2)} compact />
            <BatteryBadge equipment={equipment.get(4)} compact />
          </div>
        )}
      </div>
    </div>
  );
}
