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

  it('WT-LEGACY-2022: pre-2026 scoring', () => {
    const r = getRulesetPreset('WT-LEGACY-2022');
    expect(r.pointGap).toBe(12);
    expect(r.scoring.spinBody).toBe(2);
    expect(r.scoring.spinHead).toBe(3);
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

  it('getRulesetPreset returns a deep-copy (mutating result does not alter the source)', () => {
    const r = getRulesetPreset('WT-2026-JUN');
    r.scoring.spinHead = 999;
    const fresh = getRulesetPreset('WT-2026-JUN');
    expect(fresh.scoring.spinHead).toBe(6);
  });
});
