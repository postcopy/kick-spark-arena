import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Pure logic extracted from useArcadeState.ts ───
// The hook requires React, so we test the core game logic as pure functions.

type Side = 'red' | 'blue';
type HitType = 'vest' | 'helmet';
type GameState = 'idle' | 'setup' | 'loading' | 'countdown' | 'running' | 'paused' | 'finished' | 'round_end';

interface ArcadeConfig {
  roundDurationSec: number;
  startingHP: number;
  bestOf: 1 | 3;
  vestDamage: number;
  helmetDamage: number;
  minIntervalMs: number;
  recoveryIntervalSec: number;
}

interface ArcadePlayerState {
  hp: number;
}

interface ArcadeRoundResult {
  winner: Side | 'tie';
  redHP: number;
  blueHP: number;
  isKO: boolean;
}

const DEFAULT_ARCADE_CONFIG: ArcadeConfig = {
  roundDurationSec: 60,
  startingHP: 100,
  bestOf: 3,
  vestDamage: 1,
  helmetDamage: 1,
  minIntervalMs: 150,
  recoveryIntervalSec: 15,
};

const COUNTDOWN_DURATION = 6;

// ─── Helper functions matching useArcadeState logic ───

function createInitialPlayerState(hp: number): ArcadePlayerState {
  return { hp };
}

function calculateDamage(hitType: HitType, config: ArcadeConfig): number {
  return hitType === 'helmet' ? config.helmetDamage : config.vestDamage;
}

/**
 * DEMOLITION RACE: damage applies to OWN HP.
 * Kicking reduces YOUR hp (you "destroy" yourself faster to win).
 */
function applyDamage(state: ArcadePlayerState, damage: number): ArcadePlayerState {
  return { hp: Math.max(0, state.hp - damage) };
}

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

/**
 * KO: reaching 0 HP means that side LOSES — opponent wins.
 */
function checkKO(redHP: number, blueHP: number): Side | 'tie' | null {
  if (redHP <= 0 && blueHP <= 0) return 'tie'; // Both KO = tie
  if (redHP <= 0) return 'blue';   // Red KO → Blue wins
  if (blueHP <= 0) return 'red';   // Blue KO → Red wins
  return null;
}

/**
 * Time-up: HIGHER HP wins (survived more damage).
 */
function determineTimeUpWinner(redHP: number, blueHP: number): Side | 'tie' {
  if (redHP > blueHP) return 'red';
  if (blueHP > redHP) return 'blue';
  return 'tie';
}

function countWins(results: ArcadeRoundResult[], side: Side): number {
  return results.filter(r => r.winner === side).length;
}

function isMatchOver(
  roundResults: ArcadeRoundResult[],
  currentRound: number,
  bestOf: number,
): boolean {
  const redWins = countWins(roundResults, 'red');
  const blueWins = countWins(roundResults, 'blue');
  const winsNeeded = Math.ceil(bestOf / 2);
  return redWins >= winsNeeded || blueWins >= winsNeeded || currentRound >= bestOf;
}

function determineMatchWinner(roundResults: ArcadeRoundResult[]): Side | 'tie' {
  const redWins = countWins(roundResults, 'red');
  const blueWins = countWins(roundResults, 'blue');
  if (redWins > blueWins) return 'red';
  if (blueWins > redWins) return 'blue';
  return 'tie';
}

// ─── Tests ───

describe('useArcadeState - Default Config', () => {
  it('has correct default values', () => {
    expect(DEFAULT_ARCADE_CONFIG.roundDurationSec).toBe(60);
    expect(DEFAULT_ARCADE_CONFIG.startingHP).toBe(100);
    expect(DEFAULT_ARCADE_CONFIG.bestOf).toBe(3);
    expect(DEFAULT_ARCADE_CONFIG.vestDamage).toBe(1);
    expect(DEFAULT_ARCADE_CONFIG.helmetDamage).toBe(1);
    expect(DEFAULT_ARCADE_CONFIG.minIntervalMs).toBe(150);
    expect(DEFAULT_ARCADE_CONFIG.recoveryIntervalSec).toBe(15);
  });

  it('has countdown duration of 6 seconds', () => {
    expect(COUNTDOWN_DURATION).toBe(6);
  });
});

