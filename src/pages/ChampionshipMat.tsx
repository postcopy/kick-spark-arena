import { useState, useRef, useEffect, useCallback } from 'react';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { useSerialPort } from '@/hooks/useSerialPort';
import { OperatorPanel } from '@/components/championship/OperatorPanel';
import { ScoreboardMain } from '@/components/championship/ScoreboardMain';
import { ScoringButtons } from '@/components/championship/ScoringButtons';
import { EventLog } from '@/components/championship/EventLog';
import { MatchConfigDialog } from '@/components/championship/MatchConfigDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logoSpe from '@/assets/logo-spe-branca.png';
import type { Side, HitType } from '@/types/game';
import type { MatchSide, ScoreType, MatchConfig } from '@/types/championship';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ChampionshipMat() {
  const matId = 1;
  
  const sync = useChampionshipSync({ role: 'master', matId });
  const [isTVOpen, setIsTVOpen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const tvWindowRef = useRef<Window | null>(null);
  
  // Auto-open config dialog if no config
  useEffect(() => {
    if (!sync.hasConfig) {
      setShowConfigDialog(true);
    }
  }, [sync.hasConfig]);
  
  // Handle kick from hardware - convert game types to championship types
  // Side from hook is already "who scores" (inverted from equipment hit)
  const handleHardwareKick = useCallback((side: Side, hitType: HitType) => {
    // Only score when match is running
    if (sync.state.status !== 'RUNNING') return;
    
    const matchSide: MatchSide = side === 'red' ? 'RED' : 'BLUE';
    const scoreType: ScoreType = hitType === 'helmet' ? 'HEAD' : 'BODY';
    
    sync.addScore(matchSide, scoreType);
  }, [sync]);
  
  const serialPort = useSerialPort({
    onKick: handleHardwareKick,
    debounceMs: 150,
  });
  
  const handleOpenTV = () => {
    tvWindowRef.current = window.open(
      `/championship/tv?mat=${matId}`, 
      `championship-tv-${matId}`,
      'width=1920,height=1080'
    );
    if (tvWindowRef.current) {
      setIsTVOpen(true);
    }
  };
  
  // Polling to detect when TV window is closed
  useEffect(() => {
    if (!isTVOpen || !tvWindowRef.current) return;
    
    const checkClosed = setInterval(() => {
      if (tvWindowRef.current?.closed) {
        setIsTVOpen(false);
        tvWindowRef.current = null;
      }
    }, 1000);
    
    return () => clearInterval(checkClosed);
  }, [isTVOpen]);
  
  const handleSaveConfig = (config: MatchConfig) => {
    sync.saveConfig(config);
  };
  
  // Block editing when running
  const isConfigLocked = sync.state.status === 'RUNNING';
  
  // Check for tie at round end
  const isTie = sync.state.status === 'ROUND_END' && 
                sync.state.roundScoreRed === sync.state.roundScoreBlue;
  
  return (
    <div className="h-screen flex bg-[hsl(var(--sulsport-black))]">
      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center justify-center relative px-6">
          {/* Logo centralizada */}
          <img 
            src={logoSpe} 
            alt="SPE" 
            className="h-8 w-auto object-contain"
          />
          {/* Status indicators à direita */}
          <div className="absolute right-6 flex items-center gap-4 text-sm">
            <span className={cn(
              "px-2 py-1 rounded-md font-bold text-xs uppercase",
              serialPort.isConnected 
                ? "bg-green-500/20 text-green-400" 
                : "bg-zinc-700 text-zinc-500"
            )}>
              {serialPort.isConnected ? 'USB' : 'USB OFF'}
            </span>
            <span className={cn(
              "px-2 py-1 rounded-md font-bold uppercase",
              sync.state.status === 'RUNNING' 
                ? "bg-green-500/20 text-green-500" 
                : sync.state.status === 'MATCH_END'
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-zinc-700 text-zinc-400"
            )}>
              {sync.state.status === 'IDLE' && 'PRONTO'}
              {sync.state.status === 'RUNNING' && 'EM ANDAMENTO'}
              {sync.state.status === 'PAUSED' && 'PAUSADO'}
              {sync.state.status === 'MEDICAL' && 'TEMPO MÉDICO'}
              {sync.state.status === 'ROUND_END' && 'FIM DO ROUND'}
              {sync.state.status === 'MATCH_END' && 'FIM DA LUTA'}
            </span>
            <span className="text-zinc-400 font-bold">
              ROUND {sync.state.round}/{sync.state.config.maxRounds}
            </span>
          </div>
        </header>
        
        {/* Scoreboard - flex-1 ocupa espaço restante */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScoreboardMain 
            state={sync.state} 
            onResetMatch={() => setShowResetDialog(true)}
          />
        </div>
        
        {/* Tie Decision */}
        {isTie && (
          <div className="shrink-0 bg-[hsl(var(--sulsport-yellow))]/10 border-y border-[hsl(var(--sulsport-yellow))]/30 p-4">
            <div className="text-center mb-3">
              <span className="text-lg font-bold text-[hsl(var(--sulsport-yellow))] uppercase">
                EMPATE — Declarar Vencedor do Round
              </span>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => sync.declareRoundWinner('BLUE')}
                className="bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md"
              >
                VITÓRIA AZUL
              </Button>
              <Button
                onClick={() => sync.declareRoundWinner('RED')}
                className="bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md"
              >
                VITÓRIA VERMELHO
              </Button>
            </div>
          </div>
        )}
        
        {/* Scoring Buttons - shrink-0 para não encolher */}
        <div className="shrink-0">
          <ScoringButtons 
            state={sync.state}
            onScore={sync.addScore}
          />
        </div>
        
        {/* Event Log - shrink-0 para não encolher */}
        <div className="shrink-0">
          <EventLog 
            events={sync.state.events}
            onUndo={sync.undoLast}
            canUndo={sync.canUndo}
          />
        </div>
      </main>
      
      {/* Operator Panel (Right Sidebar) */}
      <OperatorPanel
        state={sync.state}
        actions={sync}
        onOpenTV={handleOpenTV}
        isTVOpen={isTVOpen}
        serialPort={serialPort}
        onOpenConfig={() => setShowConfigDialog(true)}
      />
      
      {/* Config Dialog */}
      <MatchConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        currentConfig={sync.state.config}
        onSave={handleSaveConfig}
        isLocked={isConfigLocked}
      />
      
      {/* Reset Match Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Nova Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação resetará todos os placares e iniciará uma nova luta. As configurações serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                sync.resetMatch();
                setShowResetDialog(false);
              }}
              className="bg-yellow-600 hover:bg-yellow-500 text-black"
            >
              Iniciar Nova Luta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
