// Championship Mode Types (WT-style scoring)

export type MatchStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'MEDICAL' | 'ROUND_END' | 'MATCH_END';
export type MatchSide = 'RED' | 'BLUE';
export type ScoreType = 'PUNCH' | 'BODY' | 'HEAD' | 'SPIN_BODY' | 'SPIN_HEAD' | 'GAMJEOM';

// Configurable score values (not hardcoded)
export interface ScoreConfig {
  punch: number;      // Soco (tronco) - default 1
  body: number;       // Chute corpo - default 2
  head: number;       // Chute cabeça - default 3
  spinBody: number;   // Giro corpo - default 4
  spinHead: number;   // Giro cabeça - default 6
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  punch: 1,
  body: 2,
  head: 3,
  spinBody: 4,
  spinHead: 6,
};

export const SCORE_LABELS: Record<keyof ScoreConfig, string> = {
  punch: 'Soco',
  body: 'Corpo',
  head: 'Cabeça',
  spinBody: 'Giro Corpo',
  spinHead: 'Giro Cabeça',
};

// Match configuration (from /championship/setup)
export interface MatchConfig {
  // Time settings
  roundTimeMs: number;      // 120000 = 2:00
  medicalTimeMs: number;    // 60000 = 1:00
  breakTimeMs: number;      // 60000 = 1:00 (between rounds)
  
  // Rules
  maxRounds: 1 | 3;
  maxGamjeom: number;       // 10 default - opponent wins when reached
  pointGap: number;         // 20 default - auto-ends round when difference reached
  
  // Scoring values (configurable)
  scoring: ScoreConfig;
  
  // Athletes (optional)
  athleteRed?: {
    id: string;
    name: string;
    country?: string;
  };
  athleteBlue?: {
    id: string;
    name: string;
    country?: string;
  };
  
  // Mat/ring identifier
  matId: number;
  
  // Match number for display
  matchNumber?: string; // "001", "002", etc.
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  roundTimeMs: 120000,     // 2:00
  medicalTimeMs: 60000,    // 1:00
  breakTimeMs: 60000,      // 1:00
  maxRounds: 3,
  maxGamjeom: 10,
  pointGap: 20,
  scoring: DEFAULT_SCORE_CONFIG,
  matId: 1,
};

// Match event for logging
export interface MatchEvent {
  id: string;
  type: ScoreType | 'UNDO' | 'TIMER_START' | 'TIMER_PAUSE' | 'TIMER_RESET' |
        'MEDICAL_START' | 'MEDICAL_END' | 'ROUND_END' | 'ROUND_WIN' | 
        'MATCH_END' | 'POINT_GAP' | 'GAMJEOM_LIMIT' | 'ADJUST';
  side?: MatchSide;
  points?: number;
  ts: number;
  description: string;
}

// Main match state
export interface MatchState {
  status: MatchStatus;
  round: 1 | 2 | 3;
  timeLeftMs: number;
  
  // Round scores (reset each round)
  roundScoreRed: number;
  roundScoreBlue: number;
  
  // Round wins (Best of 3)
  roundWinsRed: number;
  roundWinsBlue: number;
  
  // Gam-jeom (penalties) - accumulated in round
  gamjeomRed: number;
  gamjeomBlue: number;
  
  // Events log
  events: MatchEvent[];
  lastEvent?: MatchEvent;
  
  // Sync timestamp
  lastUpdate: number;
  
  // Medical time tracking
  isMedicalTime: boolean;
  savedTimeMs?: number; // Time saved before medical
  
  // Configuration
  config: MatchConfig;
  hasConfig: boolean; // Blocks "Iniciar" until setup is done
}

export const INITIAL_MATCH_STATE: MatchState = {
  status: 'IDLE',
  round: 1,
  timeLeftMs: 120000,
  roundScoreRed: 0,
  roundScoreBlue: 0,
  roundWinsRed: 0,
  roundWinsBlue: 0,
  gamjeomRed: 0,
  gamjeomBlue: 0,
  events: [],
  lastUpdate: Date.now(),
  isMedicalTime: false,
  config: DEFAULT_MATCH_CONFIG,
  hasConfig: false, // Must go through setup first
};

// History for undo (snapshots)
export const MAX_HISTORY_SIZE = 50;

// Broadcast channel and storage keys
export const getChannelName = (matId: number) => `championship-mat-${matId}`;
export const getStorageKey = (matId: number) => `championship-state-mat-${matId}`;
export const getConfigStorageKey = (matId: number) => `championship-config-mat-${matId}`;

// Helper to get score value from config
export function getScoreValue(type: ScoreType, config: ScoreConfig): number {
  switch (type) {
    case 'PUNCH': return config.punch;
    case 'BODY': return config.body;
    case 'HEAD': return config.head;
    case 'SPIN_BODY': return config.spinBody;
    case 'SPIN_HEAD': return config.spinHead;
    case 'GAMJEOM': return 1; // Always 1 to opponent
    default: return 0;
  }
}

// Helper to format time
export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
