import { useState, useEffect, useRef, useCallback } from 'react';
import { Side, HitType } from '@/types/game';
import { 
  UseSerialPortOptions, 
  UseSerialPortReturn, 
  EquipmentSlot, 
  EquipmentState,
  EquipmentType
} from '@/types/serial';

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

interface ParsedLine {
  intensity: number;  // Value 1: Intensity (0-1023) or Button
  deviceId: number;   // Value 2: Device ID (1-4 = equipment, 5-7 = judges)
  battery: number;    // Value 3: Battery (0-100%)
}

function parseLine(line: string): ParsedLine | null {
  // Clean the line: remove \r, ANSI codes, and trim whitespace
  const cleanLine = line
    .replace(/\r/g, '')                    // Remove carriage return (ESP32 sends \r\n)
    .replace(/\x1b\[[0-9;]*m/g, '')        // Remove ANSI color codes from debug output
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
  // Documentação oficial: IDs 1 e 3 = azul, IDs 2 e 4 = vermelho
  return id % 2 === 1 ? 'blue' : 'red';
}

function deviceIdToKickingSide(deviceId: number): Side | null {
  // Equipamento atingido → quem chutou é o lado oposto
  // ID 1 (colete azul) ou ID 3 (capacete azul) → Vermelho chutou
  // ID 2 (colete vermelho) ou ID 4 (capacete vermelho) → Azul chutou
  if (deviceId === 1 || deviceId === 3) return 'red';
  if (deviceId === 2 || deviceId === 4) return 'blue';
  return null;
}

function deviceIdToHitType(deviceId: number): HitType {
  // IDs 1-2 = vests, IDs 3-4 = helmets
  return deviceId <= 2 ? 'vest' : 'helmet';
}

function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

function createInitialEquipment(): Map<EquipmentSlot, EquipmentState> {
  return new Map([
    [1, { id: 1, type: 'vest', side: 'blue', battery: null, lastSeen: null }],   // Colete azul
    [2, { id: 2, type: 'vest', side: 'red', battery: null, lastSeen: null }],    // Colete vermelho
    [3, { id: 3, type: 'helmet', side: 'blue', battery: null, lastSeen: null }], // Capacete azul
    [4, { id: 4, type: 'helmet', side: 'red', battery: null, lastSeen: null }],  // Capacete vermelho
  ]);
}

export function useSerialPort({ 
  onKick, 
  onRawPacket,
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
  const isReadingRef = useRef(false);
  const equipmentRef = useRef<Map<EquipmentSlot, EquipmentState>>(createInitialEquipment());

  // Keep onKick ref updated
  useEffect(() => {
    onKickRef.current = onKick;
  }, [onKick]);

  // Keep onRawPacket ref updated
  useEffect(() => {
    onRawPacketRef.current = onRawPacket;
  }, [onRawPacket]);

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
        // Trigger re-render
        setEquipmentVersion(v => v + 1);
      }
    }
  }, []);

  const stopReading = useCallback(async () => {
    isReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        // Ignore cancel errors
      }
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
          // DEBUG: Log raw line
          console.log('[Serial] Raw line:', JSON.stringify(line));
          
          const parsed = parseLine(line);
          if (!parsed) {
            console.log('[Serial] Parse failed for:', JSON.stringify(line));
            continue;
          }
          
          const { intensity, deviceId, battery } = parsed;
          console.log('[Serial] Parsed OK:', { intensity, deviceId, battery });
          
          // NEW: Raw packet for diagnostics (before any filter)
          if (onRawPacketRef.current) {
            onRawPacketRef.current({
              intensity,
              deviceId,
              battery,
              ts: Date.now(),
            });
          }
          
          // Update equipment battery state
          updateEquipment(deviceId, battery);
          
          // Convert to kicking side and trigger kick with hit type
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
      try {
        await portRef.current.close();
      } catch (e) {
        // Ignore close errors
      }
      portRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
    // Reset equipment state
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
      // Request port from user
      console.log('[Serial] Solicitando porta...');
      const port = await navigator.serial.requestPort();
      console.log('[Serial] Porta selecionada, abrindo a', BAUD_RATE, 'baud...');
      
      // Open port
      await port.open({ baudRate: BAUD_RATE });
      console.log('[Serial] Porta aberta com sucesso!');
      
      portRef.current = port;
      setIsConnected(true);
      setIsConnecting(false);
      
      // Start reading
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

  // Try to auto-reconnect on mount if port was previously authorized
  useEffect(() => {
    async function tryAutoReconnect() {
      if (!isWebSerialSupported()) return;
      
      try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          const port = ports[0];
          
          // Check if already open
          if (port.readable) {
            portRef.current = port;
            setIsConnected(true);
            startReading(port);
            return;
          }
          
          // Try to open
          try {
            await port.open({ baudRate: BAUD_RATE });
            portRef.current = port;
            setIsConnected(true);
            startReading(port);
          } catch (e: any) {
            // Port might be in use, that's ok
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
      // Reset equipment state
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
