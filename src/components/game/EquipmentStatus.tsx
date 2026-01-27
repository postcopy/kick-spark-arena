import { Shirt, HardHat, BatteryWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EquipmentSlot, EquipmentState } from '@/types/serial';

interface EquipmentStatusProps {
  equipment: Map<EquipmentSlot, EquipmentState>;
  compact?: boolean;
  filterSide?: 'red' | 'blue';
  showOnlyLowBattery?: boolean;
}

function getBatteryColor(battery: number | null): string {
  if (battery === null) return 'text-muted-foreground';
  if (battery <= 15) return 'text-destructive';
  if (battery <= 30) return 'text-yellow-500';
  return 'text-green-500';
}

function getBatteryBgColor(battery: number | null): string {
  if (battery === null) return 'bg-muted/20';
  if (battery <= 15) return 'bg-destructive/20';
  if (battery <= 30) return 'bg-yellow-500/20';
  return 'bg-green-500/20';
}

export function EquipmentStatus({ 
  equipment, 
  compact, 
  filterSide,
  showOnlyLowBattery 
}: EquipmentStatusProps) {
  const slots = [1, 2, 3, 4] as EquipmentSlot[];
  
  const filteredSlots = slots.filter(slot => {
    const eq = equipment.get(slot);
    if (!eq) return false;
    if (filterSide && eq.side !== filterSide) return false;
    if (showOnlyLowBattery && (eq.battery === null || eq.battery > 30)) return false;
    return true;
  });

  if (filteredSlots.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {filteredSlots.map(slot => {
        const eq = equipment.get(slot);
        if (!eq) return null;
        
        const Icon = eq.type === 'vest' ? Shirt : HardHat;
        const sideColorClass = eq.side === 'red' ? 'text-game-red' : 'text-game-blue';
        const batteryColor = getBatteryColor(eq.battery);
        const bgColor = getBatteryBgColor(eq.battery);
        const isLow = eq.battery !== null && eq.battery <= 30;
        
        return (
          <div 
            key={slot}
            className={cn(
              "flex items-center gap-1 rounded-lg border border-border/50",
              bgColor,
              compact ? "px-1.5 py-0.5" : "px-2 py-1",
              isLow && "animate-pulse"
            )}
          >
            <Icon className={cn(
              sideColorClass,
              compact ? "w-3.5 h-3.5" : "w-4 h-4"
            )} />
            {eq.battery !== null ? (
              <span className={cn(
                "font-medium tabular-nums",
                batteryColor,
                compact ? "text-[10px]" : "text-xs"
              )}>
                {eq.battery}%
              </span>
            ) : (
              <span className={cn(
                "text-muted-foreground",
                compact ? "text-[10px]" : "text-xs"
              )}>
                --
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact badge for use in game screens
interface BatteryBadgeProps {
  equipment: EquipmentState | undefined;
  compact?: boolean;
}

export function BatteryBadge({ equipment, compact }: BatteryBadgeProps) {
  if (!equipment || equipment.battery === null) return null;
  
  const Icon = equipment.type === 'vest' ? Shirt : HardHat;
  const sideColorClass = equipment.side === 'red' ? 'text-game-red' : 'text-game-blue';
  const batteryColor = getBatteryColor(equipment.battery);
  const isLow = equipment.battery <= 30;
  
  return (
    <div className={cn(
      "flex items-center gap-1",
      isLow && "animate-pulse"
    )}>
      <Icon className={cn(sideColorClass, compact ? "w-3 h-3" : "w-4 h-4")} />
      <span className={cn(
        "font-medium tabular-nums",
        batteryColor,
        compact ? "text-[10px]" : "text-xs"
      )}>
        {equipment.battery}%
      </span>
    </div>
  );
}

// Alert component for low battery warnings
interface LowBatteryAlertProps {
  equipment: Map<EquipmentSlot, EquipmentState>;
}

export function LowBatteryAlert({ equipment }: LowBatteryAlertProps) {
  const lowBatteryEquipment = Array.from(equipment.values()).filter(
    eq => eq.battery !== null && eq.battery <= 30
  );

  if (lowBatteryEquipment.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-1">
      {lowBatteryEquipment.map(eq => (
        <div 
          key={eq.id}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "bg-destructive/20 border border-destructive/50",
            "animate-pulse"
          )}
        >
          <BatteryWarning className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive font-medium">
            {eq.type === 'vest' ? 'Colete' : 'Capacete'} {eq.side === 'red' ? 'VM' : 'AZ'}: {eq.battery}%
          </span>
        </div>
      ))}
    </div>
  );
}
