import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';
import type { Json } from '@/integrations/supabase/types';

interface SaveSessionParams {
  athleteId: string;
  mode: string;
  avgScore: number | null;
  bestScore: number | null;
  details: Record<string, unknown>;
}

export function useTrainingSessions() {
  const { user } = useAuth();

  const saveSession = useCallback(
    async (params: SaveSessionParams) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('training_sessions')
        .insert([{
          athlete_id: params.athleteId,
          academy_id: user.id,
          mode: params.mode,
          avg_score: params.avgScore,
          best_score: params.bestScore,
          details: params.details as unknown as Json,
        }])
        .select()
        .single();

      if (error) {
        console.error('Failed to save training session:', error);
        return null;
      }
      return data;
    },
    [user],
  );

  const getAthleteHistory = useCallback(
    async (athleteId: string, since?: Date) => {
      if (!user) return [];
      let query = supabase
        .from('training_sessions')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('academy_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (since) {
        query = query.gte('created_at', since.toISOString());
      }

      const { data } = await query;
      return data || [];
    },
    [user],
  );

  return { saveSession, getAthleteHistory };
}
