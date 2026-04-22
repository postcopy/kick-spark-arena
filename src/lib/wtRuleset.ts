import type { ScoreConfig } from '@/types/championship';

/**
 * Ruleset versionado por ciclo de emenda WT.
 *
 * - WT-2026-JUN: regras vigentes a partir de 01/Jun/2026 (Rome GP1 em diante).
 *   Fonte: emendas aprovadas Wuxi Jan 2026 + amendment 12→15 pts aprovado
 *   na Assembleia Geral WT de Abr 2026. Passividade +2pts em qualquer round
 *   quando falta gam-jeom nos ultimos 10s.
 *
 * - WT-2026-JAN: transitorio 01/Jan/2026 a 31/Mai/2026. Valores de giro foram
 *   dobrados (jan amendment) mas pointGap continua 12 e nao ha bonus de
 *   passividade vigente ainda.
 *
 * - WT-LEGACY-2022: scoring pre-2026. Mantido para torneios regionais que
 *   rodam regulamento antigo.
 *
 * - CUSTOM: operador define. UI forca configuracao explicita.
 *
 * Fontes regulatorias:
 *   https://www.taekwondobond.nl/wp-content/uploads/WT-Competition-Rules-and-Interpretations-Kyorugi-changes-made-as-of-January-1-2026.pdf
 *   https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blta5faf747d0f05bc5/695fb747f3d40d4592598474/2026_USATKD_Kyorugi_Rules_010826.pdf
 *   https://www.mastkd.com/2026/04/world-taekwondo-approved-new-combat-rule-changes/
 */
export type WTRulesetVersion =
  | 'WT-2026-JUN'
  | 'WT-2026-JAN'
  | 'WT-LEGACY-2022'
  | 'CUSTOM';

/**
 * Contem APENAS campos que variam entre versoes WT.
 *
 * Campos constantes entre versoes (duracao de round, tempo medico, intervalo,
 * regras de golden round, criterios de tiebreak, etc) vivem em MatchConfig.
 *
 * Antes de adicionar campo novo aqui, perguntar: "este valor muda entre versoes
 * WT?" Se sim, vai em WTRuleset. Se nao, vai em MatchConfig.
 */
export interface WTRuleset {
  version: WTRulesetVersion;
  /** Diferencial de pontos que encerra o round automaticamente. */
  pointGap: number;
  /** Numero de gam-jeom que causa desclassificacao imediata (PUN). */
  maxGamjeom: number;
  /** Valores de pontuacao por tecnica. */
  scoring: ScoreConfig;
  /**
   * Pontos totais concedidos ao oponente quando o motivo eh PASSIVITY
   * e o gam-jeom eh aplicado dentro da janela final. Bonus=1 significa
   * "sem bonus, comportamento padrao".
   */
  gamjeomPassivityBonus: 1 | 2;
  /** Janela em ms antes do fim do round em que o bonus de passividade aplica. */
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
    // Formula pre-2026: giro = base + 2 (bonus fixo).
    //   body=2  -> spinBody=4
    //   head=3  -> spinHead=5
    // A partir de WT-2026-JAN a formula mudou para base x 2 (spinHead=6).
    scoring: { punch: 1, body: 2, head: 3, spinBody: 4, spinHead: 5 },
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

/**
 * Retorna uma copia profunda e totalmente independente do preset.
 * Chamadores podem mutar o resultado sem afetar WT_RULESET_PRESETS.
 *
 * Usa structuredClone (ES2022) por a prova de regressao: se adicionarmos
 * campos aninhados (Array, Map, objeto composto) no futuro, o contrato
 * de independencia de referencia continua valido sem precisar ajustar
 * esta funcao.
 */
export function getRulesetPreset(version: WTRulesetVersion): WTRuleset {
  return structuredClone(WT_RULESET_PRESETS[version]);
}

/**
 * Label curto + vigencia para exibicao em UI. Operador escolhe deliberadamente
 * qual ruleset ativar; sistema informa mas nao decide.
 */
export const WT_RULESET_LABELS: Record<WTRulesetVersion, {
  label: string;
  vigencia: string;
}> = {
  'WT-2026-JAN': {
    label: 'WT 2026 (Jan)',
    vigencia: 'Vigente ate 31/mai/2026',
  },
  'WT-2026-JUN': {
    label: 'WT 2026 (Jun)',
    vigencia: 'Vigente a partir de 01/jun/2026',
  },
  'WT-LEGACY-2022': {
    label: 'WT Legacy',
    vigencia: 'Regra pre-2026 (torneios legados)',
  },
  CUSTOM: {
    label: 'Customizado',
    vigencia: 'Configuracao manual de regras',
  },
};
