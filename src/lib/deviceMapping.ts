// Device ID mapping utilities for EngFlex hardware
// Shared between useSerialPort and ChampionshipMat

import type { Side, HitType } from '@/types/game';
import type { MatchSide } from '@/types/championship';

/**
 * Maps the hit equipment's deviceId to the KICKING side (who scored).
 * ID 1 (blue vest) or ID 4 (red helmet) → Red kicked
 * ID 2 (red vest) or ID 3 (blue helmet) → Blue kicked
 * Note: Helmets have inverted IDs vs vests in EngFlex hardware
 *   ID 3 = helmet worn by RED athlete (red helmet)
 *   ID 4 = helmet worn by BLUE athlete (blue helmet)
 */
export function deviceIdToKickingSide(deviceId: number): Side | null {
  if (deviceId === 1 || deviceId === 4) return 'red';
  if (deviceId === 2 || deviceId === 3) return 'blue';
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
 * Vests: ID 1 (blue vest hit) → RED scores, ID 2 (red vest hit) → BLUE scores
 * Helmets (inverted in hardware): ID 3 (red helmet) → BLUE scores, ID 4 (blue helmet) → RED scores
 */
export function deviceIdToMatchSide(deviceId: number): MatchSide | null {
  if (deviceId === 1 || deviceId === 4) return 'RED';
  if (deviceId === 2 || deviceId === 3) return 'BLUE';
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
