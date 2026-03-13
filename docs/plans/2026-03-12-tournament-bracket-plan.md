# Tournament Bracket System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a single-elimination tournament bracket system with categories, athlete management (manual + CSV import), bracket generation, automatic winner advancement, and TV bracket visualization to the SPE Sulsport championship app.

**Architecture:** New `TournamentState` in localStorage alongside existing `MatchState`. BroadcastChannel typed messages sync bracket state between Mat and TV. Tournament setup page at `/championship/tournament`, Mat enhanced with bracket context, TV alternates between bracket view and scoreboard.

**Tech Stack:** React 18, TypeScript, react-router-dom (HashRouter), BroadcastChannel API, localStorage, Tailwind CSS, shadcn/ui components (Button, Input, Select, Dialog, Tabs), lucide-react icons.

---

### Task 1: Tournament Types

**Files:**
- Create: `src/types/tournament.ts`

**Step 1: Create the type definitions file**

```typescript
// src/types/tournament.ts

export interface Athlete {
  id: string;
  name: string;
  academy?: string;
  weight?: number;
}

export type CategoryGender = 'M' | 'F';
export type CategoryStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
export type BracketMatchStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'FINISHED' | 'BYE';
export type TournamentStatus = 'SETUP' | 'IN_PROGRESS' | 'FINISHED';

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  athleteRed?: Athlete;
  athleteBlue?: Athlete;
  winnerId?: string;
  winnerSide?: 'RED' | 'BLUE';
  status: BracketMatchStatus;
  nextMatchId?: string;
  matchNumber: number;
}

export interface Category {
  id: string;
  name: string;
  ageGroup: string;
  belt: string;
  weightClass: string;
  gender: CategoryGender;
  athletes: Athlete[];
  bracket: BracketMatch[];
  status: CategoryStatus;
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location?: string;
  categories: Category[];
  status: TournamentStatus;
  createdAt: number;
  currentCategoryId?: string;
  currentMatchId?: string;
  globalMatchCounter: number;
}

// Sync message types for BroadcastChannel
export type TournamentSyncMessage =
  | { type: 'MATCH_STATE'; payload: unknown }
  | { type: 'TOURNAMENT_STATE'; payload: Tournament }
  | { type: 'SHOW_BRACKET'; payload: { categoryId: string } }
  | { type: 'SHOW_SCOREBOARD' };

// localStorage key
export const TOURNAMENT_STORAGE_KEY = 'sulsport:tournament';

// Age group options
export const AGE_GROUPS = ['Infantil', 'Cadete', 'Juvenil', 'Sub-21', 'Adulto', 'Master'] as const;

// Belt options
export const BELTS = ['Branca', 'Amarela', 'Verde', 'Azul', 'Vermelha', 'Preta'] as const;

// Weight class options (generic, operator can customize)
export const WEIGHT_CLASSES = [
  'Até 45kg', 'Até 48kg', 'Até 51kg', 'Até 54kg', 'Até 57kg',
  'Até 58kg', 'Até 61kg', 'Até 63kg', 'Até 67kg', 'Até 68kg',
  'Até 73kg', 'Até 74kg', 'Até 80kg', 'Até 87kg', 'Acima de 87kg',
] as const;
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to tournament.ts

---

### Task 2: Bracket Generator

**Files:**
- Create: `src/hooks/useBracketGenerator.ts`

**Step 1: Create the bracket generation logic**

```typescript
// src/hooks/useBracketGenerator.ts

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

