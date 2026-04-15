# Sprint 1 — WT 2026 Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 P0 findings (P0.1 scoring, P0.2 gam-jeom passivity, P0.3 gam-jeom reason dialog, P0.4 category-driven thresholds) so SPE is regulatorily aligned with WT 2026 and cannot operate with dangerous defaults.

**Architecture:** Ruleset versioning (`WTRuleset`) becomes the source of truth for all scoring parameters that vary between WT versions. `MatchConfig` gains `rulesetVersion` (default `WT-2026-JAN`) + `category` (metadata only) fields. Gam-jeom logic reads passivity bonus from ruleset instead of literal. **Threshold permanece manual** — categoria é metadata, não controla threshold; guardrail não-bloqueante avisa o operador no "Iniciar" se threshold está fora da faixa típica da categoria. UI dialogs expose ruleset + category as explicit dropdowns; operador decide deliberadamente.

**Tech Stack:** TypeScript, React, Vitest (jsdom env), existing useChampionshipSync hook.

**Branch:** `fix/wt-2026-compliance`
**Base version:** 1.4.9 → target 1.5.0 after merge
**Test entry point:** `npm test` (runs `vitest run`)

**Out of scope for this sprint (explicit):**
- P0.5 (PMK/LMK firmware) — documented in `.spe/KNOWN_LIMITATIONS.md` L3
- P0.6 (MANUAL labels + SPIN_HEAD button) — Sprint 2
- P0.7 (hardware punch flag) — Sprint 2
- P1.1 (firmware cooldown) — documented in L1
- Everything else in `AUDIT.md` — later sprints

**Execution policy — sequência estrita:**
- Ordem rígida: **A → B → C → D → E**. Não paralelizar, não pular stages.
- Se qualquer stage travar (teste vermelho inexplicado, erro TS, decisão ambígua), **parar e reportar** em vez de tentar contornar ou pular adiante.
- Dependências:
  - B depende de A (passivity lê `ruleset.gamjeomPassivityBonus`)
  - D depende de A (category é metadata paralela, mas validações usam a mesma infra de migration)
  - E depende de A + B + D (WhatsNewDialog documenta mudanças dos 3)
- Simplicidade de controle > paralelização oportunística.

---

## File Structure Overview

**New files:**
- `src/lib/wtRuleset.ts` — `WTRuleset` interface, presets, helpers
- `src/lib/matchCategory.ts` — `MatchCategory` enum, threshold lookup
- `src/lib/matchConfigMigration.ts` — legacy config migration
- `src/components/championship/WhatsNewDialog.tsx` — v1.5.0 changelog UI
- `src/lib/wtRuleset.test.ts` — unit tests for ruleset helpers
- `src/lib/matchCategory.test.ts` — unit tests for category → threshold

**Modified files:**
- `src/types/championship.ts` — add `GamjeomReasonId.PASSIVITY`, `MatchEvent.type` adds `GAMJEOM_PASSIVITY_BONUS`, `MatchConfig` gains `rulesetVersion` + `category`, `DEFAULT_MATCH_CONFIG` updated
- `src/hooks/useChampionshipSync.ts` — `addGamjeom` reads ruleset for passivity bonus, remove anti-stalling block (lines 1149-1183)
- `src/hooks/useChampionshipSync.test.ts` — update existing tests for new defaults, new test groups for passivity rule + category
- `src/components/championship/GamjeomReasonDialog.tsx` — add PASSIVITY to `REASON_ORDER`, integrate with Mat page
- `src/components/championship/MatchConfigDialog.tsx` — add ruleset dropdown + category dropdown; threshold UI goes read-only when category !== CUSTOM
- `src/pages/ChampionshipMat.tsx` — wire `GamjeomReasonDialog`, block Iniciar if CUSTOM without calibration, show WhatsNewDialog on first launch of 1.5.0
- `package.json` — bump version to 1.5.0
- `RELEASE.md` — add 1.5.0 section

---

## Stage A — WTRuleset foundation (P0.1 ambitious)

### Task A.1: Define `WTRuleset` interface + presets

**Files:**
- Create: `src/lib/wtRuleset.ts`
- Create: `src/lib/wtRuleset.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/wtRuleset.test.ts
import { describe, it, expect } from 'vitest';
import {
  WT_RULESET_PRESETS,
  getRulesetPreset,
  type WTRuleset,
  type WTRulesetVersion,
} from './wtRuleset';

describe('WTRuleset presets', () => {
  it('WT-2026-JUN is default, pointGap=15, spin doubled', () => {
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

  it('CUSTOM: preset exists but values are marker (operator defines)', () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/wtRuleset.test.ts`
Expected: FAIL with "Cannot find module './wtRuleset'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/wtRuleset.ts
import type { ScoreConfig } from '@/types/championship';

/**
 * Ruleset versioned per WT amendment cycle.
 *
 * - WT-2026-JUN: rules effective from 1 Jun 2026 (Rome GP1 onward).
 *   Source: WT amendments approved Wuxi Jan 2026, passivity bonus +2pts
 *   in last 10s of any round, pointGap 15.
 *
 * - WT-2026-JAN: transitional period 1 Jan 2026 – 31 May 2026.
 *   Spin values doubled (jan amendment) but pointGap still 12, no passivity bonus yet.
 *
 * - WT-LEGACY-2022: pre-2026 scoring, kept for regional tournaments
 *   still running older rule sheets.
 *
 * - CUSTOM: operator-defined, no preset values. UI must force explicit config.
 *
 * Sources:
 *   https://www.taekwondobond.nl/wp-content/uploads/WT-Competition-Rules-and-Interpretations-Kyorugi-changes-made-as-of-January-1-2026.pdf
 *   https://www.mastkd.com/2026/04/world-taekwondo-approved-new-combat-rule-changes/
 */
export type WTRulesetVersion =
  | 'WT-2026-JUN'
  | 'WT-2026-JAN'
  | 'WT-LEGACY-2022'
  | 'CUSTOM';

export interface WTRuleset {
  version: WTRulesetVersion;
  /** Pts differential at which round ends automatically. */
  pointGap: number;
  /** Number of gam-jeom for immediate disqualification (PUN). */
  maxGamjeom: number;
  /** Scoring values per technique. */
  scoring: ScoreConfig;
  /** Extra pts to opponent when gam-jeom type is PASSIVITY and within window. */
  gamjeomPassivityBonus: 1 | 2;
  /** Window before round end (ms) in which passivity bonus applies. */
  gamjeomPassivityWindowMs: number;
}

export const WT_RULESET_PRESETS: Record<WTRulesetVersion, WTRuleset> = {
  'WT-2026-JUN': {
    version: 'WT-2026-JUN',
    pointGap: 15,
    maxGamjeom: 10,
    scoring: { punch: 1, body: 2, head: 3, spinBody: 4, spinHead: 6 },
    gamjeomPassivityBonus: 2,
    gamjeomPassivityWindowMs: 10_000,
  },
  'WT-2026-JAN': {
    version: 'WT-2026-JAN',
    pointGap: 12,
    maxGamjeom: 10,
    scoring: { punch: 1, body: 2, head: 3, spinBody: 4, spinHead: 6 },
    gamjeomPassivityBonus: 1,
    gamjeomPassivityWindowMs: 10_000,
  },
  'WT-LEGACY-2022': {
    version: 'WT-LEGACY-2022',
    pointGap: 12,
    maxGamjeom: 10,
    scoring: { punch: 1, body: 2, head: 3, spinBody: 2, spinHead: 3 },
    gamjeomPassivityBonus: 1,
    gamjeomPassivityWindowMs: 10_000,
  },
  CUSTOM: {
    version: 'CUSTOM',
    pointGap: 15,
    maxGamjeom: 10,
    scoring: { punch: 1, body: 2, head: 3, spinBody: 4, spinHead: 6 },
    gamjeomPassivityBonus: 2,
    gamjeomPassivityWindowMs: 10_000,
  },
};

/** Returns a deep-copy of the preset so callers can mutate safely. */
export function getRulesetPreset(version: WTRulesetVersion): WTRuleset {
  const preset = WT_RULESET_PRESETS[version];
  return {
    ...preset,
    scoring: { ...preset.scoring },
  };
}

