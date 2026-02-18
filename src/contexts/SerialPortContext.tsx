import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { useSerialPort } from '@/hooks/useSerialPort';
import type { Side, HitType } from '@/types/game';
import type { UseSerialPortReturn, ImpactCallbackData } from '@/types/serial';

// ─── Types ───

type KickHandler = (side: Side, hitType: HitType) => void;
type RawPacketHandler = (pkt: { intensity: number; deviceId: number; battery?: number; ts: number }) => void;
type ImpactHandler = (impact: ImpactCallbackData) => void;

interface ImpactDetectorConfig {
  enabled: boolean;
  noiseFloor: Record<string, number>;
  noiseIntensityMin?: number;
}

interface SerialPortContextValue {
  serialPort: UseSerialPortReturn;
  registerKickHandler: (fn: KickHandler) => void;
  unregisterKickHandler: () => void;
  registerRawPacketHandler: (fn: RawPacketHandler) => void;
  unregisterRawPacketHandler: () => void;
  registerImpactHandler: (fn: ImpactHandler) => void;
  unregisterImpactHandler: () => void;
  setImpactDetectorConfig: (config: ImpactDetectorConfig | null) => void;
}

// ─── Context ───

const SerialPortContext = createContext<SerialPortContextValue | null>(null);

// ─── Provider ───

export function SerialPortProvider({ children }: { children: React.ReactNode }) {
  // Callback refs — delegates that pages register/unregister
  const kickHandlerRef = useRef<KickHandler | null>(null);
  const rawPacketHandlerRef = useRef<RawPacketHandler | null>(null);
  const impactHandlerRef = useRef<ImpactHandler | null>(null);
  
  // Impact detector config state (ref to avoid re-renders of the hook)
  const [impactDetectorConfig, setImpactDetectorConfigState] = React.useState<ImpactDetectorConfig | null>(null);

  // Stable callbacks that delegate to refs
  const onKick = useCallback((side: Side, hitType: HitType) => {
    kickHandlerRef.current?.(side, hitType);
  }, []);

  const onRawPacket = useCallback((pkt: { intensity: number; deviceId: number; battery?: number; ts: number }) => {
    rawPacketHandlerRef.current?.(pkt);
  }, []);

  const onImpact = useCallback((impact: ImpactCallbackData) => {
    impactHandlerRef.current?.(impact);
  }, []);

  // Build the impactDetectorConfig for useSerialPort
  const impactDetectorConfigMemo = useMemo(() => {
    if (!impactDetectorConfig || !impactDetectorConfig.enabled) return undefined;
    return impactDetectorConfig;
  }, [impactDetectorConfig]);

  const serialPort = useSerialPort({
    onKick,
    onRawPacket,
    onImpact,
    debounceMs: 150,
    impactDetectorConfig: impactDetectorConfigMemo,
  });

  // Registration functions
  const registerKickHandler = useCallback((fn: KickHandler) => {
    kickHandlerRef.current = fn;
  }, []);
  const unregisterKickHandler = useCallback(() => {
    kickHandlerRef.current = null;
  }, []);

  const registerRawPacketHandler = useCallback((fn: RawPacketHandler) => {
    rawPacketHandlerRef.current = fn;
  }, []);
  const unregisterRawPacketHandler = useCallback(() => {
    rawPacketHandlerRef.current = null;
  }, []);

  const registerImpactHandler = useCallback((fn: ImpactHandler) => {
    impactHandlerRef.current = fn;
  }, []);
  const unregisterImpactHandler = useCallback(() => {
    impactHandlerRef.current = null;
  }, []);

  const setImpactDetectorConfig = useCallback((config: ImpactDetectorConfig | null) => {
    setImpactDetectorConfigState(config);
  }, []);

  const value = useMemo<SerialPortContextValue>(() => ({
    serialPort,
    registerKickHandler,
    unregisterKickHandler,
    registerRawPacketHandler,
    unregisterRawPacketHandler,
    registerImpactHandler,
    unregisterImpactHandler,
    setImpactDetectorConfig,
  }), [
    serialPort,
    registerKickHandler, unregisterKickHandler,
    registerRawPacketHandler, unregisterRawPacketHandler,
    registerImpactHandler, unregisterImpactHandler,
    setImpactDetectorConfig,
  ]);

  return (
    <SerialPortContext.Provider value={value}>
      {children}
    </SerialPortContext.Provider>
  );
}

// ─── Hook ───

export function useSerialPortContext() {
  const ctx = useContext(SerialPortContext);
  if (!ctx) {
    throw new Error('useSerialPortContext must be used within SerialPortProvider');
  }
  return ctx;
}
