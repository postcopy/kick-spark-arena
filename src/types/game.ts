export type GameState = 'idle' | 'setup' | 'countdown' | 'running' | 'paused' | 'finished' | 'round_end';

export type Side = 'red' | 'blue';

export type GameMode = 'time_attack' | 'arcade' | 'solo';

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

// Solo Mode Types
export interface Athlete {
  id: string;
  academyId: string;
  name: string;
  nickname?: string;
  belt?: string;
  category?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoloConfig {
  duration: number;      // 30, 45, or 60 seconds
  minIntervalMs: number; // debounce
}

export interface SoloResult {
  mode: 'solo';
  athleteId: string;
  athleteName: string;
  kicks: number;
  duration: number;
  kicksPerSecond: number;
  timestamp: number;
  isNewRecord?: boolean;
}

// Arcade Mode Types
export interface ArcadeConfig {
  roundDurationSec: number;      // 45 ou 60
  startingHP: number;            // 100
  bestOf: 1 | 3;                 // rounds
  comboWindowMs: number;         // 700
  energyPerKick: number;         // 10
  energyMax: number;             // 100
  baseDamage: number;            // 2
  specialDamageBonus: number;    // 12
  minIntervalMs: number;         // debounce
}

export interface ArcadePlayerState {
  hp: number;
  energy: number;
  comboCount: number;
  lastKickAt: number;
  specialReady: boolean;
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
