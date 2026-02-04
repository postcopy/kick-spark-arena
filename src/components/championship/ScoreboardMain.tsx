import { MatchState, formatTime } from '@/types/championship';
import { cn } from '@/lib/utils';

interface ScoreboardMainProps {
  state: MatchState;
}

export function ScoreboardMain({ state }: ScoreboardMainProps) {
  const isRunning = state.status === 'RUNNING';
  const isMedical = state.isMedicalTime;
  const isMatchEnd = state.status === 'MATCH_END';
  
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
    <div className="h-full flex items-stretch p-4 gap-2">
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
      <div className="w-40 flex flex-col bg-[hsl(var(--sulsport-black))] rounded-lg overflow-hidden">
        {/* MATCH header */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <span className="text-lg font-bold text-white uppercase tracking-widest">MATCH</span>
        </div>
        
        {/* Timer - Yellow Band */}
        <div className={cn(
          "flex-1 flex items-center justify-center",
          isMedical 
            ? "bg-[hsl(var(--sulsport-yellow-dark))]" 
            : "bg-[hsl(var(--sulsport-yellow))]"
        )}>
          <div 
            className={cn(
              "text-[clamp(32px,5vw,48px)] font-black leading-none tabular-nums",
              isMedical ? "text-black/80" : "text-black",
              state.timeLeftMs <= 10000 && isRunning && "animate-pulse"
            )}
          >
            {formatTime(state.timeLeftMs)}
          </div>
        </div>
        
        {/* ROUND info */}
        <div className="h-24 flex flex-col items-center justify-center border-t border-white/10">
          <div className="text-xs text-white/60 uppercase font-bold">ROUND</div>
          <div className="text-3xl font-black text-white">
            {state.round}
          </div>
        </div>
        
        {/* Medical indicator */}
        {isMedical && (
          <div className="h-8 bg-[hsl(var(--sulsport-yellow))]/20 flex items-center justify-center">
            <span className="text-xs font-bold text-[hsl(var(--sulsport-yellow))] uppercase">
              T. MÉDICO
            </span>
          </div>
        )}
        
        {/* Match winner */}
        {isMatchEnd && (
          <div className="h-16 flex flex-col items-center justify-center bg-white/5">
            <div className="text-xs text-white/60 uppercase">VENCEDOR</div>
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
