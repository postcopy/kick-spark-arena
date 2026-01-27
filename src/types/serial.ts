import { Side, HitType } from './game';

export interface SerialKickEvent {
  side: Side;
  hitType: HitType;
  timestamp: number;
  raw: string;
}

export interface SerialPortState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface UseSerialPortOptions {
  onKick: (side: Side, hitType: HitType) => void;
  debounceMs?: number;
}

// Equipment types and state
export type EquipmentType = 'vest' | 'helmet';
export type EquipmentSlot = 1 | 2 | 3 | 4;

export interface EquipmentState {
  id: EquipmentSlot;
  type: EquipmentType;
  side: 'red' | 'blue';
  battery: number | null; // 0-100 or null if unknown
  lastSeen: number | null; // timestamp
}

// Mapping based on EngFlex documentation:
// ID 1 = Red Vest (Colete Vermelho)
// ID 2 = Blue Vest (Colete Azul)
// ID 3 = Red Helmet (Capacete Vermelho)
// ID 4 = Blue Helmet (Capacete Azul)

export interface UseSerialPortReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  equipment: Map<EquipmentSlot, EquipmentState>;
}
