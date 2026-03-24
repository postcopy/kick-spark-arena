import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { useSerialPort } from '@/hooks/useSerialPort';
import type { Side, HitType } from '@/types/game';
import type { UseSerialPortReturn, ImpactCallbackData, JudgeEvent } from '@/types/serial';

// ─── Types ───

type KickHandler = (side: Side, hitType: HitType) => void;
type RawPacketHandler = (pkt: { intensity: number; deviceId: number; battery?: number; ts: number }) => void;
type ImpactHandler = (impact: ImpactCallbackData) => void;
type JudgeHandler = (event: JudgeEvent) => void;

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
  registerJudgeHandler: (fn: JudgeHandler) => void;
  unregisterJudgeHandler: () => void;
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
  const judgeHandlerRef = useRef<JudgeHandler | null>(null);
  
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

  const onJudgeEvent = useCallback((event: JudgeEvent) => {
    judgeHandlerRef.current?.(event);
  }, []);

  // Pass config directly to useSerialPort (detector is always active, config just updates thresholds)
  const serialPortRaw = useSerialPort({
    onKick,
    onRawPacket,
    onImpact,
    onJudgeEvent,
    debounceMs: 150,
    impactDetectorConfig: impactDetectorConfig ?? undefined,
  });

  // Destructure individual properties so useMemo depends on stable primitives/refs
  const {
    isConnected, isConnecting, isAutoConnecting, error, isSupported,
    connect, disconnect, equipment, equipmentVersion, rawPacketCount, lastRawLine,
    getDetectorDiag, setPassThroughMode,
  } = serialPortRaw;

  const serialPort = useMemo<UseSerialPortReturn>(() => ({
    isConnected, isConnecting, isAutoConnecting, error, isSupported,
    connect, disconnect, equipment, equipmentVersion, rawPacketCount, lastRawLine,
    getDetectorDiag, setPassThroughMode,
  }), [
    isConnected, isConnecting, isAutoConnecting, error, isSupported,
    connect, disconnect, equipment, equipmentVersion, rawPacketCount, lastRawLine,
    getDetectorDiag, setPassThroughMode,
  ]);

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

  const registerJudgeHandler = useCallback((fn: JudgeHandler) => {
    judgeHandlerRef.current = fn;
  }, []);
  const unregisterJudgeHandler = useCallback(() => {
    judgeHandlerRef.current = null;
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
    registerJudgeHandler,
    unregisterJudgeHandler,
    setImpactDetectorConfig,
  }), [
    serialPort,
    registerKickHandler, unregisterKickHandler,
    registerRawPacketHandler, unregisterRawPacketHandler,
    registerImpactHandler, unregisterImpactHandler,
    registerJudgeHandler, unregisterJudgeHandler,
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
