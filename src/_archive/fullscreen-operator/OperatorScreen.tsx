/**
 * OperatorScreen — Tela do operador (modo competição profissional).
 *
 * Port fiel do design Claude Design (spe_operator/operator.jsx) pra
 * Tailwind + tokens SPE.
 *
 * Estrutura:
 *   TopChrome fino (LUTA · CATEGORIA · MAT · status · CONFIG · TV)
 *   ├─ ScoreRail CHUNG (180px, 5 golpes + GAM-JEOM, atalhos Q/W/E/R/T)
 *   ├─ AthletePanel CHUNG (bicolor, score 220px amarelo quando lidera)
 *   ├─ CenterControl (240px, TimerRing + INICIAR/PAUSAR + ações)
 *   ├─ AthletePanel HONG (bicolor vermelho)
 *   └─ ScoreRail HONG (180px)
 *   Timeline rodapé (placar proporcional por round)
 *
 * Referência: /tmp/design-extract/spe-s-fight-pro-design-system/
 *             project/spe_operator/operator.jsx
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Play, Pause, Monitor, Settings, RotateCcw, Stethoscope, AlertTriangle,
  ArrowRight, Undo2, Power, Zap, Hand,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchState, MatchSide, MatchEvent, ScoreType } from '@/types/championship';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

type ScoreKey = 'h' | 'b' | 'p' | 'gh' | 'gb';

export interface OperatorScreenProps {
  state: MatchState;
  athleteBlue: { name: string; country: string };
  athleteRed: { name: string; country: string };
  matId: number;
  category?: string;
  showKbd?: boolean;

  onScore: (side: MatchSide, type: ScoreKey) => void;
  onGamjeom: (side: MatchSide) => void;
  onToggleTimer: () => void;      // play/pause
  onResetTime: () => void;
  onNextRound: () => void;
  onMedical: () => void;
  onBreak?: () => void;
  onUndo: () => void;
  onEndMatch: () => void;

  onOpenConfig: () => void;
  onOpenTV: () => void;
}

// ────────────────────────────────────────────────────────────────
// Constants (from shared.jsx)
// ────────────────────────────────────────────────────────────────

const STRIKE_TYPES: Record<ScoreKey, { label: string; short: string; scoreType: ScoreType }> = {
  h:  { label: 'CABEÇA',      short: 'H',  scoreType: 'HEAD' },
  b:  { label: 'CORPO',       short: 'B',  scoreType: 'BODY' },
  p:  { label: 'SOCO',        short: 'P',  scoreType: 'PUNCH' },
  gh: { label: 'GIRO CABEÇA', short: 'GH', scoreType: 'SPIN_HEAD' },
  gb: { label: 'GIRO CORPO',  short: 'GB', scoreType: 'SPIN_BODY' },
};

const SCORE_TYPE_TO_KEY: Record<ScoreType, ScoreKey | null> = {
  HEAD: 'h', BODY: 'b', PUNCH: 'p', SPIN_HEAD: 'gh', SPIN_BODY: 'gb',
  GAMJEOM: null,
};

const KBD_MAP_BLUE: Record<string, ScoreKey> = { q: 'gh', w: 'h', e: 'b', r: 'p', t: 'gb' };
const KBD_MAP_RED: Record<string, ScoreKey>  = { u: 'gh', i: 'h', o: 'b', p: 'p', y: 'gb' };

const STRIKE_KEYS_BLUE: Record<ScoreKey, string> = { gh: 'Q', h: 'W', b: 'E', p: 'R', gb: 'T' };
const STRIKE_KEYS_RED: Record<ScoreKey, string>  = { gh: 'U', h: 'I', b: 'O', p: 'P', gb: 'Y' };

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export function OperatorScreen(props: OperatorScreenProps) {
  const { state, athleteBlue, athleteRed, matId, category = '', showKbd = true } = props;
  const { scoring, pointGap } = state.config;

  // Points per strike type (from config)
  const pts = useMemo<Record<ScoreKey, number>>(() => ({
    h: scoring.head, b: scoring.body, p: scoring.punch,
    gh: scoring.spinHead, gb: scoring.spinBody,
  }), [scoring]);

  // Scores
  const blueScore = state.roundScoreBlue;
  const redScore = state.roundScoreRed;

  // Leader (for golden number)
  const leading: 'blue' | 'red' | null =
    blueScore > redScore ? 'blue' : redScore > blueScore ? 'red' : null;

  // Timer
  const timerSecs = Math.ceil(state.timeLeftMs / 1000);
  const totalSecs = Math.ceil(state.config.roundTimeMs / 1000);
  const running = state.status === 'RUNNING';
  const critical = timerSecs <= 10 && running;

  // Derive strike log from events (last 5 per side)
  const strikesBlue = useDeriveStrikes(state.events, 'BLUE');
  const strikesRed = useDeriveStrikes(state.events, 'RED');

  // Flash on new score
  const [flash, setFlash] = useState<{ side: 'blue' | 'red'; type: ScoreKey; pts: number; ts: number } | null>(null);
  const [pressed, setPressed] = useState<{ side: 'blue' | 'red'; type: ScoreKey } | null>(null);
  const lastEventId = state.lastEvent?.id;
  useEffect(() => {
    const ev = state.lastEvent;
    if (!ev || !ev.side) return;
    const key = SCORE_TYPE_TO_KEY[ev.type as ScoreType];
    if (!key) return;
    setFlash({
      side: ev.side === 'BLUE' ? 'blue' : 'red',
      type: key,
      pts: ev.points ?? 0,
      ts: ev.ts,
    });
    const tid = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(tid);
  }, [lastEventId, state.lastEvent]);

  // Confirm dialog
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === ' ') { e.preventDefault(); props.onToggleTimer(); return; }
      if (k === 'backspace') { e.preventDefault(); props.onUndo(); return; }
      if (KBD_MAP_BLUE[k]) {
        const type = KBD_MAP_BLUE[k];
        props.onScore('BLUE', type);
        setPressed({ side: 'blue', type });
        setTimeout(() => setPressed(null), 150);
      }
      if (KBD_MAP_RED[k] && k !== 'p') {
        // 'p' conflicts with blue; use only for red when shift? Spec: red 'p' is SOCO
        const type = KBD_MAP_RED[k];
        props.onScore('RED', type);
        setPressed({ side: 'red', type });
        setTimeout(() => setPressed(null), 150);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#0A0A0F] text-white font-display flex flex-col overflow-hidden">
      {/* Critical flash overlay */}
      {critical && (
        <div
          className="spe-crit-flash absolute inset-0 pointer-events-none z-50"
          style={{ boxShadow: 'inset 0 0 120px 20px rgba(250,204,21,.65)' }}
        />
      )}

      {/* TOP CHROME */}
      <TopChrome
        title={`LUTA ${String(matId).padStart(3, '0')}${category ? ' · ' + category : ''} · MAT ${matId}`}
        running={running}
        status={state.status}
        onOpenConfig={props.onOpenConfig}
        onOpenTV={props.onOpenTV}
      />

      {/* MAIN ROW */}
      <div className="flex-1 flex min-h-0">
        <ScoreRail
          side="blue"
          pts={pts}
          onScore={(t) => props.onScore('BLUE', t)}
          onGamjeom={() => props.onGamjeom('BLUE')}
          pressed={pressed}
          showKbd={showKbd}
        />

        <div className="flex-1 flex gap-2.5 p-2.5 min-w-0">
          <AthletePanel
            side="blue"
            athlete={athleteBlue}
            score={blueScore}
            isLeading={leading === 'blue'}
            flash={flash?.side === 'blue' ? flash : null}
            strikes={strikesBlue}
            hits={state.hitsBlue}
            gamjeom={state.gamjeomBlue}
            roundsWon={state.roundWinsBlue}
            maxRounds={state.config.maxRounds}
          />

          <CenterControl
            round={state.round}
            maxRounds={state.config.maxRounds}
            timerSecs={timerSecs}
            totalSecs={totalSecs}
            running={running}
            isMedical={state.status === 'MEDICAL'}
            isBreak={state.status === 'ROUND_END'}
            onToggleTimer={props.onToggleTimer}
            onResetTime={props.onResetTime}
            onNextRound={props.onNextRound}
            onMedical={props.onMedical}
            onBreak={props.onBreak}
            onUndo={props.onUndo}
            onEnd={() => setConfirmEnd(true)}
            showKbd={showKbd}
          />

          <AthletePanel
            side="red"
            athlete={athleteRed}
            score={redScore}
            isLeading={leading === 'red'}
            flash={flash?.side === 'red' ? flash : null}
            strikes={strikesRed}
            hits={state.hitsRed}
            gamjeom={state.gamjeomRed}
            roundsWon={state.roundWinsRed}
            maxRounds={state.config.maxRounds}
          />
        </div>

        <ScoreRail
          side="red"
          pts={pts}
          onScore={(t) => props.onScore('RED', t)}
          onGamjeom={() => props.onGamjeom('RED')}
          pressed={pressed}
          showKbd={showKbd}
        />
      </div>

      {/* BOTTOM TIMELINE */}
      <Timeline
        round={state.round}
        maxRounds={state.config.maxRounds}
        timerSecs={timerSecs}
        blueRounds={state.roundHistoryBlue.concat(state.roundScoreBlue)}
        redRounds={state.roundHistoryRed.concat(state.roundScoreRed)}
      />

      {/* CONFIRM END DIALOG */}
      {confirmEnd && (
        <ConfirmEndDialog
          blueScore={blueScore}
          redScore={redScore}
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => { setConfirmEnd(false); props.onEndMatch(); }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// TopChrome
// ────────────────────────────────────────────────────────────────

function TopChrome({
  title, running, status, onOpenConfig, onOpenTV,
}: {
  title: string;
  running: boolean;
  status: MatchState['status'];
  onOpenConfig: () => void;
  onOpenTV: () => void;
}) {
  const statusLabel =
    running ? 'AO VIVO' :
    status === 'PAUSED' ? 'PAUSADO' :
    status === 'MEDICAL' ? 'MÉDICO' :
    status === 'ROUND_END' ? 'INTERVALO' :
    status === 'MATCH_END' ? 'ENCERRADA' : 'PRONTO';
  const statusColor =
    running ? 'text-[#10B981] bg-[#10B981]/15' :
    status === 'MEDICAL' ? 'text-[#FB923C] bg-[#FB923C]/15' :
    status === 'MATCH_END' ? 'text-[#F87171] bg-[#F87171]/15' :
    'text-white/70 bg-white/5';

  return (
    <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-[#0F0F18]">
      <div className="text-[11px] font-bold tracking-[0.22em] text-white/80">{title}</div>
      <div className="flex items-center gap-2">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-[0.2em]', statusColor)}>
          {running && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          {statusLabel}
        </span>
        <button onClick={onOpenConfig} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-white/10 text-[10px] font-bold tracking-[0.2em] text-white/80 hover:bg-white/5 transition-colors">
          <Settings className="w-3 h-3" /> CONFIG
        </button>
        <button onClick={onOpenTV} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-white/10 text-[10px] font-bold tracking-[0.2em] text-white/80 hover:bg-white/5 transition-colors">
          <Monitor className="w-3 h-3" /> TV
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// ScoreRail (lateral)
// ────────────────────────────────────────────────────────────────

function ScoreRail({
  side, pts, onScore, onGamjeom, pressed, showKbd,
}: {
  side: 'blue' | 'red';
  pts: Record<ScoreKey, number>;
  onScore: (t: ScoreKey) => void;
  onGamjeom: () => void;
  pressed: { side: 'blue' | 'red'; type: ScoreKey } | null;
  showKbd: boolean;
}) {
  const kbds = side === 'blue' ? STRIKE_KEYS_BLUE : STRIKE_KEYS_RED;
  const order: ScoreKey[] = ['gh', 'h', 'gb', 'b', 'p'];
  const isBlue = side === 'blue';

  return (
    <div
      className={cn(
        'w-[180px] flex flex-col gap-1.5 p-2.5',
        isBlue
          ? 'bg-gradient-to-b from-[#3b82f6] to-[#1e40af] rounded-r-[18px]'
          : 'bg-gradient-to-b from-[#dc2626] to-[#991b1b] rounded-l-[18px]',
      )}
    >
      <div className="text-center pt-1 pb-1.5">
        <div className="text-[9px] font-bold tracking-[0.3em] text-white/85">
          {isBlue ? 'CHUNG' : 'HONG'}
        </div>
      </div>
      {order.map((type) => (
        <ScoreButton
          key={type}
          side={side}
          type={type}
          pts={pts[type]}
          kbd={kbds[type]}
          pressed={pressed?.side === side && pressed.type === type}
          onClick={() => onScore(type)}
          showKbd={showKbd}
        />
      ))}
      <button
        onClick={onGamjeom}
        className="mt-1 py-2.5 rounded-[10px] text-[11px] font-bold tracking-[0.2em]"
        style={{
          background: 'rgba(233,180,24,.22)',
          color: '#fcd34d',
          border: '1px solid rgba(233,180,24,.45)',
        }}
      >
        GAM-JEOM
      </button>
    </div>
  );
}

function ScoreButton({
  side, type, pts, kbd, pressed, onClick, showKbd,
}: {
  side: 'blue' | 'red';
  type: ScoreKey;
  pts: number;
  kbd: string;
  pressed: boolean;
  onClick: () => void;
  showKbd: boolean;
}) {
  const label = STRIKE_TYPES[type].label;
  const icon = STRIKE_ICONS[type];
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 relative flex items-center justify-between px-3 rounded-[10px] transition-all',
        'border border-white/20 text-white',
      )}
      style={{
        background: 'rgba(0,0,0,.28)',
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        boxShadow: pressed ? 'inset 0 0 0 2px rgba(255,255,255,.5)' : undefined,
      }}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <div className="text-[32px] font-black leading-none tabular-nums">+{pts}</div>
      </div>
      <div className="text-[9px] font-bold tracking-[0.12em] text-right opacity-90">{label}</div>
      {showKbd && (
        <div className="absolute top-1 right-1">
          <Kbd>{kbd}</Kbd>
        </div>
      )}
    </button>
  );
}

const STRIKE_ICONS: Record<ScoreKey, React.ReactNode> = {
  h:  <HelmetIcon />,
  b:  <ChestIcon />,
  p:  <Hand className="w-5 h-5" strokeWidth={2.2} />,
  gh: <HelmetSpinIcon />,
  gb: <ChestSpinIcon />,
};

// Simple vector icons (inline) — helmet / chest with/without spin
function HelmetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-2v-5h-8v5H6a2 2 0 0 1-2-2z" />
    </svg>
  );
}
function ChestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M4 9h16" />
    </svg>
  );
}
function HelmetSpinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-2v-5h-8v5H6a2 2 0 0 1-2-2z" />
      <path d="M7 3l3 3-3 3" />
    </svg>
  );
}
function ChestSpinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M4 9h16" />
      <path d="M7 2l3 3-3 3" />
    </svg>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-black/40 border border-white/15 font-mono text-[9px] font-bold text-white/70">
      {children}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// AthletePanel
