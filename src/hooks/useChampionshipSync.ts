import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import {
  MatchState,
  MatchConfig,
  MatchEvent,
  MatchSide,
  ScoreType,
  INITIAL_MATCH_STATE,
  MAX_HISTORY_SIZE,
  getChannelName,
  getStorageKey,
  getConfigStorageKey,
  getScoreValue,
} from '@/types/championship';
import type { ChampionshipSyncMessage } from '@/types/championship';
import { useRealtimeSync } from './useRealtimeSync';
import { supabase } from '@/integrations/supabase/client';
import { migrateMatchConfig } from '@/lib/matchConfigMigration';
import { WT_RULESET_PRESETS } from '@/lib/wtRuleset';

// Maximum events to keep in history
const MAX_EVENTS = 500;

interface UseChampionshipSyncOptions {
  role: 'master' | 'listener';
  matId?: number;
  academyId?: string; // user.id from AuthContext — unique per academy, used for live_scores
  onCommand?: (event: string, payload: unknown) => void;
}

interface UseChampionshipSyncReturn {
  state: MatchState;
  isConnected: boolean;
  connectedDevices: number;

  // Timer controls (master only)
  startTimer: () => void;
  pauseTimer: () => void;
  resetTime: () => void;
  startMedicalTime: () => void;
  endMedicalTime: () => void;

  // Match controls (master only)
  endRound: () => void;
  nextRound: () => void;
  endMatch: () => void;
  declareRoundWinner: (side: MatchSide) => void;
  resetMatch: () => void;

  // Scoring (master only)
  addScore: (side: MatchSide, type: ScoreType) => void;
  addHit: (side: MatchSide) => void;
  addGamjeom: (side: MatchSide, reason?: import('@/types/championship').GamjeomReason) => void;
  removeGamjeom: (side: MatchSide) => void;
  adjustScore: (side: MatchSide, roundScore: number, gamjeom: number) => void;
  reverseSides: () => void;

  // Undo (master only)
  undoLast: () => void;
  canUndo: boolean;

  // Config
  saveConfig: (config: MatchConfig) => void;
  updateConfigInPlace: (updater: (config: MatchConfig) => MatchConfig) => void;
  hasConfig: boolean;
}

// Helper to create event
function createEvent(
  type: MatchEvent['type'],
  description: string,
  side?: MatchSide,
  points?: number,
  extra?: { reason?: import('@/types/championship').GamjeomReason; operatorId?: string }
): MatchEvent {
  return {
    id: crypto.randomUUID(),
    type,
    side,
    points,
    ts: Date.now(),
    description,
    ...(extra?.reason ? { reason: extra.reason } : {}),
    ...(extra?.operatorId ? { operatorId: extra.operatorId } : {}),
  };
}

