import { useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import {
  Trash2,
  FileJson,
  FileSpreadsheet,
  Usb,
  Plus,
  AlertTriangle,
  Zap,
  Radio,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseHardwareDiagnosticsReturn } from '@/types/hardwareDiagnostics';
import type { UseSerialPortReturn } from '@/types/serial';
import { NewSampleDialog } from './NewSampleDialog';

interface DiagnosticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagnostics: UseHardwareDiagnosticsReturn;
  serialPort?: UseSerialPortReturn;
  onThresholdsApplied?: (thresholds: import('@/types/hardwareDiagnostics').HardwareThresholds) => void;
}

export function DiagnosticsDialog({
  open,
  onOpenChange,
  diagnostics,
  serialPort,
  onThresholdsApplied,
}: DiagnosticsDialogProps) {
  const [showNewSample, setShowNewSample] = useState(false);
  const [vestPointSens, setVestPointSens] = useState(35);
  const [helmetPointSens, setHelmetPointSens] = useState(35);
  const [activePreset, setActivePreset] = useState<'low' | 'mid' | 'high' | null>('mid');

  const SENSITIVITY_PRESETS = {
    low:  { point: 15, label: 'BAIXA' },
    mid:  { point: 35, label: 'MÉDIA' },
    high: { point: 60, label: 'ALTA' },
  } as const;

  const applyPreset = (key: 'low' | 'mid' | 'high') => {
    const p = SENSITIVITY_PRESETS[key];
    setVestPointSens(p.point);
    setHelmetPointSens(p.point);
    setActivePreset(key);
  };
  const isConnected = serialPort?.isConnected ?? false;

  // Sensitivity mapping helpers
  const floorValues = Object.values(diagnostics.noiseFloor);
  const hasNoiseFloor = floorValues.length > 0;
  const avgFloor = hasNoiseFloor ? Math.round(floorValues.reduce((a, b) => a + b, 0) / floorValues.length) : 0;
  const maxScale = diagnostics.observedScale.globalMax;
  const rangeAboveFloor = Math.max(1, maxScale - avgFloor);
  const canApply = maxScale > 0;

  // Legacy: threshold is absolute against globalMax (not relative to floor)
  const sensToThreshold = (sens: number) => {
    if (maxScale <= 0) return 0;
    return Math.round((1 - sens / 100) * maxScale);
  };

  const handleVestPointSens = (val: number) => {
    setVestPointSens(val);
    setActivePreset(null);
  };
  const handleHelmetPointSens = (val: number) => {
    setHelmetPointSens(val);
    setActivePreset(null);
  };

  const handleApplyThresholds = () => {
    const vestPointMin = sensToThreshold(vestPointSens);
    const helmetPointMin = sensToThreshold(helmetPointSens);

    // hitMin=0: no lower threshold — ImpactDetector already filters noise
    const thresholds = { vestHitMin: 0, vestPointMin, helmetHitMin: 0, helmetPointMin };

    console.log(
      `[APPLY] globalMax=${maxScale} (legacy: hitMin=0, only pointMin matters)\n` +
      `  vestPoint: sens=${vestPointSens} -> threshold=${vestPointMin}\n` +
      `  helmetPoint: sens=${helmetPointSens} -> threshold=${helmetPointMin}`
    );

    diagnostics.setThresholds(thresholds);
    onThresholdsApplied?.(thresholds);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 1000) return 'agora';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s atrás`;
    return `${Math.floor(diff / 60000)}m atrás`;
  };

  const isImpactMode = diagnostics.viewMode === 'impacts';
  const lastImpact = diagnostics.uiRecentImpacts[0];
  const statsToShow = isImpactMode 
    ? diagnostics.uiImpactStatsByDevice 
    : diagnostics.uiStatsByDevice;
  
  const { observedScale } = diagnostics;
  const hasObservedData = observedScale.globalMax > 0 && observedScale.globalMin !== Infinity;
  const isLowScale = hasObservedData && observedScale.globalMax <= 100;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[96vw] max-h-[92vh] overflow-auto p-0 bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          {/* Header */}
          <div className="sticky top-0 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] p-4 z-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <DialogHeader className="p-0 space-y-0">
                  <DialogTitle className="text-lg font-bold text-white uppercase">
                    DIAGNÓSTICO DE HARDWARE
                  </DialogTitle>
                </DialogHeader>
                <Badge
                  variant="outline"
                  className={cn(
                    'uppercase font-bold',
                    isConnected
                      ? 'border-green-500 text-green-400 bg-green-500/10'
                      : 'border-zinc-600 text-zinc-400 bg-zinc-700'
                  )}
                >
                  {isConnected ? '● CONECTADO' : '○ DESCONECTADO'}
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Toggle RAW / IMPACTOS */}
                <ToggleGroup 
                  type="single" 
                  value={diagnostics.viewMode} 
                  onValueChange={(v) => v && diagnostics.setViewMode(v as 'impacts' | 'raw')}
                  className="bg-zinc-800 rounded-md"
                >
                  <ToggleGroupItem 
                    value="impacts" 
                    className="text-xs px-3 data-[state=on]:bg-[hsl(var(--sulsport-blue))] data-[state=on]:text-white"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    IMPACTOS ({diagnostics.impactCount})
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="raw" 
                    className="text-xs px-3 data-[state=on]:bg-zinc-600 data-[state=on]:text-white"
                  >
                    <Radio className="w-3 h-3 mr-1" />
                    RAW ({diagnostics.eventCount})
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isImpactMode ? diagnostics.clearImpacts : diagnostics.clearEvents}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  LIMPAR {isImpactMode ? 'IMPACTOS' : 'EVENTOS'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={diagnostics.clearAll}
                  className="border-[hsl(var(--sulsport-red))]/50 text-[hsl(var(--sulsport-red-light))] hover:bg-[hsl(var(--sulsport-red))]/20"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  LIMPAR TUDO
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={diagnostics.exportJSON}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  <FileJson className="w-4 h-4 mr-1" />
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={diagnostics.exportCSV}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                {serialPort && (
                  <Button
                    size="sm"
                    onClick={isConnected ? serialPort.disconnect : serialPort.connect}
                    disabled={serialPort.isConnecting}
                    className={cn(
                      'font-bold uppercase',
                      isConnected
                        ? 'bg-zinc-700 hover:bg-zinc-600'
                        : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                    )}
                  >
                    <Usb className="w-4 h-4 mr-1" />
                    {serialPort.isConnecting
                      ? 'CONECTANDO...'
                      : isConnected
                      ? 'DESCONECTAR'
                      : 'CONECTAR USB'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-4 grid gap-4 lg:grid-cols-2 grid-cols-1">
            {/* Último Impacto / Pacote */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-zinc-400 uppercase">
                  {isImpactMode ? 'ÚLTIMO IMPACTO' : 'ÚLTIMO PACOTE'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-4">
                <div
                  className="font-mono font-bold text-white"
                  style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}
                >
                  {isImpactMode 
                    ? (lastImpact?.peakIntensity ?? '---')
                    : (diagnostics.uiLastPacket?.intensity ?? '---')
                  }
                </div>
                <div className="text-zinc-400 text-sm mt-1">
                  (peak: <span className="text-[hsl(var(--sulsport-yellow))] font-bold">{diagnostics.peakIntensity}</span>)
                </div>
                
                {isImpactMode && lastImpact && (
                  <div className="mt-3 text-sm text-zinc-400 space-y-1">
                    <div>
                      avg: <span className="text-white font-mono">{lastImpact.avgIntensity}</span> | 
                      pkts: <span className="text-white font-mono">{lastImpact.packetCount}</span> | 
                      <span className="text-white font-mono">{lastImpact.durationMs}ms</span>
                    </div>
                    <div className="text-zinc-500">
                      Device: <span className="text-zinc-300">{lastImpact.deviceId}</span>
                      {' '}
                      <span className="text-zinc-400">
                        ({diagnostics.deviceLabels[String(lastImpact.deviceId)] || 'N/A'})
                      </span>
                    </div>
                    <div className="text-zinc-600">
                      {formatRelativeTime(lastImpact.endedAt)}
                    </div>
                  </div>
                )}
                
                {!isImpactMode && diagnostics.uiLastPacket && (
                  <div className="mt-3 text-sm text-zinc-500 space-y-1">
                    <div>
                      Device: <span className="text-zinc-300">{diagnostics.uiLastPacket.deviceId}</span>
                      {' '}
                      <span className="text-zinc-400">
                        ({diagnostics.deviceLabels[String(diagnostics.uiLastPacket.deviceId)] || 'N/A'})
                      </span>
                    </div>
                    {diagnostics.uiLastPacket.battery !== undefined && (
                      <div>
                        Bateria: <span className="text-zinc-300">{diagnostics.uiLastPacket.battery}%</span>
                      </div>
                    )}
                    <div className="text-zinc-600">
                      {formatRelativeTime(diagnostics.uiLastPacket.ts)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Eventos/Impactos Recentes */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-zinc-400 uppercase">
                    {isImpactMode 
                      ? `IMPACTOS RECENTES (${diagnostics.impactCount} total)` 
                      : `EVENTOS RECENTES (${diagnostics.eventCount} total)`
                    }
                  </CardTitle>
                  {hasObservedData && (
                    <span className={cn(
                      "text-xs",
                      isLowScale ? "text-yellow-400" : "text-zinc-500"
                    )}>
                      Escala: {observedScale.globalMin}–{observedScale.globalMax}
                      {isLowScale && ' (baixa)'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px]">
                  {isImpactMode ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(var(--sulsport-gray))]">
                          <TableHead className="text-zinc-500 text-xs">HORA</TableHead>
                          <TableHead className="text-zinc-500 text-xs">DEV</TableHead>
                          <TableHead className="text-zinc-500 text-xs text-right">PEAK</TableHead>
                          <TableHead className="text-zinc-500 text-xs text-right">AVG</TableHead>
                          <TableHead className="text-zinc-500 text-xs text-right">PKTS</TableHead>
                          <TableHead className="text-zinc-500 text-xs text-right">DUR.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diagnostics.uiRecentImpacts.length === 0 ? (
                          <TableRow className="border-[hsl(var(--sulsport-gray))]">
                            <TableCell colSpan={6} className="text-center text-zinc-600 py-8">
                              Nenhum impacto
                            </TableCell>
                          </TableRow>
                        ) : (
                          diagnostics.uiRecentImpacts.map((impact) => (
                            <TableRow key={impact.id} className="border-[hsl(var(--sulsport-gray))]">
                              <TableCell className="text-zinc-400 text-xs font-mono py-1">
                                {formatTime(impact.startedAt)}
                              </TableCell>
                              <TableCell className="text-zinc-300 text-xs py-1">
                                {impact.deviceId}
                              </TableCell>
                              <TableCell className="text-white text-xs text-right font-mono font-bold py-1">
                                {impact.peakIntensity}
                              </TableCell>
                              <TableCell className="text-zinc-300 text-xs text-right font-mono py-1">
                                {impact.avgIntensity}
                              </TableCell>
                              <TableCell className="text-zinc-400 text-xs text-right py-1">
                                {impact.packetCount}
                              </TableCell>
                              <TableCell className="text-zinc-400 text-xs text-right py-1">
                                {impact.durationMs}ms
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(var(--sulsport-gray))]">
                          <TableHead className="text-zinc-500 text-xs">HORA</TableHead>
                          <TableHead className="text-zinc-500 text-xs">DEV</TableHead>
                          <TableHead className="text-zinc-500 text-xs text-right">INTENS.</TableHead>
                          <TableHead className="text-zinc-500 text-xs text-right">BAT.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diagnostics.uiRecentEvents.length === 0 ? (
                          <TableRow className="border-[hsl(var(--sulsport-gray))]">
                            <TableCell colSpan={4} className="text-center text-zinc-600 py-8">
                              Nenhum evento
                            </TableCell>
                          </TableRow>
                        ) : (
                          diagnostics.uiRecentEvents.map((evt, idx) => (
                            <TableRow key={`${evt.ts}-${idx}`} className="border-[hsl(var(--sulsport-gray))]">
                              <TableCell className="text-zinc-400 text-xs font-mono py-1">
                                {formatTime(evt.ts)}
                              </TableCell>
                              <TableCell className="text-zinc-300 text-xs py-1">
                                {evt.deviceId}
                              </TableCell>
                              <TableCell className="text-white text-xs text-right font-mono py-1">
                                {evt.intensity}
                              </TableCell>
                              <TableCell className="text-zinc-400 text-xs text-right py-1">
                                {evt.battery !== undefined ? `${evt.battery}%` : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Stats por Device */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))] lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-bold text-zinc-400 uppercase">
                    STATS POR DEVICE {isImpactMode && '(IMPACTOS)'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {Object.keys(diagnostics.noiseFloor).length > 0 && (
                      <span className="text-xs text-zinc-600">
                        Noise: {Object.entries(diagnostics.noiseFloor).map(([d, v]) => `Dev${d}=${v}`).join(', ')}
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={diagnostics.calibrateNoiseFloor}
                      disabled={diagnostics.isCalibrating || !isConnected}
                      className={cn(
                        "h-7 text-xs",
                        diagnostics.isCalibrating 
                          ? "bg-[hsl(var(--sulsport-red))] text-white"
                          : "bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                      )}
                    >
                      {diagnostics.isCalibrating ? '● CALIBRANDO...' : 'CALIBRAR REPOUSO (3s)'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[hsl(var(--sulsport-gray))]">
                      <TableHead className="text-zinc-500 text-xs">DEV</TableHead>
                      <TableHead className="text-zinc-500 text-xs">LABEL</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">COUNT</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">MIN</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">MAX</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">AVG</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">P90</TableHead>
                      <TableHead className="text-zinc-500 text-xs text-right">P95</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(statsToShow).length === 0 ? (
                      <TableRow className="border-[hsl(var(--sulsport-gray))]">
                        <TableCell colSpan={8} className="text-center text-zinc-600 py-4">
                          Sem dados
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(statsToShow).map(([deviceId, stats]) => (
                        <TableRow key={deviceId} className="border-[hsl(var(--sulsport-gray))]">
                          <TableCell className="text-white font-bold py-2">{deviceId}</TableCell>
                          <TableCell className="py-2">
                            <Input
                              value={diagnostics.deviceLabels[deviceId] || ''}
                              onChange={(e) => diagnostics.setDeviceLabel(deviceId, e.target.value)}
                              className="h-7 text-xs bg-zinc-800 border-zinc-700 text-white w-32"
                              placeholder="Label..."
                            />
                          </TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono py-2">{stats.count}</TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono py-2">{stats.min}</TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono py-2">{stats.max}</TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono py-2">{stats.avg}</TableCell>
                          <TableCell className="text-[hsl(var(--sulsport-yellow))] text-right font-mono font-bold py-2">{stats.p90}</TableCell>
                          <TableCell className="text-[hsl(var(--sulsport-yellow))] text-right font-mono font-bold py-2">{stats.p95}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Amostras */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-zinc-400 uppercase flex items-center justify-between">
                  <span>AMOSTRAS ({diagnostics.sampleCount})</span>
                  <Button
                    size="sm"
                    onClick={() => setShowNewSample(true)}
                    disabled={diagnostics.isRecording || !isConnected}
                    className="bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue-light))] text-white h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    NOVA AMOSTRA
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {diagnostics.isRecording && (
                  <div className="mb-3 p-3 rounded-md bg-[hsl(var(--sulsport-red))]/20 border border-[hsl(var(--sulsport-red))]/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[hsl(var(--sulsport-red-light))] font-bold text-sm uppercase">
                        ● GRAVANDO
                      </span>
                      <span className="text-white font-mono text-sm">
                        {Math.round(diagnostics.recordingProgress)}%
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--sulsport-red))] transition-all duration-100"
                        style={{ width: `${diagnostics.recordingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <ScrollArea className="h-[140px]">
                  {diagnostics.samples.length === 0 ? (
                    <div className="text-center text-zinc-600 py-6">
                      Nenhuma amostra gravada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {diagnostics.samples.map((sample) => (
                        <div
                          key={sample.id}
                          className="flex items-center justify-between p-2 rounded bg-zinc-800/50 border border-zinc-700"
                        >
                          <div>
                            <div className="text-white text-sm font-medium">
                              "{sample.label}"
                            </div>
                            <div className="text-zinc-500 text-xs">
                              {sample.category} | {Object.keys(sample.statsByDevice).length} devices |{' '}
                              {Object.values(sample.statsByDevice).reduce((a, b) => a + b.count, 0)} eventos
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => diagnostics.deleteSample(sample.id)}
                            className="h-7 w-7 text-zinc-500 hover:text-[hsl(var(--sulsport-red-light))] hover:bg-[hsl(var(--sulsport-red))]/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Sensibilidade */}
            <Card className="bg-[hsl(var(--sulsport-black))] border-[hsl(var(--sulsport-gray))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-zinc-400 uppercase">
                  SENSIBILIDADE
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  {(Object.keys(SENSITIVITY_PRESETS) as Array<'low' | 'mid' | 'high'>).map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant="outline"
                      onClick={() => applyPreset(key)}
                      className={cn(
                        'flex-1 h-8 text-xs font-bold uppercase transition-colors',
                        activePreset === key
                          ? 'bg-[hsl(var(--sulsport-green))] border-[hsl(var(--sulsport-green))] text-white hover:bg-[hsl(var(--sulsport-green-light))]'
                          : 'border-zinc-600 text-zinc-400 hover:bg-zinc-700'
                      )}
                    >
                      {SENSITIVITY_PRESETS[key].label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasNoiseFloor && (
                  <div className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--sulsport-yellow))]/10 border border-[hsl(var(--sulsport-yellow))]/30">
                    <AlertTriangle className="w-4 h-4 text-[hsl(var(--sulsport-yellow))] shrink-0 mt-0.5" />
                    <span className="text-xs text-[hsl(var(--sulsport-yellow))]">
                      Sem calibração de ruído — calibre o repouso antes de ajustar.
                    </span>
                  </div>
                )}

                {maxScale < 5 && (
                  <div className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--sulsport-yellow))]/10 border border-[hsl(var(--sulsport-yellow))]/30">
                    <AlertTriangle className="w-4 h-4 text-[hsl(var(--sulsport-yellow))] shrink-0 mt-0.5" />
                    <span className="text-xs text-[hsl(var(--sulsport-yellow))]">
                      Escala observada muito baixa (max={maxScale}). Bata forte no equipamento antes de aplicar para melhorar a calibração.
                    </span>
                  </div>
                )}

                {/* Colete */}
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500 uppercase font-bold">Colete — Threshold de PONTO</div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-zinc-400">SENSIBILIDADE</Label>
                      <span className="text-xs font-mono text-white">{vestPointSens}</span>
                    </div>
                    <Slider
                      value={[vestPointSens]}
                      onValueChange={([v]) => handleVestPointSens(v)}
                      min={0} max={100} step={1}
                      className="mb-1"
                    />
                    <div className="text-[10px] text-zinc-600 font-mono">
                      max {maxScale} | pointMin = {sensToThreshold(vestPointSens)} | abaixo = HIT, acima = PONTO
                    </div>
                  </div>
                </div>

                {/* Capacete */}
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500 uppercase font-bold">Capacete — Threshold de PONTO</div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-zinc-400">SENSIBILIDADE</Label>
                      <span className="text-xs font-mono text-white">{helmetPointSens}</span>
                    </div>
                    <Slider
                      value={[helmetPointSens]}
                      onValueChange={([v]) => handleHelmetPointSens(v)}
                      min={0} max={100} step={1}
                      className="mb-1"
                    />
                    <div className="text-[10px] text-zinc-600 font-mono">
                      max {maxScale} | pointMin = {sensToThreshold(helmetPointSens)} | abaixo = HIT, acima = PONTO
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    handleApplyThresholds();
                    console.log('[Diagnostics] Thresholds applied — scoringInput will switch to IMPACTS');
                  }}
                  disabled={!canApply}
                  className="w-full bg-[hsl(var(--sulsport-green))] hover:bg-[hsl(var(--sulsport-green-light))] text-white font-bold uppercase disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  APLICAR NO PLACAR (modo IMPACTOS)
                </Button>
                {!canApply && (
                  <p className="text-xs text-yellow-400 mt-2 text-center">
                    ⚠️ Bata no equipamento para registrar a escala antes de aplicar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <NewSampleDialog
        open={showNewSample}
        onOpenChange={setShowNewSample}
        onStart={diagnostics.startSample}
      />

    </>
  );
}
