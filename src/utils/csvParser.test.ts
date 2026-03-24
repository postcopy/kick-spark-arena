import { describe, it, expect, vi } from 'vitest';
import { parseCsvAthletes } from './csvParser';

// Mock crypto.randomUUID since it may not be available in test environment
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 9),
});

describe('parseCsvAthletes', () => {
  describe('valid CSV with semicolons', () => {
    it('should parse athletes separated by semicolons', () => {
      const csv = 'João Silva;Academia A;72.5\nMaria Santos;Academia B;65.0';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.athletes[0].name).toBe('JOÃO SILVA');
      expect(result.athletes[0].academy).toBe('Academia A');
      expect(result.athletes[0].weight).toBe(72.5);
      expect(result.athletes[1].name).toBe('MARIA SANTOS');
    });
  });

  describe('valid CSV with commas', () => {
    it('should parse athletes separated by commas', () => {
      const csv = 'João Silva,Academia A,72.5';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(1);
      expect(result.athletes[0].name).toBe('JOÃO SILVA');
      expect(result.athletes[0].academy).toBe('Academia A');
      expect(result.athletes[0].weight).toBe(72.5);
    });
  });

  describe('header detection', () => {
    it('should skip header containing "nome"', () => {
      const csv = 'Nome;Academia;Peso\nJoão;Equipe A;70';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(1);
      expect(result.athletes[0].name).toBe('JOÃO');
    });

    it('should skip header containing "name"', () => {
      const csv = 'Name,Academy,Weight\nJohn,Team A,70';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(1);
      expect(result.athletes[0].name).toBe('JOHN');
    });

    it('should not skip first line if no header keywords found', () => {
      const csv = 'João;Equipe A;70\nMaria;Equipe B;65';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(2);
    });
  });

  describe('weight parsing', () => {
    it('should parse decimal weights', () => {
      const csv = 'Athlete;Team;68.5';
      const result = parseCsvAthletes(csv);
      expect(result.athletes[0].weight).toBe(68.5);
    });

    it('should handle missing weight', () => {
      const csv = 'Athlete;Team';
      const result = parseCsvAthletes(csv);
      expect(result.athletes[0].weight).toBeUndefined();
    });

    it('should report error for invalid weight but still add athlete', () => {
      const csv = 'Athlete;Team;abc';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(1);
      expect(result.athletes[0].weight).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('peso inválido');
    });
  });

  describe('empty input', () => {
    it('should return error for empty string', () => {
      const result = parseCsvAthletes('');
      expect(result.athletes).toHaveLength(0);
      expect(result.errors).toContain('Arquivo vazio');
    });

    it('should return error for whitespace-only input', () => {
      const result = parseCsvAthletes('   \n  \n  ');
      expect(result.athletes).toHaveLength(0);
      expect(result.errors).toContain('Arquivo vazio');
    });
  });

  describe('malformed rows', () => {
    it('should report error for rows with empty name', () => {
      const csv = ';Academia;70';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('nome vazio');
    });

    it('should handle missing academy gracefully', () => {
      const csv = 'Athlete';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(1);
      expect(result.athletes[0].academy).toBeUndefined();
    });

    it('should handle Windows line endings (CRLF)', () => {
      const csv = 'João;Team A;70\r\nMaria;Team B;65';
      const result = parseCsvAthletes(csv);
      expect(result.athletes).toHaveLength(2);
    });
  });

  describe('name uppercasing', () => {
    it('should uppercase athlete names', () => {
      const csv = 'joão silva;team;70';
      const result = parseCsvAthletes(csv);
      expect(result.athletes[0].name).toBe('JOÃO SILVA');
    });
  });

  describe('athlete id generation', () => {
    it('should assign an id to each athlete', () => {
      const csv = 'Athlete A;Team;70';
      const result = parseCsvAthletes(csv);
      expect(result.athletes[0].id).toBeDefined();
      expect(typeof result.athletes[0].id).toBe('string');
    });
  });
});
