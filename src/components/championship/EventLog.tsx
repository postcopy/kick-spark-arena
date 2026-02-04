import { Button } from '@/components/ui/button';
import { MatchEvent } from '@/types/championship';
import { Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventLogProps {
  events: MatchEvent[];
  onUndo: () => void;
  canUndo: boolean;
}

export function EventLog({ events, onUndo, canUndo }: EventLogProps) {
  // Show last 10 events in UI (hook stores up to 500)
  const recentEvents = events.slice(0, 10);
  
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const getEventColor = (event: MatchEvent) => {
    if (event.side === 'RED') return 'text-red-400';
    if (event.side === 'BLUE') return 'text-blue-400';
    if (event.type === 'UNDO') return 'text-yellow-400';
    return 'text-zinc-400';
  };
  
  return (
    <div className="border-t border-zinc-700 p-3 bg-zinc-900/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          ÚLTIMOS EVENTOS
        </h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onUndo}
          disabled={!canUndo}
          className="text-zinc-400 hover:text-white h-7 disabled:opacity-50"
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Desfazer
        </Button>
      </div>
      
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {recentEvents.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">Nenhum evento registrado</p>
        ) : (
          recentEvents.map((event) => (
            <div 
              key={event.id}
              className="flex items-center gap-2 text-xs"
            >
              <span className="text-zinc-500 tabular-nums">
                {formatTime(event.ts)}
              </span>
              <span className={cn("font-medium", getEventColor(event))}>
                {event.description}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
