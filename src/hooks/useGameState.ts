import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Side, GameConfig, GameScore, GameResult, Athlete, SoloResult } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_CONFIG: GameConfig = {
  duration: 60,
  minIntervalMs: 120,
};

const COUNTDOWN_DURATION = 6; // 3s intro + 3s contagem sincronizada

interface UseGameStateOptions extends GameConfig {
  onHit?: () => void;
  onGameEnd?: () => void;
  isIndividual?: boolean;
  selectedAthlete?: Athlete | null;
}

export function useGameState(config: UseGameStateOptions = DEFAULT_CONFIG) {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [scores, setScores] = useState<GameScore>({ red: 0, blue: 0 });
  const [timeLeft, setTimeLeft] = useState(config.duration);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [flashSide, setFlashSide] = useState<Side | null>(null);

  const lastKickTime = useRef<{ red: number; blue: number }>({ red: 0, blue: 0 });
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const kickSideToggle = useRef<Side>('red'); // For individual mode

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
    setScores({ red: 0, blue: 0 });
    setTimeLeft(config.duration);
    setCountdown(COUNTDOWN_DURATION);
    setFlashSide(null);
    lastKickTime.current = { red: 0, blue: 0 };
    kickSideToggle.current = 'red';
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
  }, []);

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
    if (gameState === 'running' && timeLeft === 0) {
      const totalKicks = scores.red + scores.blue;
      
      if (config.isIndividual && config.selectedAthlete) {
        // Individual mode - save to solo_results
        const result: GameResult = {
          mode: 'time_attack',
          scores: { ...scores },
          duration: config.duration,
          winner: 'tie', // No winner in individual mode
          timestamp: Date.now(),
          isIndividual: true,
          athleteId: config.selectedAthlete.id,
          athleteName: config.selectedAthlete.name,
          totalKicks,
        };

        setLastResult(result);
        setGameState('finished');
        config.onGameEnd?.();

        // Save to Supabase
        saveSoloResult(config.selectedAthlete.id, totalKicks, config.duration);
      } else {
        // Duo mode - existing logic
        const winner: Side | 'tie' = 
          scores.red > scores.blue ? 'red' : 
          scores.blue > scores.red ? 'blue' : 'tie';

        const result: GameResult = {
          mode: 'time_attack',
          scores: { ...scores },
          duration: config.duration,
          winner,
          timestamp: Date.now(),
        };

        setLastResult(result);
        setGameState('finished');
        config.onGameEnd?.();

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
    }
  }, [gameState, timeLeft, scores, config]);

  // Save solo result to database
  const saveSoloResult = async (athleteId: string, kicks: number, duration: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('solo_results').insert({
        athlete_id: athleteId,
        academy_id: user.id,
        kicks,
        duration_seconds: duration,
      });
    } catch (err) {
      console.error('Error saving solo result:', err);
    }
  };

  // Register a kick with debounce
  const registerKick = useCallback((side: Side) => {
    if (gameState !== 'running') return false;

    const now = Date.now();
    
    if (config.isIndividual) {
      // Individual mode: both sides count as one, alternate for visual effect
      const lastKick = Math.max(lastKickTime.current.red, lastKickTime.current.blue);
      if (now - lastKick < config.minIntervalMs) {
        return false; // Debounced
      }

      lastKickTime.current.red = now;
      lastKickTime.current.blue = now;
      
      // Alternate which side shows the kick for visual balance
      const targetSide = kickSideToggle.current;
      kickSideToggle.current = targetSide === 'red' ? 'blue' : 'red';
      
      setScores((prev) => ({
        red: targetSide === 'red' ? prev.red + 1 : prev.red,
        blue: targetSide === 'blue' ? prev.blue + 1 : prev.blue,
      }));

      // Trigger flash effect
      setFlashSide(targetSide);
    } else {
      // Duo mode: existing logic
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
    }

    // Play hit sound
    config.onHit?.();

    setTimeout(() => setFlashSide(null), 150);

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
