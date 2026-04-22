/**
 * Testes de migrateMatchConfig — structural repair de configs persistidas.
 *
 * Sprint 1 Task A.3 (P0.1).
 *
 * Cobertura por cenario:
 *   1. Config sem rulesetVersion (legacy v1.4.x) → 'CUSTOM'
 *   2. Config com rulesetVersion valido → preservado
 *   3. Valores incompatives com ruleset (JUN+pointGap=12) → PRESERVADOS sem normalizacao
 *   4. rulesetVersion desconhecido (string) → 'CUSTOM'
 *   5. rulesetVersion tipo errado (number) → 'CUSTOM'
 *   6. rulesetVersion null → 'CUSTOM'
 *   7. Config parcial (so matId) → fills from defaults
 *   8. Config vazia → defaults completos com rulesetVersion='CUSTOM'
 *   + resiliencia a corrupcao em campos numericos, scoring, impactThresholds
 *   + preservacao de campos opcionais (athletes, matchNumber)
 */
import { describe, it, expect } from 'vitest';
import { migrateMatchConfig } from './matchConfigMigration';
import { DEFAULT_MATCH_CONFIG } from '@/types/championship';

describe('migrateMatchConfig — rulesetVersion handling (cenarios 1-6)', () => {
  it('1. config legacy sem rulesetVersion → CUSTOM (forca operador a escolher)', () => {
    const legacy = { ...DEFAULT_MATCH_CONFIG } as Record<string, unknown>;
    delete legacy.rulesetVersion;
    const migrated = migrateMatchConfig(legacy);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
  });

  it('2. config com rulesetVersion valido (WT-2026-JUN) eh preservado', () => {
    const valid = { ...DEFAULT_MATCH_CONFIG, rulesetVersion: 'WT-2026-JUN' as const };
    const migrated = migrateMatchConfig(valid);
    expect(migrated.rulesetVersion).toBe('WT-2026-JUN');
  });

  it('3. valores incompativeis com ruleset (JUN+pointGap=12) sao PRESERVADOS — migration nao normaliza', () => {
    // Cenario real: operador editou pointGap manualmente apos selecionar JUN.
    // Migration confia em ambos. Normalizacao eh trabalho do dropdown handler (A.5),
    // nao da migration. Aqui validamos que migration NAO override o pointGap pra 15.
    const inconsistent = {
      ...DEFAULT_MATCH_CONFIG,
      rulesetVersion: 'WT-2026-JUN' as const,  // preset diz pointGap=15
      pointGap: 12,                              // mas operador deixou 12
    };
    const migrated = migrateMatchConfig(inconsistent);
    expect(migrated.rulesetVersion).toBe('WT-2026-JUN');  // preservado
    expect(migrated.pointGap).toBe(12);                    // preservado, NAO override
  });

  it('4. rulesetVersion desconhecido (string nao reconhecida) → CUSTOM', () => {
    const bogus = { ...DEFAULT_MATCH_CONFIG, rulesetVersion: 'BOGUS' } as Record<string, unknown>;
    const migrated = migrateMatchConfig(bogus);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
  });

  it('5. rulesetVersion com tipo errado (number) → CUSTOM', () => {
    const wrongType = { ...DEFAULT_MATCH_CONFIG, rulesetVersion: 42 } as Record<string, unknown>;
    const migrated = migrateMatchConfig(wrongType);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
  });

  it('6. rulesetVersion null → CUSTOM', () => {
    const nullRule = { ...DEFAULT_MATCH_CONFIG, rulesetVersion: null } as Record<string, unknown>;
    const migrated = migrateMatchConfig(nullRule);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
  });
});

describe('migrateMatchConfig — fill defaults para configs parciais', () => {
  it('7. config parcial (so matId) → fills from DEFAULT_MATCH_CONFIG', () => {
    const partial = { matId: 5 } as Record<string, unknown>;
    const migrated = migrateMatchConfig(partial);
    expect(migrated.matId).toBe(5);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
    expect(migrated.roundTimeMs).toBe(DEFAULT_MATCH_CONFIG.roundTimeMs);
    expect(migrated.maxRounds).toBe(DEFAULT_MATCH_CONFIG.maxRounds);
    expect(migrated.scoring.spinHead).toBe(DEFAULT_MATCH_CONFIG.scoring.spinHead);
  });

  it('8. config vazia → todos os defaults + rulesetVersion=CUSTOM', () => {
    const migrated = migrateMatchConfig({});
    expect(migrated.rulesetVersion).toBe('CUSTOM');
    expect(migrated.matId).toBe(DEFAULT_MATCH_CONFIG.matId);
    expect(migrated.roundTimeMs).toBe(DEFAULT_MATCH_CONFIG.roundTimeMs);
    expect(migrated.scoring).toEqual(DEFAULT_MATCH_CONFIG.scoring);
  });
});

