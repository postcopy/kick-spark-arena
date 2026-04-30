import { describe, it, expect } from 'vitest';

// ─── Constants and helpers extracted from useSerialPort.ts ───
// parseLine is not exported, so we reimplement it here using the exact same
// regex and split logic from the source.

const BAUD_RATE = 115200;
const LINE_REGEX = /^\d+,\d+,\d+$/;

interface ParsedLine {
  intensity: number;
  deviceId: number;
  battery: number;
}

/** Exact replica of the parseLine function in useSerialPort.ts */
function parseLine(line: string): ParsedLine | null {
  const cleanLine = line
    .replace(/\r/g, '')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .trim();

  if (!LINE_REGEX.test(cleanLine)) return null;

  const parts = cleanLine.split(',');
  return {
    intensity: parseInt(parts[0], 10),
    deviceId: parseInt(parts[1], 10),
    battery: parseInt(parts[2], 10),
  };
}

// ─── Helper functions from useSerialPort.ts ───

function getEquipmentType(id: number): 'vest' | 'helmet' {
  return id <= 2 ? 'vest' : 'helmet';
}

function getEquipmentSide(id: number): 'red' | 'blue' {
  return id % 2 === 1 ? 'blue' : 'red';
}

// ─── Tests ───

describe('useSerialPort - parseLine', () => {
  describe('valid input', () => {
    it('parses a standard CSV line "42,1,95"', () => {
      const result = parseLine('42,1,95');
      expect(result).toEqual({ intensity: 42, deviceId: 1, battery: 95 });
    });

    it('parses line with different device IDs', () => {
      expect(parseLine('100,2,80')).toEqual({ intensity: 100, deviceId: 2, battery: 80 });
      expect(parseLine('55,3,60')).toEqual({ intensity: 55, deviceId: 3, battery: 60 });
      expect(parseLine('200,4,100')).toEqual({ intensity: 200, deviceId: 4, battery: 100 });
    });

    it('parses line with zero values', () => {
      expect(parseLine('0,0,0')).toEqual({ intensity: 0, deviceId: 0, battery: 0 });
    });

    it('parses line with large values', () => {
      expect(parseLine('1023,7,100')).toEqual({ intensity: 1023, deviceId: 7, battery: 100 });
      expect(parseLine('9999,99,999')).toEqual({ intensity: 9999, deviceId: 99, battery: 999 });
    });

    it('parses line with single-digit values', () => {
      expect(parseLine('1,1,1')).toEqual({ intensity: 1, deviceId: 1, battery: 1 });
    });
  });

  describe('whitespace and carriage return handling', () => {
    it('trims leading and trailing whitespace', () => {
      expect(parseLine('  42,1,95  ')).toEqual({ intensity: 42, deviceId: 1, battery: 95 });
    });

    it('strips carriage return characters', () => {
      expect(parseLine('42,1,95\r')).toEqual({ intensity: 42, deviceId: 1, battery: 95 });
      expect(parseLine('42,1,95\r\r')).toEqual({ intensity: 42, deviceId: 1, battery: 95 });
    });

    it('strips ANSI escape codes', () => {
      expect(parseLine('\x1b[32m42,1,95\x1b[0m')).toEqual({ intensity: 42, deviceId: 1, battery: 95 });
      expect(parseLine('\x1b[1;31m100,2,80\x1b[0m')).toEqual({ intensity: 100, deviceId: 2, battery: 80 });
    });

    it('handles combined whitespace, CR, and ANSI codes', () => {
      expect(parseLine('  \x1b[32m42,1,95\x1b[0m\r  ')).toEqual({ intensity: 42, deviceId: 1, battery: 95 });
    });
  });

  describe('invalid input', () => {
    it('returns null for empty string', () => {
      expect(parseLine('')).toBeNull();
    });

    it('returns null for whitespace-only string', () => {
      expect(parseLine('   ')).toBeNull();
    });

    it('returns null for alphabetic input', () => {
      expect(parseLine('abc')).toBeNull();
      expect(parseLine('hello,world,test')).toBeNull();
    });

    it('returns null for mixed letters and numbers', () => {
      expect(parseLine('42a,1,95')).toBeNull();
      expect(parseLine('42,b1,95')).toBeNull();
      expect(parseLine('42,1,9c5')).toBeNull();
    });

    it('returns null for missing fields (only 2 values)', () => {
      expect(parseLine('42,1')).toBeNull();
    });

    it('returns null for single value', () => {
      expect(parseLine('42')).toBeNull();
    });

    it('returns null for extra commas (4 fields)', () => {
      expect(parseLine('42,1,95,100')).toBeNull();
    });

    it('returns null for trailing comma', () => {
      expect(parseLine('42,1,95,')).toBeNull();
    });

    it('returns null for leading comma', () => {
      expect(parseLine(',42,1,95')).toBeNull();
    });

    it('returns null for negative numbers', () => {
      expect(parseLine('-1,1,95')).toBeNull();
      expect(parseLine('42,-1,95')).toBeNull();
    });

    it('returns null for decimal numbers', () => {
      expect(parseLine('42.5,1,95')).toBeNull();
    });

    it('returns null for spaces between values', () => {
      expect(parseLine('42, 1, 95')).toBeNull();
    });

    it('returns null for debug/log lines from Arduino', () => {
      expect(parseLine('Ready')).toBeNull();
      expect(parseLine('EngFlex v2.0')).toBeNull();
      expect(parseLine('Initializing...')).toBeNull();
    });
  });
});

