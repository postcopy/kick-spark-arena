import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  OpenTournament,
  AcademyCoach,
  AcademyAthlete,
  TournamentRegistration,
  RegistrationAthlete,
} from '@/types/registration';
import { calculateCategory } from '@/types/registration';

export function useRegistration() {
  const [tournament, setTournament] = useState<OpenTournament | null>(null);
  const [coach, setCoach] = useState<AcademyCoach | null>(null);
  const [savedAthletes, setSavedAthletes] = useState<AcademyAthlete[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load tournament by ID (must be open) ──────────────────────────────────

  const loadTournament = useCallback(async (tournamentId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('open_tournaments' as any)
        .select('*')
        .eq('id', tournamentId)
        .eq('status', 'open')
        .single();

      if (dbError) {
        setError('Torneio nao encontrado ou inscricoes encerradas.');
        return false;
      }

      setTournament(data as unknown as OpenTournament);
      return true;
    } catch (err) {
      setError('Erro ao carregar torneio. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Identify coach by phone (or create new) ──────────────────────────────

  const identifyCoach = useCallback(
    async (
      phone: string,
      academyName: string,
      coachName: string,
    ): Promise<AcademyCoach | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to find existing coach by phone
        const { data: existing, error: findError } = await supabase
          .from('academy_coaches' as any)
          .select('*')
          .eq('phone', phone)
          .single();

        if (!findError && existing) {
          const coachData = existing as unknown as AcademyCoach;
          setCoach(coachData);
          return coachData;
        }

        // Create new coach
        const { data: created, error: createError } = await supabase
          .from('academy_coaches' as any)
          .insert({
            phone,
            academy_name: academyName,
            coach_name: coachName,
          } as any)
          .select()
          .single();

        if (createError) {
          setError('Erro ao registrar treinador. Tente novamente.');
          return null;
        }

        const coachData = created as unknown as AcademyCoach;
        setCoach(coachData);
        return coachData;
      } catch (err) {
        setError('Erro ao identificar treinador. Tente novamente.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Load saved athletes for a coach ───────────────────────────────────────

  const loadAthletes = useCallback(async (coachId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('academy_athletes' as any)
        .select('*')
        .eq('coach_id', coachId)
        .order('name');

      if (dbError) {
        setError('Erro ao carregar atletas.');
        return;
      }

      setSavedAthletes((data ?? []) as unknown as AcademyAthlete[]);
    } catch (err) {
      setError('Erro ao carregar atletas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Add a new athlete ─────────────────────────────────────────────────────

  const addAthlete = useCallback(
    async (
      athlete: Omit<AcademyAthlete, 'id' | 'created_at'>,
      coachId: string,
    ): Promise<AcademyAthlete | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: dbError } = await supabase
          .from('academy_athletes' as any)
          .insert({
            coach_id: coachId,
            name: athlete.name,
            birth_date: athlete.birth_date,
            gender: athlete.gender,
            belt: athlete.belt,
          } as any)
          .select()
          .single();

        if (dbError) {
          setError('Erro ao adicionar atleta.');
          return null;
        }

        const newAthlete = data as unknown as AcademyAthlete;
        setSavedAthletes((prev) => [...prev, newAthlete]);
        return newAthlete;
      } catch (err) {
        setError('Erro ao adicionar atleta. Tente novamente.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Update an existing athlete ────────────────────────────────────────────

  const updateAthlete = useCallback(
    async (
      athleteId: string,
      updates: Partial<Pick<AcademyAthlete, 'name' | 'birth_date' | 'gender' | 'belt'>>,
    ): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const { error: dbError } = await supabase
          .from('academy_athletes' as any)
          .update(updates as any)
          .eq('id', athleteId);

        if (dbError) {
          setError('Erro ao atualizar atleta.');
          return false;
        }

        setSavedAthletes((prev) =>
          prev.map((a) => (a.id === athleteId ? { ...a, ...updates } : a)),
        );
        return true;
      } catch (err) {
        setError('Erro ao atualizar atleta. Tente novamente.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Submit full registration ──────────────────────────────────────────────

  const submitRegistration = useCallback(
    async (
      tournamentId: string,
      coachId: string,
      athletes: Array<{
        athlete_id: string;
        weight: number;
        belt: string;
        birth_date: string;
        gender: 'M' | 'F';
      }>,
    ): Promise<string | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Create the registration header
        const { data: registration, error: regError } = await supabase
          .from('tournament_registrations' as any)
          .insert({
            tournament_id: tournamentId,
            coach_id: coachId,
            status: 'pending',
            payment_status: 'pending',
          } as any)
          .select()
          .single();

        if (regError) {
          // Handle unique constraint violation (duplicate registration)
          if (regError.code === '23505') {
            setError('Voce ja possui uma inscricao para este torneio.');
            return null;
          }
          setError('Erro ao criar inscricao. Tente novamente.');
          return null;
        }

        const reg = registration as unknown as TournamentRegistration;

        // 2. Build registration athletes with calculated categories
        const tournamentDate = tournament?.date ?? new Date().toISOString().split('T')[0];

        const athleteRows = athletes.map((a) => ({
          registration_id: reg.id,
          athlete_id: a.athlete_id,
          weight: a.weight,
          belt: a.belt,
          category: calculateCategory(a.birth_date, a.gender, a.belt, a.weight, tournamentDate),
          reviewed_by_coach: false,
        }));

        const { error: athError } = await supabase
          .from('registration_athletes' as any)
          .insert(athleteRows as any);

        if (athError) {
          setError('Erro ao registrar atletas. Tente novamente.');
          return null;
        }

        return reg.id;
      } catch (err) {
        setError('Erro ao enviar inscricao. Tente novamente.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [tournament],
  );

  return {
    // State
    tournament,
    coach,
    savedAthletes,
    isLoading,
    error,

    // Actions
    loadTournament,
    identifyCoach,
    loadAthletes,
    addAthlete,
    updateAthlete,
    submitRegistration,
  };
}
