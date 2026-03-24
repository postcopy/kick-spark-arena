import { describe, it, expect } from 'vitest';
import {
  deviceIdToKickingSide,
  deviceIdToHitType,
  deviceIdToMatchSide,
  deviceIdToEquipmentType,
  isJudgeDevice,
  judgeNumber,
} from './deviceMapping';

describe('deviceMapping', () => {
  describe('deviceIdToKickingSide', () => {
    it('device 1 (blue vest hit) means red kicked', () => {
      expect(deviceIdToKickingSide(1)).toBe('red');
    });

    it('device 2 (red vest hit) means blue kicked', () => {
      expect(deviceIdToKickingSide(2)).toBe('blue');
    });

    it('device 3 (red helmet) means blue kicked', () => {
      expect(deviceIdToKickingSide(3)).toBe('blue');
    });

    it('device 4 (blue helmet) means red kicked', () => {
      expect(deviceIdToKickingSide(4)).toBe('red');
    });

    it('unknown device returns null', () => {
      expect(deviceIdToKickingSide(0)).toBeNull();
      expect(deviceIdToKickingSide(5)).toBeNull();
      expect(deviceIdToKickingSide(99)).toBeNull();
    });
  });

  describe('deviceIdToHitType', () => {
    it('devices 1-2 are vests', () => {
      expect(deviceIdToHitType(1)).toBe('vest');
      expect(deviceIdToHitType(2)).toBe('vest');
    });

    it('devices 3-4 are helmets', () => {
      expect(deviceIdToHitType(3)).toBe('helmet');
      expect(deviceIdToHitType(4)).toBe('helmet');
    });
  });

  describe('deviceIdToMatchSide', () => {
    it('device 1 (blue vest) -> RED scores', () => {
      expect(deviceIdToMatchSide(1)).toBe('RED');
    });

    it('device 2 (red vest) -> BLUE scores', () => {
      expect(deviceIdToMatchSide(2)).toBe('BLUE');
    });

    it('device 3 (red helmet) -> BLUE scores', () => {
      expect(deviceIdToMatchSide(3)).toBe('BLUE');
    });

    it('device 4 (blue helmet) -> RED scores', () => {
      expect(deviceIdToMatchSide(4)).toBe('RED');
    });

    it('unknown device returns null', () => {
      expect(deviceIdToMatchSide(0)).toBeNull();
      expect(deviceIdToMatchSide(8)).toBeNull();
    });
  });

  describe('deviceIdToEquipmentType', () => {
    it('devices 1-2 are vests', () => {
      expect(deviceIdToEquipmentType(1)).toBe('vest');
      expect(deviceIdToEquipmentType(2)).toBe('vest');
    });

    it('devices 3+ are helmets', () => {
      expect(deviceIdToEquipmentType(3)).toBe('helmet');
      expect(deviceIdToEquipmentType(4)).toBe('helmet');
    });
  });

  describe('isJudgeDevice', () => {
    it('devices 5-7 are judge devices', () => {
      expect(isJudgeDevice(5)).toBe(true);
      expect(isJudgeDevice(6)).toBe(true);
      expect(isJudgeDevice(7)).toBe(true);
    });

    it('devices outside 5-7 are not judge devices', () => {
      expect(isJudgeDevice(1)).toBe(false);
      expect(isJudgeDevice(4)).toBe(false);
      expect(isJudgeDevice(8)).toBe(false);
    });
  });

  describe('judgeNumber', () => {
    it('device 5 -> judge 1', () => {
      expect(judgeNumber(5)).toBe(1);
    });

    it('device 6 -> judge 2', () => {
      expect(judgeNumber(6)).toBe(2);
    });

    it('device 7 -> judge 3', () => {
      expect(judgeNumber(7)).toBe(3);
    });

    it('non-judge device returns null', () => {
      expect(judgeNumber(1)).toBeNull();
      expect(judgeNumber(8)).toBeNull();
    });
  });
});
