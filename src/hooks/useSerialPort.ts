import { useState, useEffect, useRef, useCallback } from 'react';
import { Side, HitType } from '@/types/game';
import { 
  UseSerialPortOptions, 
  UseSerialPortReturn, 
  EquipmentSlot, 
  EquipmentState,
  EquipmentType,
  ImpactCallbackData,
} from '@/types/serial';
import { deviceIdToKickingSide, deviceIdToHitType } from '@/lib/deviceMapping';
import { ImpactDetector } from '@/lib/impactDetector';

// Type declarations for Web Serial API
declare global {
  interface Navigator {
    serial: {
      requestPort(): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
  
  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
}

const BAUD_RATE = 115200;
const DEFAULT_DEBOUNCE_MS = 150;
const LINE_REGEX = /^\d+,\d+,\d+$/;
const FLUSH_INTERVAL_MS = 30;

interface ParsedLine {
  intensity: number;
  deviceId: number;
  battery: number;
}

function parseLine(line: string): ParsedLine | null {
  const cleanLine = line
    .replace(/\r/g, '')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .trim();
  
  if (!LINE_REGEX.test(cleanLine)) return null;
  
  const parts = cleanLine.split(',');
  return {
    intensity: parseInt(parts[0], 10),
    deviceId: parseInt(parts[1], 10),
    battery: parseInt(parts[2], 10),
  };
}

function getEquipmentType(id: number): EquipmentType {
  return id <= 2 ? 'vest' : 'helmet';
}

function getEquipmentSide(id: number): 'red' | 'blue' {
  return id % 2 === 1 ? 'blue' : 'red';
}

function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

function createInitialEquipment(): Map<EquipmentSlot, EquipmentState> {
  return new Map([
    [1, { id: 1, type: 'vest', side: 'blue', battery: null, lastSeen: null }],
    [2, { id: 2, type: 'vest', side: 'red', battery: null, lastSeen: null }],
    [3, { id: 3, type: 'helmet', side: 'blue', battery: null, lastSeen: null }],
    [4, { id: 4, type: 'helmet', side: 'red', battery: null, lastSeen: null }],
  ]);
}

export function useSerialPort({ 
  onKick, 
  onRawPacket,
  onImpact,
  impactDetectorConfig,
  debounceMs = DEFAULT_DEBOUNCE_MS 
}: UseSerialPortOptions): UseSerialPortReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentVersion, setEquipmentVersion] = useState(0);
  
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const lastKickTimeRef = useRef<{ red: number; blue: number }>({ red: 0, blue: 0 });
  const onKickRef = useRef(onKick);
  const onRawPacketRef = useRef(onRawPacket);
  const onImpactRef = useRef(onImpact);
  const isReadingRef = useRef(false);
  const equipmentRef = useRef<Map<EquipmentSlot, EquipmentState>>(createInitialEquipment());
  
  // Impact detector refs
  const detectorRef = useRef<ImpactDetector | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushCountRef = useRef(0);
  const loggedDetectorStatusRef = useRef(false);

  useEffect(() => { onKickRef.current = onKick; }, [onKick]);
  useEffect(() => { onRawPacketRef.current = onRawPacket; }, [onRawPacket]);
  useEffect(() => { onImpactRef.current = onImpact; }, [onImpact]);

  // Stabilize noiseFloor dependency via serialized string comparison
  const noiseFloorJson = JSON.stringify(impactDetectorConfig?.noiseFloor ?? {});

  // Create/update/destroy ImpactDetector based on config
  useEffect(() => {
    console.log('[useSerialPort] detector useEffect RUNNING, enabled=', impactDetectorConfig?.enabled, 'noiseFloor=', noiseFloorJson);
    if (impactDetectorConfig?.enabled) {
      const parsedNoiseFloor = JSON.parse(noiseFloorJson);
      if (!detectorRef.current) {
        detectorRef.current = new ImpactDetector({
          noiseFloor: parsedNoiseFloor,
        });
        console.log('[useSerialPort] ImpactDetector ENABLED, noiseFloor:', parsedNoiseFloor);
      } else {
        detectorRef.current.updateConfig({
          noiseFloor: parsedNoiseFloor,
        });
        console.log('[useSerialPort] ImpactDetector CONFIG UPDATED, noiseFloor:', parsedNoiseFloor);
      }
      
      // Start flush interval (30ms) - ensures last impact finalizes during silence
      if (!flushIntervalRef.current) {
        flushCountRef.current = 0;
        flushIntervalRef.current = setInterval(() => {
          flushCountRef.current++;
          if (flushCountRef.current % 150 === 0) {
            console.log('[useSerialPort] flush heartbeat, detector:', !!detectorRef.current, 'onImpact:', !!onImpactRef.current);
          }
          if (detectorRef.current) {
            const finalized = detectorRef.current.flush(Date.now());
            if (finalized.length > 0) {
              console.log(`[useSerialPort] flush -> ${finalized.length} impacts finalized`);
              if (onImpactRef.current) {
                for (const impact of finalized) {
                  onImpactRef.current({
                    deviceId: impact.deviceId,
                    peakIntensity: impact.peakIntensity,
                    avgIntensity: impact.avgIntensity,
                    durationMs: impact.durationMs,
                    packetCount: impact.packetCount,
                    ts: impact.endTs,
                  });
                }
              } else {
                console.warn('[useSerialPort] onImpact callback missing, impacts finalized but not delivered');
              }
            }
          }
        }, FLUSH_INTERVAL_MS);
      }
    } else {
      // Cleanup detector when disabled
      if (detectorRef.current) {
        console.log('[useSerialPort] ImpactDetector DISABLED');
      }
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      if (detectorRef.current) {
        detectorRef.current.reset();
        detectorRef.current = null;
      }
    }

    // Only cleanup flush interval on unmount, NOT on every re-run
    // This prevents the 30ms flush loop from being destroyed/recreated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impactDetectorConfig?.enabled, noiseFloorJson]);

  // Separate unmount-only cleanup for flush interval
  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
    };
  }, []);

  const shouldDebounce = useCallback((side: Side): boolean => {
    const now = Date.now();
    if (now - lastKickTimeRef.current[side] < debounceMs) return true;
    lastKickTimeRef.current[side] = now;
    return false;
  }, [debounceMs]);

  const updateEquipment = useCallback((deviceId: number, battery: number) => {
    if (deviceId >= 1 && deviceId <= 4) {
      const slot = deviceId as EquipmentSlot;
      const current = equipmentRef.current.get(slot);
      if (current) {
        equipmentRef.current.set(slot, {
          ...current,
          battery,
          lastSeen: Date.now(),
        });
        setEquipmentVersion(v => v + 1);
      }
    }
  }, []);

  const stopReading = useCallback(async () => {
    isReadingRef.current = false;
    if (readerRef.current) {
      try { await readerRef.current.cancel(); } catch (e) {}
      readerRef.current = null;
    }
  }, []);

  const startReading = useCallback(async (port: SerialPort) => {
    if (!port.readable || isReadingRef.current) return;
    
    isReadingRef.current = true;
    
    try {
      const decoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(decoder.writable as WritableStream<Uint8Array>);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;
      
      let buffer = '';
      
      while (isReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          console.log('[Serial] Raw line:', JSON.stringify(line));
          
          const parsed = parseLine(line);
          if (!parsed) {
            console.log('[Serial] Parse failed for:', JSON.stringify(line));
            continue;
          }
          
          const { intensity, deviceId, battery } = parsed;
          console.log('[Serial] Parsed OK:', { intensity, deviceId, battery });
          
          // Raw packet callback (before any filter)
          if (onRawPacketRef.current) {
            onRawPacketRef.current({ intensity, deviceId, battery, ts: Date.now() });
          }
          
          // Log detector status on first packet
          if (!loggedDetectorStatusRef.current) {
            console.log('[useSerialPort] First packet, detectorRef.current:', !!detectorRef.current);
            loggedDetectorStatusRef.current = true;
          }
          
          // Feed impact detector (when enabled)
          if (detectorRef.current) {
            detectorRef.current.feed(deviceId, intensity, Date.now());
          }
          
          // Update equipment battery state
          updateEquipment(deviceId, battery);
          
          // Legacy onKick pipeline — skip when ImpactDetector is active
          if (!detectorRef.current) {
            const kickingSide = deviceIdToKickingSide(deviceId);
            const hitType = deviceIdToHitType(deviceId);
            
            console.log('[Serial] DeviceID', deviceId, '→ kickingSide:', kickingSide, 'hitType:', hitType);
            
            if (!kickingSide) {
              console.log('[Serial] Ignored: deviceId not mapped (1-4 only)');
              continue;
            }
            
            if (shouldDebounce(kickingSide)) {
              console.log('[Serial] Debounced:', kickingSide);
              continue;
            }
            
            console.log('[Serial] ✓ Triggering kick:', kickingSide, hitType);
            onKickRef.current(kickingSide, hitType);
          }
        }
      }
      
      await readableStreamClosed.catch(() => {});
    } catch (e) {
      if (isReadingRef.current) {
        console.error('Serial read error:', e);
        setError('Erro ao ler dados da plaquinha');
        setIsConnected(false);
      }
    }
  }, [shouldDebounce, updateEquipment]);

  const disconnect = useCallback(async () => {
    await stopReading();
    
    if (portRef.current) {
      try { await portRef.current.close(); } catch (e) {}
      portRef.current = null;
    }
    
    // Reset impact detector
    if (detectorRef.current) {
      detectorRef.current.reset();
    }
    
    setIsConnected(false);
    setError(null);
    equipmentRef.current = createInitialEquipment();
    setEquipmentVersion(v => v + 1);
  }, [stopReading]);

  const connect = useCallback(async () => {
    if (!isWebSerialSupported()) {
      setError('Web Serial não suportado. Use Chrome ou Edge.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('[Serial] Solicitando porta...');
      const port = await navigator.serial.requestPort();
      console.log('[Serial] Porta selecionada, abrindo a', BAUD_RATE, 'baud...');
      
      await port.open({ baudRate: BAUD_RATE });
      console.log('[Serial] Porta aberta com sucesso!');
      
      portRef.current = port;
      setIsConnected(true);
      setIsConnecting(false);
      
      startReading(port);
      
    } catch (e: any) {
      setIsConnecting(false);
      console.error('[Serial] Erro de conexão:', e.name, e.message);
      
      if (e.name === 'NotFoundError') {
        setError('Nenhuma porta selecionada');
      } else if (e.name === 'InvalidStateError') {
        setError('Porta já está aberta em outro local');
      } else if (e.name === 'NetworkError') {
        setError('Porta ocupada. Feche Arduino Monitor, PuTTY ou outro programa usando a COM.');
      } else if (e.name === 'SecurityError') {
        setError('Permissão negada. Recarregue a página e tente novamente.');
      } else {
        setError(`Erro: ${e.name || 'desconhecido'} - ${e.message || 'Verifique conexão'}`);
      }
    }
  }, [startReading]);

  // Auto-reconnect on mount
  useEffect(() => {
    async function tryAutoReconnect() {
      if (!isWebSerialSupported()) return;
      
      try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          const port = ports[0];
          
          if (port.readable) {
            portRef.current = port;
            setIsConnected(true);
            startReading(port);
            return;
          }
          
          try {
            await port.open({ baudRate: BAUD_RATE });
            portRef.current = port;
            setIsConnected(true);
            startReading(port);
          } catch (e: any) {
            console.log('[Serial] Auto-reconexão falhou:', e.name, '- porta pode estar em uso');
          }
        }
      } catch (e) {
        console.log('Auto-reconnect check failed:', e);
      }
    }
    
    tryAutoReconnect();
    
    return () => {
      disconnect();
    };
  }, []);

  // Handle port disconnect event
  useEffect(() => {
    if (!portRef.current) return;
    
    const handleDisconnect = () => {
      setIsConnected(false);
      setError('Plaquinha desconectada');
      portRef.current = null;
      equipmentRef.current = createInitialEquipment();
      setEquipmentVersion(v => v + 1);
    };
    
    portRef.current.addEventListener('disconnect', handleDisconnect);
    
    return () => {
      portRef.current?.removeEventListener('disconnect', handleDisconnect);
    };
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    error,
    isSupported: isWebSerialSupported(),
    connect,
    disconnect,
    equipment: equipmentRef.current,
    equipmentVersion,
  };
}
