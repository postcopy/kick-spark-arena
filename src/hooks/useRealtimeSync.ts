import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSyncOptions {
  matId: number;
  role: 'master' | 'listener';
  onMessage?: (event: string, payload: unknown) => void;
  enabled?: boolean;
}

interface UseRealtimeSyncReturn {
  send: (event: string, payload: unknown) => void;
  isConnected: boolean;
  connectedDevices: number;
}

// Unique device ID per browser session
function getDeviceId(): string {
  let id = sessionStorage.getItem('sfight-device-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('sfight-device-id', id);
  }
  return id;
}

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000; // 1s, then 2s, 4s, 8s, 16s

export function useRealtimeSync({
  matId,
  role,
  onMessage,
  enabled = true,
}: UseRealtimeSyncOptions): UseRealtimeSyncReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref fresh
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `mat-sync-${matId}`;
    const deviceId = getDeviceId();
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false; // tracks if cleanup has run

    function createAndSubscribe() {
      if (cancelled) return;

      logger.log(`[RealtimeSync] Creating channel "${channelName}" (attempt ${retryCount + 1})`);

      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } },
      });

      // Listen for broadcast messages
      channel.on('broadcast', { event: 'match-state' }, ({ payload }) => {
        onMessageRef.current?.('match-state', payload);
      });

      channel.on('broadcast', { event: 'show-bracket' }, ({ payload }) => {
        onMessageRef.current?.('show-bracket', payload);
      });

      channel.on('broadcast', { event: 'show-scoreboard' }, () => {
        onMessageRef.current?.('show-scoreboard', null);
      });

      // Presence tracking
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const count = Object.keys(presenceState).reduce(
          (sum, key) => sum + presenceState[key].length,
          0,
        );
        setConnectedDevices(count);
      });

      channel.subscribe(async (status, err) => {
        logger.log('[RealtimeSync] Channel status:', status, err || '');

        if (status === 'SUBSCRIBED') {
          retryCount = 0; // reset on success
          setIsConnected(true);
          try {
            await channel.track({ role, matId, deviceId });
          } catch (trackErr) {
            console.error('[RealtimeSync] Presence track failed:', trackErr);
          }
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          // CLOSED means the channel was intentionally removed — don't retry
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
          logger.warn(`[RealtimeSync] Channel ${status}:`, err || 'no details');

          // Clean up the failed channel before retrying
          try {
            supabase.removeChannel(channel);
          } catch { /* ignore cleanup errors */ }
          channelRef.current = null;

          // Retry with exponential backoff
          if (!cancelled && retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount - 1);
            logger.log(`[RealtimeSync] Retrying in ${delay}ms (attempt ${retryCount}/${MAX_RETRIES})`);
            retryTimer = setTimeout(createAndSubscribe, delay);
          } else if (!cancelled) {
            console.error(`[RealtimeSync] Giving up after ${MAX_RETRIES} retries`);
          }
        } else {
          // Unknown status — log it so we can diagnose
          logger.warn('[RealtimeSync] Unexpected status:', status, err);
          setIsConnected(false);
        }
      });

      channelRef.current = channel;
    }

    createAndSubscribe();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);

      const ch = channelRef.current;
      if (ch) {
        try {
          ch.untrack();
        } catch { /* channel may not have subscribed yet */ }
        supabase.removeChannel(ch);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [matId, role, enabled]);

  const send = useCallback((event: string, payload: unknown) => {
    channelRef.current?.send({
      type: 'broadcast',
      event,
      payload,
    });
  }, []);

  return { send, isConnected, connectedDevices };
}
