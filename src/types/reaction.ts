export type ReactionLevel = 'beginner' | 'intermediate' | 'elite';

export interface ReactionConfig {
  level: ReactionLevel;
  workSec: number;
  restSec: number;
  rounds: number;
  gapMs: { min: number; max: number };
  flashMs: number; // Max duration stimulus stays on (killed early by impact)
  cognitiveMode: boolean;
  goProbability: number; // 0-100, percentage of GO (green) stimuli
}

export interface ReactionState {
  currentRound: number;
  totalRounds: number;
  workTimeLeft: number;
  restTimeLeft: number;
  isResting: boolean;
  stimulusActive: boolean;
  stimulusColor: 'green' | 'red' | null;
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
  cognitiveMode: boolean;
  correctInhibitions: number;
  commissionErrors: number;
  omissionErrors: number;
  totalGoStimuli: number;
  totalNoGoStimuli: number;
}

export const REACTION_PRESETS: Record<ReactionLevel, ReactionConfig> = {
  beginner: {
    level: 'beginner',
    workSec: 30,
    restSec: 30,
    rounds: 3,
    gapMs: { min: 2000, max: 4000 },
    flashMs: 3000,
    cognitiveMode: false,
    goProbability: 75,
  },
  intermediate: {
    level: 'intermediate',
    workSec: 45,
    restSec: 30,
    rounds: 5,
    gapMs: { min: 1000, max: 2500 },
    flashMs: 1500,
    cognitiveMode: false,
    goProbability: 75,
  },
  elite: {
    level: 'elite',
    workSec: 60,
    restSec: 30,
    rounds: 8,
    gapMs: { min: 800, max: 1500 },
    flashMs: 900,
    cognitiveMode: false,
    goProbability: 75,
  },
};

export const LEVEL_LABELS: Record<ReactionLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  elite: 'Elite',
};
