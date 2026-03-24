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

export interface ImpactCallbackData {
  deviceId: number;
  peakIntensity: number;
  avgIntensity: number;
  durationMs: number;
  packetCount: number;
  ts: number;
}

/** Judge event from referee devices (IDs 5-7) */
export interface JudgeEvent {
  button: number;   // which button was pressed (X value from protocol)
  judgeId: number;  // 1, 2, or 3 (mapped from deviceId 5, 6, 7)
  deviceId: number; // raw deviceId (5, 6, or 7)
  ts: number;
}

export interface UseSerialPortOptions {
  onKick: (side: Side, hitType: HitType) => void;
  onRawPacket?: (pkt: {
    intensity: number;
    deviceId: number;
    battery?: number;
    ts: number;
  }) => void;
  onImpact?: (impact: ImpactCallbackData) => void;
  onJudgeEvent?: (event: JudgeEvent) => void;
  impactDetectorConfig?: {
    enabled: boolean;
    noiseFloor: Record<string, number>;
    noiseIntensityMin?: number;
  };
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

export interface DetectorDiag {
  rejected: number;
  active: number;
  lastInt: number;
  lastDev: number;
  config: { noiseIntensityMin: number; deltaStart: number; passThroughMode: boolean; noiseFloorKeys: string[] };
}

export interface UseSerialPortReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isAutoConnecting: boolean;
  error: string | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  equipment: Map<EquipmentSlot, EquipmentState>;
  equipmentVersion: number;
  /** Increments with every parsed serial packet (for debug diagnostics) */
  rawPacketCount: number;
  /** Last raw line received from serial (for debug) */
  lastRawLine: string;
  /** Get snapshot of ImpactDetector diagnostics */
  getDetectorDiag: () => DetectorDiag;
  /** Toggle pass-through mode (bypass all detector filters) */
  setPassThroughMode: (active: boolean) => void;
}
