// Cues disponíveis para Taekwondo
export type ReactionCue = 
  | 'L' | 'R'                    // Lado
  | 'HEAD' | 'BODY'             // Altura
  | 'FRONT_LEG' | 'BACK_LEG'    // Perna
  | 'GO' | 'NO_GO'              // Controle de impulso
  | 'COUNTER' | 'CUT' | 'SPIN' | 'FAKE'; // Avançados

export type DrillType = 
  | 'single'      // Um cue por vez
  | 'twoStep'     // Dois cues em sequência (lado → altura)
  | 'octagon'     // Cue em 8 posições periféricas
  | 'goNoGo'      // Go/No-Go (verde/vermelho)
  | 'ruleSwitch'; // Regra muda durante o treino

export type RuleMode = 'normal' | 'inverted' | 'alternating';
export type LevelPreset = 'beginner' | 'intermediate' | 'advanced';

// BlockConfig com suporte a tempo E rounds
export interface BlockConfig {
  mode: 'rounds' | 'time';
  rounds?: number;
  durationSec?: number;
  restSec: number;
}

export interface ReactionConfig {
  levelPreset: LevelPreset;
  drillType: DrillType;
  cueSet: ReactionCue[];      // NÃO inclui NO_GO aqui (exceto goNoGo drill)
  cueDurationMs: number;
  gapMinMs: number;
  gapMaxMs: number;
  noGoRate: number;           // 0-100, ignorado se drillType === 'goNoGo'
  sessionMode: 'time' | 'rounds';
  totalTimeSec?: number;
  totalRounds?: number;
  blockPlan?: BlockConfig[];
  ruleMode: RuleMode;
  ruleSwitchEveryN?: number;
}

export interface CueDisplay {
  cue: ReactionCue;
  position?: number;   // 0-7 para octagon
  isNoGo: boolean;     // true = não reagir
  step?: 1 | 2;        // Para twoStep
}

export interface ReactionSessionResult {
  mode: 'reaction';
  config: ReactionConfig;
  totalCues: number;          // twoStep conta 2
  cueDistribution: Record<string, number>;
  noGoCount: number;
  blocksCompleted: number;
  totalDurationSec: number;
  averageGapMs: number;
  rpe?: number;
  timestamp: number;
}

// Callbacks para sons
export interface ReactionSoundCallbacks {
  onCueShow?: (cue: CueDisplay) => void;
  onCueHide?: () => void;
  onSessionStart?: () => void;
  onSessionEnd?: (result: ReactionSessionResult) => void;
  onBlockRest?: (blockNumber: number) => void;
  onCountdown?: (count: number) => void;
}

// Visual representation of cues
export interface CueVisual {
  symbol: string;
  color: string;
  label: string;
}

export const CUE_VISUALS: Record<ReactionCue, CueVisual> = {
  'L':         { symbol: '←', color: 'text-blue-500', label: 'Esquerda' },
  'R':         { symbol: '→', color: 'text-red-500', label: 'Direita' },
  'HEAD':      { symbol: '⬆', color: 'text-yellow-500', label: 'Cabeça' },
  'BODY':      { symbol: '⬇', color: 'text-green-500', label: 'Corpo' },
  'FRONT_LEG': { symbol: 'F', color: 'text-cyan-500', label: 'Perna Frente' },
  'BACK_LEG':  { symbol: 'B', color: 'text-orange-500', label: 'Perna Trás' },
  'GO':        { symbol: '●', color: 'text-green-500', label: 'VAI!' },
  'NO_GO':     { symbol: '●', color: 'text-red-500', label: 'PARA!' },
  'COUNTER':   { symbol: '⟲', color: 'text-purple-500', label: 'Contra' },
  'CUT':       { symbol: '✕', color: 'text-white', label: 'Corta' },
  'SPIN':      { symbol: '↻', color: 'text-pink-500', label: 'Giro' },
  'FAKE':      { symbol: '?', color: 'text-gray-400', label: 'Feint' },
};

