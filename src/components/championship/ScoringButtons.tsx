import { Button } from '@/components/ui/button';
import { MatchState, MatchSide, ScoreType } from '@/types/championship';
import { cn } from '@/lib/utils';

interface ScoringButtonsProps {
  state: MatchState;
  onScore: (side: MatchSide, type: ScoreType) => void;
}

export function ScoringButtons({ state, onScore }: ScoringButtonsProps) {
  const isRunning = state.status === 'RUNNING';
  const { scoring } = state.config;
  
  const scoreTypes: { type: ScoreType; label: string; value: number }[] = [
    { type: 'PUNCH', label: 'Soco', value: scoring.punch },
    { type: 'BODY', label: 'Corpo', value: scoring.body },
    { type: 'HEAD', label: 'Cabeça', value: scoring.head },
    { type: 'SPIN_BODY', label: 'Giro C.', value: scoring.spinBody },
    { type: 'SPIN_HEAD', label: 'Giro Cab.', value: scoring.spinHead },
  ];
  
  return (
    <div className="border-t border-zinc-700 p-4 bg-zinc-900/50">
      <div className="grid grid-cols-2 gap-4">
        {/* Blue Side */}
        <div>
          <h3 className="text-sm font-bold text-blue-400 mb-2 text-center">
            PONTUAÇÃO AZUL
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {scoreTypes.map(({ type, label, value }) => (
              <Button
                key={`blue-${type}`}
                onClick={() => onScore('BLUE', type)}
                disabled={!isRunning}
                className={cn(
                  "h-16 flex flex-col items-center justify-center gap-1",
                  "bg-blue-600 hover:bg-blue-500 text-white font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <span className="text-xl font-bold">+{value}</span>
                <span className="text-[10px] leading-tight">{label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Red Side */}
        <div>
          <h3 className="text-sm font-bold text-red-400 mb-2 text-center">
            PONTUAÇÃO VERMELHO
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {scoreTypes.map(({ type, label, value }) => (
              <Button
                key={`red-${type}`}
                onClick={() => onScore('RED', type)}
                disabled={!isRunning}
                className={cn(
                  "h-16 flex flex-col items-center justify-center gap-1",
                  "bg-red-600 hover:bg-red-500 text-white font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <span className="text-xl font-bold">+{value}</span>
                <span className="text-[10px] leading-tight">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
