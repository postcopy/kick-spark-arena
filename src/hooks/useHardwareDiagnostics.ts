import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  HardwareRawPacket,
  HardwareStats,
  HardwareSample,
  HardwareThresholds,
  DeviceLabels,
  DiagnosticsStorage,
  SampleCategory,
  UseHardwareDiagnosticsOptions,
  UseHardwareDiagnosticsReturn,
} from '@/types/hardwareDiagnostics';

// Portable timeout type (works in browser without NodeJS types)
type TimeoutHandle = ReturnType<typeof setTimeout>;

// Constants
const MAX_MEMORY_EVENTS = 2000;
const MAX_PERSISTED_EVENTS = 300;
const SAVE_DEBOUNCE_MS = 2000;
const PEAK_HOLD_MS = 2000;
const UI_THROTTLE_MS = 100;
const DEFAULT_SAMPLE_DURATION_MS = 12000;

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

// Calculate stats with correct percentiles
function calculateStats(intensities: number[]): HardwareStats {
  if (intensities.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p90: 0, p95: 0 };
  }
  
  const n = intensities.length;
  const sorted = [...intensities].sort((a, b) => a - b);
  
  const sum = intensities.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / n);
  
  // Percentiles: index = floor(percentile * (n-1))
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
  const lastPacketRef = useRef<HardwareRawPacket | null>(null);
  const peakRef = useRef<{ value: number; timeout: TimeoutHandle | null }>({ value: 0, timeout: null });
  const dirtyRef = useRef(false);
  const lastUiTsRef = useRef<number | null>(null);
  const uiDirtyTickRef = useRef(0);
  const createdAtRef = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<TimeoutHandle | null>(null);
  
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
  
  // === PERSISTED STATES ===
  const [samples, setSamples] = useState<HardwareSample[]>([]);
  const [thresholds, setThresholds] = useState<HardwareThresholds>(DEFAULT_THRESHOLDS);
  const [deviceLabels, setDeviceLabelsState] = useState<DeviceLabels>(DEFAULT_DEVICE_LABELS);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  // Load from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored) as DiagnosticsStorage;
        eventsRef.current = data.events || [];
        setSamples(data.samples || []);
        setThresholds(data.thresholds || DEFAULT_THRESHOLDS);
        setDeviceLabelsState(data.deviceLabels || DEFAULT_DEVICE_LABELS);
        createdAtRef.current = data.createdAt || Date.now();
      } catch (e) {
        console.error('Failed to load diagnostics:', e);
      }
    } else {
      // First run: use defaults
      setDeviceLabelsState(DEFAULT_DEVICE_LABELS);
      setThresholds(DEFAULT_THRESHOLDS);
      createdAtRef.current = Date.now();
    }
  }, [storageKey]);
  
  // Save to storage with debounce
  const saveToStorage = useCallback(() => {
    const data: DiagnosticsStorage = {
      version: 1,
      createdAt: createdAtRef.current,
      updatedAt: Date.now(),
      deviceLabels,
      thresholds,
      events: eventsRef.current.slice(-MAX_PERSISTED_EVENTS),
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
  }, [samples, thresholds, deviceLabels, saveToStorage]);
  
  // Throttle UI updates (100ms) - only if something changed
  useEffect(() => {
    let lastTick = uiDirtyTickRef.current;
    
    const interval = setInterval(() => {
      const currentTs = lastPacketRef.current?.ts ?? null;
      const currentTick = uiDirtyTickRef.current;
      
      // Update if: new packet OR dirtyTick changed (peak reset)
      if (currentTs !== lastUiTsRef.current || currentTick !== lastTick) {
        lastUiTsRef.current = currentTs;
        lastTick = currentTick;
        setUiLastPacket(lastPacketRef.current);
        setUiRecentEvents(eventsRef.current.slice(-30).reverse());
        setUiStatsByDevice(calculateAllStats(eventsRef.current));
        setPeakIntensity(peakRef.current.value);
      }
    }, UI_THROTTLE_MS);
    
    return () => clearInterval(interval);
  }, []);
  
  // Callback for serial (no setState per packet)
  const onRawPacket = useCallback((pkt: HardwareRawPacket) => {
    // Ring buffer (max 2000) - push + trim in-place
    eventsRef.current.push(pkt);
    if (eventsRef.current.length > MAX_MEMORY_EVENTS) {
      eventsRef.current = eventsRef.current.slice(-MAX_MEMORY_EVENTS);
    }
    lastPacketRef.current = pkt;
    dirtyRef.current = true;
    
    // Peak hold 2s
    if (pkt.intensity > peakRef.current.value) {
      peakRef.current.value = pkt.intensity;
    }
    if (peakRef.current.timeout) {
      clearTimeout(peakRef.current.timeout);
    }
    peakRef.current.timeout = setTimeout(() => {
      peakRef.current.value = 0;
      // Force UI refresh even without new packet
      uiDirtyTickRef.current++;
    }, PEAK_HOLD_MS);
    
    // Recording
    if (recordingRef.current) {
      sampleBufferRef.current.push(pkt);
    }
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
    
    // Progress interval
    recordingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current;
      const progress = Math.min(100, (elapsed / recordingDurationRef.current) * 100);
      setRecordingProgress(progress);
      
      if (elapsed >= recordingDurationRef.current) {
        // Recording complete
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
  
  // Clear all
  const clearAll = useCallback(() => {
    clearEvents();
    setSamples([]);
    setThresholds(DEFAULT_THRESHOLDS);
    setDeviceLabelsState(DEFAULT_DEVICE_LABELS);
    createdAtRef.current = Date.now();
    localStorage.removeItem(storageKey);
  }, [clearEvents, storageKey]);
  
  // Export JSON
  const exportJSON = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    const data: DiagnosticsStorage = {
      version: 1,
      createdAt: createdAtRef.current,
      updatedAt: Date.now(),
      deviceLabels,
      thresholds,
      events: eventsRef.current,
      samples,
    };
    downloadFile(`diagnostics_${timestamp}.json`, JSON.stringify(data, null, 2), 'application/json');
  }, [deviceLabels, thresholds, samples]);
  
  // Export CSV (2 files)
  const exportCSV = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    
    // Events CSV
    if (eventsRef.current.length > 0) {
      const eventsCSV = generateEventsCSV(eventsRef.current);
      downloadFile(`events_${timestamp}.csv`, eventsCSV, 'text/csv');
    }
    
    // Samples CSV
    if (samples.length > 0) {
      const samplesCSV = generateSamplesCSV(samples);
      downloadFile(`samples_${timestamp}.csv`, samplesCSV, 'text/csv');
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
    clearAll,
    exportJSON,
    exportCSV,
    eventCount: eventsRef.current.length,
    sampleCount: samples.length,
  };
}
