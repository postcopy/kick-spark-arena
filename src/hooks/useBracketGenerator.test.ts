import { describe, it, expect } from 'vitest';
import {
  generateBracket,
  advanceWinnerInBracket,
  getNextReadyMatch,
  isCategoryFinished,
  getCategoryWinner,
} from './useBracketGenerator';
import type { Athlete, BracketMatch } from '@/types/tournament';

function makeAthletes(count: number): Athlete[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `athlete-${i + 1}`,
    name: `Athlete ${i + 1}`,
  }));
}

describe('generateBracket', () => {
  it('should return empty array for fewer than 2 athletes', () => {
    expect(generateBracket(makeAthletes(0), 'cat1', 1)).toEqual([]);
    expect(generateBracket(makeAthletes(1), 'cat1', 1)).toEqual([]);
  });

  it('should generate 1 match for 2 athletes', () => {
    const bracket = generateBracket(makeAthletes(2), 'cat1', 1);
    expect(bracket).toHaveLength(1);
    expect(bracket[0].round).toBe(1);
    expect(bracket[0].status).toBe('READY');
    expect(bracket[0].athleteRed).toBeDefined();
    expect(bracket[0].athleteBlue).toBeDefined();
    expect(bracket[0].nextMatchId).toBeUndefined();
  });

  it('should generate 3 matches for 3 athletes (with 1 BYE)', () => {
    const bracket = generateBracket(makeAthletes(3), 'cat1', 1);
    // nextPowerOf2(3) = 4, so 2 round-1 matches + 1 final = 3 matches
    expect(bracket).toHaveLength(3);

    const round1 = bracket.filter(m => m.round === 1);
    expect(round1).toHaveLength(2);

    const byes = bracket.filter(m => m.status === 'BYE');
    expect(byes).toHaveLength(1);

    // BYE winner should be advanced to the final
    const final = bracket.find(m => m.round === 2);
    expect(final).toBeDefined();
    // The BYE winner should appear in the final
    const byeMatch = byes[0];
    const byeWinner = byeMatch.winnerSide === 'RED' ? byeMatch.athleteRed : byeMatch.athleteBlue;
    const finalHasWinner =
      final!.athleteRed?.id === byeWinner?.id ||
      final!.athleteBlue?.id === byeWinner?.id;
    expect(finalHasWinner).toBe(true);
  });

  it('should generate 3 matches for 4 athletes (no BYEs)', () => {
    const bracket = generateBracket(makeAthletes(4), 'cat1', 1);
    // nextPowerOf2(4) = 4: 2 round-1 + 1 final = 3
    expect(bracket).toHaveLength(3);

    const byes = bracket.filter(m => m.status === 'BYE');
    expect(byes).toHaveLength(0);

    const ready = bracket.filter(m => m.status === 'READY');
    expect(ready).toHaveLength(2); // both round 1 matches are ready
  });

  it('should generate 7 matches for 5 athletes (with BYEs)', () => {
    const bracket = generateBracket(makeAthletes(5), 'cat1', 1);
    // nextPowerOf2(5) = 8: 4 round-1 + 2 round-2 + 1 final = 7
    expect(bracket).toHaveLength(7);

    const byes = bracket.filter(m => m.status === 'BYE');
    // 5 athletes fill 4 round-1 matches: 2 full (READY), 1 with 1 athlete (BYE), 1 empty (PENDING)
    expect(byes).toHaveLength(1);
  });

  it('should generate 7 matches for 8 athletes (no BYEs)', () => {
    const bracket = generateBracket(makeAthletes(8), 'cat1', 1);
    // nextPowerOf2(8) = 8: 4 + 2 + 1 = 7
    expect(bracket).toHaveLength(7);

    const byes = bracket.filter(m => m.status === 'BYE');
    expect(byes).toHaveLength(0);
  });

  it('should use startMatchNumber for sequential numbering', () => {
    const bracket = generateBracket(makeAthletes(4), 'cat1', 10);
    const numbers = bracket.map(m => m.matchNumber).sort((a, b) => a - b);
    expect(numbers).toEqual([10, 11, 12]);
  });

  it('should link round 1 matches to round 2 via nextMatchId', () => {
    const bracket = generateBracket(makeAthletes(4), 'cat1', 1);
    const round1 = bracket.filter(m => m.round === 1);
    const round2 = bracket.filter(m => m.round === 2);
    expect(round2).toHaveLength(1);
    for (const m of round1) {
      expect(m.nextMatchId).toBe(round2[0].id);
    }
  });
});

