export type GameState = 'idle' | 'setup' | 'countdown' | 'running' | 'paused' | 'finished';

export type Side = 'red' | 'blue';

export type GameMode = 'time_attack';

export interface KickEvent {
  side: Side;
  timestamp: number;
}

export interface GameConfig {
  duration: number; // in seconds
  minIntervalMs: number; // debounce interval
}

export interface GameScore {
  red: number;
  blue: number;
}

export interface GameResult {
  mode: GameMode;
  scores: GameScore;
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
