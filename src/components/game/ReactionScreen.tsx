import { ArrowLeft } from 'lucide-react';
import type { useReactionState } from '@/hooks/useReactionState';

interface ReactionScreenProps {
  reactionState: ReturnType<typeof useReactionState>;
  onBack: () => void;
}

export function ReactionScreen({ reactionState, onBack }: ReactionScreenProps) {
  const {
    currentBlock,
    totalBlocks,
    blockTimeLeft,
    currentSignal,
    isResting,
    restTimeLeft,
  } = reactionState;

  // Full-screen background colors based on signal
  const getBgClass = () => {
    if (isResting) return 'bg-slate-800';
    switch (currentSignal) {
      case 'go':
        return 'bg-green-500';
      case 'stop':
        return 'bg-red-500';
      default:
        return 'bg-slate-900';
    }
  };

  // Text color for contrast
  const getTextClass = () => {
    if (isResting) return 'text-white';
    switch (currentSignal) {
      case 'go':
      case 'stop':
        return 'text-white';
      default:
        return 'text-white/50';
    }
  };

  // Signal text
  const getSignalText = () => {
    switch (currentSignal) {
      case 'go':
        return 'VAI!';
      case 'stop':
        return 'PARA!';
      default:
        return '';
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`h-full w-full flex flex-col transition-colors duration-100 ${getBgClass()}`}
    >
      {/* Back button - always visible */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-10 p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Header info bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/20">
        <div className="text-white font-bold">
          Bloco {currentBlock}/{totalBlocks}
        </div>
        
        {!isResting && (
          <div className="text-white/80 font-mono text-lg">
            ⏱ {formatTime(blockTimeLeft)}
          </div>
        )}
      </div>

      {/* Main content - centered signal */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {isResting ? (
          // Rest period - show exercise change message
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 uppercase tracking-wider">
              Troque o
            </h2>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 uppercase tracking-wider">
              Exercício
            </h2>
            
            <div className="text-[clamp(80px,20vw,200px)] font-black text-white animate-pulse">
              {restTimeLeft}
            </div>
            
            <p className="text-white/70 text-lg md:text-xl mt-4">
              Próximo: Bloco {currentBlock}/{totalBlocks}
            </p>
          </div>
        ) : (
          // Active signal display
          <div className={`text-center ${getTextClass()}`}>
            {currentSignal !== 'neutral' && (
              <h1 className="text-[clamp(60px,25vw,250px)] font-black uppercase tracking-wider animate-pulse">
                {getSignalText()}
              </h1>
            )}
          </div>
        )}
      </div>

      {/* Footer - minimal info */}
      {!isResting && currentSignal === 'neutral' && (
        <div className="flex-shrink-0 py-4 text-center">
          <p className="text-white/30 text-sm uppercase tracking-wider">
            Prepare-se
          </p>
        </div>
      )}
    </div>
  );
}
