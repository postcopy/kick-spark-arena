import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  OpenTournament,
  TournamentRegistration,
  AcademyCoach,
  RegistrationAthlete,
  AcademyAthlete,
} from '@/types/registration';

export interface RegistrationWithDetails extends TournamentRegistration {
  coach: AcademyCoach;
  athletes: (RegistrationAthlete & { athlete: AcademyAthlete })[];
}

export function useOpenTournaments(userId: string | undefined) {
  const [tournaments, setTournaments] = useState<OpenTournament[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadTournaments() {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('open_tournaments')
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      setTournaments((data as unknown as OpenTournament[]) ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  async function createTournament(
    tournament: Omit<OpenTournament, 'id' | 'created_by' | 'created_at'>,
  ): Promise<OpenTournament | null> {
    if (!userId) return null;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('open_tournaments')
        .insert({ ...tournament, created_by: userId } as unknown as Record<string, unknown>)
        .select()
        .single();

      if (error) throw error;
      const newTournament = data as unknown as OpenTournament;
      setTournaments((prev) => [newTournament, ...prev]);
      return newTournament;
    } finally {
      setIsLoading(false);
    }
  }

  async function closeTournament(tournamentId: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('open_tournaments')
        .update({ status: 'closed' } as unknown as Record<string, unknown>)
        .eq('id', tournamentId);

      if (error) throw error;
      setTournaments((prev) =>
        prev.map((t) => (t.id === tournamentId ? { ...t, status: 'closed' as const } : t)),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRegistrations(tournamentId: string) {
    setIsLoading(true);
    try {
      // 1. Load registrations with joined coach data
      const { data: regData, error: regError } = await supabase
        .from('tournament_registrations')
        .select('*, academy_coaches(*)')
        .eq('tournament_id', tournamentId);

      if (regError) throw regError;

      const rawRegs = (regData as unknown as (TournamentRegistration & { academy_coaches: AcademyCoach })[]) ?? [];

      if (rawRegs.length === 0) {
        setRegistrations([]);
        return;
      }

      const regIds = rawRegs.map((r) => r.id);

      // 2. Load registration athletes with joined athlete data
      const { data: athData, error: athError } = await supabase
        .from('registration_athletes')
        .select('*, academy_athletes(*)')
        .in('registration_id', regIds);

      if (athError) throw athError;

      const rawAthletes = (athData as unknown as (RegistrationAthlete & { academy_athletes: AcademyAthlete })[]) ?? [];

      // 3. Map them together
      const mapped: RegistrationWithDetails[] = rawRegs.map((reg) => {
        const { academy_coaches, ...registration } = reg;
        const athletes = rawAthletes
          .filter((a) => a.registration_id === reg.id)
          .map(({ academy_athletes, ...rest }) => ({
            ...rest,
            athlete: academy_athletes,
          }));

        return {
          ...registration,
          coach: academy_coaches,
          athletes,
        };
      });

      setRegistrations(mapped);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateRegistrationStatus(registrationId: string, status: TournamentRegistration['status']) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ status, reviewed_at: new Date().toISOString() } as unknown as Record<string, unknown>)
        .eq('id', registrationId);

      if (error) throw error;
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === registrationId
            ? { ...r, status, reviewed_at: new Date().toISOString() }
            : r,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updatePaymentStatus(registrationId: string, paymentStatus: TournamentRegistration['payment_status']) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ payment_status: paymentStatus } as unknown as Record<string, unknown>)
        .eq('id', registrationId);

      if (error) throw error;
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === registrationId ? { ...r, payment_status: paymentStatus } : r,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function getRegistrationLink(tournamentId: string): string {
    return `${window.location.origin + window.location.pathname}#/register?t=${tournamentId}`;
  }

  return {
    tournaments,
    registrations,
    isLoading,
    loadTournaments,
    createTournament,
    closeTournament,
    loadRegistrations,
    updateRegistrationStatus,
    updatePaymentStatus,
    getRegistrationLink,
  };
}
