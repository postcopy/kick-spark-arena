/** Pacote raw do hardware. ts gerado via Date.now() no momento do parse. */
export interface HardwareRawPacket {
  /** Timestamp do evento. Gerado via Date.now() no momento do parse se hardware não fornecer. */
  ts: number;
  deviceId: number;
  intensity: number;
  battery?: number;
}

export type SampleCategory = 'RASPAGEM' | 'TOQUE' | 'PONTO' | 'OUTRO';

export interface HardwareStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p90: number;
  p95: number;
}

export interface HardwareSample {
  id: string;
  label: string;
  category: SampleCategory;
  startedAt: number;
  durationMs: number;
  events: HardwareRawPacket[];
  statsByDevice: Record<string, HardwareStats>;
}

export interface HardwareThresholds {
  vestHitMin: number;
  vestPointMin: number;
  helmetHitMin: number;
  helmetPointMin: number;
}

export type DeviceLabels = Record<string, string>;

/** Um impacto detectado (1 chute = 1 impacto) */
export interface ImpactEvent {
  id: string;
  deviceId: number;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  peakIntensity: number;
  avgIntensity: number;
  packetCount: number;
}

/** Noise floor calibrado por device */
export type NoiseFloor = Record<string, number>;

/** Escala observada */
export interface ObservedScale {
  globalMin: number;
  globalMax: number;
  observedSince: number;
}

/** View mode do diagnóstico */
export type DiagnosticsViewMode = 'impacts' | 'raw';

/** Storage v1 (legacy) */
export interface DiagnosticsStorageV1 {
  version: 1;
  createdAt: number;
  updatedAt: number;
  deviceLabels: DeviceLabels;
  thresholds: HardwareThresholds;
  events: HardwareRawPacket[];
  samples: HardwareSample[];
}

/** Storage v2 (com impactos, noiseFloor, observedScale) */
export interface DiagnosticsStorage {
  version: 2;
  createdAt: number;
  updatedAt: number;
  deviceLabels: DeviceLabels;
  thresholds: HardwareThresholds;
  noiseFloor: NoiseFloor;
  observedScale: ObservedScale;
  events: HardwareRawPacket[];
  impacts: ImpactEvent[];
  samples: HardwareSample[];
}

export interface UseHardwareDiagnosticsOptions {
  storageKey: string;
}

export interface UseHardwareDiagnosticsReturn {
  // Callback para useSerialPort
  onRawPacket: (pkt: HardwareRawPacket) => void;
  
  // UI states (throttled 100ms)
  uiLastPacket: HardwareRawPacket | null;
  peakIntensity: number;
  uiRecentEvents: HardwareRawPacket[];
  uiStatsByDevice: Record<string, HardwareStats>;
  
  // Impacts
  uiRecentImpacts: ImpactEvent[];
  uiImpactStatsByDevice: Record<string, HardwareStats>;
  impactCount: number;
  
  // View mode
  viewMode: DiagnosticsViewMode;
  setViewMode: (mode: DiagnosticsViewMode) => void;
  
  // Noise floor
  noiseFloor: NoiseFloor;
  isCalibrating: boolean;
  calibrateNoiseFloor: () => void;
  
  // Observed scale
  observedScale: ObservedScale;
  
  // Samples
  samples: HardwareSample[];
  isRecording: boolean;
  recordingProgress: number;
  startSample: (label: string, category: SampleCategory, durationMs?: number) => void;
  deleteSample: (id: string) => void;
  
  // Thresholds
  thresholds: HardwareThresholds;
  setThresholds: (t: HardwareThresholds) => void;
  
  // Device labels
  deviceLabels: DeviceLabels;
  setDeviceLabel: (id: string, label: string) => void;
  
  // Actions
  clearEvents: () => void;
  clearImpacts: () => void;
  clearAll: () => void;
  exportJSON: () => void;
  exportCSV: () => void;
  
  // Info
  eventCount: number;
  sampleCount: number;
}
