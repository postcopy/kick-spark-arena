import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Side, IronRhythmConfig, GameScore, GameResult, IronRhythmScore } from '@/types/game';

const DEFAULT_CONFIG: IronRhythmConfig = {
  duration: 60,
  windowSec: 5,
  targetKicksPerWindow: 5,
};

const COUNTDOWN_DURATION = 3;
const TICK_INTERVAL_MS = 100;

export function useIronRhythmState(config: IronRhythmConfig = DEFAULT_CONFIG) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [scores, setScores] = useState<GameScore>({ red: 0, blue: 0 });
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [flashSide, setFlashSide] = useState<Side | null>(null);

  // Iron Rhythm specific state
  const [uptimeRed, setUptimeRed] = useState(0);
  const [uptimeBlue, setUptimeBlue] = useState(0);
  const [isOnPaceRed, setIsOnPaceRed] = useState(false);
  const [isOnPaceBlue, setIsOnPaceBlue] = useState(false);
  const [kicksInWindowRed, setKicksInWindowRed] = useState(0);
  const [kicksInWindowBlue, setKicksInWindowBlue] = useState(0);

  // Buffers for kick timestamps
  const kickTimesRed = useRef<number[]>([]);
  const kickTimesBlue = useRef<number[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  // Reset game to initial state
  const resetGame = useCallback(() => {
    clearTimers();
    setGameState('idle');
    setScores({ red: 0, blue: 0 });
    setTimeLeft(config.duration);
    setCountdown(COUNTDOWN_DURATION);
    setFlashSide(null);
    setUptimeRed(0);
    setUptimeBlue(0);
    setIsOnPaceRed(false);
    setIsOnPaceBlue(false);
    setKicksInWindowRed(0);
    setKicksInWindowBlue(0);
    kickTimesRed.current = [];
    kickTimesBlue.current = [];
    lastTickRef.current = 0;
  }, [clearTimers, config.duration]);

  // Go to setup screen
  const goToSetup = useCallback(() => {
    resetGame();
    setGameState('setup');
  }, [resetGame]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(COUNTDOWN_DURATION);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    setGameState('running');
    setTimeLeft(config.duration);
    lastTickRef.current = Date.now();

    // Main timer (seconds countdown)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Tick interval for rhythm calculation (100ms)
    tickRef.current = setInterval(() => {
      const now = Date.now();
      const windowMs = config.windowSec * 1000;

      // Clean old timestamps
      kickTimesRed.current = kickTimesRed.current.filter(t => now - t < windowMs);
      kickTimesBlue.current = kickTimesBlue.current.filter(t => now - t < windowMs);

      const redInWindow = kickTimesRed.current.length;
      const blueInWindow = kickTimesBlue.current.length;

      setKicksInWindowRed(redInWindow);
      setKicksInWindowBlue(blueInWindow);

      const redOnPace = redInWindow >= config.targetKicksPerWindow;
      const blueOnPace = blueInWindow >= config.targetKicksPerWindow;

      setIsOnPaceRed(redOnPace);
      setIsOnPaceBlue(blueOnPace);

      // Accumulate uptime
      if (redOnPace) setUptimeRed(prev => prev + TICK_INTERVAL_MS);
      if (blueOnPace) setUptimeBlue(prev => prev + TICK_INTERVAL_MS);

      lastTickRef.current = now;
    }, TICK_INTERVAL_MS);
  }, [config.duration, config.windowSec, config.targetKicksPerWindow]);

  // Handle countdown completion
  useEffect(() => {
    if (gameState === 'countdown' && countdown === 0) {
      startGame();
    }
  }, [gameState, countdown, startGame]);

  // Handle game end
  useEffect(() => {
    if (gameState === 'running' && timeLeft === 0) {
      clearTimers();

      const winner: Side | 'tie' =
        uptimeRed > uptimeBlue ? 'red' :
        uptimeBlue > uptimeRed ? 'blue' : 'tie';

      const result: GameResult = {
        mode: 'iron_rhythm',
        scores: { ...scores },
        uptimeScores: {
          red: {
            totalKicks: scores.red,
            uptimeMs: uptimeRed,
            isOnPace: isOnPaceRed,
          },
          blue: {
            totalKicks: scores.blue,
            uptimeMs: uptimeBlue,
            isOnPace: isOnPaceBlue,
          },
        },
        duration: config.duration,
        winner,
        timestamp: Date.now(),
      };

      setLastResult(result);
      setGameState('finished');

      // Save to localStorage
      try {
        localStorage.setItem('kickcounter_lastResult_iron', JSON.stringify(result));
      } catch (e) {
        console.error('Failed to save result:', e);
      }
    }
  }, [gameState, timeLeft, scores, uptimeRed, uptimeBlue, isOnPaceRed, isOnPaceBlue, config.duration, clearTimers]);

  // Register a kick
  const registerKick = useCallback((side: Side) => {
    if (gameState !== 'running') return false;

    const now = Date.now();

    if (side === 'red') {
      kickTimesRed.current.push(now);
      setScores(prev => ({ ...prev, red: prev.red + 1 }));
    } else {
      kickTimesBlue.current.push(now);
      setScores(prev => ({ ...prev, blue: prev.blue + 1 }));
    }

    // Trigger flash effect
    setFlashSide(side);
    setTimeout(() => setFlashSide(null), 150);

    return true;
  }, [gameState]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (gameState === 'running') {
      clearTimers();
      setGameState('paused');
    } else if (gameState === 'paused') {
      lastTickRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      tickRef.current = setInterval(() => {
        const now = Date.now();
        const windowMs = config.windowSec * 1000;

        kickTimesRed.current = kickTimesRed.current.filter(t => now - t < windowMs);
        kickTimesBlue.current = kickTimesBlue.current.filter(t => now - t < windowMs);

        const redInWindow = kickTimesRed.current.length;
        const blueInWindow = kickTimesBlue.current.length;

        setKicksInWindowRed(redInWindow);
        setKicksInWindowBlue(blueInWindow);

        const redOnPace = redInWindow >= config.targetKicksPerWindow;
        const blueOnPace = blueInWindow >= config.targetKicksPerWindow;

        setIsOnPaceRed(redOnPace);
        setIsOnPaceBlue(blueOnPace);

        if (redOnPace) setUptimeRed(prev => prev + TICK_INTERVAL_MS);
        if (blueOnPace) setUptimeBlue(prev => prev + TICK_INTERVAL_MS);

        lastTickRef.current = now;
      }, TICK_INTERVAL_MS);

      setGameState('running');
    }
  }, [gameState, clearTimers, config.windowSec, config.targetKicksPerWindow]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      switch (key) {
        case 'a':
          registerKick('red');
          break;
        case 'l':
          registerKick('blue');
          break;
        case ' ':
          e.preventDefault();
          if (gameState === 'idle') {
            goToSetup();
          } else if (gameState === 'setup') {
            startCountdown();
          } else if (gameState === 'finished') {
            goToSetup();
          }
          break;
        case 'r':
          resetGame();
          break;
        case 'p':
          if (gameState === 'running' || gameState === 'paused') {
            togglePause();
          }
          break;
        case 'escape':
          if (gameState !== 'idle') {
            resetGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, registerKick, goToSetup, startCountdown, resetGame, togglePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return {
    gameState,
    scores,
    timeLeft,
    countdown,
    lastResult,
    flashSide,
    config,
    // Iron Rhythm specific
    uptimeRed,
    uptimeBlue,
    isOnPaceRed,
    isOnPaceBlue,
    kicksInWindowRed,
    kicksInWindowBlue,
    // Actions
    goToSetup,
    startCountdown,
    resetGame,
    registerKick,
    togglePause,
  };
}
