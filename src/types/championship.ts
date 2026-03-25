// Championship Mode Types (WT-style scoring)

export type MatchStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'MEDICAL' | 'ROUND_END' | 'MATCH_END';
export type MatchSide = 'RED' | 'BLUE';
export type ScoreType = 'PUNCH' | 'BODY' | 'HEAD' | 'SPIN_BODY' | 'SPIN_HEAD' | 'GAMJEOM';

// Configurable score values (not hardcoded)
export interface ScoreConfig {
  punch: number;      // Soco (tronco) - default 1
  body: number;       // Chute corpo - default 2
  head: number;       // Chute cabeça - default 3
  spinBody: number;   // Giro corpo - WT: 3 (2+1 bonus)
  spinHead: number;   // Giro cabeça - WT: 4 (3+1 bonus)
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  punch: 1,
  body: 2,
  head: 3,
  spinBody: 3,   // WT: chute giratório tronco = 2 + 1 bonus = 3
  spinHead: 4,   // WT: chute giratório cabeça = 3 + 1 bonus = 4
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
  maxGamjeom: number;       // WT: 10 - desclassificação por penalidades
  pointGap: number;         // WT: 12 - vitória automática por gap de pontos
  tiebreakByHits?: boolean; // default true - use hits as tiebreaker when round score is tied
  
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
  
  // Hardware scoring mode (always impacts — RAW removed)
  scoringInput?: 'impacts';
  
  // Impact thresholds (used when scoringInput = 'impacts')
  impactThresholds?: {
    vestHitMin: number;
    vestPointMin: number;
    helmetHitMin: number;
    helmetPointMin: number;
    noiseFloor: Record<string, number>; // per deviceId
  };
  
  // Anti-duplicate window in ms (per deviceId, discards entire impact within window)
  antiDuplicateWindowMs?: number; // default 300
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  roundTimeMs: 120000,     // 2:00
  medicalTimeMs: 60000,    // 1:00
  breakTimeMs: 60000,      // 1:00
  maxRounds: 3,
  maxGamjeom: 10,  // WT: 10 gam-jeom = desclassificação
  pointGap: 12,    // WT: gap de 12 pontos = vitória automática
  scoring: DEFAULT_SCORE_CONFIG,
  matId: 1,
  scoringInput: 'impacts',
  impactThresholds: {
    vestHitMin: 5,
    vestPointMin: 5,
    helmetHitMin: 3,
    helmetPointMin: 3,
    noiseFloor: {},
  },
};

// Match event for logging
export interface MatchEvent {
  id: string;
  type: ScoreType | 'UNDO' | 'TIMER_START' | 'TIMER_PAUSE' | 'TIMER_RESET' |
        'MEDICAL_START' | 'MEDICAL_END' | 'ROUND_END' | 'ROUND_WIN' |
        'MATCH_END' | 'POINT_GAP' | 'GAMJEOM_LIMIT' | 'ADJUST' | 'GOLDEN_ROUND' | 'BREAK_TIME';
  side?: MatchSide;
  points?: number;
  ts: number;
  description: string;
}

// Main match state
export interface MatchState {
  status: MatchStatus;
  round: 1 | 2 | 3 | 4;
  timeLeftMs: number;

  // Round scores (reset each round)
  roundScoreRed: number;
  roundScoreBlue: number;

  // Hit counters (reset each round) - for statistics and tiebreak
  hitsRed: number;
  hitsBlue: number;

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

  // Golden Round (sudden death when rounds are tied after maxRounds)
  isGoldenRound?: boolean;

  // Break timer between rounds
  isBreakTime?: boolean;
  breakTimeLeftMs?: number;

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
  hitsRed: 0,
  hitsBlue: 0,
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

// Hardware test hit data broadcast to TV
export interface HardwareTestHit {
  deviceId: number; // 1=vest blue, 2=vest red, 3=helmet blue, 4=helmet red
  intensity: number;
  ts: number;
}

// Typed sync message for BroadcastChannel
export type ChampionshipSyncMessage =
  | { type: 'MATCH_STATE'; payload: MatchState }
  | { type: 'TOURNAMENT_UPDATE'; payload: unknown }
  | { type: 'SHOW_BRACKET'; payload: { categoryId: string } }
  | { type: 'SHOW_SCOREBOARD' }
  | { type: 'SHOW_HARDWARE_TEST'; payload: { athleteBlue?: string; athleteRed?: string } }
  | { type: 'HIDE_HARDWARE_TEST' }
  | { type: 'HARDWARE_TEST_HIT'; payload: HardwareTestHit };

// Helper to format time
export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