export function generateBracket(
  athletes: Athlete[],
  categoryId: string,
  startMatchNumber: number,
): BracketMatch[] {
  if (athletes.length < 2) return [];

  const totalSlots = nextPowerOf2(athletes.length);
  const totalRounds = Math.log2(totalSlots);
  const numByes = totalSlots - athletes.length;
  const shuffled = shuffleArray(athletes);

  const matches: BracketMatch[] = [];
  let matchCounter = startMatchNumber;

  // Generate all matches for all rounds
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = totalSlots / Math.pow(2, round);
    for (let pos = 0; pos < matchesInRound; pos++) {
      const matchId = `${categoryId}-r${round}-m${pos}`;
      // Find next match (winner goes to)
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

  // Populate round 1 with athletes and BYEs
  const round1Matches = matches.filter(m => m.round === 1);

  // Slot athletes: first fill non-BYE slots
  // BYEs go to the LAST positions in round 1 (top seeds advance)
  let athleteIdx = 0;
  for (let i = 0; i < round1Matches.length; i++) {
    const match = round1Matches[i];
    // Red side (top slot)
    if (athleteIdx < shuffled.length) {
      match.athleteRed = shuffled[athleteIdx++];
    }
    // Blue side (bottom slot)
    if (athleteIdx < shuffled.length) {
      match.athleteBlue = shuffled[athleteIdx++];
    }
  }

  // Process BYEs: matches with only one athlete
  for (const match of round1Matches) {
    if (match.athleteRed && !match.athleteBlue) {
      // Red gets BYE - auto advance
      match.status = 'BYE';
      match.winnerId = match.athleteRed.id;
      match.winnerSide = 'RED';
      advanceWinner(matches, match);
    } else if (match.athleteBlue && !match.athleteRed) {
      // Blue gets BYE - auto advance
      match.status = 'BYE';
      match.winnerId = match.athleteBlue.id;
      match.winnerSide = 'BLUE';
      advanceWinner(matches, match);
    } else if (match.athleteRed && match.athleteBlue) {
      match.status = 'READY';
    }
  }

  // Update READY status for round 2+ matches that have both athletes filled (from BYEs)
  updateReadyStatus(matches);

  return matches;
}

function advanceWinner(allMatches: BracketMatch[], finishedMatch: BracketMatch) {
  if (!finishedMatch.nextMatchId) return;

  const nextMatch = allMatches.find(m => m.id === finishedMatch.nextMatchId);
  if (!nextMatch) return;

  const winner = finishedMatch.winnerSide === 'RED'
    ? finishedMatch.athleteRed
    : finishedMatch.athleteBlue;
  if (!winner) return;

  // Determine slot: even position -> red (top), odd position -> blue (bottom)
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

  // Advance to next match
  advanceWinner(updated, match);
  updateReadyStatus(updated);

  return updated;
}

export function getNextReadyMatch(bracket: BracketMatch[]): BracketMatch | undefined {
  // Find the first READY match (lowest round, then lowest position)
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
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 3: CSV Parser

**Files:**
- Create: `src/utils/csvParser.ts`

**Step 1: Create CSV parsing utility**

```typescript
// src/utils/csvParser.ts

import type { Athlete } from '@/types/tournament';

export interface CsvParseResult {
  athletes: Athlete[];
  errors: string[];
}

export function parseCsvAthletes(csvText: string): CsvParseResult {
  const athletes: Athlete[] = [];
  const errors: string[] = [];

  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    errors.push('Arquivo vazio');
    return { athletes, errors };
  }

  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const startIdx = (firstLine.includes('nome') || firstLine.includes('name')) ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    // Support both comma and semicolon separators
    const parts = line.includes(';')
      ? line.split(';').map(p => p.trim())
      : line.split(',').map(p => p.trim());

    const name = parts[0];
    if (!name) {
      errors.push(`Linha ${i + 1}: nome vazio`);
      continue;
    }

    const academy = parts[1] || undefined;
    const weight = parts[2] ? parseFloat(parts[2]) : undefined;

    if (parts[2] && isNaN(weight!)) {
      errors.push(`Linha ${i + 1}: peso inválido "${parts[2]}"`);
    }

    athletes.push({
      id: crypto.randomUUID(),
      name: name.toUpperCase(),
      academy,
      weight: weight && !isNaN(weight) ? weight : undefined,
    });
  }

  return { athletes, errors };
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 4: useTournament Hook

**Files:**
- Create: `src/hooks/useTournament.ts`

**Step 1: Create the tournament state management hook**

```typescript
// src/hooks/useTournament.ts

import { useState, useCallback, useEffect } from 'react';
import type {
  Tournament,
  Category,
  Athlete,
  CategoryGender,
  BracketMatch,
} from '@/types/tournament';
import { TOURNAMENT_STORAGE_KEY } from '@/types/tournament';
import {
  generateBracket,
  advanceWinnerInBracket,
  getNextReadyMatch,
  isCategoryFinished,
} from '@/hooks/useBracketGenerator';

function loadTournament(): Tournament | null {
  try {
    const stored = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function saveTournament(tournament: Tournament | null) {
  if (tournament) {
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(tournament));
  } else {
    localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
  }
}

export function useTournament() {
  const [tournament, setTournament] = useState<Tournament | null>(loadTournament);

  // Persist on every change
  useEffect(() => {
    saveTournament(tournament);
  }, [tournament]);

  const createTournament = useCallback((name: string, date: string, location?: string) => {
    const t: Tournament = {
      id: crypto.randomUUID(),
      name,
      date,
      location,
      categories: [],
      status: 'SETUP',
      createdAt: Date.now(),
      globalMatchCounter: 1,
    };
    setTournament(t);
    return t;
  }, []);

  const addCategory = useCallback((
    ageGroup: string,
    belt: string,
    weightClass: string,
    gender: CategoryGender,
  ) => {
    setTournament(prev => {
      if (!prev) return prev;
      const name = `${ageGroup} / ${belt} / ${weightClass} / ${gender === 'M' ? 'Masc' : 'Fem'}`;
      const category: Category = {
        id: crypto.randomUUID(),
        name,
        ageGroup,
        belt,
        weightClass,
        gender,
        athletes: [],
        bracket: [],
        status: 'PENDING',
      };
      return { ...prev, categories: [...prev.categories, category] };
    });
  }, []);

  const removeCategory = useCallback((categoryId: string) => {
    setTournament(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== categoryId),
      };
    });
  }, []);

  const addAthlete = useCallback((categoryId: string, athlete: Omit<Athlete, 'id'>) => {
    setTournament(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map(c =>
          c.id === categoryId
            ? { ...c, athletes: [...c.athletes, { ...athlete, id: crypto.randomUUID() }] }
            : c
        ),
      };
    });
  }, []);

  const addAthletes = useCallback((categoryId: string, athletes: Athlete[]) => {
    setTournament(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map(c =>
          c.id === categoryId
            ? { ...c, athletes: [...c.athletes, ...athletes] }
            : c
        ),
      };
    });
  }, []);

  const removeAthlete = useCallback((categoryId: string, athleteId: string) => {
    setTournament(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map(c =>
          c.id === categoryId
            ? { ...c, athletes: c.athletes.filter(a => a.id !== athleteId) }
            : c
        ),
      };
    });
  }, []);

  const generateCategoryBracket = useCallback((categoryId: string) => {
    setTournament(prev => {
      if (!prev) return prev;
      const cat = prev.categories.find(c => c.id === categoryId);
      if (!cat || cat.athletes.length < 2) return prev;

      const bracket = generateBracket(cat.athletes, categoryId, prev.globalMatchCounter);
      const matchCount = bracket.filter(m => m.status !== 'BYE').length;

      return {
        ...prev,
        globalMatchCounter: prev.globalMatchCounter + bracket.length,
        categories: prev.categories.map(c =>
          c.id === categoryId ? { ...c, bracket } : c
        ),
      };
    });
  }, []);

  const generateAllBrackets = useCallback(() => {
    setTournament(prev => {
      if (!prev) return prev;
      let counter = 1;
      const updatedCategories = prev.categories.map(cat => {
        if (cat.athletes.length < 2) return cat;
        const bracket = generateBracket(cat.athletes, cat.id, counter);
        counter += bracket.length;
        return { ...cat, bracket };
      });
      return { ...prev, categories: updatedCategories, globalMatchCounter: counter };
    });
  }, []);

  const startTournament = useCallback(() => {
    setTournament(prev => {
      if (!prev) return prev;
      // Find first category with a bracket
      const firstCat = prev.categories.find(c => c.bracket.length > 0);
      const firstMatch = firstCat ? getNextReadyMatch(firstCat.bracket) : undefined;
      return {
        ...prev,
        status: 'IN_PROGRESS',
        currentCategoryId: firstCat?.id,
        currentMatchId: firstMatch?.id,
      };
    });
  }, []);

  const recordMatchResult = useCallback((
    categoryId: string,
    matchId: string,
    winnerSide: 'RED' | 'BLUE',
  ) => {
    setTournament(prev => {
      if (!prev) return prev;

      const updatedCategories = prev.categories.map(cat => {
        if (cat.id !== categoryId) return cat;
        const updatedBracket = advanceWinnerInBracket(cat.bracket, matchId, winnerSide);
        const finished = isCategoryFinished(updatedBracket);
        return {
          ...cat,
          bracket: updatedBracket,
          status: finished ? 'FINISHED' as const : 'IN_PROGRESS' as const,
        };
      });

      // Find next match: in current category or move to next category
      let nextCatId = categoryId;
      let nextMatchId: string | undefined;

      const currentCat = updatedCategories.find(c => c.id === categoryId);
      if (currentCat) {
        const next = getNextReadyMatch(currentCat.bracket);
        if (next) {
          nextMatchId = next.id;
        } else {
          // Category done — find next category with ready matches
          for (const cat of updatedCategories) {
            if (cat.id === categoryId) continue;
            if (cat.status === 'FINISHED') continue;
            const next = getNextReadyMatch(cat.bracket);
            if (next) {
              nextCatId = cat.id;
              nextMatchId = next.id;
              break;
            }
          }
        }
      }

      const allFinished = updatedCategories.every(c => c.bracket.length === 0 || c.status === 'FINISHED');

      return {
        ...prev,
        categories: updatedCategories,
        currentCategoryId: nextCatId,
        currentMatchId: nextMatchId,
        status: allFinished ? 'FINISHED' : prev.status,
      };
    });
  }, []);

  const overrideMatchWinner = useCallback((
    categoryId: string,
    matchId: string,
    newWinnerSide: 'RED' | 'BLUE',
  ) => {
    // Same as recordMatchResult — the advanceWinnerInBracket overwrites
    recordMatchResult(categoryId, matchId, newWinnerSide);
  }, [recordMatchResult]);

  const deleteTournament = useCallback(() => {
    setTournament(null);
  }, []);

  const getCurrentMatch = useCallback((): { category: Category; match: BracketMatch } | null => {
    if (!tournament?.currentCategoryId || !tournament?.currentMatchId) return null;
    const cat = tournament.categories.find(c => c.id === tournament.currentCategoryId);
    if (!cat) return null;
    const match = cat.bracket.find(m => m.id === tournament.currentMatchId);
    if (!match) return null;
    return { category: cat, match };
  }, [tournament]);

  const getTotalMatches = useCallback((): number => {
    if (!tournament) return 0;
    return tournament.categories.reduce(
      (sum, c) => sum + c.bracket.filter(m => m.status !== 'BYE').length, 0
    );
  }, [tournament]);

  const getFinishedMatches = useCallback((): number => {
    if (!tournament) return 0;
    return tournament.categories.reduce(
      (sum, c) => sum + c.bracket.filter(m => m.status === 'FINISHED').length, 0
    );
  }, [tournament]);

  return {
    tournament,
    createTournament,
    addCategory,
    removeCategory,
    addAthlete,
    addAthletes,
    removeAthlete,
    generateCategoryBracket,
    generateAllBrackets,
    startTournament,
    recordMatchResult,
    overrideMatchWinner,
    deleteTournament,
    getCurrentMatch,
    getTotalMatches,
    getFinishedMatches,
  };
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 5: BracketView Component

