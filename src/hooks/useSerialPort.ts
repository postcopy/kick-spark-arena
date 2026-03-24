import { useState, useEffect, useRef, useCallback } from 'react';
import type { Side, HitType } from '@/types/game';
import {
  UseSerialPortOptions,
  UseSerialPortReturn,
  EquipmentSlot,
  EquipmentState,
  EquipmentType,
  ImpactCallbackData,
  JudgeEvent,
} from '@/types/serial';
import { isJudgeDevice, judgeNumber } from '@/lib/deviceMapping';
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
  // Vests: ID 1 = blue, ID 2 = red
  // Helmets (inverted in EngFlex HW): ID 3 = red, ID 4 = blue
  if (id === 3) return 'red';
  if (id === 4) return 'blue';
  return id % 2 === 1 ? 'blue' : 'red';
}

function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

function createInitialEquipment(): Map<EquipmentSlot, EquipmentState> {
  return new Map([
    [1, { id: 1, type: 'vest', side: 'blue', battery: null, lastSeen: null }],
    [2, { id: 2, type: 'vest', side: 'red', battery: null, lastSeen: null }],
    [3, { id: 3, type: 'helmet', side: 'red', battery: null, lastSeen: null }],
    [4, { id: 4, type: 'helmet', side: 'blue', battery: null, lastSeen: null }],
  ]);
}

