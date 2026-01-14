import { useState, useEffect, useRef, useCallback } from 'react';
import { Side } from '@/types/game';
import { UseSerialPortOptions, UseSerialPortReturn } from '@/types/serial';

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

function parseLine(line: string): Side | null {
  const trimmed = line.trim();
  if (!LINE_REGEX.test(trimmed)) return null;
  
  const parts = trimmed.split(',');
  const B = parseInt(parts[1], 10);
  
  // B = 2 → RED, B = 1 → BLUE
  if (B === 2) return 'red';
  if (B === 1) return 'blue';
  return null;
}

function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function useSerialPort({ 
  onKick, 
  debounceMs = DEFAULT_DEBOUNCE_MS 
}: UseSerialPortOptions): UseSerialPortReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const lastKickTimeRef = useRef<{ red: number; blue: number }>({ red: 0, blue: 0 });
  const onKickRef = useRef(onKick);
  const isReadingRef = useRef(false);

  // Keep onKick ref updated
  useEffect(() => {
    onKickRef.current = onKick;
  }, [onKick]);

  const shouldDebounce = useCallback((side: Side): boolean => {
    const now = Date.now();
    if (now - lastKickTimeRef.current[side] < debounceMs) return true;
    lastKickTimeRef.current[side] = now;
    return false;
  }, [debounceMs]);

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
          const side = parseLine(line);
          if (side && !shouldDebounce(side)) {
            onKickRef.current(side);
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
  }, [shouldDebounce]);

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
  };
}
