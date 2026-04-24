import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SampleCategory } from '@/types/hardwareDiagnostics';

interface NewSampleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (label: string, category: SampleCategory, durationMs?: number) => void;
}

const CATEGORIES: { value: SampleCategory; label: string }[] = [
  { value: 'RASPAGEM', label: 'Raspagem (toque leve)' },
  { value: 'TOQUE', label: 'Toque (contato moderado)' },
  { value: 'PONTO', label: 'Ponto (golpe válido)' },
  { value: 'OUTRO', label: 'Outro' },
];

const DURATIONS = [
  { value: 6000, label: '6 segundos' },
  { value: 12000, label: '12 segundos' },
  { value: 20000, label: '20 segundos' },
  { value: 30000, label: '30 segundos' },
];

export function NewSampleDialog({ open, onOpenChange, onStart }: NewSampleDialogProps) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<SampleCategory>('OUTRO');
  const [duration, setDuration] = useState(12000);

  const handleStart = () => {
    if (!label.trim()) return;
    onStart(label.trim(), category, duration);
    onOpenChange(false);
    setLabel('');
    setCategory('OUTRO');
    setDuration(12000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-wt-bg-secondary border-wt-divider max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="text-white uppercase">Nova Amostra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Descrição</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Raspagem colete azul"
              className="bg-zinc-800 border-zinc-700 text-white"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as SampleCategory)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    className="text-white focus:bg-zinc-700 focus:text-white"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Duração da gravação</Label>
            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {DURATIONS.map((dur) => (
                  <SelectItem
                    key={dur.value}
                    value={String(dur.value)}
                    className="text-white focus:bg-zinc-700 focus:text-white"
                  >
                    {dur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-400">
            <p>
              Após iniciar, a gravação coletará todos os impactos durante{' '}
              <span className="text-white font-medium">{duration / 1000}s</span>.
            </p>
            <p className="mt-1 text-zinc-500">
              Realize os golpes desejados no equipamento durante esse período.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleStart}
            disabled={!label.trim()}
            className="bg-hong hover:bg-hong/90 text-white rounded-none uppercase tracking-wider text-xs font-bold"
          >
            INICIAR GRAVAÇÃO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