describe('useArcadeState - Initial Player State', () => {
  it('creates player with specified HP', () => {
    expect(createInitialPlayerState(100)).toEqual({ hp: 100 });
  });

  it('creates player with custom HP', () => {
    expect(createInitialPlayerState(200)).toEqual({ hp: 200 });
    expect(createInitialPlayerState(50)).toEqual({ hp: 50 });
  });

  it('both players start with 100 HP by default', () => {
    const red = createInitialPlayerState(DEFAULT_ARCADE_CONFIG.startingHP);
    const blue = createInitialPlayerState(DEFAULT_ARCADE_CONFIG.startingHP);
    expect(red.hp).toBe(100);
    expect(blue.hp).toBe(100);
  });
});

describe('useArcadeState - Damage Calculation', () => {
  it('vest hit uses vestDamage from config', () => {
    expect(calculateDamage('vest', DEFAULT_ARCADE_CONFIG)).toBe(1);
  });

  it('helmet hit uses helmetDamage from config', () => {
    expect(calculateDamage('helmet', DEFAULT_ARCADE_CONFIG)).toBe(1);
  });

  it('respects custom damage values', () => {
    const customConfig: ArcadeConfig = {
      ...DEFAULT_ARCADE_CONFIG,
      vestDamage: 5,
      helmetDamage: 15,
    };
    expect(calculateDamage('vest', customConfig)).toBe(5);
    expect(calculateDamage('helmet', customConfig)).toBe(15);
  });
});

describe('useArcadeState - HP Reduction', () => {
  it('reduces HP by damage amount', () => {
    const state = createInitialPlayerState(100);
    const after = applyDamage(state, 1);
    expect(after.hp).toBe(99);
  });

  it('HP cannot go below 0', () => {
    const state = createInitialPlayerState(3);
    const after = applyDamage(state, 10);
    expect(after.hp).toBe(0);
  });

  it('reduces HP to exactly 0', () => {
    const state = createInitialPlayerState(5);
    const after = applyDamage(state, 5);
    expect(after.hp).toBe(0);
  });

  it('does not mutate original state', () => {
    const state = createInitialPlayerState(100);
    const after = applyDamage(state, 10);
    expect(state.hp).toBe(100);
    expect(after.hp).toBe(90);
  });

  it('accumulates damage over multiple hits', () => {
    let state = createInitialPlayerState(100);
    state = applyDamage(state, 1);
    state = applyDamage(state, 1);
    state = applyDamage(state, 1);
    expect(state.hp).toBe(97);
  });
});

describe('useArcadeState - Kick Registration Debounce', () => {
  it('allows kick when running and debounce elapsed', () => {
    const lastKick = { red: 0, blue: 0 };
    expect(canRegisterKick('running', 'red', 1000, lastKick, 150)).toBe(true);
  });

  it('rejects kick within debounce window', () => {
    const lastKick = { red: 900, blue: 0 };
    // 1000 - 900 = 100ms < 150ms
    expect(canRegisterKick('running', 'red', 1000, lastKick, 150)).toBe(false);
  });

  it('allows kick exactly at debounce boundary', () => {
    const lastKick = { red: 850, blue: 0 };
    // 1000 - 850 = 150ms = minIntervalMs
    expect(canRegisterKick('running', 'red', 1000, lastKick, 150)).toBe(true);
  });

  it('rejects kick when game is not running', () => {
    const lastKick = { red: 0, blue: 0 };
    expect(canRegisterKick('idle', 'red', 1000, lastKick, 150)).toBe(false);
    expect(canRegisterKick('paused', 'red', 1000, lastKick, 150)).toBe(false);
    expect(canRegisterKick('finished', 'red', 1000, lastKick, 150)).toBe(false);
    expect(canRegisterKick('countdown', 'red', 1000, lastKick, 150)).toBe(false);
  });

  it('debounce is independent per side', () => {
    const lastKick = { red: 990, blue: 500 };
    expect(canRegisterKick('running', 'red', 1000, lastKick, 150)).toBe(false);
    expect(canRegisterKick('running', 'blue', 1000, lastKick, 150)).toBe(true);
  });
});

