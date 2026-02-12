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
      <div className="flex-1 flex pt-[2vh] items-center justify-center">
        {isIndividual ? (
          /* Individual Mode - Elite HUD Maximalista */
          <div className="flex-1 flex flex-col items-center justify-center h-full relative gap-[1vh] -mt-8">
            {/* Flash effect */}
            {flashSide && (
              <div className="absolute inset-0 bg-[#FFD700]/20 pointer-events-none animate-pulse" />
            )}

            {/* 1. Timer Circular Central GIGANTE (42vh) */}
            <div className="relative flex items-center justify-center">
              <svg className="-rotate-90" style={{ width: 'clamp(12rem, 42vh, 40rem)', height: 'clamp(12rem, 42vh, 40rem)' }} viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none"
                  stroke={timeLeft <= 10 ? '#EF4444' : '#FFD700'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (timeLeft / totalDuration))}
                  className={cn('transition-all duration-1000', timeLeft <= 10 && 'animate-pulse')}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-black font-mono tabular-nums text-white" style={{ fontSize: 'clamp(4rem, 18vh, 14rem)' }}>
                  {timeLeft}
                </span>
              </div>
            </div>

            {/* 2. Contador de Chutes MASSIVO (28vh) */}
            <div className="text-center flex flex-col items-center justify-center -mt-4">
              <span className={cn(
                'font-bold text-[#FFD700] leading-none drop-shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-transform duration-100',
                flashSide ? 'scale-105' : 'scale-100'
              )} style={{ fontSize: 'clamp(6rem, 28vh, 20rem)' }}>
                {totalKicks}
              </span>
              <span className="font-bold text-[#FFD700]/60 uppercase tracking-[0.5em] mt-2" style={{ fontSize: 'clamp(1.5rem, 4vh, 4rem)' }}>
                HITS
              </span>

              {/* Badge CPM Expandido */}
              {totalKicks > 0 && (
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-full px-6 py-2 mt-4 animate-in fade-in slide-in-from-bottom-2">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold tracking-wider" style={{ fontSize: 'clamp(1rem, 2.5vh, 2rem)' }}>{cpm} CPM</span>
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
        <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 py-6 z-50">
          <div className="grid grid-cols-3 gap-4 text-center max-w-4xl mx-auto px-4">
            <div className="flex flex-col">
              <span className="text-white/50 uppercase tracking-widest font-semibold" style={{ fontSize: 'clamp(0.7rem, 1.5vh, 1.2rem)' }}>Melhor (Dia)</span>
              <span className={cn('font-black', dayPB ? 'text-[#39FF14]' : 'text-white')} style={{ fontSize: 'clamp(1.5rem, 3.5vh, 3rem)' }}>
                {dayPB ? dayPB : '--'}
              </span>
            </div>
            <div className="flex flex-col border-x border-white/10">
              <span className="text-white/50 uppercase tracking-widest font-semibold" style={{ fontSize: 'clamp(0.7rem, 1.5vh, 1.2rem)' }}>Ritmo</span>
              <span className="font-black text-white flex justify-center items-center gap-1" style={{ fontSize: 'clamp(1.5rem, 3.5vh, 3rem)' }}>
                {cpm} <span className="text-sm text-white/50 font-normal">CPM</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/50 uppercase tracking-widest font-semibold" style={{ fontSize: 'clamp(0.7rem, 1.5vh, 1.2rem)' }}>Atleta</span>
              <span className="font-black text-white truncate px-2" style={{ fontSize: 'clamp(1.5rem, 3.5vh, 3rem)' }}>
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
