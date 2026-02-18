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
  Settings,
  Activity,
  Download,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchState, MatchSide } from '@/types/championship';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ScoreAdjustDialog } from './ScoreAdjustDialog';
import { EventLogDialog } from './EventLogDialog';
import { DiagnosticsDialog } from './DiagnosticsDialog';
import type { UseSerialPortReturn } from '@/types/serial';
import type { UseHardwareDiagnosticsReturn } from '@/types/hardwareDiagnostics';
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
  diagnostics?: UseHardwareDiagnosticsReturn;
  onOpenConfig?: () => void;
  scoringInput?: 'impacts';
  onExportShadowLog?: () => void;
  onThresholdsApplied?: (thresholds: import('@/types/hardwareDiagnostics').HardwareThresholds) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function OperatorPanel({ state, actions, onOpenTV, isTVOpen, serialPort, diagnostics, onOpenConfig, scoringInput, onExportShadowLog, onThresholdsApplied, isMuted, onToggleMute }: OperatorPanelProps) {
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showScoreAdjust, setShowScoreAdjust] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const isRunning = state.status === 'RUNNING';
  const isPaused = state.status === 'PAUSED';
  const isIdle = state.status === 'IDLE';
  const isRoundEnd = state.status === 'ROUND_END';
  const isMatchEnd = state.status === 'MATCH_END';
  const isMedical = state.isMedicalTime;
  
  const canStart = (isIdle || isPaused) && !isMatchEnd;
  const canPause = isRunning;
  
  const canAddGamjeom = isRunning || state.status === 'PAUSED';
  const canRemoveGamjeomBlue = !isRunning && state.gamjeomBlue > 0;
  const canRemoveGamjeomRed = !isRunning && state.gamjeomRed > 0;

  const btnSecondary = "h-9 rounded-md bg-zinc-700 border border-zinc-600 text-zinc-200 hover:bg-zinc-600 font-bold text-xs uppercase disabled:opacity-50";
  
  return (
    <>
      <aside className="w-[340px] bg-[hsl(var(--sulsport-dark))] border-l border-[hsl(var(--sulsport-gray))] h-full flex flex-col justify-between overflow-hidden">
        {/* CONTROLES */}
        <section className="p-2.5 border-b border-[hsl(var(--sulsport-gray))] flex-shrink-0">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            CONTROLES
          </h3>
          <div className="space-y-1.5">
            {/* Iniciar Round - full width */}
            <Button
              onClick={actions.startTimer}
              disabled={!canStart || !actions.hasConfig}
              className="w-full h-10 rounded-md bg-green-600 hover:bg-green-500 text-white font-bold uppercase text-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-1.5" />
              {isMedical ? 'INICIAR T. MÉDICO' : 'INICIAR ROUND'}
            </Button>

            {/* Próximo Round - conditional full width */}
            {isRoundEnd && state.round < state.config.maxRounds && (
              <Button
                onClick={actions.nextRound}
                className="w-full h-10 rounded-md bg-yellow-600 hover:bg-yellow-500 text-black font-bold uppercase text-sm"
              >
                <Play className="w-4 h-4 mr-1.5" />
                PRÓXIMO ROUND
              </Button>
            )}

            {/* Grid 2 cols for secondary buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <Button onClick={actions.pauseTimer} disabled={!canPause} className={btnSecondary}>
                <Pause className="w-3.5 h-3.5 mr-1" /> PAUSAR
              </Button>
              <Button onClick={actions.resetTime} disabled={isRunning} className={btnSecondary}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> ZERAR
              </Button>
              <Button
                onClick={isMedical ? actions.endMedicalTime : actions.startMedicalTime}
                disabled={isMatchEnd}
                className={cn(
                  "h-9 rounded-md font-bold text-xs uppercase disabled:opacity-50",
                  isMedical 
                    ? "bg-[hsl(var(--sulsport-yellow))] hover:bg-[hsl(var(--sulsport-yellow-dark))] text-black" 
                    : "bg-zinc-700 border border-zinc-600 text-zinc-200 hover:bg-zinc-600"
                )}
              >
                <Stethoscope className="w-3.5 h-3.5 mr-1" />
                {isMedical ? 'VOLTAR' : 'T. MÉDICO'}
              </Button>
              <Button onClick={actions.undoLast} disabled={!actions.canUndo} className={btnSecondary}>
                <Undo2 className="w-3.5 h-3.5 mr-1" /> DESFAZER
              </Button>
              <Button onClick={() => setShowEventLog(true)} className={btnSecondary}>
                <List className="w-3.5 h-3.5 mr-1" /> LOGS
              </Button>
              <Button onClick={() => setShowScoreAdjust(true)} className={btnSecondary}>
                <Edit className="w-3.5 h-3.5 mr-1" /> PLACAR
              </Button>
            </div>

            {/* Encerrar Luta - full width */}
            <Button
              onClick={() => setShowEndMatchDialog(true)}
              disabled={isMatchEnd}
              className="w-full h-10 rounded-md bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white font-bold uppercase text-sm disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              ENCERRAR LUTA
            </Button>
          </div>
        </section>
        
        {/* GAM-JEOM - compact single-line per side */}
        <section className="p-2.5 border-b border-[hsl(var(--sulsport-gray))] flex-shrink-0">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            GAM-JEOM
          </h3>
          <div className="space-y-1.5">
            {/* BLUE row */}
            <div className="flex items-center gap-2">
              <span className="text-[hsl(var(--sulsport-blue-light))] font-bold text-xs uppercase w-10">BLUE</span>
              <span className="text-[hsl(var(--sulsport-blue-light))] font-bold text-lg w-6 text-center">{state.gamjeomBlue}</span>
              <div className="flex gap-1 ml-auto">
                <Button
                  size="icon"
                  onClick={() => actions.removeGamjeom('BLUE')}
                  disabled={!canRemoveGamjeomBlue}
                  className={cn(
                    "rounded-md h-8 w-8",
                    canRemoveGamjeomBlue
                      ? "bg-[hsl(var(--sulsport-blue))]/30 border border-[hsl(var(--sulsport-blue-light))]/50 text-[hsl(var(--sulsport-blue-light))] hover:bg-[hsl(var(--sulsport-blue))]/50"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-600"
                  )}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => actions.addGamjeom('BLUE')}
                  disabled={!canAddGamjeom}
                  className={cn(
                    "rounded-md h-8 w-8",
                    canAddGamjeom
                      ? "bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue-light))] text-white"
                      : "bg-zinc-800 text-zinc-600"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            {/* RED row */}
            <div className="flex items-center gap-2">
              <span className="text-[hsl(var(--sulsport-red-light))] font-bold text-xs uppercase w-10">RED</span>
              <span className="text-[hsl(var(--sulsport-red-light))] font-bold text-lg w-6 text-center">{state.gamjeomRed}</span>
              <div className="flex gap-1 ml-auto">
                <Button
                  size="icon"
                  onClick={() => actions.removeGamjeom('RED')}
                  disabled={!canRemoveGamjeomRed}
                  className={cn(
                    "rounded-md h-8 w-8",
                    canRemoveGamjeomRed
                      ? "bg-[hsl(var(--sulsport-red))]/30 border border-[hsl(var(--sulsport-red-light))]/50 text-[hsl(var(--sulsport-red-light))] hover:bg-[hsl(var(--sulsport-red))]/50"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-600"
                  )}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => actions.addGamjeom('RED')}
                  disabled={!canAddGamjeom}
                  className={cn(
                    "rounded-md h-8 w-8",
                    canAddGamjeom
                      ? "bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white"
                      : "bg-zinc-800 text-zinc-600"
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* CONFIGURAÇÕES - compact grid */}
        <section className="p-2.5 border-b border-[hsl(var(--sulsport-gray))] flex-shrink-0">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            CONFIGURAÇÕES
          </h3>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <Button onClick={onOpenConfig} className={btnSecondary}>
                <Settings className="w-3.5 h-3.5 mr-1" /> LUTA
              </Button>
              <Button
                onClick={() => setShowResetDialog(true)}
                disabled={isIdle && state.roundScoreRed === 0 && state.roundScoreBlue === 0}
                className={btnSecondary}
              >
                NOVA LUTA
              </Button>
            </div>
            {onToggleMute && (
              <Button onClick={onToggleMute} className={cn(btnSecondary, "w-full")}>
                {isMuted ? <VolumeX className="w-3.5 h-3.5 mr-1" /> : <Volume2 className="w-3.5 h-3.5 mr-1" />}
                {isMuted ? 'SOM: OFF' : 'SOM: ON'}
              </Button>
            )}
            {/* Calibragem & Export inline when available */}
            {(diagnostics || onExportShadowLog) && (
              <div className="grid grid-cols-2 gap-1.5">
                {diagnostics && (
                  <Button onClick={() => setShowDiagnostics(true)} className={btnSecondary}>
                    <Activity className="w-3.5 h-3.5 mr-1" /> CALIB.
                  </Button>
                )}
                {onExportShadowLog && (
                  <Button onClick={onExportShadowLog} className={btnSecondary}>
                    <Download className="w-3.5 h-3.5 mr-1" /> LOG
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
        
        {/* TELA EXTERNA - compact */}
        <section className="p-2.5 flex-shrink-0">
          <Button
            onClick={onOpenTV}
            className="w-full h-9 rounded-md bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white font-bold uppercase text-xs"
          >
            <Monitor className="w-4 h-4 mr-1.5" />
            ABRIR PLACAR TV
          </Button>
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
              className="bg-yellow-600 hover:bg-yellow-500 text-black"
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
      
      {/* Diagnostics Dialog */}
      {diagnostics && (
        <DiagnosticsDialog
          open={showDiagnostics}
          onOpenChange={setShowDiagnostics}
          diagnostics={diagnostics}
          serialPort={serialPort}
          onThresholdsApplied={onThresholdsApplied}
        />
      )}
    </>
  );
}