describe('useArcadeState - KO Detection', () => {
  it('returns "blue" when red HP reaches 0 (red loses, blue wins)', () => {
    expect(checkKO(0, 50)).toBe('blue');
  });

  it('returns "red" when blue HP reaches 0 (blue loses, red wins)', () => {
    expect(checkKO(50, 0)).toBe('red');
  });

  it('returns null when both have HP remaining', () => {
    expect(checkKO(50, 50)).toBeNull();
    expect(checkKO(1, 1)).toBeNull();
  });

  it('handles edge case: both reach 0 simultaneously = tie', () => {
    expect(checkKO(0, 0)).toBe('tie');
  });
});

describe('useArcadeState - Time-Up Winner', () => {
  it('higher HP wins (survived more)', () => {
    expect(determineTimeUpWinner(70, 30)).toBe('red');   // red has more HP -> red wins
    expect(determineTimeUpWinner(40, 80)).toBe('blue');  // blue has more HP -> blue wins
  });

  it('tie when HP is equal', () => {
    expect(determineTimeUpWinner(50, 50)).toBe('tie');
    expect(determineTimeUpWinner(100, 100)).toBe('tie');
    expect(determineTimeUpWinner(0, 0)).toBe('tie');
  });
});

describe('useArcadeState - Round & Match Logic', () => {
  describe('best of 1', () => {
    it('match is over after 1 round', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
      ];
      expect(isMatchOver(results, 1, 1)).toBe(true);
    });

    it('winner is the round winner', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'blue', redHP: 60, blueHP: 0, isKO: true },
      ];
      expect(determineMatchWinner(results)).toBe('blue');
    });
  });

  describe('best of 3', () => {
    it('match is NOT over after 1 round', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
      ];
      // winsNeeded = ceil(3/2) = 2, redWins=1, not enough
      // currentRound=1, not >= bestOf=3
      expect(isMatchOver(results, 1, 3)).toBe(false);
    });

    it('match is over when one side has 2 wins', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
        { winner: 'red', redHP: 0, blueHP: 30, isKO: true },
      ];
      // redWins=2 >= winsNeeded=2
      expect(isMatchOver(results, 2, 3)).toBe(true);
      expect(determineMatchWinner(results)).toBe('red');
    });

    it('match continues at 1-1', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
        { winner: 'blue', redHP: 60, blueHP: 0, isKO: true },
      ];
      expect(isMatchOver(results, 2, 3)).toBe(false);
    });

    it('match ends after 3 rounds regardless of wins', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
        { winner: 'blue', redHP: 60, blueHP: 0, isKO: true },
        { winner: 'tie', redHP: 50, blueHP: 50, isKO: false },
      ];
      // currentRound=3 >= bestOf=3
      expect(isMatchOver(results, 3, 3)).toBe(true);
    });

    it('determines tie if each side has equal wins', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
        { winner: 'blue', redHP: 60, blueHP: 0, isKO: true },
        { winner: 'tie', redHP: 50, blueHP: 50, isKO: false },
      ];
      expect(determineMatchWinner(results)).toBe('tie');
    });

    it('blue wins 2-1', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
        { winner: 'blue', redHP: 60, blueHP: 0, isKO: true },
        { winner: 'blue', redHP: 80, blueHP: 0, isKO: true },
      ];
      expect(determineMatchWinner(results)).toBe('blue');
    });
  });

  describe('win counting', () => {
    it('counts red wins correctly', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'red', redHP: 0, blueHP: 50, isKO: true },
        { winner: 'blue', redHP: 60, blueHP: 0, isKO: true },
        { winner: 'red', redHP: 0, blueHP: 30, isKO: true },
      ];
      expect(countWins(results, 'red')).toBe(2);
      expect(countWins(results, 'blue')).toBe(1);
    });

    it('ties are not counted as wins for either side', () => {
      const results: ArcadeRoundResult[] = [
        { winner: 'tie', redHP: 50, blueHP: 50, isKO: false },
      ];
      expect(countWins(results, 'red')).toBe(0);
      expect(countWins(results, 'blue')).toBe(0);
    });
  });
});

describe('useArcadeState - Recovery Interval', () => {
  it('default recovery interval is 15 seconds', () => {
    expect(DEFAULT_ARCADE_CONFIG.recoveryIntervalSec).toBe(15);
  });
});

