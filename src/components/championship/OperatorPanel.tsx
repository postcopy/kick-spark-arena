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
  SkipForward,
  Zap,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchState, MatchSide, MatchEvent } from '@/types/championship';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
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

/**
 * OperatorPanel — sidebar da mesa (modo competição).
 *
 * spe-ui-design §3/§P7: consciência situacional (round/wins/faltas/último evento
 * sempre visíveis no topo) + CTA contextual única (state machine determina a
 * ação primária em vez de listar botões competindo). Tokens WT, retangular,
 * sem glow. Atalhos de teclado visíveis no rodapé (federativo precisa de
 * cheat sheet sob pressão).
 */
export function OperatorPanel({
  state,
  actions,
  onOpenTV,
  serialPort,
  diagnostics,
  onOpenConfig,
  onThresholdsApplied,
  isMuted,
  onToggleMute,
  matId = 1,
  academyId,
  onOpenHardwareTest,
  isTVOpen,
}: OperatorPanelProps) {
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
  const isBreak = !!state.isBreakTime;

  const showNextRound =
    isRoundEnd &&
    (state.round < state.config.maxRounds ||
      (state.roundWinsRed === state.roundWinsBlue && state.round >= state.config.maxRounds));

  const maxGamjeom = state.config.maxGamjeom;
  const nextRoundLabel = isBreak
    ? 'Pular intervalo'
    : state.roundWinsRed === state.roundWinsBlue && state.round >= state.config.maxRounds
    ? 'Golden round'
    : 'Próximo round';

  return (
    <>
      <aside className="w-[336px] bg-wt-bg-secondary border-l border-wt-divider h-full flex flex-col overflow-hidden font-display select-none">
        {/* ── SITUATIONAL AWARENESS BANNER ── */}
        <StateBanner
          state={state}
          isRunning={isRunning}
          isPaused={isPaused}
          isIdle={isIdle}
          isMedical={isMedical}
          isBreak={isBreak}
          isRoundEnd={isRoundEnd}
          isMatchEnd={isMatchEnd}
          hasConfig={actions.hasConfig}
          maxGamjeom={maxGamjeom}
        />

        {/* ── PRIMARY CTA + UNDO (highest density) ── */}
        <section className="px-3 pt-3 pb-3 border-b border-wt-divider flex-shrink-0">
          <PrimaryActionButton
            isIdle={isIdle}
            isRunning={isRunning}
            isPaused={isPaused}
            isMedical={isMedical}
            isBreak={isBreak}
            isRoundEnd={isRoundEnd}
            isMatchEnd={isMatchEnd}
            showNextRound={showNextRound}
            hasConfig={actions.hasConfig}
            nextRoundLabel={nextRoundLabel}
            onStart={actions.startTimer}
            onPause={actions.pauseTimer}
            onNextRound={actions.nextRound}
            onEndMedical={actions.endMedicalTime}
            onOpenConfig={onOpenConfig}
            onOpenReset={() => setShowResetDialog(true)}
          />

          {/* UNDO — prominence proporcional ao estado. Quando há undo disponível,
              ganha borda dourada (§P2 manual indicator). Quando vazio, secundário. */}
          <div className="mt-2">
            <Button
              onClick={actions.undoLast}
              disabled={!actions.canUndo}
              className={cn(
                'w-full h-11 rounded-none border font-bold uppercase transition-colors',
                'text-xs tracking-[0.2em]',
                'disabled:opacity-35 disabled:cursor-not-allowed',
                actions.canUndo
                  ? 'bg-wt-manual/10 border-wt-manual/60 text-wt-manual hover:bg-wt-manual/20'
                  : 'bg-wt-bg-tertiary border-wt-divider text-wt-fg-muted',
              )}
            >
              <Undo2 className="w-4 h-4 mr-2" strokeWidth={2} />
              Desfazer última
              <span className="ml-auto text-[10px] font-mono tracking-widest opacity-70">
                CTRL+Z
              </span>
            </Button>
          </div>
        </section>

        {/* ── SECONDARY TIME CONTROLS ── */}
        <section className="px-3 pt-3 pb-3 border-b border-wt-divider flex-shrink-0">
          <SectionHeader label="Tempo" />

          <div className="grid grid-cols-2 gap-[2px] mb-[2px]">
            <Button
              onClick={actions.pauseTimer}
              disabled={!isRunning}
              className="h-9 rounded-none bg-wt-bg-tertiary border border-wt-divider hover:bg-wt-bg-tertiary/70 text-wt-fg-primary text-[11px] font-bold uppercase tracking-wider disabled:opacity-30"
            >
              <Pause className="w-3 h-3 mr-1" strokeWidth={2.2} />
              Pausar
            </Button>
            <Button
              onClick={actions.resetTime}
              disabled={isRunning}
              className="h-9 rounded-none bg-wt-bg-tertiary border border-wt-divider hover:bg-wt-bg-tertiary/70 text-wt-fg-primary text-[11px] font-bold uppercase tracking-wider disabled:opacity-30"
            >
              <RotateCcw className="w-3 h-3 mr-1" strokeWidth={2.2} />
              Zerar
            </Button>
          </div>

          <Button
            onClick={isMedical ? actions.endMedicalTime : actions.startMedicalTime}
            disabled={isMatchEnd || isIdle}
            className={cn(
              'w-full h-9 rounded-none border text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-30',
              isMedical
                ? 'bg-wt-warning/15 border-wt-warning/60 text-wt-warning hover:bg-wt-warning/25'
                : 'bg-wt-bg-tertiary border-wt-divider text-wt-fg-secondary hover:bg-wt-bg-tertiary/70',
            )}
          >
            <Stethoscope className="w-3 h-3 mr-1" strokeWidth={2.2} />
            {isMedical ? 'Encerrar pausa médica' : 'Pausa médica'}
            <span className="ml-auto text-[10px] font-mono opacity-70">[M]</span>
          </Button>
        </section>

        {/* ── HARDWARE ── */}
        {serialPort && (
          <section className="border-b border-wt-divider flex-shrink-0">
            <HardwarePanel serialPort={serialPort} diagnostics={diagnostics} />
            {onOpenHardwareTest && (
              <div className="px-3 pb-3">
                <Button
                  onClick={onOpenHardwareTest}
                  disabled={!serialPort.isConnected}
                  className={cn(
                    'w-full h-9 rounded-none border font-bold text-[11px] uppercase tracking-[0.2em] transition-colors',
                    serialPort.isConnected
                      ? 'bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70'
                      : 'bg-wt-bg-tertiary/40 border-wt-divider text-wt-fg-muted',
                  )}
                >
                  <Zap className="w-3 h-3 mr-1" strokeWidth={2.2} />
                  Teste de hardware
                </Button>
              </div>
            )}
          </section>
        )}

        {/* ── MANAGE ── */}
        <section className="px-3 pt-3 pb-3 border-b border-wt-divider flex-shrink-0">
          <SectionHeader label="Gerenciar" />

          <div className="grid grid-cols-2 gap-[2px] mb-[2px]">
            <Button
              onClick={onOpenConfig}
              className="h-9 rounded-none bg-wt-bg-tertiary border border-wt-divider hover:bg-wt-bg-tertiary/70 text-wt-fg-primary text-[11px] font-bold uppercase tracking-wider"
            >
              <Settings className="w-3 h-3 mr-1" strokeWidth={2.2} />
              Config
            </Button>
            <Button
              onClick={() => setShowEventLog(true)}
              className="h-9 rounded-none bg-wt-bg-tertiary border border-wt-divider hover:bg-wt-bg-tertiary/70 text-wt-fg-primary text-[11px] font-bold uppercase tracking-wider"
            >
              <List className="w-3 h-3 mr-1" strokeWidth={2.2} />
              Eventos
            </Button>
          </div>

          <Button
            onClick={() => setShowScoreAdjust(true)}
            className="w-full h-9 rounded-none bg-wt-bg-tertiary border border-wt-divider hover:bg-wt-bg-tertiary/70 text-wt-fg-secondary text-[11px] font-bold uppercase tracking-wider"
          >
            <Edit className="w-3 h-3 mr-1" strokeWidth={2.2} />
            Ajustar placar
          </Button>
        </section>

        {/* ── BROADCAST & OUTPUT ── */}
        <section className="px-3 pt-3 pb-3 border-b border-wt-divider flex-shrink-0">
          <SectionHeader label="Broadcast" />

          <Button
            onClick={onOpenTV}
            className={cn(
              'w-full h-10 rounded-none border text-xs font-bold uppercase tracking-wider transition-colors mb-[2px]',
              isTVOpen
                ? 'bg-wt-success/15 border-wt-success/50 text-wt-success hover:bg-wt-success/25'
                : 'bg-chung-bg border-chung/50 text-chung-accent hover:bg-chung-bg/70',
            )}
          >
            <Monitor className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.2} />
            {isTVOpen ? 'TV aberta' : 'Abrir placar TV'}
          </Button>

          <div className="grid grid-cols-2 gap-[2px]">
            <Button
              onClick={() => setShowShareDialog(true)}
              className="h-9 rounded-none bg-wt-bg-tertiary border border-wt-divider hover:bg-wt-bg-tertiary/70 text-wt-fg-secondary text-[11px] font-bold uppercase tracking-wider"
            >
              <QrCode className="w-3 h-3 mr-1" strokeWidth={2.2} />
              Celular
            </Button>
            {onToggleMute && (
              <Button
                onClick={onToggleMute}
                className="h-9 rounded-none bg-wt-bg-tertiary border border-wt-divider hover:bg-wt-bg-tertiary/70 text-wt-fg-secondary text-[11px] font-bold uppercase tracking-wider"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3 h-3 mr-1" strokeWidth={2.2} />
                    Mudo
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 mr-1" strokeWidth={2.2} />
                    Som
                  </>
                )}
              </Button>
            )}
          </div>
        </section>

        {/* Flex spacer pra empurrar danger zone pro fundo */}
        <div className="flex-1 min-h-[8px]" />

        {/* ── KEYBOARD CHEAT SHEET ── */}
        <KeyboardLegend />

        {/* ── DANGER ZONE ── */}
        <section className="px-3 py-3 flex-shrink-0 border-t border-wt-divider grid grid-cols-2 gap-[2px]">
          <Button
            onClick={() => setShowResetDialog(true)}
            disabled={isIdle && state.roundScoreRed === 0 && state.roundScoreBlue === 0}
            className="h-10 rounded-none bg-transparent border border-wt-warning/40 text-wt-warning hover:bg-wt-warning/10 text-[11px] font-bold uppercase tracking-[0.2em] disabled:opacity-30"
          >
            <RotateCcw className="w-3 h-3 mr-1" strokeWidth={2.2} />
            Nova luta
          </Button>
          <Button
            onClick={() => setShowEndMatchDialog(true)}
            disabled={isMatchEnd}
            className="h-10 rounded-none bg-transparent border border-wt-danger/50 text-wt-danger hover:bg-wt-danger/10 text-[11px] font-bold uppercase tracking-[0.2em] disabled:opacity-30"
          >
            <XCircle className="w-3 h-3 mr-1" strokeWidth={2.2} />
            Encerrar
          </Button>
        </section>
      </aside>

      {/* End Match Dialog */}
      <AlertDialog open={showEndMatchDialog} onOpenChange={setShowEndMatchDialog}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-wt-fg-primary uppercase tracking-wider">
              Encerrar luta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary">
              Esta ação encerrará a luta atual. O placar será mantido para registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                actions.endMatch();
                setShowEndMatchDialog(false);
              }}
              className="bg-wt-danger text-white hover:bg-wt-danger/90 rounded-none uppercase tracking-wider text-xs font-bold"
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Match Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-wt-fg-primary uppercase tracking-wider">
              Nova luta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary">
              Isso irá zerar todo o placar e iniciar uma nova luta com as mesmas configurações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                actions.resetMatch();
                setShowResetDialog(false);
              }}
              className="bg-wt-warning text-black hover:bg-wt-warning/90 rounded-none uppercase tracking-wider text-xs font-bold"
            >
              Nova luta
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
      <EventLogDialog open={showEventLog} onOpenChange={setShowEventLog} events={state.events} />

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
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider max-w-sm rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-wt-fg-primary text-center uppercase tracking-wider">
              Placar ao vivo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary text-center">
              Escaneie o QR Code ou compartilhe o link para acompanhar o placar em tempo real.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(() => {
            const LIVE_BASE_URL = 'https://spe-sulsport.vercel.app';
            const liveUrl = `${LIVE_BASE_URL}/#/live?mat=${matId}${
              academyId ? `&aid=${academyId}` : ''
            }`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              liveUrl,
            )}&bgcolor=0A0A0A&color=FAFAFA`;
            return (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="bg-wt-bg border border-wt-divider p-3">
                  <img
                    src={qrApiUrl}
                    alt="QR Code para placar ao vivo"
                    width={200}
                    height={200}
                  />
                </div>
                <div className="w-full flex items-center gap-2 bg-wt-bg border border-wt-divider p-2">
                  <input
                    type="text"
                    readOnly
                    value={liveUrl}
                    className="flex-1 bg-transparent text-xs text-wt-fg-secondary font-mono outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(liveUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="shrink-0 p-1.5 hover:bg-wt-bg-tertiary text-wt-fg-muted hover:text-wt-fg-primary transition-colors"
                    title="Copiar link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-wt-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={() => {
                      navigator
                        .share({
                          title: `Placar ao Vivo — Quadra ${matId}`,
                          text: 'Acompanhe o placar em tempo real!',
                          url: liveUrl,
                        })
                        .catch(() => {});
                    }}
                    className="flex items-center gap-2 text-xs text-chung-accent hover:text-chung-accent/80 transition-colors uppercase tracking-wider font-bold"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartilhar
                  </button>
                )}
                <p className="text-[10px] text-wt-fg-muted text-center">
                  Celular precisa estar na mesma rede WiFi ou com acesso à internet.
                </p>
              </div>
            );
          })()}
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 w-full rounded-none uppercase tracking-wider text-xs font-bold">
              Fechar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SITUATIONAL AWARENESS BANNER
// ─────────────────────────────────────────────────────────────────────
// Topo do painel. Densidade de Tufte — 4 informações em um bloco:
// round atual, status, vitórias acumuladas por round, faltas por lado +
// último evento inline. Operador lê de relance sem cruzar com scoreboard.
// ─────────────────────────────────────────────────────────────────────

interface StateBannerProps {
  state: MatchState;
  isRunning: boolean;
  isPaused: boolean;
  isIdle: boolean;
  isMedical: boolean;
  isBreak: boolean;
  isRoundEnd: boolean;
  isMatchEnd: boolean;
  hasConfig: boolean;
  maxGamjeom: number;
}

function StateBanner({
  state,
  isRunning,
  isPaused,
  isMedical,
  isBreak,
  isRoundEnd,
  isMatchEnd,
  hasConfig,
  maxGamjeom,
}: StateBannerProps) {
  // Status label + stripe color
  const status = useMemo(() => {
    if (isMatchEnd) return { label: 'Fim da luta', stripe: 'bg-wt-danger', text: 'text-wt-danger' };
    if (isMedical) return { label: 'Pausa médica', stripe: 'bg-wt-warning', text: 'text-wt-warning' };
    if (isBreak) return { label: 'Intervalo', stripe: 'bg-wt-warning', text: 'text-wt-warning' };
    if (isRoundEnd) return { label: 'Fim do round', stripe: 'bg-wt-manual', text: 'text-wt-manual' };
    if (isRunning) return { label: 'Rodando', stripe: 'bg-wt-success', text: 'text-wt-success' };
    if (isPaused) return { label: 'Pausado', stripe: 'bg-wt-fg-muted', text: 'text-wt-fg-muted' };
    if (!hasConfig) return { label: 'Aguardando config', stripe: 'bg-wt-manual', text: 'text-wt-manual' };
    return { label: 'Pronto', stripe: 'bg-wt-fg-secondary', text: 'text-wt-fg-secondary' };
  }, [isMatchEnd, isMedical, isBreak, isRoundEnd, isRunning, isPaused, hasConfig]);

  const roundLabel = state.isGoldenRound
    ? 'GOLDEN'
    : `R${state.round}`;

  const bestOf = state.config.maxRounds === 3 ? 3 : 1;

  return (
    <section className="relative border-b border-wt-divider flex-shrink-0">
      {/* Stripe superior — cor do estado atual (§P6 cor com função) */}
      <div className={cn('h-[2px]', status.stripe)} />

      <div className="px-3 py-3 space-y-2.5">
        {/* Linha 1 — ROUND + STATUS */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-wt-fg-muted">
              Round
            </span>
            <span className="text-2xl font-black text-wt-fg-primary tabular-nums leading-none">
              {roundLabel}
            </span>
            {bestOf === 3 && !state.isGoldenRound && (
              <span className="text-[10px] font-mono text-wt-fg-muted tabular-nums">
                /{bestOf}
              </span>
            )}
          </div>
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-[0.25em]',
              status.text,
            )}
          >
            {status.label}
          </span>
        </div>

        {/* Linha 2 — VITÓRIAS por round (quando best-of-3) */}
        {bestOf === 3 && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted">
              Vitórias
            </span>
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="text-chung-accent font-black">{state.roundWinsBlue}</span>
              <span className="text-wt-fg-muted">×</span>
              <span className="text-hong-accent font-black">{state.roundWinsRed}</span>
            </div>
          </div>
        )}

        {/* Linha 3 — FALTAS (gam-jeom mirror) */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted">
            Faltas
          </span>
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <GamjeomCount count={state.gamjeomBlue} limit={maxGamjeom} side="chung" />
            <span className="text-wt-fg-muted">·</span>
            <GamjeomCount count={state.gamjeomRed} limit={maxGamjeom} side="hong" />
          </div>
        </div>
      </div>

      {/* Último evento — inline, legível, sem precisar abrir dialog */}
      <LastEventStrip event={state.lastEvent} />
    </section>
  );
}

function GamjeomCount({
  count,
  limit,
  side,
}: {
  count: number;
  limit: number;
  side: 'chung' | 'hong';
}) {
  const color = side === 'chung' ? 'text-chung-accent' : 'text-hong-accent';
  const isWarn = count >= Math.max(1, limit - 2);
  return (
    <span className="inline-flex items-baseline gap-[3px]">
      <span className={cn('font-black', color, isWarn && count > 0 && 'text-wt-warning')}>
        {count}
      </span>
      <span className="text-wt-fg-muted text-[9px]">/{limit}</span>
    </span>
  );
}

// Barra de último evento — feedback <150ms (§P7). Cor da faixa = lado
// que sofreu/aplicou o evento.
function LastEventStrip({ event }: { event?: MatchEvent }) {
  if (!event) {
    return (
      <div className="border-t border-wt-divider px-3 py-2 bg-wt-bg/40">
        <div className="flex items-center gap-2 text-wt-fg-muted">
          <Activity className="w-3 h-3 opacity-60" strokeWidth={2} />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">
            Aguardando evento
          </span>
        </div>
      </div>
    );
  }

  const sideColor =
    event.side === 'BLUE'
      ? 'text-chung-accent'
      : event.side === 'RED'
      ? 'text-hong-accent'
      : 'text-wt-fg-secondary';

  const sideStripe =
    event.side === 'BLUE'
      ? 'bg-chung'
      : event.side === 'RED'
      ? 'bg-hong'
      : 'bg-wt-divider';

  const timeStr = new Date(event.ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="relative border-t border-wt-divider px-3 py-2 bg-wt-bg/40">
      <div className={cn('absolute left-0 top-0 bottom-0 w-[2px]', sideStripe)} />
      <div className="flex items-center justify-between gap-2 pl-1">
        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
          <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-wt-fg-muted">
            Último
          </span>
          <span className={cn('text-[12px] font-bold uppercase truncate', sideColor)}>
            {event.description}
          </span>
        </div>
        <span className="text-[10px] font-mono tabular-nums text-wt-fg-muted shrink-0">
          {timeStr}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PRIMARY ACTION — CTA contextual única
// ─────────────────────────────────────────────────────────────────────
// State machine resolve qual botão mostrar. Operador sob pressão não
// escolhe entre Iniciar/Pausar/Continuar cinzentos — vê UM CTA grande
// com a ação que faz sentido agora.
// ─────────────────────────────────────────────────────────────────────

interface PrimaryActionButtonProps {
  isIdle: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isMedical: boolean;
  isBreak: boolean;
  isRoundEnd: boolean;
  isMatchEnd: boolean;
  showNextRound: boolean;
  hasConfig: boolean;
  nextRoundLabel: string;
  onStart: () => void;
  onPause: () => void;
  onNextRound: () => void;
  onEndMedical: () => void;
  onOpenConfig?: () => void;
  onOpenReset: () => void;
}

function PrimaryActionButton(props: PrimaryActionButtonProps) {
  const cta = resolvePrimaryCta(props);

  return (
    <div>
      <Button
        onClick={cta.onClick}
        disabled={cta.disabled}
        className={cn(
          'w-full h-[60px] rounded-none border-2 font-black uppercase tracking-[0.15em] transition-colors',
          'text-base',
          'disabled:opacity-35 disabled:cursor-not-allowed',
          cta.variant,
        )}
      >
        {cta.icon}
        <span className="ml-2">{cta.label}</span>
      </Button>
      <div className="mt-1 flex items-center justify-between px-0.5">
        <span className="text-[10px] text-wt-fg-muted uppercase tracking-[0.3em] font-bold">
          {cta.sublabel}
        </span>
        {cta.shortcut && (
          <span className="text-[10px] font-mono text-wt-fg-muted tracking-widest">
            {cta.shortcut}
          </span>
        )}
      </div>
    </div>
  );
}

interface CtaResolution {
  label: string;
  sublabel: string;
  shortcut?: string;
  icon: React.ReactNode;
  variant: string;
  onClick: () => void;
  disabled?: boolean;
}

function resolvePrimaryCta(props: PrimaryActionButtonProps): CtaResolution {
  const {
    isIdle,
    isRunning,
    isPaused,
    isMedical,
    isBreak,
    isRoundEnd,
    isMatchEnd,
    showNextRound,
    hasConfig,
    nextRoundLabel,
    onStart,
    onPause,
    onNextRound,
    onEndMedical,
    onOpenConfig,
    onOpenReset,
  } = props;

  // 1. Fim de luta → Nova luta
  if (isMatchEnd) {
    return {
      label: 'Nova luta',
      sublabel: 'Encerrar e começar de novo',
      icon: <RotateCcw className="w-5 h-5" strokeWidth={2.5} />,
      variant: 'bg-wt-warning/15 border-wt-warning text-wt-warning hover:bg-wt-warning/25',
      onClick: onOpenReset,
    };
  }

  // 2. Pausa médica ativa → Encerrar médica
  if (isMedical) {
    return {
      label: 'Encerrar médica',
      sublabel: 'Retomar luta',
      shortcut: '[M]',
      icon: <Stethoscope className="w-5 h-5" strokeWidth={2.5} />,
      variant: 'bg-wt-warning/15 border-wt-warning text-wt-warning hover:bg-wt-warning/25',
      onClick: onEndMedical,
    };
  }

  // 3. Fim de round (e tem próximo) → Próximo round / Golden / Pular intervalo
  if (isRoundEnd && showNextRound) {
    return {
      label: nextRoundLabel,
      sublabel: isBreak ? 'Ir direto pro próximo round' : 'Iniciar próximo round',
      shortcut: '[N]',
      icon: <SkipForward className="w-5 h-5" strokeWidth={2.5} />,
      variant: 'bg-wt-manual/15 border-wt-manual text-wt-manual hover:bg-wt-manual/25',
      onClick: onNextRound,
    };
  }

  // 4. Fim de round sem próximo (empate, aguarda decisão árbitro) → aviso
  if (isRoundEnd) {
    return {
      label: 'Aguardando decisão',
      sublabel: 'Empate — usar botões no placar',
      icon: <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />,
      variant: 'bg-wt-manual/10 border-wt-manual/60 text-wt-manual',
      onClick: () => {},
      disabled: true,
    };
  }

  // 5. Rodando → Pausar
  if (isRunning) {
    return {
      label: 'Pausar',
      sublabel: 'Interromper round',
      shortcut: '[Espaço]',
      icon: <Pause className="w-5 h-5" strokeWidth={2.5} />,
      variant: 'bg-wt-warning/15 border-wt-warning text-wt-warning hover:bg-wt-warning/25',
      onClick: onPause,
    };
  }

  // 6. Pausado → Continuar
  if (isPaused) {
    return {
      label: 'Continuar',
      sublabel: 'Retomar round',
      shortcut: '[Espaço]',
      icon: <Play className="w-5 h-5" strokeWidth={2.5} />,
      variant: 'bg-wt-success/20 border-wt-success text-wt-success hover:bg-wt-success/30',
      onClick: onStart,
    };
  }

  // 7. Idle sem config → Configurar
  if (isIdle && !hasConfig) {
    return {
      label: 'Configurar luta',
      sublabel: 'Necessário antes de iniciar',
      icon: <Settings className="w-5 h-5" strokeWidth={2.5} />,
      variant: 'bg-wt-manual/15 border-wt-manual text-wt-manual hover:bg-wt-manual/25',
      onClick: onOpenConfig || (() => {}),
      disabled: !onOpenConfig,
    };
  }

  // 8. Idle com config → Iniciar round
  return {
    label: 'Iniciar round',
    sublabel: 'Começar cronômetro',
    shortcut: '[Espaço]',
    icon: <Play className="w-5 h-5" strokeWidth={2.5} />,
    variant: 'bg-wt-success/20 border-wt-success text-wt-success hover:bg-wt-success/30',
    onClick: onStart,
  };
}

// ─────────────────────────────────────────────────────────────────────
// KEYBOARD LEGEND — cheat sheet sempre visível
// ─────────────────────────────────────────────────────────────────────
// Operador federativo sob pressão precisa de referência visível, não
// embaixo de cada botão. Uma linha compacta com os 4 shortcuts mais
// usados no fluxo de luta.
// ─────────────────────────────────────────────────────────────────────

function KeyboardLegend() {
  return (
    <section className="px-3 py-2.5 border-t border-wt-divider bg-wt-bg/30 flex-shrink-0">
      <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted mb-1.5">
        Atalhos
      </div>
      <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-[10px] font-mono tabular-nums">
        <KeyHint k="1–5" label="Pontuar chung" />
        <KeyHint k="⇧+1–5" label="Pontuar hong" />
        <KeyHint k="F1 / F2" label="Falta ch/hg" />
        <KeyHint k="Espaço" label="Iniciar/pausar" />
        <KeyHint k="N" label="Próximo round" />
        <KeyHint k="M" label="Pausa médica" />
      </div>
    </section>
  );
}

function KeyHint({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="inline-block px-1 py-0 border border-wt-divider bg-wt-bg-tertiary text-wt-fg-primary text-[9px] tracking-wider leading-[14px] shrink-0">
        {k}
      </span>
      <span className="text-wt-fg-muted text-[10px] uppercase tracking-wider truncate font-sans">
        {label}
      </span>
    </div>
  );
}

// ─── Section header ───

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-[10px] font-bold text-wt-fg-secondary uppercase tracking-[0.25em] mb-2">
      {label}
    </h3>
  );
}
