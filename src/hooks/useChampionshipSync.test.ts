/**
 * @vitest-environment jsdom
 *
 * Testes do state machine do useChampionshipSync contra o estado atual do master.
 * NAO testa regras WT 2026 que nao estao implementadas ainda nesse branch.
 *
 * Cobertura:
 * - Lifecycle: IDLE → RUNNING → PAUSED → ROUND_END → MATCH_END
 * - Pontuacao basica
 * - Gam-jeom
 * - Undo
 * - Reset
 * - Persistence (localStorage)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      upsert: () => ({
        then: (cb: (r: { error: null }) => void) => { cb({ error: null }); return { catch: () => {} }; },
      }),
      delete: () => ({ eq: () => ({ eq: () => ({}) }) }),
      select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
    }),
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { log: () => {}, warn: () => {}, error: () => {} },
}));
vi.mock('./useRealtimeSync', () => ({
  useRealtimeSync: () => ({ send: () => {}, isConnected: true, connectedDevices: 1 }),
}));

class FakeBroadcastChannel {
  name: string;
  onmessage: ((e: MessageEvent) => void) | null = null;
  constructor(name: string) { this.name = name; }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}
(globalThis as unknown as { BroadcastChannel: typeof FakeBroadcastChannel }).BroadcastChannel = FakeBroadcastChannel;

const store: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  length: 0, key: () => null,
} as Storage;

if (!(globalThis as { crypto?: Crypto }).crypto) {
  (globalThis as { crypto: Partial<Crypto> }).crypto = {
    randomUUID: () => Math.random().toString(36).slice(2) as `${string}-${string}-${string}-${string}-${string}`,
  };
} else if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as { randomUUID: () => string }).randomUUID = () => Math.random().toString(36).slice(2);
}

// ─── Setup ────────────────────────────────────────────────────────────────
import { useChampionshipSync } from './useChampionshipSync';
import { DEFAULT_MATCH_CONFIG } from '@/types/championship';

function createMaster() {
  const hook = renderHook(() => useChampionshipSync({
    role: 'master',
    matId: 1,
    academyId: 'test-academy-id',
  }));
  act(() => { hook.result.current.saveConfig({ ...DEFAULT_MATCH_CONFIG, matId: 1 }); });
  return hook;
}

// ═══════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════

describe('State Machine — Lifecycle', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('IDLE inicial ao montar sem config', () => {
    const hook = renderHook(() => useChampionshipSync({
      role: 'master',
      matId: 1,
      academyId: 'test-academy-id',
    }));
    expect(hook.result.current.state.status).toBe('IDLE');
    expect(hook.result.current.state.hasConfig).toBe(false);
  });

  it('saveConfig muda hasConfig para true', () => {
    const hook = renderHook(() => useChampionshipSync({
      role: 'master',
      matId: 1,
      academyId: 'test-academy-id',
    }));
    expect(hook.result.current.state.hasConfig).toBe(false);
    act(() => { hook.result.current.saveConfig({ ...DEFAULT_MATCH_CONFIG, matId: 1 }); });
    expect(hook.result.current.state.hasConfig).toBe(true);
  });

  it('startTimer exige hasConfig=true', () => {
    const hook = renderHook(() => useChampionshipSync({
      role: 'master',
      matId: 1,
      academyId: 'test-academy-id',
    }));
    // Sem config — startTimer ignorado
    act(() => { hook.result.current.startTimer(); });
    expect(hook.result.current.state.status).toBe('IDLE');
  });

  it('IDLE → RUNNING via startTimer', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    expect(hook.result.current.state.status).toBe('RUNNING');
  });

  it('RUNNING → PAUSED via pauseTimer', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.pauseTimer(); });
    expect(hook.result.current.state.status).toBe('PAUSED');
  });

  it('PAUSED → RUNNING via startTimer (resume)', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.pauseTimer(); });
    act(() => { hook.result.current.startTimer(); });
    expect(hook.result.current.state.status).toBe('RUNNING');
  });
});

describe('State Machine — Pontuação básica', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('addScore em status IDLE é IGNORADO', () => {
    const hook = createMaster();
    expect(hook.result.current.state.status).toBe('IDLE');
    act(() => { hook.result.current.addScore('BLUE', 'BODY'); });
    // score nao mudou
    expect(hook.result.current.state.roundScoreBlue).toBe(0);
  });

  it('addScore em PAUSED é IGNORADO', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.pauseTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'BODY'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(0);
  });

  it('addScore em RUNNING incrementa placar', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'BODY'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(2);
  });

  it('SOCO=1, CORPO=2, CABECA=3 (defaults atuais)', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'PUNCH'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(1);
    act(() => { hook.result.current.addScore('BLUE', 'BODY'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(3);
    act(() => { hook.result.current.addScore('BLUE', 'HEAD'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(6);
  });

  it('addScore em BLUE nao afeta RED', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'HEAD'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(3);
    expect(hook.result.current.state.roundScoreRed).toBe(0);
  });

  it('event log registra pontuacao', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'BODY'); });
    const events = hook.result.current.state.events;
    const scoreEvent = events.find(e => e.type === 'BODY');
    expect(scoreEvent).toBeDefined();
    expect(scoreEvent?.points).toBe(2);
    expect(scoreEvent?.side).toBe('BLUE');
  });
});

describe('State Machine — Gam-jeom', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('gam-jeom em RED da +1 ponto ao AZUL', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addGamjeom('RED'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(1);
    expect(hook.result.current.state.gamjeomRed).toBe(1);
  });

  it('gam-jeom auto-pausa o timer (RUNNING → PAUSED)', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    expect(hook.result.current.state.status).toBe('RUNNING');
    act(() => { hook.result.current.addGamjeom('RED'); });
    expect(hook.result.current.state.status).toBe('PAUSED');
  });

  it('removeGamjeom decrementa contador e remove ponto cedido', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addGamjeom('RED'); });
    expect(hook.result.current.state.gamjeomRed).toBe(1);
    expect(hook.result.current.state.roundScoreBlue).toBe(1);

    act(() => { hook.result.current.removeGamjeom('RED'); });
    expect(hook.result.current.state.gamjeomRed).toBe(0);
    expect(hook.result.current.state.roundScoreBlue).toBe(0);
  });

  it('5 gam-jeom acumulados nao encerram a luta (limite default 10)', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    for (let i = 0; i < 5; i++) {
      act(() => { hook.result.current.addGamjeom('RED'); });
    }
    expect(hook.result.current.state.gamjeomRed).toBe(5);
    expect(hook.result.current.state.status).not.toBe('MATCH_END');
  });
});

describe('State Machine — Undo', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('canUndo=false sem historico', () => {
    const hook = createMaster();
    expect(hook.result.current.canUndo).toBe(false);
  });

  it('Undo desfaz pontuacao', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'HEAD'); });
    expect(hook.result.current.state.roundScoreBlue).toBe(3);
    expect(hook.result.current.canUndo).toBe(true);

    act(() => { hook.result.current.undoLast(); });
    expect(hook.result.current.state.roundScoreBlue).toBe(0);
  });

  it('Undo desfaz gam-jeom', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addGamjeom('RED'); });
    expect(hook.result.current.state.gamjeomRed).toBe(1);
    expect(hook.result.current.state.roundScoreBlue).toBe(1);

    act(() => { hook.result.current.undoLast(); });
    expect(hook.result.current.state.gamjeomRed).toBe(0);
    expect(hook.result.current.state.roundScoreBlue).toBe(0);
  });
});

describe('State Machine — Reset', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('resetMatch zera placar mas mantem config', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'HEAD'); });
    act(() => { hook.result.current.addScore('RED', 'BODY'); });

    act(() => { hook.result.current.resetMatch(); });
    expect(hook.result.current.state.roundScoreBlue).toBe(0);
    expect(hook.result.current.state.roundScoreRed).toBe(0);
    expect(hook.result.current.state.round).toBe(1);
    expect(hook.result.current.state.hasConfig).toBe(true); // config preservada
  });
});

describe('State Machine — Point gap automático', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('gap default encerra round automaticamente', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    // Default pointGap. Precisa ultrapassar pra terminar round.
    const gap = hook.result.current.state.config.pointGap;
    const hits = Math.ceil(gap / 3); // CABECA = 3 pts
    for (let i = 0; i < hits; i++) {
      act(() => { hook.result.current.addScore('BLUE', 'HEAD'); });
    }
    // Round deve ter encerrado
    expect(hook.result.current.state.status).not.toBe('RUNNING');
  });
});

describe('State Machine — Persistencia (localStorage)', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('saveConfig persiste em localStorage', () => {
    const hook = createMaster();
    const hasConfig = Object.keys(store).some(k => k.includes('config-mat'));
    expect(hasConfig).toBe(true);
  });

  it('mudancas de estado persistem em localStorage', () => {
    const hook = createMaster();
    act(() => { hook.result.current.startTimer(); });
    act(() => { hook.result.current.addScore('BLUE', 'HEAD'); });

    const stateKey = Object.keys(store).find(k => k.includes('state-mat'));
    expect(stateKey).toBeDefined();
    if (stateKey) {
      const saved = JSON.parse(store[stateKey]);
      expect(saved.roundScoreBlue).toBe(3);
    }
  });
});