export const WT_RULESET_LABELS: Record<WTRulesetVersion, string> = {
  'WT-2026-JUN': 'WT 2026 (Jun) — vigente em Rome GP1 e além',
  'WT-2026-JAN': 'WT 2026 (Jan) — transitório 01/Jan a 31/Mai/2026',
  'WT-LEGACY-2022': 'WT Legacy (pré-2026)',
  CUSTOM: 'Customizado — operador define valores',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/wtRuleset.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/wtRuleset.ts src/lib/wtRuleset.test.ts
git commit -m "feat(wt-ruleset): add versioned WTRuleset (P0.1)"
```

---

### Task A.2: Add `rulesetVersion` field to `MatchConfig` + update `DEFAULT_MATCH_CONFIG`

**Files:**
- Modify: `src/types/championship.ts:33-99`
- Modify: `src/hooks/useChampionshipSync.test.ts:132-137`

- [ ] **Step 1: Update the existing test "Config default: pointGap = 20"**

Read current test and replace expected values.

File: `src/hooks/useChampionshipSync.test.ts:132-137`, replace the block:

```ts
// BEFORE
it('Config default: pointGap = 20, maxGamjeom = 10', () => {
  expect(DEFAULT_MATCH_CONFIG.pointGap).toBe(20);
  expect(DEFAULT_MATCH_CONFIG.maxGamjeom).toBe(10);
  expect(DEFAULT_MATCH_CONFIG.scoring.spinBody).toBe(4);
  expect(DEFAULT_MATCH_CONFIG.scoring.spinHead).toBe(6);
});
```

with:

```ts
// AFTER — WT-2026-JAN é o default (regra vigente hoje, 15/abr/2026).
// Operador troca manualmente pra WT-2026-JUN após 01/Jun/2026, ou pra LEGACY/CUSTOM
// se torneio usar regulamento antigo. Sem auto-upgrade baseado em data do sistema.
it('Config default: WT-2026-JAN ruleset — pointGap 12, maxGamjeom 10, spin doubled', () => {
  expect(DEFAULT_MATCH_CONFIG.rulesetVersion).toBe('WT-2026-JAN');
  expect(DEFAULT_MATCH_CONFIG.pointGap).toBe(12);
  expect(DEFAULT_MATCH_CONFIG.maxGamjeom).toBe(10);
  expect(DEFAULT_MATCH_CONFIG.scoring.spinBody).toBe(4);
  expect(DEFAULT_MATCH_CONFIG.scoring.spinHead).toBe(6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "Config default"`
Expected: FAIL — `rulesetVersion` is undefined AND pointGap is 20.

- [ ] **Step 3: Add `rulesetVersion` to `MatchConfig` + update default**

File: `src/types/championship.ts`. In the `MatchConfig` interface (line ~33), add below `matId`:

```ts
  /** WT ruleset version. Default WT-2026-JAN (regra vigente ate 31/Mai/2026). */
  rulesetVersion: import('@/lib/wtRuleset').WTRulesetVersion;
```

And update `DEFAULT_MATCH_CONFIG` (line ~82). Default do sistema é **WT-2026-JAN**
(regra vigente até 31/Mai/2026, que é o que vale hoje em 15/Abr/2026). Operador troca
deliberadamente pra `WT-2026-JUN`, `WT-LEGACY-2022` ou `CUSTOM` via dropdown na UI.
Sem auto-upgrade por data; sistema não decide por operador.

```ts
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  roundTimeMs: 120000,
  medicalTimeMs: 60000,
  breakTimeMs: 60000,
  maxRounds: 3,
  maxGamjeom: 10,
  pointGap: 12,    // WT-2026-JAN: 12 pts/round (vigente ate 31/Mai/2026)
  scoring: DEFAULT_SCORE_CONFIG,
  matId: 1,
  rulesetVersion: 'WT-2026-JAN',  // default = regra vigente hoje; operador troca via UI
  scoringInput: 'impacts',
  impactThresholds: {
    vestHitMin: 5,
    vestPointMin: 5,
    helmetHitMin: 3,
    helmetPointMin: 3,
    noiseFloor: {},
  },
};
```

Nota: `pointGap` e `scoring` devem ficar consistentes com o preset WT-2026-JAN (verificar
contra `WT_RULESET_PRESETS['WT-2026-JAN']` — pointGap=12, spinBody=4, spinHead=6). Se
divergir, é bug.

Note: `import('@/lib/wtRuleset').WTRulesetVersion` is a deferred type import — prevents circular dependency. Alternative is a top-level `import type { WTRulesetVersion } from '@/lib/wtRuleset';` but check circular — `wtRuleset.ts` already imports `ScoreConfig` from `championship.ts`. Use the top-level import since the circular is type-only.

Actual implementation (top of file, after existing imports):

```ts
import type { WTRulesetVersion } from '@/lib/wtRuleset';
```

And in interface:

```ts
  rulesetVersion: WTRulesetVersion;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "Config default"`
Expected: PASS.

Then full suite to catch regressions:
Run: `npm test`
Expected: all existing tests still pass (237+ green).

- [ ] **Step 5: Commit**

```bash
git add src/types/championship.ts src/hooks/useChampionshipSync.test.ts
git commit -m "feat(match-config): add rulesetVersion, default WT-2026-JAN (P0.1)"
```

---

### Task A.3: Migration helper — legacy configs get `rulesetVersion: 'CUSTOM'`

**Files:**
- Create: `src/lib/matchConfigMigration.ts`
- Create: `src/lib/matchConfigMigration.test.ts`

Rationale: Existing `MatchConfig` objects in `localStorage` from v1.4.9 don't have `rulesetVersion`. When `saveConfig` / state loading parses them, missing field must default to `CUSTOM` (so operator explicitly picks a preset before next match). Safer than silently upgrading to WT-2026-JUN.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/matchConfigMigration.test.ts
import { describe, it, expect } from 'vitest';
import { migrateMatchConfig } from './matchConfigMigration';
import { DEFAULT_MATCH_CONFIG } from '@/types/championship';

describe('migrateMatchConfig', () => {
  it('legacy config (no rulesetVersion) is tagged CUSTOM', () => {
    const legacy = { ...DEFAULT_MATCH_CONFIG } as Record<string, unknown>;
    delete legacy.rulesetVersion;
    const migrated = migrateMatchConfig(legacy);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
  });

  it('config with rulesetVersion is returned unchanged', () => {
    const current = { ...DEFAULT_MATCH_CONFIG, rulesetVersion: 'WT-2026-JUN' as const };
    const migrated = migrateMatchConfig(current);
    expect(migrated.rulesetVersion).toBe('WT-2026-JUN');
  });

  it('invalid rulesetVersion falls back to CUSTOM', () => {
    const legacy = { ...DEFAULT_MATCH_CONFIG, rulesetVersion: 'BOGUS' } as Record<string, unknown>;
    const migrated = migrateMatchConfig(legacy);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
  });

  it('missing required fields filled from defaults', () => {
    const broken = { matId: 1 } as Record<string, unknown>;
    const migrated = migrateMatchConfig(broken);
    expect(migrated.matId).toBe(1);
    expect(migrated.rulesetVersion).toBe('CUSTOM');
    expect(migrated.roundTimeMs).toBe(DEFAULT_MATCH_CONFIG.roundTimeMs);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/matchConfigMigration.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/matchConfigMigration.ts
import { DEFAULT_MATCH_CONFIG, type MatchConfig } from '@/types/championship';
import { WT_RULESET_PRESETS, type WTRulesetVersion } from './wtRuleset';

function isValidRulesetVersion(v: unknown): v is WTRulesetVersion {
  return typeof v === 'string' && v in WT_RULESET_PRESETS;
}

/**
 * Normalizes a persisted MatchConfig from older versions or partially corrupt state.
 * Always returns a valid, complete MatchConfig with all required fields.
 * Unknown or missing rulesetVersion is mapped to 'CUSTOM' so the operator is
 * forced to pick a preset explicitly before next match.
 */
export function migrateMatchConfig(raw: Record<string, unknown>): MatchConfig {
  const base: MatchConfig = { ...DEFAULT_MATCH_CONFIG };

  // Preserve known-safe primitive fields when present
  for (const key of [
    'roundTimeMs', 'medicalTimeMs', 'breakTimeMs',
    'maxRounds', 'maxGamjeom', 'pointGap', 'matId',
  ] as const) {
    const v = raw[key];
    if (typeof v === 'number') (base[key] as number) = v;
  }

  // matchNumber is optional string
  if (typeof raw.matchNumber === 'string') base.matchNumber = raw.matchNumber;

  // scoring
  if (raw.scoring && typeof raw.scoring === 'object') {
    base.scoring = { ...base.scoring, ...(raw.scoring as Record<string, number>) };
  }

  // impactThresholds
  if (raw.impactThresholds && typeof raw.impactThresholds === 'object') {
    base.impactThresholds = {
      ...base.impactThresholds!,
      ...(raw.impactThresholds as typeof base.impactThresholds),
    };
  }

  // athletes
  if (raw.athleteRed && typeof raw.athleteRed === 'object') {
    base.athleteRed = raw.athleteRed as MatchConfig['athleteRed'];
  }
  if (raw.athleteBlue && typeof raw.athleteBlue === 'object') {
    base.athleteBlue = raw.athleteBlue as MatchConfig['athleteBlue'];
  }

  // rulesetVersion — the critical migration: unknown = CUSTOM
  base.rulesetVersion = isValidRulesetVersion(raw.rulesetVersion)
    ? raw.rulesetVersion
    : 'CUSTOM';

  return base;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/matchConfigMigration.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/matchConfigMigration.ts src/lib/matchConfigMigration.test.ts
git commit -m "feat(match-config): migration helper for legacy configs (P0.1)"
```

---

### Task A.4: Wire migration into `useChampionshipSync` config load

**Files:**
- Modify: `src/hooks/useChampionshipSync.ts` (config loading code — search for `JSON.parse(savedConfig)` or `getConfigStorageKey`)

- [ ] **Step 1: Locate the config load site**

Search: `grep -n "JSON.parse" src/hooks/useChampionshipSync.ts`
Expected: find where persisted config is parsed on hook init.

If it's in a `useEffect` that calls `localStorage.getItem(getConfigStorageKey(matId))` and `JSON.parse` the result, that's the site.

- [ ] **Step 2: Write a regression test first**

File: `src/hooks/useChampionshipSync.test.ts`, add new `describe` block:

```ts
describe('Grupo 12 — Migration de config legacy', () => {
  beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

  it('config legacy sem rulesetVersion é migrado para CUSTOM no load', () => {
    // Semear localStorage com config legacy v1.4.9-style
    const legacyConfig = {
      roundTimeMs: 120000,
      medicalTimeMs: 60000,
      breakTimeMs: 60000,
      maxRounds: 3,
      maxGamjeom: 10,
      pointGap: 20,  // valor antigo
      scoring: { punch: 1, body: 2, head: 3, spinBody: 4, spinHead: 6 },
      matId: 1,
      impactThresholds: {
        vestHitMin: 5, vestPointMin: 5,
        helmetHitMin: 3, helmetPointMin: 3,
        noiseFloor: {},
      },
    };
    store['championship-config-mat-1'] = JSON.stringify(legacyConfig);

    const hook = createMaster();
    // saveConfig no createMaster sobrescreve, mas se removermos dependência — verificar comportamento direto.
    // Alternativa: instanciar sem saveConfig, ler state.config imediatamente.
    // Para esse teste, usar renderHook puro sem helper.
    // (Ver código abaixo.)

    // NOTA: createMaster chama saveConfig(DEFAULT_MATCH_CONFIG). Para testar
    // migração na carga, precisamos de um hook que NÃO execute saveConfig inicial.
    // Criar helper dedicado (ver próxima edição).
    expect(true).toBe(true); // placeholder — substituído na próxima edição
  });
});
```

- [ ] **Step 3: Create a helper that loads without calling saveConfig**

File: `src/hooks/useChampionshipSync.test.ts`, near other helpers (around line 77), add:

```ts
function createMasterRaw() {
  return renderHook(() => useChampionshipSync({
    role: 'master',
    matId: 1,
    academyId: 'test-academy-id',
  }));
}
```

- [ ] **Step 4: Replace placeholder test with real assertion**

Update the test body:

```ts
it('config legacy sem rulesetVersion é migrado para CUSTOM no load', () => {
  const legacyConfig = {
    roundTimeMs: 120000,
    medicalTimeMs: 60000,
    breakTimeMs: 60000,
    maxRounds: 3,
    maxGamjeom: 10,
    pointGap: 20,
    scoring: { punch: 1, body: 2, head: 3, spinBody: 4, spinHead: 6 },
    matId: 1,
    impactThresholds: {
      vestHitMin: 5, vestPointMin: 5,
      helmetHitMin: 3, helmetPointMin: 3,
      noiseFloor: {},
    },
  };
  store['championship-config-mat-1'] = JSON.stringify(legacyConfig);

  const hook = createMasterRaw();
  // Hook deve carregar + migrar automaticamente
  expect(hook.result.current.state.config.rulesetVersion).toBe('CUSTOM');
  // Outros campos preservados
  expect(hook.result.current.state.config.roundTimeMs).toBe(120000);
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "migrated para CUSTOM"`
Expected: FAIL — either rulesetVersion is undefined or config isn't loaded.

- [ ] **Step 6: Wire migration in `useChampionshipSync.ts`**

Find the config loading site (likely in `useEffect` early in the hook body). Import migration:

```ts
import { migrateMatchConfig } from '@/lib/matchConfigMigration';
```

At the config load site, change:

```ts
// BEFORE (approximate — adapt to actual code)
const saved = localStorage.getItem(getConfigStorageKey(matId));
if (saved) {
  const parsed = JSON.parse(saved);
  setState(prev => ({ ...prev, config: parsed, hasConfig: true, ... }));
}
```

to:

```ts
// AFTER
const saved = localStorage.getItem(getConfigStorageKey(matId));
if (saved) {
  const parsed = JSON.parse(saved);
  const migrated = migrateMatchConfig(parsed);
  setState(prev => ({ ...prev, config: migrated, hasConfig: true, ... }));
}
```

(Preserve the full surrounding logic — only change `parsed` → `migrated`.)

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "migrated para CUSTOM"`
Expected: PASS.

Full suite:
Run: `npm test`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useChampionshipSync.ts src/hooks/useChampionshipSync.test.ts
git commit -m "feat(match-config): migrate legacy configs on load (P0.1)"
```

---

### Task A.5: `MatchConfigDialog` — ruleset dropdown applies preset to form state

**Files:**
- Modify: `src/components/championship/MatchConfigDialog.tsx`

- [ ] **Step 1: Read current dialog structure**

Run: `head -n 100 src/components/championship/MatchConfigDialog.tsx`

Identify where `<Tabs>` content is rendered. Target: add a new "Regulamento" tab as the first tab OR add the dropdown to the "time" tab header.

- [ ] **Step 2: Add ruleset imports**

At top of `MatchConfigDialog.tsx`:

```ts
import {
  WT_RULESET_LABELS,
  getRulesetPreset,
  type WTRulesetVersion,
} from '@/lib/wtRuleset';
```

- [ ] **Step 3: Add handler for ruleset change**

Inside the component body, near other handlers (after `restoreDefaultScoring` around line 74):

```ts
const handleRulesetChange = (version: WTRulesetVersion) => {
  setConfig(prev => {
    if (version === 'CUSTOM') {
      return { ...prev, rulesetVersion: 'CUSTOM' };
    }
    const preset = getRulesetPreset(version);
    return {
      ...prev,
      rulesetVersion: version,
      pointGap: preset.pointGap,
      maxGamjeom: preset.maxGamjeom,
      scoring: preset.scoring,
    };
  });
};
```

- [ ] **Step 4: Add ruleset select to top of dialog (above Tabs)**

Find the `<TabsList>` element and insert above it:

Shape de `WT_RULESET_LABELS` é `Record<WTRulesetVersion, { label: string; vigencia: string }>`
(já implementado em `src/lib/wtRuleset.ts`). Dropdown renderiza `label` como texto principal
e `vigencia` como sublinha informativa — operador decide com contexto, não só com nome.

```tsx
<div className="px-6 pt-4 pb-2 border-b border-zinc-800">
  <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
    REGULAMENTO WT
  </Label>
  <Select
    value={config.rulesetVersion}
    onValueChange={(v) => handleRulesetChange(v as WTRulesetVersion)}
    disabled={isLocked}
  >
    <SelectTrigger className="bg-zinc-800 border-zinc-700">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {(Object.keys(WT_RULESET_LABELS) as WTRulesetVersion[]).map((v) => (
        <SelectItem key={v} value={v}>
          <div className="flex flex-col">
            <span className="font-medium">{WT_RULESET_LABELS[v].label}</span>
            <span className="text-[11px] text-zinc-500">
              {WT_RULESET_LABELS[v].vigencia}
            </span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {config.rulesetVersion !== 'CUSTOM' && (
    <p className="text-[11px] text-zinc-500 mt-1">
      Valores abaixo derivam do preset. Para editar livremente, escolha &quot;Customizado&quot;.
    </p>
  )}
</div>
```

- [ ] **Step 5: Disable scoring/pointGap inputs when ruleset !== CUSTOM**

In the existing score-input fields (`vestHitMin`, `pointGap`, `scoring.spinBody`, etc.), add `disabled={isLocked || config.rulesetVersion !== 'CUSTOM'}`. This prevents operator from editing preset-derived values by mistake.

Apply to these approximate lines in the dialog (from earlier grep):
- `line 130` (scoring.punch input)
- `line 150` (scoring.body)
- `line 179` (scoring.head)
- `line 199` (scoring.spinBody)
- `line 228` (scoring.spinHead)
- `line 248` (pointGap)
- `line 280` (maxRounds — keep editable, independent of ruleset)
- `line 306-406` (threshold inputs — keep editable; category will govern in Task D)

Pattern:
```tsx
disabled={isLocked || config.rulesetVersion !== 'CUSTOM'}
```

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`

- Open app → ModeSelector → Competição
- Click "Configuração"
- Verify: "REGULAMENTO WT" section shows at top with 4 options
- Select "WT Legacy (pré-2026)" → pointGap changes to 12, spinBody to 2, spinHead to 3
- Select "Customizado" → all fields become editable
- Select "WT 2026 (Jun)" → pointGap 15, spinBody 4, spinHead 6
- Save → reopen → persisted correctly

Expected: dropdown functional, preset values apply, CUSTOM unlocks fields.

- [ ] **Step 7: Commit**

```bash
git add src/components/championship/MatchConfigDialog.tsx
git commit -m "feat(match-config-dialog): ruleset dropdown applies WT preset (P0.1)"
```

---

## Stage B — PASSIVITY reason + passivity bonus rule (P0.3a + P0.2)

### Task B.1: Add `PASSIVITY` to `GamjeomReasonId` enum + label

**Files:**
- Modify: `src/types/championship.ts:115-140`

- [ ] **Step 1: Write a failing test**

File: `src/hooks/useChampionshipSync.test.ts`, add inside `Grupo 5 — Gam-jeom`:

```ts
it('GamjeomReasonId aceita PASSIVITY e label existe em PT-BR', () => {
  // Teste de tipo via const assertion
  const reasons: GamjeomReasonId[] = [
    'CROSSING_BOUNDARY', 'FALLING', 'AVOIDING_OR_TURNING_BACK',
    'GRABBING_PUSHING', 'LIFTING_KNEE_BLOCK', 'ATTACK_BELOW_WAIST',
    'ATTACK_WITH_KNEE', 'PUNCH_TO_HEAD', 'ATTACK_FALLEN_OPPONENT',
    'MISCONDUCT', 'OTHER', 'PASSIVITY',
  ];
  expect(reasons).toContain('PASSIVITY');
  expect(GAMJEOM_REASONS['PASSIVITY']).toMatch(/passi/i);
});
```

Add imports at top if missing: `import { GamjeomReasonId, GAMJEOM_REASONS } from '@/types/championship';`

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "PASSIVITY"`
Expected: FAIL — TypeScript error "Type '\"PASSIVITY\"' is not assignable to type 'GamjeomReasonId'".

- [ ] **Step 3: Update enum and label map**

File: `src/types/championship.ts`, replace the `GamjeomReasonId` type (line 115-126):

```ts
export type GamjeomReasonId =
  | 'PASSIVITY'          // Passividade (em últimos 10s do round = +2pts na WT-2026-JUN)
  | 'CROSSING_BOUNDARY'
  | 'FALLING'
  | 'AVOIDING_OR_TURNING_BACK'
  | 'GRABBING_PUSHING'
  | 'LIFTING_KNEE_BLOCK'
  | 'ATTACK_BELOW_WAIST'
  | 'ATTACK_WITH_KNEE'
  | 'PUNCH_TO_HEAD'
  | 'ATTACK_FALLEN_OPPONENT'
  | 'MISCONDUCT'
  | 'OTHER';
```

And add to `GAMJEOM_REASONS` (line 128-140):

```ts
export const GAMJEOM_REASONS: Record<GamjeomReasonId, string> = {
  PASSIVITY: 'Passividade',
  CROSSING_BOUNDARY: 'Cruzar a linha (Kyong-gye)',
  FALLING: 'Queda',
  AVOIDING_OR_TURNING_BACK: 'Evitar / virar de costas',
  GRABBING_PUSHING: 'Segurar / empurrar',
  LIFTING_KNEE_BLOCK: 'Levantar joelho para bloquear',
  ATTACK_BELOW_WAIST: 'Atacar abaixo da cintura',
  ATTACK_WITH_KNEE: 'Ataque com joelho',
  PUNCH_TO_HEAD: 'Soco na cabeça',
  ATTACK_FALLEN_OPPONENT: 'Atacar oponente caído',
  MISCONDUCT: 'Conduta antiesportiva (atleta/treinador)',
  OTHER: 'Outro',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "PASSIVITY"`
Expected: PASS.

- [ ] **Step 5: Update `GamjeomReasonDialog.tsx` — add PASSIVITY to REASON_ORDER**

File: `src/components/championship/GamjeomReasonDialog.tsx:25-37`, change:

```ts
const REASON_ORDER: GamjeomReasonId[] = [
  'PASSIVITY',            // +2pts bonus em últimos 10s — primeira posição
  'CROSSING_BOUNDARY',
  'FALLING',
  'GRABBING_PUSHING',
  'AVOIDING_OR_TURNING_BACK',
  'LIFTING_KNEE_BLOCK',
  'PUNCH_TO_HEAD',
  'ATTACK_WITH_KNEE',
  'ATTACK_BELOW_WAIST',
  'ATTACK_FALLEN_OPPONENT',
  'MISCONDUCT',
  'OTHER',
];
```

Dialog now has 12 reasons. Keyboard shortcuts 1-9 cover 9, plus 0 and `-` for the last 3. Good.

- [ ] **Step 6: Commit**

```bash
git add src/types/championship.ts src/components/championship/GamjeomReasonDialog.tsx src/hooks/useChampionshipSync.test.ts
git commit -m "feat(gamjeom): add PASSIVITY reason to enum + dialog (P0.3a)"
```

---

### Task B.2: Add `GAMJEOM_PASSIVITY_BONUS` event type to `MatchEvent`

**Files:**
- Modify: `src/types/championship.ts:102-112`

- [ ] **Step 1: Write failing test**

File: `src/hooks/useChampionshipSync.test.ts` — add a typed assertion test (doesn't need to execute anything special):

```ts
it('MatchEvent aceita GAMJEOM_PASSIVITY_BONUS type', () => {
  const ev: MatchEvent = {
    id: 'x',
    type: 'GAMJEOM_PASSIVITY_BONUS',
    side: 'RED',
    points: 2,
    ts: 0,
    description: 'bonus',
    reason: 'PASSIVITY',
  };
  expect(ev.type).toBe('GAMJEOM_PASSIVITY_BONUS');
});
```

Add to imports: `import type { MatchEvent } from '@/types/championship';`

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "GAMJEOM_PASSIVITY_BONUS"`
Expected: FAIL — Type error.

- [ ] **Step 3: Update `MatchEvent.type` union**

File: `src/types/championship.ts:102-112`, replace:

```ts
export interface MatchEvent {
  id: string;
  type: ScoreType | 'UNDO' | 'TIMER_START' | 'TIMER_PAUSE' | 'TIMER_RESET' |
        'MEDICAL_START' | 'MEDICAL_END' | 'ROUND_END' | 'ROUND_WIN' |
        'MATCH_END' | 'POINT_GAP' | 'GAMJEOM_LIMIT' | 'ADJUST' |
        'GAMJEOM_PASSIVITY_BONUS' |
        'GOLDEN_ROUND' | 'BREAK_TIME';
  side?: MatchSide;
  points?: number;
  ts: number;
  description: string;
  reason?: GamjeomReasonId;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "GAMJEOM_PASSIVITY_BONUS"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/championship.ts src/hooks/useChampionshipSync.test.ts
git commit -m "feat(events): add GAMJEOM_PASSIVITY_BONUS event type (P0.2)"
```

---

### Task B.3: Test — passivity in last 10s → +2pts, other rounds too

**Files:**
- Modify: `src/hooks/useChampionshipSync.test.ts`

- [ ] **Step 1: Write failing test using fake timers**

Append to test file:

```ts
// ─── Grupo 13: Passividade +2pts nos últimos 10s (WT 2026 Jun) ────────────

describe('Grupo 13 — Gam-jeom PASSIVITY: +2pts no último 10s de qualquer round', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k]);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('PASSIVITY no último 10s do round 1 → oponente ganha +2pts', () => {
    const hook = createMaster();
    startRound(hook);
    // Avança timer até faltarem 5s (round é 120_000ms → 115_000ms decorridos)
    act(() => { vi.advanceTimersByTime(115_000); });
    // timeLeftMs deve estar ~5000
    expect(hook.result.current.state.timeLeftMs).toBeLessThanOrEqual(10_000);

    act(() => { hook.result.current.addGamjeom('RED', 'PASSIVITY'); });

    // Oponente (BLUE) ganha +2pts (não +1)
    expect(hook.result.current.state.roundScoreBlue).toBe(2);
    expect(hook.result.current.state.gamjeomRed).toBe(1);
  });

  it('PASSIVITY no último 10s do round 3 (final) → +2pts, SEM encerrar luta', () => {
    // Configurar pra best-of-3
    const hook = createMaster();
    startRound(hook);
    // Round 1 — Blue vence
    act(() => {
      hook.result.current.addScore('BLUE', 'HEAD');
      hook.result.current.endRound();
    });
    act(() => { hook.result.current.nextRound(); hook.result.current.startTimer(); });
    // Round 2 — Red vence
    act(() => {
      hook.result.current.addScore('RED', 'HEAD');
      hook.result.current.endRound();
    });
    act(() => { hook.result.current.nextRound(); hook.result.current.startTimer(); });
    // Round 3 — avançar pra último 10s
    act(() => { vi.advanceTimersByTime(115_000); });

    act(() => { hook.result.current.addGamjeom('BLUE', 'PASSIVITY'); });

    // Red ganha +2pts, mas luta NÃO termina por anti-stalling (removido)
    expect(hook.result.current.state.roundScoreRed).toBe(2);
    expect(hook.result.current.state.gamjeomBlue).toBe(1);
    // Status deve ser PAUSED (gam-jeom auto-pausa), não MATCH_END
    expect(hook.result.current.state.status).not.toBe('MATCH_END');
  });

  it('PASSIVITY FORA do último 10s → apenas +1pt (regra normal)', () => {
    const hook = createMaster();
    startRound(hook);
    // Avança só 10s (ainda restam 110s)
    act(() => { vi.advanceTimersByTime(10_000); });

    act(() => { hook.result.current.addGamjeom('RED', 'PASSIVITY'); });

    expect(hook.result.current.state.roundScoreBlue).toBe(1);
    expect(hook.result.current.state.gamjeomRed).toBe(1);
  });

  it('Gam-jeom NÃO passividade no último 10s → +1pt (não bonifica)', () => {
    const hook = createMaster();
    startRound(hook);
    act(() => { vi.advanceTimersByTime(115_000); });

    act(() => { hook.result.current.addGamjeom('RED', 'FALLING'); });

    expect(hook.result.current.state.roundScoreBlue).toBe(1);
    expect(hook.result.current.state.gamjeomRed).toBe(1);
  });

  it('Bônus gera evento GAMJEOM_PASSIVITY_BONUS além do GAMJEOM', () => {
    const hook = createMaster();
    startRound(hook);
    act(() => { vi.advanceTimersByTime(115_000); });
    act(() => { hook.result.current.addGamjeom('RED', 'PASSIVITY'); });

    const events = hook.result.current.state.events;
    const bonusEvent = events.find(e => e.type === 'GAMJEOM_PASSIVITY_BONUS');
    expect(bonusEvent).toBeDefined();
    expect(bonusEvent?.side).toBe('RED');
    expect(bonusEvent?.points).toBe(1); // o ponto EXTRA (além do +1 normal)
  });

  it('Ruleset WT-2026-JAN: passivity bonus = 1 (sem bônus)', () => {
    // Configurar ruleset JAN
    const hook = createMaster();
    act(() => {
      hook.result.current.saveConfig({
        ...DEFAULT_MATCH_CONFIG,
        rulesetVersion: 'WT-2026-JAN',
      });
    });
    startRound(hook);
    act(() => { vi.advanceTimersByTime(115_000); });
    act(() => { hook.result.current.addGamjeom('RED', 'PASSIVITY'); });

    // JAN: bônus = 1 → oponente ganha só +1 (comportamento normal)
    expect(hook.result.current.state.roundScoreBlue).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "Grupo 13"`
Expected: FAIL — `addGamjeom(side, reason)` doesn't differentiate passivity, always +1pt.

Note: Tests may fail differently depending on existing anti-stalling block — `round 3 final round tied → MATCH_END` would fire for test #2. That's expected — Task B.4 removes the block.

- [ ] **Step 3: Implement passivity branch in `addGamjeom`**

File: `src/hooks/useChampionshipSync.ts`, within `addGamjeom` callback (starts line 1134).

Replace the body from line 1146 `setState(prev => {` up to the end of the anti-stalling block (line 1183 `});` — just the `if (triggersAntiStalling)` block), and refactor the main branch to compute `pointsFromPassivityBonus`.

The new `addGamjeom` body (replacing the current anti-stalling+normal branches):

```ts
const addGamjeom = useCallback((side: MatchSide, reason?: GamjeomReasonId) => {
  if (role !== 'master') return;
  const s = stateRef.current;
  if (s.status !== 'RUNNING' && s.status !== 'PAUSED') return;

  saveToHistory(s);

  const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
  const opponentLabel = side === 'RED' ? 'Azul' : 'Vermelho';
  const reasonLabel = reason ? ` — ${GAMJEOM_REASONS[reason]}` : '';

  setState(prev => {
    const isRunning = prev.status === 'RUNNING';

    // Ler parâmetros de passividade do ruleset via preset
    // (evita inserir campos no MatchConfig diretamente — mantém source of truth em wtRuleset.ts)
    const { getRulesetPreset } = require('@/lib/wtRuleset') as
      typeof import('@/lib/wtRuleset');
    const ruleset = getRulesetPreset(prev.config.rulesetVersion);

    // Regra WT 2026 (Jun): gam-jeom de PASSIVITY nos últimos 10s de QUALQUER round
    // → oponente ganha +2pts em vez de +1. Não há anti-stalling forçado.
    const isPassivityBonusWindow =
      reason === 'PASSIVITY' &&
      prev.timeLeftMs <= ruleset.gamjeomPassivityWindowMs;
    const passivityBonus = isPassivityBonusWindow
      ? ruleset.gamjeomPassivityBonus
      : 1;  // bônus = 1 significa "sem bônus, comportamento normal"
    const pointsToOpponent = passivityBonus;

    // Contagem de gam-jeom após este incremento
    const newGamjeomRed = side === 'RED' ? prev.gamjeomRed + 1 : prev.gamjeomRed;
    const newGamjeomBlue = side === 'BLUE' ? prev.gamjeomBlue + 1 : prev.gamjeomBlue;

    // WT: 10 gam-jeom = desclassificação (PUN) = MATCH_END imediato
    if (newGamjeomRed >= prev.config.maxGamjeom) {
      const winsNeeded = prev.config.maxRounds === 1 ? 1 : 2;
      const matchEnd: MatchState = {
        ...prev,
        status: 'MATCH_END',
        timeLeftMs: 0,
        gamjeomRed: newGamjeomRed,
        gamjeomBlue: newGamjeomBlue,
        roundWinsBlue: winsNeeded,
        isBreakTime: undefined,
        breakTimeLeftMs: undefined,
        events: [
          createEvent('GAMJEOM_LIMIT',
            'Desclassificação por Faltas (PUN) — Azul vence a luta',
            'BLUE'),
          ...prev.events,
        ].slice(0, MAX_EVENTS),
      };
      broadcast(matchEnd, true);
      return matchEnd;
    }
    if (newGamjeomBlue >= prev.config.maxGamjeom) {
      const winsNeeded = prev.config.maxRounds === 1 ? 1 : 2;
      const matchEnd: MatchState = {
        ...prev,
        status: 'MATCH_END',
        timeLeftMs: 0,
        gamjeomRed: newGamjeomRed,
        gamjeomBlue: newGamjeomBlue,
        roundWinsRed: winsNeeded,
        isBreakTime: undefined,
        breakTimeLeftMs: undefined,
        events: [
          createEvent('GAMJEOM_LIMIT',
            'Desclassificação por Faltas (PUN) — Vermelho vence a luta',
            'RED'),
          ...prev.events,
        ].slice(0, MAX_EVENTS),
      };
      broadcast(matchEnd, true);
      return matchEnd;
    }

    // Eventos a adicionar ao log
    const eventsToAdd: MatchEvent[] = [
      createEvent('GAMJEOM',
        `GAM-JEOM ${sideLabel}${reasonLabel} (+${pointsToOpponent} ponto${pointsToOpponent > 1 ? 's' : ''} ${opponentLabel})`,
        side, pointsToOpponent, reason),
    ];
    if (isPassivityBonusWindow && passivityBonus > 1) {
      eventsToAdd.unshift(
        createEvent('GAMJEOM_PASSIVITY_BONUS',
          `Bônus passividade último 10s — ${opponentLabel} +${passivityBonus - 1} ponto extra`,
          side, passivityBonus - 1, reason),
      );
    }
    if (isRunning) {
      eventsToAdd.push(createEvent('TIMER_PAUSE', 'Auto-pause: Gam-jeom aplicado'));
    }

    const newState: MatchState = {
      ...prev,
      status: isRunning ? 'PAUSED' : prev.status,
      gamjeomRed: newGamjeomRed,
      gamjeomBlue: newGamjeomBlue,
      roundScoreRed: side === 'BLUE' ? prev.roundScoreRed + pointsToOpponent : prev.roundScoreRed,
      roundScoreBlue: side === 'RED' ? prev.roundScoreBlue + pointsToOpponent : prev.roundScoreBlue,
      events: [...eventsToAdd, ...prev.events].slice(0, MAX_EVENTS),
    };
    broadcast(newState, true);
    return newState;
  });
}, [role, saveToHistory, broadcast]);
```

Replace the top-level static `require` with proper top-of-file import — add at top near other wtRuleset-related imports:

```ts
import { getRulesetPreset } from '@/lib/wtRuleset';
```

And remove the `require` line inside the callback, replacing `ruleset = getRulesetPreset(prev.config.rulesetVersion)` with just that call directly.

- [ ] **Step 4: Run passivity tests**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "Grupo 13"`
Expected: PASS — all 6 passivity tests green.

Note: Tests #2 (round 3 final with tied score) will only pass after anti-stalling is removed — next task.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useChampionshipSync.ts src/hooks/useChampionshipSync.test.ts
git commit -m "feat(gamjeom): passivity +2pts bonus in last 10s via ruleset (P0.2)"
```

---

### Task B.4: Remove fabricated anti-stalling block + update broken test

**Files:**
- Modify: `src/hooks/useChampionshipSync.ts` (remove lines 1149-1183 — the `triggersAntiStalling` block)
- Modify: `src/hooks/useChampionshipSync.test.ts:170-195` (old Anti-stalling test)

- [ ] **Step 1: Verify lines 1149-1183 refer to anti-stalling**

Run: `sed -n '1149,1183p' src/hooks/useChampionshipSync.ts`
Expected: block starting with `const isFinalRound = …` through `return newState;` of the anti-stalling branch.

Note: if Task B.3 already replaced the function body wholesale, the anti-stalling block no longer exists — skip to Step 3.

- [ ] **Step 2: Remove the anti-stalling block**

If still present: delete the `if (triggersAntiStalling) { … }` block entirely. The `addGamjeom` function body should match the Task B.3 implementation above.

- [ ] **Step 3: Replace old test "Anti-stalling" (line 170-195)**

File: `src/hooks/useChampionshipSync.test.ts:170-195`. Replace the entire `it('Anti-stalling: gam-jeom nos ultimos 10s do round final com empate encerra luta', ...)` block with:

```ts
it('Anti-stalling WT 2026: NÃO existe — gam-jeom em empate final NÃO encerra luta', () => {
  // Regra fabricada foi removida. Este teste documenta a ausência:
  // gam-jeom no último 10s, round final, empate, NÃO deve forçar MATCH_END.
  const hook = createMaster();
  startRound(hook);

  // Round 1: BLUE vence
  act(() => {
    hook.result.current.addScore('BLUE', 'HEAD');
    hook.result.current.endRound();
  });
  act(() => { hook.result.current.nextRound(); hook.result.current.startTimer(); });
  // Round 2: RED vence
  act(() => {
    hook.result.current.addScore('RED', 'HEAD');
    hook.result.current.endRound();
  });
  act(() => { hook.result.current.nextRound(); hook.result.current.startTimer(); });
  // Round 3 empatado 0-0, aplicar gam-jeom FALLING (não passivity)
  // Não precisa estar no último 10s — testar modo normal
  act(() => { hook.result.current.addGamjeom('RED', 'FALLING'); });

  // BLUE ganha +1, NÃO MATCH_END
  expect(hook.result.current.state.roundScoreBlue).toBe(1);
  expect(hook.result.current.state.status).not.toBe('MATCH_END');
});
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including Grupo 13 passivity and updated anti-stalling-removed test.

- [ ] **Step 5: Manual smoke test (optional but recommended)**

Open dev server, force a round 3 tied scenario + timer to <10s (devtools console: `useChampionshipSync.ts` internal state), apply gam-jeom — verify luta não encerra.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useChampionshipSync.ts src/hooks/useChampionshipSync.test.ts
git commit -m "refactor(gamjeom): remove fabricated anti-stalling block (P0.2)"
```

---

## Stage C — GamjeomReasonDialog integration (P0.3b)

### Task C.1: Wire `GamjeomReasonDialog` in `ChampionshipMat`

**Files:**
- Modify: `src/pages/ChampionshipMat.tsx`

- [ ] **Step 1: Read current wiring**

Run: `grep -n "onAddGamjeom\|GamjeomReasonDialog" src/pages/ChampionshipMat.tsx`
Expected: find current `onAddGamjeom={sync.addGamjeom}` (line ~826). No dialog currently wired.

- [ ] **Step 2: Add dialog state + imports**

File: `src/pages/ChampionshipMat.tsx`, at top with other imports:

```ts
import { GamjeomReasonDialog } from '@/components/championship/GamjeomReasonDialog';
import type { GamjeomReasonId, MatchSide } from '@/types/championship';
```

Inside the `ChampionshipMat` component body, near other `useState` hooks:

```ts
const [gamjeomDialog, setGamjeomDialog] = useState<{ open: boolean; side: MatchSide | null }>({
  open: false,
  side: null,
});
```

- [ ] **Step 3: Add handlers**

Near other handlers:

```ts
const handleRequestGamjeom = (side: MatchSide) => {
  setGamjeomDialog({ open: true, side });
};

const handleConfirmGamjeom = (reason: GamjeomReasonId) => {
  const side = gamjeomDialog.side;
  if (!side) return;
  sync.addGamjeom(side, reason);
  setGamjeomDialog({ open: false, side: null });
};

const handleCancelGamjeom = () => {
  setGamjeomDialog({ open: false, side: null });
};
```

- [ ] **Step 4: Change prop in ScoringButtons invocation**

Replace (around line 826):

```tsx
onAddGamjeom={sync.addGamjeom}
```

with:

```tsx
onAddGamjeom={handleRequestGamjeom}
```

- [ ] **Step 5: Render dialog in JSX**

Near end of JSX, before the closing root tag:

```tsx
<GamjeomReasonDialog
  open={gamjeomDialog.open}
  side={gamjeomDialog.side}
  onConfirm={handleConfirmGamjeom}
  onCancel={handleCancelGamjeom}
/>
```

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`
- Start a match (setup → Iniciar)
- Click gam-jeom button (+ for side BLUE or RED)
- Expected: dialog opens with 12 reasons, PASSIVITY at top
- Click one → gam-jeom applies, reason visible in event log
- Cancel → no gam-jeom applied
- Press `1` (PASSIVITY) → applies PASSIVITY
- Press `Escape` → cancels

- [ ] **Step 7: Commit**

```bash
git add src/pages/ChampionshipMat.tsx
git commit -m "feat(ui): wire GamjeomReasonDialog in ChampionshipMat (P0.3)"
```

---

### Task C.2: Test that `reason` persists in MatchEvent

**Files:**
- Modify: `src/hooks/useChampionshipSync.test.ts`

- [ ] **Step 1: Write test**

Append to `Grupo 5 — Gam-jeom`:

```ts
it('reason persiste no MatchEvent', () => {
  const hook = createMaster();
  startRound(hook);

  act(() => { hook.result.current.addGamjeom('RED', 'CROSSING_BOUNDARY'); });

  const latestEvent = hook.result.current.state.events.find(e => e.type === 'GAMJEOM');
  expect(latestEvent?.reason).toBe('CROSSING_BOUNDARY');
});

it('sem reason, evento é persistido sem o campo (OTHER é opt-in)', () => {
  const hook = createMaster();
  startRound(hook);

  act(() => { hook.result.current.addGamjeom('RED'); });

  const latestEvent = hook.result.current.state.events.find(e => e.type === 'GAMJEOM');
  expect(latestEvent?.reason).toBeUndefined();
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "reason persiste"`
Expected: PASS — reason already supported in `createEvent` call (Task B.3 implementation).

If it fails: verify the `createEvent('GAMJEOM', ..., side, pointsToOpponent, reason)` call in `addGamjeom` — the 5th arg is the reason.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useChampionshipSync.test.ts
git commit -m "test(gamjeom): assert reason persists in MatchEvent (P0.3)"
```

---

## Stage D — MatchCategory como metadata + guardrail não-bloqueante (P0.4 revisado)

**Decisão do checkpoint 3 (revisada pela Fase 2 inicial):** threshold é **MANUAL**,
não auto-derivado da categoria. `category` é metadata obrigatória mas **não** override
os valores que o operador configurou no CalibrationWizard.

Razão: operador precisa de flexibilidade real (bateria baixa, sensor desgastado,
condição atípica). Auto-derivação é paternalista. Guardrail não-bloqueante informa
quando threshold está fora da faixa típica da categoria, sem forçar override.

**O que fica:**
- `MatchCategory` enum obrigatório em `MatchConfig`
- `MATCH_CATEGORIES` tabela com `thresholds` por preset (usada como referência/range pelo wizard e pelo guardrail)
- `deriveImpactThresholds(category)` existe mas é usado só como **starting point** do `CalibrationWizardDialog`, não como override em `saveConfig`
- `calibrated` flag lifecycle:
  - `true` após sucesso do `CalibrationWizardDialog`
  - permanece `true` se operador editar threshold manualmente depois (marca "já passou pelo wizard", não "está calibrado pros valores atuais")
  - volta pra `false` só em reset explícito da config ou criação de config nova
  - config carregada de luta anterior preserva `calibrated`
- CUSTOM exige `calibrated: true` pra destravar "Iniciar" (força passar pelo wizard 1x)

**O que muda vs plano original:**
- **Removido:** auto-derivação em `saveConfig` / `updateConfigInPlace` (Task D.3 reescrita)
- **Adicionado:** `getCategoryThresholdRange(category)` + alert não-bloqueante no "Iniciar"
- Cenário C3 (esquecer trocar threshold entre categorias) fica **mitigado pelo alert**, não erradicado. Trade-off aceito: autonomia > automação.

### Task D.1: Define `MatchCategory` enum + threshold lookup table

**Files:**
- Create: `src/lib/matchCategory.ts`
- Create: `src/lib/matchCategory.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/matchCategory.test.ts
import { describe, it, expect } from 'vitest';
import {
  MATCH_CATEGORIES,
  deriveImpactThresholds,
  type MatchCategory,
} from './matchCategory';

describe('MatchCategory presets', () => {
  it('ADULTO threshold: vest 20/30, helmet 20/30', () => {
    const th = deriveImpactThresholds('ADULTO');
    expect(th.vestHitMin).toBe(20);
    expect(th.vestPointMin).toBe(30);
    expect(th.helmetHitMin).toBe(20);
    expect(th.helmetPointMin).toBe(30);
  });

  it('INFANTIL threshold: mais baixo', () => {
    const th = deriveImpactThresholds('INFANTIL');
    expect(th.vestHitMin).toBe(14);
    expect(th.vestPointMin).toBe(18);
  });

  it('CADETE threshold', () => {
    const th = deriveImpactThresholds('CADETE');
    expect(th.vestHitMin).toBe(16);
    expect(th.vestPointMin).toBe(22);
  });

  it('JUVENIL threshold', () => {
    const th = deriveImpactThresholds('JUVENIL');
    expect(th.vestHitMin).toBe(18);
    expect(th.vestPointMin).toBe(25);
  });

  it('CUSTOM: retorna null/marker — operador define', () => {
    const th = deriveImpactThresholds('CUSTOM');
    expect(th).toBeNull();
  });

  it('MATCH_CATEGORIES tem os 5 itens', () => {
    const keys: MatchCategory[] = ['INFANTIL', 'CADETE', 'JUVENIL', 'ADULTO', 'CUSTOM'];
    for (const k of keys) {
      expect(MATCH_CATEGORIES[k]).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/matchCategory.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
// src/lib/matchCategory.ts
/**
 * Match category drives impact thresholds automatically.
 * Values from WT competition rules per age group.
 *
 * Source: AUDIT.md P0.4 + CalibrationWizardDialog presets (histórico),
 * validados contra regras WT 2026.
 */
export type MatchCategory = 'INFANTIL' | 'CADETE' | 'JUVENIL' | 'ADULTO' | 'CUSTOM';

export interface CategoryThresholds {
  vestHitMin: number;
  vestPointMin: number;
  helmetHitMin: number;
  helmetPointMin: number;
}

export interface MatchCategoryPreset {
  id: MatchCategory;
  label: string;
  ageRange: string;
  thresholds: CategoryThresholds | null;  // null = CUSTOM
}

export const MATCH_CATEGORIES: Record<MatchCategory, MatchCategoryPreset> = {
  INFANTIL: {
    id: 'INFANTIL',
    label: 'Infantil',
    ageRange: '8-11 anos',
    thresholds: {
      vestHitMin: 14, vestPointMin: 18,
      helmetHitMin: 14, helmetPointMin: 18,
    },
  },
  CADETE: {
    id: 'CADETE',
    label: 'Cadete',
    ageRange: '12-14 anos',
    thresholds: {
      vestHitMin: 16, vestPointMin: 22,
      helmetHitMin: 16, helmetPointMin: 22,
    },
  },
  JUVENIL: {
    id: 'JUVENIL',
    label: 'Juvenil',
    ageRange: '15-17 anos',
    thresholds: {
      vestHitMin: 18, vestPointMin: 25,
      helmetHitMin: 18, helmetPointMin: 25,
    },
  },
  ADULTO: {
    id: 'ADULTO',
    label: 'Adulto',
    ageRange: '18+ anos',
    thresholds: {
      vestHitMin: 20, vestPointMin: 30,
      helmetHitMin: 20, helmetPointMin: 30,
    },
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Customizado (calibração manual)',
    ageRange: '—',
    thresholds: null,
  },
};

/**
 * Returns preset thresholds for a category, or null for CUSTOM (requires manual calibration).
 */
export function deriveImpactThresholds(category: MatchCategory): CategoryThresholds | null {
  const preset = MATCH_CATEGORIES[category];
  return preset.thresholds ? { ...preset.thresholds } : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/matchCategory.test.ts`
Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/matchCategory.ts src/lib/matchCategory.test.ts
git commit -m "feat(match-category): MatchCategory enum + threshold presets (P0.4)"
```

---

### Task D.2: Add `category` (required) to `MatchConfig` + default

**Files:**
- Modify: `src/types/championship.ts`
- Modify: `src/lib/matchConfigMigration.ts`
- Modify: `src/hooks/useChampionshipSync.test.ts`

- [ ] **Step 1: Write failing test**

Append to test file. Threshold default fica em 5/5 (defaults baixos de bancada — operador
AJUSTA antes da próxima luta). Categoria é metadata, não controla threshold.

```ts
it('Config default: category = ADULTO (metadata) + thresholds permanecem manuais (defaults de bancada)', () => {
  expect(DEFAULT_MATCH_CONFIG.category).toBe('ADULTO');
  // Threshold NAO eh auto-derivado da categoria — eh manual.
  // Defaults baixos sao intencionais (bancada); operador ajusta antes da luta.
  expect(DEFAULT_MATCH_CONFIG.impactThresholds?.vestHitMin).toBe(5);
  expect(DEFAULT_MATCH_CONFIG.impactThresholds?.vestPointMin).toBe(5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "category = ADULTO"`
Expected: FAIL — `category` é undefined no DEFAULT_MATCH_CONFIG ainda.

- [ ] **Step 3: Add `category` to `MatchConfig`**

File: `src/types/championship.ts`. Near top, add import (apenas o type — `deriveImpactThresholds`
não é mais usado em saveConfig por decisão do checkpoint 3):

```ts
import type { MatchCategory } from '@/lib/matchCategory';
```

In `MatchConfig` interface, add (near `matId`):

```ts
  /**
   * Categoria de competicao — METADATA. Nao auto-deriva thresholds.
   * Usada pelo guardrail nao-bloqueante (validateThresholdsAgainstCategory)
   * pra avisar operador se threshold manual esta fora da faixa tipica.
   */
  category: MatchCategory;
```

Update `DEFAULT_MATCH_CONFIG`. Os valores numéricos vêm do ruleset (consistentes com
WT-2026-JAN preset). Threshold continua manual — começa baixo (5/5/3/3, valor de bancada),
operador ajusta no wizard. Categoria `ADULTO` é razoável como default mas o operador deve
trocar se for outra faixa etária.

```ts
export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  roundTimeMs: 120000,
  medicalTimeMs: 60000,
  breakTimeMs: 60000,
  maxRounds: 3,
  maxGamjeom: 10,
  pointGap: 12,                    // consistente com WT-2026-JAN preset
  scoring: DEFAULT_SCORE_CONFIG,   // {1, 2, 3, 4, 6} — consistente com WT-2026-JAN
  matId: 1,
  rulesetVersion: 'WT-2026-JAN',   // regra vigente hoje
  category: 'ADULTO',              // metadata; operador troca conforme a luta
  scoringInput: 'impacts',
  impactThresholds: {
    // Defaults baixos de bancada — operador AJUSTA via CalibrationWizardDialog
    // ou MatchConfigDialog. Guardrail no Iniciar avisa se fora da faixa tipica
    // da categoria selecionada.
    vestHitMin: 5,
    vestPointMin: 5,
    helmetHitMin: 3,
    helmetPointMin: 3,
    noiseFloor: {},
  },
};
```

- [ ] **Step 4: Update migration to set `category: 'CUSTOM'` for legacy**

File: `src/lib/matchConfigMigration.ts`, add to the migration logic after rulesetVersion:

```ts
import type { MatchCategory } from './matchCategory';

function isValidCategory(v: unknown): v is MatchCategory {
  return typeof v === 'string' &&
    ['INFANTIL', 'CADETE', 'JUVENIL', 'ADULTO', 'CUSTOM'].includes(v);
}

// Inside migrateMatchConfig, after rulesetVersion assignment:
base.category = isValidCategory(raw.category) ? raw.category : 'CUSTOM';
```

Update the migration test (`src/lib/matchConfigMigration.test.ts`) with:

```ts
it('legacy config sem category é tagged CUSTOM', () => {
  const legacy = { ...DEFAULT_MATCH_CONFIG } as Record<string, unknown>;
  delete legacy.category;
  const migrated = migrateMatchConfig(legacy);
  expect(migrated.category).toBe('CUSTOM');
});
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all green. Como threshold default permanece 5/5 (não mudamos pra 20/30), testes
existentes que dependem desses valores continuam válidos. Apenas o novo teste de category
do passo 1 agora passa.

- [ ] **Step 6: Commit**

```bash
git add src/types/championship.ts src/lib/matchConfigMigration.ts src/lib/matchConfigMigration.test.ts src/hooks/useChampionshipSync.test.ts
git commit -m "feat(match-config): add category (required), default ADULTO (P0.4)"
```

---

### Task D.3: Category dropdown na UI + guardrail não-bloqueante no "Iniciar"

**Files:**
- Modify: `src/lib/matchCategory.ts` (adiciona `getCategoryThresholdRange`)
- Modify: `src/lib/matchCategory.test.ts` (cobertura do range)
- Modify: `src/components/championship/MatchConfigDialog.tsx` (dropdown de categoria)
- Modify: `src/pages/ChampionshipMat.tsx` (alert não-bloqueante antes de `startTimer`)
- Modify: `src/hooks/useChampionshipSync.test.ts` (verifica que saveConfig **preserva** thresholds manuais)

**Importante:** ao contrário do plano original, **NÃO há auto-derivação em `saveConfig` /
`updateConfigInPlace`**. Threshold é o que o operador definiu — sistema não sobrescreve.

- [ ] **Step 1: Write failing test — saveConfig preserva thresholds manuais mesmo se category mudar**

Append:

```ts
it('saveConfig com category=INFANTIL PRESERVA thresholds manuais do operador', () => {
  const hook = createMaster();
  act(() => {
    hook.result.current.saveConfig({
      ...DEFAULT_MATCH_CONFIG,
      category: 'INFANTIL',
      impactThresholds: {
        vestHitMin: 25, vestPointMin: 35,  // valores do operador
        helmetHitMin: 20, helmetPointMin: 28,
        noiseFloor: {},
      },
    });
  });
  // Thresholds NÃO são sobrescritos pelos valores típicos do preset INFANTIL
  expect(hook.result.current.state.config.impactThresholds?.vestHitMin).toBe(25);
  expect(hook.result.current.state.config.impactThresholds?.vestPointMin).toBe(35);
  expect(hook.result.current.state.config.category).toBe('INFANTIL');
});

it('saveConfig com category=CUSTOM preserva thresholds (inalterado)', () => {
  const hook = createMaster();
  act(() => {
    hook.result.current.saveConfig({
      ...DEFAULT_MATCH_CONFIG,
      category: 'CUSTOM',
      impactThresholds: {
        vestHitMin: 27, vestPointMin: 40,
        helmetHitMin: 22, helmetPointMin: 30,
        noiseFloor: {},
      },
    });
  });
  expect(hook.result.current.state.config.impactThresholds?.vestHitMin).toBe(27);
  expect(hook.result.current.state.config.impactThresholds?.vestPointMin).toBe(40);
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "PRESERVA thresholds manuais"`
Expected: PASS imediato — `saveConfig` já não faz auto-derivação por padrão (não modificamos
a função). Esse teste funciona como **contract guard** contra regressão futura (se alguém
tentar re-introduzir auto-derivação, o teste quebra).

- [ ] **Step 3: Adicionar `getCategoryThresholdRange` helper**

File: `src/lib/matchCategory.ts`, adicionar ao final:

```ts
/**
 * Retorna a faixa típica (±20%) de thresholds para a categoria.
 * Usada pelo guardrail não-bloqueante no "Iniciar" — informa o operador
 * se threshold manual está fora da faixa razoável pra categoria selecionada.
 * Retorna null para CUSTOM (operador escolheu modo manual, sem guardrail).
 */
export interface CategoryThresholdRange {
  vestHitMin: { min: number; max: number };
  vestPointMin: { min: number; max: number };
  helmetHitMin: { min: number; max: number };
  helmetPointMin: { min: number; max: number };
}

export function getCategoryThresholdRange(category: MatchCategory): CategoryThresholdRange | null {
  const preset = MATCH_CATEGORIES[category];
  if (!preset.thresholds) return null;  // CUSTOM
  const t = preset.thresholds;
  const widen = (v: number) => ({
    min: Math.max(1, Math.round(v * 0.8)),
    max: Math.round(v * 1.2),
  });
  return {
    vestHitMin: widen(t.vestHitMin),
    vestPointMin: widen(t.vestPointMin),
    helmetHitMin: widen(t.helmetHitMin),
    helmetPointMin: widen(t.helmetPointMin),
  };
}

/**
 * Retorna array com strings descrevendo quais thresholds estão fora da faixa
 * típica da categoria. Array vazio = tudo dentro da faixa. Null = CUSTOM (sem alert).
 */
export function validateThresholdsAgainstCategory(
  category: MatchCategory,
  thresholds: { vestHitMin: number; vestPointMin: number; helmetHitMin: number; helmetPointMin: number },
): string[] | null {
  const range = getCategoryThresholdRange(category);
  if (!range) return null;
  const warnings: string[] = [];
  const check = (label: string, value: number, r: { min: number; max: number }) => {
    if (value < r.min) warnings.push(`${label}=${value} abaixo da faixa típica (${r.min}-${r.max})`);
    if (value > r.max) warnings.push(`${label}=${value} acima da faixa típica (${r.min}-${r.max})`);
  };
  check('vest hit', thresholds.vestHitMin, range.vestHitMin);
  check('vest point', thresholds.vestPointMin, range.vestPointMin);
  check('helmet hit', thresholds.helmetHitMin, range.helmetHitMin);
  check('helmet point', thresholds.helmetPointMin, range.helmetPointMin);
  return warnings;
}
```

- [ ] **Step 4: Testes da nova helper**

File: `src/lib/matchCategory.test.ts`, append:

```ts
describe('getCategoryThresholdRange', () => {
  it('ADULTO: faixa ±20% dos valores típicos', () => {
    const r = getCategoryThresholdRange('ADULTO');
    expect(r).not.toBeNull();
    expect(r!.vestHitMin.min).toBe(16); // 20 * 0.8
    expect(r!.vestHitMin.max).toBe(24); // 20 * 1.2
  });

  it('CUSTOM: retorna null (sem guardrail)', () => {
    expect(getCategoryThresholdRange('CUSTOM')).toBeNull();
  });
});

describe('validateThresholdsAgainstCategory', () => {
  it('thresholds dentro da faixa: array vazio', () => {
    const w = validateThresholdsAgainstCategory('ADULTO', {
      vestHitMin: 20, vestPointMin: 30, helmetHitMin: 20, helmetPointMin: 30,
    });
    expect(w).toEqual([]);
  });

  it('threshold abaixo da faixa: retorna warning específico', () => {
    const w = validateThresholdsAgainstCategory('ADULTO', {
      vestHitMin: 5, vestPointMin: 30, helmetHitMin: 20, helmetPointMin: 30,
    });
    expect(w).toHaveLength(1);
    expect(w![0]).toMatch(/vest hit=5 abaixo/);
  });

  it('CUSTOM: retorna null (sem alert)', () => {
    const w = validateThresholdsAgainstCategory('CUSTOM', {
      vestHitMin: 999, vestPointMin: 0, helmetHitMin: 0, helmetPointMin: 0,
    });
    expect(w).toBeNull();
  });
});
```

Run: `npx vitest run src/lib/matchCategory.test.ts`
Expected: PASS — todos os testes de range + validation.

- [ ] **Step 5: Adicionar category dropdown no `MatchConfigDialog`**

File: `src/components/championship/MatchConfigDialog.tsx`.

Import:

```ts
import { MATCH_CATEGORIES, type MatchCategory } from '@/lib/matchCategory';
```

Handler:

```ts
const handleCategoryChange = (category: MatchCategory) => {
  setConfig(prev => ({ ...prev, category }));
};
```

Section abaixo do ruleset dropdown (Task A.5):

```tsx
<div className="px-6 py-3 border-b border-zinc-800">
  <Label className="text-xs font-semibold text-zinc-400 mb-1.5 block">
    CATEGORIA
  </Label>
  <Select
    value={config.category}
    onValueChange={(v) => handleCategoryChange(v as MatchCategory)}
    disabled={isLocked}
  >
    <SelectTrigger className="bg-zinc-800 border-zinc-700">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {(Object.keys(MATCH_CATEGORIES) as MatchCategory[]).map((c) => (
        <SelectItem key={c} value={c}>
          {MATCH_CATEGORIES[c].label} ({MATCH_CATEGORIES[c].ageRange})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-[11px] text-zinc-500 mt-1">
    Categoria é metadata do log. Threshold continua manual — configure pelo wizard de calibração.
  </p>
</div>
```

**Nota importante:** threshold inputs continuam editáveis (**não** são disabled quando category
!== CUSTOM). Category é metadata; não ditatoria. Se operador quer configuração atípica (ex:
colete com sensor desgastado), ele pode.

- [ ] **Step 6: Alert não-bloqueante no "Iniciar"**

File: `src/pages/ChampionshipMat.tsx`. Import helper:

```ts
import { validateThresholdsAgainstCategory } from '@/lib/matchCategory';
```

Estado + handler pro alert (próximo aos outros useState):

```ts
const [thresholdWarning, setThresholdWarning] = useState<string[] | null>(null);

const handleStartWithGuardrail = () => {
  const c = sync.state.config;
  if (!c.impactThresholds) {
    sync.startTimer();
    return;
  }
  const warnings = validateThresholdsAgainstCategory(c.category, c.impactThresholds);
  if (warnings && warnings.length > 0) {
    setThresholdWarning(warnings);  // abre modal — operador confirma
    return;
  }
  sync.startTimer();  // sem warnings = inicia direto
};

const handleConfirmStartAnyway = () => {
  setThresholdWarning(null);
  sync.startTimer();
};

const handleCancelStart = () => {
  setThresholdWarning(null);
};
```

Substitui chamadas `sync.startTimer()` no botão "Iniciar" por `handleStartWithGuardrail`.

AlertDialog JSX (perto do GamjeomReasonDialog):

```tsx
<AlertDialog open={!!thresholdWarning} onOpenChange={(o) => !o && handleCancelStart()}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>⚠ Threshold fora da faixa típica</AlertDialogTitle>
      <AlertDialogDescription asChild>
        <div>
          <p className="mb-2">
            Threshold configurado está fora da faixa típica para categoria{' '}
            <strong>{sync.state.config.category}</strong>:
          </p>
          <ul className="list-disc pl-5 text-xs space-y-1">
            {thresholdWarning?.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
          <p className="mt-3 text-xs text-zinc-400">
            Isso pode ser intencional (bateria baixa, sensor desgastado, condição atípica).
            Deseja continuar mesmo assim?
          </p>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <Button variant="outline" onClick={handleCancelStart}>Revisar</Button>
      <Button onClick={handleConfirmStartAnyway}>Continuar</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Se `category === 'CUSTOM'`, `validateThresholdsAgainstCategory` retorna null → nunca abre
o alert. Operador em CUSTOM escolheu modo manual.

- [ ] **Step 7: Manual smoke test**

- Abrir MatchConfig → Categoria: ADULTO
- Threshold tab → editar vestHitMin pra 5 (muito baixo)
- Salvar → tentar Iniciar
- Verify: modal abre listando "vest hit=5 abaixo da faixa típica (16-24)"
- Clicar "Continuar" → round inicia
- Recomeçar, clicar "Revisar" em vez → volta pro setup
- Trocar categoria pra CUSTOM → tentar Iniciar com mesmo threshold
- Verify: **não abre modal** (CUSTOM = sem guardrail)

- [ ] **Step 8: Commit**

```bash
git add src/lib/matchCategory.ts src/lib/matchCategory.test.ts src/components/championship/MatchConfigDialog.tsx src/pages/ChampionshipMat.tsx src/hooks/useChampionshipSync.test.ts
git commit -m "feat(match-category): category dropdown + threshold guardrail alert (P0.4 revisado)"
```

---

### Task D.4: Flag `calibrated` + bloqueio do "Iniciar" só pra CUSTOM

**Files:**
- Modify: `src/types/championship.ts` (add `calibrated?: boolean` to `MatchConfig`)
- Modify: `src/hooks/useChampionshipSync.ts` (startTimer guard)
- Modify: `src/components/championship/CalibrationWizardDialog.tsx` (set `calibrated: true` on completion — check if file exists)

**Lifecycle do `calibrated` (decisão do checkpoint 3):**
- `true` após sucesso do `CalibrationWizardDialog`
- Permanece `true` mesmo se operador mudar threshold manualmente depois (marca "já passou pelo wizard uma vez", não "está calibrado pro threshold atual")
- Volta pra `false` **só** em reset explícito de config ou criação de config nova (via `saveConfig(DEFAULT_MATCH_CONFIG)`)
- Config carregada de luta anterior preserva `calibrated`
- **CUSTOM requer `calibrated: true` pra destravar "Iniciar"** (força passar pelo wizard 1x)
- Categorias INFANTIL/CADETE/JUVENIL/ADULTO **não exigem** calibração (threshold manual livre)

- [ ] **Step 1: Check if CalibrationWizardDialog exists**

Run: `ls src/components/championship/CalibrationWizardDialog.tsx 2>&1 || echo "NOT FOUND"`

If missing, this step degrades to: "Block Iniciar if category=CUSTOM" without wizard integration. Operator must toggle a manual "Calibrado" checkbox in MatchConfigDialog. Adapt below.

- [ ] **Step 2: Write failing test**

```ts
it('startTimer bloqueado se category=CUSTOM e calibrated !== true', () => {
  const hook = createMaster();
  act(() => {
    hook.result.current.saveConfig({
      ...DEFAULT_MATCH_CONFIG,
      category: 'CUSTOM',
      calibrated: false,
    });
  });
  act(() => { hook.result.current.startTimer(); });

  expect(hook.result.current.state.status).toBe('IDLE'); // NÃO foi pra RUNNING
});

it('startTimer OK se category=CUSTOM e calibrated=true', () => {
  const hook = createMaster();
  act(() => {
    hook.result.current.saveConfig({
      ...DEFAULT_MATCH_CONFIG,
      category: 'CUSTOM',
      calibrated: true,
      impactThresholds: {
        vestHitMin: 22, vestPointMin: 30,
        helmetHitMin: 22, helmetPointMin: 30,
        noiseFloor: {},
      },
    });
  });
  act(() => { hook.result.current.startTimer(); });

  expect(hook.result.current.state.status).toBe('RUNNING');
});

it('startTimer OK se category=ADULTO (calibration não necessária)', () => {
  const hook = createMaster();
  // DEFAULT já é ADULTO
  act(() => { hook.result.current.startTimer(); });

  expect(hook.result.current.state.status).toBe('RUNNING');
});
```

- [ ] **Step 3: Run tests to fail**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "startTimer bloqueado"`
Expected: FAIL — `calibrated` not a field, no guard.

- [ ] **Step 4: Add `calibrated` to `MatchConfig`**

File: `src/types/championship.ts`, in interface:

```ts
  /** Marker set when CUSTOM category has been explicitly calibrated. */
  calibrated?: boolean;
```

In `DEFAULT_MATCH_CONFIG`, no change needed (undefined = not calibrated, but category=ADULTO so doesn't matter).

- [ ] **Step 5: Guard in `startTimer`**

File: `src/hooks/useChampionshipSync.ts`, find `startTimer` callback (search `const startTimer`) and add near top:

```ts
const startTimer = useCallback(() => {
  if (role !== 'master') return;
  const s = stateRef.current;
  if (s.status === 'MATCH_END') return;
  if (!s.hasConfig) return;
  // NEW guard: CUSTOM category requires explicit calibration
  if (s.config.category === 'CUSTOM' && !s.config.calibrated) {
    logger.warn('[Champ] Cannot start — category=CUSTOM requires calibration first');
    return;
  }
  // ... rest of existing logic
}, [...]);
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/hooks/useChampionshipSync.test.ts -t "startTimer"`
Expected: PASS — 3 new tests + existing startTimer tests unchanged.

- [ ] **Step 7: UI affordance — Mat button shows "Calibrar antes" when blocked**

File: `src/pages/ChampionshipMat.tsx` — find the "Iniciar" button. Near it:

```tsx
{sync.state.config.category === 'CUSTOM' && !sync.state.config.calibrated && (
  <p className="text-xs text-amber-500 mt-1">
    Categoria customizada requer calibração antes de iniciar.
  </p>
)}
```

And optionally disable the button when this is the case:

```tsx
disabled={!sync.state.hasConfig ||
  (sync.state.config.category === 'CUSTOM' && !sync.state.config.calibrated)}
```

- [ ] **Step 8: Set `calibrated: true` in CalibrationWizardDialog completion (if exists)**

If `CalibrationWizardDialog.tsx` exists, find its `onConfirm`/`onSave` and ensure the final config it returns includes `calibrated: true`.

If not exists: add checkbox "Calibração concluída" in `MatchConfigDialog` (only visible when category=CUSTOM) that toggles `config.calibrated`.

Pattern for dialog (in MatchConfigDialog, inside the category `<div>` section, after the amber warning):

```tsx
{config.category === 'CUSTOM' && (
  <label className="flex items-center gap-2 mt-2 text-xs text-zinc-300 cursor-pointer">
    <input
      type="checkbox"
      checked={!!config.calibrated}
      onChange={(e) => setConfig(prev => ({ ...prev, calibrated: e.target.checked }))}
      disabled={isLocked}
    />
    Marcar como calibrado manualmente
  </label>
)}
```

- [ ] **Step 9: Commit**

```bash
git add src/types/championship.ts src/hooks/useChampionshipSync.ts src/pages/ChampionshipMat.tsx src/components/championship/MatchConfigDialog.tsx src/hooks/useChampionshipSync.test.ts
git commit -m "feat(match-config): CUSTOM category requires calibration marker (P0.4)"
```

---

## Stage E — Release polish (v1.5.0)

### Task E.0: Evento `BREAKING_CHANGE_ANTI_STALLING` no primeiro load detectando config v1.4.x

Rationale: rastreabilidade de adoção. Quando um operador rodando v1.4.x abre v1.5.0
pela primeira vez e o sistema migra a config legacy, queremos um evento no log
documentando que o usuário foi exposto à breaking change (anti-stalling removido).
Isso permite, em pós-mortem futuro, identificar lutas que rodaram com regra fabricada.

**Files:**
- Modify: `src/types/championship.ts` (add `BREAKING_CHANGE_ANTI_STALLING` to `MatchEvent.type`)
- Modify: `src/lib/matchConfigMigration.ts` (sinaliza quando migração veio de config v1.4.x)
- Modify: `src/hooks/useChampionshipSync.ts` (loga evento na próxima `saveConfig` pós-migração)

- [ ] **Step 1: Adicionar `BREAKING_CHANGE_ANTI_STALLING` ao MatchEvent.type**

File: `src/types/championship.ts`, na união do `MatchEvent.type`:

```ts
type: ScoreType | 'UNDO' | 'TIMER_START' | ... |
      'GAMJEOM_PASSIVITY_BONUS' |
      'BREAKING_CHANGE_ANTI_STALLING' |
      'GOLDEN_ROUND' | 'BREAK_TIME';
```

- [ ] **Step 2: Migration retorna flag indicando origem legacy**

File: `src/lib/matchConfigMigration.ts`, mudar assinatura:

```ts
export interface MigrationResult {
  config: MatchConfig;
  /** True se a config raw veio de v1.4.x (sem rulesetVersion) — exige aviso de breaking change. */
  migratedFromLegacy: boolean;
}

export function migrateMatchConfig(raw: Record<string, unknown>): MigrationResult {
  // ...lógica existente, build base...
  const migratedFromLegacy = raw.rulesetVersion === undefined;
  return { config: base, migratedFromLegacy };
}
```

Ajustar testes existentes em `matchConfigMigration.test.ts` pra desestruturar `.config`:

```ts
const { config: migrated, migratedFromLegacy } = migrateMatchConfig(legacy);
expect(migrated.rulesetVersion).toBe('CUSTOM');
expect(migratedFromLegacy).toBe(true);
```

- [ ] **Step 3: Hook loga evento ao detectar migração legacy**

File: `src/hooks/useChampionshipSync.ts`, na carga inicial após migration:

```ts
const saved = localStorage.getItem(getConfigStorageKey(matId));
if (saved) {
  const parsed = JSON.parse(saved);
  const { config: migrated, migratedFromLegacy } = migrateMatchConfig(parsed);

  // Persiste a config migrada de volta (assim sa proxima carga nao re-migra)
  localStorage.setItem(getConfigStorageKey(matId), JSON.stringify(migrated));

  setState(prev => ({ ...prev, config: migrated, hasConfig: true, ... }));

  // Se veio de v1.4.x: log evento de breaking change UMA VEZ
  if (migratedFromLegacy) {
    const FLAG = `spe-breaking-change-anti-stalling-logged-mat-${matId}`;
    if (!localStorage.getItem(FLAG)) {
      // Inserir no proximo broadcast/state update
      // (delegar pra useEffect que dispara apos hasConfig=true)
      pendingBreakingChangeLogRef.current = true;
      localStorage.setItem(FLAG, '1');
    }
  }
}
```

E em useEffect que monitora hasConfig:

```ts
useEffect(() => {
  if (state.hasConfig && pendingBreakingChangeLogRef.current) {
    pendingBreakingChangeLogRef.current = false;
    setState(prev => ({
      ...prev,
      events: [
        createEvent('BREAKING_CHANGE_ANTI_STALLING',
          'Config migrada de v1.4.x — regra "anti-stalling" foi removida em v1.5.0. ' +
          'Cenário coberto agora por passividade +2pts (ver WhatsNewDialog).'),
        ...prev.events,
      ].slice(0, MAX_EVENTS),
    }));
  }
}, [state.hasConfig]);
```

`pendingBreakingChangeLogRef` é `useRef<boolean>(false)` declarado próximo aos outros refs.

- [ ] **Step 4: Test — evento é logado UMA vez em config legacy, NÃO em config nova**

Append a `useChampionshipSync.test.ts`:

```ts
it('config legacy v1.4.x: evento BREAKING_CHANGE_ANTI_STALLING é logado UMA vez', () => {
  const legacyConfig = {
    roundTimeMs: 120000, medicalTimeMs: 60000, breakTimeMs: 60000,
    maxRounds: 3, maxGamjeom: 10, pointGap: 20,
    scoring: { punch: 1, body: 2, head: 3, spinBody: 4, spinHead: 6 },
    matId: 1,
    impactThresholds: { vestHitMin: 5, vestPointMin: 5, helmetHitMin: 3, helmetPointMin: 3, noiseFloor: {} },
    // sem rulesetVersion = legacy
  };
  store['championship-config-mat-1'] = JSON.stringify(legacyConfig);

  const hook = createMasterRaw();
  // Aguardar useEffect rodar
  // Deve haver UM evento BREAKING_CHANGE_ANTI_STALLING
  const events = hook.result.current.state.events;
  const breakings = events.filter(e => e.type === 'BREAKING_CHANGE_ANTI_STALLING');
  expect(breakings).toHaveLength(1);
});

it('config v1.5.0 (com rulesetVersion): NÃO loga BREAKING_CHANGE_ANTI_STALLING', () => {
  const newConfig = { ...DEFAULT_MATCH_CONFIG };
  store['championship-config-mat-1'] = JSON.stringify(newConfig);

  const hook = createMasterRaw();
  const events = hook.result.current.state.events;
  const breakings = events.filter(e => e.type === 'BREAKING_CHANGE_ANTI_STALLING');
  expect(breakings).toHaveLength(0);
});
```

- [ ] **Step 5: Commit**

```bash
git add src/types/championship.ts src/lib/matchConfigMigration.ts src/lib/matchConfigMigration.test.ts src/hooks/useChampionshipSync.ts src/hooks/useChampionshipSync.test.ts
git commit -m "feat(events): log BREAKING_CHANGE_ANTI_STALLING on legacy config migration (v1.5.0)"
```

---

### Task E.1: Create `WhatsNewDialog` for v1.5.0 changelog

**Files:**
- Create: `src/components/championship/WhatsNewDialog.tsx`
- Modify: `src/pages/ChampionshipMat.tsx` (show on first launch of 1.5.0)

- [ ] **Step 1: Write the component**

```tsx
// src/components/championship/WhatsNewDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface WhatsNewDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WhatsNewDialog({ open, onClose }: WhatsNewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Novidades v1.5.0 — Conformidade WT 2026
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto">

          {/* SEÇÃO DEDICADA: Regra removida — anti-stalling */}
          <section className="rounded-md border border-amber-700/40 bg-amber-950/30 p-3">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4" />
              Regra removida: anti-stalling automático
            </h3>
            <p className="text-zinc-300 mb-2">
              Versões anteriores do SPE encerravam a luta automaticamente se houvesse empate
              no último 10s do round final, dando vitória ao oponente do atleta que cometesse
              gam-jeom. <strong className="text-white">Essa regra não existe na WT oficial</strong>{' '}
              — era uma regra inventada do sistema antigo.
            </p>
            <p className="text-zinc-300 mb-2">
              Foi removida em v1.5.0. O cenário que ela tentava cobrir (atleta empatado matando
              o tempo com falta) é agora coberto pela <strong className="text-white">regra
              oficial WT 2026 Jun</strong>: gam-jeom de passividade nos últimos 10s de qualquer
              round dá <strong>+2 pts</strong> ao oponente (em vez de +1). Resultado: penaliza
              passividade sem inventar regras.
            </p>
            <details className="text-xs text-zinc-400 mt-2">
              <summary className="cursor-pointer hover:text-zinc-200">Fontes oficiais WT</summary>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  <a href="https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blta5faf747d0f05bc5/695fb747f3d40d4592598474/2026_USATKD_Kyorugi_Rules_010826.pdf"
                     target="_blank" rel="noopener noreferrer" className="underline">
                    USATKD 2026 Kyorugi Rules (Jan 2026)
                  </a>
                </li>
                <li>
                  <a href="https://www.mastkd.com/2026/04/world-taekwondo-approved-new-combat-rule-changes/"
                     target="_blank" rel="noopener noreferrer" className="underline">
                    MasTKD — Tashkent amendment Apr 2026 (12→15 pts)
                  </a>
                </li>
              </ul>
            </details>
          </section>

          <section>
            <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Mudanças críticas (regras WT 2026)
            </h3>
            <ul className="space-y-1 list-disc pl-5 text-zinc-300">
              <li>
                <strong>Default ruleset = WT-2026-JAN</strong> (vigente até 31/Mai/2026).
                Operador troca pra WT-2026-JUN manualmente após 01/Jun/2026.
              </li>
              <li>
                <strong>pointGap WT-2026-JAN</strong>: 12 pts/round (corrigido de 20). WT-2026-JUN: 15 pts.
              </li>
              <li>
                <strong>Passividade nos últimos 10s</strong> (WT-2026-JUN): oponente ganha
                <strong> +2 pts</strong>. Regra não vigente em WT-2026-JAN.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-emerald-400 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Novas funcionalidades
            </h3>
            <ul className="space-y-1 list-disc pl-5 text-zinc-300">
              <li>
                <strong>Regulamento selecionável</strong>: WT-2026-JAN (padrão), WT-2026-JUN,
                WT-LEGACY-2022, Customizado. Cada opção mostra vigência.
              </li>
              <li>
                <strong>Categoria obrigatória</strong>: Infantil, Cadete, Juvenil, Adulto, Customizado.
                <strong> Threshold continua manual</strong> — categoria é metadata. Alert não-bloqueante
                avisa se threshold está fora da faixa típica.
              </li>
              <li>
                <strong>Motivo de gam-jeom</strong>: dialog obrigatório pede o motivo (11 motivos WT +
                Passividade). Auditoria forense completa.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-zinc-400 mb-2">Migração de configs antigas</h3>
            <p className="text-zinc-400 text-xs">
              Configurações salvas de versões anteriores foram migradas como{' '}
              <strong className="text-white">Customizado</strong>. Revise a configuração do seu
              tatame e escolha o regulamento e categoria apropriados antes da próxima luta.
            </p>
          </section>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire in `ChampionshipMat.tsx`**

Add state + effect at top of component:

```ts
const [whatsNewOpen, setWhatsNewOpen] = useState(false);

useEffect(() => {
  const SEEN_KEY = 'spe-whats-new-1.5.0-seen';
  if (!localStorage.getItem(SEEN_KEY)) {
    setWhatsNewOpen(true);
  }
}, []);

const closeWhatsNew = () => {
  localStorage.setItem('spe-whats-new-1.5.0-seen', '1');
  setWhatsNewOpen(false);
};
```

Render near end of JSX:

```tsx
<WhatsNewDialog open={whatsNewOpen} onClose={closeWhatsNew} />
```

And import:

```ts
import { WhatsNewDialog } from '@/components/championship/WhatsNewDialog';
```

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
- Clear localStorage for `spe-whats-new-1.5.0-seen`: `localStorage.removeItem('spe-whats-new-1.5.0-seen')`
- Reload → WhatsNew dialog appears
- Click "Entendi" → dialog closes, `seen` flag set
- Reload → dialog does NOT appear again

- [ ] **Step 4: Commit**

```bash
git add src/components/championship/WhatsNewDialog.tsx src/pages/ChampionshipMat.tsx
git commit -m "feat(ui): WhatsNewDialog for v1.5.0 changelog"
```

---

### Task E.2: Update `RELEASE.md` with v1.5.0 section

**Files:**
- Modify: `RELEASE.md`

- [ ] **Step 1: Read existing format**

Run: `head -n 40 RELEASE.md`

- [ ] **Step 2: Append v1.5.0 section at top**

Pattern (adapt to existing format):

```markdown
## v1.5.0 — 2026-04-?? — WT 2026 Compliance

### ⚠ BREAKING CHANGE — Regra "anti-stalling" REMOVIDA

Versões anteriores do SPE (até v1.4.9) encerravam a luta automaticamente quando
houvesse empate no último 10s do round final + gam-jeom. **Essa regra não existe
na WT oficial** — era invenção do sistema antigo.

Em v1.5.0:
- A lógica fabricada foi removida (`useChampionshipSync.ts`, bloco `triggersAntiStalling`).
- O cenário (atleta empatado matando o tempo com falta) é agora coberto pela
  **regra oficial WT 2026 Jun**: gam-jeom de PASSIVIDADE nos últimos 10s = +2pts ao oponente.
- Configs migradas de v1.4.x recebem evento `BREAKING_CHANGE_ANTI_STALLING` no log na
  primeira carga, garantindo rastreabilidade da exposição à breaking change.

**Para operadores que usavam v1.4.x:** antes da próxima luta oficial, abrir
"Configuração", confirmar Regulamento (default v1.5.0 = WT-2026-JAN, vigente até
31/Mai/2026) e Categoria.

### Outras BREAKING CHANGES
- `pointGap` default mudou: era 20 (incorreto, sem fonte WT) → agora 12 (WT-2026-JAN, vigente até 31/Mai/2026) ou 15 (WT-2026-JUN).
- `MatchConfig` agora requer `rulesetVersion` (default `WT-2026-JAN`) e `category` (default `ADULTO`). Configs legados viram `CUSTOM` em ambos os campos até operador revisar.

### Features (P0 AUDIT.md resolvidos)
- **P0.1** — Regulamento versionado (`WTRuleset`): 4 presets (WT-2026-JAN padrão, WT-2026-JUN, WT-LEGACY-2022, CUSTOM). UI dropdown em MatchConfigDialog com vigência de cada opção.
- **P0.2** — Passividade +2pts nos últimos 10s (regra WT-2026-JUN). Evento separado `GAMJEOM_PASSIVITY_BONUS` pra auditoria forense.
- **P0.3** — Dialog de motivo obrigatório ao aplicar gam-jeom. 12 motivos WT (incluindo PASSIVITY), atalhos de teclado 1-9/0/-. Motivo persiste em `MatchEvent.reason`.
- **P0.4** — Categoria obrigatória (Infantil/Cadete/Juvenil/Adulto/Custom). Threshold continua **manual**; categoria é metadata. Alert não-bloqueante avisa se threshold está fora da faixa típica. CUSTOM requer calibração explícita antes de "Iniciar".

### Out of scope (ver `.spe/KNOWN_LIMITATIONS.md`)
- P0.5 (PMK/LMK firmware): firmware EngFlex é proprietário, fora do nosso controle.
- P1.1 (HIT_COOLDOWN 80ms): idem firmware.
- Demais P0/P1 de AUDIT.md — Sprints 2-4.

### Fontes regulatórias oficiais

Toda regra implementada referencia documento oficial WT:

- [USA Taekwondo — 2026 Kyorugi Rules (Jan 2026)](https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blta5faf747d0f05bc5/695fb747f3d40d4592598474/2026_USATKD_Kyorugi_Rules_010826.pdf)
- [USA Taekwondo — WT Kyorugi Updates Dec 2025](https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blt3963e86a690c8e43/6941693bff4d36032b31df0d/2026_01_WT_Kyorugi_Updates_12.15.25.pdf)
- [Taekwondobond NL — WT Competition Rules Changes Jan 2026](https://www.taekwondobond.nl/wp-content/uploads/WT-Competition-Rules-and-Interpretations-Kyorugi-changes-made-as-of-January-1-2026.pdf)
- [Taekwondo Canada — Application of WT New Rules Jan 2026](https://taekwondo-canada.com/wp-content/uploads/2026/01/2026-01-New-Rules-Kyorugi-WT.pdf)
- [MasTKD — World Taekwondo Combat Rule Changes Apr 2026 (12→15 pts)](https://www.mastkd.com/2026/04/world-taekwondo-approved-new-combat-rule-changes/)
- [BUTL — Worlds 2026 WT Rules and Regulations](https://butl.org.uk/wp-content/uploads/2025/11/Worlds-2026-WT-Rules-and-Regulations.pdf)

Anti-stalling removido — confirmação independente: nenhuma das fontes acima menciona
encerramento forçado de luta por empate no último 10s. A única regra cobrindo o cenário
é a passividade +2pts (WT-2026-JUN, efetivo 01/Jun/2026).
```

- [ ] **Step 3: Commit**

```bash
git add RELEASE.md
git commit -m "docs(release): v1.5.0 changelog"
```

---

### Task E.3: Bump version to 1.5.0

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump version**

Edit `package.json`, change `"version": "1.4.9"` → `"version": "1.5.0"`.

- [ ] **Step 2: Run full test suite as final check**

Run: `npm test`
Expected: all tests green.

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run linter (if configured)**

Run: `npm run lint` (if script exists)
Expected: no new warnings.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore(release): bump version to 1.5.0"
```

---

### Task E.4: Final integration smoke test — full match flow

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Complete flow**

1. Launch app → Competição
2. WhatsNewDialog aparece → Entendi
3. Setup da luta:
   - Regulamento: WT 2026 (Jun)
   - Categoria: Adulto → verify thresholds mostram 20/30
   - Atletas: Azul "A", Vermelho "B"
4. Iniciar round 1
5. Aplicar pontos: BLUE HEAD (+3), RED BODY (+2)
6. Aplicar gam-jeom RED → dialog abre → escolhe CROSSING_BOUNDARY → evento aparece no log com reason
7. Aplicar gam-jeom BLUE → escolhe PASSIVITY → verify só +1pt ao RED (não é último 10s)
8. Avançar timer até 10s restantes (pode forçar via devtools: `sync.adjustScore` ou aguardar)
9. Aplicar gam-jeom BLUE → escolhe PASSIVITY → verify RED ganhou +2pts
10. Reset → verify nova luta começa limpa

- [ ] **Step 3: Verify event log**

Abrir dialog de event log, verificar:
- Gam-jeom CROSSING_BOUNDARY tem `reason: 'CROSSING_BOUNDARY'` visível
- Gam-jeom PASSIVITY com bônus tem evento duplo (GAMJEOM + GAMJEOM_PASSIVITY_BONUS)

- [ ] **Step 4: Testar ruleset legacy**

1. Voltar pra MatchConfigDialog
2. Selecionar "WT Legacy (pré-2026)" → verify spinBody vira 2, spinHead vira 3, pointGap vira 12
3. Selecionar "Customizado" → fields destravam
4. Selecionar "WT 2026 (Jun)" de novo → valores voltam

- [ ] **Step 5: Testar categoria CUSTOM**

1. Category → Customizado
2. Tentar Iniciar → botão disabled / mostra "Categoria customizada requer calibração"
3. Marcar checkbox "Calibrado manualmente" → Iniciar destrava

- [ ] **Step 6: Se tudo passar, commit final do sprint**

```bash
git commit --allow-empty -m "chore(sprint-1): smoke test passed, ready for PR"
```

---

## Self-Review Checklist

Após completar todas as tasks:

- [ ] `npm test` passa com 0 falhas
- [ ] `npx tsc --noEmit` passa com 0 erros
- [ ] Smoke test manual passa (Stage E.4)
- [ ] `git log --oneline` mostra ~18-20 commits focados, cada um com escopo claro
- [ ] `PROPOSAL.md` e `AUDIT.md` **não foram modificados** (são documentos de referência imutáveis desta fase)
- [ ] `.spe/KNOWN_LIMITATIONS.md` está commitado
- [ ] Nenhum `console.log` / `debugger` / TODO deixado no código novo
- [ ] Imports organizados (agrupar external → alias `@/` → relativo)
- [ ] Arquivos novos têm comentário header explicando propósito + fontes regulatórias quando aplicável

## Handoff para PR

Após aprovação desta implementação:

1. Push da branch: `git push -u origin fix/wt-2026-compliance`
2. Abrir PR pra `master` com título: `feat(wt-2026): Sprint 1 — regulamento versionado, passividade, categoria (v1.5.0)`
3. PR body deve referenciar:
   - `AUDIT.md` — achados P0.1 a P0.4 resolvidos
   - `PROPOSAL.md` — abordagens escolhidas
   - `.spe/KNOWN_LIMITATIONS.md` — escopo excluído (P0.5, P1.1)
4. Checklist de PR: testes passando, CHANGELOG atualizado, version bumpada, smoke test feito.

---

## ⛔ FIM DO PLANO — PARE

Plano Sprint 1 completo. Aguardando seu **"ok sprint 1"** pra executar **Task A.1** (primeira task, TDD: test → fail → impl → pass → commit).

Próxima execução começa criando `src/lib/wtRuleset.ts` + teste, sem tocar em nada mais até você revisar o primeiro commit.