describe('advanceWinnerInBracket', () => {
  it('should mark match as FINISHED and advance winner', () => {
    const athletes = makeAthletes(4);
    // Use a deterministic bracket
    const bracket = generateBracket(athletes, 'cat1', 1);
    const readyMatch = bracket.find(m => m.status === 'READY' && m.round === 1)!;

    const updated = advanceWinnerInBracket(bracket, readyMatch.id, 'RED');
    const finishedMatch = updated.find(m => m.id === readyMatch.id)!;

    expect(finishedMatch.status).toBe('FINISHED');
    expect(finishedMatch.winnerSide).toBe('RED');
    expect(finishedMatch.winnerId).toBe(readyMatch.athleteRed!.id);

    // Winner should be in next match
    if (finishedMatch.nextMatchId) {
      const nextMatch = updated.find(m => m.id === finishedMatch.nextMatchId)!;
      const winnerInNext =
        nextMatch.athleteRed?.id === finishedMatch.winnerId ||
        nextMatch.athleteBlue?.id === finishedMatch.winnerId;
      expect(winnerInNext).toBe(true);
    }
  });

  it('should return unchanged bracket for unknown matchId', () => {
    const bracket = generateBracket(makeAthletes(2), 'cat1', 1);
    const updated = advanceWinnerInBracket(bracket, 'nonexistent', 'RED');
    expect(updated).toHaveLength(bracket.length);
  });

  it('should return a new array (immutability)', () => {
    const bracket = generateBracket(makeAthletes(2), 'cat1', 1);
    const updated = advanceWinnerInBracket(bracket, bracket[0].id, 'RED');
    expect(updated).not.toBe(bracket);
    // Original should be unchanged
    expect(bracket[0].status).not.toBe('FINISHED');
  });
});

describe('getNextReadyMatch', () => {
  it('should return the first ready match by round then position', () => {
    const bracket = generateBracket(makeAthletes(4), 'cat1', 1);
    const next = getNextReadyMatch(bracket);
    expect(next).toBeDefined();
    expect(next!.status).toBe('READY');
    expect(next!.round).toBe(1);
    expect(next!.position).toBe(0);
  });

  it('should return undefined when no matches are ready', () => {
    const result = getNextReadyMatch([]);
    expect(result).toBeUndefined();
  });
});

describe('isCategoryFinished', () => {
  it('should return false for empty bracket', () => {
    expect(isCategoryFinished([])).toBe(false);
  });

  it('should return false when final match is not finished', () => {
    const bracket = generateBracket(makeAthletes(2), 'cat1', 1);
    expect(isCategoryFinished(bracket)).toBe(false);
  });

  it('should return true when final match is finished', () => {
    const bracket = generateBracket(makeAthletes(2), 'cat1', 1);
    const updated = advanceWinnerInBracket(bracket, bracket[0].id, 'RED');
    expect(isCategoryFinished(updated)).toBe(true);
  });
});

describe('getCategoryWinner', () => {
  it('should return undefined when category is not finished', () => {
    const bracket = generateBracket(makeAthletes(2), 'cat1', 1);
    expect(getCategoryWinner(bracket)).toBeUndefined();
  });

  it('should return the winner athlete when final is finished', () => {
    const bracket = generateBracket(makeAthletes(2), 'cat1', 1);
    const finalMatch = bracket[0]; // Only 1 match for 2 athletes
    const updated = advanceWinnerInBracket(bracket, finalMatch.id, 'BLUE');
    const winner = getCategoryWinner(updated);
    expect(winner).toBeDefined();
    expect(winner!.id).toBe(finalMatch.athleteBlue!.id);
  });
});
