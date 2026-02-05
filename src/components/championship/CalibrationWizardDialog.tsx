import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalibrationWizardState, HardwareThresholds, ImpactEvent } from '@/types/hardwareDiagnostics';

interface CalibrationWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wizard: CalibrationWizardState;
  onAdvance: () => void;
  onCancel: () => void;
  onApply: () => void;
  currentImpactCount: number;
  lastImpact: ImpactEvent | null;
}

const STEP_INSTRUCTIONS = {
  raspagem: {
    title: 'RASPAGEM',
    stepNumber: 1,
    instruction: 'Encoste levemente no equipamento várias vezes, sem força',
    description: 'Simule toques acidentais e raspagens no sensor',
  },
  toque: {
    title: 'TOQUE',
    stepNumber: 2,
    instruction: 'Dê toques moderados no equipamento',
    description: 'Chutes que devem ser registrados como HIT, mas não como ponto',
  },
  ponto: {
    title: 'PONTO',
    stepNumber: 3,
    instruction: 'Dê chutes com força total para pontuar',
    description: 'Golpes que devem ser registrados como PONTO válido',
  },
};

export function CalibrationWizardDialog({
  open,
  onOpenChange,
  wizard,
  onAdvance,
  onCancel,
  onApply,
  currentImpactCount,
  lastImpact,
}: CalibrationWizardDialogProps) {
  const [timeProgress, setTimeProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Timer for step progress
  useEffect(() => {
    if (!wizard.stepStartedAt || wizard.step === 'idle' || wizard.step === 'result') {
      setTimeProgress(0);
      setTimeRemaining(0);
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - wizard.stepStartedAt!;
      const progress = Math.min(100, (elapsed / wizard.stepDurationMs) * 100);
      const remaining = Math.max(0, Math.ceil((wizard.stepDurationMs - elapsed) / 1000));
      
      setTimeProgress(progress);
      setTimeRemaining(remaining);
    }, 100);
    
    return () => clearInterval(interval);
  }, [wizard.stepStartedAt, wizard.stepDurationMs, wizard.step]);
  
  const isActiveStep = wizard.step !== 'idle' && wizard.step !== 'result';
  const stepInfo = isActiveStep ? STEP_INSTRUCTIONS[wizard.step as 'raspagem' | 'toque' | 'ponto'] : null;
  
  // Calculate if there's overlap between categories (warning)
  const hasOverlap = wizard.step === 'result' && 
    wizard.toque.stats && wizard.ponto.stats &&
    wizard.toque.stats.p95 >= wizard.ponto.stats.p95;
  
  const hasLowData = wizard.step === 'result' && (
    (wizard.raspagem.stats?.count ?? 0) < 3 ||
    (wizard.toque.stats?.count ?? 0) < 3 ||
    (wizard.ponto.stats?.count ?? 0) < 3
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white uppercase flex items-center gap-2">
            <Zap className="w-5 h-5 text-[hsl(var(--sulsport-yellow))]" />
            WIZARD DE CALIBRAÇÃO
          </DialogTitle>
        </DialogHeader>
        
        {/* Active Step View */}
        {isActiveStep && stepInfo && (
          <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    num < stepInfo.stepNumber && 'bg-[hsl(var(--sulsport-green))] text-white',
                    num === stepInfo.stepNumber && 'bg-[hsl(var(--sulsport-blue))] text-white',
                    num > stepInfo.stepNumber && 'bg-zinc-700 text-zinc-400'
                  )}
                >
                  {num < stepInfo.stepNumber ? <Check className="w-4 h-4" /> : num}
                </div>
              ))}
            </div>
            
            {/* Title */}
            <div className="text-center">
              <Badge className="bg-[hsl(var(--sulsport-blue))] text-white text-lg px-4 py-1">
                ETAPA {stepInfo.stepNumber}/3: {stepInfo.title}
              </Badge>
            </div>
            
            {/* Instructions */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
              <CardContent className="p-4 text-center">
                <p className="text-white text-lg font-semibold mb-1">
                  {stepInfo.instruction}
                </p>
                <p className="text-zinc-400 text-sm">
                  {stepInfo.description}
                </p>
              </CardContent>
            </Card>
            
            {/* Timer Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Tempo restante</span>
                <span className="text-white font-mono font-bold">{timeRemaining}s</span>
              </div>
              <Progress value={timeProgress} className="h-3" />
            </div>
            
            {/* Impact Counter */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Impactos coletados</p>
                  <p className="text-white text-3xl font-bold font-mono">{currentImpactCount}</p>
                </div>
                {lastImpact && (
                  <div className="text-right">
                    <p className="text-zinc-400 text-sm">Último peak</p>
                    <p className="text-[hsl(var(--sulsport-yellow))] text-2xl font-bold font-mono">
                      {lastImpact.peakIntensity}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                CANCELAR
              </Button>
              <Button
                onClick={onAdvance}
                className="flex-1 bg-[hsl(var(--sulsport-green))] hover:bg-[hsl(var(--sulsport-green-light))] text-white font-bold"
              >
                PRÓXIMO →
              </Button>
            </div>
          </div>
        )}
        
        {/* Result View */}
        {wizard.step === 'result' && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge className="bg-[hsl(var(--sulsport-green))] text-white text-lg px-4 py-1">
                ANÁLISE COMPLETA
              </Badge>
            </div>
            
            {/* Warnings */}
            {hasOverlap && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <strong>Atenção:</strong> O P95 de TOQUE é maior ou igual ao P95 de PONTO. 
                  Os dados podem estar incorretos. Considere refazer a calibração.
                </div>
              </div>
            )}
            
            {hasLowData && (
              <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-200">
                  <strong>Dados insuficientes:</strong> Alguma etapa coletou menos de 3 impactos. 
                  Os thresholds sugeridos podem não ser precisos.
                </div>
              </div>
            )}
            
            {/* Stats Summary */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[hsl(var(--sulsport-gray))]">
                      <TableHead className="text-zinc-500 text-xs">CATEGORIA</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">QTD</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">P95</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">MÁX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-[hsl(var(--sulsport-gray))]">
                      <TableCell className="text-zinc-300 py-2">RASPAGEM</TableCell>
                      <TableCell className="text-white text-right font-mono py-2">
                        {wizard.raspagem.stats?.count ?? 0}
                      </TableCell>
                      <TableCell className="text-white text-right font-mono font-bold py-2">
                        {wizard.raspagem.stats?.p95 ?? '-'}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-right font-mono py-2">
                        {wizard.raspagem.stats?.max ?? '-'}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-[hsl(var(--sulsport-gray))]">
                      <TableCell className="text-zinc-300 py-2">TOQUE</TableCell>
                      <TableCell className="text-white text-right font-mono py-2">
                        {wizard.toque.stats?.count ?? 0}
                      </TableCell>
                      <TableCell className="text-white text-right font-mono font-bold py-2">
                        {wizard.toque.stats?.p95 ?? '-'}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-right font-mono py-2">
                        {wizard.toque.stats?.max ?? '-'}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-[hsl(var(--sulsport-gray))]">
                      <TableCell className="text-zinc-300 py-2">PONTO</TableCell>
                      <TableCell className="text-white text-right font-mono py-2">
                        {wizard.ponto.stats?.count ?? 0}
                      </TableCell>
                      <TableCell className="text-white text-right font-mono font-bold py-2">
                        {wizard.ponto.stats?.p95 ?? '-'}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-right font-mono py-2">
                        {wizard.ponto.stats?.max ?? '-'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Suggested Thresholds */}
            {wizard.suggestedThresholds && (
              <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-blue))]">
                <CardContent className="p-4">
                  <h4 className="text-sm font-bold text-[hsl(var(--sulsport-blue))] uppercase mb-3">
                    Thresholds Sugeridos
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[hsl(var(--sulsport-gray))]">
                        <TableHead className="text-zinc-500 text-xs">TIPO</TableHead>
                        <TableHead className="text-zinc-500 text-xs text-right">HIT mín</TableHead>
                        <TableHead className="text-zinc-500 text-xs text-right">PONTO mín</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-[hsl(var(--sulsport-gray))]">
                        <TableCell className="text-zinc-300 py-2">Colete</TableCell>
                        <TableCell className="text-[hsl(var(--sulsport-yellow))] text-right font-mono font-bold py-2">
                          {wizard.suggestedThresholds.vestHitMin}
                        </TableCell>
                        <TableCell className="text-[hsl(var(--sulsport-green))] text-right font-mono font-bold py-2">
                          {wizard.suggestedThresholds.vestPointMin}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-[hsl(var(--sulsport-gray))]">
                        <TableCell className="text-zinc-300 py-2">Capacete</TableCell>
                        <TableCell className="text-[hsl(var(--sulsport-yellow))] text-right font-mono font-bold py-2">
                          {wizard.suggestedThresholds.helmetHitMin}
                        </TableCell>
                        <TableCell className="text-[hsl(var(--sulsport-green))] text-right font-mono font-bold py-2">
                          {wizard.suggestedThresholds.helmetPointMin}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                DESCARTAR
              </Button>
              <Button
                onClick={onApply}
                disabled={!wizard.suggestedThresholds}
                className="flex-1 bg-[hsl(var(--sulsport-green))] hover:bg-[hsl(var(--sulsport-green-light))] text-white font-bold"
              >
                <Check className="w-4 h-4 mr-1" />
                APLICAR THRESHOLDS
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