// ────────────────────────────────────────────────────────────────

function AthletePanel({
  side, athlete, score, isLeading, flash, strikes, hits, gamjeom, roundsWon, maxRounds,
}: {
  side: 'blue' | 'red';
  athlete: { name: string; country: string };
  score: number;
  isLeading: boolean;
  flash: { type: ScoreKey; pts: number; ts: number } | null;
  strikes: { type: ScoreKey; pts: number; round: number; ts: number }[];
  hits: number;
  gamjeom: number;
  roundsWon: number;
  maxRounds: number;
}) {
  const numberColor = isLeading ? '#FACC15' : '#fff';
  const bg = side === 'blue'
    ? 'bg-gradient-to-b from-[#3b82f6] to-[#1e3a8a]'
    : 'bg-gradient-to-b from-[#ef4444] to-[#7f1d1d]';

  return (
    <div className={cn('flex-1 relative overflow-hidden rounded-[14px] p-3.5 flex flex-col gap-2.5', bg)}>
      {/* Header */}
      <div className="flex justify-between items-start gap-2 relative z-[2]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="text-[10px] font-bold tracking-[0.3em] text-white/90">
              {side === 'blue' ? 'CHUNG' : 'HONG'}
            </div>
            {isLeading && (
              <div className="text-[9px] font-black tracking-[0.25em] text-black bg-[#FACC15] px-[7px] py-[2px] rounded-sm">
                LIDERA
              </div>
            )}
          </div>
          <div className="text-[18px] font-bold text-white truncate">{athlete.name}</div>
          <div className="text-[10px] font-mono text-white/70">{athlete.country}</div>
        </div>
      </div>

      {/* Score body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 relative z-[2]">
        <ScoreNumber value={score} color={numberColor} flash={flash} isLeading={isLeading} />
        <StrikeLog strikes={strikes} align={side === 'blue' ? 'left' : 'right'} />
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-4 gap-1.5 relative z-[2]">
        {[
          { l: 'GAM-JEOM', v: gamjeom, highlight: gamjeom >= 3 },
          { l: 'HITS',     v: hits,    highlight: false },
          { l: 'ROUNDS',   v: `${roundsWon}/${maxRounds}`, highlight: false },
          { l: 'WIN GAP',  v: roundsWon >= Math.ceil(maxRounds / 2) ? '✓' : '—', highlight: false },
        ].map((s, i) => (
          <div key={i} className="bg-black/30 rounded-[8px] py-1.5 text-center border border-white/[0.08]">
            <div className="text-[8px] font-bold tracking-[0.2em] text-white/60">{s.l}</div>
            <div
              className="text-[18px] font-black leading-tight tabular-nums"
              style={{ color: s.highlight ? '#FACC15' : '#fff' }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreNumber({
  value, color, flash, isLeading,
}: {
  value: number;
  color: string;
  flash: { type: ScoreKey; pts: number; ts: number } | null;
  isLeading: boolean;
}) {
  const [floaters, setFloaters] = useState<{ id: string; pts: number; type: ScoreKey }[]>([]);
  useEffect(() => {
    if (!flash) return;
    const id = `${flash.ts}-${Math.random()}`;
    setFloaters((fs) => [...fs, { id, pts: flash.pts, type: flash.type }]);
    const tid = setTimeout(() => setFloaters((fs) => fs.filter((f) => f.id !== id)), 900);
    return () => clearTimeout(tid);
  }, [flash?.ts]); // eslint-disable-line

  return (
    <div className="relative flex justify-center">
      <div
        className="font-black leading-[0.85] tabular-nums"
        style={{
          fontSize: 220,
          color,
          letterSpacing: '-0.04em',
          textShadow: isLeading ? '0 2px 0 rgba(0,0,0,.15)' : '0 0 40px rgba(255,255,255,.2)',
          animation: flash ? 'spe-score-pop .35s ease-out' : undefined,
        }}
      >
        {value}
      </div>
      {floaters.map((f) => (
        <div
          key={f.id}
          className="absolute top-[-10px] left-1/2 -translate-x-1/2 flex items-center gap-2 font-black whitespace-nowrap"
          style={{
            fontSize: 48,
            color: '#FACC15',
            animation: 'spe-float-up .9s ease-out forwards',
            textShadow: '0 4px 12px rgba(0,0,0,.5)',
          }}
        >
          +{f.pts}
        </div>
      ))}
    </div>
  );
}

function StrikeLog({
  strikes, align,
}: {
  strikes: { type: ScoreKey; pts: number; round: number; ts: number }[];
  align: 'left' | 'right';
}) {
  const items = strikes.slice(-5).reverse();
  return (
    <div
      className="flex gap-1.5 justify-center w-full min-h-[32px]"
      style={{ flexDirection: align === 'left' ? 'row-reverse' : 'row' }}
    >
      {items.map((s, i) => (
        <div
          key={`${s.round}-${s.ts}-${i}`}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/[0.18]"
          style={{
            background: 'rgba(0,0,0,.35)',
            opacity: 1 - i * 0.14,
          }}
        >
          <div className="w-3.5 h-3.5 text-white">{STRIKE_ICONS[s.type]}</div>
          <div className="text-[11px] font-black text-[#FACC15] tabular-nums">+{s.pts}</div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// CenterControl
// ────────────────────────────────────────────────────────────────

function CenterControl({
  round, maxRounds, timerSecs, totalSecs, running, isMedical, isBreak,
  onToggleTimer, onResetTime, onNextRound, onMedical, onBreak, onUndo, onEnd, showKbd,
}: {
  round: number;
  maxRounds: number;
  timerSecs: number;
  totalSecs: number;
  running: boolean;
  isMedical: boolean;
  isBreak: boolean;
  onToggleTimer: () => void;
  onResetTime: () => void;
  onNextRound: () => void;
  onMedical: () => void;
  onBreak?: () => void;
  onUndo: () => void;
  onEnd: () => void;
  showKbd: boolean;
}) {
  return (
    <div className="w-[240px] flex flex-col items-center gap-2.5 py-1">
      {/* Timer card */}
      <div className="w-full bg-black rounded-[16px] border border-white/[0.08] py-3.5 px-2.5 flex flex-col items-center gap-2">
        <div className="text-[10px] font-bold tracking-[0.25em] text-white/55">
          ROUND {round} / {maxRounds}
        </div>
        <TimerRing secs={timerSecs} total={totalSecs} size={180} running={running} />
        <div className="flex gap-1.5 mt-0.5">
          {Array.from({ length: maxRounds }).map((_, i) => {
            const r = i + 1;
            const color = r < round ? '#10B981' : r === round ? '#E11D48' : 'rgba(255,255,255,.1)';
            return <div key={r} className="w-8 h-[5px] rounded" style={{ background: color }} />;
          })}
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={onToggleTimer}
        className="w-full rounded-[12px] py-[18px] text-white font-black tracking-[0.22em] text-[17px] flex items-center justify-center gap-2.5 transition-transform active:scale-[0.97]"
        style={{
          background: running ? '#DC2626' : '#10B981',
          boxShadow: running ? '0 6px 18px rgba(220,38,38,.4)' : '0 6px 18px rgba(16,185,129,.4)',
          fontFamily: 'inherit',
        }}
      >
        {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        {running ? 'PAUSAR' : 'INICIAR'}
        {showKbd && <Kbd>␣</Kbd>}
      </button>

      {/* Secondary grid */}
      <div className="grid grid-cols-2 gap-[5px] w-full">
        <SmallBtn onClick={onResetTime}><RotateCcw className="w-3 h-3" /> RESET</SmallBtn>
        <SmallBtn onClick={onNextRound}><ArrowRight className="w-3 h-3" /> PRÓX. R</SmallBtn>
        <SmallBtn onClick={onMedical} orange active={isMedical}>
          <Stethoscope className="w-3 h-3" /> MÉDICO
        </SmallBtn>
        <SmallBtn onClick={onBreak} active={isBreak}>INTERVALO</SmallBtn>
        <SmallBtn onClick={onUndo} className="col-span-2">
          <Undo2 className="w-3 h-3" /> DESFAZER ÚLTIMO {showKbd && <Kbd>⌫</Kbd>}
        </SmallBtn>
        <SmallBtn onClick={onEnd} danger className="col-span-2">
          <Power className="w-3 h-3" /> ENCERRAR LUTA
        </SmallBtn>
      </div>
    </div>
  );
}

function SmallBtn({
  children, onClick, orange, danger, active, className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  orange?: boolean;
  danger?: boolean;
  active?: boolean;
  className?: string;
}) {
  const base = orange
    ? { background: active ? 'rgba(249,115,22,.25)' : 'rgba(249,115,22,.1)', color: '#fb923c', borderColor: 'rgba(249,115,22,.3)' }
    : danger
    ? { background: 'rgba(220,38,38,.15)', color: '#fca5a5', borderColor: 'rgba(220,38,38,.4)' }
    : { background: active ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)', color: '#fff', borderColor: 'rgba(255,255,255,.1)' };
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-[8px] py-2.5 text-[10px] font-bold tracking-[0.18em] border flex items-center justify-center gap-1.5',
        className,
      )}
      style={base}
    >
      {children}
    </button>
  );
}

