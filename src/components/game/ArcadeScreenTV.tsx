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

        </div>

        {/* Unified Round Transition Panel */}
        {(showKO || (gameState === 'round_end' && !showKO)) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center">
            <div className={cn(
              "bg-[#0b1120]/95 rounded-2xl border-2 p-[clamp(24px,4vmin,48px)] text-center",
              "w-[clamp(400px,60vmin,700px)] max-w-[90vw]",
              showKO
                ? "border-game-yellow/60 shadow-[0_0_60px_rgba(255,215,0,0.3)]"
                : "border-cyan-400/50 shadow-[0_0_60px_rgba(34,211,238,0.25)]"
            )}>
              {/* Header */}
              <div className="text-[clamp(14px,2vmin,22px)] font-black uppercase tracking-[0.25em] text-white/50 font-mono mb-4">
                FIM DO ROUND {currentRound}
              </div>
              <div className="border-b border-white/10 mb-6" />

              {/* Result */}
              {showKO ? (
                <>
                  <div
                    className="font-black leading-none font-mono text-game-yellow text-[clamp(80px,14vmin,180px)]"
                    style={{ textShadow: '0 8px 0 rgba(0,0,0,0.4), 0 0 80px rgba(255,215,0,0.6)' }}
                  >
                    ZERO!
                  </div>
                  <div className={cn(
                    "font-black uppercase mt-2 font-mono text-[clamp(20px,3.5vmin,42px)]",
                    showKO === 'red' ? "text-game-red" : "text-game-blue"
                  )}
                  style={{
                    textShadow: showKO === 'red'
                      ? '0 0 40px hsl(var(--game-red-glow) / 0.7)'
                      : '0 0 40px hsl(var(--game-blue-glow) / 0.7)'
                  }}>
                    {showKO === 'red' ? 'VERMELHO' : 'AZUL'} ZEROU A META!
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="font-black leading-none font-mono text-game-yellow text-[clamp(40px,6vmin,80px)]"
                    style={{ textShadow: '0 6px 0 rgba(0,0,0,0.4), 0 0 60px rgba(255,215,0,0.5)' }}
                  >
                    TEMPO ESGOTADO!
                  </div>
                  <div className={cn(
                    "font-black uppercase mt-2 font-mono text-[clamp(20px,3.5vmin,42px)]"
                  )}>
                    {redState.hp < blueState.hp
                      ? <span className="text-game-red" style={{ textShadow: '0 0 30px hsl(var(--game-red-glow) / 0.6)' }}>VANTAGEM VERMELHO</span>
                      : blueState.hp < redState.hp
                        ? <span className="text-game-blue" style={{ textShadow: '0 0 30px hsl(var(--game-blue-glow) / 0.6)' }}>VANTAGEM AZUL</span>
                        : <span className="text-game-yellow" style={{ textShadow: '0 0 30px hsl(var(--game-yellow-glow) / 0.6)' }}>EMPATE!</span>
                    }
                  </div>
                </>
              )}

              {/* Match Score (Best of N) */}
              {config.bestOf > 1 && (
                <>
                  <div className="border-b border-white/10 my-6" />
                  <div className="flex items-center justify-center gap-[clamp(16px,3vmin,32px)]">
                    <div className="text-center">
                      <div className={cn(
                        "font-black font-mono text-[clamp(48px,8vmin,96px)] leading-none",
                        (showKO === 'red' || (!showKO && redState.hp < blueState.hp)) ? "text-game-red" : "text-game-red/40"
                      )}>
                        {redWins}
                      </div>
                      <div className="text-[clamp(10px,1.5vmin,14px)] font-bold uppercase tracking-wider text-white/40 font-mono mt-1">
                        VERMELHO
                      </div>
                    </div>
                    <span className="text-[clamp(32px,5vmin,64px)] font-black text-white/20 font-mono">×</span>
                    <div className="text-center">
                      <div className={cn(
                        "font-black font-mono text-[clamp(48px,8vmin,96px)] leading-none",
                        (showKO === 'blue' || (!showKO && blueState.hp < redState.hp)) ? "text-game-blue" : "text-game-blue/40"
                      )}>
                        {blueWins}
                      </div>
                      <div className="text-[clamp(10px,1.5vmin,14px)] font-bold uppercase tracking-wider text-white/40 font-mono mt-1">
                        AZUL
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Countdown */}
              {recoveryCountdown > 0 && (
                <>
                  <div className="border-b border-white/10 my-6" />
                  <div className="text-[clamp(12px,1.8vmin,18px)] text-white/50 uppercase tracking-wider font-mono mb-2">
                    Próximo round em:
                  </div>
                  <div className={cn(
                    "text-[clamp(64px,10vmin,120px)] font-black text-green-500 font-mono leading-none",
                    recoveryCountdown <= 2 && "animate-pulse"
                  )}>
                    {recoveryCountdown}
                  </div>
                </>
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
