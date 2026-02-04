import { 
  Play, 
  Pause, 
  RotateCcw, 
  Stethoscope, 
  List, 
  Edit, 
  XCircle,
  Monitor,
  Plus,
  Minus,
  Undo2,
  Usb,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchState, MatchSide } from '@/types/championship';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ScoreAdjustDialog } from './ScoreAdjustDialog';
import { EventLogDialog } from './EventLogDialog';
import type { UseSerialPortReturn } from '@/types/serial';
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

interface OperatorPanelProps {
  state: MatchState;
  actions: {
    startTimer: () => void;
    pauseTimer: () => void;
    resetTime: () => void;
    startMedicalTime: () => void;
    endMedicalTime: () => void;
    endMatch: () => void;
    nextRound: () => void;
    resetMatch: () => void;
    addGamjeom: (side: MatchSide) => void;
    removeGamjeom: (side: MatchSide) => void;
    adjustScore: (side: MatchSide, roundScore: number, gamjeom: number) => void;
    undoLast: () => void;
    canUndo: boolean;
    hasConfig: boolean;
  };
  onOpenTV: () => void;
  isTVOpen: boolean;
  serialPort?: UseSerialPortReturn;
  onOpenConfig?: () => void;
}

export function OperatorPanel({ state, actions, onOpenTV, isTVOpen, serialPort, onOpenConfig }: OperatorPanelProps) {
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showScoreAdjust, setShowScoreAdjust] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  
  const isRunning = state.status === 'RUNNING';
  const isPaused = state.status === 'PAUSED';
  const isIdle = state.status === 'IDLE';
  const isRoundEnd = state.status === 'ROUND_END';
  const isMatchEnd = state.status === 'MATCH_END';
  const isMedical = state.isMedicalTime;
  
  const canStart = (isIdle || isPaused) && !isMatchEnd;
  const canPause = isRunning;
  
  // GAM-JEOM button rules:
  // [+] enabled ONLY when status === 'RUNNING'
  // [-] enabled ONLY when status !== 'RUNNING' and gamjeom > 0
  const canAddGamjeom = isRunning;
  const canRemoveGamjeomBlue = !isRunning && state.gamjeomBlue > 0;
  const canRemoveGamjeomRed = !isRunning && state.gamjeomRed > 0;
  
  return (
    <>
      <aside className="w-[340px] bg-[hsl(var(--sulsport-dark))] border-l border-[hsl(var(--sulsport-gray))] flex flex-col overflow-y-auto">
        {/* CONTROLES */}
        <section className="p-4 border-b border-[hsl(var(--sulsport-gray))]">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            CONTROLES
          </h3>
          <div className="space-y-2">
            {/* Iniciar Round */}
            <Button
              onClick={actions.startTimer}
              disabled={!canStart || !actions.hasConfig}
              className="w-full h-12 rounded-md bg-green-600 hover:bg-green-500 text-white font-bold uppercase disabled:opacity-50"
            >
              <Play className="w-5 h-5 mr-2" />
              {isMedical ? 'INICIAR T. MÉDICO' : 'INICIAR ROUND'}
            </Button>
            
            {/* Pausar */}
            <Button
              onClick={actions.pauseTimer}
              disabled={!canPause}
              className="w-full h-12 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold uppercase disabled:opacity-50"
            >
              <Pause className="w-5 h-5 mr-2" />
              PAUSAR
            </Button>
            
            {/* Zerar Tempo */}
            <Button
              onClick={actions.resetTime}
              disabled={isRunning}
              className="w-full h-12 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold uppercase disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              ZERAR TEMPO
            </Button>
            
            {/* Tempo Médico */}
            <Button
              onClick={isMedical ? actions.endMedicalTime : actions.startMedicalTime}
              disabled={isMatchEnd}
              className={cn(
                "w-full h-12 rounded-md font-bold uppercase disabled:opacity-50",
                isMedical 
                  ? "bg-[hsl(var(--sulsport-yellow))] hover:bg-[hsl(var(--sulsport-yellow-dark))] text-black" 
                  : "bg-zinc-700 hover:bg-zinc-600"
              )}
            >
              <Stethoscope className="w-5 h-5 mr-2" />
              {isMedical ? 'VOLTAR P/ ROUND' : 'TEMPO MÉDICO'}
            </Button>
            
            {/* Próximo Round */}
            {isRoundEnd && state.round < state.config.maxRounds && (
              <Button
                onClick={actions.nextRound}
                className="w-full h-12 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase"
              >
                <Play className="w-5 h-5 mr-2" />
                PRÓXIMO ROUND
              </Button>
            )}
            
            {/* Logs */}
            <Button
              onClick={() => setShowEventLog(true)}
              className="w-full h-12 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold uppercase"
            >
              <List className="w-5 h-5 mr-2" />
              LOGS
            </Button>
            
            {/* Alterar Placar */}
            <Button
              onClick={() => setShowScoreAdjust(true)}
              className="w-full h-12 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold uppercase"
            >
              <Edit className="w-5 h-5 mr-2" />
              ALTERAR PLACAR
            </Button>
            
            {/* Desfazer */}
            <Button
              onClick={actions.undoLast}
              disabled={!actions.canUndo}
              className="w-full h-12 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold uppercase disabled:opacity-50"
            >
              <Undo2 className="w-5 h-5 mr-2" />
              DESFAZER
            </Button>
            
            {/* Encerrar Luta */}
            <Button
              onClick={() => setShowEndMatchDialog(true)}
              disabled={isMatchEnd}
              className="w-full h-12 rounded-md bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white font-bold uppercase disabled:opacity-50"
            >
              <XCircle className="w-5 h-5 mr-2" />
              ENCERRAR LUTA
            </Button>
          </div>
        </section>
        
        {/* GAM-JEOM */}
        <section className="p-4 border-b border-[hsl(var(--sulsport-gray))]">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            GAM-JEOM
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* BLUE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[hsl(var(--sulsport-blue-light))] font-bold text-sm uppercase">BLUE</span>
                <span className="text-[hsl(var(--sulsport-blue-light))] font-bold text-xl">{state.gamjeomBlue}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  onClick={() => actions.removeGamjeom('BLUE')}
                  disabled={!canRemoveGamjeomBlue}
                  className={cn(
                    "rounded-md h-10 w-10",
                    canRemoveGamjeomBlue
                      ? "bg-[hsl(var(--sulsport-blue))]/30 border border-[hsl(var(--sulsport-blue-light))]/50 text-[hsl(var(--sulsport-blue-light))] hover:bg-[hsl(var(--sulsport-blue))]/50"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-600"
                  )}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => actions.addGamjeom('BLUE')}
                  disabled={!canAddGamjeom}
                  className={cn(
                    "rounded-md h-10 w-10",
                    canAddGamjeom
                      ? "bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue-light))] text-white"
                      : "bg-zinc-800 text-zinc-600"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* RED */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[hsl(var(--sulsport-red-light))] font-bold text-sm uppercase">RED</span>
                <span className="text-[hsl(var(--sulsport-red-light))] font-bold text-xl">{state.gamjeomRed}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  onClick={() => actions.removeGamjeom('RED')}
                  disabled={!canRemoveGamjeomRed}
                  className={cn(
                    "rounded-md h-10 w-10",
                    canRemoveGamjeomRed
                      ? "bg-[hsl(var(--sulsport-red))]/30 border border-[hsl(var(--sulsport-red-light))]/50 text-[hsl(var(--sulsport-red-light))] hover:bg-[hsl(var(--sulsport-red))]/50"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-600"
                  )}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => actions.addGamjeom('RED')}
                  disabled={!canAddGamjeom}
                  className={cn(
                    "rounded-md h-10 w-10",
                    canAddGamjeom
                      ? "bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white"
                      : "bg-zinc-800 text-zinc-600"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            [+] durante round • [-] quando pausado
          </p>
        </section>
        
        {/* STATUS */}
        <section className="p-4 border-b border-[hsl(var(--sulsport-gray))]">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            STATUS
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                actions.hasConfig ? "bg-green-500" : "bg-[hsl(var(--sulsport-red-light))]"
              )} />
              <span className={actions.hasConfig ? "text-green-400" : "text-[hsl(var(--sulsport-red-light))]"}>
                {actions.hasConfig ? "Configurado" : "Não configurado"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                serialPort?.isConnected ? "bg-green-500" : "bg-zinc-500"
              )} />
              <span className={serialPort?.isConnected ? "text-green-400" : "text-zinc-400"}>
                {serialPort?.isConnected ? "Hardware conectado" : "Hardware não conectado"}
              </span>
            </div>
          </div>
        </section>
        
        {/* HARDWARE */}
        {serialPort && (
          <section className="p-4 border-b border-[hsl(var(--sulsport-gray))]">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              HARDWARE
            </h3>
            <div className="space-y-3">
              <Button
                onClick={serialPort.isConnected ? serialPort.disconnect : serialPort.connect}
                disabled={serialPort.isConnecting}
                className={cn(
                  "w-full h-10 rounded-md font-bold text-sm uppercase",
                  serialPort.isConnected
                    ? "bg-zinc-700 hover:bg-zinc-600"
                    : "bg-purple-600 hover:bg-purple-500 text-white"
                )}
              >
                <Usb className="w-4 h-4 mr-2" />
                {serialPort.isConnecting 
                  ? 'CONECTANDO...' 
                  : serialPort.isConnected 
                    ? 'DESCONECTAR USB' 
                    : 'CONECTAR USB'}
              </Button>
              
              {serialPort.error && (
                <p className="text-xs text-[hsl(var(--sulsport-red-light))]">
                  {serialPort.error}
                </p>
              )}
              
              {!serialPort.isSupported && (
                <p className="text-xs text-[hsl(var(--sulsport-yellow))]">
                  Web Serial não suportado. Use Chrome ou Edge.
                </p>
              )}
            </div>
          </section>
        )}
        
        {/* CONFIGURAÇÕES */}
        <section className="p-4 border-b border-[hsl(var(--sulsport-gray))]">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            CONFIGURAÇÕES
          </h3>
          <div className="space-y-2">
            <Button
              onClick={onOpenConfig}
              className="w-full h-10 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold text-sm uppercase"
            >
              <Settings className="w-4 h-4 mr-2" />
              GERENCIAR LUTA
            </Button>
            <Button
              onClick={() => setShowResetDialog(true)}
              disabled={isIdle && state.roundScoreRed === 0 && state.roundScoreBlue === 0}
              className="w-full h-10 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold text-sm uppercase disabled:opacity-50"
            >
              NOVA LUTA
            </Button>
          </div>
        </section>
        
        {/* TELA EXTERNA */}
        <section className="p-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            TELA EXTERNA
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">2ª Tela:</span>
              <span className={isTVOpen ? "text-green-400 font-bold" : "text-zinc-500"}>
                {isTVOpen ? "ABERTA" : "FECHADA"}
              </span>
            </div>
            <Button
              onClick={onOpenTV}
              className="w-full h-12 rounded-md bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white font-bold uppercase"
            >
              <Monitor className="w-5 h-5 mr-2" />
              ABRIR PLACAR TV
            </Button>
            <p className="text-xs text-zinc-500 text-center">
              Para tela cheia na TV, pressione F11
            </p>
          </div>
        </section>
      </aside>
      
      {/* End Match Dialog */}
      <AlertDialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Encerrar Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação encerrará a luta atual. O placar será mantido para registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                actions.endMatch();
                setShowEndMatchDialog(false);
              }}
              className="bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))]"
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset Match Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Nova Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Isso irá zerar todo o placar e iniciar uma nova luta com as mesmas configurações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                actions.resetMatch();
                setShowResetDialog(false);
              }}
              className="bg-purple-600 hover:bg-purple-500"
            >
              Nova Luta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Score Adjust Dialog */}
      <ScoreAdjustDialog
        open={showScoreAdjust}
        onOpenChange={setShowScoreAdjust}
        state={state}
        onAdjust={actions.adjustScore}
      />
      
      {/* Event Log Dialog */}
      <EventLogDialog
        open={showEventLog}
        onOpenChange={setShowEventLog}
        events={state.events}
      />
    </>
  );
}
