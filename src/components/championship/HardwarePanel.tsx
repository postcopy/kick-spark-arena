import { useState, useEffect, useRef } from 'react';
import { Usb, Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryWarning, Check, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UseSerialPortReturn, EquipmentSlot, EquipmentState } from '@/types/serial';
import type { UseHardwareDiagnosticsReturn } from '@/types/hardwareDiagnostics';

interface HardwarePanelProps {
  serialPort: UseSerialPortReturn;
  diagnostics?: UseHardwareDiagnosticsReturn;
}

const EQUIPMENT_LABELS: Record<EquipmentSlot, { name: string; shortName: string; side: 'blue' | 'red' }> = {
  1: { name: 'Colete Azul', shortName: 'COL', side: 'blue' },
  2: { name: 'Colete Verm.', shortName: 'COL', side: 'red' },
  3: { name: 'Capacete Verm.', shortName: 'CAP', side: 'red' },   // Helmets inverted in EngFlex HW
  4: { name: 'Capacete Azul', shortName: 'CAP', side: 'blue' },   // Helmets inverted in EngFlex HW
};

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return <Battery className="w-3.5 h-3.5 text-zinc-600" />;
  if (level <= 15) return <BatteryWarning className="w-3.5 h-3.5 text-red-400" />;
  if (level <= 30) return <BatteryLow className="w-3.5 h-3.5 text-yellow-400" />;
  if (level <= 60) return <BatteryMedium className="w-3.5 h-3.5 text-yellow-300" />;
  return <BatteryFull className="w-3.5 h-3.5 text-green-400" />;
}

function batteryColor(level: number | null): string {
  if (level === null) return 'text-zinc-600';
  if (level <= 15) return 'text-red-400';
  if (level <= 30) return 'text-yellow-400';
  if (level <= 60) return 'text-yellow-300';
  return 'text-green-400';
}

