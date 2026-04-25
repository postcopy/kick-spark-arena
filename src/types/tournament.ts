// Tournament Bracket System Types

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
  /** Seed used to generate the bracket — enables reproducing the original draw for audits/disputes. */
  bracketSeed?: number;
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
  matAssignments: Record<number, string[]>; // mat number → category IDs
}

// localStorage key
export const TOURNAMENT_STORAGE_KEY = 'sulsport:tournament';

// Age group options
export const AGE_GROUPS = ['Infantil', 'Cadete', 'Juvenil', 'Sub-21', 'Adulto', 'Master'] as const;

// Belt options
export const BELTS = ['Branca', 'Amarela', 'Verde', 'Azul', 'Vermelha', 'Preta'] as const;

// Weight class options
export const WEIGHT_CLASSES = [
  'Até 45kg', 'Até 48kg', 'Até 51kg', 'Até 54kg', 'Até 57kg',
  'Até 58kg', 'Até 61kg', 'Até 63kg', 'Até 67kg', 'Até 68kg',
  'Até 73kg', 'Até 74kg', 'Até 80kg', 'Até 87kg', 'Acima de 87kg',
] as const;
