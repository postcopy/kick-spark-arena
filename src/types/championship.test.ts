/**
 * Testes unitarios de DEFAULT_MATCH_CONFIG e DEFAULT_SCORE_CONFIG.
 *
 * Validam consistencia com WT_RULESET_PRESETS sem dependencia de hook
 * ou state machine — testes puros de valor/configuracao.
 *
 * Escopo: Sprint 1 Task A.2 (P0.1 — rulesetVersion field + WT-2026-JAN default).
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_MATCH_CONFIG, DEFAULT_SCORE_CONFIG } from './championship';
import { getRulesetPreset } from '@/lib/wtRuleset';

describe('DEFAULT_MATCH_CONFIG (P0.1 — Task A.2)', () => {
  it('rulesetVersion = WT-2026-JAN (regra vigente ate 31/Mai/2026)', () => {
    expect(DEFAULT_MATCH_CONFIG.rulesetVersion).toBe('WT-2026-JAN');
  });

  it('pointGap, maxGamjeom e scoring alinhados com WT-2026-JAN preset', () => {
    // Default config DEVE estar consistente com o preset declarado em rulesetVersion.
    // Se divergirem, eh bug — operador veria valores que nao correspondem ao
    // ruleset selecionado.
    const preset = getRulesetPreset('WT-2026-JAN');
    expect(DEFAULT_MATCH_CONFIG.pointGap).toBe(preset.pointGap);
    expect(DEFAULT_MATCH_CONFIG.maxGamjeom).toBe(preset.maxGamjeom);
    expect(DEFAULT_MATCH_CONFIG.scoring.spinBody).toBe(preset.scoring.spinBody);
    expect(DEFAULT_MATCH_CONFIG.scoring.spinHead).toBe(preset.scoring.spinHead);
    expect(DEFAULT_MATCH_CONFIG.scoring.punch).toBe(preset.scoring.punch);
    expect(DEFAULT_MATCH_CONFIG.scoring.body).toBe(preset.scoring.body);
    expect(DEFAULT_MATCH_CONFIG.scoring.head).toBe(preset.scoring.head);
  });

  it('matchConfig.matId = 1 e roundTimeMs = 120000 (defaults sensatos)', () => {
    expect(DEFAULT_MATCH_CONFIG.matId).toBe(1);
    expect(DEFAULT_MATCH_CONFIG.roundTimeMs).toBe(120_000);
    expect(DEFAULT_MATCH_CONFIG.maxRounds).toBe(3);
  });
});

describe('DEFAULT_SCORE_CONFIG (P0.1 — formula WT 2026)', () => {
  it('formula post-Wuxi-jan: spin = base x 2 (nao mais base + 1 bonus)', () => {
    // Pre-2026: spinBody = body+1 = 3, spinHead = head+1 = 4
    // WT-2026-JAN+: spinBody = body x 2 = 4, spinHead = head x 2 = 6
    expect(DEFAULT_SCORE_CONFIG.body).toBe(2);
    expect(DEFAULT_SCORE_CONFIG.spinBody).toBe(2 * 2);  // = 4

    expect(DEFAULT_SCORE_CONFIG.head).toBe(3);
    expect(DEFAULT_SCORE_CONFIG.spinHead).toBe(3 * 2);  // = 6
  });

  it('punch eh 1 (jab WT no tronco)', () => {
    expect(DEFAULT_SCORE_CONFIG.punch).toBe(1);
  });
});
