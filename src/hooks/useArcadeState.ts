import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Side, ArcadeConfig, ArcadePlayerState, ArcadeRoundResult, ArcadeResult, HitType } from '@/types/game';

const DEFAULT_ARCADE_CONFIG: ArcadeConfig = {
  roundDurationSec: 60,
  startingHP: 100,
  bestOf: 3,
  comboWindowMs: 700,
  energyPerKick: 0,
  energyMax: 100,
  vestDamage: 1,
  helmetDamage: 1,
  specialDamageBonus: 0,
  minIntervalMs: 150,
  recoveryIntervalSec: 15,
};

// Player state without combo fields
type InternalPlayerState = Omit<ArcadePlayerState, 'comboCount' | 'lastKickAt'> & { comboCount: number; lastKickAt: number };

const COUNTDOWN_DURATION = 6;

const createInitialPlayerState = (hp: number): ArcadePlayerState => ({
  hp,
  energy: 0,
  comboCount: 0,
  lastKickAt: 0,
  specialReady: false,
});

interface UseArcadeStateOptions extends Partial<ArcadeConfig> {
  onHit?: () => void;
  onHitHeavy?: () => void;
  
  onSpecialReady?: () => void;
  onSpecialAttack?: () => void;
  onKO?: () => void;
  onTimeUp?: () => void;
  onRoundEnd?: () => void;
}