export function useChampionshipSync({
  role,
  matId = 1,
  academyId,
  onCommand,
}: UseChampionshipSyncOptions): UseChampionshipSyncReturn {
  const onCommandRef = useRef(onCommand);
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  const [state, setState] = useState<MatchState>(() => {
    // Try to load from localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(getStorageKey(matId));
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<MatchState>;
          // Migrate config aninhado (WT ruleset, pre-v1.5.0 sem rulesetVersion).
          if (parsed?.config) parsed.config = migrateMatchConfig(parsed.config);
          // Stale-state guard: if persisted state is older than 4h, discard (likely abandoned match).
          const STALE_TTL_MS = 4 * 60 * 60 * 1000;
          const persistedAt = typeof parsed.lastUpdate === 'number' ? parsed.lastUpdate : 0;
          if (persistedAt && Date.now() - persistedAt > STALE_TTL_MS) {
            return INITIAL_MATCH_STATE;
          }
          // Hydration safety: never resume in RUNNING or MEDICAL — wall-clock delta during downtime
          // would be wrong, and operator must consciously resume after reload. Force PAUSED.
          const safeStatus = (parsed.status === 'RUNNING' || parsed.status === 'MEDICAL')
            ? 'PAUSED' as const
            : parsed.status;
          // Migrate: older builds didn't persist roundHistoryRed/Blue.
          return {
            ...INITIAL_MATCH_STATE,
            ...parsed,
            status: safeStatus ?? INITIAL_MATCH_STATE.status,
            roundHistoryRed: Array.isArray(parsed.roundHistoryRed) ? parsed.roundHistoryRed : [],
            roundHistoryBlue: Array.isArray(parsed.roundHistoryBlue) ? parsed.roundHistoryBlue : [],
            events: Array.isArray(parsed.events) ? parsed.events : [],
          };
        } catch { /* ignore */ }
      }
    }
    return INITIAL_MATCH_STATE;
  });
  
  const [history, setHistory] = useState<MatchState[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // stateRef: always points to latest state, used inside stable callbacks
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const channel = useRef<BroadcastChannel | null>(null);
  const lastSyncedSecond = useRef<number>(-1);
  const lastSyncTime = useRef<number>(0);
  const lastBcTime = useRef<number>(0);  // throttle BroadcastChannel to avoid flooding TV with renders
  const lastStorageWriteRef = useRef<number>(0);  // throttle localStorage writes during 100ms timer ticks
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartRef = useRef<number>(0);        // Date.now() when timer last started/resumed
  const timerStartValueRef = useRef<number>(0);    // timeLeftMs snapshot at that moment
  const lastDbSyncRef = useRef<number>(0);          // throttle live_scores upserts to every 2s

  // Callback for Realtime messages (listener only)
  // Skip if BroadcastChannel is active (same device — BC is faster and more complete)
  const handleRealtimeMessage = useCallback((event: string, payload: unknown) => {
    if (role !== 'listener') return;
    if (event === 'match-state' && payload) {
      // If BroadcastChannel received data recently, skip Realtime to avoid double-setState
      if (Date.now() - bcLastReceived.current < 3000) return;
      const incoming = payload as MatchState;
      // Guarda anti-regressao: se payload eh mais antigo que estado atual,
      // ignora. Evita o bug do TV flashar pra estado default (2:00) quando
      // heartbeat/polling entrega um snapshot stale depois de config nova.
      // UI-AUDIT H7: usar <= em vez de < — payload com mesmo timestamp e
      // status diferente nao deve sobrescrever (race entre canais).
      // UI-AUDIT H3/H4: MATCH_END eh sticky — so sai com payload estritamente
      // mais novo. Snapshots stale do live_scores nao podem reverter pra placar.
      setState(prev => {
        if (incoming.lastUpdate && prev.lastUpdate && incoming.lastUpdate <= prev.lastUpdate) {
          return prev;
        }
        if (prev.status === 'MATCH_END' && incoming.status !== 'MATCH_END') {
          if (!incoming.lastUpdate || !prev.lastUpdate || incoming.lastUpdate <= prev.lastUpdate) {
            return prev;
          }
        }
        return incoming;
      });
      setIsConnected(true);
    } else {
      // Forward command messages (show-bracket, show-scoreboard) to consumer
      onCommandRef.current?.(event, payload);
    }
  }, [role]);

  // Supabase Realtime sync (cross-device)
  const {
    send: realtimeSend,
    isConnected: realtimeConnected,
    connectedDevices,
  } = useRealtimeSync({
    matId,
    role,
    onMessage: handleRealtimeMessage,
  });

  // Track connection from either source.
  // For listeners: isConnected = true as soon as the Realtime channel subscribes.
  // This means the LiveScore page shows the initial IDLE state immediately
  // instead of "SEM SINAL" while waiting for the first match-state message.
  // "SEM SINAL" now only appears when the channel truly cannot connect.
  useEffect(() => {
    if (realtimeConnected) {
      setIsConnected(true);
    } else if (role === 'listener') {
      // Channel disconnected — show "SEM SINAL" again for listeners
      setIsConnected(false);
    }
  }, [realtimeConnected, role]);

  // When a new listener connects (connectedDevices increases), force-broadcast current state
  // This ensures late-joining devices (mobile live score) get the current match state immediately
  const prevDeviceCountRef = useRef(connectedDevices);
  useEffect(() => {
    if (role !== 'master') return;
    if (connectedDevices > prevDeviceCountRef.current && connectedDevices > 1) {
      // New device joined — send current state immediately
      const stateToSync = { ...stateRef.current, lastUpdate: Date.now() };
      const networkPayload = { ...stateToSync, events: stateToSync.events.slice(0, 100) };
      realtimeSendRef.current('match-state', networkPayload);
      logger.log('[Sync] New device joined, force-broadcast state');
    }
    prevDeviceCountRef.current = connectedDevices;
  }, [connectedDevices, role]);

  // Heartbeat: master sends state every 5s to keep remote listeners in sync.
  // Always broadcasts regardless of connectedDevices count to avoid the race
  // condition where a listener has subscribed but Presence hasn't synced yet
  // on the master side, leaving the listener stuck without data.
  useEffect(() => {
    if (role !== 'master') return;
    const heartbeat = setInterval(() => {
      const stateToSync = { ...stateRef.current, lastUpdate: Date.now() };
      const networkPayload = { ...stateToSync, events: stateToSync.events.slice(0, 100) };
      realtimeSendRef.current('match-state', networkPayload);
    }, 5000);
    return () => clearInterval(heartbeat);
  }, [role]);

  // HTTP polling fallback: master pushes initial state on mount.
  // We DO NOT delete the row on unmount — late-joining spectators would lose access,
  // and transient remounts (HMR, route change, modal nav) would wipe live data.
  // The row is overwritten by the next active master or expires by table TTL policy.
  useEffect(() => {
    if (role !== 'master' || !academyId) return;
    // Read-modify-write: only push initial state if no fresher row exists.
    // Prevents a reload-mid-match from overwriting the live row with a stale snapshot.
    (async () => {
      try {
        const { data } = await supabase
          .from('live_scores')
          .select('state, updated_at')
          .eq('academy_id', academyId)
          .eq('mat_id', matId)
          .single();
        const existing = data?.state as Partial<MatchState> | undefined;
        const existingUpdate = typeof existing?.lastUpdate === 'number' ? existing.lastUpdate : 0;
        const localUpdate = stateRef.current.lastUpdate ?? 0;
        if (existingUpdate > localUpdate) {
          // Remote is fresher — don't overwrite. Master will start broadcasting from current state anyway.
          return;
        }
      } catch { /* row missing is fine */ }
      supabase.from('live_scores').upsert({
        academy_id: academyId,
        mat_id: matId,
        state: stateRef.current,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'academy_id,mat_id' });
    })();
  }, [role, matId, academyId]);

  // Track if BroadcastChannel is actively receiving data (same-device sync)
  const bcActiveRef = useRef(false);
  const bcLastReceived = useRef(0);

  // HTTP polling fallback for listeners (ONLY when both Realtime AND BroadcastChannel are not working)
  useEffect(() => {
    if (role !== 'listener') return;
    if (!academyId) return;
    // Skip polling if Realtime is connected
    if (realtimeConnected) return;

    let cancelled = false;
    const poll = async () => {
      // Skip if BroadcastChannel received data in the last 3 seconds (same-device sync working)
      if (Date.now() - bcLastReceived.current < 3000) return;

      try {
        const { data, error } = await supabase
          .from('live_scores')
          .select('state, updated_at')
          .eq('academy_id', academyId)
          .eq('mat_id', matId)
          .single();

        if (!cancelled && data?.state && !error) {
          const incoming = data.state as MatchState;
          // UI-AUDIT R8-H4: row stale (master encerrou luta ha tempo, nao
          // upserta mais) nao pode marcar listener como "AO VIVO". Espectador
          // veria placar congelado com indicador de luta ao vivo. 60s de
          // tolerancia: master ativo upserta a cada 500ms, entao 60s+ e morto.
          const updatedAt = data.updated_at ? new Date(data.updated_at).getTime() : 0;
          const isStaleRow = updatedAt > 0 && Date.now() - updatedAt > 60_000;
          if (isStaleRow) {
            // Nao atualiza state nem marca isConnected — preserva ultimo estado
            // valido (ou IDLE inicial). UI deve continuar mostrando "SEM SINAL"
            // ou ultimo placar conhecido sem chrome de "AO VIVO".
            setIsConnected(false);
            return;
          }
          // Guarda anti-regressao: polling pode retornar linha stale se
          // master acabou de atualizar. Rejeita qualquer payload com
          // lastUpdate mais antigo que o que ja temos.
          setState(prev => {
            // UI-AUDIT H7: <= ao inves de <.
            if (incoming.lastUpdate && prev.lastUpdate && incoming.lastUpdate <= prev.lastUpdate) {
              return prev;
            }
            // UI-AUDIT H3/H4: MATCH_END sticky contra polling stale (master para
            // de upsertar em MATCH_END, entao live_scores fica com row pre-final
            // ate proxima luta). Listener nao pode regredir pra placar.
            if (prev.status === 'MATCH_END' && incoming.status !== 'MATCH_END') {
              return prev;
            }
            return incoming;
          });
          setIsConnected(true);
        }
      } catch { /* ignore */ }
    };

    // Poll immediately, then every 500ms for near-realtime updates
    poll();
    const interval = setInterval(poll, 500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role, matId, academyId, realtimeConnected]);

  // Initialize BroadcastChannel (same-device sync, lower latency)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    channel.current = new BroadcastChannel(getChannelName(matId));

    if (role === 'listener') {
      channel.current.onmessage = (event) => {
        const msg = event.data;
        const payload = msg?.type === 'MATCH_STATE' ? msg.payload : (msg?.status !== undefined ? msg : null);
        if (payload) {
          // Only update if something meaningful changed (avoid redundant renders)
          setState(prev => {
            // Guarda anti-regressao por timestamp: rejeita payload mais antigo
            // que estado atual. Evita flash pra estado default quando um
            // heartbeat/reconnect entrega snapshot stale.
            // UI-AUDIT H7: <= ao inves de < — mesmo timestamp com status
            // diferente eh race entre canais (Realtime + BC), nao update legitimo.
            if (payload.lastUpdate && prev.lastUpdate && payload.lastUpdate <= prev.lastUpdate) {
              return prev;
            }
            // UI-AUDIT H3/H4: MATCH_END eh sticky no listener. Reset legitimo do
            // master vem com timestamp NOVO (passa o guard acima). Mas snapshots
            // stale (heartbeat com lastUpdate ausente, BC duplicado) nao podem
            // reverter MATCH_END pra placar — flicker visivel ao publico.
            if (prev.status === 'MATCH_END' && payload.status !== 'MATCH_END') {
              if (!payload.lastUpdate || !prev.lastUpdate || payload.lastUpdate <= prev.lastUpdate) {
                return prev;
              }
            }
            if (prev.timeLeftMs === payload.timeLeftMs &&
                prev.roundScoreRed === payload.roundScoreRed &&
                prev.roundScoreBlue === payload.roundScoreBlue &&
                prev.status === payload.status &&
                prev.round === payload.round &&
                prev.gamjeomRed === payload.gamjeomRed &&
                prev.gamjeomBlue === payload.gamjeomBlue &&
                // Flags adicionais: sem isso, transicoes pra/de break/medical/golden
                // que nao mudam nenhum dos campos acima ficam invisiveis no listener
                // (TV nao mostra "INTERVALO", chrome de medical nao aparece).
                prev.isBreakTime === payload.isBreakTime &&
                prev.breakTimeLeftMs === payload.breakTimeLeftMs &&
                prev.isGoldenRound === payload.isGoldenRound &&
                prev.isMedicalTime === payload.isMedicalTime &&
                prev.roundWinsRed === payload.roundWinsRed &&
                prev.roundWinsBlue === payload.roundWinsBlue) {
              return prev; // No change — skip render
            }
            return payload;
          });
          setIsConnected(true);
          bcActiveRef.current = true;
          bcLastReceived.current = Date.now();
        }
      };

      // StorageEvent disabled — BroadcastChannel is the primary same-device sync.
      // Having both caused double setState calls and score flickering.

      const stored = localStorage.getItem(getStorageKey(matId));
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<MatchState>;
          // Migrate config aninhado (mesma justificativa do useState init acima).
          if (parsed?.config) parsed.config = migrateMatchConfig(parsed.config);
          // Stale-state guard (UI-AUDIT H1): listener remontando durante MATCH_END
          // nao pode aceitar localStorage com lastUpdate antigo, senao sobrescreve
          // estado fresco do BC e causa flicker pra placar pre-final.
          const STALE_TTL_MS = 4 * 60 * 60 * 1000;
          const persistedAt = typeof parsed.lastUpdate === 'number' ? parsed.lastUpdate : 0;
          const tooStale = persistedAt && Date.now() - persistedAt > STALE_TTL_MS;
          if (tooStale) {
            // Skip hydration — BC/Realtime/polling will deliver fresh state.
          } else {
          // Hydration safety (UI-AUDIT H1): nunca resumir em RUNNING/MEDICAL no listener
          // tambem — wall-clock delta seria errado e operador precisa retomar conscientemente.
          const safeStatus = (parsed.status === 'RUNNING' || parsed.status === 'MEDICAL')
            ? 'PAUSED' as const
            : parsed.status;
          setState(prev => {
            // Anti-regression: se ja temos um snapshot mais novo (ex: BC chegou
            // antes do mount completar), nao sobrescrever com localStorage antigo.
            const incomingTs = persistedAt;
            const prevTs = prev.lastUpdate ?? 0;
            if (prevTs > 0 && incomingTs > 0 && incomingTs <= prevTs) return prev;
            return {
              ...INITIAL_MATCH_STATE,
              ...parsed,
              status: safeStatus ?? INITIAL_MATCH_STATE.status,
              roundHistoryRed: Array.isArray(parsed.roundHistoryRed) ? parsed.roundHistoryRed : [],
              roundHistoryBlue: Array.isArray(parsed.roundHistoryBlue) ? parsed.roundHistoryBlue : [],
              events: Array.isArray(parsed.events) ? parsed.events : [],
            };
          });
          setIsConnected(true);
          } // end else (not stale)
        } catch { /* ignore */ }
      }

      return () => {
        channel.current?.close();
      };
    }

    return () => {
      channel.current?.close();
    };
  }, [matId, role]);

  // Stable ref for realtimeSend to avoid broadcast identity changing
  const realtimeSendRef = useRef(realtimeSend);
  useEffect(() => { realtimeSendRef.current = realtimeSend; }, [realtimeSend]);

  // Broadcast state with throttle — dual: BroadcastChannel + Supabase Realtime
  // IMPORTANT: deps are [role, matId] only — realtimeSend is read via ref to avoid
  // re-creating broadcast (which would restart the timer interval).
  const broadcast = useCallback((newState: MatchState, forceSync = false) => {
    if (role !== 'master') return;

    const currentSecond = Math.floor(newState.timeLeftMs / 1000);
    const now = Date.now();

    const secondChanged = currentSecond !== lastSyncedSecond.current;
    const timePassed = now - lastSyncTime.current > 300;

    const stateToSync = { ...newState, lastUpdate: now };

    // BroadcastChannel: throttle to max ~5 updates/sec (200ms) to avoid flooding
    // the TV with renders that cause timer flicker.  Force-syncs (score changes,
    // round transitions) always send immediately.
    const bcElapsed = now - lastBcTime.current;
    if (forceSync || bcElapsed >= 200) {
      channel.current?.postMessage({ type: 'MATCH_STATE', payload: stateToSync });
      lastBcTime.current = now;
    }
    // Throttle localStorage writes — running timer fires every 100ms, but reload-recovery
    // only needs ~1Hz freshness. Force-syncs (scores, transitions) write immediately.
    if (forceSync || now - lastStorageWriteRef.current >= 1000) {
      localStorage.setItem(getStorageKey(matId), JSON.stringify(stateToSync));
      lastStorageWriteRef.current = now;
    }

    if (secondChanged || timePassed || forceSync) {
      // Network: Supabase Realtime (cross-device, ~100-200ms)
      // Keep enough events for TV stats to work correctly
      const networkPayload = { ...stateToSync, events: stateToSync.events.slice(0, 100) };
      realtimeSendRef.current('match-state', networkPayload);
      lastSyncedSecond.current = currentSecond;
      lastSyncTime.current = now;

    }
  }, [role, matId]);

  // HTTP polling fallback: independent 500ms upsert to live_scores (only during active match)
  useEffect(() => {
    if (role !== 'master' || !academyId) return;
    const interval = setInterval(() => {
      const current = stateRef.current;
      // Skip upsert when match is idle/ended — saves bandwidth and avoids overwriting
      // a fresher row with stale "ended" state if a new master takes over the mat.
      if (current.status === 'IDLE' || current.status === 'MATCH_END') return;
      const payload = { ...current, events: current.events.slice(0, 100), lastUpdate: Date.now() };
      supabase.from('live_scores').upsert({
        academy_id: academyId,
        mat_id: matId,
        state: payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'academy_id,mat_id' }).then(({ error }) => {
        if (error) logger.warn('[Sync] live_scores upsert failed:', error.message);
      });
    }, 500);
    return () => clearInterval(interval);
  }, [role, matId, academyId]);
  
  // Handle round end (time up)
  const handleRoundEnd = useCallback((prev: MatchState): MatchState => {
    const { roundScoreRed, roundScoreBlue, hitsRed, hitsBlue, config } = prev;

    // Golden round ended by time with no score — tie / referee decision
    if (prev.isGoldenRound) {
      if (roundScoreRed > roundScoreBlue) {
        return handleRoundEndWithWinner(prev, 'RED', 'GOLDEN_ROUND', 'Golden Round! Vermelho vence');
      } else if (roundScoreBlue > roundScoreRed) {
        return handleRoundEndWithWinner(prev, 'BLUE', 'GOLDEN_ROUND', 'Golden Round! Azul vence');
      }
      // No score in golden round — go to MATCH_END (referee decision)
      return {
        ...prev,
        timeLeftMs: 0,
        status: 'MATCH_END',
        events: [createEvent('MATCH_END', 'Golden Round sem pontuação — decisão do árbitro'), ...prev.events].slice(0, MAX_EVENTS),
      };
    }

    if (roundScoreRed > roundScoreBlue) {
      return handleRoundEndWithWinner(prev, 'RED', 'ROUND_END', 'Tempo! Vermelho vence o round');
    } else if (roundScoreBlue > roundScoreRed) {
      return handleRoundEndWithWinner(prev, 'BLUE', 'ROUND_END', 'Tempo! Azul vence o round');
    } else {
      // Tied on points — check tiebreak by hits
      if (config.tiebreakByHits !== false) {
        if (hitsRed > hitsBlue) {
          return handleRoundEndWithWinner(prev, 'RED', 'ROUND_END', 'Tempo! Vermelho vence por superioridade (HITS)');
        } else if (hitsBlue > hitsRed) {
          return handleRoundEndWithWinner(prev, 'BLUE', 'ROUND_END', 'Tempo! Azul vence por superioridade (HITS)');
        }
      }
      // Hits also tied or tiebreak disabled — manual decision
      return {
        ...prev,
        timeLeftMs: 0,
        status: 'ROUND_END',
        isBreakTime: true,
        breakTimeLeftMs: prev.config.breakTimeMs,
        events: [createEvent('ROUND_END', 'Empate! Aguardando decisão'), ...prev.events].slice(0, MAX_EVENTS),
      };
    }
  }, []);
  
  // Handle round end with winner
  const handleRoundEndWithWinner = useCallback((
    prev: MatchState,
    winner: MatchSide,
    eventType: MatchEvent['type'],
    description: string
  ): MatchState => {
    const newWinsRed = winner === 'RED' ? prev.roundWinsRed + 1 : prev.roundWinsRed;
    const newWinsBlue = winner === 'BLUE' ? prev.roundWinsBlue + 1 : prev.roundWinsBlue;
    const winsNeeded = prev.config.maxRounds === 1 ? 1 : 2;

    // Snapshot the current round score into history (once per round)
    const historyLen = prev.roundHistoryBlue.length;
    const shouldSnapshot = historyLen < prev.round;
    const nextHistoryRed = shouldSnapshot ? [...prev.roundHistoryRed, prev.roundScoreRed] : prev.roundHistoryRed;
    const nextHistoryBlue = shouldSnapshot ? [...prev.roundHistoryBlue, prev.roundScoreBlue] : prev.roundHistoryBlue;

    // Golden round win -> always MATCH_END
    if (prev.isGoldenRound) {
      return {
        ...prev,
        timeLeftMs: 0,
        status: 'MATCH_END',
        isGoldenRound: false,
        roundWinsRed: newWinsRed,
        roundWinsBlue: newWinsBlue,
        roundHistoryRed: nextHistoryRed,
        roundHistoryBlue: nextHistoryBlue,
        events: [createEvent(eventType, description, winner), ...prev.events].slice(0, MAX_EVENTS),
      };
    }

    const someoneWon = newWinsRed >= winsNeeded || newWinsBlue >= winsNeeded;

    // Check if this is the last configured round and round wins are tied -> golden round needed
    if (!someoneWon && prev.round >= prev.config.maxRounds && newWinsRed === newWinsBlue) {
      // Tied after all configured rounds — will need golden round
      // Go to ROUND_END first, then nextRound will set up golden round
    }

    const isMatchOver = someoneWon;

    // Start break timer if there are more rounds to play
    const hasMoreRounds = !isMatchOver;

    return {
      ...prev,
      timeLeftMs: 0,
      status: isMatchOver ? 'MATCH_END' : 'ROUND_END',
      roundWinsRed: newWinsRed,
      roundWinsBlue: newWinsBlue,
      roundHistoryRed: nextHistoryRed,
      roundHistoryBlue: nextHistoryBlue,
      isBreakTime: hasMoreRounds ? true : undefined,
      breakTimeLeftMs: hasMoreRounds ? prev.config.breakTimeMs : undefined,
      events: [createEvent(eventType, description, winner), ...prev.events].slice(0, MAX_EVENTS),
    };
  }, []);
  
  // Timer logic — uses performance.now() delta (monotonic, immune to OS clock jumps from NTP/RTC)
  useEffect(() => {
    if (role !== 'master') return;
    if (state.status !== 'RUNNING' && state.status !== 'MEDICAL') return;

    // Anchor the timer refs each time the timer (re)starts.
    // performance.now() is monotonic and unaffected by wall-clock changes.
    timerStartRef.current = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    timerStartValueRef.current = state.timeLeftMs;

    timerRef.current = setInterval(() => {
      const nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const elapsed = Math.max(0, nowMs - timerStartRef.current);
      const newTime = Math.max(0, timerStartValueRef.current - elapsed);
      const current = stateRef.current;

      // Guard: stop if status changed externally
      if (current.status !== 'RUNNING' && current.status !== 'MEDICAL') return;

      if (newTime <= 0) {
        // Time's up — handle round end or medical end
        setState(prev => {
          if (prev.status !== 'RUNNING' && prev.status !== 'MEDICAL') return prev;
          if (prev.isMedicalTime) {
            const restoredState: MatchState = {
              ...prev,
              timeLeftMs: prev.savedTimeMs || prev.config.roundTimeMs,
              status: 'PAUSED',
              isMedicalTime: false,
              savedTimeMs: undefined,
              events: [createEvent('MEDICAL_END', 'Tempo médico encerrado'), ...prev.events].slice(0, MAX_EVENTS),
            };
            broadcast(restoredState, true);
            return restoredState;
          } else {
            const newState = handleRoundEnd(prev);
            broadcast(newState, true);
            return newState;
          }
        });
      } else {
        // Normal tick — only update timeLeftMs, broadcast from stateRef (always fresh)
        setState(prev => {
          if (prev.status !== 'RUNNING' && prev.status !== 'MEDICAL') return prev;
          return { ...prev, timeLeftMs: newTime };
        });
        // Broadcast using stateRef (has latest scores) with updated time
        const toBroadcast = { ...stateRef.current, timeLeftMs: newTime };
        broadcast(toBroadcast);
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  // NOTE: state.timeLeftMs is intentionally excluded — we only re-anchor when
  // status changes (RUNNING/MEDICAL ↔ PAUSED), not on every tick.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, role, broadcast, handleRoundEnd]);

  // Break timer countdown — uses Date.now() delta pattern (same as main timer)
  const breakTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakTimerStartRef = useRef<number>(0);
  const breakTimerStartValueRef = useRef<number>(0);

  useEffect(() => {
    if (role !== 'master') return;
    if (!state.isBreakTime || state.status !== 'ROUND_END') return;

    breakTimerStartRef.current = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    breakTimerStartValueRef.current = state.breakTimeLeftMs || 0;

    breakTimerRef.current = setInterval(() => {
      // Guarda externa via stateRef: para o tick imediatamente se status mudou
      // (ex: endMatch chamado durante break). Sem isso, setInterval continuava
      // disparando 100ms ate effect re-rodar e clearInterval.
      const current = stateRef.current;
      if (!current.isBreakTime || current.status === 'MATCH_END') return;

      const nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const elapsed = Math.max(0, nowMs - breakTimerStartRef.current);
      const newTime = Math.max(0, breakTimerStartValueRef.current - elapsed);

      setState(prev => {
        if (!prev.isBreakTime) return prev;
        if (prev.status === 'MATCH_END') return prev;

        if (newTime <= 0) {
          // Break is over — auto-advance to next round.
          // Guard de snapshot: handleRoundEndWithWinner ja pode ter snapshotado
          // em ROUND_END (caso normal). So snapshota se historyLen < round
          // (caso empate sem winner que entra direto em ROUND_END sem snapshot).
          const isGolden = prev.round >= prev.config.maxRounds && prev.roundWinsRed === prev.roundWinsBlue;
          const nextRoundNum = (prev.round + 1) as 1 | 2 | 3 | 4;
          const historyLen = prev.roundHistoryBlue.length;
          const shouldSnapshot = historyLen < prev.round;
          const newState: MatchState = {
            ...prev,
            status: 'IDLE',
            round: nextRoundNum,
            timeLeftMs: prev.config.roundTimeMs,
            roundScoreRed: 0,
            roundScoreBlue: 0,
            roundHistoryRed: shouldSnapshot ? [...prev.roundHistoryRed, prev.roundScoreRed] : prev.roundHistoryRed,
            roundHistoryBlue: shouldSnapshot ? [...prev.roundHistoryBlue, prev.roundScoreBlue] : prev.roundHistoryBlue,
            hitsRed: 0,
            hitsBlue: 0,
            gamjeomRed: prev.gamjeomRed,
            gamjeomBlue: prev.gamjeomBlue,
            isMedicalTime: false,
            savedTimeMs: undefined,
            isBreakTime: false,
            breakTimeLeftMs: undefined,
            isGoldenRound: isGolden || undefined,
            events: [createEvent(isGolden ? 'GOLDEN_ROUND' : 'BREAK_TIME', isGolden ? 'GOLDEN ROUND — Morte Súbita!' : `Intervalo encerrado — Round ${nextRoundNum}`), ...prev.events].slice(0, MAX_EVENTS),
          };
          broadcast(newState, true);
          return newState;
        }

        const newState = { ...prev, breakTimeLeftMs: newTime };
        broadcast(newState);
        return newState;
      });
    }, 100);

    return () => {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isBreakTime, state.status, role, broadcast]);

  // Check point gap, golden round sudden death, and gamjeom limit
  useEffect(() => {
    if (role !== 'master') return;
    if (state.status !== 'RUNNING') return;

    const { roundScoreRed, roundScoreBlue, gamjeomRed, gamjeomBlue, config } = state;
    const scoreDiff = Math.abs(roundScoreRed - roundScoreBlue);

    // Guarda compartilhada: dentro do setState, prev pode nao estar mais
    // RUNNING (race entre branches deste effect ou com o timer effect que
    // tambem dispara handleRoundEnd). Sem isso, dois ifs poderiam chamar
    // handleRoundEndWithWinner e duplicar incremento de roundWins.
    const resolveIfRunning = (
      side: MatchSide,
      eventType: 'GOLDEN_ROUND' | 'POINT_GAP' | 'GAMJEOM_LIMIT',
      desc: string,
    ) => {
      setState(prev => {
        if (prev.status !== 'RUNNING') return prev;
        const newState = handleRoundEndWithWinner(prev, side, eventType, desc);
        broadcast(newState, true);
        return newState;
      });
    };

    // Golden round: first to score wins immediately
    if (state.isGoldenRound && (roundScoreRed > 0 || roundScoreBlue > 0)) {
      const winner: MatchSide = roundScoreRed > roundScoreBlue ? 'RED' : 'BLUE';
      const winnerLabel = winner === 'RED' ? 'Vermelho' : 'Azul';
      resolveIfRunning(winner, 'GOLDEN_ROUND', `Golden Round! ${winnerLabel} marca primeiro e vence!`);
      return;
    }

    // Point gap check
    if (scoreDiff >= config.pointGap) {
      const winner: MatchSide = roundScoreRed > roundScoreBlue ? 'RED' : 'BLUE';
      const winnerLabel = winner === 'RED' ? 'Vermelho' : 'Azul';
      resolveIfRunning(winner, 'POINT_GAP', `Point Gap! ${winnerLabel} vence o round`);
      return;
    }

    // Gamjeom limit check
    if (gamjeomRed >= config.maxGamjeom) {
      resolveIfRunning('BLUE', 'GAMJEOM_LIMIT', `Vitória por Limite de Faltas (PUN) — Azul vence o round`);
      return;
    }

    if (gamjeomBlue >= config.maxGamjeom) {
      resolveIfRunning('RED', 'GAMJEOM_LIMIT', `Vitória por Limite de Faltas (PUN) — Vermelho vence o round`);
    }
  }, [state.roundScoreRed, state.roundScoreBlue, state.gamjeomRed, state.gamjeomBlue, state.status, state.config, state.isGoldenRound, role, broadcast, handleRoundEndWithWinner]);
  
  // Save to history before state change
  const saveToHistory = useCallback((currentState: MatchState) => {
    setHistory(prev => {
      const newHistory = [...prev, currentState];
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }
      return newHistory;
    });
  }, []);
  
  // Timer controls
  const startTimer = useCallback(() => {
    if (role !== 'master') return;
    if (!state.hasConfig) return;
    if (state.status === 'MATCH_END') return;
    // Guarda: nao re-startar timer em ROUND_END. Timer ja ta em 0, o tick
    // imediato re-chamaria handleRoundEnd sobre os mesmos scores e incrementaria
    // roundWins de novo — bug que terminava a luta em 1 click errado.
    // Pra avancar, operador precisa clicar "PROX. ROUND" (nextRound).
    if (state.status === 'ROUND_END') return;

    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        status: 'RUNNING',
        isBreakTime: false,
        breakTimeLeftMs: undefined,
        events: [
          createEvent('TIMER_START', prev.isGoldenRound ? 'GOLDEN ROUND iniciado' : prev.isMedicalTime ? 'Tempo médico iniciado' : 'Round iniciado'),
          ...prev.events
        ].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const pauseTimer = useCallback(() => {
    if (role !== 'master') return;
    if (state.status !== 'RUNNING') return;
    
    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        status: 'PAUSED',
        events: [createEvent('TIMER_PAUSE', 'Timer pausado'), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const resetTime = useCallback(() => {
    if (role !== 'master') return;
    
    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        timeLeftMs: prev.isMedicalTime ? prev.config.medicalTimeMs : prev.config.roundTimeMs,
        status: 'PAUSED',
        events: [createEvent('TIMER_RESET', 'Tempo zerado'), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const startMedicalTime = useCallback(() => {
    if (role !== 'master') return;
    
    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        status: 'PAUSED',
        isMedicalTime: true,
        savedTimeMs: prev.timeLeftMs,
        timeLeftMs: prev.config.medicalTimeMs,
        events: [createEvent('MEDICAL_START', 'Tempo médico solicitado'), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const endMedicalTime = useCallback(() => {
    if (role !== 'master') return;
    if (!state.isMedicalTime) return;
    
    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        status: 'PAUSED',
        isMedicalTime: false,
        timeLeftMs: prev.savedTimeMs || prev.config.roundTimeMs,
        savedTimeMs: undefined,
        events: [createEvent('MEDICAL_END', 'Tempo médico encerrado'), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  // Match controls
  const endRound = useCallback(() => {
    if (role !== 'master') return;
    
    saveToHistory(state);
    
    setState(prev => {
      const newState = handleRoundEnd(prev);
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast, handleRoundEnd]);
  
  const nextRound = useCallback(() => {
    if (role !== 'master') return;
    if (state.status !== 'ROUND_END') return;

    // Allow advancing if: more configured rounds remain, OR round wins are tied (golden round)
    const canAdvance = state.round < state.config.maxRounds ||
      (state.round >= state.config.maxRounds && state.roundWinsRed === state.roundWinsBlue);
    if (!canAdvance) return;

    saveToHistory(state);

    setState(prev => {
      // Guard de snapshot (mesmo de handleRoundEndWithWinner): so snapshota
      // se ainda nao foi snapshotado pra esse round. Caso contrario duplica
      // entrada em roundHistory (handleRoundEndWithWinner ja snapshotou em
      // ROUND_END com winner declarado, e aqui faria de novo).
      const historyLen = prev.roundHistoryBlue.length;
      const shouldSnapshot = historyLen < prev.round;
      const nextHistoryRed = shouldSnapshot ? [...prev.roundHistoryRed, prev.roundScoreRed] : prev.roundHistoryRed;
      const nextHistoryBlue = shouldSnapshot ? [...prev.roundHistoryBlue, prev.roundScoreBlue] : prev.roundHistoryBlue;

      // If currently in break time, skip it
      if (prev.isBreakTime) {
        const nextRoundNum = (prev.round + 1) as 1 | 2 | 3 | 4;
        const isGolden = prev.round >= prev.config.maxRounds && prev.roundWinsRed === prev.roundWinsBlue;
        const newState: MatchState = {
          ...prev,
          status: 'IDLE',
          round: nextRoundNum,
          timeLeftMs: prev.config.roundTimeMs,
          roundScoreRed: 0,
          roundScoreBlue: 0,
          roundHistoryRed: nextHistoryRed,
          roundHistoryBlue: nextHistoryBlue,
          hitsRed: 0,
          hitsBlue: 0,
          gamjeomRed: prev.gamjeomRed,
          gamjeomBlue: prev.gamjeomBlue,
          isMedicalTime: false,
          savedTimeMs: undefined,
          isBreakTime: false,
          breakTimeLeftMs: undefined,
          isGoldenRound: isGolden || undefined,
          events: [createEvent(isGolden ? 'GOLDEN_ROUND' : 'ROUND_END', isGolden ? 'GOLDEN ROUND — Morte Súbita!' : `Round ${nextRoundNum} preparado`), ...prev.events].slice(0, MAX_EVENTS),
        };
        broadcast(newState, true);
        return newState;
      }

      // Determine if next round is golden
      const isGolden = prev.round >= prev.config.maxRounds && prev.roundWinsRed === prev.roundWinsBlue;
      const nextRoundNum = (prev.round + 1) as 1 | 2 | 3 | 4;

      const newState: MatchState = {
        ...prev,
        status: 'IDLE',
        round: nextRoundNum,
        timeLeftMs: prev.config.roundTimeMs,
        roundScoreRed: 0,
        roundScoreBlue: 0,
        roundHistoryRed: nextHistoryRed,
        roundHistoryBlue: nextHistoryBlue,
        hitsRed: 0,
        hitsBlue: 0,
        gamjeomRed: prev.gamjeomRed,
        gamjeomBlue: prev.gamjeomBlue,
        isMedicalTime: false,
        savedTimeMs: undefined,
        isBreakTime: false,
        breakTimeLeftMs: undefined,
        isGoldenRound: isGolden || undefined,
        events: [createEvent(isGolden ? 'GOLDEN_ROUND' : 'ROUND_END', isGolden ? 'GOLDEN ROUND — Morte Súbita!' : `Round ${nextRoundNum} preparado`), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const endMatch = useCallback(() => {
    if (role !== 'master') return;
    
    saveToHistory(state);
    
    setState(prev => {
      // Snapshot current round score into history if it wasn't yet (e.g. ending mid-round)
      const historyLen = prev.roundHistoryBlue.length;
      const shouldSnapshot = historyLen < prev.round;
      const newState: MatchState = {
        ...prev,
        status: 'MATCH_END',
        roundHistoryRed: shouldSnapshot ? [...prev.roundHistoryRed, prev.roundScoreRed] : prev.roundHistoryRed,
        roundHistoryBlue: shouldSnapshot ? [...prev.roundHistoryBlue, prev.roundScoreBlue] : prev.roundHistoryBlue,
        events: [createEvent('MATCH_END', 'Luta encerrada'), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const declareRoundWinner = useCallback((side: MatchSide) => {
    if (role !== 'master') return;
    if (state.status !== 'ROUND_END') return;
    
    saveToHistory(state);
    
    const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
    
    setState(prev => {
      const newState = handleRoundEndWithWinner(prev, side, 'ROUND_WIN',
        `Round ${prev.round} vencido por ${sideLabel} (decisão)`);
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast, handleRoundEndWithWinner]);
  
  const resetMatch = useCallback(() => {
    if (role !== 'master') return;

    const prev = stateRef.current;
    const config = prev.config;

    // Audit trail: capture pre-reset summary so reset is traceable even after history clear.
    const resetSummary = `RESET — Round ${prev.round}, ` +
      `Vermelho ${prev.roundScoreRed} (${prev.roundWinsRed}W) vs ` +
      `Azul ${prev.roundScoreBlue} (${prev.roundWinsBlue}W), status ${prev.status}`;

    const newState: MatchState = {
      ...INITIAL_MATCH_STATE,
      config,
      hasConfig: true,
      timeLeftMs: config.roundTimeMs,
      // Seed the new event log with the reset audit event so homologation auditors
      // can see WHEN/WHAT was reset rather than a blank trail.
      events: [createEvent('MATCH_RESET', resetSummary)],
    };

    setState(newState);
    setHistory([]);
    broadcast(newState, true);
  }, [role, broadcast]);
  
  // Scoring
  const addScore = useCallback((side: MatchSide, type: ScoreType) => {
    if (role !== 'master') return;
    const s = stateRef.current;
    if (s.status !== 'RUNNING') return;
    
    saveToHistory(s);
    
    const points = getScoreValue(type, s.config.scoring);
    const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
    const typeLabel = type === 'PUNCH' ? 'Soco' :
                      type === 'BODY' ? 'Corpo' :
                      type === 'HEAD' ? 'Cabeça' :
                      type === 'SPIN_BODY' ? 'Giro Corpo' :
                      type === 'SPIN_HEAD' ? 'Giro Cabeça' : type;
    
    setState(prev => {
      // Guarda dentro do updater: timer effect pode ter movido pra ROUND_END
      // entre o check inicial (stateRef) e este callback. Pontuacao apos sino
      // nao deve contar.
      if (prev.status !== 'RUNNING') return prev;
      const newState: MatchState = {
        ...prev,
        roundScoreRed: side === 'RED' ? prev.roundScoreRed + points : prev.roundScoreRed,
        roundScoreBlue: side === 'BLUE' ? prev.roundScoreBlue + points : prev.roundScoreBlue,
        events: [createEvent(type, `+${points} ${sideLabel} (${typeLabel})`, side, points), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, saveToHistory, broadcast]);
  
  const addGamjeom = useCallback((side: MatchSide, reason: import('@/types/championship').GamjeomReason = 'OTHER') => {
    if (role !== 'master') return;
    const s = stateRef.current;
    if (s.status !== 'RUNNING' && s.status !== 'PAUSED') return;

    saveToHistory(s);

    const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
    const opponentLabel = side === 'RED' ? 'Azul' : 'Vermelho';

    // WT 2026 JUN anti-stalling: passividade na janela final do round => +2 pts pro oponente.
    // Resolve via ruleset ativo; fallback seguro se version nao estiver no preset (defaults 1 ponto).
    const preset = WT_RULESET_PRESETS[s.config.rulesetVersion];
    const bonus = preset?.gamjeomPassivityBonus ?? 1;
    const windowMs = preset?.gamjeomPassivityWindowMs ?? 10_000;
    // UI-AUDIT R7-H3: durante MEDICAL, timeLeftMs reflete medicalTimeMs (nao o
    // tempo do round) — janela de passividade so vale com timer do round real.
    const inPassivityWindow = !s.isMedicalTime && s.timeLeftMs > 0 && s.timeLeftMs <= windowMs;
    const applyBonus = reason === 'PASSIVITY' && bonus === 2 && inPassivityWindow;
    const pointsToOpponent = applyBonus ? 2 : 1;

    const reasonLabel: Record<import('@/types/championship').GamjeomReason, string> = {
      PASSIVITY: 'Passividade',
      FALL: 'Queda',
      GRAB: 'Agarrar/empurrar',
      BOUNDARY: 'Sair da area',
      FACE_ATTACK: 'Ataque ao rosto',
      BELOW_WAIST: 'Ataque abaixo da cintura',
      OTHER: '',
    };
    const reasonSuffix = reasonLabel[reason] ? ` [${reasonLabel[reason]}]` : '';
    const bonusSuffix = applyBonus ? ' — BONUS PASSIVIDADE' : '';
    const description = `GAM-JEOM ${sideLabel}${reasonSuffix} (+${pointsToOpponent} ponto${pointsToOpponent > 1 ? 's' : ''} ${opponentLabel})${bonusSuffix}`;

    setState(prev => {
      const isRunning = prev.status === 'RUNNING';
      const newState: MatchState = {
        ...prev,
        status: isRunning ? 'PAUSED' : prev.status,
        gamjeomRed: side === 'RED' ? prev.gamjeomRed + 1 : prev.gamjeomRed,
        gamjeomBlue: side === 'BLUE' ? prev.gamjeomBlue + 1 : prev.gamjeomBlue,
        roundScoreRed: side === 'BLUE' ? prev.roundScoreRed + pointsToOpponent : prev.roundScoreRed,
        roundScoreBlue: side === 'RED' ? prev.roundScoreBlue + pointsToOpponent : prev.roundScoreBlue,
        events: [
          createEvent('GAMJEOM', description, side, pointsToOpponent, { reason }),
          ...(isRunning ? [createEvent('TIMER_PAUSE', 'Auto-pause: Gam-jeom aplicado')] : []),
          ...prev.events
        ].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, saveToHistory, broadcast]);
  
  const removeGamjeom = useCallback((side: MatchSide) => {
    if (role !== 'master') return;
    // [-] enabled ONLY when status !== 'RUNNING' and gamjeom > 0.
    // Bloqueado em MATCH_END/ROUND_END pra nao alterar resultado retroativamente
    // (mexer em score ja resolvido criaria desconexao entre roundScore e
    // roundWins ja contabilizado em handleRoundEndWithWinner).
    if (state.status === 'RUNNING') return;
    if (state.status === 'MATCH_END' || state.status === 'ROUND_END') return;

    // Le do stateRef pra evitar closure stale em renders rapidos.
    const live = stateRef.current;
    const currentGamjeom = side === 'RED' ? live.gamjeomRed : live.gamjeomBlue;
    if (currentGamjeom <= 0) return;
    
    saveToHistory(state);
    
    const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
    const opponentLabel = side === 'RED' ? 'Azul' : 'Vermelho';
    
    // Encontra o ultimo evento GAMJEOM positivo desse lado pra recuperar
    // pontos exatos atribuidos (1 normal vs 2 quando bonus passividade WT-2026-JUN).
    // IMPORTANTE: limita busca ao round atual — eventos sao newest-first, entao
    // qualquer ROUND_END/GOLDEN_ROUND/MATCH_END/BREAK_TIME marca o limite. Sem isso,
    // remover gamjeom no round 2 reverteria pontos do round 1 (zerado), e o bonus +2
    // do round anterior sumiria silenciosamente.
    const ROUND_BOUNDARY_TYPES: MatchEvent['type'][] = ['ROUND_END', 'GOLDEN_ROUND', 'MATCH_END', 'BREAK_TIME'];
    let lastGamjeomEvent: MatchEvent | undefined;
    for (const e of live.events) {
      if (ROUND_BOUNDARY_TYPES.includes(e.type)) break;
      if (e.type === 'GAMJEOM' && e.side === side && (e.points ?? 0) > 0) {
        lastGamjeomEvent = e;
        break;
      }
    }
    if (!lastGamjeomEvent) {
      // No GAMJEOM applied this round — refuse to decrement (would corrupt cross-round audit trail).
      logger.warn('[removeGamjeom] No GAMJEOM event for', side, 'in current round; refusing to remove.');
      return;
    }
    const pointsToReverse = lastGamjeomEvent.points ?? 1;

    setState(prev => {
      const newState: MatchState = {
        ...prev,
        // Decrement gamjeom for the side
        gamjeomRed: side === 'RED' ? prev.gamjeomRed - 1 : prev.gamjeomRed,
        gamjeomBlue: side === 'BLUE' ? prev.gamjeomBlue - 1 : prev.gamjeomBlue,
        // Remove pontos do oponente exatamente igual ao addGamjeom original
        roundScoreRed: side === 'BLUE' ? Math.max(0, prev.roundScoreRed - pointsToReverse) : prev.roundScoreRed,
        roundScoreBlue: side === 'RED' ? Math.max(0, prev.roundScoreBlue - pointsToReverse) : prev.roundScoreBlue,
        events: [createEvent('GAMJEOM', `GAM-JEOM REMOVIDO (${sideLabel}) → -${pointsToReverse} ponto${pointsToReverse > 1 ? 's' : ''} ${opponentLabel}`, side, -pointsToReverse), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  // Adjust aceita 1 ou 2 chamadas seguidas no mesmo tick — ScoreAdjustDialog
  // chama uma vez por lado quando ambos mudam. Precisamos garantir 1 UNICO
  // broadcast no final pra evitar TV flashar estado intermediario (ex: BLUE
  // novo + RED antigo). Estrategia: usar stateRef + microtask pra coalescer.
  const pendingAdjustRef = useRef<{
    blue?: { score: number; gamjeom: number };
    red?: { score: number; gamjeom: number };
    scheduled: boolean;
  }>({ scheduled: false });

  const adjustScore = useCallback((side: MatchSide, roundScore: number, gamjeom: number) => {
    if (role !== 'master') return;

    // Acumula no ref
    if (side === 'BLUE') {
      pendingAdjustRef.current.blue = { score: roundScore, gamjeom };
    } else {
      pendingAdjustRef.current.red = { score: roundScore, gamjeom };
    }

    // Agenda flush único no fim do microtask — coalesce chamadas síncronas
    if (pendingAdjustRef.current.scheduled) return;
    pendingAdjustRef.current.scheduled = true;

    queueMicrotask(() => {
      const pending = pendingAdjustRef.current;
      pendingAdjustRef.current = { scheduled: false };
      if (!pending.blue && !pending.red) return;

      saveToHistory(stateRef.current);

      setState(prev => {
        const events: MatchEvent[] = [];
        if (pending.blue) {
          events.push(createEvent('ADJUST', `Placar Azul ajustado: ${pending.blue.score} pts, ${pending.blue.gamjeom} GJ`, 'BLUE'));
        }
        if (pending.red) {
          events.push(createEvent('ADJUST', `Placar Vermelho ajustado: ${pending.red.score} pts, ${pending.red.gamjeom} GJ`, 'RED'));
        }
        const newState: MatchState = {
          ...prev,
          roundScoreBlue: pending.blue ? pending.blue.score : prev.roundScoreBlue,
          gamjeomBlue: pending.blue ? pending.blue.gamjeom : prev.gamjeomBlue,
          roundScoreRed: pending.red ? pending.red.score : prev.roundScoreRed,
          gamjeomRed: pending.red ? pending.red.gamjeom : prev.gamjeomRed,
          events: [...events, ...prev.events].slice(0, MAX_EVENTS),
        };
        broadcast(newState, true);
        return newState;
      });
    });
  }, [role, saveToHistory, broadcast]);
  
  // Reverse sides — swap CHUNG (BLUE) ↔ HONG (RED) completamente.
  // Equivalente KPNP: botão "Reverse Sides". Troca atletas, scores, gamjeoms,
  // hits, roundWins, roundHistory e as entradas do config. Registra evento no log.
  // Uso típico: operador percebeu que os atletas estão nos lados trocados
  // (colete azul no direito, vermelho no esquerdo). Reversível via Undo.
  const reverseSides = useCallback(() => {
    if (role !== 'master') return;
    // Bloqueado em status terminal: bracket de torneio ja gravou winnerSide
    // baseado em roundWins atual; reverter aqui criaria desconexao entre UI
    // da luta e o bracket persistido. Se operador notou erro de lados,
    // precisa corrigir antes do MATCH_END (ou via overrideMatchWinner no bracket).
    if (state.status === 'MATCH_END' || state.status === 'ROUND_END') return;

    saveToHistory(state);

    setState(prev => {
      const newState: MatchState = {
        ...prev,
        roundScoreRed: prev.roundScoreBlue,
        roundScoreBlue: prev.roundScoreRed,
        roundHistoryRed: prev.roundHistoryBlue,
        roundHistoryBlue: prev.roundHistoryRed,
        hitsRed: prev.hitsBlue,
        hitsBlue: prev.hitsRed,
        roundWinsRed: prev.roundWinsBlue,
        roundWinsBlue: prev.roundWinsRed,
        gamjeomRed: prev.gamjeomBlue,
        gamjeomBlue: prev.gamjeomRed,
        config: {
          ...prev.config,
          athleteRed: prev.config.athleteBlue,
          athleteBlue: prev.config.athleteRed,
        },
        events: [createEvent('SIDES_REVERSED', 'Lados invertidos (Chung ↔ Hong)'), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);

  // Undo
  const undoLast = useCallback(() => {
    if (role !== 'master') return;
    if (history.length === 0) return;
    
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    
    const newState: MatchState = {
      ...previousState,
      events: [createEvent('UNDO', 'Ação desfeita'), ...previousState.events].slice(0, MAX_EVENTS),
    };
    
    setState(newState);
    broadcast(newState, true);
  }, [role, history, broadcast]);
  
  // Save config
  // UI-AUDIT R7-H7: nao apaga placar/eventos se luta esta em andamento.
  // Operador pode abrir MatchConfigDialog em PAUSED (intervalo medico, pos-gamjeom)
  // — salvar config nao pode zerar pontuacao silenciosamente.
  // Reset total so quando IDLE (pre-luta) ou MATCH_END (luta finalizada).
  const saveConfig = useCallback((config: MatchConfig) => {
    if (role !== 'master') return;

    localStorage.setItem(getConfigStorageKey(config.matId), JSON.stringify(config));

    const live = stateRef.current;
    const inActiveMatch = live.status !== 'IDLE' && live.status !== 'MATCH_END';

    if (inActiveMatch) {
      // Preserva estado da luta — so atualiza config + ajusta timer se nao esta rodando.
      setState(prev => {
        const newState: MatchState = {
          ...prev,
          config,
          hasConfig: true,
          // Se em PAUSED/ROUND_END/MEDICAL, ajusta timeLeftMs ao novo roundTimeMs
          // apenas se o tempo atual eh exatamente o roundTimeMs antigo (default).
          timeLeftMs: prev.timeLeftMs === prev.config.roundTimeMs
            ? config.roundTimeMs
            : prev.timeLeftMs,
        };
        broadcast(newState, true);
        return newState;
      });
      return;
    }

    const newState: MatchState = {
      ...INITIAL_MATCH_STATE,
      config,
      hasConfig: true,
      timeLeftMs: config.roundTimeMs,
    };

    setState(newState);
    setHistory([]);
    broadcast(newState, true);
  }, [role, broadcast]);
  
  // Update config without resetting match state
  const updateConfigInPlace = useCallback((updater: (config: MatchConfig) => MatchConfig) => {
    if (role !== 'master') return;
    setState(prev => {
      const newConfig = updater(prev.config);
      localStorage.setItem(getConfigStorageKey(newConfig.matId), JSON.stringify(newConfig));
      const newState: MatchState = { ...prev, config: newConfig };
      broadcast(newState, true);
      return newState;
    });
  }, [role, broadcast]);
  
  // Add hit (silent, no event log)
  const addHit = useCallback((side: MatchSide) => {
    if (role !== 'master') return;
    if (stateRef.current.status !== 'RUNNING') return;
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        hitsRed: side === 'RED' ? prev.hitsRed + 1 : prev.hitsRed,
        hitsBlue: side === 'BLUE' ? prev.hitsBlue + 1 : prev.hitsBlue,
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, broadcast]);
  
  return {
    state,
    isConnected,
    connectedDevices,
    startTimer,
    pauseTimer,
    resetTime,
    startMedicalTime,
    endMedicalTime,
    endRound,
    nextRound,
    endMatch,
    declareRoundWinner,
    resetMatch,
    addScore,
    addHit,
    addGamjeom,
    removeGamjeom,
    adjustScore,
    reverseSides,
    undoLast,
    canUndo: history.length > 0,
    saveConfig,
    updateConfigInPlace,
    hasConfig: state.hasConfig,
    broadcastRaw: (msg: ChampionshipSyncMessage) => {
      // Local
      channel.current?.postMessage(msg);
      // Network
      if (msg.type === 'SHOW_BRACKET') {
        realtimeSendRef.current('show-bracket', msg.payload);
      } else if (msg.type === 'SHOW_SCOREBOARD') {
        realtimeSendRef.current('show-scoreboard', null);
      } else if (msg.type === 'SHOW_HARDWARE_TEST') {
        realtimeSendRef.current('show-hardware-test', msg.payload);
      } else if (msg.type === 'HIDE_HARDWARE_TEST') {
        realtimeSendRef.current('hide-hardware-test', null);
      } else if (msg.type === 'HARDWARE_TEST_HIT') {
        realtimeSendRef.current('hardware-test-hit', msg.payload);
      }
    },
  };
}