**Files:**
- Create: `src/components/championship/BracketView.tsx`

**Step 1: Create the bracket visualization component (used on TV and setup preview)**

This component renders a single-elimination bracket tree. It should be read-only and visually appealing for the TV display.

```typescript
// src/components/championship/BracketView.tsx

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { BracketMatch, Category } from '@/types/tournament';

interface BracketViewProps {
  category: Category;
  currentMatchId?: string;
  compact?: boolean; // for preview in setup page
}

interface RoundColumn {
  round: number;
  matches: BracketMatch[];
  label: string;
}

function getRoundLabel(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'FINAL';
  if (round === totalRounds - 1) return 'SEMIFINAL';
  if (round === totalRounds - 2) return 'QUARTAS';
  return `ROUND ${round}`;
}

export function BracketView({ category, currentMatchId, compact = false }: BracketViewProps) {
  const rounds = useMemo(() => {
    if (category.bracket.length === 0) return [];

    const maxRound = Math.max(...category.bracket.map(m => m.round));
    const columns: RoundColumn[] = [];

    for (let r = 1; r <= maxRound; r++) {
      const matches = category.bracket
        .filter(m => m.round === r)
        .sort((a, b) => a.position - b.position);
      columns.push({
        round: r,
        matches,
        label: getRoundLabel(r, maxRound),
      });
    }
    return columns;
  }, [category.bracket]);

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-xl">
        Nenhuma chave gerada
      </div>
    );
  }

  const cellH = compact ? 'h-12' : 'h-16';
  const fontSize = compact ? 'text-xs' : 'text-sm';
  const gapY = compact ? 'gap-1' : 'gap-2';

  return (
    <div className="w-full h-full flex flex-col">
      {/* Category Title */}
      <div className="text-center mb-4">
        <h2 className={cn(
          "font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider",
          compact ? "text-lg" : "text-2xl"
        )}>
          {category.name}
        </h2>
      </div>

      {/* Bracket Grid */}
      <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden px-4">
        <div className="flex gap-8 mx-auto min-w-max">
          {rounds.map((col) => (
            <div key={col.round} className="flex flex-col items-center">
              {/* Round Label */}
              <div className={cn(
                "mb-3 font-bold text-white/50 uppercase tracking-wider",
                compact ? "text-[10px]" : "text-xs"
              )}>
                {col.label}
              </div>

              {/* Matches */}
              <div className={cn("flex flex-col justify-around flex-1", gapY)}
                style={{ gap: `${Math.pow(2, col.round - 1) * (compact ? 8 : 12)}px` }}
              >
                {col.matches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isCurrent={match.id === currentMatchId}
                    compact={compact}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  isCurrent,
  compact,
}: {
  match: BracketMatch;
  isCurrent: boolean;
  compact: boolean;
}) {
  const isFinished = match.status === 'FINISHED';
  const isBye = match.status === 'BYE';
  const width = compact ? 'w-40' : 'w-52';

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      width,
      isCurrent && "ring-2 ring-[hsl(var(--sulsport-yellow))] animate-pulse",
      isFinished ? "border-white/20" : "border-white/10",
      isBye && "opacity-50",
    )}>
      {/* Match number */}
      <div className={cn(
        "text-center text-[10px] font-bold uppercase tracking-wider py-0.5",
        isCurrent
          ? "bg-[hsl(var(--sulsport-yellow))] text-black"
          : "bg-white/5 text-white/40"
      )}>
        {isBye ? 'BYE' : `LUTA ${String(match.matchNumber).padStart(3, '0')}`}
      </div>

      {/* Red athlete (top) */}
      <div className={cn(
        "flex items-center px-2 border-b border-white/10",
        compact ? "h-7" : "h-9",
        isFinished && match.winnerSide === 'RED'
          ? "bg-[hsl(var(--sulsport-red))]/30"
          : "bg-[hsl(var(--sulsport-red))]/10",
      )}>
        <span className={cn(
          "truncate font-bold",
          compact ? "text-[11px]" : "text-sm",
          isFinished && match.winnerSide === 'RED' ? "text-white" : "text-white/70",
        )}>
          {match.athleteRed?.name || '—'}
        </span>
      </div>

      {/* Blue athlete (bottom) */}
      <div className={cn(
        "flex items-center px-2",
        compact ? "h-7" : "h-9",
        isFinished && match.winnerSide === 'BLUE'
          ? "bg-[hsl(var(--sulsport-blue))]/30"
          : "bg-[hsl(var(--sulsport-blue))]/10",
      )}>
        <span className={cn(
          "truncate font-bold",
          compact ? "text-[11px]" : "text-sm",
          isFinished && match.winnerSide === 'BLUE' ? "text-white" : "text-white/70",
        )}>
          {match.athleteBlue?.name || '—'}
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 6: TournamentSetup Page

**Files:**
- Create: `src/pages/TournamentSetup.tsx`

**Step 1: Create the tournament setup page with all steps**

This is the largest single component. It has 4 sections: Tournament Info, Categories, Athletes, and Bracket Preview.

```typescript
// src/pages/TournamentSetup.tsx

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { parseCsvAthletes } from '@/utils/csvParser';
import { BracketView } from '@/components/championship/BracketView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Upload,
  Shuffle,
  Trophy,
  Users,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowLeft,
  X,
} from 'lucide-react';
import { AGE_GROUPS, BELTS, WEIGHT_CLASSES } from '@/types/tournament';
import type { Category, CategoryGender } from '@/types/tournament';
import logoSpe from '@/assets/logo-spe-branca.png';

