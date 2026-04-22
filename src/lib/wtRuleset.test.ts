import { describe, it, expect } from 'vitest';
import {
  WT_RULESET_PRESETS,
  getRulesetPreset,
  type WTRulesetVersion,
} from './wtRuleset';

describe('WTRuleset presets', () => {
  it('WT-2026-JUN: pointGap=15, spin doubled, passivity bonus=2', () => {
    const r = getRulesetPreset('WT-2026-JUN');
    expect(r.version).toBe('WT-2026-JUN');
    expect(r.pointGap).toBe(15);
    expect(r.scoring.spinBody).toBe(4);
    expect(r.scoring.spinHead).toBe(6);
    expect(r.gamjeomPassivityBonus).toBe(2);
    expect(r.gamjeomPassivityWindowMs).toBe(10_000);
  });

  it('WT-2026-JAN: spin doubled but pointGap still 12, no passivity bonus', () => {
    const r = getRulesetPreset('WT-2026-JAN');
    expect(r.pointGap).toBe(12);
    expect(r.scoring.spinBody).toBe(4);
    expect(r.scoring.spinHead).toBe(6);
    expect(r.gamjeomPassivityBonus).toBe(1);
  });

  it('WT-LEGACY-2022: spin = base + 2 (formula pre-2026)', () => {
    const r = getRulesetPreset('WT-LEGACY-2022');
    expect(r.pointGap).toBe(12);
    expect(r.scoring.body).toBe(2);
    expect(r.scoring.spinBody).toBe(4);  // 2 + 2
    expect(r.scoring.head).toBe(3);
    expect(r.scoring.spinHead).toBe(5);  // 3 + 2
    expect(r.gamjeomPassivityBonus).toBe(1);
  });

  it('CUSTOM: preset exists and version is CUSTOM (operator defines values)', () => {
    const r = getRulesetPreset('CUSTOM');
    expect(r.version).toBe('CUSTOM');
  });

  it('all preset versions are in WT_RULESET_PRESETS map', () => {
    const versions: WTRulesetVersion[] = [
      'WT-2026-JUN',
      'WT-2026-JAN',
      'WT-LEGACY-2022',
      'CUSTOM',
    ];
    for (const v of versions) {
      expect(WT_RULESET_PRESETS[v]).toBeDefined();
    }
  });

  it('returns a fully independent copy (no shared references)', () => {
    // Contrato: mutar o resultado NAO pode vazar pra WT_RULESET_PRESETS.
    // Testamos independencia de referencia, nao valores — assim o contrato
    // continua valido se adicionarmos campos aninhados no futuro.
    const original = WT_RULESET_PRESETS['WT-2026-JUN'];
    const copy = getRulesetPreset('WT-2026-JUN');

    // Top-level: preset e copia sao objetos distintos
    expect(copy).not.toBe(original);
    // Aninhado: scoring tambem nao pode ser a mesma referencia
    expect(copy.scoring).not.toBe(original.scoring);

    // Prova de isolamento: mutar copia nao altera o preset imutavel
    copy.scoring.spinHead = 999;
    expect(WT_RULESET_PRESETS['WT-2026-JUN'].scoring.spinHead).toBe(6);
  });
});
