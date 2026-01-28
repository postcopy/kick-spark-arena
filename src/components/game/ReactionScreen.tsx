import { Progress } from '@/components/ui/progress';
import { UseReactionStateReturn } from '@/hooks/useReactionState';
import { CUE_VISUALS, ReactionCue } from '@/types/reaction';
import { cn } from '@/lib/utils';

interface ReactionScreenProps {
  reactionState: UseReactionStateReturn;
}

// 8 positions for octagon layout (clock positions)
const OCTAGON_POSITIONS = [
  { top: '5%', left: '50%', transform: 'translateX(-50%)' },           // 0 - top
  { top: '15%', right: '15%', transform: 'none' },                     // 1 - top-right
  { top: '50%', right: '5%', transform: 'translateY(-50%)' },          // 2 - right
  { bottom: '15%', right: '15%', transform: 'none' },                  // 3 - bottom-right
  { bottom: '5%', left: '50%', transform: 'translateX(-50%)' },        // 4 - bottom
  { bottom: '15%', left: '15%', transform: 'none' },                   // 5 - bottom-left
  { top: '50%', left: '5%', transform: 'translateY(-50%)' },           // 6 - left
  { top: '15%', left: '15%', transform: 'none' },                      // 7 - top-left
];

export function ReactionScreen({ reactionState }: ReactionScreenProps) {
  const { 
    gameState,
    currentCue, 
    cueVisible, 
    cuesShown, 
    timeElapsed,
    currentBlock,
    totalBlocks,
    blockRestCountdown,
    progressPercent,
    currentRule,
    config,
  } = reactionState;

  const isOctagon = config.drillType === 'octagon';
  const isTwoStep = config.drillType === 'twoStep';

  // Block rest overlay
  if (gameState === 'block_rest') {
    return (
      <div className="flex flex-col h-full w-full bg-background items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-muted-foreground mb-4">DESCANSO</div>
          <div className="text-[clamp(80px,20vw,200px)] font-black text-green-500 animate-pulse">
            {blockRestCountdown}
          </div>
          <div className="text-lg text-muted-foreground mt-4">
            Bloco {currentBlock + 1} de {totalBlocks} em breve...
          </div>
        </div>
      </div>
    );
  }

  // Get cue visual
  const cueVisual = currentCue ? CUE_VISUALS[currentCue.cue as ReactionCue] : null;

  // Progress display
  const progressLabel = config.sessionMode === 'rounds' 
    ? `${cuesShown}/${config.totalRounds}` 
    : `${timeElapsed}s/${config.totalTimeSec}s`;

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Minimal header */}
      <header className="flex-shrink-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-mono font-bold">{progressLabel}</span>
          {totalBlocks > 1 && (
            <span className="text-sm text-muted-foreground">
              Bloco {currentBlock + 1}/{totalBlocks}
            </span>
          )}
        </div>
        
        {/* Rule indicator */}
        {config.ruleMode !== 'normal' && (
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-bold uppercase",
            currentRule === 'normal' 
              ? "bg-green-500/20 text-green-500" 
              : "bg-orange-500/20 text-orange-500"
          )}>
            {currentRule === 'normal' ? 'NORMAL' : 'INVERTIDO'}
          </div>
        )}
      </header>

      {/* Progress bar */}
      <div className="px-4">
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Main cue area */}
      <main className="flex-1 min-h-0 relative flex items-center justify-center p-4">
        {isOctagon ? (
          // Octagon layout: cue appears in one of 8 positions
          <div className="relative w-full h-full max-w-[600px] max-h-[600px] mx-auto">
            {/* Center marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/30" />
            
            {/* Position markers */}
            {OCTAGON_POSITIONS.map((pos, idx) => (
              <div 
                key={idx}
                className="absolute w-3 h-3 rounded-full bg-muted-foreground/20"
                style={pos}
              />
            ))}
            
            {/* Active cue */}
            {cueVisible && currentCue && cueVisual && currentCue.position !== undefined && (
              <div 
                className="absolute transition-all duration-100"
                style={OCTAGON_POSITIONS[currentCue.position]}
              >
                <div className={cn(
                  "text-[clamp(60px,12vw,120px)] font-black transition-opacity duration-100",
                  cueVisual.color,
                  cueVisible ? 'opacity-100' : 'opacity-0'
                )}>
                  {cueVisual.symbol}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Centered cue layout
          <div className="text-center">
            {/* Step indicator for twoStep */}
            {isTwoStep && currentCue?.step && (
              <div className="text-lg text-muted-foreground mb-4">
                Passo {currentCue.step}/2
              </div>
            )}
            
            {/* Main cue */}
            <div className={cn(
              "transition-all duration-100",
              cueVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            )}>
              {cueVisible && cueVisual && (
                <>
                  <div className={cn(
                    "text-[clamp(100px,25vw,300px)] font-black leading-none",
                    cueVisual.color
                  )}>
                    {cueVisual.symbol}
                  </div>
                  {currentCue?.isNoGo && (
                    <div className="text-2xl md:text-4xl font-bold text-red-500 mt-4 animate-pulse">
                      NÃO REAJA!
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Empty state placeholder */}
            {!cueVisible && (
              <div className="text-muted-foreground/20 text-[clamp(100px,25vw,300px)] font-black">
                •
              </div>
            )}
          </div>
        )}
      </main>

      {/* Inverted rule warning */}
      {currentRule === 'inverted' && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-orange-500/20 border border-orange-500 rounded-full">
          <span className="text-orange-500 font-bold">⚠️ MODO INVERTIDO</span>
        </div>
      )}
    </div>
  );
}
