export type GameState = 'idle' | 'setup' | 'countdown' | 'running' | 'paused' | 'finished';

export type Side = 'red' | 'blue';

export type GameMode = 'time_attack' | 'iron_rhythm';

export interface KickEvent {
  side: Side;
  timestamp: number;
}

export interface GameConfig {
  duration: number; // in seconds
  minIntervalMs: number; // debounce interval
}

export interface IronRhythmConfig {
  duration: number; // 30, 45, 60, 90 seconds
  windowSec: number; // 5 seconds (fixed for MVP)
  targetKicksPerWindow: number; // e.g., 5 kicks per window
}

export interface GameScore {
  red: number;
  blue: number;
}

export interface IronRhythmScore {
  red: {
    totalKicks: number;
    uptimeMs: number;
    isOnPace: boolean;
  };
  blue: {
    totalKicks: number;
    uptimeMs: number;
    isOnPace: boolean;
  };
}

export interface GameResult {
  mode: GameMode;
  scores: GameScore;
  uptimeScores?: IronRhythmScore;
  duration: number;
  winner: Side | 'tie';
  timestamp: number;
}

export interface DayRecord {
  date: string;
  bestRed: number;
  bestBlue: number;
  bestTotal: number;
}
