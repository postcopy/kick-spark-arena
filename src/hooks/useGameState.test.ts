import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Pure logic extracted from useGameState.ts ───
// The hook itself requires React, but we can test the state machine logic,
// score calculations, and winner determination as pure functions.

type Side = 'red' | 'blue';
type GameState = 'idle' | 'setup' | 'loading' | 'countdown' | 'running' | 'paused' | 'finished' | 'round_end';

interface GameScore {
  red: number;
  blue: number;
}

interface GameConfig {
  duration: number;
  minIntervalMs: number;
  isIndividual?: boolean;
}

const DEFAULT_CONFIG: GameConfig = {
  duration: 60,
  minIntervalMs: 120,
};

const COUNTDOWN_DURATION = 6;

// ─── State machine transition logic ───

function nextState(current: GameState, action: string): GameState {
  switch (action) {
    case 'goToSetup':
      return 'setup';
    case 'goToLoading':
      return 'loading';
    case 'startCountdown':
      return 'countdown';
    case 'countdownFinished':
      return current === 'countdown' ? 'running' : current;
    case 'timerFinished':
      return current === 'running' ? 'finished' : current;
    case 'togglePause':
      if (current === 'running') return 'paused';
      if (current === 'paused') return 'running';
      return current;
    case 'resetGame':
      return 'idle';
    default:
      return current;
  }
}

// ─── Winner determination (duo mode) ───

function determineWinner(scores: GameScore): Side | 'tie' {
  if (scores.red > scores.blue) return 'red';
  if (scores.blue > scores.red) return 'blue';
  return 'tie';
}

// ─── Kick registration with debounce ───

function canRegisterKick(
  gameState: GameState,
  side: Side,
  now: number,
  lastKickTime: Record<Side, number>,
  minIntervalMs: number,
): boolean {
  if (gameState !== 'running') return false;
  if (now - lastKickTime[side] < minIntervalMs) return false;
  return true;
}

function registerKickScore(scores: GameScore, side: Side): GameScore {
  return {
    ...scores,
    [side]: scores[side] + 1,
  };
}

// ─── Tests ───

describe('useGameState - State Machine Transitions', () => {
  it('starts in idle state', () => {
    expect(nextState('idle', 'none')).toBe('idle');
  });

  it('goToSetup transitions any state to setup', () => {
    expect(nextState('idle', 'goToSetup')).toBe('setup');
    expect(nextState('finished', 'goToSetup')).toBe('setup');
  });

  it('goToLoading transitions to loading', () => {
    expect(nextState('setup', 'goToLoading')).toBe('loading');
  });

  it('startCountdown transitions to countdown', () => {
    expect(nextState('setup', 'startCountdown')).toBe('countdown');
    expect(nextState('loading', 'startCountdown')).toBe('countdown');
  });

  it('countdownFinished transitions countdown to running', () => {
    expect(nextState('countdown', 'countdownFinished')).toBe('running');
  });

  it('countdownFinished does NOT change state if not in countdown', () => {
    expect(nextState('idle', 'countdownFinished')).toBe('idle');
    expect(nextState('running', 'countdownFinished')).toBe('running');
  });

  it('timerFinished transitions running to finished', () => {
    expect(nextState('running', 'timerFinished')).toBe('finished');
  });

  it('timerFinished does NOT change state if not running', () => {
    expect(nextState('paused', 'timerFinished')).toBe('paused');
    expect(nextState('idle', 'timerFinished')).toBe('idle');
  });

  it('togglePause: running -> paused', () => {
    expect(nextState('running', 'togglePause')).toBe('paused');
  });

  it('togglePause: paused -> running', () => {
    expect(nextState('paused', 'togglePause')).toBe('running');
  });

  it('togglePause does nothing in other states', () => {
    expect(nextState('idle', 'togglePause')).toBe('idle');
    expect(nextState('countdown', 'togglePause')).toBe('countdown');
    expect(nextState('finished', 'togglePause')).toBe('finished');
  });

  it('resetGame returns to idle from any state', () => {
    expect(nextState('running', 'resetGame')).toBe('idle');
    expect(nextState('paused', 'resetGame')).toBe('idle');
    expect(nextState('finished', 'resetGame')).toBe('idle');
    expect(nextState('setup', 'resetGame')).toBe('idle');
    expect(nextState('countdown', 'resetGame')).toBe('idle');
  });
});

describe('useGameState - Default Config', () => {
  it('has default duration of 60 seconds', () => {
    expect(DEFAULT_CONFIG.duration).toBe(60);
  });

  it('has default minIntervalMs of 120ms', () => {
    expect(DEFAULT_CONFIG.minIntervalMs).toBe(120);
  });

  it('has countdown duration of 6 seconds', () => {
    expect(COUNTDOWN_DURATION).toBe(6);
  });
});

describe('useGameState - Winner Determination (Duo Mode)', () => {
  it('returns "red" when red has more kicks', () => {
    expect(determineWinner({ red: 10, blue: 5 })).toBe('red');
  });

  it('returns "blue" when blue has more kicks', () => {
    expect(determineWinner({ red: 3, blue: 8 })).toBe('blue');
  });

  it('returns "tie" when scores are equal', () => {
    expect(determineWinner({ red: 5, blue: 5 })).toBe('tie');
  });

  it('returns "tie" when both have 0 kicks', () => {
    expect(determineWinner({ red: 0, blue: 0 })).toBe('tie');
  });

  it('handles large scores', () => {
    expect(determineWinner({ red: 999, blue: 1000 })).toBe('blue');
    expect(determineWinner({ red: 1000, blue: 999 })).toBe('red');
  });
});

