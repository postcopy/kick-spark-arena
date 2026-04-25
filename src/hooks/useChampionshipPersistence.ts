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
  // UI-AUDIT R10-H5: rastreia ID do ultimo evento persistido em vez de count.
  // Eventos sao prepended com cap MAX_EVENTS=500 — uma vez no cap, length para
  // de crescer e o effect (deps em events.length) NUNCA mais dispara, mesmo
  // com novos eventos chegando. Audit trail vazava silenciosamente apos 500
  // eventos. ID rastreia identidade real, nao tamanho do array.
  const lastPersistedEventIdRef = useRef<string | null>(null);
  const prevStatusRef = useRef(state.status);
  const prevHasConfigRef = useRef(state.hasConfig);
  const matchStartedRef = useRef(false); // tracks if RUNNING was ever reached
  // UI-AUDIT R8-H8: stateRef pra ler round atual dentro do persistEvents.
  // Sem isso, closure captura state.round velho quando eventos chegam junto
  // de transicao de round (ex: GAMJEOM antes do BREAK_TIME) — audit trail
  // grava round errado no DB.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

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
      lastPersistedEventIdRef.current = null;
      console.log('[ChampPersist] Match created:', data.id);
    } catch (err) {
      console.error('[ChampPersist] Error creating match:', err);
    }
  }, [user, state.config, state.status]);

  // Create match record when config is saved (hasConfig transitions to true)
  useEffect(() => {
    if (!user) return;
    if (state.hasConfig && !prevHasConfigRef.current) {
      createMatch().catch(err => console.error('[ChampPersist] Unhandled error in createMatch:', err));
    }
    prevHasConfigRef.current = state.hasConfig;
  }, [state.hasConfig, user, createMatch]);

  // Persist new events as they appear (events are prepended — newest first).
  // R10-H5: rastreia por ID. Itera do topo (newest) ate achar o ultimo
  // persistido. Tudo antes (= mais novo) precisa persistir. Robusto contra:
  // - cap MAX_EVENTS (length estavel mas conteudo muda)
  // - undo (eventos some do array, ID antigo nao acha — re-sincroniza)
  // - reset/createMatch (lastPersistedEventIdRef volta pra null)
  // Deps: events[0]?.id (mudou = novo prepend) + length (cobre undo/cap).
  useEffect(() => {
    if (!matchDbIdRef.current) return;
    if (state.events.length === 0) return;

    const lastId = lastPersistedEventIdRef.current;
    let newEvents: MatchEvent[];

    if (lastId === null) {
      // Nada persistido ainda — persiste tudo no buffer atual.
      newEvents = [...state.events];
    } else {
      const idx = state.events.findIndex(e => e.id === lastId);
      if (idx === -1) {
        // ID sumiu (undo eliminou ele OU caiu fora do cap MAX_EVENTS).
        // Conservador: persiste o buffer todo de novo seria duplicar; em vez
        // disso pula esta passada e re-sincroniza no proximo evento novo.
        // Atualiza para o evento topo atual pra evitar loop.
        lastPersistedEventIdRef.current = state.events[0].id;
        return;
      }
      // idx=0 significa nada novo (topo ja persistido).
      if (idx === 0) return;
      newEvents = state.events.slice(0, idx);
    }

    lastPersistedEventIdRef.current = state.events[0].id;
    persistEvents(matchDbIdRef.current, newEvents);
  }, [state.events]);

  const persistEvents = async (matchId: string, events: MatchEvent[]) => {
    try {
      // UI-AUDIT R8-H8: le round via stateRef pra evitar closure stale.
      // Eventos prepended (newest first) sao do round atual (ou de transicao
      // recente). Le round no momento da chamada, nao no momento do effect.
      const currentRound = parseInt(String(stateRef.current.round)) || 1;
      const rows = events.map(e => ({
        match_id: matchId,
        event_type: e.type,
        side: e.side || null,
        points: e.points || 0,
        round: currentRound,
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

    if (state.status === 'RUNNING' && !matchStartedRef.current) {
      matchStartedRef.current = true;
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
      lastPersistedEventIdRef.current = null;
      matchStartedRef.current = false;
    }
  }, [state.hasConfig]);

  return { matchDbId: matchDbIdRef.current };
}
