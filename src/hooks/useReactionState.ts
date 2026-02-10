import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState } from '@/types/game';
import type {
  ReactionLevel,
  ReactionConfig,
  ReactionResult,
} from '@/types/reaction';
import { REACTION_PRESETS } from '@/types/reaction';

interface UseReactionStateProps {
  config: ReactionConfig;
  onRoundEnd?: () => void;
  onSessionEnd?: () => void;
  onStimulus?: () => void;   // bip sound
  onHit?: () => void;        // hit sound (kill the light)
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useReactionState({ config, onRoundEnd, onSessionEnd, onStimulus, onHit }: UseReactionStateProps) {
  // Game flow
  const [gameState, setGameState] = useState<GameState>('idle');
  const [countdown, setCountdown] = useState(3);

  // Round state
  const [currentRound, setCurrentRound] = useState(1);
  const [workTimeLeft, setWorkTimeLeft] = useState(config.workSec);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  // Stimulus state
  const [stimulusActive, setStimulusActive] = useState(false);
  const [lastReactionTime, setLastReactionTime] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [totalStimuli, setTotalStimuli] = useState(0);

  // Result
  const [lastResult, setLastResult] = useState<ReactionResult | null>(null);

  // Refs for timers and internal state
  const workTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const gapTimerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const stimulusOnTimeRef = useRef<number>(0);
  const hitRegisteredRef = useRef(false);
  const activeRef = useRef(false); // is the work phase running?
  const configRef = useRef(config);

  // Keep config ref fresh
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Keep callback refs fresh
  const onStimulusRef = useRef(onStimulus);
  const onHitRef = useRef(onHit);
  const onRoundEndRef = useRef(onRoundEnd);
  const onSessionEndRef = useRef(onSessionEnd);
  useEffect(() => {
    onStimulusRef.current = onStimulus;
    onHitRef.current = onHit;
    onRoundEndRef.current = onRoundEnd;
    onSessionEndRef.current = onSessionEnd;
  }, [onStimulus, onHit, onRoundEnd, onSessionEnd]);

  const clearAllTimers = useCallback(() => {
    [workTimerRef, flashTimerRef, gapTimerRef, restTimerRef, countdownTimerRef].forEach(ref => {
      if (ref.current) {
        window.clearTimeout(ref.current);
        window.clearInterval(ref.current);
        ref.current = null;
      }
    });
    activeRef.current = false;
  }, []);

  // --- Stimulus cycle ---
  const scheduleNextStimulus = useCallback(() => {
    if (!activeRef.current) return;
    const cfg = configRef.current;
    const gap = randomBetween(cfg.gapMs.min, cfg.gapMs.max);
    gapTimerRef.current = window.setTimeout(() => {
      if (!activeRef.current) return;
      // Turn ON
      setStimulusActive(true);
      stimulusOnTimeRef.current = Date.now();
      hitRegisteredRef.current = false;
      setTotalStimuli(prev => prev + 1);
      onStimulusRef.current?.(); // bip

      // Schedule auto-off after flashMs
      flashTimerRef.current = window.setTimeout(() => {
        if (!activeRef.current) return;
        setStimulusActive(false);
        scheduleNextStimulus();
      }, cfg.flashMs);
    }, gap);
  }, []);

  // --- Register impact (called by hardware) ---
  const registerImpact = useCallback(() => {
    if (!activeRef.current || hitRegisteredRef.current) return;
    // Only register if stimulus is currently on
    if (stimulusOnTimeRef.current === 0) return;
    const now = Date.now();
    const delta = now - stimulusOnTimeRef.current;
    // Guard: only accept if within a reasonable window (stimulus is on)
    if (delta < 0 || delta > configRef.current.flashMs + 50) return;

    hitRegisteredRef.current = true;
    // Cancel flash timer
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    // Kill the light immediately
    setStimulusActive(false);
    setLastReactionTime(delta);
    setReactionTimes(prev => [...prev, delta]);
    onHitRef.current?.(); // hit sound

    // Schedule next stimulus
    scheduleNextStimulus();
  }, [scheduleNextStimulus]);

  // --- Start a work round ---
  const startRound = useCallback(() => {
    const cfg = configRef.current;
    activeRef.current = true;
    setStimulusActive(false);
    setWorkTimeLeft(cfg.workSec);
    setIsResting(false);
    setLastReactionTime(null);

    // Work countdown
    let remaining = cfg.workSec;
    workTimerRef.current = window.setInterval(() => {
      remaining--;
      setWorkTimeLeft(remaining);
      if (remaining <= 0) {
        // End work phase
        window.clearInterval(workTimerRef.current!);
        workTimerRef.current = null;
        activeRef.current = false;
        // Cancel any pending stimulus timers
        if (flashTimerRef.current) { window.clearTimeout(flashTimerRef.current); flashTimerRef.current = null; }
        if (gapTimerRef.current) { window.clearTimeout(gapTimerRef.current); gapTimerRef.current = null; }
        setStimulusActive(false);
        onRoundEndRef.current?.();

        // Check if session complete
        setCurrentRound(prevRound => {
          if (prevRound >= cfg.rounds) {
            // Session finished
            setGameState('finished');
            setLastResult({
              mode: 'reaction',
              level: cfg.level,
              roundsCompleted: prevRound,
              totalStimuli: 0, // will be set via ref below
              reactionTimes: [],
              timestamp: Date.now(),
            });
            onSessionEndRef.current?.();
            return prevRound;
          } else {
            // Start rest
            setIsResting(true);
            setRestTimeLeft(cfg.restSec);
            let restRemaining = cfg.restSec;
            restTimerRef.current = window.setInterval(() => {
              restRemaining--;
              setRestTimeLeft(restRemaining);
              if (restRemaining <= 0) {
                window.clearInterval(restTimerRef.current!);
                restTimerRef.current = null;
                setIsResting(false);
                setTimeout(() => startRound(), 100);
              }
            }, 1000);
            return prevRound + 1;
          }
        });
      }
    }, 1000);

    // Start stimulus cycle
    scheduleNextStimulus();
  }, [scheduleNextStimulus]);

  // Fix: set correct final result with accumulated data
  useEffect(() => {
    if (gameState === 'finished' && lastResult) {
      setLastResult(prev => prev ? {
        ...prev,
        totalStimuli,
        reactionTimes,
      } : prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // --- Countdown ---
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    let c = 3;
    countdownTimerRef.current = window.setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        window.clearInterval(countdownTimerRef.current!);
        countdownTimerRef.current = null;
        setGameState('running');
        startRound();
      }
    }, 1000);
  }, [startRound]);