// Presets por nível
export const BEGINNER_PRESET: ReactionConfig = {
  levelPreset: 'beginner',
  drillType: 'single',
  cueSet: ['L', 'R'],
  cueDurationMs: 1000,
  gapMinMs: 600,
  gapMaxMs: 1200,
  noGoRate: 0,
  sessionMode: 'rounds',
  totalRounds: 40,
  ruleMode: 'normal',
};

export const INTERMEDIATE_PRESET: ReactionConfig = {
  levelPreset: 'intermediate',
  drillType: 'twoStep',
  cueSet: ['L', 'R', 'HEAD', 'BODY'],
  cueDurationMs: 600,
  gapMinMs: 350,
  gapMaxMs: 1100,
  noGoRate: 12,
  sessionMode: 'time',
  totalTimeSec: 180,
  blockPlan: [
    { mode: 'time', durationSec: 50, restSec: 15 },
    { mode: 'time', durationSec: 50, restSec: 15 },
    { mode: 'time', durationSec: 50, restSec: 0 },
  ],
  ruleMode: 'normal',
};

export const ADVANCED_PRESET: ReactionConfig = {
  levelPreset: 'advanced',
  drillType: 'octagon',
  cueSet: ['L', 'R', 'HEAD', 'BODY', 'FRONT_LEG', 'BACK_LEG', 'COUNTER'],
  cueDurationMs: 250,
  gapMinMs: 200,
  gapMaxMs: 900,
  noGoRate: 20,
  sessionMode: 'rounds',
  totalRounds: 100,
  ruleMode: 'alternating',
  ruleSwitchEveryN: 10,
};

export const GO_NOGO_DRILL: ReactionConfig = {
  levelPreset: 'intermediate',
  drillType: 'goNoGo',
  cueSet: ['GO', 'NO_GO'],
  cueDurationMs: 800,
  gapMinMs: 400,
  gapMaxMs: 1000,
  noGoRate: 0, // Ignorado neste drill
  sessionMode: 'rounds',
  totalRounds: 50,
  ruleMode: 'normal',
};

// Drill definitions for setup screen
export interface DrillDefinition {
  id: string;
  name: string;
  description: string;
  config: Partial<ReactionConfig>;
  levelPreset: LevelPreset;
}

export const DRILL_DEFINITIONS: DrillDefinition[] = [
  {
    id: 'mirror-lr',
    name: 'Espelho de Base (L/R)',
    description: 'Reaja ao lado indicado',
    config: { drillType: 'single', cueSet: ['L', 'R'] },
    levelPreset: 'beginner',
  },
  {
    id: 'height-simple',
    name: 'Altura Simples (HEAD/BODY)',
    description: 'Reaja à altura indicada',
    config: { drillType: 'single', cueSet: ['HEAD', 'BODY'] },
    levelPreset: 'beginner',
  },
  {
    id: 'two-step',
    name: '2-Step Decisão',
    description: 'Primeiro lado, depois altura',
    config: { drillType: 'twoStep', cueSet: ['L', 'R', 'HEAD', 'BODY'] },
    levelPreset: 'intermediate',
  },
  {
    id: 'go-nogo',
    name: 'Go/No-Go',
    description: 'Verde = executa, Vermelho = congela',
    config: { drillType: 'goNoGo', cueSet: ['GO', 'NO_GO'], noGoRate: 0 },
    levelPreset: 'intermediate',
  },
  {
    id: 'octagon',
    name: 'Octagon Periférico',
    description: 'Cue aparece em 8 posições',
    config: { drillType: 'octagon', cueSet: ['L', 'R', 'HEAD', 'BODY', 'FRONT_LEG', 'BACK_LEG'] },
    levelPreset: 'advanced',
  },
  {
    id: 'rule-switch',
    name: 'Troca de Regra',
    description: 'Regra muda durante o treino',
    config: { drillType: 'ruleSwitch', ruleMode: 'alternating', ruleSwitchEveryN: 10 },
    levelPreset: 'advanced',
  },
];
