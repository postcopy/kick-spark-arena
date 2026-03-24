import {
  Play,
  Pause,
  RotateCcw,
  Stethoscope,
  List,
  Edit,
  XCircle,
  Monitor,
  Undo2,
  Settings,
  Volume2,
  VolumeX,
  QrCode,
  Share2,
  Copy,
  Check,
  Plug,
  SkipForward,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchState, MatchSide } from '@/types/championship';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ScoreAdjustDialog } from './ScoreAdjustDialog';
import { EventLogDialog } from './EventLogDialog';
import { DiagnosticsDialog } from './DiagnosticsDialog';
import { HardwarePanel } from './HardwarePanel';
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
  serialPort?: UseSerialPortReturn;
  diagnostics?: UseHardwareDiagnosticsReturn;
  onOpenConfig?: () => void;
  onExportShadowLog?: () => void;
  onThresholdsApplied?: (thresholds: import('@/types/hardwareDiagnostics').HardwareThresholds) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  matId?: number;
  academyId?: string;
  onOpenHardwareTest?: () => void;
  isTVOpen?: boolean;
}

export function OperatorPanel({ state, actions, onOpenTV, serialPort, diagnostics, onOpenConfig, onExportShadowLog, onThresholdsApplied, isMuted, onToggleMute, matId = 1, academyId, onOpenHardwareTest, isTVOpen }: OperatorPanelProps) {
  const [showEndMatchDialog, setShowEndMatchDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
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

  return (
    <>
      <aside className="w-[320px] bg-[hsl(var(--sulsport-dark))] border-l border-[hsl(var(--sulsport-gray))] h-full flex flex-col overflow-hidden">

        {/* ── HARDWARE ── */}
        {serialPort && (
          <HardwarePanel serialPort={serialPort} diagnostics={diagnostics} />
        )}

        {onOpenHardwareTest && serialPort && (
          <div className="px-3 pb-2">
            <Button
              onClick={onOpenHardwareTest}
              disabled={!serialPort.isConnected}
              className={cn(
                "w-full h-11 rounded-lg font-bold text-sm uppercase",
                serialPort.isConnected
                  ? "bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-600/40"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-600"
              )}
            >
              <Zap className="w-4 h-4 mr-1.5" />
              TESTE HARDWARE
            </Button>
          </div>
        )}

        {/* ── TEMPO ── */}
        <section className="px-3 pt-3 pb-2 border-b border-zinc-700/60 flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-emerald-400">
            <Play className="w-4 h-4" />
            TEMPO
          </h3>

          <div className="space-y-2">
            {/* PROXIMO ROUND / PULAR INTERVALO — appears above INICIAR when round ended */}
            {isRoundEnd && (
              state.round < state.config.maxRounds ||
              (state.roundWinsRed === state.roundWinsBlue && state.round >= state.config.maxRounds)
            ) && (
              <div>
                <Button
                  onClick={actions.nextRound}
                  className={cn(
                    "w-full h-14 rounded-lg text-base font-bold uppercase shadow-[0_0_15px_rgba(234,179,8,0.3)]",
                    state.isBreakTime
                      ? "bg-zinc-500 hover:bg-zinc-400 text-white"
                      : state.roundWinsRed === state.roundWinsBlue && state.round >= state.config.maxRounds
                        ? "bg-yellow-400 hover:bg-yellow-300 text-black"
                        : "bg-yellow-500 hover:bg-yellow-400 text-black"
                  )}
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  {state.isBreakTime
                    ? 'PULAR INTERVALO'
                    : state.roundWinsRed === state.roundWinsBlue && state.round >= state.config.maxRounds
                      ? 'GOLDEN ROUND'
                      : 'PROXIMO ROUND'}
                </Button>
              </div>
            )}

            {/* INICIAR ROUND — biggest button, green glow */}
            <div>
              <Button
                onClick={actions.startTimer}
                disabled={!canStart || !actions.hasConfig}
                className={cn(
                  "w-full h-14 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold uppercase disabled:opacity-50 transition-all",
                  canStart && actions.hasConfig && "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                )}
              >
                <Play className="w-5 h-5 mr-2" />
                {isMedical ? 'INICIAR TEMPO MEDICO' : state.isGoldenRound ? 'INICIAR GOLDEN ROUND' : 'INICIAR ROUND'}
              </Button>
              <p className="text-[10px] text-zinc-500 text-center mt-0.5">Espaco</p>
            </div>

            {/* PAUSAR + ZERAR — grid 2 cols */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Button
                  onClick={actions.pauseTimer}
                  disabled={!canPause}
                  className="w-full h-11 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold uppercase disabled:opacity-50"
                >
                  <Pause className="w-4 h-4 mr-1.5" />
                  PAUSAR
                </Button>
              </div>
              <div>
                <Button
                  onClick={actions.resetTime}
                  disabled={isRunning}
                  className="w-full h-11 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-bold uppercase disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  ZERAR
                </Button>
              </div>
            </div>

            {/* TEMPO MEDICO — full width */}
            <Button
              onClick={isMedical ? actions.endMedicalTime : actions.startMedicalTime}
              disabled={isMatchEnd}
              className={cn(
                "w-full h-11 rounded-lg font-bold text-sm uppercase disabled:opacity-50",
                isMedical
                  ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                  : "bg-orange-600/80 hover:bg-orange-500 text-white"
              )}
            >
              <Stethoscope className="w-4 h-4 mr-1.5" />
              {isMedical ? 'VOLTAR DA PAUSA MEDICA' : 'TEMPO MEDICO'}
            </Button>

            {/* DESFAZER */}
            <div>
              <Button
                onClick={actions.undoLast}
                disabled={!actions.canUndo}
                className="w-full h-11 rounded-lg bg-amber-700/50 border border-amber-500/40 text-amber-300 hover:bg-amber-700/70 text-sm font-bold uppercase disabled:opacity-50"
              >
                <Undo2 className="w-4 h-4 mr-1.5" />
                DESFAZER
              </Button>
              <p className="text-[10px] text-zinc-500 text-center mt-0.5">Ctrl+Z</p>
            </div>
          </div>
        </section>

        {/* ── LUTA ── */}
        <section className="px-3 pt-3 pb-2 border-b border-zinc-700/60 flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-zinc-400">
            <Settings className="w-4 h-4" />
            LUTA
          </h3>

          <div className="space-y-2">
            {/* CONFIGURAR + NOVA LUTA — grid 2 cols */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onOpenConfig}
                className="w-full h-11 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-bold uppercase"
              >
                <Settings className="w-4 h-4 mr-1.5" />
                CONFIGURAR
              </Button>
              <Button
                onClick={() => setShowResetDialog(true)}
                disabled={isIdle && state.roundScoreRed === 0 && state.roundScoreBlue === 0}
                className="w-full h-11 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-bold uppercase disabled:opacity-50"
              >
                NOVA LUTA
              </Button>
            </div>

            {/* VER EVENTOS + AJUSTAR PLACAR — small row */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowEventLog(true)}
                className="w-full h-10 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-bold uppercase"
              >
                <List className="w-3.5 h-3.5 mr-1" />
                VER EVENTOS
              </Button>
              <Button
                onClick={() => setShowScoreAdjust(true)}
                className="w-full h-10 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-bold uppercase"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                AJUSTAR PLACAR
              </Button>
            </div>

            {/* SOM toggle */}
            {onToggleMute && (
              <Button
                onClick={onToggleMute}
                className="w-full h-10 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm font-bold uppercase"
              >
                {isMuted
                  ? <><VolumeX className="w-4 h-4 mr-1.5" /> SOM: DESLIGADO</>
                  : <><Volume2 className="w-4 h-4 mr-1.5" /> SOM: LIGADO</>
                }
              </Button>
            )}

            {/* ABRIR PLACAR TV */}
            <Button
              onClick={onOpenTV}
              className={cn(
                "w-full h-11 rounded-lg text-sm font-bold uppercase",
                isTVOpen
                  ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30"
                  : "bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30"
              )}
            >
              <Monitor className="w-4 h-4 mr-1.5" />
              {isTVOpen ? 'TV ABERTA \u2713' : 'ABRIR PLACAR TV'}
            </Button>

            {/* PLACAR CELULAR */}
            <Button
              onClick={() => setShowShareDialog(true)}
              className="w-full h-11 rounded-lg bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-500/20 text-sm font-bold uppercase"
            >
              <QrCode className="w-4 h-4 mr-1.5" />
              PLACAR CELULAR
            </Button>
          </div>
        </section>

        {/* Spacer to push ENCERRAR to bottom */}
        <div className="flex-1" />

        {/* ── ENCERRAR LUTA — isolated at bottom ── */}
        <section className="px-3 py-3 flex-shrink-0">
          <Button
            onClick={() => setShowEndMatchDialog(true)}
            disabled={isMatchEnd}
            className="w-full h-12 rounded-lg bg-zinc-800 border-2 border-red-500/50 text-red-400 hover:bg-red-950 text-sm font-bold uppercase disabled:opacity-50"
          >
            <XCircle className="w-5 h-5 mr-2" />
            ENCERRAR LUTA
          </Button>
        </section>
      </aside>

      {/* End Match Dialog */}
      <AlertDialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Encerrar Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta acao encerrara a luta atual. O placar sera mantido para registro.
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
              Isso ira zerar todo o placar e iniciar uma nova luta com as mesmas configuracoes.
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

      {/* Share Live Score Dialog */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-center">Placar ao Vivo no Celular</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-center">
              Escaneie o QR Code ou compartilhe o link para acompanhar o placar em tempo real pelo navegador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(() => {
            const LIVE_BASE_URL = 'https://spe-sulsport.vercel.app';
            const liveUrl = `${LIVE_BASE_URL}/#/live?mat=${matId}${academyId ? `&aid=${academyId}` : ''}`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(liveUrl)}&bgcolor=18181b&color=ffffff`;
            return (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="bg-zinc-800 rounded-xl p-3">
                  <img
                    src={qrApiUrl}
                    alt="QR Code para placar ao vivo"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
                <div className="w-full flex items-center gap-2 bg-zinc-800 rounded-lg p-2">
                  <input
                    type="text"
                    readOnly
                    value={liveUrl}
                    className="flex-1 bg-transparent text-xs text-zinc-300 font-mono outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(liveUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="shrink-0 p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    title="Copiar link"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={() => {
                      navigator.share({
                        title: `Placar ao Vivo — Quadra ${matId}`,
                        text: 'Acompanhe o placar em tempo real!',
                        url: liveUrl,
                      }).catch(() => {});
                    }}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar via...
                  </button>
                )}
                <p className="text-[10px] text-zinc-600 text-center">
                  O celular precisa estar na mesma rede WiFi ou com acesso a internet.
                </p>
              </div>
            );
          })()}
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600 w-full">
              Fechar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
