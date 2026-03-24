// ─── Category Presets for S-FIGHT PRO Festival Modes ───
// Quick-select presets by age group so instructors can configure
// all game parameters with a single tap during festivals.
// All values are DEFAULTS — the instructor can override any parameter.

export type CategoryId =
  | 'kids_a'
  | 'kids_b'
  | 'juvenil'
  | 'adulto'
  | 'avancado';

export interface CategoryPreset {
  id: CategoryId;
  label: string;
  ageRange: string;
  emoji: string;
  color: string; // Tailwind bg class
  debounceMs: number;
  timeAttack: {
    duration: number;
    frenzyThreshold: number;
  };
  duel: {
    hp: number;
    vestDamage: number;
    helmetDamage: number;
    bestOf: 1 | 3;
    roundTime: number;
    recovery: number;
  };
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'kids_a',
    label: 'Kids A',
    ageRange: '4-6 anos',
    emoji: '🐣',
    color: 'bg-green-500',
    debounceMs: 300,
    timeAttack: {
      duration: 15,
      frenzyThreshold: 5,
    },
    duel: {
      hp: 30,
      vestDamage: 2,
      helmetDamage: 3,
      bestOf: 1,
      roundTime: 20,
      recovery: 5,
    },
  },
  {
    id: 'kids_b',
    label: 'Kids B',
    ageRange: '7-9 anos',
    emoji: '🐥',
    color: 'bg-lime-500',
    debounceMs: 220,
    timeAttack: {
      duration: 30,
      frenzyThreshold: 10,
    },
    duel: {
      hp: 50,
      vestDamage: 2,
      helmetDamage: 3,
      bestOf: 1,
      roundTime: 30,
      recovery: 5,
    },
  },
  {
    id: 'juvenil',
    label: 'Juvenil',
    ageRange: '10-14 anos',
    emoji: '⚡',
    color: 'bg-yellow-500',
    debounceMs: 170,
    timeAttack: {
      duration: 45,
      frenzyThreshold: 10,
    },
    duel: {
      hp: 80,
      vestDamage: 1,
      helmetDamage: 2,
      bestOf: 1,
      roundTime: 45,
      recovery: 5,
    },
  },
  {
    id: 'adulto',
    label: 'Adulto',
    ageRange: '15-17 anos',
    emoji: '🔥',
    color: 'bg-orange-500',
    debounceMs: 140,
    timeAttack: {
      duration: 60,
      frenzyThreshold: 10,
    },
    duel: {
      hp: 100,
      vestDamage: 1,
      helmetDamage: 2,
      bestOf: 1,
      roundTime: 60,
      recovery: 5,
    },
  },
  {
    id: 'avancado',
    label: 'Avancado',
    ageRange: '18+ anos',
    emoji: '🏆',
    color: 'bg-red-500',
    debounceMs: 120,
    timeAttack: {
      duration: 90,
      frenzyThreshold: 10,
    },
    duel: {
      hp: 120,
      vestDamage: 1,
      helmetDamage: 2,
      bestOf: 1,
      roundTime: 60,
      recovery: 5,
    },
  },
];

/** Get a preset by its ID. Returns undefined if not found. */
export function getCategoryPreset(id: CategoryId): CategoryPreset | undefined {
  return CATEGORY_PRESETS.find((p) => p.id === id);
}

/** Get default (no category selected) debounce value */
export const DEFAULT_DEBOUNCE_MS = 150;
