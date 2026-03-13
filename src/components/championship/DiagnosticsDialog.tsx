import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Usb, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseHardwareDiagnosticsReturn, HardwareThresholds } from '@/types/hardwareDiagnostics';
import type { UseSerialPortReturn } from '@/types/serial';

const PRESETS: Record<string, { label: string; vestHitMin: number; vestPointMin: number; helmetHitMin: number; helmetPointMin: number }> = {
  infantil: { label: 'Infantil', vestHitMin: 14, vestPointMin: 18, helmetHitMin: 14, helmetPointMin: 18 },
  cadete:   { label: 'Cadete',   vestHitMin: 16, vestPointMin: 22, helmetHitMin: 16, helmetPointMin: 22 },
  juvenil:  { label: 'Juvenil',  vestHitMin: 18, vestPointMin: 25, helmetHitMin: 18, helmetPointMin: 25 },
  adulto:   { label: 'Adulto',   vestHitMin: 20, vestPointMin: 30, helmetHitMin: 20, helmetPointMin: 30 },
};

interface DiagnosticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagnostics: UseHardwareDiagnosticsReturn;
  serialPort?: UseSerialPortReturn;
  onThresholdsApplied?: (thresholds: HardwareThresholds) => void;
}

const DEVICE_NAMES: Record<number, string> = {
  1: 'Colete Azul',
  2: 'Colete Vermelho',
  3: 'Capacete Azul',
  4: 'Capacete Vermelho',
};

function classifyImpact(
  peak: number,
  deviceId: number,
  thresholds: { vestPointMin: number; vestHitMin: number; helmetPointMin: number; helmetHitMin: number }
): { label: string; color: string } {
  const isVest = deviceId <= 2;
  const pointMin = isVest ? thresholds.vestPointMin : thresholds.helmetPointMin;
  const hitMin = isVest ? thresholds.vestHitMin : thresholds.helmetHitMin;

  if (peak >= pointMin) return { label: 'PONTO', color: 'border-green-500 text-green-400 bg-green-500/20' };
  if (peak >= hitMin) return { label: 'HIT', color: 'border-yellow-500 text-yellow-400 bg-yellow-500/20' };
  return { label: 'RUÍDO', color: 'border-zinc-600 text-zinc-400 bg-zinc-700' };
}

export function DiagnosticsDialog({
  open,
  onOpenChange,
  diagnostics,
  serialPort,
  onThresholdsApplied,
}: DiagnosticsDialogProps) {
  const [vestPointMin, setVestPointMin] = useState(19);
  const [vestHitMin, setVestHitMin] = useState(15);
  const [helmetPointMin, setHelmetPointMin] = useState(10);
  const [helmetHitMin, setHelmetHitMin] = useState(5);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Sync from current thresholds when dialog opens
  useEffect(() => {
    if (open) {
      const t = diagnostics.thresholds;
      setVestPointMin(t.vestPointMin || 19);
      setVestHitMin(t.vestHitMin || 15);
      setHelmetPointMin(t.helmetPointMin || 10);
      setHelmetHitMin(t.helmetHitMin || 5);
    }
  }, [open, diagnostics.thresholds]);

  const isConnected = serialPort?.isConnected ?? false;
  const lastImpact = diagnostics.uiRecentImpacts[0];

  const currentThresholds = { vestPointMin, vestHitMin, helmetPointMin, helmetHitMin };
  const classification = lastImpact
    ? classifyImpact(lastImpact.peakIntensity, lastImpact.deviceId, currentThresholds)
    : null;

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setVestHitMin(p.vestHitMin);
    setVestPointMin(p.vestPointMin);
    setHelmetHitMin(p.helmetHitMin);
    setHelmetPointMin(p.helmetPointMin);
    setActivePreset(key);
  };

  const handleManualChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(Number(e.target.value));
    setActivePreset(null);
  };

  const handleSave = () => {
    const thresholds: HardwareThresholds = { vestHitMin, vestPointMin, helmetHitMin, helmetPointMin };
    diagnostics.setThresholds(thresholds);
    onThresholdsApplied?.(thresholds);
    toast.success("Configuração salva com sucesso!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-auto bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white uppercase">
            CALIBRAGEM DE HARDWARE
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={cn(
                'uppercase font-bold text-xs',
                isConnected
                  ? 'border-green-500 text-green-400 bg-green-500/10'
                  : 'border-zinc-600 text-zinc-400 bg-zinc-700'
              )}
            >
              {isConnected ? '● CONECTADO' : '○ DESCONECTADO'}
            </Badge>
            {serialPort && (
              <Button
                size="sm"
                onClick={isConnected ? serialPort.disconnect : serialPort.connect}
                disabled={serialPort.isConnecting}
                className={cn(
                  'font-bold uppercase text-xs',
                  isConnected
                    ? 'bg-zinc-700 hover:bg-zinc-600'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                )}
              >
                <Usb className="w-4 h-4 mr-1" />
                {serialPort.isConnecting ? 'CONECTANDO...' : isConnected ? 'DESCONECTAR' : 'CONECTAR USB'}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Section 1: Monitor de Teste */}
        <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-400 uppercase">
              MONITOR DE TESTE
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6">
            {lastImpact ? (
              <>
                <div
                  className="font-mono font-bold text-white"
                  style={{ fontSize: 'clamp(3rem, 10vw, 5rem)' }}
                >
                  {lastImpact.peakIntensity}
                </div>
                <div className="text-zinc-300 text-base mt-2 font-medium">
                  {DEVICE_NAMES[lastImpact.deviceId] || `Device ${lastImpact.deviceId}`}
                </div>
                {classification && (
                  <Badge
                    variant="outline"
                    className={cn('mt-3 text-lg px-4 py-1 font-bold', classification.color)}
                  >
                    {classification.label}
                  </Badge>
                )}
              </>
            ) : (
              <div className="text-zinc-600 text-lg py-8">
                Aguardando impacto...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Configuração de Limiares */}
        <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-400 uppercase">
              CONFIGURAÇÃO DE LIMIARES
          </CardTitle>
            <div className="flex gap-2">
              {Object.entries(PRESETS).map(([key, p]) => (
                <Button
                  key={key}
                  size="sm"
                  variant="outline"
                  onClick={() => applyPreset(key)}
                  className={cn(
                    'flex-1 text-xs font-bold uppercase',
                    activePreset === key
                      ? 'bg-[hsl(var(--sulsport-blue))] border-[hsl(var(--sulsport-blue))] text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Colete — Mín. PONTO</Label>
                <Input
                  type="number"
                  min={0}
                  value={vestPointMin}
                  onChange={handleManualChange(setVestPointMin)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Colete — Mín. HIT</Label>
                <Input
                  type="number"
                  min={0}
                  value={vestHitMin}
                  onChange={handleManualChange(setVestHitMin)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Capacete — Mín. PONTO</Label>
                <Input
                  type="number"
                  min={0}
                  value={helmetPointMin}
                  onChange={handleManualChange(setHelmetPointMin)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Capacete — Mín. HIT</Label>
                <Input
                  type="number"
                  min={0}
                  value={helmetHitMin}
                  onChange={handleManualChange(setHelmetHitMin)}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-center"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue))]/80 text-white font-bold uppercase"
            >
              <Save className="w-4 h-4 mr-2" />
              SALVAR CONFIGURAÇÃO
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
