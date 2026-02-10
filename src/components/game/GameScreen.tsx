import { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { KickPanel } from './KickPanel';
import { FighterMascot, type MascotState } from './FighterMascot';
import { LowBatteryAlert } from './EquipmentStatus';
import type { GameScore, Side, Athlete } from '@/types/game';
import type { EquipmentSlot, EquipmentState } from '@/types/serial';
import { cn } from '@/lib/utils';

interface GameScreenProps {
  scores: GameScore;
  timeLeft: number;
  isPaused: boolean;
  flashSide: Side | null;
  isIndividual?: boolean;
  athlete?: Athlete | null;
  totalDuration?: number;
  onPause?: () => void;
  equipment?: Map<EquipmentSlot, EquipmentState>;
}

export function GameScreen({ 
  scores, 
  timeLeft, 
  isPaused, 
  flashSide, 
  isIndividual, 
  athlete,
  totalDuration = 60,
  onPause,
  equipment
}: GameScreenProps) {
  const [showPauseHint, setShowPauseHint] = useState(true);
  
  // Calculate percentages - start at 0% instead of 50% to avoid initial jump
  const total = scores.red + scores.blue;
  const redPercentage = total > 0 ? (scores.red / total) * 100 : 0;
  const bluePercentage = total > 0 ? (scores.blue / total) * 100 : 0;
  const totalKicks = scores.red + scores.blue;

  // CPM (Chutes por Minuto) em tempo real
  const elapsedSeconds = totalDuration - timeLeft;
  const cpm = elapsedSeconds > 0 ? Math.round((totalKicks / elapsedSeconds) * 60) : 0;

  // Recorde Pessoal (PB) do dia
  const [dayPB, setDayPB] = useState<number | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kickcounter_dayRecord');
      if (stored) {
        const record = JSON.parse(stored);
        const today = new Date().toISOString().split('T')[0];
        if (record.date === today) setDayPB(record.bestTotal);
      }
    } catch (e) {
      console.error("Erro ao ler PB", e);
    }
  }, []);

  // Progress for circular timer
  const progress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 100;
  // Time color based on remaining time
  const timeColor = timeLeft <= 5 ? 'text-game-red' : timeLeft <= 10 ? 'text-game-yellow' : 'text-foreground';
  const timerPulse = timeLeft <= 5 && !isPaused;

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs.toString();
  };

  // Hide pause hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPauseHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Handle tap to pause
  const handleTapPause = useCallback(() => {
    onPause?.();
  }, [onPause]);

  return (
    <div 
      className="flex flex-col h-full w-full bg-black overflow-hidden relative select-none"
      onClick={handleTapPause}
    >
      {/* Low Battery Alert - Top Right */}
      {equipment && <LowBatteryAlert equipment={equipment} />}
      
      {/* Minimalist Timer - Top Center (DUO ONLY) */}
      {!isIndividual && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <div className={cn(
            'relative flex items-center justify-center',
            timerPulse && 'animate-pulse'
          )}>
            <svg className="-rotate-90" style={{ width: 'clamp(7rem, 25vh, 18rem)', height: 'clamp(7rem, 25vh, 18rem)' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke={timeLeft <= 5 ? 'hsl(var(--game-red))' : timeLeft <= 10 ? 'hsl(var(--game-yellow))' : 'hsl(var(--game-yellow))'}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${progress * 2.83} 283`}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('font-bold font-mono tabular-nums', timeColor)} style={{ fontSize: 'clamp(3rem, 15vh, 8rem)' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pause Hint - Fades out */}
      {showPauseHint && !isPaused && (
        <div className="absolute top-44 md:top-48 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
          <span className="text-sm text-muted-foreground bg-black/50 px-4 py-2 rounded-full">
            Toque na tela para pausar
          </span>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center"
          onClick={handleTapPause}
        >
          <div className="text-center">
            <h2 className="font-bold text-game-yellow mb-4 animate-pulse" style={{ fontSize: 'clamp(3rem, 12vh, 6rem)' }}>
              PAUSADO
            </h2>
            <p className="text-xl text-muted-foreground">
              Toque para continuar
            </p>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex flex-1 relative pt-[3vh]">
        {isIndividual ? (
          /* Individual Mode - Single Centered Panel */
          /* Individual Mode - Elite HUD */
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] relative gap-[2vh]">
            {/* Flash effect */}
            {flashSide && (
              <div className="absolute inset-0 bg-[#FFD700]/20 pointer-events-none animate-pulse" />
            )}

            {/* 1. Timer Circular Central Gigante */}
            <div className="relative flex items-center justify-center">
              <svg className="-rotate-90" style={{ width: 'clamp(7rem, 25vh, 18rem)', height: 'clamp(7rem, 25vh, 18rem)' }} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none"
                  stroke={timeLeft <= 10 ? '#EF4444' : '#FFD700'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (timeLeft / totalDuration))}
                  className={cn('transition-all duration-1000', timeLeft <= 10 && 'animate-pulse')}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold font-mono tabular-nums text-white" style={{ fontSize: 'clamp(3rem, 15vh, 8rem)' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* 2. Contador de Chutes & CPM */}
            <div className="text-center flex flex-col items-center">
              <span className={cn(
                'font-bold text-[#FFD700] leading-none drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-transform duration-100',
                flashSide ? 'scale-110' : 'scale-100'
              )} style={{ fontSize: 'clamp(4rem, 20vh, 12rem)' }}>
                {totalKicks}
              </span>
              <span className="font-bold text-[#FFD700]/60 uppercase tracking-[0.5em]" style={{ fontSize: 'clamp(1.2rem, 3vh, 2.5rem)' }}>
                HITS
              </span>

              {/* Badge CPM */}
              {totalKicks > 0 && (
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1 mt-2 animate-in fade-in slide-in-from-bottom-2">
                  <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold text-sm tracking-wider">{cpm} CPM</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Duo Mode - Two Panels Side by Side */
          <>
            {/* Left Panel - Red */}
            <div className="flex-1 relative">
              <KickPanel
                side="red"
                score={scores.red}
                isFlashing={flashSide === 'red'}
                percentage={redPercentage}
              />
              {/* Mascote vermelho */}
              <div className="absolute bottom-24 left-4 z-10 pointer-events-none">
                <FighterMascot 
                  side="red" 
                  state={flashSide === 'red' ? 'attacking' : 'idle'} 
                  size="md"
                />
              </div>
            </div>

            {/* Right Panel - Blue */}
            <div className="flex-1 relative">
              <KickPanel
                side="blue"
                score={scores.blue}
                isFlashing={flashSide === 'blue'}
                percentage={bluePercentage}
              />
              {/* Mascote azul */}
              <div className="absolute bottom-24 right-4 z-10 pointer-events-none">
                <FighterMascot 
                  side="blue" 
                  state={flashSide === 'blue' ? 'attacking' : 'idle'} 
                  size="md"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {isIndividual ? (
        <div className="bg-black/80 backdrop-blur-md border-t border-white/10 py-4 z-50">
          <div className="grid grid-cols-3 gap-4 text-center max-w-md mx-auto px-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Melhor (Dia)</span>
              <span className={cn('text-xl font-bold', dayPB ? 'text-[#39FF14]' : 'text-white')}>
                {dayPB ? dayPB : '--'}
              </span>
            </div>
            <div className="flex flex-col border-x border-white/10">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Ritmo Atual</span>
              <span className="text-xl font-bold text-white flex justify-center items-center gap-1">
                {cpm} <span className="text-xs text-white/50 font-normal">CPM</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Atleta</span>
              <span className="text-xl font-bold text-white truncate px-2">
                {athlete?.name || 'Visitante'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-20 md:h-24 bg-black flex items-center border-t border-white/10">
          <div className="flex-1 flex items-center justify-center">
            <span className="font-bold text-[#E10000] uppercase tracking-[0.2em]" style={{ fontSize: 'clamp(1.5rem, 4vh, 3rem)' }}>
              Vermelho
            </span>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div className="flex-1 flex items-center justify-center">
            <span className="font-bold text-[#0066FF] uppercase tracking-[0.2em]" style={{ fontSize: 'clamp(1.5rem, 4vh, 3rem)' }}>
              Azul
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
