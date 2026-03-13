import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MatchState, MatchEvent } from '@/types/championship';

/**
 * Persists championship match state and events to the database.
 * Runs fire-and-forget inserts to avoid blocking the UI.
 */
export function useChampionshipPersistence(state: MatchState) {
  const { user } = useAuth();
  const matchDbIdRef = useRef<string | null>(null);
  const lastPersistedEventsCount = useRef(0);
  const prevStatusRef = useRef(state.status);
  const prevHasConfigRef = useRef(state.hasConfig);

  // Create match record when config is saved (hasConfig transitions to true)
  useEffect(() => {
    if (!user) return;
    if (state.hasConfig && !prevHasConfigRef.current) {
      createMatch();
    }
    prevHasConfigRef.current = state.hasConfig;
  }, [state.hasConfig, user]);

  const createMatch = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('championship_matches')
        .insert({
          academy_id: user.id,
          match_number: state.config.matchNumber || null,
          mat_id: state.config.matId,
          config: state.config as any,
          status: state.status,
          red_athlete_name: state.config.athleteRed?.name || null,
          blue_athlete_name: state.config.athleteBlue?.name || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[ChampPersist] Failed to create match:', error.message);
        return;
      }
      matchDbIdRef.current = data.id;
      lastPersistedEventsCount.current = 0;
      console.log('[ChampPersist] Match created:', data.id);
    } catch (err) {
      console.error('[ChampPersist] Error creating match:', err);
    }
  }, [user, state.config, state.status]);

  // Persist new events as they appear
  useEffect(() => {
    if (!matchDbIdRef.current) return;
    const newEvents = state.events.slice(lastPersistedEventsCount.current);
    if (newEvents.length === 0) return;

    lastPersistedEventsCount.current = state.events.length;
    persistEvents(matchDbIdRef.current, newEvents);
  }, [state.events.length]);

  const persistEvents = async (matchId: string, events: MatchEvent[]) => {
    try {
      const rows = events.map(e => ({
        match_id: matchId,
        event_type: e.type,
        side: e.side || null,
        points: e.points || 0,
        round: parseInt(String(state.round)) || 1,
        description: e.description,
        ts: e.ts,
      }));

      const { error } = await supabase
        .from('championship_events')
        .insert(rows);

      if (error) {
        console.error('[ChampPersist] Failed to persist events:', error.message);
      }
    } catch (err) {
      console.error('[ChampPersist] Error persisting events:', err);
    }
  };

  // Update match status on transitions (RUNNING, MATCH_END, etc.)
  useEffect(() => {
    if (!matchDbIdRef.current) return;
    if (state.status === prevStatusRef.current) return;
    prevStatusRef.current = state.status;

    const updates: Record<string, any> = {
      status: state.status,
      red_round_wins: state.roundWinsRed,
      blue_round_wins: state.roundWinsBlue,
    };

    if (state.status === 'RUNNING' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    }

    if (state.status === 'MATCH_END') {
      updates.ended_at = new Date().toISOString();
      if (state.roundWinsRed > state.roundWinsBlue) {
        updates.winner_side = 'RED';
      } else if (state.roundWinsBlue > state.roundWinsRed) {
        updates.winner_side = 'BLUE';
      }
    }

    supabase
      .from('championship_matches')
      .update(updates)
      .eq('id', matchDbIdRef.current)
      .then(({ error }) => {
        if (error) console.error('[ChampPersist] Failed to update match status:', error.message);
      });
  }, [state.status, state.roundWinsRed, state.roundWinsBlue]);

  // Reset on match reset (when hasConfig goes back to false)
  useEffect(() => {
    if (!state.hasConfig && prevHasConfigRef.current) {
      matchDbIdRef.current = null;
      lastPersistedEventsCount.current = 0;
    }
  }, [state.hasConfig]);

  return { matchDbId: matchDbIdRef.current };
}
