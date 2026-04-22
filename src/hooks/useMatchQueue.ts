// Fila de lutas persistida em localStorage por matId.
// Usada no modo BÁSICO (Quick) pra operador planejar próximas lutas do dia.
// Modo PRO ignora — lista de lutas vem do tournament bracket.

import { useCallback, useEffect, useState } from 'react';

export interface QueueEntry {
  id: string;            // match number, ex: "002"
  blueName: string;
  blueCountry?: string;
  redName: string;
  redCountry?: string;
  category?: string;
  time?: string;         // free text, ex: "14:30"
}

const storageKey = (matId: number) => `sulsport:championship:queue:mat-${matId}`;

function readFromStorage(matId: number): QueueEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(matId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as QueueEntry[];
  } catch {
    return [];
  }
}

export function useMatchQueue(matId: number) {
  const [queue, setQueue] = useState<QueueEntry[]>(() => readFromStorage(matId));

  // Sync across tabs / windows (TV + operator on same device)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(matId)) setQueue(readFromStorage(matId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [matId]);

  const persist = useCallback(
    (next: QueueEntry[]) => {
      localStorage.setItem(storageKey(matId), JSON.stringify(next));
      setQueue(next);
    },
    [matId],
  );

  const add = useCallback(
    (entry: Omit<QueueEntry, 'id'>) => {
      const next = [
        ...queue,
        { ...entry, id: String(queue.length + 1).padStart(3, '0') },
      ];
      persist(next);
    },
    [queue, persist],
  );

  const remove = useCallback(
    (id: string) => persist(queue.filter((e) => e.id !== id)),
    [queue, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const shift = useCallback(() => {
    if (!queue.length) return undefined;
    const [head, ...rest] = queue;
    persist(rest);
    return head;
  }, [queue, persist]);

  return { queue, add, remove, clear, shift };
}
