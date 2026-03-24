import { cn } from '@/lib/utils';
import { Swords, HardHat, Flame, Shield } from 'lucide-react';
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

  const displayHP = (hp: number) => Math.round(hp);

  const RoundStars = ({ wins, maxWins, side }: { wins: number; maxWins: number; side: 'red' | 'blue' }) => (
    <div className={cn("flex gap-1.5", side === 'blue' && "flex-row-reverse")}>
      {Array.from({ length: maxWins }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-5 h-5 rounded-full border-2 transition-all duration-300",
            i < wins
              ? side === 'red'
                ? "bg-red-500 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                : "bg-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
              : "bg-transparent border-white/20"
          )}
        />
      ))}
    </div>
  );

  // HP Bar component — horizontal fighting game style
  const HPBar = ({ hp, side }: { hp: number; side: 'red' | 'blue' }) => {
    const isLow = hp <= 25 && hp > 0;
    return (
      <div className="relative w-full">
        {/* Bar track */}
        <div className={cn(
          "h-[clamp(28px,4vh,48px)] rounded-lg overflow-hidden border",
          side === 'red' ? "border-red-500/30" : "border-blue-500/30",
          "bg-white/[0.03]"
        )}>
          {/* Fill */}
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out rounded-lg relative overflow-hidden",
              side === 'red'
                ? cn("bg-gradient-to-r from-red-700 to-red-500", isLow && "animate-hp-critical")
                : cn("bg-gradient-to-b from-blue-500 to-blue-700 [direction:rtl]", isLow && "animate-hp-critical"),
            )}
            style={{
              width: `${hp}%`,
              float: side === 'blue' ? 'right' : 'left',
            }}
          >
            {/* Shine */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0A0A0F] overflow-hidden">

      {/* Ambient arena glow — Blue left, Red right (mirrored so each athlete sees opponent) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-red-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* ============ TOP HUD — HP BARS + TIMER ============ */}
      <div className="relative z-20 flex-shrink-0 px-4 md:px-6 pt-3 pb-2">
        <div className="flex items-center gap-3 md:gap-4">
          {/* LEFT: Blue HP (so Red athlete on left sees opponent's HP) */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-display font-black uppercase text-[clamp(18px,3vmin,36px)] tracking-tight",
                  "text-blue-400",
                )}
                style={{ textShadow: '0 0 20px rgba(59,130,246,0.4)' }}
                >
                  AZUL
                </span>
                <RoundStars wins={blueWins} maxWins={roundsToWin} side="blue" />
              </div>
              <span className={cn(
                "font-mono font-black text-[clamp(20px,3vmin,40px)] tabular-nums",
                blueState.hp <= 25 ? "text-blue-300 animate-hp-critical" : "text-white/80"
              )}>
                {displayHP(blueState.hp)}
              </span>
            </div>
            <HPBar hp={blueState.hp} side="blue" />
          </div>

          {/* Center — Timer + Round */}
          <div className="flex-shrink-0 flex flex-col items-center min-w-[clamp(100px,14vmin,180px)]">
            <div className={cn(
              "font-mono font-black tracking-tight leading-none text-center tabular-nums",
              "text-[clamp(36px,6vmin,80px)]",
              timeLeft <= 10
                ? "text-red-400 animate-pulse"
                : timeLeft <= 30
                  ? "text-orange-300"
                  : "text-white/90",
            )}
            style={{
              textShadow: timeLeft <= 10
                ? '0 0 30px rgba(239,68,68,0.5)'
                : '0 0 20px rgba(255,255,255,0.1)'
            }}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Swords className="w-3 h-3 text-white/20" />
              <span className="text-[clamp(9px,1.2vmin,14px)] text-white/25 uppercase tracking-[0.3em] font-mono font-bold">
                R{currentRound}/{config.bestOf}
              </span>
            </div>
          </div>

          {/* RIGHT: Red HP (so Blue athlete on right sees opponent's HP) */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn(
                "font-mono font-black text-[clamp(20px,3vmin,40px)] tabular-nums",
                redState.hp <= 25 ? "text-red-300 animate-hp-critical" : "text-white/80"
              )}>
                {displayHP(redState.hp)}
              </span>
              <div className="flex items-center gap-2">
                <RoundStars wins={redWins} maxWins={roundsToWin} side="red" />
                <span className={cn(
                  "font-display font-black uppercase text-[clamp(18px,3vmin,36px)] tracking-tight",
                  "text-red-400",
                )}
                style={{ textShadow: '0 0 20px rgba(239,68,68,0.4)' }}
                >
                  VERMELHO
                </span>
              </div>
            </div>
            <HPBar hp={redState.hp} side="red" />
          </div>
        </div>
      </div>

      {/* ============ MAIN ARENA ============ */}
      <div className="flex-1 flex relative overflow-hidden">

        {/* LEFT Arena — Blue HP (opponent of Red athlete) */}
        <div className={cn(
          "flex-1 relative overflow-hidden",
          flashSide === 'blue' && "animate-damage-shake-tv"
        )}>
          {/* Background fill based on HP */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-900/40 via-blue-500/20 to-transparent transition-all duration-300 ease-out"
            style={{ height: `${blueState.hp}%` }}
          />

          {blueState.hp <= 25 && blueState.hp > 0 && (
            <div className="absolute inset-0 bg-blue-900/20 animate-hp-critical" />
          )}

          {flashSide === 'blue' && (
            <>
              <div className="absolute inset-0 bg-white/20 animate-flash-side" />
              <div className="impact-ripple z-[3]" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)' }} />
            </>
          )}

          {/* HP Number — Hero display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-black text-white/90 leading-none font-mono tabular-nums",
              "text-[clamp(100px,18vmin,280px)]",
              blueState.hp <= 25 && "animate-hp-critical"
            )}
            style={{ textShadow: '0 0 60px rgba(59,130,246,0.3), 0 8px 20px rgba(0,0,0,0.6)' }}
            >
              {displayHP(blueState.hp)}
            </span>
          </div>

          {/* Shield icon */}
          <div className={cn(
            "absolute bottom-[10%] left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-transform duration-100",
            flashSide === 'blue' && "animate-damage-shake"
          )}>
            <Shield
              className={cn(
                "w-[clamp(40px,6vmin,80px)] h-[clamp(40px,6vmin,80px)]",
                flashSide === 'blue' ? "text-white/40" : "text-blue-500/20"
              )}
              strokeWidth={1.5}
            />
          </div>

          {/* Damage popup */}
          {lastDamage?.side === 'blue' && (
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
              <span className={cn(
                "font-black font-mono animate-damage-popup",
                "text-[clamp(48px,7vmin,110px)]",
                lastDamage.hitType === 'helmet'
                  ? "text-yellow-400"
                  : "text-white",
              )}
              style={{ textShadow: '0 4px 16px rgba(0,0,0,0.9)' }}
              >
                -{lastDamage.amount % 1 === 0 ? lastDamage.amount : lastDamage.amount.toFixed(1)}
              </span>
              {lastDamage.hitType === 'helmet' && (
                <div className="flex items-center justify-center gap-2 animate-combo-pop">
                  <HardHat className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 text-lg font-black uppercase font-mono tracking-wider">
                    CABEÇA!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Divider */}
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20 flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <div className="relative">
            <img
              src={logoSFight}
              alt="S-Fight"
              className="h-[clamp(50px,7vh,100px)] w-auto opacity-60 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>

        {/* RIGHT Arena — Red HP (opponent of Blue athlete) */}
        <div className={cn(
          "flex-1 relative overflow-hidden",
          flashSide === 'red' && "animate-damage-shake-tv"
        )}>
          {/* Background fill based on HP */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-900/40 via-red-500/20 to-transparent transition-all duration-300 ease-out"
            style={{ height: `${redState.hp}%` }}
          />

          {redState.hp <= 25 && redState.hp > 0 && (
            <div className="absolute inset-0 bg-red-900/20 animate-hp-critical" />
          )}

          {flashSide === 'red' && (
            <>
              <div className="absolute inset-0 bg-white/20 animate-flash-side" />
              <div className="impact-ripple z-[3]" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)' }} />
            </>
          )}

          {/* HP Number — Hero display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-black text-white/90 leading-none font-mono tabular-nums",
              "text-[clamp(100px,18vmin,280px)]",
              redState.hp <= 25 && "animate-hp-critical"
            )}
            style={{ textShadow: '0 0 60px rgba(239,68,68,0.3), 0 8px 20px rgba(0,0,0,0.6)' }}
            >
              {displayHP(redState.hp)}
            </span>
          </div>

          {/* Shield icon */}
          <div className={cn(
            "absolute bottom-[10%] left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-transform duration-100",
            flashSide === 'red' && "animate-damage-shake"
          )}>
            <Shield
              className={cn(
                "w-[clamp(40px,6vmin,80px)] h-[clamp(40px,6vmin,80px)]",
                flashSide === 'red' ? "text-white/40" : "text-red-500/20"
              )}
              strokeWidth={1.5}
            />
          </div>

          {/* Damage popup */}
          {lastDamage?.side === 'red' && (
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
              <span className={cn(
                "font-black font-mono animate-damage-popup",
                "text-[clamp(48px,7vmin,110px)]",
                lastDamage.hitType === 'helmet'
                  ? "text-yellow-400"
                  : "text-white",
              )}
              style={{ textShadow: '0 4px 16px rgba(0,0,0,0.9)' }}
              >
                -{lastDamage.amount % 1 === 0 ? lastDamage.amount : lastDamage.amount.toFixed(1)}
              </span>
              {lastDamage.hitType === 'helmet' && (
                <div className="flex items-center justify-center gap-2 animate-combo-pop">
                  <HardHat className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 text-lg font-black uppercase font-mono tracking-wider">
                    CABEÇA!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============ ROUND END / K.O. OVERLAY ============ */}
        {(showKO || (gameState === 'round_end' && !showKO)) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className={cn(
              "bg-[#0A0A0F]/95 rounded-2xl border p-[clamp(24px,4vmin,48px)] text-center",
              "w-[clamp(400px,55vmin,660px)] max-w-[90vw]",
              showKO
                ? "border-yellow-500/40 shadow-[0_0_80px_rgba(245,158,11,0.2)]"
                : "border-white/10 shadow-[0_0_60px_rgba(255,255,255,0.05)]"
            )}>
              {/* Header */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Flame className="w-[clamp(14px,2vmin,20px)] h-[clamp(14px,2vmin,20px)] text-white/30" />
                <span className="text-[clamp(11px,1.5vmin,18px)] font-display font-bold uppercase tracking-[0.3em] text-white/30">
                  FIM DO ROUND {currentRound}
                </span>
              </div>
              <div className="h-px bg-white/[0.06] mb-6" />

              {/* Result */}
              {showKO ? (
                <>
                  <div
                    className="font-display font-black leading-none text-yellow-400 text-[clamp(72px,12vmin,160px)]"
                    style={{ textShadow: '0 6px 0 rgba(0,0,0,0.4), 0 0 80px rgba(245,158,11,0.5)' }}
                  >
                    K.O.!
                  </div>
                  <div className={cn(
                    "font-display font-black uppercase mt-3 text-[clamp(18px,3vmin,36px)]",
                    showKO === 'red' ? "text-red-400" : "text-blue-400"
                  )}
                  style={{
                    textShadow: showKO === 'red'
                      ? '0 0 30px rgba(239,68,68,0.5)'
                      : '0 0 30px rgba(59,130,246,0.5)'
                  }}>
                    {showKO === 'red' ? 'VERMELHO' : 'AZUL'} VENCEU!
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="font-display font-black leading-none text-orange-400 text-[clamp(36px,5vmin,72px)]"
                    style={{ textShadow: '0 4px 0 rgba(0,0,0,0.4), 0 0 50px rgba(249,115,22,0.4)' }}
                  >
                    TEMPO!
                  </div>
                  <div className="font-display font-black uppercase mt-3 text-[clamp(16px,2.5vmin,32px)]">
                    {redState.hp > blueState.hp
                      ? <span className="text-red-400" style={{ textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>VANTAGEM VERMELHO</span>
                      : blueState.hp > redState.hp
                        ? <span className="text-blue-400" style={{ textShadow: '0 0 20px rgba(59,130,246,0.4)' }}>VANTAGEM AZUL</span>
                        : <span className="text-yellow-400" style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>EMPATE!</span>
                    }
                  </div>
                </>
              )}

              {/* Match Score (Best of N) */}
              {config.bestOf > 1 && (
                <>
                  <div className="h-px bg-white/[0.06] my-6" />
                  <div className="flex items-center justify-center gap-[clamp(16px,3vmin,32px)]">
                    <div className="text-center">
                      <div className={cn(
                        "font-black font-mono text-[clamp(40px,7vmin,88px)] leading-none tabular-nums",
                        (showKO === 'blue' || (!showKO && blueState.hp < redState.hp)) ? "text-blue-400" : "text-blue-400/30"
                      )}>
                        {blueWins}
                      </div>
                      <div className="text-[clamp(9px,1.2vmin,13px)] font-bold uppercase tracking-wider text-white/25 font-mono mt-1">
                        AZUL
                      </div>
                    </div>
                    <span className="text-[clamp(24px,4vmin,52px)] font-black text-white/15 font-mono">&times;</span>
                    <div className="text-center">
                      <div className={cn(
                        "font-black font-mono text-[clamp(40px,7vmin,88px)] leading-none tabular-nums",
                        (showKO === 'red' || (!showKO && redState.hp < blueState.hp)) ? "text-red-400" : "text-red-400/30"
                      )}>
                        {redWins}
                      </div>
                      <div className="text-[clamp(9px,1.2vmin,13px)] font-bold uppercase tracking-wider text-white/25 font-mono mt-1">
                        VERMELHO
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Recovery Countdown */}
              {recoveryCountdown > 0 && (
                <>
                  <div className="h-px bg-white/[0.06] my-6" />
                  <div className="text-[clamp(10px,1.5vmin,16px)] text-white/30 uppercase tracking-[0.2em] font-mono mb-2">
                    Próximo round em
                  </div>
                  <div className={cn(
                    "text-[clamp(56px,9vmin,110px)] font-display font-black text-green-400 leading-none",
                    recoveryCountdown <= 2 && "animate-pulse"
                  )}
                  style={{ textShadow: '0 0 40px rgba(34,197,94,0.4)' }}
                  >
                    {recoveryCountdown}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ BOTTOM BAR ============ */}
      <div className="relative z-20 flex-shrink-0 h-[4vh] min-h-[32px] flex items-center justify-between px-6 border-t border-white/[0.06] bg-[#0A0A0F]/80">
        {equipment && (
          <div className="flex items-center gap-2">
            <BatteryBadge equipment={equipment.get(2)} compact />
            <BatteryBadge equipment={equipment.get(4)} compact />
          </div>
        )}

        <div className="flex gap-4 font-mono text-[10px] text-white/20 mx-auto">
          <span>A = Verm</span>
          <span>L = Azul</span>
          <span>ESC = Sair</span>
        </div>

        {equipment && (
          <div className="flex items-center gap-2">
            <BatteryBadge equipment={equipment.get(1)} compact />
            <BatteryBadge equipment={equipment.get(3)} compact />
          </div>
        )}
      </div>
    </div>
  );
}
