// QuickMatchLayout — Modo Rápido (BÁSICO) consolidado numa tela só.
// Fila no topo (só "ATUAL" no modo básico sem torneio), painéis azul/vermelho
// gigantes, timer circular central e modal de resultado inline no MATCH_END.
// Toda engine de pontuação, sync, impactos e keyboard continuam no wrapper
// ChampionshipMatInner — este componente é puramente apresentação.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Monitor,
  Settings,
  Home,
  ArrowRight,
  ArrowLeft,
  Power,
  Trophy,
  Stethoscope,
  HelpCircle,
  Undo2,
  ListOrdered,
  Plus,
  X,
  QrCode,
  Share2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ClipboardList,
  Edit3,
  ArrowLeftRight,
  Radio,
  RadioTower,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMatchQueue, type QueueEntry } from '@/hooks/useMatchQueue';
import { StrikeIcon, type StrikeType } from './StrikeIcon';
import { getScoreValue, type MatchState, type MatchSide, type ScoreType, type MatchEvent } from '@/types/championship';
import { EventLogDialog } from './EventLogDialog';
import { ScoreAdjustDialog } from './ScoreAdjustDialog';
import logoSpe from '@/assets/logo-spe-branca.png';

// ─── Types ───

interface QuickActions {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTime: () => void;
  nextRound: () => void;
  endMatch: () => void;
  resetMatch: () => void;
  addScore: (side: MatchSide, type: ScoreType) => void;
  addGamjeom: (side: MatchSide) => void;
  removeGamjeom?: (side: MatchSide) => void;
  adjustScore?: (side: MatchSide, roundScore: number, gamjeom: number) => void;
  reverseSides?: () => void;
  startMedicalTime?: () => void;
  endMedicalTime?: () => void;
  undoLast: () => void;
  canUndo: boolean;
  saveConfig: (config: MatchState['config']) => void;
}

interface QuickMatchLayoutProps {
  state: MatchState;
  actions: QuickActions;
  serialPortConnected: boolean;
  serialPortConnecting: boolean;
  onConnectUsb: () => void;
  hwFlash: 'red' | 'blue' | null;
  blockedImpactWarning: boolean;
  onOpenTV: () => void;
  onOpenConfig: () => void;
  onOpenHardwareTest: () => void;
  onOpenHelp: () => void;
  onBack: () => void;
  matId: number;
  academyId?: string;
  isTVOpen?: boolean;

  /**
   * Quando true, troca rótulos/paleta pro modo competição profissional:
   * badge "● AO VIVO" (vermelho) no lugar de "● TREINO" (verde),
   * subtítulo exibe categoria + MAT no lugar de "LUTA AO VIVO".
   * Não altera lógica de scoring/sync — apenas apresentação.
   */
  competitionMode?: boolean;
  /** Rótulo da categoria (ex: "SENIOR M -68kg"). Só usado quando competitionMode=true. */
  categoryLabel?: string;

  /** Histórico de eventos pra Log. Se ausente, botão de log fica oculto. */
  events?: MatchEvent[];
  /** Estado do mute de áudio. Se ausente, botão de mute fica oculto. */
  isMuted?: boolean;
  onToggleMute?: () => void;

  /** Estado do "clean broadcast" da TV (FOB). Se ausente, botão fica oculto. */
  tvCleanMode?: boolean;
  onToggleTvCleanMode?: () => void;
}

// Score type metadata (icon + label + keyboard shortcut)
const SCORE_ROW_ORDER: ScoreType[] = ['SPIN_HEAD', 'HEAD', 'SPIN_BODY', 'BODY', 'PUNCH'];

const SCORE_META: Record<ScoreType, { label: string; short: string; strike: StrikeType | null }> = {
  SPIN_HEAD: { label: 'GIRO CABEÇA', short: 'GH', strike: 'spinHead' },
  HEAD: { label: 'CABEÇA', short: 'H', strike: 'head' },
  SPIN_BODY: { label: 'GIRO CORPO', short: 'GB', strike: 'spinBody' },
  BODY: { label: 'CORPO', short: 'B', strike: 'body' },
  PUNCH: { label: 'SOCO', short: 'P', strike: 'punch' },
  GAMJEOM: { label: 'GAM-JEOM', short: 'GJ', strike: null },
};

const SCORE_KEY_DIGIT: Record<ScoreType, string> = {
  PUNCH: '1',
  BODY: '2',
  HEAD: '3',
  SPIN_BODY: '4',
  SPIN_HEAD: '5',
  GAMJEOM: '',
};

const SCORE_EVENT_TYPES = new Set<ScoreType>(['PUNCH', 'BODY', 'HEAD', 'SPIN_BODY', 'SPIN_HEAD']);

// ─── Main component ───

