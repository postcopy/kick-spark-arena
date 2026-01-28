import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState } from '@/types/game';
import type { 
  ReactionLevel, 
  SignalColor, 
  ReactionConfig, 
  ReactionResult,
  ReactionBurstConfig 
} from '@/types/reaction';
import { REACTION_PRESETS } from '@/types/reaction';

interface UseReactionStateProps {
  level: ReactionLevel;
  onBlockEnd?: () => void;
  onSessionEnd?: () => void;
}

// Utility to get random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useReactionState({ level, onBlockEnd, onSessionEnd }: UseReactionStateProps) {
  const config = REACTION_PRESETS[level];
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [countdown, setCountdown] = useState(3);
  
  // Block state
  const [currentBlock, setCurrentBlock] = useState(1);
  const [blockTimeLeft, setBlockTimeLeft] = useState(config.blocks.workSec);
  
  // Rest state
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  
  // Signal state
  const [currentSignal, setCurrentSignal] = useState<SignalColor>('neutral');
  
  // Stats
  const [stats, setStats] = useState({ total: 0, go: 0, stop: 0 });
  
  // Result
  const [lastResult, setLastResult] = useState<ReactionResult | null>(null);
  
  // Refs for timers
  const blockTimerRef = useRef<number | null>(null);
  const signalTimerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  
  // Burst mode tracking
  const signalCountRef = useRef(0);
  const burstActiveRef = useRef(false);
  const burstCountRef = useRef(0);
  const nextBurstAtRef = useRef(0);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (blockTimerRef.current) {
      window.clearInterval(blockTimerRef.current);
      blockTimerRef.current = null;
    }
    if (signalTimerRef.current) {
      window.clearTimeout(signalTimerRef.current);
      signalTimerRef.current = null;
    }
    if (restTimerRef.current) {
      window.clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Initialize burst tracking for a block
  const initBurst = useCallback((burstConfig: ReactionBurstConfig) => {
    signalCountRef.current = 0;
    burstActiveRef.current = false;
    burstCountRef.current = 0;
    if (burstConfig.enabled && burstConfig.everyMin && burstConfig.everyMax) {
      nextBurstAtRef.current = randomBetween(burstConfig.everyMin, burstConfig.everyMax);
    }
  }, []);

  // Generate next signal
  const generateNextSignal = useCallback((cfg: ReactionConfig) => {
    // Check if we should trigger burst mode
    if (cfg.burst.enabled && !burstActiveRef.current) {
      signalCountRef.current++;
      if (signalCountRef.current >= nextBurstAtRef.current) {
        burstActiveRef.current = true;
        burstCountRef.current = randomBetween(cfg.burst.countMin!, cfg.burst.countMax!);
      }
    }

    // Determine if this is a STOP signal
    const isStop = Math.random() * 100 < cfg.stopRate;
    
    // Get timing based on burst mode
    let flashDuration: number;
    let gapDuration: number;
    
    if (burstActiveRef.current && cfg.burst.enabled) {
      // Burst mode: faster timing
      flashDuration = randomBetween(cfg.flashMs.min, cfg.flashMs.max);
      gapDuration = randomBetween(cfg.burst.gapMin!, cfg.burst.gapMax!);
      burstCountRef.current--;
      if (burstCountRef.current <= 0) {
        burstActiveRef.current = false;
        signalCountRef.current = 0;
        nextBurstAtRef.current = randomBetween(cfg.burst.everyMin!, cfg.burst.everyMax!);
      }
    } else {
      // Normal mode
      flashDuration = randomBetween(cfg.flashMs.min, cfg.flashMs.max);
      gapDuration = randomBetween(cfg.gapMs.min, cfg.gapMs.max);
    }

    // Show signal
    setCurrentSignal(isStop ? 'stop' : 'go');
    setStats(prev => ({
      total: prev.total + 1,
      go: prev.go + (isStop ? 0 : 1),
      stop: prev.stop + (isStop ? 1 : 0),
    }));

    // Schedule neutral (gap)
    signalTimerRef.current = window.setTimeout(() => {
      setCurrentSignal('neutral');
      
      // Schedule next signal
      signalTimerRef.current = window.setTimeout(() => {
        generateNextSignal(cfg);
      }, gapDuration);
    }, flashDuration);
  }, []);

  // Start a block
  const startBlock = useCallback(() => {
    const cfg = REACTION_PRESETS[level];
    setBlockTimeLeft(cfg.blocks.workSec);
    setCurrentSignal('neutral');
    initBurst(cfg.burst);
    
    // Start block timer
    blockTimerRef.current = window.setInterval(() => {
      setBlockTimeLeft(prev => {
        if (prev <= 1) {
          // Block ended
          window.clearInterval(blockTimerRef.current!);
          blockTimerRef.current = null;
          
          // Stop signal generation
          if (signalTimerRef.current) {
            window.clearTimeout(signalTimerRef.current);
            signalTimerRef.current = null;
          }
          
          setCurrentSignal('neutral');
          onBlockEnd?.();
          
          // Check if session is complete
          setCurrentBlock(prevBlock => {
            if (prevBlock >= cfg.blocks.count) {
              // Session complete
              setGameState('finished');
              setLastResult({
                mode: 'reaction',
                level,
                blocksCompleted: prevBlock,
                totalSignals: stats.total,
                goSignals: stats.go,
                stopSignals: stats.stop,
                timestamp: Date.now(),
              });
              onSessionEnd?.();
              return prevBlock;
            } else {
              // Start rest period
              setIsResting(true);
              setRestTimeLeft(cfg.blocks.restSec);
              
              restTimerRef.current = window.setInterval(() => {
                setRestTimeLeft(prevRest => {
                  if (prevRest <= 1) {
                    window.clearInterval(restTimerRef.current!);
                    restTimerRef.current = null;
                    setIsResting(false);
                    // Start next block after rest ends
                    setTimeout(() => startBlock(), 100);
                    return 0;
                  }
                  return prevRest - 1;
                });
              }, 1000);
              
              return prevBlock + 1;
            }
          });
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start signal generation after a brief delay
    signalTimerRef.current = window.setTimeout(() => {
      generateNextSignal(cfg);
    }, 500);
  }, [level, initBurst, generateNextSignal, onBlockEnd, onSessionEnd, stats]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          setGameState('running');
          startBlock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startBlock]);

  // Go to setup
  const goToSetup = useCallback(() => {
    clearAllTimers();
    setGameState('setup');
    setCurrentBlock(1);
    setBlockTimeLeft(config.blocks.workSec);
    setCurrentSignal('neutral');
    setIsResting(false);
    setRestTimeLeft(0);
    setStats({ total: 0, go: 0, stop: 0 });
    setLastResult(null);
  }, [clearAllTimers, config.blocks.workSec]);

  // Reset game
  const resetGame = useCallback(() => {
    clearAllTimers();
    setGameState('idle');
    setCountdown(3);
    setCurrentBlock(1);
    setBlockTimeLeft(config.blocks.workSec);
    setCurrentSignal('neutral');
    setIsResting(false);
    setRestTimeLeft(0);
    setStats({ total: 0, go: 0, stop: 0 });
    setLastResult(null);
  }, [clearAllTimers, config.blocks.workSec]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  // Update config when level changes
  useEffect(() => {
    if (gameState === 'idle' || gameState === 'setup') {
      setBlockTimeLeft(REACTION_PRESETS[level].blocks.workSec);
    }
  }, [level, gameState]);

  return {
    // State
    gameState,
    countdown,
    currentBlock,
    totalBlocks: config.blocks.count,
    blockTimeLeft,
    currentSignal,
    isResting,
    restTimeLeft,
    stats,
    lastResult,
    config,
    
    // Actions
    startCountdown,
    goToSetup,
    resetGame,
  };
}