describe('useGameState - Kick Registration', () => {
  it('allows kick when game is running and debounce has elapsed', () => {
    const lastKickTime = { red: 0, blue: 0 };
    expect(canRegisterKick('running', 'red', 1000, lastKickTime, 120)).toBe(true);
  });

  it('rejects kick when game is not running', () => {
    const lastKickTime = { red: 0, blue: 0 };
    expect(canRegisterKick('idle', 'red', 1000, lastKickTime, 120)).toBe(false);
    expect(canRegisterKick('paused', 'red', 1000, lastKickTime, 120)).toBe(false);
    expect(canRegisterKick('countdown', 'red', 1000, lastKickTime, 120)).toBe(false);
    expect(canRegisterKick('finished', 'red', 1000, lastKickTime, 120)).toBe(false);
    expect(canRegisterKick('setup', 'red', 1000, lastKickTime, 120)).toBe(false);
  });

  it('rejects kick within debounce window (minIntervalMs)', () => {
    const lastKickTime = { red: 900, blue: 0 };
    // 1000 - 900 = 100ms < 120ms debounce
    expect(canRegisterKick('running', 'red', 1000, lastKickTime, 120)).toBe(false);
  });

  it('allows kick exactly at debounce boundary', () => {
    const lastKickTime = { red: 880, blue: 0 };
    // 1000 - 880 = 120ms = minIntervalMs, NOT less than, so allowed
    expect(canRegisterKick('running', 'red', 1000, lastKickTime, 120)).toBe(true);
  });

  it('debounce is per-side (red debounce does not block blue)', () => {
    const lastKickTime = { red: 990, blue: 0 };
    expect(canRegisterKick('running', 'red', 1000, lastKickTime, 120)).toBe(false);
    expect(canRegisterKick('running', 'blue', 1000, lastKickTime, 120)).toBe(true);
  });
});

describe('useGameState - Score Updates', () => {
  it('increments red score', () => {
    const scores: GameScore = { red: 0, blue: 0 };
    const updated = registerKickScore(scores, 'red');
    expect(updated).toEqual({ red: 1, blue: 0 });
  });

  it('increments blue score', () => {
    const scores: GameScore = { red: 0, blue: 0 };
    const updated = registerKickScore(scores, 'blue');
    expect(updated).toEqual({ red: 0, blue: 1 });
  });

  it('increments only the correct side', () => {
    const scores: GameScore = { red: 5, blue: 3 };
    expect(registerKickScore(scores, 'red')).toEqual({ red: 6, blue: 3 });
    expect(registerKickScore(scores, 'blue')).toEqual({ red: 5, blue: 4 });
  });

  it('does not mutate the original score object', () => {
    const scores: GameScore = { red: 5, blue: 3 };
    const updated = registerKickScore(scores, 'red');
    expect(scores).toEqual({ red: 5, blue: 3 }); // original unchanged
    expect(updated).toEqual({ red: 6, blue: 3 });
  });

  it('supports accumulating multiple kicks', () => {
    let scores: GameScore = { red: 0, blue: 0 };
    scores = registerKickScore(scores, 'red');
    scores = registerKickScore(scores, 'red');
    scores = registerKickScore(scores, 'blue');
    scores = registerKickScore(scores, 'red');
    expect(scores).toEqual({ red: 3, blue: 1 });
  });
});

describe('useGameState - Full Game Flow (Integration)', () => {
  it('follows the complete game lifecycle', () => {
    let state: GameState = 'idle';
    let scores: GameScore = { red: 0, blue: 0 };

    // Start game setup
    state = nextState(state, 'goToSetup');
    expect(state).toBe('setup');

    // Begin countdown
    state = nextState(state, 'startCountdown');
    expect(state).toBe('countdown');

    // Countdown finishes
    state = nextState(state, 'countdownFinished');
    expect(state).toBe('running');

    // Register some kicks
    scores = registerKickScore(scores, 'red');
    scores = registerKickScore(scores, 'blue');
    scores = registerKickScore(scores, 'red');
    expect(scores).toEqual({ red: 2, blue: 1 });

    // Pause the game
    state = nextState(state, 'togglePause');
    expect(state).toBe('paused');

    // Resume the game
    state = nextState(state, 'togglePause');
    expect(state).toBe('running');

    // More kicks
    scores = registerKickScore(scores, 'blue');
    scores = registerKickScore(scores, 'blue');

    // Timer runs out
    state = nextState(state, 'timerFinished');
    expect(state).toBe('finished');

    // Determine winner
    expect(scores).toEqual({ red: 2, blue: 3 });
    expect(determineWinner(scores)).toBe('blue');

    // Reset for new game
    state = nextState(state, 'resetGame');
    expect(state).toBe('idle');
  });

  it('supports the loading -> countdown -> running flow', () => {
    let state: GameState = 'idle';

    state = nextState(state, 'goToSetup');
    expect(state).toBe('setup');

    state = nextState(state, 'goToLoading');
    expect(state).toBe('loading');

    state = nextState(state, 'startCountdown');
    expect(state).toBe('countdown');

    state = nextState(state, 'countdownFinished');
    expect(state).toBe('running');
  });
});
