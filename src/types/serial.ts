import { Side } from './game';

export interface SerialKickEvent {
  side: Side;
  timestamp: number;
  raw: string;
}

export interface SerialPortState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface UseSerialPortOptions {
  onKick: (side: Side) => void;
  debounceMs?: number;
}

export interface UseSerialPortReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}
