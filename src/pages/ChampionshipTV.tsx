import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatTime, getStorageKey } from '@/types/championship';
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
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
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
  
  // Generate round win indicators
  const renderRoundIndicators = (wins: number, side: 'red' | 'blue') => {
    const maxRounds = state.config.maxRounds === 1 ? 1 : 2;
    const indicators = [];
    for (let i = 0; i < maxRounds; i++) {
      indicators.push(
        <div
          key={i}
          className={cn(
            "w-6 h-6 rounded-full border-2",
            i < wins 
              ? side === 'red' ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500'
              : 'bg-transparent border-zinc-600'
          )}
        />
      );
    }
    return indicators;
  };
  
  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="h-12 bg-zinc-900/80 flex items-center justify-between px-6 text-sm text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="font-bold text-purple-500">CAMPEONATO</span>
          <span>•</span>
          <span>MAT {matId}</span>
          <span>•</span>
          <span>ROUND {state.round}/{state.config.maxRounds}</span>
        </div>
        <div className="flex items-center gap-2">
          {isMedical && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded font-medium">
              TEMPO MÉDICO
            </span>
          )}
          {isRunning && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded font-medium animate-pulse">
              AO VIVO
            </span>
          )}
          {isRoundEnd && !isMatchEnd && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded font-medium">
              FIM DO ROUND
            </span>
          )}
          {isMatchEnd && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-500 rounded font-medium">
              FIM DA LUTA
            </span>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-[1800px] flex items-center justify-between gap-8">
          {/* Blue Side */}
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center p-8 rounded-3xl transition-all duration-200",
            pulseBlue && "scale-[1.02]",
            "bg-gradient-to-br from-blue-600/30 to-blue-600/10 border-4 border-blue-500/50"
          )}>
            {/* Athlete Name */}
            <div className="text-2xl font-bold text-blue-400 mb-2 h-8">
              {state.config.athleteBlue?.name || 'CHUNG'}
            </div>
            {state.config.athleteBlue?.country && (
              <div className="text-lg text-blue-400/70 mb-4">
                {state.config.athleteBlue.country}
              </div>
            )}
            
            {/* Score */}
            <div className={cn(
              "font-black text-blue-400 leading-none transition-transform duration-200",
              pulseBlue && "scale-110"
            )} style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}>
              {state.roundScoreBlue}
            </div>
            
            {/* Gamjeom & Rounds */}
            <div className="flex items-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-sm text-zinc-500 mb-1">GJ</div>
                <div className="text-3xl font-bold text-blue-400">
                  {state.gamjeomBlue}
                </div>
              </div>
              <div className="flex gap-2">
                {renderRoundIndicators(state.roundWinsBlue, 'blue')}
              </div>
            </div>
          </div>
          
          {/* Timer Center */}
          <div className="flex flex-col items-center justify-center min-w-[300px]">
            <div 
              className={cn(
                "font-black leading-none tabular-nums",
                isMedical ? "text-yellow-500" : "text-white",
                state.timeLeftMs <= 10000 && isRunning && "text-red-500 animate-pulse"
              )}
              style={{ fontSize: 'clamp(100px, 18vw, 240px)' }}
            >
              {formatTime(state.timeLeftMs)}
            </div>
            
            {/* Match winner indicator */}
            {isMatchEnd && (
              <div className="mt-8 text-center">
                <div className="text-2xl font-bold text-zinc-400 mb-2">VENCEDOR</div>
                <div className={cn(
                  "text-4xl font-black",
                  state.roundWinsRed > state.roundWinsBlue ? "text-red-500" : "text-blue-500"
                )}>
                  {state.roundWinsRed > state.roundWinsBlue 
                    ? (state.config.athleteRed?.name || 'HONG')
                    : (state.config.athleteBlue?.name || 'CHUNG')
                  }
                </div>
              </div>
            )}
          </div>
          
          {/* Red Side */}
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center p-8 rounded-3xl transition-all duration-200",
            pulseRed && "scale-[1.02]",
            "bg-gradient-to-br from-red-600/30 to-red-600/10 border-4 border-red-500/50"
          )}>
            {/* Athlete Name */}
            <div className="text-2xl font-bold text-red-400 mb-2 h-8">
              {state.config.athleteRed?.name || 'HONG'}
            </div>
            {state.config.athleteRed?.country && (
              <div className="text-lg text-red-400/70 mb-4">
                {state.config.athleteRed.country}
              </div>
            )}
            
            {/* Score */}
            <div className={cn(
              "font-black text-red-400 leading-none transition-transform duration-200",
              pulseRed && "scale-110"
            )} style={{ fontSize: 'clamp(120px, 20vw, 260px)' }}>
              {state.roundScoreRed}
            </div>
            
            {/* Gamjeom & Rounds */}
            <div className="flex items-center gap-8 mt-6">
              <div className="flex gap-2">
                {renderRoundIndicators(state.roundWinsRed, 'red')}
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500 mb-1">GJ</div>
                <div className="text-3xl font-bold text-red-400">
                  {state.gamjeomRed}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar - Round End Decision */}
      {isRoundEnd && !isMatchEnd && state.roundScoreRed === state.roundScoreBlue && (
        <div className="h-16 bg-yellow-500/10 flex items-center justify-center">
          <span className="text-xl font-bold text-yellow-500">
            EMPATE — AGUARDANDO DECISÃO DO ÁRBITRO
          </span>
        </div>
      )}
    </div>
  );
}