function EquipmentCard({
  slot,
  equipment,
  lastImpactTs
}: {
  slot: EquipmentSlot;
  equipment: EquipmentState;
  lastImpactTs: number | null;
}) {
  const label = EQUIPMENT_LABELS[slot];
  const isOnline = equipment.lastSeen !== null && (Date.now() - equipment.lastSeen) < 30000;
  const isFlashing = lastImpactTs !== null && (Date.now() - lastImpactTs) < 1500;
  const wasTestedEver = lastImpactTs !== null;

  const sideColors = label.side === 'blue'
    ? { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', flash: 'bg-blue-500/30 border-blue-400' }
    : { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', flash: 'bg-red-500/30 border-red-400' };

  return (
    <div className={cn(
      "rounded-lg border p-2 transition-all duration-300 relative overflow-hidden",
      isFlashing
        ? `${sideColors.flash} shadow-lg`
        : isOnline
        ? `${sideColors.bg} ${sideColors.border}`
        : "bg-zinc-800/50 border-zinc-700/50"
    )}>
      {/* Flash overlay */}
      {isFlashing && (
        <div className={cn(
          "absolute inset-0 animate-pulse",
          label.side === 'blue' ? "bg-blue-500/20" : "bg-red-500/20"
        )} />
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn(
            "font-bold text-[10px] uppercase leading-none",
            isOnline ? sideColors.text : "text-zinc-600"
          )}>
            {label.shortName}
          </span>
          <span className={cn(
            "text-[9px] uppercase leading-none",
            isOnline ? "text-zinc-400" : "text-zinc-700"
          )}>
            {label.side === 'blue' ? 'AZ' : 'VM'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Test status */}
          {wasTestedEver && (
            <Check className={cn(
              "w-3 h-3",
              isFlashing ? "text-green-300" : "text-green-500/60"
            )} />
          )}

          {/* Battery */}
          {isOnline ? (
            <div className="flex items-center gap-0.5">
              <BatteryIcon level={equipment.battery} />
              <span className={cn("text-[10px] font-mono font-bold", batteryColor(equipment.battery))}>
                {equipment.battery !== null ? `${equipment.battery}%` : '--'}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-700 font-mono">--</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function HardwarePanel({ serialPort, diagnostics }: HardwarePanelProps) {
  const { isConnected, isConnecting, isAutoConnecting, error, equipment, equipmentVersion } = serialPort;

  // Track last impact per device for flash effect
  const [impactFlash, setImpactFlash] = useState<Record<number, number>>({});
  const lastImpactCountRef = useRef(0);

  // Watch for new impacts from diagnostics
  useEffect(() => {
    if (!diagnostics) return;
    const recentImpacts = diagnostics.uiRecentImpacts;
    if (recentImpacts.length > 0 && recentImpacts.length !== lastImpactCountRef.current) {
      lastImpactCountRef.current = recentImpacts.length;
      const latest = recentImpacts[0]; // most recent
      if (latest && latest.deviceId >= 1 && latest.deviceId <= 4) {
        setImpactFlash(prev => ({
          ...prev,
          [latest.deviceId]: Date.now(),
        }));
      }
    }
  }, [diagnostics?.uiRecentImpacts]);

  // Auto-refresh flash effect
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const hasActiveFlash = Object.values(impactFlash).some(ts => Date.now() - ts < 1500);
    if (hasActiveFlash) {
      const timer = setTimeout(() => forceUpdate(n => n + 1), 200);
      return () => clearTimeout(timer);
    }
  }, [impactFlash, forceUpdate]);

  // Count online devices
  const onlineCount = Array.from(equipment.values()).filter(
    e => e.lastSeen !== null && (Date.now() - e.lastSeen) < 30000
  ).length;

  // Count tested devices
  const testedCount = Object.keys(impactFlash).length;

  const slots: EquipmentSlot[] = [1, 2, 3, 4];

  return (
    <section className="p-2.5 border-b border-[hsl(var(--sulsport-gray))] flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          HARDWARE
        </h3>
        {isConnected && (
          <span className="text-[9px] text-zinc-500 font-mono">
            {onlineCount}/4
          </span>
        )}
      </div>

      {/* Connect/Disconnect Button */}
      <Button
        onClick={isConnected ? serialPort.disconnect : serialPort.connect}
        disabled={isConnecting || isAutoConnecting}
        className={cn(
          "w-full h-9 rounded-md font-bold uppercase text-xs mb-1.5 transition-all",
          isConnected
            ? "bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-green-600/30"
            : isConnecting || isAutoConnecting
            ? "bg-amber-600/20 border border-amber-500/40 text-amber-400 animate-pulse"
            : "bg-yellow-600 hover:bg-yellow-500 text-black"
        )}
      >
        <Usb className="w-4 h-4 mr-1.5" />
        {isAutoConnecting
          ? 'AUTO-CONECTANDO...'
          : isConnecting
          ? 'CONECTANDO...'
          : isConnected
          ? `CONECTADO ● ${onlineCount}/4`
          : 'CONECTAR USB'
        }
      </Button>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-1.5 mb-1.5 p-1.5 rounded-md bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <span className="text-[10px] text-red-400 leading-tight">{error}</span>
        </div>
      )}

      {/* Debug: raw data indicator */}
      {isConnected && (
        <div className="mb-1.5 p-1.5 rounded-md bg-zinc-800/80 border border-zinc-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-zinc-500 font-mono uppercase">Pacotes:</span>
            <span className={cn(
              "text-[10px] font-mono font-bold",
              serialPort.rawPacketCount > 0 ? "text-green-400" : "text-red-400"
            )}>
              {serialPort.rawPacketCount > 0 ? serialPort.rawPacketCount : 'NENHUM ⚠'}
            </span>
          </div>
          {serialPort.lastRawLine && (
            <div className="mt-0.5 text-[8px] text-zinc-600 font-mono truncate">
              {serialPort.lastRawLine}
            </div>
          )}
        </div>
      )}

      {/* Equipment Grid - always visible */}
      <div className="grid grid-cols-2 gap-1">
        {slots.map(slot => {
          const eq = equipment.get(slot) ?? { battery: null, lastSeen: null };
          return (
            <EquipmentCard
              key={slot}
              slot={slot}
              equipment={eq}
              lastImpactTs={impactFlash[slot] ?? null}
            />
          );
        })}
      </div>

      {/* Test status indicator */}
      {isConnected && testedCount > 0 && testedCount < 4 && (
        <div className="flex items-center gap-1 mt-1.5">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-[9px] text-yellow-400 font-bold uppercase">
            TESTE: {testedCount}/4 equipamentos
          </span>
        </div>
      )}
      {isConnected && testedCount >= 4 && (
        <div className="flex items-center gap-1 mt-1.5">
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-[9px] text-green-400 font-bold uppercase">
            TODOS TESTADOS - PRONTO
          </span>
        </div>
      )}
    </section>
  );
}
