import { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, User, Pause } from 'lucide-react';
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

  // Format time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Gauge SVG calculations (semicircle 180deg)
  const gaugeMax = 200;
  const gaugeRadius = 40;
  const gaugeCircumference = Math.PI * gaugeRadius; // ~126
  const gaugeProgress = Math.min(cpm, gaugeMax) / gaugeMax;
  const gaugeDashoffset = gaugeCircumference - (gaugeCircumference * gaugeProgress);

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
      className={cn(
        "flex flex-col h-full w-full overflow-hidden relative select-none",
        isIndividual ? "bg-[#0b1120]" : "bg-black"
      )}
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
      {showPauseHint && !isPaused && !isIndividual && (
        <div className="absolute top-44 md:top-48 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
          <span className="text-sm text-muted-foreground bg-black/50 px-4 py-2 rounded-full">
            Toque na tela para pausar
          </span>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div 
          className={cn(
            "absolute inset-0 backdrop-blur-sm z-30 flex items-center justify-center",
            isIndividual ? "bg-[#0b1120]/90" : "bg-black/80"
          )}
          onClick={handleTapPause}
        >
          <div className="text-center">
            {isIndividual ? (
              <>
                <h2 className="text-2xl font-medium text-[#22d3ee] mb-4">
                  Sessão Pausada
                </h2>
                <p className="text-sm text-slate-400 border border-white/10 rounded-lg px-6 py-2 cursor-pointer hover:bg-white/5 transition-colors">
                  Retomar Treino
                </p>
              </>
            ) : (
              <>
                <h2 className="font-bold text-game-yellow mb-4 animate-pulse" style={{ fontSize: 'clamp(3rem, 12vh, 6rem)' }}>
                  PAUSADO
                </h2>
                <p className="text-xl text-muted-foreground">
                  Toque para continuar
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center">
      {isIndividual ? (
          /* Individual Mode - Arena Monitor (Widescreen HUD) */
          <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
            
            {/* === ZONA SUPERIOR: Barra de Tempo === */}
            <div className="w-full px-6 pt-4 flex-shrink-0">
              {/* Progress Bar */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    progress > 60 ? "bg-[#4ade80]" : progress > 30 ? "bg-[#facc15]" : "bg-[#ef4444] animate-pulse"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Timer flutuante */}
              <div className="text-center mt-2">
                <span className={cn(
                  "font-black font-mono tabular-nums text-white",
                  timerPulse && "animate-pulse"
                )} style={{ fontSize: 'clamp(3rem, 8vh, 6rem)' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* === ZONA CENTRAL: Palco (Grid 12 colunas) === */}
            <div className="grid grid-cols-12 gap-6 flex-1 items-center px-8">
              
              {/* Coluna Esquerda: Estatísticas */}
              <div className="col-span-3 flex flex-col gap-6">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[#22d3ee]" />
                    <span className="text-sm text-white/40 uppercase tracking-widest font-mono">Melhor Sessão</span>
                  </div>
                  <span className="text-5xl font-bold text-white tabular-nums">
                    {dayPB ?? '--'}
                  </span>
                </div>
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[#facc15]" />
                    <span className="text-sm text-white/40 uppercase tracking-widest font-mono">Média</span>
                  </div>
                  <span className="text-5xl font-bold text-white tabular-nums">
                    {elapsedSeconds > 5 ? Math.round(totalKicks / (elapsedSeconds / 60)) : '--'}
                  </span>
                  <span className="text-lg text-white/30 ml-2">k/min</span>
                </div>
              </div>

              {/* Coluna Central: Hero Counter */}
              <div className="col-span-6 flex flex-col items-center justify-center">
                <span className={cn(
                  'font-black italic text-[#FFD700] leading-none transition-transform duration-100',
                  flashSide ? 'scale-110' : 'scale-100'
                )} style={{ 
                  fontSize: 'clamp(10rem, 15vw, 20rem)',
                  filter: 'drop-shadow(0 0 40px rgba(255,215,0,0.5))'
                }}>
                  {totalKicks}
                </span>
                <span className="text-2xl text-white/40 uppercase tracking-[0.5em] mt-2">
                  HITS
                </span>
              </div>

              {/* Coluna Direita: Gauge CPM */}
              <div className="col-span-3 flex flex-col items-center justify-center">
                <div className="relative" style={{ width: 'clamp(10rem, 15vw, 16rem)', height: 'clamp(10rem, 15vw, 16rem)' }}>
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    {/* Background arc */}
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" 
                      strokeDasharray={`${Math.PI * 50 * 0.75} ${Math.PI * 50 * 0.25}`}
                      strokeDashoffset={Math.PI * 50 * 0.375}
                      strokeLinecap="round"
                    />
                    {/* Progress arc */}
                    <circle cx="60" cy="60" r="50" fill="none" 
                      stroke={cpm > 150 ? "#4ade80" : "#22d3ee"}
                      strokeWidth="10" 
                      strokeLinecap="round"
                      strokeDasharray={`${Math.PI * 50 * 0.75} ${Math.PI * 50 * 0.25}`}
                      strokeDashoffset={Math.PI * 50 * 0.375 + (Math.PI * 50 * 0.75) * (1 - Math.min(cpm, gaugeMax) / gaugeMax)}
                      style={{ transition: 'stroke-dashoffset 300ms ease-out' }}
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white tabular-nums">{cpm}</span>
                    <span className="text-sm text-white/40 uppercase tracking-widest font-mono">CPM</span>
                  </div>
                </div>
                {/* Scale labels */}
                <div className="flex justify-between w-full px-4 mt-1">
                  <span className="text-xs text-white/30 font-mono">0</span>
                  <span className="text-xs text-white/30 font-mono">200</span>
                </div>
              </div>
            </div>

            {/* === ZONA INFERIOR: Barra Técnica === */}
            <div className="absolute bottom-0 w-full bg-black/40 backdrop-blur border-t border-white/10 flex items-center justify-between px-10 py-3 z-10">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/60 font-mono">{athlete?.name || 'Visitante'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                <span className="text-xs text-white/40 font-mono">Conectado</span>
              </div>
              <span className="text-xs text-white/30 font-mono">[P] Pausar  [ESC] Sair</span>
            </div>

            {/* Flash de Impacto */}
            {flashSide && (
              <div 
                className="absolute inset-0 pointer-events-none animate-pulse"
                style={{ boxShadow: 'inset 0 0 100px rgba(255,255,255,0.15)' }}
              />
            )}
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
      {/* Arena Monitor has its own footer built-in */}
      {!isIndividual && (
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
