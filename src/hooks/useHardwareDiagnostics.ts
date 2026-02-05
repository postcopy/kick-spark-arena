import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  HardwareRawPacket,
  HardwareStats,
  HardwareSample,
  HardwareThresholds,
  DeviceLabels,
  DiagnosticsStorage,
  DiagnosticsStorageV1,
  SampleCategory,
  UseHardwareDiagnosticsOptions,
  UseHardwareDiagnosticsReturn,
  ImpactEvent,
  NoiseFloor,
  ObservedScale,
  DiagnosticsViewMode,
} from '@/types/hardwareDiagnostics';

// Portable timeout type (works in browser without NodeJS types)
type TimeoutHandle = ReturnType<typeof setTimeout>;

// Constants
const MAX_MEMORY_EVENTS = 2000;
const MAX_PERSISTED_EVENTS = 300;
const MAX_IMPACTS = 500;
const SAVE_DEBOUNCE_MS = 2000;
const PEAK_HOLD_MS = 2000;
const UI_THROTTLE_MS = 100;
const DEFAULT_SAMPLE_DURATION_MS = 12000;

// Impact detection constants
const SILENCE_GAP_MS = 200;
const MIN_IMPACT_PKTS = 3;
const MIN_IMPACT_DURATION_MS = 40;
const DEFAULT_DELTA_START = 4;     // Hysteresis: to start impact
const DEFAULT_DELTA_CONTINUE = 2;  // Hysteresis: to continue impact
const CALIBRATION_DURATION_MS = 3000;

const DEFAULT_DEVICE_LABELS: DeviceLabels = {
  '1': 'Colete Azul',
  '2': 'Colete Vermelho',
  '3': 'Capacete Azul',
  '4': 'Capacete Vermelho',
};

const DEFAULT_THRESHOLDS: HardwareThresholds = {
  vestHitMin: 150,
  vestPointMin: 400,
  helmetHitMin: 100,
  helmetPointMin: 300,
};

const DEFAULT_OBSERVED_SCALE: ObservedScale = {
  globalMin: Infinity,
  globalMax: 0,
  observedSince: Date.now(),
};

// Active impact state (no packet storage, only stats)
interface ActiveImpactState {
  startTs: number;
  lastAboveTs: number;
  peak: number;
  sum: number;
  packetCount: number;
}

// Calculate stats with correct percentiles
function calculateStats(intensities: number[]): HardwareStats {
  if (intensities.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p90: 0, p95: 0 };
  }
  
  const n = intensities.length;
  const sorted = [...intensities].sort((a, b) => a - b);
  
  const sum = intensities.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / n);
  
  const p90Index = Math.floor(0.90 * (n - 1));
  const p95Index = Math.floor(0.95 * (n - 1));
  
  return {
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    avg,
    p90: sorted[p90Index],
    p95: sorted[p95Index],
  };
}

function calculateAllStats(events: HardwareRawPacket[]): Record<string, HardwareStats> {
  const byDevice: Record<string, number[]> = {};
  
  for (const evt of events) {
    const key = String(evt.deviceId);
    if (!byDevice[key]) byDevice[key] = [];
    byDevice[key].push(evt.intensity);
  }
  
  const result: Record<string, HardwareStats> = {};
  for (const [deviceId, intensities] of Object.entries(byDevice)) {
    result[deviceId] = calculateStats(intensities);
  }
  
  return result;
}

function calculateImpactStats(impacts: ImpactEvent[]): Record<string, HardwareStats> {
  const byDevice: Record<string, number[]> = {};
  
  for (const impact of impacts) {
    const key = String(impact.deviceId);
    if (!byDevice[key]) byDevice[key] = [];
    byDevice[key].push(impact.peakIntensity);
  }
  
  const result: Record<string, HardwareStats> = {};
  for (const [deviceId, peaks] of Object.entries(byDevice)) {
    result[deviceId] = calculateStats(peaks);
  }
  
  return result;
}

