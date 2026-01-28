export type ReactionLevel = 'beginner' | 'intermediate' | 'advanced';
export type SignalColor = 'go' | 'stop' | 'neutral';

export interface ReactionBlockConfig {
  count: number;
  workSec: number;
  restSec: number;
}

export interface ReactionBurstConfig {
  enabled: boolean;
  everyMin?: number;
  everyMax?: number;
  countMin?: number;
  countMax?: number;
  gapMin?: number;
  gapMax?: number;
}

export interface ReactionConfig {
  level: ReactionLevel;
  sessionSeconds: number;
  blocks: ReactionBlockConfig;
  flashMs: { min: number; max: number };
  gapMs: { min: number; max: number };
  stopRate: number; // 0-100 percentage
  burst: ReactionBurstConfig;
}

export interface ReactionState {
  currentBlock: number;
  totalBlocks: number;
  blockTimeLeft: number;
  sessionTimeLeft: number;
  currentSignal: SignalColor;
  signalsInBlock: number;
  isResting: boolean;
  restTimeLeft: number;
}

export interface ReactionResult {
  mode: 'reaction';
  level: ReactionLevel;
  blocksCompleted: number;
  totalSignals: number;
  goSignals: number;
  stopSignals: number;
  timestamp: number;
}

export const REACTION_PRESETS: Record<ReactionLevel, ReactionConfig> = {
  beginner: {
    level: 'beginner',
    sessionSeconds: 600,
    blocks: { count: 8, workSec: 60, restSec: 15 },
    flashMs: { min: 450, max: 600 },
    gapMs: { min: 900, max: 1500 },
    stopRate: 10,
    burst: { enabled: false },
  },
  intermediate: {
    level: 'intermediate',
    sessionSeconds: 600,
    blocks: { count: 8, workSec: 60, restSec: 15 },
    flashMs: { min: 250, max: 400 },
    gapMs: { min: 600, max: 1200 },
    stopRate: 20,
    burst: { enabled: false },
  },
  advanced: {
    level: 'advanced',
    sessionSeconds: 600,
    blocks: { count: 8, workSec: 60, restSec: 15 },
    flashMs: { min: 180, max: 300 },
    gapMs: { min: 300, max: 900 },
    stopRate: 30,
    burst: {
      enabled: true,
      everyMin: 8,
      everyMax: 12,
      countMin: 3,
      countMax: 5,
      gapMin: 150,
      gapMax: 250,
    },
  },
};

export const LEVEL_LABELS: Record<ReactionLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};
