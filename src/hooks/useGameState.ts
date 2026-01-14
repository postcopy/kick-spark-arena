import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Side, GameConfig, GameScore, GameResult } from '@/types/game';

const DEFAULT_CONFIG: GameConfig = {
  duration: 60,
  minIntervalMs: 120,
};

const COUNTDOWN_DURATION = 3;

export function useGameState(config: GameConfig = DEFAULT_CONFIG) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [scores, setScores] = useState<GameScore>({ red: 0, blue: 0 });
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [flashSide, setFlashSide] = useState<Side | null>(null);

  const lastKickTime = useRef<{ red: number; blue: number }>({ red: 0, blue: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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
  }, []);

  // Reset game to initial state
  const resetGame = useCallback(() => {
    clearTimers();
    setGameState('idle');
    setScores({ red: 0, blue: 0 });
    setTimeLeft(config.duration);
    setCountdown(COUNTDOWN_DURATION);
    setFlashSide(null);
    lastKickTime.current = { red: 0, blue: 0 };
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

  // Start the game timer
  const startGame = useCallback(() => {
    setGameState('running');
    setTimeLeft(config.duration);

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
  }, [config.duration]);

  // Handle countdown completion
  useEffect(() => {
    if (gameState === 'countdown' && countdown === 0) {
      startGame();
    }
  }, [gameState, countdown, startGame]);

  // Handle game end
  useEffect(() => {
    if (gameState === 'running' && timeLeft === 0) {
      const winner: Side | 'tie' = 
        scores.red > scores.blue ? 'red' : 
        scores.blue > scores.red ? 'blue' : 'tie';

      const result: GameResult = {
        scores: { ...scores },
        duration: config.duration,
        winner,
        timestamp: Date.now(),
      };

      setLastResult(result);
      setGameState('finished');

      // Save to localStorage
      try {
        localStorage.setItem('kickcounter_lastResult', JSON.stringify(result));
        
        // Update day record
        const today = new Date().toISOString().split('T')[0];
        const storedRecord = localStorage.getItem('kickcounter_dayRecord');
        const dayRecord = storedRecord ? JSON.parse(storedRecord) : null;

        if (!dayRecord || dayRecord.date !== today) {
          localStorage.setItem('kickcounter_dayRecord', JSON.stringify({
            date: today,
            bestRed: scores.red,
            bestBlue: scores.blue,
            bestTotal: scores.red + scores.blue,
          }));
        } else {
          localStorage.setItem('kickcounter_dayRecord', JSON.stringify({
            date: today,
            bestRed: Math.max(dayRecord.bestRed, scores.red),
            bestBlue: Math.max(dayRecord.bestBlue, scores.blue),
            bestTotal: Math.max(dayRecord.bestTotal, scores.red + scores.blue),
          }));
        }
      } catch (e) {
        console.error('Failed to save result:', e);
      }
    }
  }, [gameState, timeLeft, scores, config.duration]);

  // Register a kick with debounce
  const registerKick = useCallback((side: Side) => {
    if (gameState !== 'running') return false;

    const now = Date.now();
    const lastKick = lastKickTime.current[side];

    if (now - lastKick < config.minIntervalMs) {
      return false; // Debounced
    }

    lastKickTime.current[side] = now;
    setScores((prev) => ({
      ...prev,
      [side]: prev[side] + 1,
    }));

    // Trigger flash effect
    setFlashSide(side);
    setTimeout(() => setFlashSide(null), 150);

    return true;
  }, [gameState, config.minIntervalMs]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (gameState === 'running') {
      clearTimers();
      setGameState('paused');
    } else if (gameState === 'paused') {
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
      setGameState('running');
    }
  }, [gameState, clearTimers]);

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
    goToSetup,
    startCountdown,
    resetGame,
    registerKick,
    togglePause,
    setConfig: () => {}, // Will implement in settings
  };
}