// CSV escaping
function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateEventsCSV(events: HardwareRawPacket[]): string {
  const header = 'ts_iso,deviceId,intensity,battery';
  const rows = events.map(e => [
    new Date(e.ts).toISOString(),
    e.deviceId,
    e.intensity,
    e.battery ?? ''
  ].map(escapeCSV).join(','));
  return [header, ...rows].join('\n');
}

function generateImpactsCSV(impacts: ImpactEvent[]): string {
  const header = 'id,deviceId,startedAt_iso,endedAt_iso,durationMs,peakIntensity,avgIntensity,packetCount';
  const rows = impacts.map(i => [
    i.id,
    i.deviceId,
    new Date(i.startedAt).toISOString(),
    new Date(i.endedAt).toISOString(),
    i.durationMs,
    i.peakIntensity,
    i.avgIntensity,
    i.packetCount,
  ].map(escapeCSV).join(','));
  return [header, ...rows].join('\n');
}

function generateSamplesCSV(samples: HardwareSample[]): string {
  const header = 'sampleId,label,category,deviceId,count,min,max,avg,p90,p95';
  const rows: string[] = [];
  
  samples.forEach(sample => {
    Object.entries(sample.statsByDevice).forEach(([deviceId, stats]) => {
      rows.push([
        sample.id,
        escapeCSV(sample.label),
        sample.category,
        deviceId,
        stats.count,
        stats.min,
        stats.max,
        stats.avg,
        stats.p90,
        stats.p95
      ].join(','));
    });
  });
  
  return [header, ...rows].join('\n');
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useHardwareDiagnostics({ storageKey }: UseHardwareDiagnosticsOptions): UseHardwareDiagnosticsReturn {
  // === REFS (no re-render per packet) ===
  const eventsRef = useRef<HardwareRawPacket[]>([]);
  const impactsRef = useRef<ImpactEvent[]>([]);
  const activeImpactsRef = useRef<Map<number, ActiveImpactState>>(new Map());
  const lastPacketRef = useRef<HardwareRawPacket | null>(null);
  const peakRef = useRef<{ value: number; timeout: TimeoutHandle | null }>({ value: 0, timeout: null });
  const dirtyRef = useRef(false);
  const lastUiTsRef = useRef<number | null>(null);
  const uiDirtyTickRef = useRef(0);
  const createdAtRef = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<TimeoutHandle | null>(null);
  
  // Noise floor and observed scale refs
  const noiseFloorRef = useRef<NoiseFloor>({});
  const observedScaleRef = useRef<ObservedScale>({ ...DEFAULT_OBSERVED_SCALE });
  
  // Calibration refs
  const calibrationBufferRef = useRef<Map<number, number[]>>(new Map());
  const isCalibrationActiveRef = useRef(false);
  const calibrationStartRef = useRef<number>(0);
  
  // View mode ref (synced with state)
  const viewModeRef = useRef<DiagnosticsViewMode>('impacts');
  
  // Recording refs
  const recordingRef = useRef(false);
  const sampleBufferRef = useRef<HardwareRawPacket[]>([]);
  const recordingStartRef = useRef<number>(0);
  const recordingDurationRef = useRef<number>(DEFAULT_SAMPLE_DURATION_MS);
  const recordingLabelRef = useRef<string>('');
  const recordingCategoryRef = useRef<SampleCategory>('OUTRO');
  const recordingIntervalRef = useRef<TimeoutHandle | null>(null);
  
  // === UI STATES (throttled) ===
  const [uiLastPacket, setUiLastPacket] = useState<HardwareRawPacket | null>(null);
  const [peakIntensity, setPeakIntensity] = useState(0);
  const [uiRecentEvents, setUiRecentEvents] = useState<HardwareRawPacket[]>([]);
  const [uiStatsByDevice, setUiStatsByDevice] = useState<Record<string, HardwareStats>>({});
  const [uiRecentImpacts, setUiRecentImpacts] = useState<ImpactEvent[]>([]);
  const [uiImpactStatsByDevice, setUiImpactStatsByDevice] = useState<Record<string, HardwareStats>>({});
  const [observedScale, setObservedScale] = useState<ObservedScale>({ ...DEFAULT_OBSERVED_SCALE });
  
  // View mode state (synced with ref)
  const [viewMode, setViewModeState] = useState<DiagnosticsViewMode>('impacts');
  
  // Noise floor state
  const [noiseFloor, setNoiseFloorState] = useState<NoiseFloor>({});
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  // === PERSISTED STATES ===
  const [samples, setSamples] = useState<HardwareSample[]>([]);
  const [thresholds, setThresholds] = useState<HardwareThresholds>(DEFAULT_THRESHOLDS);
  const [deviceLabels, setDeviceLabelsState] = useState<DeviceLabels>(DEFAULT_DEVICE_LABELS);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  // Set view mode (syncs state + ref + triggers UI refresh)
  const setViewMode = useCallback((mode: DiagnosticsViewMode) => {
    viewModeRef.current = mode;
    setViewModeState(mode);
    uiDirtyTickRef.current++;
  }, []);
  
  // Set noise floor (syncs state + ref)
  const setNoiseFloor = useCallback((nf: NoiseFloor) => {
    noiseFloorRef.current = nf;
    setNoiseFloorState(nf);
  }, []);
  
  // Load from storage on mount (with v1 -> v2 migration)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const raw = JSON.parse(stored);
        
        if (raw.version === 1 || !raw.version) {
          // Migrate v1 -> v2
          const v1 = raw as DiagnosticsStorageV1;
          eventsRef.current = v1.events || [];
          impactsRef.current = [];
          setSamples(v1.samples || []);
          setThresholds(v1.thresholds || DEFAULT_THRESHOLDS);
          setDeviceLabelsState(v1.deviceLabels || DEFAULT_DEVICE_LABELS);
          setNoiseFloor({});
          observedScaleRef.current = { ...DEFAULT_OBSERVED_SCALE, observedSince: Date.now() };
          setObservedScale({ ...observedScaleRef.current });
          createdAtRef.current = v1.createdAt || Date.now();
          dirtyRef.current = true; // Force save as v2
        } else {
          // v2
          const v2 = raw as DiagnosticsStorage;
          eventsRef.current = v2.events || [];
          impactsRef.current = v2.impacts || [];
          setSamples(v2.samples || []);
          setThresholds(v2.thresholds || DEFAULT_THRESHOLDS);
          setDeviceLabelsState(v2.deviceLabels || DEFAULT_DEVICE_LABELS);
          setNoiseFloor(v2.noiseFloor || {});
          observedScaleRef.current = v2.observedScale || { ...DEFAULT_OBSERVED_SCALE };
          setObservedScale({ ...observedScaleRef.current });
          createdAtRef.current = v2.createdAt || Date.now();
        }
      } catch (e) {
        console.error('Failed to load diagnostics:', e);
      }
    } else {
      // First run: use defaults
      setDeviceLabelsState(DEFAULT_DEVICE_LABELS);
      setThresholds(DEFAULT_THRESHOLDS);
      createdAtRef.current = Date.now();
    }
  }, [storageKey, setNoiseFloor]);
  
  // Save to storage with debounce (v2 format)
  const saveToStorage = useCallback(() => {
    const data: DiagnosticsStorage = {
      version: 2,
      createdAt: createdAtRef.current,
      updatedAt: Date.now(),
      deviceLabels,
      thresholds,
      noiseFloor: noiseFloorRef.current,
      observedScale: observedScaleRef.current,
      events: eventsRef.current.slice(-MAX_PERSISTED_EVENTS),
      impacts: impactsRef.current.slice(-MAX_IMPACTS),
      samples,
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    dirtyRef.current = false;
  }, [deviceLabels, thresholds, samples, storageKey]);
  
  // Debounced save effect
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, SAVE_DEBOUNCE_MS);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [samples, thresholds, deviceLabels, noiseFloor, saveToStorage]);
  
  // Finish calibration
  const finishCalibration = useCallback(() => {
    const newNoiseFloor: NoiseFloor = { ...noiseFloorRef.current };
    
    calibrationBufferRef.current.forEach((values, deviceId) => {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const p95Index = Math.floor(0.95 * (sorted.length - 1));
        newNoiseFloor[String(deviceId)] = sorted[p95Index] + 1; // +1 margin
      }
    });
    
    // Sync state + ref
    noiseFloorRef.current = newNoiseFloor;
    setNoiseFloorState(newNoiseFloor);
    
    isCalibrationActiveRef.current = false;
    calibrationBufferRef.current = new Map();
    setIsCalibrating(false);
    dirtyRef.current = true;
    
    // Force UI refresh
    uiDirtyTickRef.current++;
  }, []);
  
  // Throttle UI updates (100ms) - finalizes impacts and calculates stats
  useEffect(() => {
    let lastTick = uiDirtyTickRef.current;
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      // === FINALIZE INACTIVE IMPACTS ===
      activeImpactsRef.current.forEach((active, deviceId) => {
        if (now - active.lastAboveTs > SILENCE_GAP_MS) {
          const durationMs = active.lastAboveTs - active.startTs;
          
          // ANTI-NOISE: only create ImpactEvent if meets criteria
          if (active.packetCount >= MIN_IMPACT_PKTS || durationMs >= MIN_IMPACT_DURATION_MS) {
            const impact: ImpactEvent = {
              id: `impact_${active.startTs}_${deviceId}`,
              deviceId,
              startedAt: active.startTs,
              endedAt: active.lastAboveTs,
              durationMs,
              peakIntensity: active.peak,
              avgIntensity: Math.round(active.sum / active.packetCount),
              packetCount: active.packetCount,
            };
            
            impactsRef.current.push(impact);
            if (impactsRef.current.length > MAX_IMPACTS) {
              impactsRef.current = impactsRef.current.slice(-MAX_IMPACTS);
            }
            dirtyRef.current = true;
          }
          // If doesn't meet criteria: discard silently (noise/isolated spike)
          
          activeImpactsRef.current.delete(deviceId);
          
          // Force UI refresh when impact is finalized (created or discarded)
          uiDirtyTickRef.current++;
        }
      });
      
      // === CHECK CALIBRATION ===
      if (isCalibrationActiveRef.current && now - calibrationStartRef.current >= CALIBRATION_DURATION_MS) {
        finishCalibration();
      }
      
      // === UPDATE UI (if changed) ===
      const currentTs = lastPacketRef.current?.ts ?? null;
      const currentTick = uiDirtyTickRef.current;
      
      if (currentTs !== lastUiTsRef.current || currentTick !== lastTick) {
        lastUiTsRef.current = currentTs;
        lastTick = currentTick;
        
        setUiLastPacket(lastPacketRef.current);
        setUiRecentEvents(eventsRef.current.slice(-30).reverse());
        setPeakIntensity(peakRef.current.value);
        setObservedScale({ ...observedScaleRef.current });
        
        // OPTIMIZED STATS: calculate only for active mode
        if (viewModeRef.current === 'impacts') {
          setUiImpactStatsByDevice(calculateImpactStats(impactsRef.current));
        } else {
          setUiStatsByDevice(calculateAllStats(eventsRef.current));
        }
        
        setUiRecentImpacts(impactsRef.current.slice(-30).reverse());
      }
    }, UI_THROTTLE_MS);
    
    return () => clearInterval(interval);
  }, [finishCalibration]);
  
  // Callback for serial (no setState per packet)
  const onRawPacket = useCallback((pkt: HardwareRawPacket) => {
    // 1. Ring buffer RAW
    eventsRef.current.push(pkt);
    if (eventsRef.current.length > MAX_MEMORY_EVENTS) {
      eventsRef.current = eventsRef.current.slice(-MAX_MEMORY_EVENTS);
    }
    lastPacketRef.current = pkt;
    dirtyRef.current = true;
    
    // 2. Update observed scale
    if (pkt.intensity < observedScaleRef.current.globalMin) {
      observedScaleRef.current.globalMin = pkt.intensity;
    }
    if (pkt.intensity > observedScaleRef.current.globalMax) {
      observedScaleRef.current.globalMax = pkt.intensity;
    }
    
    // 3. Calibration (if active)
    if (isCalibrationActiveRef.current) {
      const buffer = calibrationBufferRef.current.get(pkt.deviceId) || [];
      buffer.push(pkt.intensity);
      calibrationBufferRef.current.set(pkt.deviceId, buffer);
    }
    
    // 4. Peak hold 2s
    if (pkt.intensity > peakRef.current.value) {
      peakRef.current.value = pkt.intensity;
    }
    if (peakRef.current.timeout) {
      clearTimeout(peakRef.current.timeout);
    }
    peakRef.current.timeout = setTimeout(() => {
      peakRef.current.value = 0;
      uiDirtyTickRef.current++;
    }, PEAK_HOLD_MS);
    
    // 5. Impact detection (HYSTERESIS)
    const deviceKey = pkt.deviceId;
    const floor = noiseFloorRef.current[String(deviceKey)] ?? 0;
    const startThreshold = floor + DEFAULT_DELTA_START;
    const continueThreshold = floor + DEFAULT_DELTA_CONTINUE;
    
    let active = activeImpactsRef.current.get(deviceKey);
    
    if (!active) {
      // No active impact: check if should start new
      if (pkt.intensity > startThreshold) {
        activeImpactsRef.current.set(deviceKey, {
          startTs: pkt.ts,
          lastAboveTs: pkt.ts,
          peak: pkt.intensity,
          sum: pkt.intensity,
          packetCount: 1,
        });
      }
    } else {
      // Active impact: check if should continue
      if (pkt.intensity > continueThreshold) {
        active.sum += pkt.intensity;
        active.packetCount++;
        active.lastAboveTs = pkt.ts;
        if (pkt.intensity > active.peak) {
          active.peak = pkt.intensity;
        }
      }
      // If pkt.intensity <= continueThreshold: don't update lastAboveTs
      // The throttle loop will finalize when gap > SILENCE_GAP_MS
    }
    
    // 6. Recording (samples)
    if (recordingRef.current) {
      sampleBufferRef.current.push(pkt);
    }
  }, []);
  
  // Start noise floor calibration
  const calibrateNoiseFloor = useCallback(() => {
    if (isCalibrationActiveRef.current) return;
    
    isCalibrationActiveRef.current = true;
    calibrationStartRef.current = Date.now();
    calibrationBufferRef.current = new Map();
    setIsCalibrating(true);
  }, []);
  
  // Start sample recording
  const startSample = useCallback((label: string, category: SampleCategory, durationMs = DEFAULT_SAMPLE_DURATION_MS) => {
    if (recordingRef.current) return;
    
    recordingRef.current = true;
    sampleBufferRef.current = [];
    recordingStartRef.current = Date.now();
    recordingDurationRef.current = durationMs;
    recordingLabelRef.current = label;
    recordingCategoryRef.current = category;
    
    setIsRecording(true);
    setRecordingProgress(0);
    
    recordingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current;
      const progress = Math.min(100, (elapsed / recordingDurationRef.current) * 100);
      setRecordingProgress(progress);
      
      if (elapsed >= recordingDurationRef.current) {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        recordingRef.current = false;
        
        const newSample: HardwareSample = {
          id: `sample_${Date.now()}`,
          label: recordingLabelRef.current,
          category: recordingCategoryRef.current,
          startedAt: recordingStartRef.current,
          durationMs: recordingDurationRef.current,
          events: [...sampleBufferRef.current],
          statsByDevice: calculateAllStats(sampleBufferRef.current),
        };
        
        setSamples(prev => [...prev, newSample]);
        sampleBufferRef.current = [];
        setIsRecording(false);
        setRecordingProgress(0);
      }
    }, 100);
  }, []);
  
  // Delete sample
  const deleteSample = useCallback((id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  }, []);
  
  // Set device label
  const setDeviceLabel = useCallback((id: string, label: string) => {
    setDeviceLabelsState(prev => ({ ...prev, [id]: label }));
  }, []);
  
  // Clear events
  const clearEvents = useCallback(() => {
    eventsRef.current = [];
    lastPacketRef.current = null;
    peakRef.current.value = 0;
    if (peakRef.current.timeout) {
      clearTimeout(peakRef.current.timeout);
      peakRef.current.timeout = null;
    }
    uiDirtyTickRef.current++;
    setUiLastPacket(null);
    setUiRecentEvents([]);
    setUiStatsByDevice({});
    setPeakIntensity(0);
    dirtyRef.current = true;
  }, []);
  
  // Clear impacts
  const clearImpacts = useCallback(() => {
    impactsRef.current = [];
    activeImpactsRef.current = new Map();
    uiDirtyTickRef.current++;
    setUiRecentImpacts([]);
    setUiImpactStatsByDevice({});
    dirtyRef.current = true;
  }, []);
  
  // Clear all
  const clearAll = useCallback(() => {
    clearEvents();
    clearImpacts();
    setSamples([]);
    setThresholds(DEFAULT_THRESHOLDS);
    setDeviceLabelsState(DEFAULT_DEVICE_LABELS);
    setNoiseFloor({});
    observedScaleRef.current = { ...DEFAULT_OBSERVED_SCALE, observedSince: Date.now() };
    setObservedScale({ ...observedScaleRef.current });
    createdAtRef.current = Date.now();
    localStorage.removeItem(storageKey);
  }, [clearEvents, clearImpacts, storageKey, setNoiseFloor]);
  
  // Export JSON (v2 format)
  const exportJSON = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    const data: DiagnosticsStorage = {
      version: 2,
      createdAt: createdAtRef.current,
      updatedAt: Date.now(),
      deviceLabels,
      thresholds,
      noiseFloor: noiseFloorRef.current,
      observedScale: observedScaleRef.current,
      events: eventsRef.current,
      impacts: impactsRef.current,
      samples,
    };
    downloadFile(`diagnostics_${timestamp}.json`, JSON.stringify(data, null, 2), 'application/json');
  }, [deviceLabels, thresholds, samples]);
  
  // Export CSV (3 files: events, impacts, samples)
  const exportCSV = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    
    if (eventsRef.current.length > 0) {
      downloadFile(`events_${timestamp}.csv`, generateEventsCSV(eventsRef.current), 'text/csv');
    }
    
    if (impactsRef.current.length > 0) {
      downloadFile(`impacts_${timestamp}.csv`, generateImpactsCSV(impactsRef.current), 'text/csv');
    }
    
    if (samples.length > 0) {
      downloadFile(`samples_${timestamp}.csv`, generateSamplesCSV(samples), 'text/csv');
    }
  }, [samples]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (peakRef.current.timeout) {
        clearTimeout(peakRef.current.timeout);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    onRawPacket,
    uiLastPacket,
    peakIntensity,
    uiRecentEvents,
    uiStatsByDevice,
    uiRecentImpacts,
    uiImpactStatsByDevice,
    impactCount: impactsRef.current.length,
    viewMode,
    setViewMode,
    noiseFloor,
    isCalibrating,
    calibrateNoiseFloor,
    observedScale,
    samples,
    isRecording,
    recordingProgress,
    startSample,
    deleteSample,
    thresholds,
    setThresholds,
    deviceLabels,
    setDeviceLabel,
    clearEvents,
    clearImpacts,
    clearAll,
    exportJSON,
    exportCSV,
    eventCount: eventsRef.current.length,
    sampleCount: samples.length,
  };
}