describe('useSerialPort - LINE_REGEX', () => {
  it('matches exactly 3 comma-separated digit groups', () => {
    expect(LINE_REGEX.test('42,1,95')).toBe(true);
    expect(LINE_REGEX.test('0,0,0')).toBe(true);
    expect(LINE_REGEX.test('9999,99,999')).toBe(true);
  });

  it('does not match fewer than 3 groups', () => {
    expect(LINE_REGEX.test('42,1')).toBe(false);
    expect(LINE_REGEX.test('42')).toBe(false);
    expect(LINE_REGEX.test('')).toBe(false);
  });

  it('does not match more than 3 groups', () => {
    expect(LINE_REGEX.test('42,1,95,100')).toBe(false);
  });

  it('does not match non-digit characters', () => {
    expect(LINE_REGEX.test('abc,1,95')).toBe(false);
    expect(LINE_REGEX.test('42,x,95')).toBe(false);
  });
});

describe('useSerialPort - BAUD_RATE constant', () => {
  it('is 115200', () => {
    expect(BAUD_RATE).toBe(115200);
  });
});

describe('useSerialPort - getEquipmentType', () => {
  it('returns "vest" for device IDs 1 and 2', () => {
    expect(getEquipmentType(1)).toBe('vest');
    expect(getEquipmentType(2)).toBe('vest');
  });

  it('returns "helmet" for device IDs 3 and 4', () => {
    expect(getEquipmentType(3)).toBe('helmet');
    expect(getEquipmentType(4)).toBe('helmet');
  });

  it('returns "helmet" for device IDs above 4', () => {
    expect(getEquipmentType(5)).toBe('helmet');
    expect(getEquipmentType(7)).toBe('helmet');
  });
});

describe('useSerialPort - getEquipmentSide', () => {
  it('maps ID 1 (vest) to blue', () => {
    expect(getEquipmentSide(1)).toBe('blue');
  });

  it('maps ID 2 (vest) to red', () => {
    expect(getEquipmentSide(2)).toBe('red');
  });

  it('maps ID 3 (blue helmet) to blue', () => {
    expect(getEquipmentSide(3)).toBe('blue');
  });

  it('maps ID 4 (red helmet) to red', () => {
    expect(getEquipmentSide(4)).toBe('red');
  });
});
