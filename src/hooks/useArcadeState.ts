import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Side, ArcadeConfig, ArcadePlayerState, ArcadeRoundResult, ArcadeResult, HitType } from '@/types/game';

// Difficulty configs by round duration
// Kids: higher damage for faster matches
// Adult: lower damage for tactical matches
const DIFFICULTY_CONFIGS: Record<number, { vestDamage: number; helmetDamage: number; specialDamageBonus: number }> = {
  20: { vestDamage: 3, helmetDamage: 5, specialDamageBonus: 10 },  // Kids 4-6
  30: { vestDamage: 2, helmetDamage: 4, specialDamageBonus: 12 },  // Kids 7-9
  45: { vestDamage: 2, helmetDamage: 3, specialDamageBonus: 12 },  // Juvenil
  60: { vestDamage: 1, helmetDamage: 2, specialDamageBonus: 15 },  // Adulto
};

function getDifficultyConfig(roundDuration: number) {
  return DIFFICULTY_CONFIGS[roundDuration] || DIFFICULTY_CONFIGS[45]; // Default to Juvenil
}

const DEFAULT_ARCADE_CONFIG: ArcadeConfig = {
  roundDurationSec: 60,
  startingHP: 100,
  bestOf: 3,
  comboWindowMs: 700,
  energyPerKick: 10,
  energyMax: 100,
  vestDamage: 2,
  helmetDamage: 3,
  specialDamageBonus: 12,
  minIntervalMs: 150,
  recoveryIntervalSec: 15,
};

const COUNTDOWN_DURATION = 6; // 3s intro + 3s synchronized countdown

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
  onCombo?: () => void;
  onSpecialReady?: () => void;
  onSpecialAttack?: () => void;
  onKO?: () => void;
  onTimeUp?: () => void;
  onRoundEnd?: () => void;
}

export function useArcadeState(options: UseArcadeStateOptions = {}) {
  const { onHit, onHitHeavy, onCombo, onSpecialReady, onSpecialAttack, onKO, onTimeUp, onRoundEnd, ...config } = options;
  
  // Get difficulty-based config
  const difficultyConfig = getDifficultyConfig(config.roundDurationSec || DEFAULT_ARCADE_CONFIG.roundDurationSec);
  const fullConfig = { 
    ...DEFAULT_ARCADE_CONFIG, 
    ...difficultyConfig,
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
  const [showCombo, setShowCombo] = useState<{ side: Side; count: number } | null>(null);
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
    setShowCombo(null);
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

  // Calculate damage with combo and hit type
  const calculateDamage = useCallback((attackerState: ArcadePlayerState, now: number, hitType: HitType): { damage: number; newCombo: number; usedSpecial: boolean } => {
    // Check combo
    const timeSinceLastKick = now - attackerState.lastKickAt;
    const isCombo = timeSinceLastKick <= fullConfig.comboWindowMs && attackerState.lastKickAt > 0;
    const newCombo = isCombo ? attackerState.comboCount + 1 : 1;
    
    // Base damage based on hit type (helmet does more damage)
    const baseDamage = hitType === 'helmet' 
      ? fullConfig.helmetDamage 
      : fullConfig.vestDamage;
    
    // Combo bonus (max +4)
    const comboBonus = Math.min(newCombo - 1, 4);
    let damage = baseDamage + comboBonus;
    
    // Special bonus
    const usedSpecial = attackerState.specialReady;
    if (usedSpecial) {
      damage += fullConfig.specialDamageBonus;
    }
    
    return { damage, newCombo, usedSpecial };
  }, [fullConfig.vestDamage, fullConfig.helmetDamage, fullConfig.comboWindowMs, fullConfig.specialDamageBonus]);

  // Register kick with hit type
  const registerKick = useCallback((side: Side, hitType: HitType = 'vest') => {
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

    // Calculate damage with hit type
    const { damage, newCombo, usedSpecial } = calculateDamage(attackerState, now, hitType);

    // Check if special will become ready after this kick
    const currentEnergy = attackerState.energy;
    const newEnergy = usedSpecial ? 0 : Math.min(currentEnergy + fullConfig.energyPerKick, fullConfig.energyMax);
    const willBecomeSpecialReady = !attackerState.specialReady && newEnergy >= fullConfig.energyMax;

    // Update attacker state
    setAttackerState(prev => {
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

    // Play sound effects
    if (usedSpecial || damage >= 10) {
      onHitHeavy?.();
      onSpecialAttack?.();
    } else {
      onHit?.();
    }

    if (newCombo > 1) {
      onCombo?.();
    }

    if (willBecomeSpecialReady) {
      onSpecialReady?.();
    }

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

    // Show damage with hit type
    setLastDamage({ side: defenderSide, amount: damage, hitType });
    setTimeout(() => setLastDamage(null), 400);

    return true;
  }, [gameState, redState, blueState, fullConfig, calculateDamage, onHit, onHitHeavy, onCombo, onSpecialReady, onSpecialAttack]);

  // End round
  const endRound = useCallback((winner: Side | 'tie', isKO: boolean) => {
    clearTimers();
    onRoundEnd?.(); // Stop background music
    
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
      setRecoveryCountdown(fullConfig.recoveryIntervalSec);
      
      // Recovery countdown timer
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
          registerKick('red', 'vest');
          break;
        case 'q': // Helmet hit for red
          registerKick('red', 'helmet');
          break;
        case 'l':
          registerKick('blue', 'vest');
          break;
        case 'p': // Helmet hit for blue
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
    recoveryCountdown,
    
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