function TimerRing({ secs, total, size, running }: { secs: number; total: number; size: number; running: boolean }) {
  const clampTotal = Math.max(1, total);
  const progress = Math.max(0, Math.min(1, secs / clampTotal));
  const circumference = Math.PI * 2 * (size / 2 - 8);
  const critical = secs <= 10 && running;
  const mins = Math.floor(secs / 60);
  const ss = secs % 60;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={size / 2} cy={size / 2} r={size / 2 - 8}
          fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={8}
        />
        <circle
          cx={size / 2} cy={size / 2} r={size / 2 - 8}
          fill="none"
          stroke={critical ? '#FACC15' : '#10B981'}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-black tabular-nums leading-none"
          style={{
            fontSize: 56,
            color: critical ? '#FACC15' : '#fff',
            animation: critical ? 'spe-pulse 1s infinite' : undefined,
          }}
        >
          {mins}:{String(ss).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Timeline rodapé
// ────────────────────────────────────────────────────────────────

function Timeline({
  round, maxRounds, timerSecs, blueRounds, redRounds,
}: {
  round: number;
  maxRounds: number;
  timerSecs: number;
  blueRounds: number[];
  redRounds: number[];
}) {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div className="h-[112px] shrink-0 bg-[#0F0F18] border-t border-white/[0.06] flex items-center px-3.5 gap-3.5">
      <div className="shrink-0">
        <div className="text-[8px] font-bold tracking-[0.3em] text-white/40">TIMELINE</div>
        <div className="text-[12px] font-bold tracking-[0.15em] text-white">R{round} · {fmt(timerSecs)}</div>
      </div>
      <div className="flex-1 flex gap-1.5 items-center">
        {Array.from({ length: maxRounds }).map((_, i) => {
          const r = i + 1;
          const b = blueRounds[r - 1] ?? 0;
          const rd = redRounds[r - 1] ?? 0;
          const tot = b + rd;
          return (
            <div
              key={r}
              className="flex-1 rounded-lg px-3 py-2 border"
              style={{
                background: 'rgba(255,255,255,.04)',
                borderColor: r === round ? 'rgba(225,29,72,.5)' : 'rgba(255,255,255,.06)',
              }}
            >
              <div className="flex justify-between items-center mb-1.5">
                <div
                  className="text-[9px] font-bold tracking-[0.22em]"
                  style={{ color: r === round ? '#E11D48' : 'rgba(255,255,255,.55)' }}
                >
                  ROUND {r}
                </div>
                <div className="font-mono text-[10px] text-white/40">
                  {r < round ? fmt(0) : r === round ? fmt(timerSecs) : '—'}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-[20px] font-black text-[#60a5fa] tabular-nums">{b}</div>
                <div className="flex-1 h-[5px] bg-white/[0.06] rounded relative overflow-hidden">
                  {tot > 0 && (
                    <>
                      <div className="absolute left-0 top-0 bottom-0 bg-[#3b82f6]" style={{ width: `${(b / tot) * 100}%` }} />
                      <div className="absolute right-0 top-0 bottom-0 bg-[#dc2626]" style={{ width: `${(rd / tot) * 100}%` }} />
                    </>
                  )}
                </div>
                <div className="text-[20px] font-black text-[#f87171] tabular-nums">{rd}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Confirm End Dialog
// ────────────────────────────────────────────────────────────────

function ConfirmEndDialog({
  blueScore, redScore, onCancel, onConfirm,
}: {
  blueScore: number;
  redScore: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="w-[440px] bg-[#12121A] border border-white/10 rounded-[16px] p-7">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#DC2626]/15 flex items-center justify-center">
            <AlertTriangle className="w-[22px] h-[22px] text-[#f87171]" />
          </div>
          <div>
            <div className="text-[18px] font-bold">Encerrar a luta?</div>
            <div className="text-[11px] text-white/60">Essa ação computa o resultado e avança para a próxima.</div>
          </div>
        </div>
        <div className="text-[12px] text-white/75 bg-white/[0.04] px-3 py-2.5 rounded-lg mb-4">
          Placar atual: <strong className="text-[#60a5fa]">CHUNG {blueScore}</strong> × <strong className="text-[#f87171]">{redScore} HONG</strong>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/[0.06] border border-white/[0.12] text-white rounded-[10px] py-3 font-bold tracking-[0.18em] text-[12px] hover:bg-white/[0.1] transition-colors"
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#DC2626] text-white rounded-[10px] py-3 font-black tracking-[0.18em] text-[12px] hover:bg-[#B91C1C] transition-colors"
          >
            ENCERRAR
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────────────────────────

function useDeriveStrikes(events: MatchEvent[], side: MatchSide) {
  return useMemo(() => {
    const out: { type: ScoreKey; pts: number; round: number; ts: number }[] = [];
    for (const ev of events) {
      if (ev.side !== side) continue;
      const key = SCORE_TYPE_TO_KEY[ev.type as ScoreType];
      if (!key) continue;
      out.push({ type: key, pts: ev.points ?? 0, round: 1, ts: ev.ts });
    }
    return out;
  }, [events, side]);
}
