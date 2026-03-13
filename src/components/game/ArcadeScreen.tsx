import type { UseArcadeStateReturn } from '@/hooks/useArcadeState';
import type { EquipmentSlot, EquipmentState } from '@/types/serial';
import { ArcadeScreenTV } from './ArcadeScreenTV';

interface ArcadeScreenProps {
  arcadeState: UseArcadeStateReturn;
  equipment?: Map<EquipmentSlot, EquipmentState>;
}

// TV Mode is now the default - optimized for large screens
export function ArcadeScreen({ arcadeState, equipment }: ArcadeScreenProps) {
  return <ArcadeScreenTV arcadeState={arcadeState} equipment={equipment} />;
}
