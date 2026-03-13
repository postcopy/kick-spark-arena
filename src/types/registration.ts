// Academy Registration System Types

// ─── Supabase Table Interfaces ───────────────────────────────────────────────

export interface OpenTournament {
  id: string;
  name: string;
  date: string;
  location: string;
  registration_deadline: string;
  fee_amount: number;
  fee_instructions: string;
  status: 'open' | 'closed';
  created_by: string;
  created_at: string;
}

export interface AcademyCoach {
  id: string;
  academy_name: string;
  coach_name: string;
  phone: string;
  created_at: string;
}

export interface AcademyAthlete {
  id: string;
  coach_id: string;
  name: string;
  birth_date: string;
  gender: 'M' | 'F';
  belt: string;
  created_at: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  coach_id: string;
  status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'paid';
  submitted_at: string;
  reviewed_at: string | null;
}

export interface RegistrationAthlete {
  id: string;
  registration_id: string;
  athlete_id: string;
  weight: number;
  belt: string;
  category: string | null;
  reviewed_by_coach: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const BELT_ORDER = ['branca', 'amarela', 'verde', 'azul', 'vermelha', 'preta'] as const;

export const AGE_CATEGORIES = [
  { name: 'Mirim', minAge: 4, maxAge: 6 },
  { name: 'Infantil', minAge: 7, maxAge: 10 },
  { name: 'Infanto-Juvenil', minAge: 11, maxAge: 14 },
  { name: 'Juvenil', minAge: 15, maxAge: 17 },
  { name: 'Adulto', minAge: 18, maxAge: 34 },
  { name: 'Master', minAge: 35, maxAge: 99 },
] as const;

// ─── Registration Step Type ──────────────────────────────────────────────────

export type RegistrationStep = 'identification' | 'athletes' | 'review' | 'confirmation';

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Calculate age from a birth date relative to a reference date.
 * Both dates should be in ISO format (YYYY-MM-DD).
 */
export function calculateAge(birthDate: string, referenceDate: string): number {
  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);

  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate the full category string for an athlete based on their
 * birth date, gender, belt, weight, and the tournament date.
 *
 * Returns a string like "Infantil / M / amarela / 45kg"
 */
export function calculateCategory(
  birthDate: string,
  gender: 'M' | 'F',
  belt: string,
  weight: number,
  tournamentDate: string,
): string {
  const age = calculateAge(birthDate, tournamentDate);

  const ageCategory = AGE_CATEGORIES.find(
    (cat) => age >= cat.minAge && age <= cat.maxAge,
  );

  const ageName = ageCategory ? ageCategory.name : 'Adulto';
  const beltLower = belt.toLowerCase();

  return `${ageName} / ${gender} / ${beltLower} / ${weight}kg`;
}
