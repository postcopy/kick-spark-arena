// Device ID mapping utilities for EngFlex hardware
// Shared between useSerialPort and ChampionshipMat

import type { Side, HitType } from '@/types/game';
import type { MatchSide } from '@/types/championship';

/**
 * Maps the hit equipment's deviceId to the KICKING side (who scored).
 * Per EngFlex spec (validated on hardware):
 *   ID 1 = blue vest, ID 2 = red vest, ID 3 = blue helmet, ID 4 = red helmet
 * The kicker is the OPPOSITE of who got hit:
 *   ID 1 or ID 3 (blue equipment hit) → Red kicked
 *   ID 2 or ID 4 (red equipment hit) → Blue kicked
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
 * ID 1 (blue vest hit)   → RED scores
 * ID 2 (red vest hit)    → BLUE scores
 * ID 3 (blue helmet hit) → RED scores
 * ID 4 (red helmet hit)  → BLUE scores
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

/**
 * Checks if deviceId belongs to a judge device (IDs 5-7).
 * Per EngFlex protocol: 5 = Juiz 1, 6 = Juiz 2, 7 = Juiz 3
 */
export function isJudgeDevice(deviceId: number): boolean {
  return deviceId >= 5 && deviceId <= 7;
}

/**
 * Maps judge deviceId to judge number (1-3).
 * Returns null if not a judge device.
 */
export function judgeNumber(deviceId: number): number | null {
  if (deviceId >= 5 && deviceId <= 7) return deviceId - 4;
  return null;
}
