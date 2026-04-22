/**
 * Teste end-to-end do pipeline de pontuacao: sensor serial → score na UI.
 *
 * Simula cada etapa:
 * 1. Raw packet (deviceId, intensity) → ImpactDetector.feed()
 * 2. flush() gera FinalizedImpact
 * 3. Classification logic de ChampionshipMat (hitMin/pointMin/anti-dup)
 * 4. Decisao POINT/HIT/IGNORED/DUPLICATE/NOT_RUNNING
 *
 * Cada teste valida UM ponto de falha silenciosa.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ImpactDetector, type FinalizedImpact } from './impactDetector';

// ─── Replica da logica de classificacao de ChampionshipMat.handleImpact ───
// (extraida e testada aqui isoladamente pra nao depender de React)

type Decision = 'POINT' | 'HIT' | 'IGNORED' | 'DUPLICATE' | 'NOT_RUNNING' | 'INVALID_DEVICE';

interface Thresholds {
  vestHitMin: number;
  vestPointMin: number;
  helmetHitMin: number;
  helmetPointMin: number;
  noiseFloor: Record<string, number>;
}

interface ClassifyResult {
  decision: Decision;
  side: 'RED' | 'BLUE' | null;
  scoreType: 'BODY' | 'HEAD' | null;
  points: number;
}

function deviceIdToSide(deviceId: number): 'RED' | 'BLUE' | null {
  // Espelha src/lib/deviceMapping.ts
  switch (deviceId) {
    case 1: return 'BLUE';   // colete azul
    case 2: return 'RED';    // colete vermelho
    case 3: return 'BLUE';   // capacete azul
    case 4: return 'RED';    // capacete vermelho
    default: return null;
  }
}

function deviceIdToEquip(deviceId: number): 'vest' | 'helmet' | null {
  if (deviceId === 1 || deviceId === 2) return 'vest';
  if (deviceId === 3 || deviceId === 4) return 'helmet';
  return null;
}

function classifyImpact(
  impact: FinalizedImpact,
  thresholds: Thresholds,
  matchStatus: 'IDLE' | 'RUNNING' | 'PAUSED' | 'ROUND_END' | 'MATCH_END',
  lastAcceptedTs: Map<number, number>,
  antiDupMs: number = 300,
): ClassifyResult {
  if (matchStatus !== 'RUNNING') {
    return { decision: 'NOT_RUNNING', side: null, scoreType: null, points: 0 };
  }

  const side = deviceIdToSide(impact.deviceId);
  const equip = deviceIdToEquip(impact.deviceId);
  if (!side || !equip) {
    return { decision: 'INVALID_DEVICE', side: null, scoreType: null, points: 0 };
  }

  const isHelmet = equip === 'helmet';
  const hitMin = isHelmet ? thresholds.helmetHitMin : thresholds.vestHitMin;
  const pointMin = isHelmet ? thresholds.helmetPointMin : thresholds.vestPointMin;

  if (impact.peakIntensity < hitMin) {
    return { decision: 'IGNORED', side, scoreType: null, points: 0 };
  }

  const lastTs = lastAcceptedTs.get(impact.deviceId) ?? 0;
  if (impact.endTs - lastTs < antiDupMs) {
    return { decision: 'DUPLICATE', side, scoreType: null, points: 0 };
  }

  lastAcceptedTs.set(impact.deviceId, impact.endTs);

  if (impact.peakIntensity >= pointMin) {
    const scoreType = isHelmet ? 'HEAD' : 'BODY';
    const points = isHelmet ? 3 : 2;
    return { decision: 'POINT', side, scoreType, points };
  }

  return { decision: 'HIT', side, scoreType: null, points: 0 };
}

// Helper: simula feeds sequenciais + flush
function feedAndFlush(
  detector: ImpactDetector,
  packets: Array<{ deviceId: number; intensity: number; ts: number }>,
  finalFlushTs: number,
): FinalizedImpact[] {
  for (const p of packets) {
    detector.feed(p.deviceId, p.intensity, p.ts);
  }
  return detector.flush(finalFlushTs);
}

const DEFAULT_THRESHOLDS: Thresholds = {
  vestHitMin: 5,
  vestPointMin: 5,
  helmetHitMin: 3,
  helmetPointMin: 3,
  noiseFloor: {},
};

// ═══════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════

describe('Pipeline: Detector feed → finalize', () => {
  it('ponto de soco forte no colete azul (dev 1, intensity 20) gera 1 FinalizedImpact', () => {
    const detector = new ImpactDetector();
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: 20, ts: 1000 },
    ], 1300);
    expect(finalized).toHaveLength(1);
    expect(finalized[0].deviceId).toBe(1);
    expect(finalized[0].peakIntensity).toBe(20);
  });

  it('intensity = 0 é rejeitada (noise floor minimo = 1)', () => {
    const detector = new ImpactDetector();
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: 0, ts: 1000 },
    ], 1300);
    expect(finalized).toHaveLength(0);
    expect(detector.getRejectedCount()).toBe(1);
  });

  it('intensity <= deltaStart (4) NUNCA inicia novo impacto', () => {
    const detector = new ImpactDetector();
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: 4, ts: 1000 },   // = startThreshold, nao maior
      { deviceId: 1, intensity: 3, ts: 1020 },
    ], 1300);
    expect(finalized).toHaveLength(0);
  });

  it('intensity = 5 inicia impacto (5 > 4 = deltaStart)', () => {
    const detector = new ImpactDetector();
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: 5, ts: 1000 },
    ], 1300);
    expect(finalized).toHaveLength(1);
    expect(finalized[0].peakIntensity).toBe(5);
  });

  it('noiseFloor=10 para dev 1 impede impacto com intensity=13 (13 > 10+4=14? NAO)', () => {
    const detector = new ImpactDetector({
      noiseFloor: { '1': 10 },
    });
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: 13, ts: 1000 },
    ], 1300);
    expect(finalized).toHaveLength(0);
  });

  it('noiseFloor=10 para dev 1 permite impacto com intensity=15 (15 > 14)', () => {
    const detector = new ImpactDetector({
      noiseFloor: { '1': 10 },
    });
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: 15, ts: 1000 },
    ], 1300);
    expect(finalized).toHaveLength(1);
    expect(finalized[0].peakIntensity).toBe(15);
  });

  it('multiplos packets durante um chute: peak = maximo', () => {
    const detector = new ImpactDetector();
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: 8, ts: 1000 },
      { deviceId: 1, intensity: 15, ts: 1020 },
      { deviceId: 1, intensity: 22, ts: 1040 },
      { deviceId: 1, intensity: 10, ts: 1060 },
    ], 1300);
    expect(finalized).toHaveLength(1);
    expect(finalized[0].peakIntensity).toBe(22);
  });

  it('silence gap 200ms finaliza automatico no flush', () => {
    const detector = new ImpactDetector();
    // Impact em t=1000 com intensity alta
    detector.feed(1, 20, 1000);
    // Sem novos packets ate t=1250 (gap 250ms > 200ms silenceGap)
    const finalized = detector.flush(1250);
    expect(finalized).toHaveLength(1);
  });

  it('maxDuration 2000ms força finalizacao mesmo sem silence', () => {
    const detector = new ImpactDetector();
    detector.feed(1, 20, 1000);
    // Packet 2100ms depois com nova intensity alta
    detector.feed(1, 25, 3100);
    const finalized = detector.flush(3200);
    // Deve ter finalizado o primeiro (durationMs > 2000) e iniciado/finalizado segundo
    expect(finalized.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Pipeline: Classification (handleImpact logic)', () => {
  let lastAcceptedTs: Map<number, number>;
  beforeEach(() => { lastAcceptedTs = new Map(); });

  it('matchStatus=IDLE rejeita com NOT_RUNNING', () => {
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'IDLE',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('NOT_RUNNING');
  });

  it('matchStatus=PAUSED rejeita com NOT_RUNNING', () => {
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'PAUSED',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('NOT_RUNNING');
  });

  it('matchStatus=ROUND_END rejeita', () => {
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'ROUND_END',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('NOT_RUNNING');
  });

  it('deviceId=0 (invalido) → INVALID_DEVICE', () => {
    const result = classifyImpact(
      { deviceId: 0, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('INVALID_DEVICE');
  });

  it('deviceId=5 (juiz) → INVALID_DEVICE (nao mapeia pra pontuacao)', () => {
    const result = classifyImpact(
      { deviceId: 5, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('INVALID_DEVICE');
  });

  it('colete azul (dev 1) intensity 4 < vestHitMin 5 → IGNORED', () => {
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 4, avgIntensity: 3, packetCount: 1 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('IGNORED');
  });

  it('colete azul (dev 1) intensity 5 = vestPointMin → POINT BODY BLUE +2', () => {
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 5, avgIntensity: 4, packetCount: 1 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('POINT');
    expect(result.side).toBe('BLUE');
    expect(result.scoreType).toBe('BODY');
    expect(result.points).toBe(2);
  });

  it('colete vermelho (dev 2) intensity 15 → POINT BODY RED +2', () => {
    const result = classifyImpact(
      { deviceId: 2, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 15, avgIntensity: 12, packetCount: 3 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('POINT');
    expect(result.side).toBe('RED');
    expect(result.scoreType).toBe('BODY');
    expect(result.points).toBe(2);
  });

  it('capacete azul (dev 3) intensity 3 = helmetPointMin → POINT HEAD BLUE +3', () => {
    const result = classifyImpact(
      { deviceId: 3, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 3, avgIntensity: 2, packetCount: 1 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('POINT');
    expect(result.side).toBe('BLUE');
    expect(result.scoreType).toBe('HEAD');
    expect(result.points).toBe(3);
  });

  it('vestHitMin=30 (threshold alto) rejeita intensity=20 → IGNORED', () => {
    // Este eh o cenario mais provavel do bug "nao entra ponto":
    // thresholds calibrados alto em uma sessao previa e salvos em localStorage
    const highThresholds: Thresholds = {
      ...DEFAULT_THRESHOLDS,
      vestHitMin: 30,
      vestPointMin: 30,
    };
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      highThresholds,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('IGNORED');
  });

  it('anti-duplicate window 300ms: segundo impacto do mesmo device em 200ms = DUPLICATE', () => {
    classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    // Segundo impact 200ms depois
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000200, endTs: 1000300, durationMs: 100, peakIntensity: 25, avgIntensity: 20, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('DUPLICATE');
  });

  it('anti-duplicate NAO aplica a devices diferentes', () => {
    classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    const result = classifyImpact(
      { deviceId: 2, startTs: 1000200, endTs: 1000300, durationMs: 100, peakIntensity: 20, avgIntensity: 15, packetCount: 2 },
      DEFAULT_THRESHOLDS,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('POINT');
  });

  it('entre hitMin=3 e pointMin=5 = HIT (contador) mas nao POINT', () => {
    // vestHitMin=3 (config custom), vestPointMin=5 → intensity=4 eh HIT
    const customThresholds: Thresholds = {
      ...DEFAULT_THRESHOLDS,
      vestHitMin: 3,
      vestPointMin: 5,
    };
    const result = classifyImpact(
      { deviceId: 1, startTs: 1000000, endTs: 1000100, durationMs: 100, peakIntensity: 4, avgIntensity: 3, packetCount: 1 },
      customThresholds,
      'RUNNING',
      lastAcceptedTs,
    );
    expect(result.decision).toBe('HIT');
    expect(result.points).toBe(0);
  });
});

describe('Pipeline: End-to-end integrado (detector + classify)', () => {
  let lastAcceptedTs: Map<number, number>;
  beforeEach(() => { lastAcceptedTs = new Map(); });

  it('chute no colete azul com intensity alta + status RUNNING → POINT +2', () => {
    const detector = new ImpactDetector();
    const impacts = feedAndFlush(detector, [
      { deviceId: 1, intensity: 25, ts: 1000 },
      { deviceId: 1, intensity: 30, ts: 1020 },
      { deviceId: 1, intensity: 18, ts: 1040 },
    ], 1300);
    expect(impacts).toHaveLength(1);

    const result = classifyImpact(impacts[0], DEFAULT_THRESHOLDS, 'RUNNING', lastAcceptedTs);
    expect(result.decision).toBe('POINT');
    expect(result.points).toBe(2);
  });

  it('cenario real: 5 chutes consecutivos com gap de 400ms (acima do anti-dup) devem somar 10 pts', () => {
    const detector = new ImpactDetector();
    let totalPoints = 0;

    for (let i = 0; i < 5; i++) {
      const baseTs = 1000 + i * 500; // 500ms entre chutes, bem acima dos 200ms silence + 300ms anti-dup
      // Chute vai de baseTs a baseTs+60ms
      detector.feed(1, 25, baseTs);
      detector.feed(1, 20, baseTs + 30);
      // Flush depois do silence gap
      const impacts = detector.flush(baseTs + 300);
      for (const imp of impacts) {
        const result = classifyImpact(imp, DEFAULT_THRESHOLDS, 'RUNNING', lastAcceptedTs);
        if (result.decision === 'POINT') totalPoints += result.points;
      }
    }

    expect(totalPoints).toBe(10); // 5 × 2
  });

  it('cenario real: status IDLE → 3 chutes perdidos', () => {
    const detector = new ImpactDetector();
    let totalPoints = 0;

    for (let i = 0; i < 3; i++) {
      detector.feed(1, 25, 1000 + i * 500);
      const impacts = detector.flush(1000 + i * 500 + 300);
      for (const imp of impacts) {
        const result = classifyImpact(imp, DEFAULT_THRESHOLDS, 'IDLE', lastAcceptedTs);
        if (result.decision === 'POINT') totalPoints += result.points;
      }
    }

    expect(totalPoints).toBe(0);
  });

  it('cenario bug real: thresholds altos (30/30) rejeitam chutes medios', () => {
    // Simula config corrompida vinda de localStorage
    const badThresholds: Thresholds = {
      vestHitMin: 30, vestPointMin: 30,
      helmetHitMin: 30, helmetPointMin: 30,
      noiseFloor: {},
    };
    const detector = new ImpactDetector();
    const impacts = feedAndFlush(detector, [
      { deviceId: 1, intensity: 20, ts: 1000 },
    ], 1300);
    expect(impacts).toHaveLength(1);

    const result = classifyImpact(impacts[0], badThresholds, 'RUNNING', lastAcceptedTs);
    expect(result.decision).toBe('IGNORED'); // <-- BUG comum em producao
  });

  it('cenario bug real: noiseFloor contaminado bloqueia todos os chutes', () => {
    // Se calibracao errada salva noiseFloor = 50 pra dev 1,
    // qualquer intensity <= 54 eh bloqueada no detector
    const detector = new ImpactDetector({
      noiseFloor: { '1': 50 },
    });
    const impacts = feedAndFlush(detector, [
      { deviceId: 1, intensity: 40, ts: 1000 },
      { deviceId: 1, intensity: 50, ts: 1020 },
    ], 1300);
    expect(impacts).toHaveLength(0); // Detector nunca iniciou impact
  });
});

describe('Pipeline: Device mapping (EngFlex spec)', () => {
  it('dev 1 = colete azul = BLUE vest', () => {
    expect(deviceIdToSide(1)).toBe('BLUE');
    expect(deviceIdToEquip(1)).toBe('vest');
  });
  it('dev 2 = colete vermelho = RED vest', () => {
    expect(deviceIdToSide(2)).toBe('RED');
    expect(deviceIdToEquip(2)).toBe('vest');
  });
  it('dev 3 = capacete azul = BLUE helmet', () => {
    expect(deviceIdToSide(3)).toBe('BLUE');
    expect(deviceIdToEquip(3)).toBe('helmet');
  });
  it('dev 4 = capacete vermelho = RED helmet', () => {
    expect(deviceIdToSide(4)).toBe('RED');
    expect(deviceIdToEquip(4)).toBe('helmet');
  });
  it('dev 5-7 (juizes) nao mapeia pra pontuacao', () => {
    expect(deviceIdToSide(5)).toBeNull();
    expect(deviceIdToSide(6)).toBeNull();
    expect(deviceIdToSide(7)).toBeNull();
  });
  it('dev 0 e >= 8 invalidos', () => {
    expect(deviceIdToSide(0)).toBeNull();
    expect(deviceIdToSide(8)).toBeNull();
    expect(deviceIdToSide(99)).toBeNull();
  });
});

describe('Pipeline: Paranoid edge cases', () => {
  let lastAcceptedTs: Map<number, number>;
  beforeEach(() => { lastAcceptedTs = new Map(); });

  it('intensity negativa nunca chega ao detector (protegido por tipo number)', () => {
    const detector = new ImpactDetector();
    // Intensity negativa eh tecnicamente possivel em bug de parse serial
    const finalized = feedAndFlush(detector, [
      { deviceId: 1, intensity: -5, ts: 1000 },
    ], 1300);
    // intensity < noiseIntensityMin (1), deveria ser rejeitado
    expect(finalized).toHaveLength(0);
  });

  it('packet isolado sem continuacao: detector finaliza no flush', () => {
    const detector = new ImpactDetector();
    detector.feed(1, 20, 1000);
    // Nenhum outro packet; flush 400ms depois
    const impacts = detector.flush(1400);
    expect(impacts).toHaveLength(1);
    expect(impacts[0].packetCount).toBe(1);
  });

  it('timestamp retroativo no flush nao crasha', () => {
    const detector = new ImpactDetector();
    detector.feed(1, 20, 5000);
    // Flush com ts antigo
    const impacts = detector.flush(1000);
    // gapMs negativo nao dispara finalizacao → 0 impacts
    expect(impacts).toHaveLength(0);
  });
});
