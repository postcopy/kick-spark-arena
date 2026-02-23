export type Side = 'red' | 'blue';
export type GameMode = 'time_attack' | 'arcade' | 'reaction' | 'championship';
export type GameState = 'idle' | 'setup' | 'loading' | 'countdown' | 'running' | 'paused' | 'finished' | 'round_end';

// Type of hit based on equipment hit
export type HitType = 'vest' | 'helmet';

export interface GameConfig {
  duration: number;
  minIntervalMs: number;
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
  // Individual mode fields
  isIndividual?: boolean;
  athleteId?: string;
  athleteName?: string;
  totalKicks?: number;
}

export interface Athlete {
  id: string;
  name: string;
  nickname?: string;
  belt?: string;
  category?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface SoloResult {
  mode: 'time_attack';
  athleteId: string;
  athleteName: string;
  kicks: number;
  duration: number;
  kicksPerSecond: number;
  timestamp: number;
}

export interface DayRecord {
  date: string;
  bestRed: number;
  bestBlue: number;
  bestTotal: number;
}

// Arcade Mode Types
export interface ArcadeConfig {
  roundDurationSec: number;
  startingHP: number;
  bestOf: 1 | 3;
  vestDamage: number;
  helmetDamage: number;
  minIntervalMs: number;
  recoveryIntervalSec: number;
}

export interface ArcadePlayerState {
  hp: number;
}

export interface ArcadeRoundResult {
  winner: Side | 'tie';
  redHP: number;
  blueHP: number;
  isKO: boolean;
}

export interface ArcadeResult {
  mode: 'arcade';
  rounds: ArcadeRoundResult[];
  winner: Side | 'tie';
  redWins: number;
  blueWins: number;
  bestOf: number;
  timestamp: number;
}
