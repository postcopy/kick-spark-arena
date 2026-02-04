import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Stethoscope, 
  List, 
  Edit, 
  XCircle,
  Settings,
  Monitor,
  Plus,
  Minus,
  Undo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchState, MatchSide, formatTime } from '@/types/championship';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ScoreAdjustDialog } from './ScoreAdjustDialog';
import { EventLogDialog } from './EventLogDialog';
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
    adjustScore: (side: MatchSide, roundScore: number, gamjeom: number) => void;
    undoLast: () => void;
    canUndo: boolean;
    hasConfig: boolean;
  };
  onOpenTV: () => void;
  isTVOpen: boolean;
}

export function OperatorPanel({ state, actions, onOpenTV, isTVOpen }: OperatorPanelProps) {
  const navigate = useNavigate();
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
  
  return (
    <>
      <aside className="w-[340px] bg-zinc-900 border-l border-zinc-700 flex flex-col overflow-y-auto">
        {/* CONTROLES */}
        <section className="p-4 border-b border-zinc-700">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            CONTROLES
          </h3>
          <div className="space-y-2">
            {/* Iniciar Round */}
            <Button
              onClick={actions.startTimer}
              disabled={!canStart || !actions.hasConfig}
              className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold disabled:opacity-50"
            >
              <Play className="w-5 h-5 mr-2" />
              {isMedical ? 'Iniciar T. Médico' : 'Iniciar Round'}
            </Button>
            
            {/* Pausar */}
            <Button
              onClick={actions.pauseTimer}
              disabled={!canPause}
              className="w-full h-12 bg-zinc-700 hover:bg-zinc-600 font-medium disabled:opacity-50"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pausar
            </Button>
            
            {/* Zerar Tempo */}
            <Button
              onClick={actions.resetTime}
              disabled={isRunning}
              className="w-full h-12 bg-zinc-700 hover:bg-zinc-600 font-medium disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Zerar Tempo
            </Button>
            
            {/* Tempo Médico */}
            <Button
              onClick={isMedical ? actions.endMedicalTime : actions.startMedicalTime}
              disabled={isMatchEnd}
              className={cn(
                "w-full h-12 font-medium disabled:opacity-50",
                isMedical 
                  ? "bg-yellow-600 hover:bg-yellow-500 text-black" 
                  : "bg-zinc-700 hover:bg-zinc-600"
              )}
            >
              <Stethoscope className="w-5 h-5 mr-2" />
              {isMedical ? 'Voltar p/ Round' : 'Tempo Médico'}
            </Button>
            
            {/* Próximo Round */}
            {isRoundEnd && state.round < state.config.maxRounds && (
              <Button
                onClick={actions.nextRound}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                <Play className="w-5 h-5 mr-2" />
                Próximo Round
              </Button>
            )}
            
            {/* Logs */}
            <Button
              onClick={() => setShowEventLog(true)}
              className="w-full h-12 bg-zinc-700 hover:bg-zinc-600 font-medium"
            >
              <List className="w-5 h-5 mr-2" />
              Logs
            </Button>
            
            {/* Alterar Placar */}
            <Button
              onClick={() => setShowScoreAdjust(true)}
              className="w-full h-12 bg-zinc-700 hover:bg-zinc-600 font-medium"
            >
              <Edit className="w-5 h-5 mr-2" />
              Alterar Placar
            </Button>
            
            {/* Desfazer */}
            <Button
              onClick={actions.undoLast}
              disabled={!actions.canUndo}
              className="w-full h-12 bg-zinc-700 hover:bg-zinc-600 font-medium disabled:opacity-50"
            >
              <Undo2 className="w-5 h-5 mr-2" />
              Desfazer
            </Button>
            
            {/* Encerrar Luta */}
            <Button
              onClick={() => setShowEndMatchDialog(true)}
              disabled={isMatchEnd}
              className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-50"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Encerrar Luta
            </Button>
          </div>
        </section>
        
        {/* GAM-JEOM */}
        <section className="p-4 border-b border-zinc-700">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            GAM-JEOM
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* BLUE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-bold text-sm">BLUE</span>
                <span className="text-blue-400 font-bold text-lg">{state.gamjeomBlue}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  disabled
                  className="bg-blue-600/20 border border-blue-500/30 text-blue-400/50"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => actions.addGamjeom('BLUE')}
                  disabled={!isRunning}
                  className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* RED */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-red-400 font-bold text-sm">RED</span>
                <span className="text-red-400 font-bold text-lg">{state.gamjeomRed}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  disabled
                  className="bg-red-600/20 border border-red-500/30 text-red-400/50"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => actions.addGamjeom('RED')}
                  disabled={!isRunning}
                  className="bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            [-] apenas via "Alterar Placar"
          </p>
        </section>
        
        {/* STATUS */}
        <section className="p-4 border-b border-zinc-700">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            STATUS
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                actions.hasConfig ? "bg-green-500" : "bg-red-500"
              )} />
              <span className={actions.hasConfig ? "text-green-400" : "text-red-400"}>
                {actions.hasConfig ? "Configurado" : "Não configurado"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-500" />
              <span className="text-zinc-400">Hardware não conectado</span>
            </div>
          </div>
        </section>
        
        {/* CONFIGURAÇÕES */}
        <section className="p-4 border-b border-zinc-700">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            CONFIGURAÇÕES
          </h3>
          <div className="space-y-2">
            <Button
              onClick={() => navigate('/championship/setup')}
              className="w-full h-10 bg-zinc-700 hover:bg-zinc-600 font-medium text-sm"
            >
              GERENCIAR LUTA
            </Button>
            <Button
              onClick={() => navigate('/championship/setup?tab=rules')}
              className="w-full h-10 bg-zinc-700 hover:bg-zinc-600 font-medium text-sm"
            >
              CONFIGURAÇÕES
            </Button>
            <Button
              onClick={() => setShowResetDialog(true)}
              disabled={isIdle && state.roundScoreRed === 0 && state.roundScoreBlue === 0}
              className="w-full h-10 bg-zinc-700 hover:bg-zinc-600 font-medium text-sm disabled:opacity-50"
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
              <span className={isTVOpen ? "text-green-400" : "text-zinc-500"}>
                {isTVOpen ? "ABERTA" : "FECHADA"}
              </span>
            </div>
            <Button
              onClick={onOpenTV}
              className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              <Monitor className="w-5 h-5 mr-2" />
              Abrir Placar TV
            </Button>
            <p className="text-xs text-zinc-500 text-center">
              Para tela cheia na TV, pressione F11
            </p>
          </div>
        </section>
      </aside>
      
      {/* End Match Dialog */}
      <AlertDialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
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
              onClick={actions.endMatch}
              className="bg-red-600 hover:bg-red-500"
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset Match Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
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
              onClick={actions.resetMatch}
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
