import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, SoloConfig, SoloResult, Athlete } from '@/types/game';

const DEFAULT_CONFIG: SoloConfig = {
  duration: 60,
  minIntervalMs: 120,
};

const COUNTDOWN_DURATION = 6;

interface UseSoloStateOptions extends SoloConfig {
  onHit?: () => void;
  onGameEnd?: () => void;
}

export function useSoloState(config: UseSoloStateOptions = DEFAULT_CONFIG) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [kicks, setKicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [lastResult, setLastResult] = useState<SoloResult | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const lastKickTime = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Reset game to initial state
  const resetGame = useCallback(() => {
    clearTimers();
    setGameState('idle');
    setKicks(0);
    setTimeLeft(config.duration);
    setCountdown(COUNTDOWN_DURATION);
    setIsFlashing(false);
    lastKickTime.current = 0;
    // Don't reset selectedAthlete to keep it for quick restart
  }, [clearTimers, config.duration]);

  // Go to setup screen
  const goToSetup = useCallback(() => {
    resetGame();
    setGameState('setup');
  }, [resetGame]);

  // Start countdown
  const startCountdown = useCallback(() => {
    if (!selectedAthlete) return; // Must have athlete selected
    
    setGameState('countdown');
    setCountdown(COUNTDOWN_DURATION);

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(countdownRef.current!);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [selectedAthlete]);

  // Start the game timer
  const startGame = useCallback(() => {
    setGameState('running');
    setTimeLeft(config.duration);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current!);
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
    if (gameState === 'running' && timeLeft === 0 && selectedAthlete) {
      const kicksPerSecond = kicks / config.duration;

      const result: SoloResult = {
        mode: 'solo',
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        kicks,
        duration: config.duration,
        kicksPerSecond: Math.round(kicksPerSecond * 100) / 100,
        timestamp: Date.now(),
      };

      setLastResult(result);
      setGameState('finished');
      config.onGameEnd?.();
    }
  }, [gameState, timeLeft, kicks, selectedAthlete, config]);

  // Register a kick with debounce - both sides count as same kick
  const registerKick = useCallback(() => {
    if (gameState !== 'running') return false;

    const now = Date.now();
    if (now - lastKickTime.current < config.minIntervalMs) {
      return false; // Debounced
    }

    lastKickTime.current = now;
    setKicks((prev) => prev + 1);

    // Play hit sound
    config.onHit?.();

    // Trigger flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    return true;
  }, [gameState, config]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (gameState === 'running') {
      clearTimers();
      setGameState('paused');
    } else if (gameState === 'paused') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(timerRef.current!);
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
        case 'l':
          // Both keys register a kick in solo mode
          registerKick();
          break;
        case ' ':
          e.preventDefault();
          if (gameState === 'idle') {
            goToSetup();
          } else if (gameState === 'setup' && selectedAthlete) {
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
  }, [gameState, selectedAthlete, registerKick, goToSetup, startCountdown, resetGame, togglePause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return {
    gameState,
    kicks,
    timeLeft,
    countdown,
    lastResult,
    selectedAthlete,
    isFlashing,
    config,
    goToSetup,
    startCountdown,
    resetGame,
    registerKick,
    togglePause,
    setSelectedAthlete,
  };
}