export function useSerialPort({
  onKick,
  onRawPacket,
  onImpact,
  onJudgeEvent,
  impactDetectorConfig,
  debounceMs = 0,
}: UseSerialPortOptions): UseSerialPortReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentVersion, setEquipmentVersion] = useState(0);
  const rawPacketCountRef = useRef(0);
  const [rawPacketCount, setRawPacketCount] = useState(0);
  const [lastRawLine, setLastRawLine] = useState('');

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const onKickRef = useRef(onKick);
  const onRawPacketRef = useRef(onRawPacket);
  const onImpactRef = useRef(onImpact);
  const onJudgeEventRef = useRef(onJudgeEvent);
  const isReadingRef = useRef(false);
  const equipmentRef = useRef<Map<EquipmentSlot, EquipmentState>>(createInitialEquipment());
  const isConnectedRef = useRef(false);
  const lastKickTimeRef = useRef<Record<number, number>>({});

  // Impact detector — ALWAYS active (eliminates timing issues where serial connects before page mounts)
  const detectorRef = useRef<ImpactDetector>(new ImpactDetector({ noiseIntensityMin: 1 }));
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushCountRef = useRef(0);
  const loggedDetectorStatusRef = useRef(false);
  const loggedFeedRef = useRef(false);

  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { onKickRef.current = onKick; }, [onKick]);
  useEffect(() => { onRawPacketRef.current = onRawPacket; }, [onRawPacket]);
  useEffect(() => { onImpactRef.current = onImpact; }, [onImpact]);
  useEffect(() => { onJudgeEventRef.current = onJudgeEvent; }, [onJudgeEvent]);

  // Stabilize noiseFloor dependency via serialized string comparison
  const noiseFloorJson = JSON.stringify(impactDetectorConfig?.noiseFloor ?? {});

  // Update ImpactDetector config when page sets it (detector is ALWAYS active)
  useEffect(() => {
    const parsedNoiseFloor = JSON.parse(noiseFloorJson);
    const noiseIntensityMin = impactDetectorConfig?.noiseIntensityMin ?? 1;

    detectorRef.current.updateConfig({
      noiseFloor: parsedNoiseFloor,
      noiseIntensityMin,
    });
    console.log('[useSerialPort] ImpactDetector CONFIG UPDATED, noiseFloor:', parsedNoiseFloor, 'noiseIntensityMin:', noiseIntensityMin);
  }, [impactDetectorConfig?.enabled, noiseFloorJson, impactDetectorConfig?.noiseIntensityMin]);

  // Start flush interval only when connected
  useEffect(() => {
    if (!isConnected) {
      // Clear any existing interval when disconnected
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      return;
    }

    flushCountRef.current = 0;
    flushIntervalRef.current = setInterval(() => {
      flushCountRef.current++;
      const activeCount = detectorRef.current.getActiveCount();
      // Log whenever there are active impacts (helps debug why they don't finalize)
      if (activeCount > 0 || flushCountRef.current % 150 === 0) {
        console.log(`[FLUSH] #${flushCountRef.current} active=${activeCount} onImpact=${!!onImpactRef.current}`);
      }
      const finalized = detectorRef.current.flush(Date.now());
      if (finalized.length > 0) {
        console.log(`[useSerialPort] flush -> ${finalized.length} impacts finalized`);
        if (onImpactRef.current) {
          const now = Date.now();
          for (const impact of finalized) {
            // Debounce: skip if a kick was registered for this device within debounceMs
            if (debounceMs > 0) {
              const lastTime = lastKickTimeRef.current[impact.deviceId];
              if (lastTime !== undefined && now - lastTime < debounceMs) {
                console.log(`[useSerialPort] debounce skip dev=${impact.deviceId} (${now - lastTime}ms < ${debounceMs}ms)`);
                continue;
              }
              lastKickTimeRef.current[impact.deviceId] = now;
            }
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
    }, FLUSH_INTERVAL_MS);

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
    };
  }, [isConnected, debounceMs]);

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
    if (!port.readable || isReadingRef.current) {
      console.warn('[Serial] startReading ABORTED: readable=', !!port.readable, 'isReading=', isReadingRef.current);
      return;
    }

    isReadingRef.current = true;
    console.log('[Serial] ★ startReading STARTED, beginning to read data...');

    try {
      const decoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(decoder.writable as WritableStream<Uint8Array>);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      let buffer = '';
      let lineCount = 0;

      while (isReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          lineCount++;
          // Log first 10 lines, then every 50th
          if (lineCount <= 10 || lineCount % 50 === 0) {
            console.log(`[Serial] Raw line #${lineCount}:`, JSON.stringify(line));
          }

          // Update last raw line for debug display
          setLastRawLine(line.trim().slice(0, 50));

          const parsed = parseLine(line);
          if (!parsed) {
            console.log('[Serial] Parse FAILED for:', JSON.stringify(line));
            continue;
          }

          const { intensity, deviceId, battery } = parsed;

          // Increment packet counter (update UI every 5 packets to avoid thrash)
          rawPacketCountRef.current++;
          if (rawPacketCountRef.current <= 3 || rawPacketCountRef.current % 5 === 0) {
            setRawPacketCount(rawPacketCountRef.current);
          }

          if (rawPacketCountRef.current <= 5) {
            console.log(`[Serial] Parsed #${rawPacketCountRef.current}:`, { intensity, deviceId, battery });
          }
          
          // Raw packet callback (before any filter)
          if (onRawPacketRef.current) {
            onRawPacketRef.current({ intensity, deviceId, battery, ts: Date.now() });
          }

          // Judge devices (IDs 5-7) — forward as judge event, skip kick/impact processing
          if (isJudgeDevice(deviceId)) {
            const jNum = judgeNumber(deviceId);
            if (jNum !== null) {
              console.log(`[Serial] Juiz ${jNum} (device ${deviceId}), botão: ${intensity}`);
              if (onJudgeEventRef.current) {
                onJudgeEventRef.current({ button: intensity, judgeId: jNum, deviceId, ts: Date.now() });
              }
            }
            continue;
          }

          // Feed impact detector (ALWAYS active — no null check needed)
          const feedTs = Date.now();
          const activeBeforeFeed = detectorRef.current.getActiveCount();
          detectorRef.current.feed(deviceId, intensity, feedTs);
          const activeAfterFeed = detectorRef.current.getActiveCount();
          // Log first 20 feeds, then every 20th — shows if detector is accepting packets
          if (rawPacketCountRef.current <= 20 || rawPacketCountRef.current % 20 === 0) {
            console.log(`[FEED] pkt#${rawPacketCountRef.current} dev=${deviceId} int=${intensity} active:${activeBeforeFeed}->${activeAfterFeed}`);
          }

          // Update equipment battery state
          updateEquipment(deviceId, battery);
        }
      }
      
      await readableStreamClosed.catch(() => {});
    } catch (e) {
      if (isReadingRef.current) {
        console.error('Serial read error:', e);
        setError('Erro ao ler dados do sensor');
        setIsConnected(false);
      }
    } finally {
      // CRITICAL: always reset reading flag so reconnect can start a new reader
      isReadingRef.current = false;
      readerRef.current = null;
      console.log('[Serial] startReading ENDED, isReading reset to false');
    }
  }, [updateEquipment]);

  const disconnect = useCallback(async () => {
    await stopReading();
    
    if (portRef.current) {
      try { await portRef.current.close(); } catch (e) {}
      portRef.current = null;
    }
    
    // Reset impact detector active impacts (detector stays alive)
    detectorRef.current.reset();
    
    setIsConnected(false);
    setError(null);
    equipmentRef.current = createInitialEquipment();
    setEquipmentVersion(v => v + 1);
    rawPacketCountRef.current = 0;
    setRawPacketCount(0);
    setLastRawLine('');
  }, [stopReading]);

  const tryOpenPort = async (port: SerialPort): Promise<boolean> => {
    // Already open? Reuse directly
    if (port.readable || port.writable) {
      console.log('[Serial] Porta já aberta, reusando...');
      portRef.current = port;
      setIsConnected(true);
      startReading(port);
      return true;
    }

    // Try to open
    try {
      await port.open({ baudRate: BAUD_RATE });
      console.log('[Serial] Porta aberta com sucesso!');
      portRef.current = port;
      setIsConnected(true);
      startReading(port);
      return true;
    } catch (e: any) {
      // InvalidStateError but port is readable = already open, reuse
      if (e.name === 'InvalidStateError' && port.readable) {
        console.log('[Serial] InvalidStateError mas porta readable, reusando...');
        portRef.current = port;
        setIsConnected(true);
        startReading(port);
        return true;
      }
      throw e;
    }
  };

  const connect = useCallback(async () => {
    if (!isWebSerialSupported()) {
      setError('Web Serial não suportado. Use Chrome ou Edge.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Stage A: Try known/authorized ports first (no popup)
      const knownPorts = await navigator.serial.getPorts();
      console.log('[Serial] Portas conhecidas:', knownPorts.length);

      if (knownPorts.length > 0) {
        for (const port of knownPorts) {
          try {
            // Log port info for debugging
            try {
              const info = (port as any).getInfo?.();
              if (info) console.log('[Serial] Port info:', JSON.stringify(info));
            } catch {}
            const success = await tryOpenPort(port);
            if (success) {
              setIsConnecting(false);
              return;
            }
          } catch (e: any) {
            console.log('[Serial] Porta conhecida falhou:', e.name, e.message);
          }
        }
      }

      // Stage B: Request port — Electron intercepts via select-serial-port handler
      // Try up to 2 times with a small delay (port may take time to enumerate)
      let lastErr: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Serial] requestPort() tentativa ${attempt}...`);
          const port = await navigator.serial.requestPort();
          try {
            const info = (port as any).getInfo?.();
            if (info) console.log('[Serial] Porta selecionada info:', JSON.stringify(info));
          } catch {}
          await tryOpenPort(port);
          setIsConnecting(false);
          return;
        } catch (e: any) {
          lastErr = e;
          console.log(`[Serial] requestPort() tentativa ${attempt} falhou:`, e.name, e.message);
          if (attempt < 2 && e.name === 'NotFoundError') {
            // Wait 1s and retry — port may still be enumerating
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      // All attempts failed
      throw lastErr;

    } catch (e: any) {
      setIsConnecting(false);
      console.error('[Serial] Erro de conexão:', e.name, e.message);

      if (e.name === 'NotFoundError') {
        setError('Nenhuma porta USB detectada. Verifique: 1) Placa conectada? 2) Driver instalado? (Gerenciador de Dispositivos → Portas COM)');
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

  // Auto-reconnect on mount with exponential backoff
  useEffect(() => {
    let cancelled = false;
    const BACKOFF_DELAYS = [1000, 3000, 5000]; // 1s, 3s, 5s then stop

    async function tryAutoReconnectOnce(): Promise<boolean> {
      if (!isWebSerialSupported()) return false;

      const ports = await navigator.serial.getPorts();
      if (ports.length === 0) return false;

      setIsAutoConnecting(true);

      for (const port of ports) {
        try {
          const success = await tryOpenPort(port);
          if (success) {
            setIsAutoConnecting(false);
            return true;
          }
        } catch (e: any) {
          // InvalidStateError with readable = already open, reuse
          if (e.name === 'InvalidStateError' && port.readable) {
            console.log('[Serial] Auto-reconnect: InvalidStateError mas porta readable, reusando...');
            portRef.current = port;
            setIsConnected(true);
            startReading(port);
            setIsAutoConnecting(false);
            return true;
          }
          console.log('[Serial] Auto-reconexão falhou:', e.name, '- tentando próxima porta');
        }
      }

      setIsAutoConnecting(false);
      return false;
    }

    async function tryAutoReconnect() {
      try {
        // First attempt (immediate)
        const ok = await tryAutoReconnectOnce();
        if (ok || cancelled) return;

        // Retry with exponential backoff
        for (let i = 0; i < BACKOFF_DELAYS.length; i++) {
          console.log(`[Serial] Auto-reconnect retry ${i + 1}/${BACKOFF_DELAYS.length} in ${BACKOFF_DELAYS[i]}ms...`);
          await new Promise(r => setTimeout(r, BACKOFF_DELAYS[i]));
          if (cancelled) return;

          const success = await tryAutoReconnectOnce();
          if (success || cancelled) return;
        }
        console.log('[Serial] Auto-reconnect gave up after', BACKOFF_DELAYS.length, 'retries');
      } catch (e) {
        console.log('Auto-reconnect check failed:', e);
        setIsAutoConnecting(false);
      }
    }

    tryAutoReconnect();

    return () => {
      cancelled = true;
      setIsAutoConnecting(false);
      disconnect();
    };
  }, []);

  // Handle port disconnect event
  useEffect(() => {
    if (!portRef.current) return;
    
    const handleDisconnect = () => {
      console.log('[Serial] ⚡ Physical disconnect detected, resetting state...');
      // CRITICAL: reset reading flag so startReading() works on reconnect
      isReadingRef.current = false;
      if (readerRef.current) {
        try { readerRef.current.cancel(); } catch (e) {}
        readerRef.current = null;
      }
      detectorRef.current.reset();
      setIsConnected(false);
      setError('Sensor desconectado');
      portRef.current = null;
      equipmentRef.current = createInitialEquipment();
      setEquipmentVersion(v => v + 1);
    };
    
    portRef.current.addEventListener('disconnect', handleDisconnect);
    
    return () => {
      portRef.current?.removeEventListener('disconnect', handleDisconnect);
    };
  }, [isConnected]);

  const getDetectorDiag = useCallback(() => ({
    rejected: detectorRef.current.getRejectedCount(),
    active: detectorRef.current.getActiveCount(),
    lastInt: detectorRef.current.getLastFedIntensity(),
    lastDev: detectorRef.current.getLastFedDeviceId(),
    config: detectorRef.current.getConfigSnapshot(),
  }), []);

  return {
    isConnected,
    isConnecting,
    isAutoConnecting,
    error,
    isSupported: isWebSerialSupported(),
    connect,
    disconnect,
    equipment: equipmentRef.current,
    equipmentVersion,
    rawPacketCount,
    lastRawLine,
    getDetectorDiag,
    setPassThroughMode: useCallback((active: boolean) => {
      detectorRef.current.updateConfig({ passThroughMode: active });
      console.log('[useSerialPort] passThroughMode:', active);
    }, []),
  };
}
