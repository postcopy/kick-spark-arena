// CSV Parser — Import athletes from CSV files

import type { Athlete } from '@/types/tournament';

export interface CsvParseResult {
  athletes: Athlete[];
  errors: string[];
}

export function parseCsvAthletes(csvText: string): CsvParseResult {
  const athletes: Athlete[] = [];
  const errors: string[] = [];

  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    errors.push('Arquivo vazio');
    return { athletes, errors };
  }

  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const startIdx = (firstLine.includes('nome') || firstLine.includes('name')) ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    // Support both comma and semicolon separators
    const parts = line.includes(';')
      ? line.split(';').map(p => p.trim())
      : line.split(',').map(p => p.trim());

    const name = parts[0];
    if (!name) {
      errors.push(`Linha ${i + 1}: nome vazio`);
      continue;
    }

    const academy = parts[1] || undefined;
    const weight = parts[2] ? parseFloat(parts[2]) : undefined;

    if (parts[2] && isNaN(weight!)) {
      errors.push(`Linha ${i + 1}: peso inválido "${parts[2]}"`);
    }

    athletes.push({
      id: crypto.randomUUID(),
      name: name.toUpperCase(),
      academy,
      weight: weight && !isNaN(weight) ? weight : undefined,
    });
  }

  return { athletes, errors };
}