describe('migrateMatchConfig — preserva campos opcionais validos', () => {
  it('athleteRed/Blue preservados se objetos validos', () => {
    const config = {
      ...DEFAULT_MATCH_CONFIG,
      athleteRed: { id: 'a1', name: 'Alice' },
      athleteBlue: { id: 'b1', name: 'Bob', country: 'BR' },
    };
    const migrated = migrateMatchConfig(config);
    expect(migrated.athleteRed).toEqual({ id: 'a1', name: 'Alice' });
    expect(migrated.athleteBlue).toEqual({ id: 'b1', name: 'Bob', country: 'BR' });
  });

  it('matchNumber preservado se string', () => {
    const config = { ...DEFAULT_MATCH_CONFIG, matchNumber: '042' };
    const migrated = migrateMatchConfig(config);
    expect(migrated.matchNumber).toBe('042');
  });

  it('matchNumber descartado se nao string', () => {
    const config = { ...DEFAULT_MATCH_CONFIG, matchNumber: 42 } as Record<string, unknown>;
    const migrated = migrateMatchConfig(config);
    expect(migrated.matchNumber).toBeUndefined();
  });
});

describe('migrateMatchConfig — resiliencia a corrupcao', () => {
  it('campos numericos com tipos errados caem pra DEFAULT', () => {
    const corrupt = {
      ...DEFAULT_MATCH_CONFIG,
      maxGamjeom: 'ten' as unknown,
      pointGap: null,
      matId: NaN,
    } as Record<string, unknown>;
    const migrated = migrateMatchConfig(corrupt);
    expect(migrated.maxGamjeom).toBe(DEFAULT_MATCH_CONFIG.maxGamjeom);
    expect(migrated.pointGap).toBe(DEFAULT_MATCH_CONFIG.pointGap);
    expect(migrated.matId).toBe(DEFAULT_MATCH_CONFIG.matId);
  });

  it('maxRounds invalido (string ou outro numero) → fall back pra default (3)', () => {
    const corrupt = { ...DEFAULT_MATCH_CONFIG, maxRounds: 5 as unknown } as Record<string, unknown>;
    const migrated = migrateMatchConfig(corrupt);
    expect(migrated.maxRounds).toBe(DEFAULT_MATCH_CONFIG.maxRounds);
  });

  it('maxRounds=1 ou maxRounds=3 sao validos', () => {
    expect(migrateMatchConfig({ ...DEFAULT_MATCH_CONFIG, maxRounds: 1 }).maxRounds).toBe(1);
    expect(migrateMatchConfig({ ...DEFAULT_MATCH_CONFIG, maxRounds: 3 }).maxRounds).toBe(3);
  });

  it('scoring com chaves faltando → mescla com DEFAULT_SCORE_CONFIG', () => {
    const partial = {
      ...DEFAULT_MATCH_CONFIG,
      scoring: { punch: 99 },
    } as Record<string, unknown>;
    const migrated = migrateMatchConfig(partial);
    expect(migrated.scoring.punch).toBe(99);
    expect(migrated.scoring.body).toBe(DEFAULT_MATCH_CONFIG.scoring.body);
    expect(migrated.scoring.spinHead).toBe(DEFAULT_MATCH_CONFIG.scoring.spinHead);
  });

  it('scoring com valores nao-numericos sao descartados (mantem default)', () => {
    const corrupt = {
      ...DEFAULT_MATCH_CONFIG,
      scoring: { punch: 'one' as unknown, body: 5, head: null },
    } as Record<string, unknown>;
    const migrated = migrateMatchConfig(corrupt);
    expect(migrated.scoring.punch).toBe(DEFAULT_MATCH_CONFIG.scoring.punch);  // 'one' descartado
    expect(migrated.scoring.body).toBe(5);                                      // numero preservado
    expect(migrated.scoring.head).toBe(DEFAULT_MATCH_CONFIG.scoring.head);     // null descartado
  });

  it('impactThresholds com chaves faltando → mescla com defaults', () => {
    const partial = {
      ...DEFAULT_MATCH_CONFIG,
      impactThresholds: { vestHitMin: 25 },
    } as Record<string, unknown>;
    const migrated = migrateMatchConfig(partial);
    expect(migrated.impactThresholds?.vestHitMin).toBe(25);
    expect(migrated.impactThresholds?.helmetHitMin).toBe(DEFAULT_MATCH_CONFIG.impactThresholds?.helmetHitMin);
    expect(migrated.impactThresholds?.noiseFloor).toBeDefined();
  });

  it('scoring sendo array (nao objeto) eh descartado', () => {
    const corrupt = { ...DEFAULT_MATCH_CONFIG, scoring: [1, 2, 3] } as Record<string, unknown>;
    const migrated = migrateMatchConfig(corrupt);
    expect(migrated.scoring).toEqual(DEFAULT_MATCH_CONFIG.scoring);
  });
});