  const goToSetup = useCallback(() => {
    clearAllTimers();
    setGameState('setup');
    setCurrentRound(1);
    setWorkTimeLeft(config.workSec);
    setStimulusActive(false);
    setIsResting(false);
    setRestTimeLeft(0);
    setLastReactionTime(null);
    setReactionTimes([]);
    setTotalStimuli(0);
    setLastResult(null);
  }, [clearAllTimers, config.workSec]);

  const goToLoading = useCallback(() => {
    setGameState('loading');
  }, []);

  const resetGame = useCallback(() => {
    clearAllTimers();
    setGameState('idle');
    setCountdown(3);
    setCurrentRound(1);
    setWorkTimeLeft(config.workSec);
    setStimulusActive(false);
    setIsResting(false);
    setRestTimeLeft(0);
    setLastReactionTime(null);
    setReactionTimes([]);
    setTotalStimuli(0);
    setLastResult(null);
  }, [clearAllTimers, config.workSec]);

  // Replay: reset counters but keep config, start countdown immediately
  const replay = useCallback(() => {
    clearAllTimers();
    setCurrentRound(1);
    setWorkTimeLeft(config.workSec);
    setStimulusActive(false);
    setIsResting(false);
    setRestTimeLeft(0);
    setLastReactionTime(null);
    setReactionTimes([]);
    setTotalStimuli(0);
    setLastResult(null);
    // Start countdown immediately
    setGameState('countdown');
    setCountdown(3);
    let c = 3;
    countdownTimerRef.current = window.setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        window.clearInterval(countdownTimerRef.current!);
        countdownTimerRef.current = null;
        setGameState('running');
        startRound();
      }
    }, 1000);
  }, [clearAllTimers, config.workSec, startRound]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  return {
    gameState,
    countdown,
    currentRound,
    totalRounds: config.rounds,
    workTimeLeft,
    isResting,
    restTimeLeft,
    stimulusActive,
    lastReactionTime,
    reactionTimes,
    totalStimuli,
    lastResult,
    config,

    startCountdown,
    goToSetup,
    goToLoading,
    resetGame,
    replay,
    registerImpact,
  };
}