export function QuickMatchLayout({
  state,
  actions,
  serialPortConnected,
  serialPortConnecting,
  onConnectUsb,
  hwFlash,
  blockedImpactWarning,
  onOpenTV,
  onOpenConfig,
  onOpenHardwareTest,
  onOpenHelp,
  onBack,
  matId,
  academyId,
  isTVOpen: _isTVOpen,
  competitionMode = false,
  categoryLabel,
  events,
  isMuted,
  onToggleMute,
  tvCleanMode,
  onToggleTvCleanMode,
}: QuickMatchLayoutProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showQueueDialog, setShowQueueDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [showScoreAdjust, setShowScoreAdjust] = useState(false);
  const [showReverseConfirm, setShowReverseConfirm] = useState(false);
  const { queue, add: addToQueue, remove: removeFromQueue, clear: clearQueue, shift: shiftQueue } = useMatchQueue(matId);

  const isRunning = state.status === 'RUNNING';
  const isMatchEnd = state.status === 'MATCH_END';
  const isRoundEnd = state.status === 'ROUND_END';
  const isBreak = isRoundEnd && !!state.isBreakTime;

  // Auto-open result modal on MATCH_END (including initial mount)
  const prevStatusRef = useRef<MatchState['status'] | null>(null);
  useEffect(() => {
    if (state.status === 'MATCH_END' && prevStatusRef.current !== 'MATCH_END') {
      setShowResultModal(true);
    }
    if (state.status !== 'MATCH_END') {
      setShowResultModal(false);
    }
    prevStatusRef.current = state.status;
  }, [state.status]);

  const blueScore = state.roundScoreBlue;
  const redScore = state.roundScoreRed;
  const leading: 'BLUE' | 'RED' | null =
    blueScore > redScore ? 'BLUE' : redScore > blueScore ? 'RED' : null;

  // Durante intervalo, o ring exibe o countdown do break (operador precisa
  // ver que a luta esta em intervalo, nao um 0:00 estatico confuso).
  const displayMs = isBreak ? (state.breakTimeLeftMs || 0) : state.timeLeftMs;
  const displayTotal = isBreak ? (state.config.breakTimeMs || 60000) : state.config.roundTimeMs;
  const timerSeconds = Math.max(0, Math.ceil(displayMs / 1000));
  const totalSeconds = Math.max(1, Math.round(displayTotal / 1000));
  const critical = timerSeconds <= 10 && isRunning;

  // Fallback vazio — o topo do painel já exibe "CHUNG"/"HONG" como label.
  // Quando não há atleta configurado, mostra "—" pra evitar duplicar
  // "CHUNG (AZUL)" embaixo de um título que já diz CHUNG.
  const blueName = state.config.athleteBlue?.name || '—';
  const blueCountry = state.config.athleteBlue?.country || '';
  const redName = state.config.athleteRed?.name || '—';
  const redCountry = state.config.athleteRed?.country || '';

  const winner: 'BLUE' | 'RED' | null =
    isMatchEnd
      ? state.roundWinsBlue > state.roundWinsRed
        ? 'BLUE'
        : state.roundWinsRed > state.roundWinsBlue
        ? 'RED'
        : null
      : null;

  // Score flash animation — triggered when scores change
  const [scoreFlash, setScoreFlash] = useState<{ side: MatchSide; ts: number } | null>(null);
  const prevBlueRef = useRef(blueScore);
  const prevRedRef = useRef(redScore);
  useEffect(() => {
    if (blueScore > prevBlueRef.current) {
      setScoreFlash({ side: 'BLUE', ts: Date.now() });
    }
    prevBlueRef.current = blueScore;
  }, [blueScore]);
  useEffect(() => {
    if (redScore > prevRedRef.current) {
      setScoreFlash({ side: 'RED', ts: Date.now() });
    }
    prevRedRef.current = redScore;
  }, [redScore]);

  // Last 5 score events per side (derived from state.events)
  const blueStrikes = useMemo(
    () =>
      state.events
        .filter((e) => e.side === 'BLUE' && SCORE_EVENT_TYPES.has(e.type as ScoreType))
        .slice(0, 5),
    [state.events],
  );
  const redStrikes = useMemo(
    () =>
      state.events
        .filter((e) => e.side === 'RED' && SCORE_EVENT_TYPES.has(e.type as ScoreType))
        .slice(0, 5),
    [state.events],
  );

  const handleToggleRun = () => {
    if (isRunning) actions.pauseTimer();
    else if (isRoundEnd) actions.nextRound();
    else if (!isMatchEnd) actions.startTimer();
  };

  // Shared warning for score attempts when not RUNNING (UI click path)
  const lastBlockedToastRef = useRef(0);
  const warnNotRunning = () => {
    const now = Date.now();
    if (now - lastBlockedToastRef.current < 1500) return; // throttle
    lastBlockedToastRef.current = now;
    toast.warning('Inicie a luta primeiro — clique em INICIAR (ou tecle espaço).');
  };

  const confirmEndMatch = () => {
    actions.endMatch();
    setShowEndConfirm(false);
  };

  const handleNewMatch = () => {
    // Consume next from queue (if any): apply athletes + increment match number, then reset.
    const next = shiftQueue();
    if (next) {
      const nextMatchNumber = String(
        Math.max(Number(state.config.matchNumber) || 1, Number(next.id) || 1) + 1,
      ).padStart(3, '0');
      actions.saveConfig({
        ...state.config,
        athleteBlue: {
          id: crypto.randomUUID(),
          name: next.blueName,
          country: next.blueCountry,
        },
        athleteRed: {
          id: crypto.randomUUID(),
          name: next.redName,
          country: next.redCountry,
        },
        matchNumber: next.id,
      });
      toast.success(`Próxima luta: ${next.blueName} × ${next.redName}`);
    } else {
      actions.resetMatch();
    }
    setShowResultModal(false);
  };

  const handleCloseResult = () => {
    setShowResultModal(false);
  };

  return (
    <div className="relative h-screen w-full flex flex-col bg-wt-bg overflow-hidden">
      {/* Critical timer flash overlay */}
      {critical && (
        <div
          className="pointer-events-none absolute inset-0 z-40 spe-crit-flash"
          style={{ boxShadow: 'inset 0 0 120px 20px rgba(250,204,21,0.55)' }}
        />
      )}

      {/* ── Top bar ── */}
      <div className="h-14 shrink-0 flex items-stretch bg-wt-bg border-b border-white/5">
        <div className="px-4 flex items-center gap-3 border-r border-white/5 shrink-0">
          <button
            onClick={onBack}
            className="text-zinc-500 hover:text-white transition-colors"
            title="Voltar ao hub"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src={logoSpe} alt="SPE" className="h-5" draggable={false} />
          <div className="leading-tight">
            <div
              className={cn(
                'text-[9px] font-black tracking-[0.3em]',
                competitionMode ? 'text-red-400' : 'text-emerald-400',
              )}
            >
              {competitionMode ? '● AO VIVO' : '● TREINO'}
            </div>
            <div className="text-[10px] font-mono text-zinc-500 tracking-[0.1em]">
              {competitionMode && categoryLabel
                ? `${categoryLabel} · MAT ${matId}`
                : `MAT ${matId} · LUTA AO VIVO`}
            </div>
          </div>
        </div>

        {/* Queue — ATUAL (current config) + up to 3 upcoming from localStorage */}
        <div className="flex-1 min-w-0 flex items-center gap-2 px-4 overflow-x-auto">
          <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 shrink-0">
            FILA →
          </span>
          <QueueChip
            id={state.config.matchNumber || '001'}
            blueName={blueName}
            redName={redName}
            status="current"
          />
          {queue.slice(0, 3).map((entry, i) => (
            <QueueChip
              key={entry.id}
              id={entry.id}
              blueName={entry.blueName}
              redName={entry.redName}
              category={entry.category}
              time={entry.time}
              status={i === 0 ? 'next' : 'queued'}
            />
          ))}
          {queue.length > 3 && (
            <span className="text-[10px] font-bold text-white/35 tracking-[0.15em] px-2 shrink-0">
              +{queue.length - 3}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="px-3 flex items-center gap-1.5 border-l border-white/5 shrink-0">
          <StatusPill status={state.status} />
          {hwFlash && (
            <span
              className={cn(
                'px-1.5 py-0.5 rounded font-black text-[10px] uppercase animate-pulse',
                hwFlash === 'red' ? 'bg-red-500/40 text-red-300' : 'bg-blue-500/40 text-blue-300',
              )}
            >
              {hwFlash === 'red' ? 'VERM' : 'AZUL'}
            </span>
          )}
          <button
            onClick={() => {
              if (!serialPortConnected) onConnectUsb();
            }}
            className={cn(
              'px-1.5 py-1 rounded font-bold text-[10px] uppercase transition-colors',
              serialPortConnected
                ? 'bg-green-500/20 text-green-400 cursor-default'
                : serialPortConnecting
                ? 'bg-amber-500/20 text-amber-400 animate-pulse cursor-wait'
                : 'bg-yellow-600/80 text-black hover:bg-yellow-500 cursor-pointer',
            )}
            title={serialPortConnected ? 'USB conectado' : 'Clique para conectar USB'}
          >
            {serialPortConnecting ? 'USB...' : serialPortConnected ? 'USB' : 'USB OFF'}
          </button>
          <IconBtn onClick={() => setShowQueueDialog(true)} title="Gerenciar fila de lutas">
            <ListOrdered className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onOpenTV} title="Abrir placar na TV">
            <Monitor className="w-4 h-4" />
          </IconBtn>
          {onToggleTvCleanMode && (
            <IconBtn
              onClick={onToggleTvCleanMode}
              title={tvCleanMode ? 'FOB OFF — TV em modo limpo (sem logo/wifi). Clique pra voltar.' : 'FOB ON — TV mostra logo e WiFi. Clique pra modo limpo (broadcast).'}
            >
              {tvCleanMode ? <Radio className="w-4 h-4 text-amber-400" /> : <RadioTower className="w-4 h-4" />}
            </IconBtn>
          )}
          <button
            onClick={() => setShowShareDialog(true)}
            title="Placar ao vivo no celular (QR Code)"
            aria-label="Placar no celular"
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-md border border-blue-400/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 hover:text-blue-200 transition-colors shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">Celular</span>
          </button>
          {events && (
            <IconBtn onClick={() => setShowEventLog(true)} title={`Histórico de eventos (${events.length})`}>
              <ClipboardList className="w-4 h-4" />
            </IconBtn>
          )}
          {actions.adjustScore && (
            <IconBtn onClick={() => setShowScoreAdjust(true)} title="Ajustar placar manualmente">
              <Edit3 className="w-4 h-4" />
            </IconBtn>
          )}
          {actions.reverseSides && (
            <IconBtn onClick={() => setShowReverseConfirm(true)} title="Inverter lados Chung ↔ Hong — equivalente KPNP: Reverse Sides">
              <ArrowLeftRight className="w-4 h-4" />
            </IconBtn>
          )}
          {onToggleMute && (
            <IconBtn onClick={onToggleMute} title={isMuted ? 'Ativar som' : 'Silenciar som'}>
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </IconBtn>
          )}
          <IconBtn onClick={onOpenHardwareTest} title="Modo Teste — valida coletes e capacetes recebendo impactos sem contabilizar pontos (equivalente KPNP: Test Mode)">
            <Stethoscope className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onOpenConfig} title="Configuração">
            <Settings className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onOpenHelp} title="Ajuda">
            <HelpCircle className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onBack} title="Voltar ao hub">
            <Home className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>

      {/* ── Blocked impact warning (hardware) ── */}
      {blockedImpactWarning && (
        <div className="shrink-0 bg-orange-500/20 border-b border-orange-500/40 px-4 py-1.5 flex items-center justify-center gap-3 animate-in fade-in duration-200">
          <span className="text-orange-300 font-bold text-xs uppercase tracking-widest">
            Impacto detectado! Clique INICIAR (ou tecle espaço) para começar a pontuar
          </span>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex">
        <ScoreRail
          side="BLUE"
          scoring={state.config.scoring}
          dimmed={!isRunning}
          onScore={(type) => {
            if (!isRunning) { warnNotRunning(); return; }
            actions.addScore('BLUE', type);
          }}
          onAddGamjeom={() => {
            if (state.status !== 'RUNNING' && state.status !== 'PAUSED') { warnNotRunning(); return; }
            actions.addGamjeom('BLUE');
          }}
        />

        <div className="flex-1 p-2.5 flex gap-2.5 min-w-0">
          <AthletePanel
            side="BLUE"
            name={blueName}
            country={blueCountry}
            score={blueScore}
            isLeading={leading === 'BLUE'}
            flash={scoreFlash?.side === 'BLUE' ? scoreFlash : null}
            gamjeom={state.gamjeomBlue}
            hits={state.hitsBlue}
            roundHistory={state.roundHistoryBlue ?? []}
            currentRound={state.round}
            maxRounds={state.config.maxRounds}
            strikes={blueStrikes}
          />

          {/* Center: timer + controls */}
          <div className="w-[230px] flex flex-col gap-2.5 shrink-0">
            <div className="bg-black rounded-2xl border border-white/10 p-3 flex flex-col items-center gap-1.5">
              <div className={cn(
                "text-[9px] font-bold tracking-[0.28em]",
                isBreak ? "text-amber-400 animate-pulse" : "text-white/55"
              )}>
                {isBreak ? 'INTERVALO' : `ROUND ${state.round}/${state.config.maxRounds}`}
              </div>
              <TimerRing seconds={timerSeconds} total={totalSeconds} ms={displayMs} size={170} />
              <div className="flex gap-1 mt-1">
                {Array.from({ length: state.config.maxRounds }).map((_, i) => {
                  const r = i + 1;
                  const color =
                    r < state.round
                      ? 'bg-emerald-500'
                      : r === state.round
                      ? 'bg-rose-600'
                      : 'bg-white/10';
                  return <div key={r} className={cn('w-[26px] h-[5px] rounded-sm', color)} />;
                })}
              </div>
            </div>

            <button
              onClick={handleToggleRun}
              disabled={isMatchEnd}
              title={isRunning ? 'Kal-yeo (pausa arbitral) — equivalente KPNP: Kal-yeo' : 'Shijak (iniciar combate) — equivalente KPNP: Shijak'}
              className={cn(
                'w-full rounded-xl py-3.5 flex flex-col items-center justify-center gap-0.5 font-black text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_6px_18px_rgba(220,38,38,0.4)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_6px_18px_rgba(16,185,129,0.4)]',
              )}
            >
              {isRunning ? (
                <>
                  <span className="flex items-center gap-2.5 text-[15px] tracking-[0.22em]">
                    <Pause className="w-5 h-5" /> PAUSAR <Kbd>␣</Kbd>
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.35em] opacity-70">KAL-YEO</span>
                </>
              ) : isRoundEnd ? (
                <>
                  <span className="flex items-center gap-2.5 text-[15px] tracking-[0.22em]">
                    <Play className="w-5 h-5" /> PRÓX. ROUND <Kbd>␣</Kbd>
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.35em] opacity-70">AVANÇAR</span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-2.5 text-[15px] tracking-[0.22em]">
                    <Play className="w-5 h-5" /> INICIAR <Kbd>␣</Kbd>
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.35em] opacity-70">SHIJAK</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-1.5">
              <SmallBtn onClick={() => actions.resetTime()} title="Reset do cronômetro do round atual">RESET</SmallBtn>
              <SmallBtn
                onClick={() => actions.nextRound()}
                disabled={state.status !== 'ROUND_END'}
                title="Avançar para o próximo round"
              >
                PRÓX. R <Kbd>N</Kbd>
              </SmallBtn>
              <SmallBtn
                onClick={() => actions.undoLast()}
                disabled={!actions.canUndo}
                className="col-span-2"
                title="Desfazer última ação — equivalente KPNP: Reverse"
              >
                <Undo2 className="w-3 h-3" /> DESFAZER <Kbd>⌫</Kbd>
              </SmallBtn>
              <SmallBtn
                onClick={() => setShowEndConfirm(true)}
                disabled={isMatchEnd}
                className="col-span-2 !bg-red-500/15 !text-red-300 !border-red-500/40 hover:!bg-red-500/25"
                title="Encerrar luta — equivalente KPNP: Completion"
              >
                <Power className="w-3 h-3" /> ENCERRAR LUTA
              </SmallBtn>
            </div>
          </div>

          <AthletePanel
            side="RED"
            name={redName}
            country={redCountry}
            score={redScore}
            isLeading={leading === 'RED'}
            flash={scoreFlash?.side === 'RED' ? scoreFlash : null}
            gamjeom={state.gamjeomRed}
            hits={state.hitsRed}
            roundHistory={state.roundHistoryRed ?? []}
            currentRound={state.round}
            maxRounds={state.config.maxRounds}
            strikes={redStrikes}
          />
        </div>

        <ScoreRail
          side="RED"
          scoring={state.config.scoring}
          dimmed={!isRunning}
          onScore={(type) => {
            if (!isRunning) { warnNotRunning(); return; }
            actions.addScore('RED', type);
          }}
          onAddGamjeom={() => {
            if (state.status !== 'RUNNING' && state.status !== 'PAUSED') { warnNotRunning(); return; }
            actions.addGamjeom('RED');
          }}
        />
      </div>

      {/* ── Legenda de atalhos (KPNP-compatible) ── */}
      <div className="px-4 pb-2 pt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-500 border-t border-white/5">
        <span className="flex items-center gap-1.5"><Kbd>␣</Kbd><span className="tracking-[0.15em]">SHIJAK / KAL-YEO</span></span>
        <span className="flex items-center gap-1.5"><Kbd>1</Kbd>–<Kbd>5</Kbd><span className="text-blue-400/80 tracking-[0.15em]">CHUNG</span></span>
        <span className="flex items-center gap-1.5"><Kbd>⇧</Kbd>+<Kbd>1</Kbd>–<Kbd>5</Kbd><span className="text-red-400/80 tracking-[0.15em]">HONG</span></span>
        <span className="flex items-center gap-1.5"><Kbd>F1</Kbd>/<Kbd>F2</Kbd><span className="tracking-[0.15em]">GAM-JEOM</span></span>
        <span className="flex items-center gap-1.5"><Kbd>N</Kbd><span className="tracking-[0.15em]">PRÓX. ROUND</span></span>
        <span className="flex items-center gap-1.5"><Kbd>M</Kbd><span className="tracking-[0.15em]">KYESHI</span></span>
        <span className="flex items-center gap-1.5"><Kbd>⌫</Kbd><span className="tracking-[0.15em]">UNDO</span></span>
      </div>

      {/* Event log dialog */}
      {events && (
        <EventLogDialog
          open={showEventLog}
          onOpenChange={setShowEventLog}
          events={events}
        />
      )}

      {/* Manual score adjust dialog */}
      {actions.adjustScore && (
        <ScoreAdjustDialog
          open={showScoreAdjust}
          onOpenChange={setShowScoreAdjust}
          state={state}
          onAdjust={actions.adjustScore}
        />
      )}

      {/* Queue management dialog */}
      <QueueDialog
        open={showQueueDialog}
        onOpenChange={setShowQueueDialog}
        queue={queue}
        onAdd={addToQueue}
        onRemove={removeFromQueue}
        onClear={clearQueue}
      />

      {/* ── Placar celular (QR) ── */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none max-w-sm">
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
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="shrink-0 p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    title="Copiar link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
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

      {/* ── Reverse sides confirmation ── */}
      {actions.reverseSides && (
        <AlertDialog open={showReverseConfirm} onOpenChange={setShowReverseConfirm}>
          <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Inverter lados Chung ↔ Hong?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Troca atletas, placar, gam-jeoms, hits e vitórias de round entre os lados.
                Reversível via DESFAZER.
                <br /><br />
                <span className="text-blue-400 font-bold">CHUNG: {blueName}</span>{' '}
                <span className="text-zinc-500">→</span>{' '}
                <span className="text-red-400 font-bold">HONG: {blueName}</span>
                <br />
                <span className="text-red-400 font-bold">HONG: {redName}</span>{' '}
                <span className="text-zinc-500">→</span>{' '}
                <span className="text-blue-400 font-bold">CHUNG: {redName}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => actions.reverseSides?.()}
                className="bg-amber-600 hover:bg-amber-500 text-white"
              >
                Sim, inverter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* ── End match confirmation ── */}
      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Encerrar esta luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Isso registra o resultado e libera a próxima. Placar atual:{' '}
              <span className="text-blue-400 font-bold">{blueName}</span> {blueScore} ×{' '}
              {redScore} <span className="text-red-400 font-bold">{redName}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEndMatch}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              Sim, encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Inline result modal when MATCH_END ── */}
      {/* Using DialogPrimitive directly to skip the built-in close button —
          result modal should only dismiss via explicit FECHAR or PRÓXIMA LUTA. */}
      <DialogPrimitive.Root open={showResultModal} onOpenChange={(next) => !next && handleCloseResult()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] p-0 overflow-hidden max-w-[560px] w-[95vw] bg-[#12121a] border border-white/10 rounded-lg shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div
            className={cn(
              'px-7 pt-7 pb-5 flex items-center gap-4 relative',
              winner === 'BLUE' &&
                'bg-[linear-gradient(135deg,#3b82f6,#1e3a8a)]',
              winner === 'RED' && 'bg-[linear-gradient(135deg,#ef4444,#7f1d1d)]',
              !winner && 'bg-[#0F0F18]',
            )}
          >
            <div className="w-15 h-15 min-w-[60px] min-h-[60px] rounded-2xl bg-amber-400/25 border-2 border-amber-400 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black tracking-[0.35em] text-amber-400">
                VENCEDOR
              </div>
              <div className="text-[30px] font-black text-white leading-tight mt-1">
                {winner === 'BLUE' ? blueName : winner === 'RED' ? redName : 'EMPATE'}
              </div>
              <div className="text-[11px] font-bold tracking-[0.22em] text-white/80 mt-0.5">
                {winner === 'BLUE'
                  ? `CHUNG${blueCountry ? ` · ${blueCountry}` : ''}`
                  : winner === 'RED'
                  ? `HONG${redCountry ? ` · ${redCountry}` : ''}`
                  : ''}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold tracking-[0.25em] text-white/70">
                PLACAR FINAL
              </div>
              <div className="text-[40px] font-black text-white leading-none tabular-nums">
                {blueScore}–{redScore}
              </div>
            </div>
          </div>
          <div className="px-7 py-5 bg-[#12121a] space-y-3">
            {queue[0] && (
              <>
                <div className="text-[10px] font-bold tracking-[0.28em] text-white/50 uppercase">
                  Próxima luta
                </div>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-amber-400/20 bg-amber-400/[0.06]">
                  <span className="font-mono text-[12px] font-black text-amber-400 tracking-[0.1em]">
                    #{queue[0].id}
                  </span>
                  <div className="flex-1 min-w-0 text-sm font-bold flex items-center gap-1.5 truncate">
                    <span className="text-blue-400 truncate">{queue[0].blueName}</span>
                    <span className="text-white/30 font-mono text-[10px]">×</span>
                    <span className="text-red-400 truncate">{queue[0].redName}</span>
                  </div>
                  {(queue[0].category || queue[0].time) && (
                    <span className="text-[10px] font-bold tracking-[0.18em] text-white/50 uppercase">
                      {[queue[0].category, queue[0].time].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              </>
            )}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handleCloseResult}
                className="bg-transparent border-white/15 text-white hover:bg-white/5 font-bold tracking-[0.18em] text-xs px-5"
              >
                FECHAR
              </Button>
              <Button
                onClick={handleNewMatch}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black tracking-[0.22em] text-[13px] py-3"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {queue[0] ? 'PRÓXIMA LUTA' : 'NOVA LUTA'}
              </Button>
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

// ─── Sub-components ───

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="w-8 h-8 flex items-center justify-center rounded-md border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
    >
      {children}
    </button>
  );
}

function QueueChip({
  id,
  blueName,
  redName,
  category,
  time,
  status,
}: {
  id: string;
  blueName: string;
  redName: string;
  category?: string;
  time?: string;
  status: 'current' | 'next' | 'queued';
}) {
  const isCurrent = status === 'current';
  const isNext = status === 'next';
  const wrapper = cn(
    'flex items-center gap-2 rounded-lg border shrink-0 whitespace-nowrap',
    isCurrent && 'min-w-[280px] px-3 py-2 border-rose-500/50 bg-gradient-to-r from-rose-600/15 to-rose-600/5',
    isNext && 'min-w-[220px] px-2.5 py-1.5 border-amber-400/30 bg-amber-400/[0.06]',
    !isCurrent && !isNext && 'min-w-[220px] px-2.5 py-1.5 border-white/10 bg-white/[0.03]',
  );
  const idColor = isCurrent ? 'text-rose-500' : isNext ? 'text-amber-400' : 'text-white/45';
  const badgeCls = isCurrent
    ? 'text-rose-500 bg-rose-500/15 border-rose-500/35'
    : 'text-amber-400 bg-amber-400/10 border-amber-400/30';

  return (
    <div className={wrapper}>
      <span className={cn('font-mono text-[11px] font-black tracking-[0.1em] shrink-0', idColor)}>#{id}</span>
      <div className="flex-1 min-w-0 leading-tight">
        <div className="text-[12px] font-bold flex items-center gap-1.5 truncate">
          <span className="text-blue-400 truncate">{blueName}</span>
          <span className="text-white/30 font-mono text-[10px]">×</span>
          <span className="text-red-400 truncate">{redName}</span>
        </div>
        {(category || time) && (
          <div className="text-[9px] font-bold tracking-[0.18em] text-white/50 uppercase">
            {[category, time].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      {(isCurrent || isNext) && (
        <span className={cn('text-[8px] font-black tracking-[0.25em] px-1.5 py-0.5 rounded border shrink-0', badgeCls)}>
          {isCurrent ? 'ATUAL' : 'PRÓXIMA'}
        </span>
      )}
    </div>
  );
}

function QueueDialog({
  open,
  onOpenChange,
  queue,
  onAdd,
  onRemove,
  onClear,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  queue: QueueEntry[];
  onAdd: (entry: Omit<QueueEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [blueName, setBlueName] = useState('');
  const [redName, setRedName] = useState('');
  const [category, setCategory] = useState('');
  const [time, setTime] = useState('');

  const canAdd = blueName.trim().length > 0 && redName.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({
      blueName: blueName.trim(),
      redName: redName.trim(),
      category: category.trim() || undefined,
      time: time.trim() || undefined,
    });
    setBlueName('');
    setRedName('');
    // keep category/time to speed up adding multiple of same batch
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[560px] max-w-[95vw] max-h-[85vh] overflow-hidden bg-wt-bg-secondary border border-wt-divider flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <DialogPrimitive.Title className="text-white text-base font-bold">
                Fila de lutas do dia
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-zinc-400 text-xs mt-0.5">
                A luta atual já está cadastrada. Adicione as próximas aqui.
              </DialogPrimitive.Description>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/5"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Add form */}
          <div className="p-5 border-b border-white/10 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Atleta azul"
                value={blueName}
                onChange={(e) => setBlueName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-3 py-2 bg-zinc-900 border border-blue-500/30 rounded-md text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-400"
              />
              <input
                placeholder="Atleta vermelho"
                value={redName}
                onChange={(e) => setRedName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-3 py-2 bg-zinc-900 border border-red-500/30 rounded-md text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-400"
              />
            </div>
            <div className="grid grid-cols-[1fr_120px_auto] gap-2">
              <input
                placeholder="Categoria (opcional)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
              />
              <input
                placeholder="Hora"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
              />
              <Button
                onClick={handleAdd}
                disabled={!canAdd}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold tracking-[0.1em] text-xs px-4"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-5">
            {queue.length === 0 ? (
              <div className="text-center text-zinc-500 text-sm py-8">
                Nenhuma luta na fila.
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg"
                  >
                    <span className="font-mono text-[10px] font-black text-amber-400 tracking-[0.1em] w-8">
                      #{entry.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold flex items-center gap-1.5 truncate">
                        <span className="text-blue-400 truncate">{entry.blueName}</span>
                        <span className="text-white/30 font-mono text-[10px]">×</span>
                        <span className="text-red-400 truncate">{entry.redName}</span>
                      </div>
                      {(entry.category || entry.time) && (
                        <div className="text-[10px] font-bold tracking-[0.15em] text-white/50 uppercase">
                          {[entry.category, entry.time].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      aria-label={`Remover luta ${entry.id}`}
                      title="Remover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {i === 0 && (
                      <span className="text-[8px] font-black tracking-[0.25em] text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded shrink-0">
                        PRÓXIMA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              {queue.length} {queue.length === 1 ? 'luta' : 'lutas'} na fila
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                if (queue.length && window.confirm('Limpar toda a fila?')) onClear();
              }}
              disabled={queue.length === 0}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Limpar tudo
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SmallBtn({
  onClick,
  disabled,
  className,
  children,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'bg-white/[0.06] text-white border border-white/10 rounded-md py-2 px-1.5 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-[0.18em] hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 text-[9px] font-mono font-bold bg-white/10 border border-white/20 rounded text-white/85">
      {children}
    </kbd>
  );
}

function StatusPill({ status }: { status: MatchState['status'] }) {
  const map = {
    IDLE: { label: 'PRONTO', cls: 'bg-zinc-700 text-zinc-300' },
    RUNNING: { label: '● AO VIVO', cls: 'bg-emerald-500/20 text-emerald-400' },
    PAUSED: { label: 'PAUSADO', cls: 'bg-yellow-500/20 text-yellow-400' },
    MEDICAL: { label: 'KYESHI · MÉDICO', cls: 'bg-orange-500/20 text-orange-400' },
    ROUND_END: { label: 'FIM ROUND', cls: 'bg-blue-500/20 text-blue-400' },
    MATCH_END: { label: 'ENCERRADA', cls: 'bg-zinc-500/30 text-zinc-300' },
  } as const;
  const s = map[status];
  return (
    <span
      className={cn(
        'px-2 py-1 rounded text-[10px] font-black tracking-[0.22em] uppercase',
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

function TimerRing({ seconds, total, ms, size = 170 }: { seconds: number; total: number; ms?: number; size?: number }) {
  // pathLength=100 normaliza o SVG pra trabalhar com percentual (pattern
  // Apple Activity Rings / Stripe). strokeDashoffset = 100 - pct.
  // Pct usa MS quando disponivel (10Hz, suave) em vez de seconds (1Hz, pula).
  const totalMs = total * 1000;
  const currentMs = ms !== undefined ? ms : seconds * 1000;
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, currentMs / totalMs)) : 0;
  const offset = 100 - pct * 100;
  const radius = size * 0.44;
  const critical = seconds <= 10;
  // Cor: WT/KPNP — vermelho direto sob 10s, nao ha fase amarela intermediaria.
  const strokeColor = critical ? '#FF1744' : '#22c55e';
  // Texto: sempre M:SS, convencao WT. Pulsa cor no critico (steps(2) a 1Hz)
  // pelo keyframe timer-critical-pulse. Sem troca de formato = zero jitter.
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const display = `${mm}:${ss}`;
  // Landing final: quando o anel chega perto do fim, anima suavemente.
  // Caso contrario, atualiza frame-a-frame via rerender (o estado ja tica
  // a 10Hz no useChampionshipSync) — sem transicao CSS que brigue com isso.
  const landing = currentMs < 1000;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={offset}
          style={{
            // Landing: no ultimo segundo, anima ate offset=100 em 250ms
            // com cubic-bezier pra "pousar" em vez de snapar. Fora disso,
            // sem transicao — o rerender 10Hz do state ja da suavidade.
            transition: landing
              ? 'stroke-dashoffset 250ms cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s'
              : 'stroke 0.3s',
          }}
        />
      </svg>
      <div
        className={cn(
          'font-black leading-none tabular-nums tracking-tight',
          !critical && 'text-white',
          // Padrao broadcast pro: anima COR do texto (steps 1Hz), nao usa
          // animate-pulse (que mexe opacity = piora leitura).
          critical && 'animate-[timer-critical-pulse_1s_steps(2)_infinite]',
        )}
        style={{
          fontSize: size * 0.3,
          minWidth: '4ch',
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {display}
      </div>
    </div>
  );
}

function ScoreRail({
  side,
  scoring,
  dimmed,
  onScore,
  onAddGamjeom,
}: {
  side: MatchSide;
  scoring: MatchState['config']['scoring'];
  dimmed: boolean;
  onScore: (type: ScoreType) => void;
  onAddGamjeom: () => void;
}) {
  const bg =
    side === 'BLUE'
      ? 'bg-[linear-gradient(180deg,#3b82f6_0%,#1e40af_100%)]'
      : 'bg-[linear-gradient(180deg,#dc2626_0%,#991b1b_100%)]';
  const radius = side === 'BLUE' ? 'rounded-r-2xl' : 'rounded-l-2xl';

  return (
    <div
      className={cn('w-[170px] shrink-0 flex flex-col gap-1.5 p-2.5', bg, radius)}
      aria-label={`Pontuação ${side === 'BLUE' ? 'Azul' : 'Vermelho'}`}
    >
      <div className="text-center pt-1 pb-1">
        <div className="text-[9px] font-bold tracking-[0.3em] text-white/85">
          {side === 'BLUE' ? 'CHUNG' : 'HONG'}
        </div>
      </div>
      {SCORE_ROW_ORDER.map((type) => (
        <ScoreChip
          key={type}
          type={type}
          points={getScoreValue(type, scoring)}
          side={side}
          dimmed={dimmed}
          onClick={() => onScore(type)}
        />
      ))}
      <button
        onClick={onAddGamjeom}
        className="mt-0.5 rounded-lg py-2 font-bold text-[10px] tracking-[0.2em] bg-amber-400/20 text-amber-200 border border-amber-400/45 hover:bg-amber-400/30 transition-colors"
      >
        GAM-JEOM{' '}
        <kbd className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[14px] px-1 text-[8px] font-mono font-bold bg-black/30 border border-white/25 rounded">
          {side === 'BLUE' ? 'F1' : 'F2'}
        </kbd>
      </button>
    </div>
  );
}

function ScoreChip({
  type,
  points,
  side,
  dimmed,
  onClick,
}: {
  type: ScoreType;
  points: number;
  side: MatchSide;
  dimmed: boolean;
  onClick: () => void;
}) {
  const meta = SCORE_META[type];
  const digit = SCORE_KEY_DIGIT[type];
  const kbd = side === 'BLUE' ? digit : `⇧${digit}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-between rounded-lg px-3 bg-black/25 border border-white/20 text-white relative transition-transform',
        'hover:bg-black/35 active:scale-95',
        dimmed && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-2.5">
        {meta.strike && <StrikeIcon type={meta.strike} className="w-5 h-5" />}
        <div className="text-[28px] font-black leading-none tabular-nums">+{points}</div>
      </div>
      <div className="text-[9px] font-bold tracking-[0.12em] text-right opacity-90 leading-tight whitespace-pre-line max-w-[60px]">
        {meta.label.replace(' ', '\n')}
      </div>
      <div className="absolute top-1 right-1">
        <Kbd>{kbd}</Kbd>
      </div>
    </button>
  );
}

function AthletePanel({
  side,
  name,
  country,
  score,
  isLeading,
  flash,
  gamjeom,
  hits,
  roundHistory,
  currentRound,
  maxRounds,
  strikes,
}: {
  side: MatchSide;
  name: string;
  country: string;
  score: number;
  isLeading: boolean;
  flash: { side: MatchSide; ts: number } | null;
  gamjeom: number;
  hits: number;
  roundHistory: number[];
  currentRound: number;
  maxRounds: number;
  strikes: MatchEvent[];
}) {
  const bg =
    side === 'BLUE'
      ? 'bg-[linear-gradient(180deg,#3b82f6_0%,#1e3a8a_100%)]'
      : 'bg-[linear-gradient(180deg,#ef4444_0%,#7f1d1d_100%)]';
  const label = side === 'BLUE' ? 'CHUNG' : 'HONG';
  const numberColor = isLeading ? 'text-amber-400' : 'text-white';
  const flashKey = flash?.ts ?? 0;

  return (
    <div
      className={cn(
        'flex-1 min-w-0 rounded-2xl p-3.5 flex flex-col gap-2 relative overflow-hidden',
        bg,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] font-bold tracking-[0.3em] text-white/90">{label}</div>
            {isLeading && (
              <div className="text-[9px] font-black tracking-[0.25em] text-zinc-950 bg-amber-400 px-1.5 py-0.5 rounded">
                LIDERA
              </div>
            )}
          </div>
          <div className="text-[18px] font-bold text-white truncate">{name}</div>
          {country && (
            <div className="text-[10px] font-mono text-white/70">{country}</div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1">
        <ScoreNumber value={score} leading={isLeading} flashKey={flashKey} />
        <StrikeLog strikes={strikes} />
      </div>

      <div
        className={cn(
          'grid gap-1.5',
          maxRounds === 1 ? 'grid-cols-3' : maxRounds === 3 ? 'grid-cols-[1.1fr_1fr_0.7fr_0.7fr_0.7fr]' : 'grid-cols-4',
        )}
      >
        <StatBox label="GAM-JEOM" value={gamjeom} alert={gamjeom >= 3} />
        <StatBox label="HITS" value={hits} />
        {Array.from({ length: maxRounds }).map((_, i) => {
          const r = i + 1;
          const val = roundHistory[i] ?? (r === currentRound ? score : 0);
          const isCurrent = r === currentRound && roundHistory[i] === undefined;
          return (
            <StatBox
              key={r}
              label={`R${r}`}
              value={val}
              emphasis={isCurrent}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScoreNumber({
  value,
  leading,
  flashKey,
}: {
  value: number;
  leading: boolean;
  flashKey: number;
}) {
  return (
    <div
      key={flashKey}
      className={cn(
        'relative font-black leading-[0.85] tabular-nums tracking-[-0.04em]',
        leading ? 'text-amber-400' : 'text-white',
        flashKey > 0 && 'animate-[spe-score-pop_0.35s_ease-out]',
      )}
      style={{
        fontSize: 'clamp(120px, 15vw, 200px)',
        textShadow: leading ? '0 2px 0 rgba(0,0,0,0.15)' : '0 0 40px rgba(255,255,255,0.2)',
      }}
    >
      {value}
    </div>
  );
}

function StrikeLog({ strikes }: { strikes: MatchEvent[] }) {
  if (!strikes.length) return <div className="h-7" aria-hidden />;
  return (
    <div className="flex gap-1.5 justify-center min-h-[28px] flex-nowrap">
      {strikes.map((s, i) => {
        const type = s.type as ScoreType;
        const meta = SCORE_META[type];
        if (!meta || !meta.strike) return null;
        return (
          <div
            key={s.id}
            className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-black/35 border border-white/20"
            style={{ opacity: 1 - i * 0.14 }}
          >
            <StrikeIcon type={meta.strike} className="w-[13px] h-[13px] text-white" />
            <div className="text-[10px] font-black text-amber-400 tabular-nums">
              +{s.points ?? 0}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatBox({
  label,
  value,
  alert,
  emphasis,
}: {
  label: string;
  value: number;
  alert?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        'border rounded-md py-1 text-center',
        emphasis ? 'bg-amber-400/10 border-amber-400/35' : 'bg-black/30 border-white/10',
      )}
    >
      <div
        className={cn(
          'text-[8px] font-bold tracking-[0.2em]',
          emphasis ? 'text-amber-300' : 'text-white/60',
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          'text-[16px] font-black leading-tight tabular-nums',
          alert ? 'text-amber-400' : emphasis ? 'text-amber-300' : 'text-white',
        )}
      >
        {value}
      </div>
    </div>
  );
}
