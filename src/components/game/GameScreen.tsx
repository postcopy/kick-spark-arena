import { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, User, Pause } from 'lucide-react';
import { KickPanel } from './KickPanel';
import { FighterMascot, type MascotState } from './FighterMascot';
import { LowBatteryAlert } from './EquipmentStatus';
import type { GameScore, Side, Athlete } from '@/types/game';
import type { EquipmentSlot, EquipmentState } from '@/types/serial';
import { cn } from '@/lib/utils';
import bgMenuModos from '@/assets/menu-modos.jpg';

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

  // Duo individual metrics
  const redCpm = elapsedSeconds > 0 ? Math.round((scores.red / elapsedSeconds) * 60) : 0;
  const blueCpm = elapsedSeconds > 0 ? Math.round((scores.blue / elapsedSeconds) * 60) : 0;
  const totalDuo = scores.red + scores.blue;
  const redPercent = totalDuo > 0 ? (scores.red / totalDuo) * 100 : 50;
  const scoreDiff = Math.abs(scores.red - scores.blue);

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
      
      {/* (Circular timer and pause hint removed — replaced by horizontal bar in duo) */}

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
            
            {/* Background image */}
            <img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.07] z-0 pointer-events-none" alt="" />
            
            {/* === ZONA SUPERIOR: Barra de Tempo === */}
            <div className="w-full px-6 pt-4 flex-shrink-0 relative z-[1]">
              {/* Progress Bar with track */}
              <div className="w-full h-3 bg-white/[0.08] rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    progress > 60 ? "bg-[#4ade80]" : progress > 30 ? "bg-[#facc15]" : "bg-[#ef4444] animate-pulse"
                  )}
                  style={{ 
                    width: `${progress}%`,
                    boxShadow: progress > 60 
                      ? '0 0 20px rgba(74,222,128,0.4)' 
                      : progress > 30 
                        ? '0 0 20px rgba(250,204,21,0.4)' 
                        : '0 0 20px rgba(239,68,68,0.4)'
                  }}
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
            <div className="grid grid-cols-12 gap-6 flex-1 items-center px-8 relative z-[1]">
              
              {/* Coluna Esquerda: Estatísticas */}
              <div className="col-span-3 flex flex-col gap-6">
                <div className="border border-white/10 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[#22d3ee]" />
                    <span className="text-sm text-white/40 uppercase tracking-widest font-mono">Melhor Sessão</span>
                  </div>
                  <span className="text-5xl font-bold text-white tabular-nums">
                    {dayPB ?? '--'}
                  </span>
                </div>
                <div className="border border-white/10 p-6">
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
                <span 
                  key={totalKicks}
                  className={cn(
                    'font-black italic text-[#FFD700] leading-none',
                    flashSide ? 'animate-[hit-pulse_150ms_ease-out]' : ''
                  )} 
                  style={{ 
                    fontSize: 'clamp(11.5rem, 17.25vw, 23rem)',
                    filter: 'drop-shadow(0 0 40px rgba(255,215,0,0.5))'
                  }}
                >
                  {totalKicks}
                </span>
                <span className="text-2xl text-white/40 uppercase tracking-[0.5em] mt-2">
                  HITS
                </span>
              </div>

              {/* Coluna Direita: Gauge CPM */}
              <div className="col-span-3 flex flex-col items-center justify-center">
                <div className="relative" style={{ width: 'clamp(7rem, 12vw, 12rem)', height: 'clamp(7rem, 12vw, 12rem)' }}>
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
          /* Duo Mode - Arena Battle HUD */
          <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[#0b1120]">
            
            {/* Background image */}
            <img src={bgMenuModos} className="absolute inset-0 w-full h-full object-cover opacity-[0.05] z-0 pointer-events-none" alt="" />

            {/* === HEADER: Barra de Tempo === */}
            <div className="w-full px-6 pt-4 flex-shrink-0 relative z-[1]">
              <div className="w-full h-3 bg-white/[0.08] rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    progress > 60 ? "bg-[#4ade80]" : progress > 30 ? "bg-[#facc15]" : "bg-[#ef4444] animate-pulse"
                  )}
                  style={{ 
                    width: `${progress}%`,
                    boxShadow: progress > 60 
                      ? '0 0 20px rgba(74,222,128,0.4)' 
                      : progress > 30 
                        ? '0 0 20px rgba(250,204,21,0.4)' 
                        : '0 0 20px rgba(239,68,68,0.4)'
                  }}
                />
              </div>
              <div className="text-center mt-2">
                <span className={cn(
                  "font-black font-mono tabular-nums text-white",
                  timerPulse && "animate-pulse"
                )} style={{ fontSize: 'clamp(2.5rem, 6vh, 5rem)' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* === ARENA GRID === */}
            <div className="grid grid-cols-12 gap-4 flex-1 items-center px-8 md:px-12 relative z-[1]">
              
              {/* Red Panel */}
              <div className={cn(
                "col-span-5 border-l-4 border-red-500 bg-gradient-to-r from-red-500/10 to-transparent px-6 md:px-10 py-0 rounded-r-xl transition-transform duration-100 flex flex-col justify-center items-center h-full",
                flashSide === 'red' && "scale-105 from-red-500/25 shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]"
              )}>
                <span className="text-red-500 font-black italic leading-none tracking-tighter tabular-nums" style={{ 
                  fontSize: 'clamp(8rem, 20vw, 22rem)',
                  filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.4))'
                }}>
                  {scores.red}
                </span>
                <div className="flex flex-col gap-1 items-center mt-2 relative z-20">
                  <span className="text-2xl text-white/40 uppercase tracking-widest font-mono">HITS</span>
                  <span className="text-xl text-white/60 font-mono tabular-nums">CPM: {redCpm}</span>
                </div>
              </div>

              {/* VS Center */}
              <div className="col-span-2 flex flex-col items-center justify-center gap-4">
                <span className="text-4xl font-black text-white/20 italic">VS</span>
                {/* Tug-of-war bar */}
                <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 left-0 rounded-l-full transition-all duration-300"
                    style={{ 
                      width: `${redPercent}%`,
                      background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                      boxShadow: scores.red >= scores.blue ? '0 0 12px rgba(239,68,68,0.5)' : 'none'
                    }} 
                  />
                  <div 
                    className="absolute inset-y-0 right-0 rounded-r-full transition-all duration-300"
                    style={{ 
                      width: `${100 - redPercent}%`,
                      background: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)',
                      boxShadow: scores.blue > scores.red ? '0 0 12px rgba(59,130,246,0.5)' : 'none'
                    }} 
                  />
                </div>
                {/* Score diff */}
                {scoreDiff > 0 && (
                  <span className={cn(
                    "text-4xl font-black tabular-nums",
                    scores.red > scores.blue ? "text-red-400" : "text-blue-400"
                  )} style={{ filter: `drop-shadow(0 0 10px ${scores.red > scores.blue ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'})` }}>
                    +{scoreDiff}
                  </span>
                )}
                <span className="text-base text-white/40 font-mono tabular-nums font-bold">
                  Total: {totalDuo}
                </span>
              </div>

              {/* Blue Panel */}
              <div className={cn(
                "col-span-5 border-r-4 border-blue-500 bg-gradient-to-l from-blue-500/10 to-transparent px-6 md:px-10 py-0 rounded-l-xl text-right transition-transform duration-100 flex flex-col justify-center items-center h-full",
                flashSide === 'blue' && "scale-105 from-blue-500/25 shadow-[inset_0_0_30px_rgba(59,130,246,0.3)]"
              )}>
                <span className="text-blue-500 font-black italic leading-none tracking-tighter tabular-nums" style={{ 
                  fontSize: 'clamp(8rem, 20vw, 22rem)',
                  filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.4))'
                }}>
                  {scores.blue}
                </span>
                <div className="flex flex-col gap-1 items-center mt-2 relative z-20">
                  <span className="text-2xl text-white/40 uppercase tracking-widest font-mono">HITS</span>
                  <span className="text-xl text-white/60 font-mono tabular-nums">CPM: {blueCpm}</span>
                </div>
              </div>
            </div>

            {/* === FOOTER TÉCNICO === */}
            <div className="w-full bg-black/60 backdrop-blur border-t border-white/10 flex items-center justify-between px-10 py-3 relative z-[1]">
              <span className="text-sm font-bold text-red-500 uppercase tracking-[0.2em]">Vermelho</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                  <span className="text-xs text-white/40 font-mono">Conectado</span>
                </div>
                <span className="text-xs text-white/30 font-mono">[P] Pausar  [ESC] Sair</span>
              </div>
              <span className="text-sm font-bold text-blue-500 uppercase tracking-[0.2em]">Azul</span>
            </div>

            {/* Flash de Impacto Global */}
            {flashSide && (
              <div 
                className="absolute inset-0 pointer-events-none z-[2] animate-pulse"
                style={{ boxShadow: 'inset 0 0 100px rgba(255,255,255,0.15)' }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
