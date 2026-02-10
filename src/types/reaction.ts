export type ReactionLevel = 'beginner' | 'intermediate' | 'elite';

export interface ReactionConfig {
  level: ReactionLevel;
  workSec: number;
  restSec: number;
  rounds: number;
  gapMs: { min: number; max: number };
  flashMs: number; // Max duration stimulus stays on (killed early by impact)
}

export interface ReactionState {
  currentRound: number;
  totalRounds: number;
  workTimeLeft: number;
  restTimeLeft: number;
  isResting: boolean;
  stimulusActive: boolean;
  lastReactionTime: number | null;
  reactionTimes: number[];
  totalStimuli: number;
}

export interface ReactionResult {
  mode: 'reaction';
  level: ReactionLevel;
  roundsCompleted: number;
  totalStimuli: number;
  reactionTimes: number[];
  timestamp: number;
}

export const REACTION_PRESETS: Record<ReactionLevel, ReactionConfig> = {
  beginner: {
    level: 'beginner',
    workSec: 20,
    restSec: 40,
    rounds: 6,
    gapMs: { min: 1500, max: 2500 },
    flashMs: 1000,
  },
  intermediate: {
    level: 'intermediate',
    workSec: 30,
    restSec: 45,
    rounds: 6,
    gapMs: { min: 800, max: 1500 },
    flashMs: 800,
  },
  elite: {
    level: 'elite',
    workSec: 30,
    restSec: 30,
    rounds: 8,
    gapMs: { min: 300, max: 600 },
    flashMs: 600,
  },
};

export const LEVEL_LABELS: Record<ReactionLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  elite: 'Elite',
};
