import { useState, useEffect, useCallback } from 'react';
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
      
      {/* Minimalist Timer - Top Center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <div className={cn(
          'relative flex items-center justify-center',
          timerPulse && 'animate-pulse'
        )}>
          {/* Circular Progress Background */}
          <svg className="-rotate-90" style={{ width: 'clamp(7rem, 25vh, 18rem)', height: 'clamp(7rem, 25vh, 18rem)' }} viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={timeLeft <= 5 ? 'hsl(var(--game-red))' : timeLeft <= 10 ? 'hsl(var(--game-yellow))' : 'hsl(var(--game-yellow))'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-300"
            />
          </svg>
          
          {/* Time Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'font-bold font-mono tabular-nums',
              timeColor
            )} style={{ fontSize: 'clamp(3rem, 15vh, 8rem)' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

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
            <h2 className="text-6xl md:text-8xl font-bold text-game-yellow mb-4 animate-pulse">
              PAUSADO
            </h2>
            <p className="text-xl text-muted-foreground">
              Toque para continuar
            </p>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex flex-1 relative pt-28 md:pt-32">
        {isIndividual ? (
          /* Individual Mode - Single Centered Panel */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] relative">
            {/* Flash effect when kick registers */}
            {flashSide && (
              <div className="absolute inset-0 bg-[#FFD700]/20 pointer-events-none animate-pulse" />
            )}
            
            <div className="text-center">
              {/* Giant golden score */}
              <div className={cn(
                'text-[10rem] md:text-[14rem] font-bold text-[#FFD700] leading-none',
                'drop-shadow-[0_0_60px_rgba(255,215,0,0.4)]',
                'transition-transform duration-100',
                flashSide ? 'scale-110' : 'scale-100'
              )}>
                {totalKicks}
              </div>
              <div className="text-3xl md:text-4xl text-[#FFD700]/60 uppercase tracking-[0.5em] mt-4">
                chutes
              </div>
            </div>

            {/* Mascote centralizado no modo individual */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <FighterMascot 
                side="red"
                state={flashSide ? 'attacking' : 'idle'} 
                size="lg"
              />
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

      {/* Footer - Team Names */}
      <div className="h-20 md:h-24 bg-black flex items-center border-t border-white/10">
        {isIndividual && athlete ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-3xl md:text-5xl font-bold text-[#FFD700] uppercase tracking-[0.3em]">
              {athlete.name}
            </span>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-3xl md:text-5xl font-bold text-[#E10000] uppercase tracking-[0.2em]">
                Vermelho
              </span>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex-1 flex items-center justify-center">
              <span className="text-3xl md:text-5xl font-bold text-[#0066FF] uppercase tracking-[0.2em]">
                Azul
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