export default function TournamentSetup() {
  const navigate = useNavigate();
  const t = useTournament();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [tournamentName, setTournamentName] = useState(t.tournament?.name || '');
  const [tournamentDate, setTournamentDate] = useState(t.tournament?.date || new Date().toISOString().slice(0, 10));
  const [tournamentLocation, setTournamentLocation] = useState(t.tournament?.location || '');

  // Category form
  const [catAgeGroup, setCatAgeGroup] = useState('');
  const [catBelt, setCatBelt] = useState('');
  const [catWeight, setCatWeight] = useState('');
  const [catGender, setCatGender] = useState<CategoryGender>('M');

  // Athlete form
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState('');
  const [athleteAcademy, setAthleteAcademy] = useState('');
  const [csvUploadCategoryId, setCsvUploadCategoryId] = useState<string | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const hasTournament = !!t.tournament;
  const isSetup = !t.tournament || t.tournament.status === 'SETUP';

  // Step 1: Create tournament
  const handleCreateTournament = () => {
    if (!tournamentName.trim()) return;
    t.createTournament(tournamentName.trim(), tournamentDate, tournamentLocation.trim() || undefined);
  };

  // Step 2: Add category
  const handleAddCategory = () => {
    if (!catAgeGroup || !catBelt || !catWeight) return;
    t.addCategory(catAgeGroup, catBelt, catWeight, catGender);
    setCatAgeGroup('');
    setCatBelt('');
    setCatWeight('');
  };

  // Step 3: Add athlete manually
  const handleAddAthlete = () => {
    if (!selectedCategoryId || !athleteName.trim()) return;
    t.addAthlete(selectedCategoryId, {
      name: athleteName.trim().toUpperCase(),
      academy: athleteAcademy.trim() || undefined,
    });
    setAthleteName('');
    setAthleteAcademy('');
  };

  // CSV import
  const handleCsvUpload = useCallback((categoryId: string) => {
    setCsvUploadCategoryId(categoryId);
    setCsvErrors([]);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !csvUploadCategoryId) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCsvAthletes(text);
      if (result.athletes.length > 0) {
        t.addAthletes(csvUploadCategoryId, result.athletes);
      }
      if (result.errors.length > 0) {
        setCsvErrors(result.errors);
      }
      setCsvUploadCategoryId(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [csvUploadCategoryId, t]);

  // Toggle category expansion
  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Start tournament
  const handleStartTournament = () => {
    const catsWithBrackets = t.tournament?.categories.filter(c => c.bracket.length > 0) || [];
    if (catsWithBrackets.length === 0) return;
    t.startTournament();
    navigate('/championship/mat');
  };

  const totalAthletes = t.tournament?.categories.reduce((s, c) => s + c.athletes.length, 0) || 0;
  const totalCatsWithBrackets = t.tournament?.categories.filter(c => c.bracket.length > 0).length || 0;

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--sulsport-black))] text-white overflow-hidden">
      {/* Hidden file input for CSV */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="h-14 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/championship/mat')}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Trophy className="h-5 w-5 text-[hsl(var(--sulsport-yellow))]" />
          <span className="font-bold text-lg">Gerenciar Campeonato</span>
        </div>
        <img src={logoSpe} alt="SPE" className="h-8 w-auto" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* SECTION 1: Tournament Info */}
          <section className="bg-[hsl(var(--sulsport-dark))] rounded-xl border border-[hsl(var(--sulsport-gray))] p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[hsl(var(--sulsport-yellow))]" />
              Dados do Campeonato
            </h2>

            {!hasTournament ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Nome do Campeonato"
                  value={tournamentName}
                  onChange={e => setTournamentName(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                <Input
                  type="date"
                  value={tournamentDate}
                  onChange={e => setTournamentDate(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                <Input
                  placeholder="Local (opcional)"
                  value={tournamentLocation}
                  onChange={e => setTournamentLocation(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                <Button
                  onClick={handleCreateTournament}
                  disabled={!tournamentName.trim()}
                  className="bg-[hsl(var(--sulsport-yellow))] hover:bg-[hsl(var(--sulsport-yellow-dark))] text-black font-bold md:col-span-3"
                >
                  Criar Campeonato
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-[hsl(var(--sulsport-yellow))]">
                    {t.tournament!.name}
                  </h3>
                  <p className="text-zinc-400">
                    {t.tournament!.date} {t.tournament!.location && `— ${t.tournament!.location}`}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {t.tournament!.categories.length} categorias · {totalAthletes} atletas
                  </p>
                </div>
                {isSetup && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* SECTION 2: Categories */}
          {hasTournament && isSetup && (
            <section className="bg-[hsl(var(--sulsport-dark))] rounded-xl border border-[hsl(var(--sulsport-gray))] p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[hsl(var(--sulsport-yellow))]" />
                Categorias
              </h2>

              {/* Add Category Form */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <Select value={catAgeGroup} onValueChange={setCatAgeGroup}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Faixa Etária" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map(ag => (
                      <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={catBelt} onValueChange={setCatBelt}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Graduação" />
                  </SelectTrigger>
                  <SelectContent>
                    {BELTS.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={catWeight} onValueChange={setCatWeight}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Peso" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_CLASSES.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={catGender} onValueChange={v => setCatGender(v as CategoryGender)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAddCategory}
                  disabled={!catAgeGroup || !catBelt || !catWeight}
                  className="bg-[hsl(var(--sulsport-yellow))] hover:bg-[hsl(var(--sulsport-yellow-dark))] text-black font-bold"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Category List */}
              <div className="space-y-2">
                {t.tournament!.categories.map(cat => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    expanded={expandedCategories.has(cat.id)}
                    onToggle={() => toggleCategory(cat.id)}
                    onRemoveCategory={() => t.removeCategory(cat.id)}
                    onAddAthlete={(name, academy) => {
                      t.addAthlete(cat.id, {
                        name: name.toUpperCase(),
                        academy: academy || undefined,
                      });
                    }}
                    onRemoveAthlete={(athleteId) => t.removeAthlete(cat.id, athleteId)}
                    onCsvImport={() => handleCsvUpload(cat.id)}
                    onGenerateBracket={() => t.generateCategoryBracket(cat.id)}
                  />
                ))}

                {t.tournament!.categories.length === 0 && (
                  <p className="text-zinc-500 text-center py-6">
                    Nenhuma categoria adicionada ainda.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* SECTION 3: Generate All + Start */}
          {hasTournament && isSetup && t.tournament!.categories.length > 0 && (
            <section className="bg-[hsl(var(--sulsport-dark))] rounded-xl border border-[hsl(var(--sulsport-gray))] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Iniciar Campeonato</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    {totalCatsWithBrackets}/{t.tournament!.categories.length} categorias com chaves geradas
                    · {t.getTotalMatches()} lutas no total
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={t.generateAllBrackets}
                    variant="outline"
                    className="border-zinc-600 text-white hover:bg-zinc-800"
                    disabled={totalAthletes < 2}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Gerar Todas as Chaves
                  </Button>
                  <Button
                    onClick={() => setShowStartDialog(true)}
                    disabled={totalCatsWithBrackets === 0}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-8"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Campeonato
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* If tournament is IN_PROGRESS, show bracket overview */}
          {hasTournament && t.tournament!.status !== 'SETUP' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Campeonato {t.tournament!.status === 'FINISHED' ? 'Encerrado' : 'Em Andamento'}
                </h2>
                <div className="flex gap-3">
                  <span className="text-zinc-400">
                    {t.getFinishedMatches()}/{t.getTotalMatches()} lutas
                  </span>
                  {t.tournament!.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={() => navigate('/championship/mat')}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Ir para Mesa
                    </Button>
                  )}
                </div>
              </div>

              {t.tournament!.categories.map(cat => (
                <div key={cat.id} className="bg-[hsl(var(--sulsport-dark))] rounded-xl border border-[hsl(var(--sulsport-gray))] p-4">
                  <BracketView
                    category={cat}
                    currentMatchId={t.tournament!.currentMatchId}
                    compact
                  />
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      {/* CSV Errors Toast */}
      {csvErrors.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-500/50 rounded-lg p-4 max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-red-300">Erros no CSV</span>
            <button onClick={() => setCsvErrors([])} className="text-red-400 hover:text-red-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          {csvErrors.map((err, i) => (
            <p key={i} className="text-red-200 text-sm">{err}</p>
          ))}
        </div>
      )}

      {/* Delete Tournament Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Campeonato?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Todos os dados do campeonato serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { t.deleteTournament(); setShowDeleteDialog(false); }}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Tournament Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Iniciar Campeonato?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {totalCatsWithBrackets} categorias com chaves prontas. {t.getTotalMatches()} lutas no total.
              Após iniciar, não será possível alterar categorias ou atletas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { handleStartTournament(); setShowStartDialog(false); }}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              Iniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Category Row Sub-Component ──

function CategoryRow({
  category,
  expanded,
  onToggle,
  onRemoveCategory,
  onAddAthlete,
  onRemoveAthlete,
  onCsvImport,
  onGenerateBracket,
}: {
  category: Category;
  expanded: boolean;
  onToggle: () => void;
  onRemoveCategory: () => void;
  onAddAthlete: (name: string, academy: string) => void;
  onRemoveAthlete: (athleteId: string) => void;
  onCsvImport: () => void;
  onGenerateBracket: () => void;
}) {
  const [name, setName] = useState('');
  const [academy, setAcademy] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddAthlete(name.trim(), academy.trim());
    setName('');
    setAcademy('');
  };

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800">
      {/* Category Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
          <span className="font-bold">{category.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
            {category.athletes.length} atletas
          </span>
          {category.bracket.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Chave gerada
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={onCsvImport}
            className="h-7 text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            <Upload className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateBracket}
            disabled={category.athletes.length < 2}
            className="h-7 text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Gerar Chave
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemoveCategory}
            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Expanded: Athletes List + Add Form */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-zinc-800">
          {/* Add athlete form */}
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Nome do Atleta"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm"
            />
            <Input
              placeholder="Academia (opcional)"
              value={academy}
              onChange={e => setAcademy(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm w-48"
            />
            <Button
              onClick={handleAdd}
              disabled={!name.trim()}
              size="sm"
              className="bg-[hsl(var(--sulsport-yellow))] hover:bg-[hsl(var(--sulsport-yellow-dark))] text-black h-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Athletes list */}
          {category.athletes.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-2">Nenhum atleta cadastrado</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {category.athletes.map((a, idx) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded bg-zinc-800/50 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 w-5">{idx + 1}.</span>
                    <span className="text-sm font-medium">{a.name}</span>
                    {a.academy && (
                      <span className="text-xs text-zinc-500">({a.academy})</span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveAthlete(a.id)}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bracket Preview (compact) */}
          {category.bracket.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="h-48 overflow-hidden">
                <BracketView category={category} compact />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 7: TournamentHeader and NextMatchBar Components

**Files:**
- Create: `src/components/championship/TournamentHeader.tsx`
- Create: `src/components/championship/NextMatchBar.tsx`

**Step 1: Create TournamentHeader**

```typescript
// src/components/championship/TournamentHeader.tsx

import type { Tournament } from '@/types/tournament';

interface TournamentHeaderProps {
  tournament: Tournament;
}

export function TournamentHeader({ tournament }: TournamentHeaderProps) {
  if (!tournament.currentCategoryId || !tournament.currentMatchId) return null;

  const cat = tournament.categories.find(c => c.id === tournament.currentCategoryId);
  if (!cat) return null;

  const match = cat.bracket.find(m => m.id === tournament.currentMatchId);
  if (!match) return null;

  const totalMatches = tournament.categories.reduce(
    (s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length, 0
  );
  const finishedMatches = tournament.categories.reduce(
    (s, c) => s + c.bracket.filter(m => m.status === 'FINISHED').length, 0
  );

  const maxRound = Math.max(...cat.bracket.map(m => m.round));
  const roundLabel = match.round === maxRound ? 'FINAL'
    : match.round === maxRound - 1 ? 'SEMIFINAL'
    : match.round === maxRound - 2 ? 'QUARTAS'
    : `ROUND ${match.round}`;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="px-2 py-1 rounded bg-[hsl(var(--sulsport-yellow))]/20 text-[hsl(var(--sulsport-yellow))] font-bold uppercase">
        Luta {finishedMatches + 1}/{totalMatches}
      </span>
      <span className="text-zinc-400 font-bold uppercase">{roundLabel}</span>
      <span className="text-zinc-500">—</span>
      <span className="text-zinc-400 truncate max-w-[200px]">{cat.name}</span>
    </div>
  );
}
```

**Step 2: Create NextMatchBar**

```typescript
// src/components/championship/NextMatchBar.tsx

import { Button } from '@/components/ui/button';
import { SkipForward, Trophy, Edit } from 'lucide-react';
import type { Tournament, BracketMatch, Category } from '@/types/tournament';
import { getNextReadyMatch } from '@/hooks/useBracketGenerator';

interface NextMatchBarProps {
  tournament: Tournament;
  currentMatchWinnerSide?: 'RED' | 'BLUE';
  onNextMatch: () => void;
  onOverrideWinner: () => void;
  onGoToTournament: () => void;
}

export function NextMatchBar({
  tournament,
  currentMatchWinnerSide,
  onNextMatch,
  onOverrideWinner,
  onGoToTournament,
}: NextMatchBarProps) {
  // Find next match
  let nextMatch: BracketMatch | undefined;
  let nextCat: Category | undefined;

  for (const cat of tournament.categories) {
    const match = getNextReadyMatch(cat.bracket);
    if (match) {
      nextMatch = match;
      nextCat = cat;
      break;
    }
  }

  const allFinished = tournament.status === 'FINISHED';

  return (
    <div className="bg-[hsl(var(--sulsport-dark))] border-t border-[hsl(var(--sulsport-gray))] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {nextMatch && nextCat && (
            <div className="text-sm">
              <span className="text-zinc-500">Próxima: </span>
              <span className="text-[hsl(var(--sulsport-yellow))] font-bold">
                Luta {String(nextMatch.matchNumber).padStart(3, '0')}
              </span>
              <span className="text-zinc-500"> — </span>
              <span className="text-white font-bold">
                {nextMatch.athleteRed?.name || '—'}
              </span>
              <span className="text-zinc-500"> vs </span>
              <span className="text-white font-bold">
                {nextMatch.athleteBlue?.name || '—'}
              </span>
            </div>
          )}
          {allFinished && (
            <div className="flex items-center gap-2 text-[hsl(var(--sulsport-yellow))]">
              <Trophy className="h-5 w-5" />
              <span className="font-bold">CAMPEONATO ENCERRADO</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentMatchWinnerSide && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOverrideWinner}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              <Edit className="h-4 w-4 mr-1" />
              Alterar Vencedor
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onGoToTournament}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            <Trophy className="h-4 w-4 mr-1" />
            Ver Chaves
          </Button>

          {nextMatch && (
            <Button
              onClick={onNextMatch}
              size="sm"
              className="bg-green-600 hover:bg-green-500 text-white font-bold"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Próxima Luta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 8: Modify BroadcastChannel Sync for Typed Messages

**Files:**
- Modify: `src/types/championship.ts` — add SyncMessage export
- Modify: `src/hooks/useChampionshipSync.ts` — typed messages

**Step 1: Add SyncMessage to championship.ts**

At the end of `src/types/championship.ts`, add:

```typescript
// Typed sync message for BroadcastChannel
export type ChampionshipSyncMessage =
  | { type: 'MATCH_STATE'; payload: MatchState }
  | { type: 'TOURNAMENT_UPDATE'; payload: unknown }
  | { type: 'SHOW_BRACKET'; payload: { categoryId: string } }
  | { type: 'SHOW_SCOREBOARD' };
```

**Step 2: Update useChampionshipSync broadcast to wrap in typed message**

In `src/hooks/useChampionshipSync.ts`, modify the `broadcast` function (around line 149) to send typed messages:

Change the `channel.current?.postMessage(stateToSync)` call to:
```typescript
channel.current?.postMessage({ type: 'MATCH_STATE', payload: stateToSync });
```

And in the listener (around line 112), change:
```typescript
channel.current.onmessage = (event) => {
  const msg = event.data;
  // Support both old format (raw state) and new typed format
  if (msg && msg.type === 'MATCH_STATE') {
    setState(msg.payload);
    setIsConnected(true);
  } else if (msg && msg.status !== undefined) {
    // Legacy: raw MatchState
    setState(msg);
    setIsConnected(true);
  }
};
```

Also add a new `broadcastTournament` method and `broadcastShowBracket` / `broadcastShowScoreboard`:

Add to the return object:
```typescript
broadcastRaw: (msg: ChampionshipSyncMessage) => {
  channel.current?.postMessage(msg);
},
```

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 9: Modify ChampionshipMat — Bracket Integration

**Files:**
- Modify: `src/pages/ChampionshipMat.tsx`

**Step 1: Add tournament integration to Mat**

Key changes to ChampionshipMat:
1. Import and use `useTournament()` hook
2. Import `TournamentHeader` and `NextMatchBar`
3. When match ends (`MATCH_END`), record result in tournament bracket
4. Auto-load next match athletes when "Próxima Luta" is clicked
5. Show `TournamentHeader` in the header area
6. Show `NextMatchBar` when match is finished

The specific edits:
- Add imports for `useTournament`, `TournamentHeader`, `NextMatchBar`, and `getNextReadyMatch`
- Add `const tournamentHook = useTournament();` inside the component
- After the header `<div>` with USB/status badges, insert `<TournamentHeader>` if tournament is active
- After `MATCH_END` status, detect winner and call `tournamentHook.recordMatchResult()`
- Add `<NextMatchBar>` between EventLog and OperatorPanel when status is `MATCH_END` and tournament is active
- Add `handleNextMatch` function that: gets next match from tournament, calls `sync.saveConfig()` with the next athletes pre-filled
- Add `handleOverrideWinner` with a simple dialog

The implementation details for each integration point are in the code — too large to include inline but the pattern follows the existing code style exactly.

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 10: Modify ChampionshipTV — Bracket/Scoreboard Toggle

**Files:**
- Modify: `src/pages/ChampionshipTV.tsx`

**Step 1: Add bracket display between fights**

Key changes to ChampionshipTV:
1. Import `useTournament`, `BracketView`, and type imports
2. Listen for typed BroadcastChannel messages (`SHOW_BRACKET`, `SHOW_SCOREBOARD`, `TOURNAMENT_UPDATE`)
3. Add state: `tvMode: 'scoreboard' | 'bracket'` and `bracketCategoryId`
4. When `SHOW_BRACKET` message received → switch to bracket view
5. When `SHOW_SCOREBOARD` or match starts → switch back to scoreboard
6. Auto-detect: when `state.status === 'IDLE'` and tournament active → show bracket

The TV component will conditionally render either the existing scoreboard JSX or `<BracketView>` based on `tvMode`.

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 11: Update AppChampionship — Add Tournament Route

**Files:**
- Modify: `src/AppChampionship.tsx`

**Step 1: Add the tournament setup route and smart redirect**

```typescript
// Add import at top
import TournamentSetup from "./pages/TournamentSetup";

// In Routes, add before the wildcard route:
<Route path="/championship/tournament" element={<TournamentSetup />} />

// Change the wildcard redirect to be smart:
// If tournament exists and is IN_PROGRESS → go to mat
// Otherwise → go to mat (user navigates to tournament from there)
<Route path="*" element={<Navigate to="/championship/mat" replace />} />
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

---

### Task 12: Full Build Verification

**Step 1: Type check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

**Step 2: Build championship**

Run: `npm run build:championship`
Expected: Build succeeds, output in `dist-championship/`

**Step 3: Dev smoke test**

Run: `npm run electron:dev:championship`
Expected:
- App opens
- Navigate to `/championship/tournament`
- Create a tournament, add a category, add 4 athletes, generate bracket
- Start tournament → redirects to Mat with first fight loaded
- Complete a fight → winner advances
- Open TV → bracket shows between fights

**Step 4: Build installer**

Run: `npm run electron:build:championship`
Expected: `release-championship/SPE-Sulsport-Setup-*.exe` created successfully
