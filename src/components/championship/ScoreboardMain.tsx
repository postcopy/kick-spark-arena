import { MatchState, formatTime } from '@/types/championship';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface ScoreboardMainProps {
  state: MatchState;
  onResetMatch?: () => void;
}

export function ScoreboardMain({ state, onResetMatch }: ScoreboardMainProps) {
  const isRunning = state.status === 'RUNNING';
  const isMedical = state.isMedicalTime;
  const isMatchEnd = state.status === 'MATCH_END';
  
  // Determine winner
  const winnerSide = state.roundWinsRed > state.roundWinsBlue ? 'RED' : 'BLUE';
  const winnerName = winnerSide === 'RED' 
    ? (state.config.athleteRed?.name || 'HONG')
    : (state.config.athleteBlue?.name || 'CHUNG');
  
  // Generate round win indicators (●●○)
  const renderRoundIndicators = (wins: number, maxRounds: number) => {
    const neededToWin = maxRounds === 1 ? 1 : 2;
    const indicators = [];
    for (let i = 0; i < neededToWin; i++) {
      indicators.push(
        <span key={i} className="text-lg">
          {i < wins ? '●' : '○'}
        </span>
      );
    }
    return indicators;
  };
  
  return (
    <div className="h-full flex items-stretch p-4 gap-2 relative">
      {/* MATCH END Overlay */}
      {isMatchEnd && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-10">
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-black text-purple-400 uppercase tracking-wider">
              LUTA ENCERRADA
            </h2>
            <div className={cn(
              "text-3xl font-bold uppercase",
              winnerSide === 'RED' 
                ? "text-[hsl(var(--sulsport-red-light))]" 
                : "text-[hsl(var(--sulsport-blue-light))]"
            )}>
              {winnerName} VENCEU
            </div>
            <div className="text-zinc-400 text-lg">
              {state.roundWinsBlue} x {state.roundWinsRed} rounds
            </div>
            {onResetMatch && (
              <Button
                onClick={onResetMatch}
                className="h-14 px-8 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-lg font-bold uppercase"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                INICIAR NOVA LUTA
              </Button>
            )}
          </div>
        </div>
      )}
      {/* BLUE Side - Left Column */}
      <div className="flex-1 flex flex-col bg-[hsl(var(--sulsport-blue))] rounded-lg overflow-hidden">
        {/* Athlete Name */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <div className="text-center">
            <div className="text-xl font-bold text-white uppercase tracking-wider">
              {state.config.athleteBlue?.name || 'CHUNG'}
            </div>
            {state.config.athleteBlue?.country && (
              <div className="text-sm text-white/70">
                ({state.config.athleteBlue.country})
              </div>
            )}
          </div>
        </div>
        
        {/* Score */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[clamp(80px,12vw,140px)] font-black text-white leading-none tabular-nums">
            {state.roundScoreBlue}
          </div>
        </div>
        
        {/* Footer: GAM-JEOM / ROUNDS / HITS */}
        <div className="h-24 bg-[hsl(var(--sulsport-blue-dark))] grid grid-cols-3 divide-x divide-white/10">
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-white/60 uppercase font-bold">GAM-JEOM</div>
            <div className="text-2xl font-black text-white">{state.gamjeomBlue}</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-white/60 uppercase font-bold">ROUNDS</div>
            <div className="flex gap-1 text-white">
              {renderRoundIndicators(state.roundWinsBlue, state.config.maxRounds)}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-white/60 uppercase font-bold">HITS</div>
            <div className="text-2xl font-black text-white">0</div>
          </div>
        </div>
      </div>
      
      {/* CENTER Column - Timer & Round */}
      <div className="w-48 flex flex-col bg-[hsl(var(--sulsport-black))] rounded-lg overflow-hidden">
        {/* MATCH header + number */}
        <div className="flex-1 flex flex-col items-center justify-center border-b border-white/10">
          <span className="text-lg font-bold text-white uppercase tracking-[0.2em]">MATCH</span>
          <span className="text-2xl font-bold text-white tabular-nums">
            {state.config.matchNumber || '001'}
          </span>
        </div>
        
        {/* Timer - Yellow BAND (thin, fixed height h-20) */}
        <div className={cn(
          "h-20 flex items-center justify-center",
          isMedical 
            ? "bg-[hsl(var(--sulsport-yellow-dark))]" 
            : "bg-[hsl(var(--sulsport-yellow))]"
        )}>
          <div 
            className={cn(
              "text-[clamp(36px,6vw,56px)] font-black leading-none tabular-nums text-black",
              state.timeLeftMs <= 10000 && isRunning && "animate-pulse"
            )}
          >
            {formatTime(state.timeLeftMs)}
          </div>
        </div>
        
        {/* Status (PAUSADO / T. MÉDICO) - abaixo da faixa amarela */}
        {!isRunning && !isMatchEnd && (
          <div className="h-10 flex items-center justify-center bg-[hsl(var(--sulsport-yellow))]/10">
            <span className="text-sm font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider">
              {isMedical ? 'T. MÉDICO' : 'PAUSADO'}
            </span>
          </div>
        )}
        
        {/* ROUND info */}
        <div className="flex-1 flex flex-col items-center justify-center border-t border-white/10">
          <span className="text-xs text-white/60 uppercase font-bold tracking-wider">ROUND</span>
          <span className="text-4xl font-black text-white">{state.round}</span>
        </div>
        
        {/* Match winner - só quando MATCH_END, integrado no centro */}
        {isMatchEnd && (
          <div className="h-16 flex flex-col items-center justify-center bg-white/5 border-t border-white/10">
            <div className="text-xs text-white/60 uppercase tracking-wider">VENCEDOR</div>
            <div className={cn(
              "text-sm font-black uppercase",
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
        )}
      </div>
      
      {/* RED Side - Right Column */}
      <div className="flex-1 flex flex-col bg-[hsl(var(--sulsport-red))] rounded-lg overflow-hidden">
        {/* Athlete Name */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <div className="text-center">
            <div className="text-xl font-bold text-white uppercase tracking-wider">
              {state.config.athleteRed?.name || 'HONG'}
            </div>
            {state.config.athleteRed?.country && (
              <div className="text-sm text-white/70">
                ({state.config.athleteRed.country})
              </div>
            )}
          </div>
        </div>
        
        {/* Score */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[clamp(80px,12vw,140px)] font-black text-white leading-none tabular-nums">
            {state.roundScoreRed}
          </div>
        </div>
        
        {/* Footer: GAM-JEOM / ROUNDS / HITS */}
        <div className="h-24 bg-[hsl(var(--sulsport-red-dark))] grid grid-cols-3 divide-x divide-white/10">
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-white/60 uppercase font-bold">GAM-JEOM</div>
            <div className="text-2xl font-black text-white">{state.gamjeomRed}</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-white/60 uppercase font-bold">ROUNDS</div>
            <div className="flex gap-1 text-white">
              {renderRoundIndicators(state.roundWinsRed, state.config.maxRounds)}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-white/60 uppercase font-bold">HITS</div>
            <div className="text-2xl font-black text-white">0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
