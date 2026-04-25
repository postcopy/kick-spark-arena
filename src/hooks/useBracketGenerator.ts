// Bracket Generation — Single Elimination with BYEs

import type { Athlete, BracketMatch } from '@/types/tournament';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function advanceWinner(allMatches: BracketMatch[], finishedMatch: BracketMatch) {
  if (!finishedMatch.nextMatchId) return;

  const nextMatch = allMatches.find(m => m.id === finishedMatch.nextMatchId);
  if (!nextMatch) return;

  const winner = finishedMatch.winnerSide === 'RED'
    ? finishedMatch.athleteRed
    : finishedMatch.athleteBlue;
  if (!winner) return;

  // Even position → red (top), odd position → blue (bottom)
  if (finishedMatch.position % 2 === 0) {
    nextMatch.athleteRed = winner;
  } else {
    nextMatch.athleteBlue = winner;
  }
}

function updateReadyStatus(matches: BracketMatch[]) {
  for (const match of matches) {
    if (match.status === 'PENDING' && match.athleteRed && match.athleteBlue) {
      match.status = 'READY';
    }
  }
}

export function generateBracket(
  athletes: Athlete[],
  categoryId: string,
  startMatchNumber: number,
): BracketMatch[] {
  if (athletes.length < 2) return [];

  const totalSlots = nextPowerOf2(athletes.length);
  const totalRounds = Math.log2(totalSlots);
  const shuffled = shuffleArray(athletes);

  const matches: BracketMatch[] = [];
  let matchCounter = startMatchNumber;

  // Generate all matches for all rounds
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = totalSlots / Math.pow(2, round);
    for (let pos = 0; pos < matchesInRound; pos++) {
      const matchId = `${categoryId}-r${round}-m${pos}`;
      const nextRound = round + 1;
      const nextPos = Math.floor(pos / 2);
      const nextMatchId = nextRound <= totalRounds
        ? `${categoryId}-r${nextRound}-m${nextPos}`
        : undefined;

      matches.push({
        id: matchId,
        round,
        position: pos,
        status: 'PENDING',
        nextMatchId,
        matchNumber: matchCounter++,
      });
    }
  }

  // Populate round 1 with athletes
  const round1Matches = matches.filter(m => m.round === 1);
  let athleteIdx = 0;

  for (const match of round1Matches) {
    if (athleteIdx < shuffled.length) {
      match.athleteRed = shuffled[athleteIdx++];
    }
    if (athleteIdx < shuffled.length) {
      match.athleteBlue = shuffled[athleteIdx++];
    }
  }

  // Process BYEs: matches with only one athlete
  for (const match of round1Matches) {
    if (match.athleteRed && !match.athleteBlue) {
      match.status = 'BYE';
      match.winnerId = match.athleteRed.id;
      match.winnerSide = 'RED';
      advanceWinner(matches, match);
    } else if (match.athleteBlue && !match.athleteRed) {
      match.status = 'BYE';
      match.winnerId = match.athleteBlue.id;
      match.winnerSide = 'BLUE';
      advanceWinner(matches, match);
    } else if (match.athleteRed && match.athleteBlue) {
      match.status = 'READY';
    }
  }

  updateReadyStatus(matches);
  return matches;
}

export function advanceWinnerInBracket(
  bracket: BracketMatch[],
  matchId: string,
  winnerSide: 'RED' | 'BLUE',
): BracketMatch[] {
  const updated = bracket.map(m => ({ ...m }));
  const match = updated.find(m => m.id === matchId);
  if (!match) return updated;

  const winner = winnerSide === 'RED' ? match.athleteRed : match.athleteBlue;
  if (!winner) return updated;

  match.status = 'FINISHED';
  match.winnerId = winner.id;
  match.winnerSide = winnerSide;

  advanceWinner(updated, match);
  updateReadyStatus(updated);

  return updated;
}

/**
 * Reset a match and all its descendants (forward chain via nextMatchId).
 * Used when overriding a winner — descendant matches must lose the old winner
 * before the new one is propagated.
 */
export function resetMatchAndDescendants(
  bracket: BracketMatch[],
  matchId: string,
): BracketMatch[] {
  const updated = bracket.map(m => ({ ...m }));
  const visit = (id: string) => {
    const match = updated.find(m => m.id === id);
    if (!match) return;
    const nextId = match.nextMatchId;
    // Clear this match's result
    match.winnerId = undefined;
    match.winnerSide = undefined;
    if (match.status === 'FINISHED') {
      match.status = match.athleteRed && match.athleteBlue ? 'READY' : 'PENDING';
    }
    // For descendants, also remove the seated athlete that came from this match
    if (nextId) {
      const next = updated.find(m => m.id === nextId);
      if (next) {
        if (match.position % 2 === 0) {
          next.athleteRed = undefined;
        } else {
          next.athleteBlue = undefined;
        }
        visit(nextId);
      }
    }
  };
  // Start from the children of matchId — the match itself keeps its athletes
  const root = updated.find(m => m.id === matchId);
  if (root && root.nextMatchId) {
    const next = updated.find(m => m.id === root.nextMatchId);
    if (next) {
      if (root.position % 2 === 0) next.athleteRed = undefined;
      else next.athleteBlue = undefined;
      visit(root.nextMatchId);
    }
  }
  // Reset the root's result too (will be re-set by advanceWinnerInBracket)
  if (root) {
    root.winnerId = undefined;
    root.winnerSide = undefined;
    if (root.status === 'FINISHED') {
      root.status = root.athleteRed && root.athleteBlue ? 'READY' : 'PENDING';
    }
  }
  updateReadyStatus(updated);
  return updated;
}

export function getNextReadyMatch(bracket: BracketMatch[]): BracketMatch | undefined {
  return bracket
    .filter(m => m.status === 'READY')
    .sort((a, b) => a.round - b.round || a.position - b.position)[0];
}

export function isCategoryFinished(bracket: BracketMatch[]): boolean {
  if (bracket.length === 0) return false;
  const finalMatch = bracket.find(m => !m.nextMatchId);
  return finalMatch?.status === 'FINISHED';
}

export function getCategoryWinner(bracket: BracketMatch[]): Athlete | undefined {
  const finalMatch = bracket.find(m => !m.nextMatchId);
  if (!finalMatch || finalMatch.status !== 'FINISHED') return undefined;
  return finalMatch.winnerSide === 'RED' ? finalMatch.athleteRed : finalMatch.athleteBlue;
}
