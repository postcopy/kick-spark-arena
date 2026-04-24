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
  if (level === null) return <Battery className="w-3.5 h-3.5 text-wt-fg-muted" />;
  if (level <= 15) return <BatteryWarning className="w-3.5 h-3.5 text-wt-danger" />;
  if (level <= 30) return <BatteryLow className="w-3.5 h-3.5 text-wt-warning" />;
  if (level <= 60) return <BatteryMedium className="w-3.5 h-3.5 text-wt-warning" />;
  return <BatteryFull className="w-3.5 h-3.5 text-wt-success" />;
}

function batteryColor(level: number | null): string {
  if (level === null) return 'text-wt-fg-muted';
  if (level <= 15) return 'text-wt-danger';
  if (level <= 30) return 'text-wt-warning';
  if (level <= 60) return 'text-wt-warning';
  return 'text-wt-success';
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
    ? { bg: 'bg-chung/10', border: 'border-chung/40', text: 'text-chung-accent', flash: 'bg-chung/30 border-chung-accent' }
    : { bg: 'bg-hong/10', border: 'border-hong/40', text: 'text-hong-accent', flash: 'bg-hong/30 border-hong-accent' };

  return (
    <div className={cn(
      "border p-2 transition-all duration-150 relative overflow-hidden",
      isFlashing
        ? sideColors.flash
        : isOnline
        ? `${sideColors.bg} ${sideColors.border}`
        : "bg-wt-bg-secondary border-wt-divider"
    )}>
      {/* Flash overlay */}
      {isFlashing && (
        <div className={cn(
          "absolute inset-0",
          label.side === 'blue' ? "bg-chung/25" : "bg-hong/25"
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
    <section className="p-2.5 border-b border-wt-divider flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-bold text-wt-fg-secondary uppercase tracking-[0.25em]">
          HARDWARE
        </h3>
        {isConnected && (
          <span className="text-[10px] text-wt-fg-muted font-mono tabular-nums">
            {onlineCount}/4
          </span>
        )}
      </div>

      {/* Connect/Disconnect Button */}
      <Button
        onClick={isConnected ? serialPort.disconnect : serialPort.connect}
        disabled={isConnecting || isAutoConnecting}
        className={cn(
          "w-full h-9 font-bold uppercase text-xs tracking-wider mb-2 transition-all border rounded-none",
          isConnected
            ? "bg-wt-success/15 border-wt-success/50 text-wt-success hover:bg-wt-success/25"
            : isConnecting || isAutoConnecting
            ? "bg-wt-warning/15 border-wt-warning/50 text-wt-warning animate-pulse"
            : "bg-white hover:bg-white/90 text-black border-white"
        )}
      >
        <Usb className="w-4 h-4 mr-1.5" />
        {isAutoConnecting
          ? 'AUTO-CONECTANDO...'
          : isConnecting
          ? 'CONECTANDO...'
          : isConnected
          ? `CONECTADO · ${onlineCount}/4`
          : 'CONECTAR USB'
        }
      </Button>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-1.5 mb-2 p-2 bg-wt-danger/10 border border-wt-danger/40">
          <AlertTriangle className="w-3.5 h-3.5 text-wt-danger shrink-0 mt-0.5" />
          <span className="text-[10px] text-wt-danger leading-tight">{error}</span>
        </div>
      )}

      {/* Debug: raw data indicator */}
      {isConnected && (
        <div className="mb-2 p-1.5 bg-wt-bg-tertiary border border-wt-divider">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-wt-fg-muted font-mono uppercase tracking-wider">Pacotes</span>
            <span className={cn(
              "text-[10px] font-mono font-bold tabular-nums",
              serialPort.rawPacketCount > 0 ? "text-wt-success" : "text-wt-danger"
            )}>
              {serialPort.rawPacketCount > 0 ? serialPort.rawPacketCount : 'NENHUM'}
            </span>
          </div>
          {serialPort.lastRawLine && (
            <div className="mt-1 text-[8px] text-wt-fg-muted font-mono truncate">
              {serialPort.lastRawLine}
            </div>
          )}
        </div>
      )}

      {/* Equipment Grid - always visible */}
      <div className="grid grid-cols-2 gap-[2px]">
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
        <div className="flex items-center gap-1.5 mt-2">
          <Zap className="w-3 h-3 text-wt-warning" />
          <span className="text-[10px] text-wt-warning font-bold uppercase tracking-wider">
            Teste · {testedCount}/4
          </span>
        </div>
      )}
      {isConnected && testedCount >= 4 && (
        <div className="flex items-center gap-1.5 mt-2">
          <Check className="w-3 h-3 text-wt-success" />
          <span className="text-[10px] text-wt-success font-bold uppercase tracking-wider">
            Pronto para luta
          </span>
        </div>
      )}
    </section>
  );
}