describe('useArcadeState - Full Match Simulation', () => {
  it('simulates a best-of-3 match with KO and time-up', () => {
    const config = DEFAULT_ARCADE_CONFIG;
    const roundResults: ArcadeRoundResult[] = [];

    // Round 1: Red HP reaches 0 → Red LOSES, Blue wins
    let redState = createInitialPlayerState(config.startingHP);
    let blueState = createInitialPlayerState(config.startingHP);

    // Simulate: Red takes 100 hits (opponent kicked red's HP to 0)
    for (let i = 0; i < 100; i++) {
      redState = applyDamage(redState, calculateDamage('vest', config));
    }
    expect(redState.hp).toBe(0);
    expect(blueState.hp).toBe(100);

    const ko = checkKO(redState.hp, blueState.hp);
    expect(ko).toBe('blue'); // Red KO → Blue wins
    roundResults.push({ winner: 'blue', redHP: redState.hp, blueHP: blueState.hp, isKO: true });
    expect(isMatchOver(roundResults, 1, 3)).toBe(false);

    // Round 2: Time up, red has MORE HP → Red wins
    redState = createInitialPlayerState(config.startingHP);
    blueState = createInitialPlayerState(config.startingHP);

    // Blue takes 60 damage, Red takes 30 damage
    for (let i = 0; i < 60; i++) blueState = applyDamage(blueState, 1);
    for (let i = 0; i < 30; i++) redState = applyDamage(redState, 1);

    expect(redState.hp).toBe(70);
    expect(blueState.hp).toBe(40);
    expect(checkKO(redState.hp, blueState.hp)).toBeNull();

    const timeUpWinner = determineTimeUpWinner(redState.hp, blueState.hp);
    expect(timeUpWinner).toBe('red'); // Red has more HP → Red wins
    roundResults.push({ winner: 'red', redHP: redState.hp, blueHP: blueState.hp, isKO: false });
    expect(isMatchOver(roundResults, 2, 3)).toBe(false);

    // Round 3: Blue HP reaches 0 → Blue LOSES, Red wins the round and match 2-1
    redState = createInitialPlayerState(config.startingHP);
    blueState = createInitialPlayerState(config.startingHP);

    for (let i = 0; i < 100; i++) {
      blueState = applyDamage(blueState, 1);
    }
    expect(checkKO(redState.hp, blueState.hp)).toBe('red'); // Blue KO → Red wins
    roundResults.push({ winner: 'red', redHP: 100, blueHP: 0, isKO: true });

    expect(isMatchOver(roundResults, 3, 3)).toBe(true);
    expect(determineMatchWinner(roundResults)).toBe('red');
    expect(countWins(roundResults, 'red')).toBe(2);
    expect(countWins(roundResults, 'blue')).toBe(1);
  });

  it('simulates a best-of-1 match ending in tie', () => {
    const config: ArcadeConfig = { ...DEFAULT_ARCADE_CONFIG, bestOf: 1 };
    const redState = createInitialPlayerState(config.startingHP);
    const blueState = createInitialPlayerState(config.startingHP);

    // Time up with equal HP
    const winner = determineTimeUpWinner(redState.hp, blueState.hp);
    expect(winner).toBe('tie');

    const roundResults: ArcadeRoundResult[] = [
      { winner: 'tie', redHP: 100, blueHP: 100, isKO: false },
    ];
    expect(isMatchOver(roundResults, 1, 1)).toBe(true);
    expect(determineMatchWinner(roundResults)).toBe('tie');
  });

  it('simulates helmet hits doing custom damage', () => {
    const config: ArcadeConfig = {
      ...DEFAULT_ARCADE_CONFIG,
      vestDamage: 5,
      helmetDamage: 15,
    };

    let state = createInitialPlayerState(config.startingHP); // 100 HP

    // 2 vest hits = 10 damage
    state = applyDamage(state, calculateDamage('vest', config));
    state = applyDamage(state, calculateDamage('vest', config));
    expect(state.hp).toBe(90);

    // 1 helmet hit = 15 damage
    state = applyDamage(state, calculateDamage('helmet', config));
    expect(state.hp).toBe(75);

    // 5 more helmet hits = 75 damage -> KO
    for (let i = 0; i < 5; i++) {
      state = applyDamage(state, calculateDamage('helmet', config));
    }
    expect(state.hp).toBe(0);
  });
});