export function useArcadeState(options: UseArcadeStateOptions = {}) {
  const { onHit, onHitHeavy, onSpecialReady, onSpecialAttack, onKO, onTimeUp, onRoundEnd, ...config } = options;
  
  const fullConfig = { 
    ...DEFAULT_ARCADE_CONFIG, 
    ...config 
  };
  
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentRound, setCurrentRound] = useState(1);
  const [redState, setRedState] = useState<ArcadePlayerState>(createInitialPlayerState(fullConfig.startingHP));
  const [blueState, setBlueState] = useState<ArcadePlayerState>(createInitialPlayerState(fullConfig.startingHP));
  const [timeLeft, setTimeLeft] = useState(fullConfig.roundDurationSec);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [roundResults, setRoundResults] = useState<ArcadeRoundResult[]>([]);
  const [lastResult, setLastResult] = useState<ArcadeResult | null>(null);
  
  // Visual feedback states
  const [flashSide, setFlashSide] = useState<Side | null>(null);
  
  const [showSpecialUsed, setShowSpecialUsed] = useState<Side | null>(null);
  const [showKO, setShowKO] = useState<Side | null>(null);
  const [lastDamage, setLastDamage] = useState<{ side: Side; amount: number; hitType: HitType } | null>(null);
  
  // Recovery countdown between rounds
  const [recoveryCountdown, setRecoveryCountdown] = useState(0);

  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const recoveryTimerRef = useRef<number | null>(null);
  const lastKickTime = useRef<{ red: number; blue: number }>({ red: 0, blue: 0 });

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
    if (recoveryTimerRef.current) {
      window.clearInterval(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
  }, []);

  // Reset to initial state
  const resetGame = useCallback(() => {
    clearTimers();
    setGameState('idle');
    setCurrentRound(1);
    setRedState(createInitialPlayerState(fullConfig.startingHP));
    setBlueState(createInitialPlayerState(fullConfig.startingHP));
    setTimeLeft(fullConfig.roundDurationSec);
    setCountdown(COUNTDOWN_DURATION);
    setRoundResults([]);
    setLastResult(null);
    setFlashSide(null);
    setShowSpecialUsed(null);
    setShowKO(null);
    setLastDamage(null);
    setRecoveryCountdown(0);
    lastKickTime.current = { red: 0, blue: 0 };
  }, [clearTimers, fullConfig.startingHP, fullConfig.roundDurationSec]);

  // Go to setup
  const goToSetup = useCallback(() => {
    resetGame();
    setGameState('setup');
  }, [resetGame]);

  // Go to loading state (before countdown)
  const goToLoading = useCallback(() => {
    setGameState('loading');
  }, []);

  // Reset for new round
  const resetRound = useCallback(() => {
    setRedState(createInitialPlayerState(fullConfig.startingHP));
    setBlueState(createInitialPlayerState(fullConfig.startingHP));
    setTimeLeft(fullConfig.roundDurationSec);
    setFlashSide(null);
    setShowSpecialUsed(null);
    setShowKO(null);
    setLastDamage(null);
    lastKickTime.current = { red: 0, blue: 0 };
  }, [fullConfig.startingHP, fullConfig.roundDurationSec]);

  // Start countdown
  const startCountdown = useCallback(() => {
    resetRound();
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
  }, [resetRound]);

  // Start game timer
  const startGame = useCallback(() => {
    setGameState('running');

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
  }, []);

  // Handle countdown completion
  useEffect(() => {
    if (gameState === 'countdown' && countdown === 0) {
      startGame();
    }
  }, [gameState, countdown, startGame]);

  // Calculate damage — fixed damage based on hit type
  const calculateDamage = useCallback((hitType: HitType): number => {
    return hitType === 'helmet' ? fullConfig.helmetDamage : fullConfig.vestDamage;
  }, [fullConfig.vestDamage, fullConfig.helmetDamage]);

  // Register kick — DEMOLITION RACE: damage applies to OWN HP
  const registerKick = useCallback((side: Side, hitType: HitType = 'vest') => {
    if (gameState !== 'running') return false;

    const now = Date.now();
    const lastKick = lastKickTime.current[side];

    // Debounce
    if (now - lastKick < fullConfig.minIntervalMs) {
      return false;
    }

    lastKickTime.current[side] = now;

    const setAttackerState = side === 'red' ? setRedState : setBlueState;

    const damage = calculateDamage(hitType);

    // Apply damage to OWN HP (demolition race)
    setAttackerState(prev => ({
      ...prev,
      hp: Math.max(0, prev.hp - damage),
    }));

    // Sound effects
    if (hitType === 'helmet') {
      onHitHeavy?.();
    } else {
      onHit?.();
    }

    // Visual feedback — flash on OWN side (attacker side)
    setFlashSide(side);
    setTimeout(() => setFlashSide(null), 150);

    // Show damage on OWN side
    setLastDamage({ side, amount: damage, hitType });
    setTimeout(() => setLastDamage(null), 400);

    return true;
  }, [gameState, fullConfig, calculateDamage, onHit, onHitHeavy]);

  // End round
  const endRound = useCallback((winner: Side | 'tie', isKO: boolean) => {
    clearTimers();
    onRoundEnd?.();
    
    const roundResult: ArcadeRoundResult = {
      winner,
      redHP: Math.round(redState.hp),
      blueHP: Math.round(blueState.hp),
      isKO,
    };

    const newRoundResults = [...roundResults, roundResult];
    setRoundResults(newRoundResults);

    if (isKO) {
      setShowKO(winner as Side);
      onKO?.();
    } else {
      onTimeUp?.();
    }

    // Count wins
    const redWins = newRoundResults.filter(r => r.winner === 'red').length;
    const blueWins = newRoundResults.filter(r => r.winner === 'blue').length;
    const winsNeeded = Math.ceil(fullConfig.bestOf / 2);

    // Check if match is over
    if (redWins >= winsNeeded || blueWins >= winsNeeded || currentRound >= fullConfig.bestOf) {
      const matchWinner: Side | 'tie' = redWins > blueWins ? 'red' : blueWins > redWins ? 'blue' : 'tie';
      
      const result: ArcadeResult = {
        mode: 'arcade',
        rounds: newRoundResults,
        winner: matchWinner,
        redWins,
        blueWins,
        bestOf: fullConfig.bestOf,
        timestamp: Date.now(),
      };

      setLastResult(result);
      setGameState('finished');

      try {
        localStorage.setItem('kickcounter_lastArcadeResult', JSON.stringify(result));
      } catch (e) {
        console.error('Failed to save arcade result:', e);
      }
    } else {
      // More rounds to play
      setGameState('round_end');
      setRecoveryCountdown(fullConfig.recoveryIntervalSec);
      
      recoveryTimerRef.current = window.setInterval(() => {
        setRecoveryCountdown(prev => {
          if (prev <= 1) {
            window.clearInterval(recoveryTimerRef.current!);
            recoveryTimerRef.current = null;
            setCurrentRound(p => p + 1);
            setShowKO(null);
            startCountdown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [clearTimers, redState.hp, blueState.hp, roundResults, currentRound, fullConfig.bestOf, fullConfig.recoveryIntervalSec, startCountdown, onKO, onTimeUp, onRoundEnd]);

  // Check for KO or time up — DEMOLITION RACE: reaching 0 HP = WIN
  useEffect(() => {
    if (gameState !== 'running') return;

    // KO: whoever reaches 0 first WINS
    if (redState.hp <= 0) {
      endRound('red', true);
      return;
    }
    if (blueState.hp <= 0) {
      endRound('blue', true);
      return;
    }

    // Time up: LOWER HP wins (destroyed more)
    if (timeLeft === 0) {
      const winner: Side | 'tie' = 
        redState.hp < blueState.hp ? 'red' : 
        blueState.hp < redState.hp ? 'blue' : 'tie';
      endRound(winner, false);
    }
  }, [gameState, redState.hp, blueState.hp, timeLeft, endRound]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      switch (key) {
        case 'a':
          registerKick('red', 'vest');
          break;
        case 'q':
          registerKick('red', 'helmet');
          break;
        case 'l':
          registerKick('blue', 'vest');
          break;
        case 'p':
          registerKick('blue', 'helmet');
          break;
        case ' ':
          e.preventDefault();
          if (gameState === 'setup') {
            startCountdown();
          } else if (gameState === 'finished') {
            goToSetup();
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
  }, [gameState, registerKick, startCountdown, goToSetup, resetGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return {
    gameState,
    currentRound,
    timeLeft,
    countdown,
    roundResults,
    lastResult,
    redState,
    blueState,
    flashSide,
    showSpecialUsed,
    showKO,
    lastDamage,
    recoveryCountdown,
    config: fullConfig,
    goToSetup,
    goToLoading,
    startCountdown,
    resetGame,
    registerKick,
  };
}

export type UseArcadeStateReturn = ReturnType<typeof useArcadeState>;
