import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  ReactionConfig, 
  ReactionCue, 
  CueDisplay, 
  ReactionSessionResult,
  ReactionSoundCallbacks,
  BlockConfig,
} from '@/types/reaction';
import { BEGINNER_PRESET } from '@/types/reaction';

type ReactionGameState = 'idle' | 'setup' | 'countdown' | 'running' | 'block_rest' | 'finished';

interface UseReactionStateProps {
  config: ReactionConfig;
  soundCallbacks?: ReactionSoundCallbacks;
}

// Shuffle-Bag: evita padrões previsíveis
function createShuffleBag<T>(items: T[]): T[] {
  const bag = [...items];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function getNextFromBag<T>(
  bag: T[], 
  lastItem: T | null, 
  originalItems: T[]
): { item: T; newBag: T[] } {
  let newBag = [...bag];
  
  if (newBag.length === 0) {
    newBag = createShuffleBag(originalItems);
  }
  
  let item = newBag.pop()!;
  
  // Evita repetir o último
  if (item === lastItem && newBag.length > 0) {
    const swap = newBag.pop()!;
    newBag.push(item);
    item = swap;
  }
  
  return { item, newBag };
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPosition(): number {
  return Math.floor(Math.random() * 8);
}

export function useReactionState({ config, soundCallbacks }: UseReactionStateProps) {
  const [gameState, setGameState] = useState<ReactionGameState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [currentCue, setCurrentCue] = useState<CueDisplay | null>(null);
  const [cueVisible, setCueVisible] = useState(false);
  
  // Progress tracking
  const [cuesShown, setCuesShown] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [blockRestCountdown, setBlockRestCountdown] = useState(0);
  
  // Rule tracking
  const [currentRule, setCurrentRule] = useState<'normal' | 'inverted'>('normal');
  
  // Statistics
  const [cueDistribution, setCueDistribution] = useState<Record<string, number>>({});
  const [noGoCount, setNoGoCount] = useState(0);
  const [totalGapMs, setTotalGapMs] = useState(0);
  const [gapCount, setGapCount] = useState(0);
  
  // Result
  const [lastResult, setLastResult] = useState<ReactionSessionResult | null>(null);
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  
  // Refs for timers and bags
  const countdownTimerRef = useRef<number | null>(null);
  const cueTimerRef = useRef<number | null>(null);
  const gapTimerRef = useRef<number | null>(null);
  const sessionTimerRef = useRef<number | null>(null);
  const blockTimerRef = useRef<number | null>(null);
  const blockRestTimerRef = useRef<number | null>(null);
  
  const cueBagRef = useRef<ReactionCue[]>([]);
  const sideBagRef = useRef<ReactionCue[]>([]);
  const heightBagRef = useRef<ReactionCue[]>([]);
  const lastCueRef = useRef<ReactionCue | null>(null);
  const lastSideRef = useRef<ReactionCue | null>(null);
  const lastHeightRef = useRef<ReactionCue | null>(null);
  
  const sessionStartTimeRef = useRef<number>(0);
  const blockStartTimeRef = useRef<number>(0);
  const cuesInBlockRef = useRef<number>(0);
  const isRunningRef = useRef(false);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    if (cueTimerRef.current) window.clearTimeout(cueTimerRef.current);
    if (gapTimerRef.current) window.clearTimeout(gapTimerRef.current);
    if (sessionTimerRef.current) window.clearInterval(sessionTimerRef.current);
    if (blockTimerRef.current) window.clearInterval(blockTimerRef.current);
    if (blockRestTimerRef.current) window.clearInterval(blockRestTimerRef.current);
    countdownTimerRef.current = null;
    cueTimerRef.current = null;
    gapTimerRef.current = null;
    sessionTimerRef.current = null;
    blockTimerRef.current = null;
    blockRestTimerRef.current = null;
  }, []);

  // Show cue
  const showCue = useCallback((cue: CueDisplay) => {
    setCurrentCue(cue);
    setCueVisible(true);
    soundCallbacks?.onCueShow?.(cue);
    
    // Update distribution
    setCueDistribution(prev => ({
      ...prev,
      [cue.cue]: (prev[cue.cue] || 0) + 1,
    }));
    
    if (cue.isNoGo) {
      setNoGoCount(prev => prev + 1);
    }
    
    setCuesShown(prev => prev + 1);
  }, [soundCallbacks]);

  // Hide cue
  const hideCue = useCallback(() => {
    setCueVisible(false);
    soundCallbacks?.onCueHide?.();
  }, [soundCallbacks]);

  // Determine next cue based on drill type and config
  const getNextCue = useCallback((): CueDisplay => {
    const isOctagon = config.drillType === 'octagon';
    const position = isOctagon ? randomPosition() : undefined;
    
    // Go/No-Go drill: use cueSet directly
    if (config.drillType === 'goNoGo') {
      const { item, newBag } = getNextFromBag(cueBagRef.current, lastCueRef.current, config.cueSet);
      cueBagRef.current = newBag;
      lastCueRef.current = item;
      return {
        cue: item,
        isNoGo: item === 'NO_GO',
        position,
      };
    }
    
    // Other drills: noGoRate can inject NO_GO
    if (config.noGoRate > 0 && Math.random() * 100 < config.noGoRate) {
      return {
        cue: 'NO_GO',
        isNoGo: true,
        position,
      };
    }
    
    const { item, newBag } = getNextFromBag(cueBagRef.current, lastCueRef.current, config.cueSet);
    cueBagRef.current = newBag;
    lastCueRef.current = item;
    
    return {
      cue: item,
      isNoGo: false,
      position,
    };
  }, [config]);

  // Check if block should end
  const shouldEndBlock = useCallback((block: BlockConfig): boolean => {
    if (block.mode === 'rounds') {
      return cuesInBlockRef.current >= (block.rounds ?? 0);
    } else {
      const blockTimeElapsed = Date.now() - blockStartTimeRef.current;
      return blockTimeElapsed >= (block.durationSec ?? 0) * 1000;
    }
  }, []);

  // Check if session should end
  const shouldEndSession = useCallback((): boolean => {
    if (config.blockPlan && config.blockPlan.length > 0) {
      return currentBlock >= config.blockPlan.length;
    }
    
    if (config.sessionMode === 'rounds') {
      return cuesShown >= (config.totalRounds ?? 40);
    } else {
      const elapsed = Date.now() - sessionStartTimeRef.current;
      return elapsed >= (config.totalTimeSec ?? 60) * 1000;
    }
  }, [config, currentBlock, cuesShown]);

  // End session and generate result
  const endSession = useCallback(() => {
    clearAllTimers();
    isRunningRef.current = false;
    
    const totalDurationSec = (Date.now() - sessionStartTimeRef.current) / 1000;
    const averageGapMs = gapCount > 0 ? totalGapMs / gapCount : 0;
    
    const result: ReactionSessionResult = {
      mode: 'reaction',
      config,
      totalCues: cuesShown,
      cueDistribution,
      noGoCount,
      blocksCompleted: config.blockPlan ? currentBlock : 1,
      totalDurationSec,
      averageGapMs,
      rpe: undefined,
      timestamp: Date.now(),
    };
    
    setLastResult(result);
    setGameState('finished');
    soundCallbacks?.onSessionEnd?.(result);
  }, [clearAllTimers, config, cuesShown, cueDistribution, noGoCount, currentBlock, totalGapMs, gapCount, soundCallbacks]);

  // Start block rest
  const startBlockRest = useCallback((restSec: number, nextBlock: number) => {
    if (restSec <= 0) {
      // No rest, go to next block immediately
      setCurrentBlock(nextBlock);
      cuesInBlockRef.current = 0;
      blockStartTimeRef.current = Date.now();
      return false;
    }
    
    setGameState('block_rest');
    setBlockRestCountdown(restSec);
    soundCallbacks?.onBlockRest?.(nextBlock);
    
    blockRestTimerRef.current = window.setInterval(() => {
      setBlockRestCountdown(prev => {
        if (prev <= 1) {
          window.clearInterval(blockRestTimerRef.current!);
          blockRestTimerRef.current = null;
          setCurrentBlock(nextBlock);
          cuesInBlockRef.current = 0;
          blockStartTimeRef.current = Date.now();
          setGameState('running');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return true;
  }, [soundCallbacks]);

  // Run one cue cycle
  const runCueCycle = useCallback(() => {
    if (!isRunningRef.current) return;
    
    // Check if session should end
    if (shouldEndSession()) {
      endSession();
      return;
    }
    
    // Check block progress
    if (config.blockPlan && config.blockPlan.length > 0) {
      const block = config.blockPlan[currentBlock];
      if (block && shouldEndBlock(block)) {
        const nextBlock = currentBlock + 1;
        if (nextBlock >= config.blockPlan.length) {
          endSession();
          return;
        }
        if (startBlockRest(block.restSec, nextBlock)) {
          return; // In rest mode
        }
      }
    }
    
    // Handle rule switching
    if (config.ruleMode === 'alternating' && config.ruleSwitchEveryN) {
      if (cuesShown > 0 && cuesShown % config.ruleSwitchEveryN === 0) {
        setCurrentRule(prev => prev === 'normal' ? 'inverted' : 'normal');
      }
    }
    
    // twoStep drill: show two cues sequentially
    if (config.drillType === 'twoStep') {
      // Step 1: Side
      const sideCues: ReactionCue[] = ['L', 'R'];
      const { item: side, newBag: newSideBag } = getNextFromBag(sideBagRef.current, lastSideRef.current, sideCues);
      sideBagRef.current = newSideBag;
      lastSideRef.current = side;
      
      showCue({ cue: side, isNoGo: false, step: 1 });
      cuesInBlockRef.current++;
      
      cueTimerRef.current = window.setTimeout(() => {
        hideCue();
        
        // Brief pause between steps
        gapTimerRef.current = window.setTimeout(() => {
          if (!isRunningRef.current) return;
          
          // Step 2: Height
          const heightCues: ReactionCue[] = ['HEAD', 'BODY'];
          const { item: height, newBag: newHeightBag } = getNextFromBag(heightBagRef.current, lastHeightRef.current, heightCues);
          heightBagRef.current = newHeightBag;
          lastHeightRef.current = height;
          
          showCue({ cue: height, isNoGo: false, step: 2 });
          cuesInBlockRef.current++;
          
          cueTimerRef.current = window.setTimeout(() => {
            hideCue();
            
            // Random gap before next pair
            const gap = randomInRange(config.gapMinMs, config.gapMaxMs);
            setTotalGapMs(prev => prev + gap);
            setGapCount(prev => prev + 1);
            
            gapTimerRef.current = window.setTimeout(() => {
              runCueCycle();
            }, gap);
          }, config.cueDurationMs);
        }, 150); // Brief pause between steps
      }, config.cueDurationMs);
      
      return;
    }
    
    // Regular cue cycle
    const cue = getNextCue();
    showCue(cue);
    cuesInBlockRef.current++;
    
    cueTimerRef.current = window.setTimeout(() => {
      hideCue();
      
      // Random gap before next cue
      const gap = randomInRange(config.gapMinMs, config.gapMaxMs);
      setTotalGapMs(prev => prev + gap);
      setGapCount(prev => prev + 1);
      
      gapTimerRef.current = window.setTimeout(() => {
        runCueCycle();
      }, gap);
    }, config.cueDurationMs);
  }, [config, currentBlock, cuesShown, shouldEndSession, shouldEndBlock, endSession, startBlockRest, getNextCue, showCue, hideCue]);

  // Start running the session
  const startRunning = useCallback(() => {
    setGameState('running');
    isRunningRef.current = true;
    sessionStartTimeRef.current = Date.now();
    blockStartTimeRef.current = Date.now();
    cuesInBlockRef.current = 0;
    
    // Initialize bags
    cueBagRef.current = createShuffleBag(config.cueSet);
    sideBagRef.current = createShuffleBag(['L', 'R'] as ReactionCue[]);
    heightBagRef.current = createShuffleBag(['HEAD', 'BODY'] as ReactionCue[]);
    
    soundCallbacks?.onSessionStart?.();
    
    // Start elapsed time tracker
    sessionTimerRef.current = window.setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
    }, 1000);
    
    // Start first cue after initial gap
    const initialGap = randomInRange(config.gapMinMs, config.gapMaxMs);
    gapTimerRef.current = window.setTimeout(() => {
      runCueCycle();
    }, initialGap);
  }, [config, soundCallbacks, runCueCycle]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        soundCallbacks?.onCountdown?.(prev - 1);
        if (prev <= 1) {
          window.clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          startRunning();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [soundCallbacks, startRunning]);

  // Go to setup
  const goToSetup = useCallback(() => {
    clearAllTimers();
    setGameState('setup');
    setCuesShown(0);
    setTimeElapsed(0);
    setCurrentBlock(0);
    setCurrentRule('normal');
    setCueDistribution({});
    setNoGoCount(0);
    setTotalGapMs(0);
    setGapCount(0);
    setCurrentCue(null);
    setCueVisible(false);
    setRpe(undefined);
    isRunningRef.current = false;
  }, [clearAllTimers]);

  // Reset game
  const resetGame = useCallback(() => {
    clearAllTimers();
    setGameState('idle');
    setCuesShown(0);
    setTimeElapsed(0);
    setCurrentBlock(0);
    setCurrentRule('normal');
    setCueDistribution({});
    setNoGoCount(0);
    setTotalGapMs(0);
    setGapCount(0);
    setCurrentCue(null);
    setCueVisible(false);
    setLastResult(null);
    setRpe(undefined);
    isRunningRef.current = false;
  }, [clearAllTimers]);

  // Set RPE and update result
  const setRPE = useCallback((value: number) => {
    setRpe(value);
    if (lastResult) {
      setLastResult({ ...lastResult, rpe: value });
    }
  }, [lastResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      isRunningRef.current = false;
    };
  }, [clearAllTimers]);

  // Calculate total blocks
  const totalBlocks = config.blockPlan?.length ?? 1;

  // Calculate progress percentage
  const progressPercent = config.sessionMode === 'rounds' 
    ? (cuesShown / (config.totalRounds ?? 40)) * 100
    : (timeElapsed / (config.totalTimeSec ?? 60)) * 100;

  return {
    // State
    gameState,
    countdown,
    currentCue,
    cueVisible,
    
    // Progress
    cuesShown,
    timeElapsed,
    currentBlock,
    totalBlocks,
    blockRestCountdown,
    progressPercent,
    
    // Rule
    currentRule,
    
    // Statistics
    cueDistribution,
    noGoCount,
    
    // Result
    lastResult,
    
    // Config
    config,
    
    // Actions
    goToSetup,
    startCountdown,
    resetGame,
    setRPE,
  };
}

export type UseReactionStateReturn = ReturnType<typeof useReactionState>;
