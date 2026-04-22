import { DEFAULT_MATCH_CONFIG, type MatchConfig } from '@/types/championship';
import { WT_RULESET_PRESETS, type WTRulesetVersion } from './wtRuleset';

/**
 * Type guard: rulesetVersion eh uma chave conhecida em WT_RULESET_PRESETS.
 */
function isValidRulesetVersion(v: unknown): v is WTRulesetVersion {
  return typeof v === 'string' && v in WT_RULESET_PRESETS;
}

/**
 * Type guard: numero finito (rejeita NaN, Infinity, null, string).
 */
function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Type guard: objeto plain (rejeita array, null, primitivos).
 */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Normaliza uma MatchConfig persistida (de localStorage v1.4.x ou estado parcial corrompido).
 * Sempre retorna um MatchConfig completo e estruturalmente valido.
 *
 * Politica de migracao:
 *
 * 1. **rulesetVersion** ausente / desconhecido / null / tipo errado → 'CUSTOM'.
 *    Forca operador a escolher um preset explicito antes da proxima luta.
 *    Mais seguro que silent upgrade pra default — operador pode ter editado
 *    valores manualmente na v1.4.x e silent upgrade mascararia essa intencao.
 *
 * 2. **Campos numericos invalidos** → fall back pra DEFAULT_MATCH_CONFIG.
 *    Aceita apenas Number.isFinite (rejeita NaN, Infinity, null, string).
 *
 * 3. **maxRounds** → aceita apenas 1 ou 3 literais. Outros valores caem pra default.
 *
 * 4. **Sub-objetos** (scoring, impactThresholds) → mesclados com defaults.
 *    Chaves faltando preenchidas com default. Valores invalidos descartados
 *    (mantem default). Valores numericos validos preservados.
 *
 * 5. **Campos opcionais** (athleteRed, athleteBlue, matchNumber) → preservados
 *    se estruturalmente validos. Descartados se tipo errado.
 *
 * 6. **VALORES NAO sao normalizados contra preset do rulesetVersion.**
 *    Se config tem rulesetVersion='WT-2026-JUN' mas pointGap=12, ambos sao
 *    preservados. Migration eh structural repair, nao value normalization.
 *    Normalizacao de valores eh responsabilidade do dropdown handler em
 *    MatchConfigDialog (Task A.5), nao da migration.
 */
export function migrateMatchConfig(raw: Record<string, unknown>): MatchConfig {
  // Start from a fresh copy of DEFAULT_MATCH_CONFIG (independent reference).
  const base: MatchConfig = {
    ...DEFAULT_MATCH_CONFIG,
    scoring: { ...DEFAULT_MATCH_CONFIG.scoring },
    impactThresholds: DEFAULT_MATCH_CONFIG.impactThresholds
      ? { ...DEFAULT_MATCH_CONFIG.impactThresholds, noiseFloor: { ...DEFAULT_MATCH_CONFIG.impactThresholds.noiseFloor } }
      : undefined,
  };

  // Numeric fields — preserve if valid, else fall back to default
  for (const key of [
    'roundTimeMs', 'medicalTimeMs', 'breakTimeMs',
    'maxGamjeom', 'pointGap', 'matId',
  ] as const) {
    const v = raw[key];
    if (isFiniteNumber(v)) {
      (base[key] as number) = v;
    }
  }

  // maxRounds: union 1 | 3 — only accept literals
  if (raw.maxRounds === 1 || raw.maxRounds === 3) {
    base.maxRounds = raw.maxRounds;
  }

  // matchNumber: optional string
  if (typeof raw.matchNumber === 'string') {
    base.matchNumber = raw.matchNumber;
  }

  // scoring: merge with defaults, validating each numeric field
  if (isPlainObject(raw.scoring)) {
    const rawScoring = raw.scoring;
    const scoring = { ...base.scoring };
    for (const key of ['punch', 'body', 'head', 'spinBody', 'spinHead'] as const) {
      const v = rawScoring[key];
      if (isFiniteNumber(v)) {
        scoring[key] = v;
      }
    }
    base.scoring = scoring;
  }

  // impactThresholds: merge with defaults, validating each numeric field
  if (isPlainObject(raw.impactThresholds) && base.impactThresholds) {
    const rawIT = raw.impactThresholds;
    const it = { ...base.impactThresholds };
    for (const key of ['vestHitMin', 'vestPointMin', 'helmetHitMin', 'helmetPointMin'] as const) {
      const v = rawIT[key];
      if (isFiniteNumber(v)) {
        it[key] = v;
      }
    }
    // noiseFloor: object<deviceId, number> — preserve if valid object
    if (isPlainObject(rawIT.noiseFloor)) {
      const nf: Record<string, number> = {};
      for (const [k, v] of Object.entries(rawIT.noiseFloor)) {
        if (isFiniteNumber(v)) nf[k] = v;
      }
      it.noiseFloor = nf;
    }
    base.impactThresholds = it;
  }

  // athletes: preserve if valid plain object (no further validation here —
  // shape mismatches surface in UI / runtime, not migration)
  if (isPlainObject(raw.athleteRed)) {
    base.athleteRed = raw.athleteRed as MatchConfig['athleteRed'];
  }
  if (isPlainObject(raw.athleteBlue)) {
    base.athleteBlue = raw.athleteBlue as MatchConfig['athleteBlue'];
  }

  // CRITICAL: rulesetVersion handling
  // Missing / unknown / wrong type → 'CUSTOM' (force explicit operator choice).
  base.rulesetVersion = isValidRulesetVersion(raw.rulesetVersion)
    ? raw.rulesetVersion
    : 'CUSTOM';

  return base;
}
