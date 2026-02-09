import { useState, useEffect, useRef, useCallback } from 'react';
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

// Maximum events to keep in history
const MAX_EVENTS = 500;

interface UseChampionshipSyncOptions {
  role: 'master' | 'listener';
  matId?: number;
}

interface UseChampionshipSyncReturn {
  state: MatchState;
  isConnected: boolean;
  
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
  addGamjeom: (side: MatchSide) => void;
  removeGamjeom: (side: MatchSide) => void;
  adjustScore: (side: MatchSide, roundScore: number, gamjeom: number) => void;
  
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
  points?: number
): MatchEvent {
  return {
    id: crypto.randomUUID(),
    type,
    side,
    points,
    ts: Date.now(),
    description,
  };
}

export function useChampionshipSync({
  role,
  matId = 1,
}: UseChampionshipSyncOptions): UseChampionshipSyncReturn {
  const [state, setState] = useState<MatchState>(() => {
    // Try to load from localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(getStorageKey(matId));
      if (stored) {
        try {
          return JSON.parse(stored);
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    
    channel.current = new BroadcastChannel(getChannelName(matId));
    
    if (role === 'listener') {
      channel.current.onmessage = (event) => {
        setState(event.data);
        setIsConnected(true);
      };
      
      // Also listen to storage events as fallback
      const handleStorage = (e: StorageEvent) => {
        if (e.key === getStorageKey(matId) && e.newValue) {
          try {
            setState(JSON.parse(e.newValue));
            setIsConnected(true);
          } catch { /* ignore */ }
        }
      };
      window.addEventListener('storage', handleStorage);
      
      // Try to load initial state from storage
      const stored = localStorage.getItem(getStorageKey(matId));
      if (stored) {
        try {
          setState(JSON.parse(stored));
          setIsConnected(true);
        } catch { /* ignore */ }
      }
      
      return () => {
        window.removeEventListener('storage', handleStorage);
        channel.current?.close();
      };
    }
    
    return () => {
      channel.current?.close();
    };
  }, [matId, role]);
  
  // Broadcast state with throttle
  const broadcast = useCallback((newState: MatchState, forceSync = false) => {
    if (role !== 'master') return;
    
    const currentSecond = Math.floor(newState.timeLeftMs / 1000);
    const now = Date.now();
    
    const secondChanged = currentSecond !== lastSyncedSecond.current;
    const timePassed = now - lastSyncTime.current > 300;
    
    if (secondChanged || timePassed || forceSync) {
      const stateToSync = { ...newState, lastUpdate: now };
      channel.current?.postMessage(stateToSync);
      localStorage.setItem(getStorageKey(matId), JSON.stringify(stateToSync));
      lastSyncedSecond.current = currentSecond;
      lastSyncTime.current = now;
    }
  }, [role, matId]);
  
  // Handle round end (time up)
  const handleRoundEnd = useCallback((prev: MatchState): MatchState => {
    const { roundScoreRed, roundScoreBlue, hitsRed, hitsBlue, config } = prev;
    
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
    const isMatchEnd = newWinsRed >= winsNeeded || newWinsBlue >= winsNeeded;
    
    return {
      ...prev,
      timeLeftMs: 0,
      status: isMatchEnd ? 'MATCH_END' : 'ROUND_END',
      roundWinsRed: newWinsRed,
      roundWinsBlue: newWinsBlue,
      events: [createEvent(eventType, description, winner), ...prev.events].slice(0, MAX_EVENTS),
    };
  }, []);
  
  // Timer logic
  useEffect(() => {
    if (role !== 'master') return;
    if (state.status !== 'RUNNING' && state.status !== 'MEDICAL') return;
    
    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeLeftMs - 100;
        
        if (newTime <= 0) {
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
        }
        
        const newState = { ...prev, timeLeftMs: newTime };
        broadcast(newState);
        return newState;
      });
    }, 100);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status, role, broadcast, handleRoundEnd]);
  
  // Check point gap and gamjeom limit
  useEffect(() => {
    if (role !== 'master') return;
    if (state.status !== 'RUNNING') return;
    
    const { roundScoreRed, roundScoreBlue, gamjeomRed, gamjeomBlue, config } = state;
    const scoreDiff = Math.abs(roundScoreRed - roundScoreBlue);
    
    // Point gap check
    if (scoreDiff >= config.pointGap) {
      const winner: MatchSide = roundScoreRed > roundScoreBlue ? 'RED' : 'BLUE';
      const winnerLabel = winner === 'RED' ? 'Vermelho' : 'Azul';
      
      setState(prev => {
        const newState = handleRoundEndWithWinner(prev, winner, 'POINT_GAP', 
          `Point Gap! ${winnerLabel} vence o round`);
        broadcast(newState, true);
        return newState;
      });
      return;
    }
    
    // Gamjeom limit check
    if (gamjeomRed >= config.maxGamjeom) {
      setState(prev => {
        const newState = handleRoundEndWithWinner(prev, 'BLUE', 'GAMJEOM_LIMIT',
          `Vitória por Limite de Faltas (PUN) — Azul vence o round`);
        broadcast(newState, true);
        return newState;
      });
      return;
    }
    
    if (gamjeomBlue >= config.maxGamjeom) {
      setState(prev => {
        const newState = handleRoundEndWithWinner(prev, 'RED', 'GAMJEOM_LIMIT',
          `Vitória por Limite de Faltas (PUN) — Vermelho vence o round`);
        broadcast(newState, true);
        return newState;
      });
    }
  }, [state.roundScoreRed, state.roundScoreBlue, state.gamjeomRed, state.gamjeomBlue, state.status, state.config, role, broadcast, handleRoundEndWithWinner]);
  
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
    
    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        status: 'RUNNING',
        events: [
          createEvent('TIMER_START', prev.isMedicalTime ? 'Tempo médico iniciado' : 'Round iniciado'),
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
    if (state.round >= state.config.maxRounds) return;
    
    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        status: 'IDLE',
        round: (prev.round + 1) as 1 | 2 | 3,
        timeLeftMs: prev.config.roundTimeMs,
        roundScoreRed: 0,
        roundScoreBlue: 0,
        hitsRed: 0,
        hitsBlue: 0,
        gamjeomRed: 0,
        gamjeomBlue: 0,
        isMedicalTime: false,
        savedTimeMs: undefined,
        events: [createEvent('ROUND_END', `Round ${prev.round + 1} preparado`), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const endMatch = useCallback(() => {
    if (role !== 'master') return;
    
    saveToHistory(state);
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        status: 'MATCH_END',
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
    
    const config = state.config;
    
    const newState: MatchState = {
      ...INITIAL_MATCH_STATE,
      config,
      hasConfig: true,
      timeLeftMs: config.roundTimeMs,
    };
    
    setState(newState);
    setHistory([]);
    broadcast(newState, true);
  }, [role, state.config, broadcast]);
  
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
  
  const addGamjeom = useCallback((side: MatchSide) => {
    if (role !== 'master') return;
    const s = stateRef.current;
    if (s.status !== 'RUNNING') return;
    
    saveToHistory(s);
    
    const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
    const opponentLabel = side === 'RED' ? 'Azul' : 'Vermelho';
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        gamjeomRed: side === 'RED' ? prev.gamjeomRed + 1 : prev.gamjeomRed,
        gamjeomBlue: side === 'BLUE' ? prev.gamjeomBlue + 1 : prev.gamjeomBlue,
        roundScoreRed: side === 'BLUE' ? prev.roundScoreRed + 1 : prev.roundScoreRed,
        roundScoreBlue: side === 'RED' ? prev.roundScoreBlue + 1 : prev.roundScoreBlue,
        events: [createEvent('GAMJEOM', `GAM-JEOM ${sideLabel} (+1 ponto ${opponentLabel})`, side, 1), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, saveToHistory, broadcast]);
  
  const removeGamjeom = useCallback((side: MatchSide) => {
    if (role !== 'master') return;
    // [-] enabled ONLY when status !== 'RUNNING' and gamjeom > 0
    if (state.status === 'RUNNING') return;
    
    const currentGamjeom = side === 'RED' ? state.gamjeomRed : state.gamjeomBlue;
    if (currentGamjeom <= 0) return;
    
    saveToHistory(state);
    
    const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
    const opponentLabel = side === 'RED' ? 'Azul' : 'Vermelho';
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        // Decrement gamjeom for the side
        gamjeomRed: side === 'RED' ? prev.gamjeomRed - 1 : prev.gamjeomRed,
        gamjeomBlue: side === 'BLUE' ? prev.gamjeomBlue - 1 : prev.gamjeomBlue,
        // Remove 1 point from opponent (reverse of addGamjeom)
        roundScoreRed: side === 'BLUE' ? Math.max(0, prev.roundScoreRed - 1) : prev.roundScoreRed,
        roundScoreBlue: side === 'RED' ? Math.max(0, prev.roundScoreBlue - 1) : prev.roundScoreBlue,
        events: [createEvent('GAMJEOM', `GAM-JEOM REMOVIDO (${sideLabel}) → -1 ponto ${opponentLabel}`, side, -1), ...prev.events].slice(0, MAX_EVENTS),
      };
      broadcast(newState, true);
      return newState;
    });
  }, [role, state, saveToHistory, broadcast]);
  
  const adjustScore = useCallback((side: MatchSide, roundScore: number, gamjeom: number) => {
    if (role !== 'master') return;
    
    saveToHistory(state);
    
    const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
    
    setState(prev => {
      const newState: MatchState = {
        ...prev,
        roundScoreRed: side === 'RED' ? roundScore : prev.roundScoreRed,
        roundScoreBlue: side === 'BLUE' ? roundScore : prev.roundScoreBlue,
        gamjeomRed: side === 'RED' ? gamjeom : prev.gamjeomRed,
        gamjeomBlue: side === 'BLUE' ? gamjeom : prev.gamjeomBlue,
        events: [createEvent('ADJUST', `Placar ${sideLabel} ajustado: ${roundScore} pts, ${gamjeom} GJ`, side), ...prev.events].slice(0, MAX_EVENTS),
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
  const saveConfig = useCallback((config: MatchConfig) => {
    if (role !== 'master') return;
    
    localStorage.setItem(getConfigStorageKey(config.matId), JSON.stringify(config));
    
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
    undoLast,
    canUndo: history.length > 0,
    saveConfig,
    updateConfigInPlace,
    hasConfig: state.hasConfig,
  };
}
