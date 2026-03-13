import { Usb, Unplug, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SerialStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSupported: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  compact?: boolean;
}

export function SerialStatus({
  isConnected,
  isConnecting,
  error,
  isSupported,
  onConnect,
  onDisconnect,
  compact = false,
}: SerialStatusProps) {
  if (!isSupported) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-yellow-500",
        compact ? "text-xs" : "text-sm"
      )}>
        <AlertCircle className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
        <span>Web Serial não suportado. Use Chrome ou Edge.</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-500">Plaquinha ativa</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">Modo demo (teclado)</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg border",
        isConnected 
          ? "border-green-500/50 bg-green-500/10" 
          : error 
            ? "border-red-500/50 bg-red-500/10"
            : "border-border bg-card"
      )}>
        {isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
            <span className="text-yellow-500">Conectando...</span>
          </>
        ) : isConnected ? (
          <>
            <Usb className="w-5 h-5 text-green-500" />
            <span className="text-green-500 font-medium">Conectado</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              className="ml-2 h-7 px-2 text-xs hover:bg-red-500/20 hover:text-red-400"
            >
              Desconectar
            </Button>
          </>
        ) : (
          <>
            <Unplug className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">Desconectado</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onConnect}
              className="ml-2 h-7 px-3 text-xs"
            >
              Habilitar Plaquinha
            </Button>
          </>
        )}
      </div>
      
      {error && !isConnecting && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onConnect}
            className="h-6 px-3 text-xs hover:bg-primary/20"
          >
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}
