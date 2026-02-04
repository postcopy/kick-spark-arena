import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatTime } from '@/types/championship';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { cn } from '@/lib/utils';

export default function ChampionshipTV() {
  const [searchParams] = useSearchParams();
  const matId = parseInt(searchParams.get('mat') || '1');
  
  const { state, isConnected } = useChampionshipSync({
    role: 'listener',
    matId,
  });
  
  const [pulseRed, setPulseRed] = useState(false);
  const [pulseBlue, setPulseBlue] = useState(false);
  
  // Track score changes for pulse animation
  useEffect(() => {
    setPulseRed(true);
    const timer = setTimeout(() => setPulseRed(false), 300);
    return () => clearTimeout(timer);
  }, [state.roundScoreRed]);
  
  useEffect(() => {
    setPulseBlue(true);
    const timer = setTimeout(() => setPulseBlue(false), 300);
    return () => clearTimeout(timer);
  }, [state.roundScoreBlue]);
  
  // No signal state
  if (!isConnected) {
    return (
      <div className="h-screen w-screen bg-[hsl(var(--sulsport-black))] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-zinc-600 mb-4">SEM SINAL</div>
          <div className="text-xl text-zinc-700">
            Aguardando conexão com Mesa de Luta (MAT {matId})
          </div>
        </div>
      </div>
    );
  }
  
  const isRunning = state.status === 'RUNNING';
  const isMedical = state.isMedicalTime;
  const isMatchEnd = state.status === 'MATCH_END';
  const isRoundEnd = state.status === 'ROUND_END';
  
  // Generate round win indicators (●●○)
  const renderRoundIndicators = (wins: number, maxRounds: number) => {
    const neededToWin = maxRounds === 1 ? 1 : 2;
    const indicators = [];
    for (let i = 0; i < neededToWin; i++) {
      indicators.push(
        <span key={i} className="text-3xl">
          {i < wins ? '●' : '○'}
        </span>
      );
    }
    return indicators;
  };
  
  return (
    <div className="h-screen w-screen bg-[hsl(var(--sulsport-black))] flex flex-col overflow-hidden select-none">
      {/* Main 3-Column Layout */}
      <div className="flex-1 flex items-stretch p-6 gap-4">
        {/* BLUE Side - Left Column */}
        <div className={cn(
          "flex-1 flex flex-col bg-[hsl(var(--sulsport-blue))] rounded-2xl overflow-hidden transition-transform duration-200",
          pulseBlue && "scale-[1.01]"
        )}>
          {/* Athlete Name */}
          <div className="h-24 flex items-center justify-center border-b border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white uppercase tracking-wider">
                {state.config.athleteBlue?.name || 'CHUNG'}
              </div>
              {state.config.athleteBlue?.country && (
                <div className="text-xl text-white/70">
                  ({state.config.athleteBlue.country})
                </div>
              )}
            </div>
          </div>
          
          {/* Score */}
          <div className="flex-1 flex items-center justify-center">
            <div 
              className={cn(
                "font-black text-white leading-none tabular-nums transition-transform duration-200",
                pulseBlue && "scale-105"
              )}
              style={{ fontSize: 'clamp(140px, 20vw, 280px)' }}
            >
              {state.roundScoreBlue}
            </div>
          </div>
          
          {/* Footer: GAM-JEOM / ROUNDS / HITS */}
          <div className="h-32 bg-[hsl(var(--sulsport-blue-dark))] grid grid-cols-3 divide-x divide-white/10">
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">GAM-JEOM</div>
              <div className="text-4xl font-black text-white">{state.gamjeomBlue}</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">ROUNDS</div>
              <div className="flex gap-2 text-white">
                {renderRoundIndicators(state.roundWinsBlue, state.config.maxRounds)}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">HITS</div>
              <div className="text-4xl font-black text-white">0</div>
            </div>
          </div>
        </div>
        
        {/* CENTER Column - Timer & Round */}
        <div className="w-72 flex flex-col bg-[hsl(var(--sulsport-dark))] rounded-2xl overflow-hidden border border-[hsl(var(--sulsport-gray))]">
          {/* MATCH header + number */}
          <div className="flex-1 flex flex-col items-center justify-center border-b border-[hsl(var(--sulsport-gray))]">
            <span className="text-2xl font-bold text-white uppercase tracking-[0.3em]">MATCH</span>
            <span className="text-4xl font-bold text-white tabular-nums">
              {state.config.matchNumber || '001'}
            </span>
          </div>
          
          {/* Timer - Yellow BAND (thin, fixed height h-24) */}
          <div className={cn(
            "h-24 flex items-center justify-center",
            isMedical 
              ? "bg-[hsl(var(--sulsport-yellow-dark))]" 
              : "bg-[hsl(var(--sulsport-yellow))]"
          )}>
            <div 
              className={cn(
                "font-black leading-none tabular-nums text-black",
                state.timeLeftMs <= 10000 && isRunning && "animate-pulse"
              )}
              style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
            >
              {formatTime(state.timeLeftMs)}
            </div>
          </div>
          
          {/* Status (PAUSADO / T. MÉDICO) - texto simples, NÃO badge */}
          {!isRunning && !isMatchEnd && (
            <div className="h-12 flex items-center justify-center">
              <span className="text-xl font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider">
                {isMedical ? 'T. MÉDICO' : 'PAUSADO'}
              </span>
            </div>
          )}
          
          {/* ROUND info */}
          <div className="flex-1 flex flex-col items-center justify-center border-t border-[hsl(var(--sulsport-gray))]">
            <span className="text-lg text-white/60 uppercase font-bold tracking-wider">ROUND</span>
            <span className="text-7xl font-black text-white">{state.round}</span>
          </div>
        </div>
        
        {/* RED Side - Right Column */}
        <div className={cn(
          "flex-1 flex flex-col bg-[hsl(var(--sulsport-red))] rounded-2xl overflow-hidden transition-transform duration-200",
          pulseRed && "scale-[1.01]"
        )}>
          {/* Athlete Name */}
          <div className="h-24 flex items-center justify-center border-b border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white uppercase tracking-wider">
                {state.config.athleteRed?.name || 'HONG'}
              </div>
              {state.config.athleteRed?.country && (
                <div className="text-xl text-white/70">
                  ({state.config.athleteRed.country})
                </div>
              )}
            </div>
          </div>
          
          {/* Score */}
          <div className="flex-1 flex items-center justify-center">
            <div 
              className={cn(
                "font-black text-white leading-none tabular-nums transition-transform duration-200",
                pulseRed && "scale-105"
              )}
              style={{ fontSize: 'clamp(140px, 20vw, 280px)' }}
            >
              {state.roundScoreRed}
            </div>
          </div>
          
          {/* Footer: GAM-JEOM / ROUNDS / HITS */}
          <div className="h-32 bg-[hsl(var(--sulsport-red-dark))] grid grid-cols-3 divide-x divide-white/10">
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">GAM-JEOM</div>
              <div className="text-4xl font-black text-white">{state.gamjeomRed}</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">ROUNDS</div>
              <div className="flex gap-2 text-white">
                {renderRoundIndicators(state.roundWinsRed, state.config.maxRounds)}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">HITS</div>
              <div className="text-4xl font-black text-white">0</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* VENCEDOR - Overlay discreto SOMENTE quando MATCH_END */}
      {isMatchEnd && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-3xl text-white/60 uppercase tracking-[0.3em] mb-4">VENCEDOR</div>
            <div className={cn(
              "text-7xl font-black uppercase",
              state.roundWinsRed > state.roundWinsBlue 
                ? "text-[hsl(var(--sulsport-red-light))]" 
                : "text-[hsl(var(--sulsport-blue-light))]"
            )}>
              {state.roundWinsRed > state.roundWinsBlue 
                ? (state.config.athleteRed?.name || 'HONG')
                : (state.config.athleteBlue?.name || 'CHUNG')
              }
            </div>
          </div>
        </div>
      )}
      
      {isRoundEnd && !isMatchEnd && state.roundScoreRed === state.roundScoreBlue && (
        <div className="h-20 bg-[hsl(var(--sulsport-yellow))]/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider">
            EMPATE — AGUARDANDO DECISÃO DO ÁRBITRO
          </span>
        </div>
      )}
    </div>
  );
}
