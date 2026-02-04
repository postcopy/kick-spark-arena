import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MatchEvent } from '@/types/championship';
import { cn } from '@/lib/utils';

interface EventLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: MatchEvent[];
}

export function EventLogDialog({ open, onOpenChange, events }: EventLogDialogProps) {
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };
  
  const getEventColor = (event: MatchEvent) => {
    if (event.side === 'RED') return 'text-red-400';
    if (event.side === 'BLUE') return 'text-blue-400';
    if (event.type === 'UNDO') return 'text-yellow-400';
    if (event.type === 'TIMER_START') return 'text-green-400';
    if (event.type === 'TIMER_PAUSE') return 'text-orange-400';
    if (event.type === 'MATCH_END') return 'text-purple-400';
    return 'text-zinc-400';
  };
  
  const getEventIcon = (event: MatchEvent) => {
    switch (event.type) {
      case 'PUNCH':
      case 'BODY':
      case 'HEAD':
      case 'SPIN_BODY':
      case 'SPIN_HEAD':
        return '⚡';
      case 'GAMJEOM':
        return '⚠️';
      case 'TIMER_START':
        return '▶️';
      case 'TIMER_PAUSE':
        return '⏸️';
      case 'TIMER_RESET':
        return '🔄';
      case 'ROUND_END':
        return '🏁';
      case 'MATCH_END':
        return '🏆';
      case 'MEDICAL_START':
      case 'MEDICAL_END':
        return '🏥';
      case 'UNDO':
        return '↩️';
      case 'ADJUST':
        return '✏️';
      case 'POINT_GAP':
        return '🎯';
      case 'GAMJEOM_LIMIT':
        return '❌';
      default:
        return '•';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Log de Eventos</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-zinc-500 italic text-center py-8">
                Nenhum evento registrado
              </p>
            ) : (
              events.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded bg-zinc-800/50"
                >
                  <span className="text-lg leading-none mt-0.5">
                    {getEventIcon(event)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", getEventColor(event))}>
                      {event.description}
                    </p>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      {formatTime(event.ts)}
                    </p>
                  </div>
                  {event.points !== undefined && (
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-bold",
                      event.side === 'RED' 
                        ? "bg-red-600/20 text-red-400" 
                        : "bg-blue-600/20 text-blue-400"
                    )}>
                      +{event.points}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
