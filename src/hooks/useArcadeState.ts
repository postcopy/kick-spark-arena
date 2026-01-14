import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Side, ArcadeConfig, ArcadePlayerState, ArcadeRoundResult, ArcadeResult } from '@/types/game';

const DEFAULT_ARCADE_CONFIG: ArcadeConfig = {
  roundDurationSec: 60,
  startingHP: 100,
  bestOf: 3,
  comboWindowMs: 700,
  energyPerKick: 10,
  energyMax: 100,
  baseDamage: 2,
  specialDamageBonus: 12,
  minIntervalMs: 150,
};

const COUNTDOWN_DURATION = 3;
const ROUND_END_DELAY = 3000; // 3 seconds before next round

const createInitialPlayerState = (hp: number): ArcadePlayerState => ({
  hp,
  energy: 0,
  comboCount: 0,
  lastKickAt: 0,
  specialReady: false,
});

export function useArcadeState(config: Partial<ArcadeConfig> = {}) {
  const fullConfig = { ...DEFAULT_ARCADE_CONFIG, ...config };
  
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
  const [showCombo, setShowCombo] = useState<{ side: Side; count: number } | null>(null);
  const [showSpecialUsed, setShowSpecialUsed] = useState<Side | null>(null);
  const [showKO, setShowKO] = useState<Side | null>(null);
  const [lastDamage, setLastDamage] = useState<{ side: Side; amount: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastKickTime = useRef<{ red: number; blue: number }>({ red: 0, blue: 0 });

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
    setShowCombo(null);
    setShowSpecialUsed(null);
    setShowKO(null);
    setLastDamage(null);
    lastKickTime.current = { red: 0, blue: 0 };
  }, [clearTimers, fullConfig.startingHP, fullConfig.roundDurationSec]);

  // Go to setup
  const goToSetup = useCallback(() => {
    resetGame();
    setGameState('setup');
  }, [resetGame]);

  // Reset for new round
  const resetRound = useCallback(() => {
    setRedState(createInitialPlayerState(fullConfig.startingHP));
    setBlueState(createInitialPlayerState(fullConfig.startingHP));
    setTimeLeft(fullConfig.roundDurationSec);
    setFlashSide(null);
    setShowCombo(null);
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
  }, [resetRound]);

  // Start game timer
  const startGame = useCallback(() => {
    setGameState('running');

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
  }, []);

  // Handle countdown completion
  useEffect(() => {
    if (gameState === 'countdown' && countdown === 0) {
      startGame();
    }
  }, [gameState, countdown, startGame]);

  // Calculate damage with combo
  const calculateDamage = useCallback((attackerState: ArcadePlayerState, now: number): { damage: number; newCombo: number; usedSpecial: boolean } => {
    // Check combo
    const timeSinceLastKick = now - attackerState.lastKickAt;
    const isCombo = timeSinceLastKick <= fullConfig.comboWindowMs && attackerState.lastKickAt > 0;
    const newCombo = isCombo ? attackerState.comboCount + 1 : 1;
    
    // Base damage + combo bonus (max +4)
    const comboBonus = Math.min(newCombo - 1, 4);
    let damage = fullConfig.baseDamage + comboBonus;
    
    // Special bonus
    const usedSpecial = attackerState.specialReady;
    if (usedSpecial) {
      damage += fullConfig.specialDamageBonus;
    }
    
    return { damage, newCombo, usedSpecial };
  }, [fullConfig.baseDamage, fullConfig.comboWindowMs, fullConfig.specialDamageBonus]);

  // Register kick
  const registerKick = useCallback((side: Side) => {
    if (gameState !== 'running') return false;

    const now = Date.now();
    const lastKick = lastKickTime.current[side];

    // Debounce
    if (now - lastKick < fullConfig.minIntervalMs) {
      return false;
    }

    lastKickTime.current[side] = now;

    const attackerState = side === 'red' ? redState : blueState;
    const setAttackerState = side === 'red' ? setRedState : setBlueState;
    const setDefenderState = side === 'red' ? setBlueState : setRedState;
    const defenderSide: Side = side === 'red' ? 'blue' : 'red';

    // Calculate damage
    const { damage, newCombo, usedSpecial } = calculateDamage(attackerState, now);

    // Update attacker state
    setAttackerState(prev => {
      const newEnergy = usedSpecial ? 0 : Math.min(prev.energy + fullConfig.energyPerKick, fullConfig.energyMax);
      return {
        ...prev,
        energy: newEnergy,
        comboCount: newCombo,
        lastKickAt: now,
        specialReady: newEnergy >= fullConfig.energyMax,
      };
    });

    // Apply damage to defender
    setDefenderState(prev => ({
      ...prev,
      hp: Math.max(0, prev.hp - damage),
    }));

    // Visual feedback
    setFlashSide(defenderSide);
    setTimeout(() => setFlashSide(null), 150);

    // Show combo if > 1
    if (newCombo > 1) {
      setShowCombo({ side, count: newCombo });
      setTimeout(() => setShowCombo(null), 600);
    }

    // Show special used
    if (usedSpecial) {
      setShowSpecialUsed(side);
      setTimeout(() => setShowSpecialUsed(null), 800);
    }

    // Show damage
    setLastDamage({ side: defenderSide, amount: damage });
    setTimeout(() => setLastDamage(null), 400);

    return true;
  }, [gameState, redState, blueState, fullConfig, calculateDamage]);

  // End round
  const endRound = useCallback((winner: Side | 'tie', isKO: boolean) => {
    clearTimers();
    
    const roundResult: ArcadeRoundResult = {
      winner,
      redHP: redState.hp,
      blueHP: blueState.hp,
      isKO,
    };

    const newRoundResults = [...roundResults, roundResult];
    setRoundResults(newRoundResults);

    if (isKO) {
      setShowKO(winner as Side);
    }

    // Count wins
    const redWins = newRoundResults.filter(r => r.winner === 'red').length;
    const blueWins = newRoundResults.filter(r => r.winner === 'blue').length;
    const winsNeeded = Math.ceil(fullConfig.bestOf / 2);

    // Check if match is over
    if (redWins >= winsNeeded || blueWins >= winsNeeded || currentRound >= fullConfig.bestOf) {
      // Match finished
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

      // Save to localStorage
      try {
        localStorage.setItem('kickcounter_lastArcadeResult', JSON.stringify(result));
      } catch (e) {
        console.error('Failed to save arcade result:', e);
      }
    } else {
      // More rounds to play
      setGameState('round_end');
      
      // Auto-start next round after delay
      setTimeout(() => {
        setCurrentRound(prev => prev + 1);
        setShowKO(null);
        startCountdown();
      }, ROUND_END_DELAY);
    }
  }, [clearTimers, redState.hp, blueState.hp, roundResults, currentRound, fullConfig.bestOf, startCountdown]);

  // Check for KO or time up
  useEffect(() => {
    if (gameState !== 'running') return;

    // Check KO
    if (redState.hp <= 0) {
      endRound('blue', true);
      return;
    }
    if (blueState.hp <= 0) {
      endRound('red', true);
      return;
    }

    // Check time up
    if (timeLeft === 0) {
      const winner: Side | 'tie' = 
        redState.hp > blueState.hp ? 'red' : 
        blueState.hp > redState.hp ? 'blue' : 'tie';
      endRound(winner, false);
    }
  }, [gameState, redState.hp, blueState.hp, timeLeft, endRound]);

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
    // Game state
    gameState,
    currentRound,
    timeLeft,
    countdown,
    roundResults,
    lastResult,
    
    // Player states
    redState,
    blueState,
    
    // Visual feedback
    flashSide,
    showCombo,
    showSpecialUsed,
    showKO,
    lastDamage,
    
    // Config
    config: fullConfig,
    
    // Actions
    goToSetup,
    startCountdown,
    resetGame,
    registerKick,
  };
}

export type UseArcadeStateReturn = ReturnType<typeof useArcadeState>;
