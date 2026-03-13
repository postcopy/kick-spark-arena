// Device ID mapping utilities for EngFlex hardware
// Shared between useSerialPort and ChampionshipMat

import type { Side, HitType } from '@/types/game';
import type { MatchSide } from '@/types/championship';

/**
 * Maps the hit equipment's deviceId to the KICKING side (who scored).
 * ID 1 (blue vest) or ID 3 (blue helmet) → Red kicked
 * ID 2 (red vest) or ID 4 (red helmet) → Blue kicked
 */
export function deviceIdToKickingSide(deviceId: number): Side | null {
  if (deviceId === 1 || deviceId === 3) return 'red';
  if (deviceId === 2 || deviceId === 4) return 'blue';
  return null;
}

/**
 * Maps deviceId to the equipment type that was hit.
 * IDs 1-2 = vests, IDs 3-4 = helmets
 */
export function deviceIdToHitType(deviceId: number): HitType {
  return deviceId <= 2 ? 'vest' : 'helmet';
}

/**
 * Maps deviceId to the championship MatchSide (who scores).
 */
export function deviceIdToMatchSide(deviceId: number): MatchSide | null {
  if (deviceId === 1 || deviceId === 3) return 'RED';
  if (deviceId === 2 || deviceId === 4) return 'BLUE';
  return null;
}

/**
 * Maps deviceId to equipment type string for championship context.
 */
export function deviceIdToEquipmentType(deviceId: number): 'vest' | 'helmet' {
  return deviceId <= 2 ? 'vest' : 'helmet';
}
