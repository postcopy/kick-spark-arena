// Tournament State Management Hook

import { useState, useCallback } from 'react';
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
  resetMatchAndDescendants,
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
  const [tournamentState, setTournamentInternal] = useState<Tournament | null>(loadTournament);

  // Synchronous persist: write through inside the setter so localStorage is updated
  // BEFORE React commits the state change. Prevents bracket corruption if the app
  // crashes (Electron force-close, browser kill) between setState and effect flush.
  const setTournament = useCallback<typeof setTournamentInternal>((updater) => {
    setTournamentInternal(prev => {
      const next = typeof updater === 'function'
        ? (updater as (p: Tournament | null) => Tournament | null)(prev)
        : updater;
      try { saveTournament(next); } catch (e) { /* localStorage quota / private mode — non-fatal */ }
      return next;
    });
  }, []);

  const tournament = tournamentState;

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
      matAssignments: {},
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

      const seed = (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
      const bracket = generateBracket(cat.athletes, categoryId, prev.globalMatchCounter, seed);

      return {
        ...prev,
        globalMatchCounter: prev.globalMatchCounter + bracket.length,
        categories: prev.categories.map(c =>
          c.id === categoryId ? { ...c, bracket, bracketSeed: seed } : c
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
        const seed = (Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
        const bracket = generateBracket(cat.athletes, cat.id, counter, seed);
        counter += bracket.length;
        return { ...cat, bracket, bracketSeed: seed };
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
    // Reset descendants first so the previous winner is removed from later matches,
    // then advance the new winner. Without the cascade reset, the bracket would
    // keep the old winner in subsequent matches and produce inconsistent state.
    setTournament(prev => {
      if (!prev) return prev;
      const updatedCategories = prev.categories.map(cat => {
        if (cat.id !== categoryId) return cat;
        const reset = resetMatchAndDescendants(cat.bracket, matchId);
        const advanced = advanceWinnerInBracket(reset, matchId, newWinnerSide);
        const finished = isCategoryFinished(advanced);
        return {
          ...cat,
          bracket: advanced,
          status: finished ? 'FINISHED' as const : 'IN_PROGRESS' as const,
        };
      });
      const allFinished = updatedCategories.every(c => c.bracket.length === 0 || c.status === 'FINISHED');
      return {
        ...prev,
        categories: updatedCategories,
        status: allFinished ? 'FINISHED' : prev.status,
      };
    });
  }, []);

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

  const assignCategoryToMat = useCallback((matNumber: number, categoryId: string) => {
    setTournament(prev => {
      if (!prev) return prev;
      const current = prev.matAssignments[matNumber] || [];
      if (current.includes(categoryId)) return prev;
      return {
        ...prev,
        matAssignments: {
          ...prev.matAssignments,
          [matNumber]: [...current, categoryId],
        },
      };
    });
  }, []);

  const unassignCategoryFromMat = useCallback((matNumber: number, categoryId: string) => {
    setTournament(prev => {
      if (!prev) return prev;
      const current = prev.matAssignments[matNumber] || [];
      return {
        ...prev,
        matAssignments: {
          ...prev.matAssignments,
          [matNumber]: current.filter(id => id !== categoryId),
        },
      };
    });
  }, []);

  const getCategoriesForMat = useCallback((matNumber: number): Category[] => {
    if (!tournament) return [];
    const ids = tournament.matAssignments[matNumber] || [];
    return tournament.categories.filter(c => ids.includes(c.id));
  }, [tournament]);

  const getNextMatchForMat = useCallback((matNumber: number): { category: Category; match: BracketMatch } | null => {
    if (!tournament) return null;
    const ids = tournament.matAssignments[matNumber] || [];
    for (const cat of tournament.categories) {
      if (!ids.includes(cat.id)) continue;
      const match = getNextReadyMatch(cat.bracket);
      if (match) return { category: cat, match };
    }
    return null;
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
    assignCategoryToMat,
    unassignCategoryFromMat,
    getCategoriesForMat,
    getNextMatchForMat,
  };
}
