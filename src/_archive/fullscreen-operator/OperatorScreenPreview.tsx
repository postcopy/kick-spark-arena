import { useEffect, useRef, useState } from 'react';
import { OperatorScreen } from '@/components/championship/OperatorScreen';
import {
  DEFAULT_MATCH_CONFIG,
  type MatchEvent,
  type MatchSide,
  type MatchState,
  type ScoreType,
} from '@/types/championship';

/**
 * Preview page — valida OperatorScreen (RODADA 3) sem tocar produção.
 * Mock state com placar 12x9, timer rodando em 1:42, round 2, strikes fake.
 */

type ScoreKey = 'h' | 'b' | 'p' | 'gh' | 'gb';

const STRIKE_TO_TYPE: Record<ScoreKey, ScoreType> = {
  h: 'HEAD', b: 'BODY', p: 'PUNCH', gh: 'SPIN_HEAD', gb: 'SPIN_BODY',
};

const POINTS: Record<ScoreType, number> = {
  HEAD: 3, BODY: 2, PUNCH: 1, SPIN_HEAD: 6, SPIN_BODY: 4, GAMJEOM: 1,
};

function mkEvent(side: MatchSide, type: ScoreType, ts: number): MatchEvent {
  return {
    id: `${ts}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    side,
    points: type === 'GAMJEOM' ? 1 : POINTS[type],
    ts,
    description: `${side} ${type}`,
  };
}

const now = Date.now();
const seedEvents: MatchEvent[] = [
  mkEvent('BLUE', 'HEAD',      now - 92_000),
  mkEvent('BLUE', 'BODY',      now - 78_000),
  mkEvent('RED',  'BODY',      now - 64_000),
  mkEvent('BLUE', 'PUNCH',     now - 55_000),
  mkEvent('RED',  'HEAD',      now - 48_000),
  mkEvent('BLUE', 'SPIN_BODY', now - 40_000),
  mkEvent('RED',  'BODY',      now - 30_000),
  mkEvent('BLUE', 'BODY',      now - 22_000),
  mkEvent('RED',  'PUNCH',     now - 14_000),
  mkEvent('BLUE', 'HEAD',      now -  8_000),
];

const initialState: MatchState = {
  status: 'RUNNING',
  round: 2,
  timeLeftMs: 102_000, // 1:42
  roundScoreRed: 3,
  roundScoreBlue: 8,
  roundHistoryRed:  [6],
  roundHistoryBlue: [4],
  hitsRed: 2,
  hitsBlue: 5,
  roundWinsRed: 0,
  roundWinsBlue: 1,
  gamjeomRed: 1,
  gamjeomBlue: 0,
  events: seedEvents,
  lastUpdate: now,
  isMedicalTime: false,
  config: {
    ...DEFAULT_MATCH_CONFIG,
    matchNumber: '042',
    matId: 1,
  },
  hasConfig: true,
};

export default function OperatorScreenPreview() {
  const [state, setState] = useState<MatchState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Tick timer pra validar o comportamento visual
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        if (s.status !== 'RUNNING') return s;
        const next = Math.max(0, s.timeLeftMs - 1000);
        return { ...s, timeLeftMs: next, lastUpdate: Date.now() };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function applyScore(side: MatchSide, key: ScoreKey) {
    const type = STRIKE_TO_TYPE[key];
    const pts = POINTS[type];
    const ev = mkEvent(side, type, Date.now());
    setState((s) => ({
      ...s,
      roundScoreBlue: s.roundScoreBlue + (side === 'BLUE' ? pts : 0),
      roundScoreRed:  s.roundScoreRed  + (side === 'RED'  ? pts : 0),
      hitsBlue: s.hitsBlue + (side === 'BLUE' ? 1 : 0),
      hitsRed:  s.hitsRed  + (side === 'RED'  ? 1 : 0),
      events: [...s.events, ev],
      lastEvent: ev,
      lastUpdate: Date.now(),
    }));
  }

  function applyGamjeom(side: MatchSide) {
    const opp: MatchSide = side === 'BLUE' ? 'RED' : 'BLUE';
    const ev: MatchEvent = {
      id: `${Date.now()}-gj`,
      type: 'GAMJEOM',
      side,
      points: 1,
      ts: Date.now(),
      description: `GAM-JEOM ${side}`,
    };
    setState((s) => ({
      ...s,
      gamjeomBlue: s.gamjeomBlue + (side === 'BLUE' ? 1 : 0),
      gamjeomRed:  s.gamjeomRed  + (side === 'RED'  ? 1 : 0),
      roundScoreBlue: s.roundScoreBlue + (opp === 'BLUE' ? 1 : 0),
      roundScoreRed:  s.roundScoreRed  + (opp === 'RED'  ? 1 : 0),
      events: [...s.events, ev],
      lastEvent: ev,
      lastUpdate: Date.now(),
    }));
  }

  function toggleTimer() {
    setState((s) => ({
      ...s,
      status: s.status === 'RUNNING' ? 'PAUSED' : 'RUNNING',
      lastUpdate: Date.now(),
    }));
  }

  function resetTime() {
    setState((s) => ({
      ...s,
      timeLeftMs: s.config.roundTimeMs,
      status: 'PAUSED',
      lastUpdate: Date.now(),
    }));
  }

  function nextRound() {
    setState((s) => ({
      ...s,
      round: Math.min(3, s.round + 1) as 1 | 2 | 3,
      timeLeftMs: s.config.roundTimeMs,
      roundScoreBlue: 0,
      roundScoreRed: 0,
      hitsBlue: 0,
      hitsRed: 0,
      status: 'PAUSED',
      lastUpdate: Date.now(),
    }));
  }

  function undo() {
    setState((s) => {
      const evs = [...s.events];
      const last = evs.pop();
      if (!last) return s;
      const delta = last.points ?? 0;
      let nextBlue = s.roundScoreBlue;
      let nextRed = s.roundScoreRed;
      let gjBlue = s.gamjeomBlue;
      let gjRed  = s.gamjeomRed;
      if (last.type === 'GAMJEOM') {
        if (last.side === 'BLUE') { gjBlue -= 1; nextRed -= 1; }
        else                      { gjRed  -= 1; nextBlue -= 1; }
      } else if (last.side === 'BLUE') nextBlue -= delta;
      else if (last.side === 'RED')    nextRed  -= delta;
      return {
        ...s,
        events: evs,
        roundScoreBlue: Math.max(0, nextBlue),
        roundScoreRed:  Math.max(0, nextRed),
        gamjeomBlue: Math.max(0, gjBlue),
        gamjeomRed:  Math.max(0, gjRed),
        lastUpdate: Date.now(),
      };
    });
  }

  return (
    <OperatorScreen
      state={state}
      athleteBlue={{ name: 'SILVA, C.', country: 'BRA' }}
      athleteRed={{ name: 'KIM, J.', country: 'KOR' }}
      matId={1}
      category="SENIOR M -68kg"
      onScore={applyScore}
      onGamjeom={applyGamjeom}
      onToggleTimer={toggleTimer}
      onResetTime={resetTime}
      onNextRound={nextRound}
      onMedical={() => console.log('[preview] medical')}
      onBreak={() => console.log('[preview] break')}
      onUndo={undo}
      onEndMatch={() => console.log('[preview] end match')}
      onOpenConfig={() => console.log('[preview] config')}
      onOpenTV={() => console.log('[preview] tv')}
    />
  );
}
