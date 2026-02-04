import { MatchState, formatTime } from '@/types/championship';
import { cn } from '@/lib/utils';

interface ScoreboardMainProps {
  state: MatchState;
}

export function ScoreboardMain({ state }: ScoreboardMainProps) {
  const isRunning = state.status === 'RUNNING';
  const isMedical = state.isMedicalTime;
  const isMatchEnd = state.status === 'MATCH_END';
  
  // Generate round win indicators
  const renderRoundIndicators = (wins: number, side: 'red' | 'blue') => {
    const maxRounds = state.config.maxRounds === 1 ? 1 : 2;
    const indicators = [];
    for (let i = 0; i < maxRounds; i++) {
      indicators.push(
        <div
          key={i}
          className={cn(
            "w-4 h-4 rounded-full border-2",
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
    <div className="h-full flex items-center justify-center p-4 gap-4">
      {/* Blue Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 border-2 border-blue-500/30">
        {/* Athlete Name */}
        <div className="text-lg font-bold text-blue-400 mb-1">
          {state.config.athleteBlue?.name || 'CHUNG'}
        </div>
        {state.config.athleteBlue?.country && (
          <div className="text-sm text-blue-400/70 mb-2">
            {state.config.athleteBlue.country}
          </div>
        )}
        
        {/* Score */}
        <div className="text-7xl md:text-8xl font-black text-blue-400 leading-none">
          {state.roundScoreBlue}
        </div>
        
        {/* Gamjeom & Rounds */}
        <div className="flex items-center gap-4 mt-4">
          <div className="text-center">
            <div className="text-xs text-zinc-500">GJ</div>
            <div className="text-xl font-bold text-blue-400">
              {state.gamjeomBlue}
            </div>
          </div>
          <div className="flex gap-1">
            {renderRoundIndicators(state.roundWinsBlue, 'blue')}
          </div>
        </div>
      </div>
      
      {/* Timer Center */}
      <div className="flex flex-col items-center justify-center min-w-[180px]">
        <div 
          className={cn(
            "text-5xl md:text-6xl font-black leading-none tabular-nums",
            isMedical ? "text-yellow-500" : "text-white",
            state.timeLeftMs <= 10000 && isRunning && "text-red-500 animate-pulse"
          )}
        >
          {formatTime(state.timeLeftMs)}
        </div>
        
        <div className="text-sm text-zinc-400 mt-2">
          ROUND {state.round}/{state.config.maxRounds}
        </div>
        
        {isMedical && (
          <div className="mt-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-xs font-medium">
            TEMPO MÉDICO
          </div>
        )}
        
        {/* Match winner */}
        {isMatchEnd && (
          <div className="mt-4 text-center">
            <div className="text-xs text-zinc-500 mb-1">VENCEDOR</div>
            <div className={cn(
              "text-xl font-black",
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-600/5 border-2 border-red-500/30">
        {/* Athlete Name */}
        <div className="text-lg font-bold text-red-400 mb-1">
          {state.config.athleteRed?.name || 'HONG'}
        </div>
        {state.config.athleteRed?.country && (
          <div className="text-sm text-red-400/70 mb-2">
            {state.config.athleteRed.country}
          </div>
        )}
        
        {/* Score */}
        <div className="text-7xl md:text-8xl font-black text-red-400 leading-none">
          {state.roundScoreRed}
        </div>
        
        {/* Gamjeom & Rounds */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex gap-1">
            {renderRoundIndicators(state.roundWinsRed, 'red')}
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500">GJ</div>
            <div className="text-xl font-bold text-red-400">
              {state.gamjeomRed}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
