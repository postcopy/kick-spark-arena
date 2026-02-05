

# Implementar Diagnóstico de Intensidade - Versão Final com Micro-Ajustes

## Visão Geral

Ferramenta de diagnóstico para coletar pacotes RAW do hardware (intensity, deviceId, battery, ts) para calibrar thresholds futuros. O placar do campeonato NÃO será alterado nesta fase.

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/types/hardwareDiagnostics.ts` | Tipos e interfaces |
| `src/hooks/useHardwareDiagnostics.ts` | Hook com performance otimizada |
| `src/components/championship/DiagnosticsDialog.tsx` | Dialog fullscreen responsivo |
| `src/components/championship/NewSampleDialog.tsx` | Modal para gravar amostra |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/types/serial.ts` | Adicionar `onRawPacket` opcional |
| `src/hooks/useSerialPort.ts` | Chamar onRawPacket antes do debounce (linha ~180) |
| `src/pages/ChampionshipMat.tsx` | Instanciar diagnostics e passar para OperatorPanel |
| `src/components/championship/OperatorPanel.tsx` | Botão DIAGNÓSTICO + Dialog |

---

## Micro-Ajustes Aplicados

### 1. Ring Buffer sem Spread (Performance)

```typescript
// ANTES (aloca array novo a cada pacote):
eventsRef.current = [...eventsRef.current, pkt].slice(-2000);

// DEPOIS (push + trim in-place):
const MAX_EVENTS = 2000;
eventsRef.current.push(pkt);
if (eventsRef.current.length > MAX_EVENTS) {
  eventsRef.current = eventsRef.current.slice(-MAX_EVENTS);
}
```

### 2. Peak Hold Força Refresh ao Zerar

```typescript
type TimeoutHandle = ReturnType<typeof setTimeout>;

const peakRef = useRef<{ value: number; timeout: TimeoutHandle | null }>({ 
  value: 0, 
  timeout: null 
});
const uiDirtyTickRef = useRef(0);

// No onRawPacket:
if (pkt.intensity > peakRef.current.value) {
  peakRef.current.value = pkt.intensity;
}
if (peakRef.current.timeout) {
  clearTimeout(peakRef.current.timeout);
}
peakRef.current.timeout = setTimeout(() => {
  peakRef.current.value = 0;
  // Força refresh da UI mesmo sem novo pacote
  uiDirtyTickRef.current++;
}, 2000);

// No throttle (100ms):
useEffect(() => {
  let lastTick = uiDirtyTickRef.current;
  
  const interval = setInterval(() => {
    const currentTs = lastPacketRef.current?.ts ?? null;
    const currentTick = uiDirtyTickRef.current;
    
    // Atualiza se: novo pacote OU dirtyTick mudou (peak zerou)
    if (currentTs !== lastUiTsRef.current || currentTick !== lastTick) {
      lastUiTsRef.current = currentTs;
      lastTick = currentTick;
      setUiLastPacket(lastPacketRef.current);
      setUiRecentEvents(eventsRef.current.slice(-30).reverse());
      setUiStatsByDevice(calculateAllStats(eventsRef.current));
      setPeakIntensity(peakRef.current.value);
    }
  }, 100);
  return () => clearInterval(interval);
}, []);
```

### 3. Persistência Otimizada (300 eventos max)

```typescript
const MAX_PERSISTED_EVENTS = 300;  // Reduzido para localStorage
const MAX_MEMORY_EVENTS = 2000;    // Buffer em memória completo

// No save debounced (2s):
const saveToStorage = useCallback(() => {
  const data: DiagnosticsStorage = {
    version: 1,
    createdAt: createdAtRef.current,
    updatedAt: Date.now(),
    deviceLabels,
    thresholds,
    // Persistir apenas os últimos 300 eventos (economia de storage)
    events: eventsRef.current.slice(-MAX_PERSISTED_EVENTS),
    samples,
  };
  localStorage.setItem(storageKey, JSON.stringify(data));
  dirtyRef.current = false;
}, [deviceLabels, thresholds, samples, storageKey]);
```

### 4. Export CSV com Escaping Correto

```typescript
// Função auxiliar para escapar campos CSV
function escapeCSV(value: string | number): string {
  const str = String(value);
  // Se contém vírgula, aspas ou quebra de linha, encapsula em aspas
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Gera CSV com vírgula (padrão internacional)
function generateEventsCSV(events: HardwareRawPacket[]): string {
  const header = 'ts_iso,deviceId,intensity,battery';
  const rows = events.map(e => [
    new Date(e.ts).toISOString(),
    e.deviceId,
    e.intensity,
    e.battery ?? ''
  ].map(escapeCSV).join(','));
  return [header, ...rows].join('\n');
}

function generateSamplesCSV(samples: HardwareSample[]): string {
  const header = 'sampleId,label,category,deviceId,count,min,max,avg,p90,p95';
  const rows: string[] = [];
  
  samples.forEach(sample => {
    Object.entries(sample.statsByDevice).forEach(([deviceId, stats]) => {
      rows.push([
        sample.id,
        escapeCSV(sample.label),
        sample.category,
        deviceId,
        stats.count,
        stats.min,
        stats.max,
        stats.avg,
        stats.p90,
        stats.p95
      ].join(','));
    });
  });
  
  return [header, ...rows].join('\n');
}

// Download como 2 arquivos separados
const exportCSV = useCallback(() => {
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  
  // Events CSV
  const eventsCSV = generateEventsCSV(eventsRef.current);
  downloadFile(`events_${timestamp}.csv`, eventsCSV, 'text/csv');
  
  // Samples CSV
  if (samples.length > 0) {
    const samplesCSV = generateSamplesCSV(samples);
    downloadFile(`samples_${timestamp}.csv`, samplesCSV, 'text/csv');
  }
}, [samples]);

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 5. Device Labels Padrão no First Run

```typescript
const DEFAULT_DEVICE_LABELS: DeviceLabels = {
  '1': 'Colete Azul',
  '2': 'Colete Vermelho',
  '3': 'Capacete Azul',
  '4': 'Capacete Vermelho',
};

const DEFAULT_THRESHOLDS: HardwareThresholds = {
  vestHitMin: 150,
  vestPointMin: 400,
  helmetHitMin: 100,
  helmetPointMin: 300,
};

// No carregamento inicial:
useEffect(() => {
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const data = JSON.parse(stored) as DiagnosticsStorage;
      eventsRef.current = data.events || [];
      setSamples(data.samples || []);
      setThresholds(data.thresholds || DEFAULT_THRESHOLDS);
      setDeviceLabels(data.deviceLabels || DEFAULT_DEVICE_LABELS);
      createdAtRef.current = data.createdAt;
    } catch (e) {
      console.error('Failed to load diagnostics:', e);
    }
  } else {
    // First run: usar defaults
    setDeviceLabels(DEFAULT_DEVICE_LABELS);
    setThresholds(DEFAULT_THRESHOLDS);
    createdAtRef.current = Date.now();
  }
}, [storageKey]);
```

---

## Tipos (hardwareDiagnostics.ts)

```typescript
/** Pacote raw do hardware. ts gerado via Date.now() no momento do parse. */
export interface HardwareRawPacket {
  ts: number;
  deviceId: number;
  intensity: number;
  battery?: number;
}

export type SampleCategory = 'RASPAGEM' | 'TOQUE' | 'PONTO' | 'OUTRO';

export interface HardwareStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p90: number;
  p95: number;
}

export interface HardwareSample {
  id: string;
  label: string;
  category: SampleCategory;
  startedAt: number;
  durationMs: number;
  events: HardwareRawPacket[];
  statsByDevice: Record<string, HardwareStats>;
}

export interface HardwareThresholds {
  vestHitMin: number;
  vestPointMin: number;
  helmetHitMin: number;
  helmetPointMin: number;
}

export type DeviceLabels = Record<string, string>;

export interface DiagnosticsStorage {
  version: 1;
  createdAt: number;
  updatedAt: number;
  deviceLabels: DeviceLabels;
  thresholds: HardwareThresholds;
  events: HardwareRawPacket[];
  samples: HardwareSample[];
}
```

---

## Hook useHardwareDiagnostics - Interface Exposta

```typescript
export interface UseHardwareDiagnosticsReturn {
  // Callback para useSerialPort
  onRawPacket: (pkt: HardwareRawPacket) => void;
  
  // UI states (throttled 100ms)
  uiLastPacket: HardwareRawPacket | null;
  peakIntensity: number;
  uiRecentEvents: HardwareRawPacket[];
  uiStatsByDevice: Record<string, HardwareStats>;
  
  // Samples
  samples: HardwareSample[];
  isRecording: boolean;
  recordingProgress: number;
  startSample: (label: string, category: SampleCategory, durationMs?: number) => void;
  deleteSample: (id: string) => void;
  
  // Thresholds
  thresholds: HardwareThresholds;
  setThresholds: (t: HardwareThresholds) => void;
  
  // Device labels
  deviceLabels: DeviceLabels;
  setDeviceLabel: (id: string, label: string) => void;
  
  // Actions
  clearEvents: () => void;
  clearAll: () => void;
  exportJSON: () => void;
  exportCSV: () => void;
  
  // Info
  eventCount: number;
  sampleCount: number;
}
```

---

## Calculo Correto de Percentis

```typescript
function calculateStats(intensities: number[]): HardwareStats {
  if (intensities.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p90: 0, p95: 0 };
  }
  
  const n = intensities.length;
  const sorted = [...intensities].sort((a, b) => a - b);
  
  const sum = intensities.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / n);
  
  // Percentis: indice = floor(percentil * (n-1))
  const p90Index = Math.floor(0.90 * (n - 1));
  const p95Index = Math.floor(0.95 * (n - 1));
  
  return {
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    avg,
    p90: sorted[p90Index],
    p95: sorted[p95Index],
  };
}

function calculateAllStats(events: HardwareRawPacket[]): Record<string, HardwareStats> {
  const byDevice: Record<string, number[]> = {};
  
  for (const evt of events) {
    const key = String(evt.deviceId);
    if (!byDevice[key]) byDevice[key] = [];
    byDevice[key].push(evt.intensity);
  }
  
  const result: Record<string, HardwareStats> = {};
  for (const [deviceId, intensities] of Object.entries(byDevice)) {
    result[deviceId] = calculateStats(intensities);
  }
  
  return result;
}
```

---

## useSerialPort - Adicionar onRawPacket

```typescript
// Em src/types/serial.ts - adicionar:
export interface UseSerialPortOptions {
  onKick: (side: Side, hitType: HitType) => void;
  onRawPacket?: (pkt: { 
    intensity: number; 
    deviceId: number; 
    battery?: number; 
    ts: number; 
  }) => void;
  debounceMs?: number;
}

// Em src/hooks/useSerialPort.ts:
// 1. Adicionar ref (apos onKickRef, linha ~105):
const onRawPacketRef = useRef(options.onRawPacket);

// 2. Manter atualizado (apos useEffect do onKick, linha ~112):
useEffect(() => {
  onRawPacketRef.current = options.onRawPacket;
}, [options.onRawPacket]);

// 3. Chamar ANTES do debounce (linha ~180, apos parsed):
const { intensity, deviceId, battery } = parsed;

// NOVO: Raw packet para diagnostico (antes de qualquer filtro)
if (onRawPacketRef.current) {
  onRawPacketRef.current({
    intensity,
    deviceId,
    battery,
    ts: Date.now(),
  });
}

// Codigo existente continua (updateEquipment, debounce, onKick...)
```

---

## ChampionshipMat - Integracao

```typescript
import { useHardwareDiagnostics } from '@/hooks/useHardwareDiagnostics';

// Dentro do componente:
const diagnostics = useHardwareDiagnostics({ 
  storageKey: 'sulsport:championship:diag:v1' 
});

const serialPort = useSerialPort({
  onKick: handleHardwareKick,
  onRawPacket: diagnostics.onRawPacket,  // NOVO
  debounceMs: 150,
});

// Passar para OperatorPanel:
<OperatorPanel
  state={sync.state}
  actions={sync}
  onOpenTV={handleOpenTV}
  isTVOpen={isTVOpen}
  serialPort={serialPort}
  diagnostics={diagnostics}  // NOVO
  onOpenConfig={() => setShowConfigDialog(true)}
/>
```

---

## OperatorPanel - Botao e Dialog

```typescript
// Adicionar import:
import { Activity } from 'lucide-react';
import { DiagnosticsDialog } from './DiagnosticsDialog';
import type { UseHardwareDiagnosticsReturn } from '@/hooks/useHardwareDiagnostics';

// Adicionar prop:
interface OperatorPanelProps {
  // ... existentes
  diagnostics?: UseHardwareDiagnosticsReturn;
}

// Adicionar estado:
const [showDiagnostics, setShowDiagnostics] = useState(false);

// Na secao HARDWARE (apos botao CONECTAR USB, linha ~319):
{diagnostics && (
  <Button
    onClick={() => setShowDiagnostics(true)}
    className="w-full h-10 rounded-md bg-zinc-700 hover:bg-zinc-600 font-bold text-sm uppercase"
  >
    <Activity className="w-4 h-4 mr-2" />
    DIAGNOSTICO
  </Button>
)}

// No final do componente (antes do fechamento de aside):
{diagnostics && (
  <DiagnosticsDialog
    open={showDiagnostics}
    onOpenChange={setShowDiagnostics}
    diagnostics={diagnostics}
    serialPort={serialPort}
  />
)}
```

---

## DiagnosticsDialog - Layout Responsivo

```text
+--------------------------------------------------------------------------------+
| DIAGNOSTICO DE HARDWARE                      [LIMPAR] [LIMPAR TUDO] [JSON] [CSV]
| USB: (verde) CONECTADO                                        [CONECTAR USB]
+--------------------------------------------------------------------------------+
|                                                                                |
|  +---------------------------+   +------------------------------------------+  |
|  |   ULTIMO IMPACTO          |   |   EVENTOS RECENTES                       |  |
|  |                           |   |                                          |  |
|  |         847              |   |   HH:MM:SS  DevID  Intens.  Bat.         |  |
|  |     (peak: 892)          |   |   12:30:45    2      847     85%         |  |
|  |                           |   |   12:30:44    1      234     92%         |  |
|  |   Device: 2 (Colete Verm) |   |   ... (30 linhas)                        |  |
|  |   Bateria: 85%            |   |                                          |  |
|  |   agora                   |   |                                          |  |
|  +---------------------------+   +------------------------------------------+  |
|                                                                                |
|  +--------------------------------------------------------------------------+  |
|  |   STATS POR DEVICE                                                       |  |
|  |   +--------------------------------------------------------------------+ |  |
|  |   | DevID | Label (edit)    | Count | Min | Max | Avg  | P90  | P95  | |  |
|  |   |   1   | [Colete Azul  ] |  142  |  45 | 923 |  412 |  756 |  845 | |  |
|  |   |   2   | [Colete Verm. ] |  138  |  52 | 987 |  445 |  789 |  876 | |  |
|  |   +--------------------------------------------------------------------+ |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                |
|  +---------------------------+   +------------------------------------------+  |
|  |   AMOSTRAS                |   |   THRESHOLDS (pre-configuracao)          |  |
|  |                           |   |                                          |  |
|  |   [+ NOVA AMOSTRA]        |   |   Colete HIT min:    [___150___]         |  |
|  |                           |   |   Colete PONTO min:  [___400___]         |  |
|  |   * "Raspagem colete"     |   |   Capacete HIT min:  [___100___]         |  |
|  |     RASPAGEM | Dev2 |     |   |   Capacete PONTO min:[___300___]         |  |
|  |     P90: 234 | 45 evts    |   |                                          |  |
|  |                           |   |   (!) Ainda nao aplicado no placar       |  |
|  +---------------------------+   +------------------------------------------+  |
+--------------------------------------------------------------------------------+
```

### Classes CSS

```css
/* Container do Dialog */
max-w-[96vw] max-h-[92vh] overflow-auto p-0

/* Grid principal */
grid gap-4 lg:grid-cols-2 grid-cols-1 p-4

/* Numero grande de intensidade */
font-size: clamp(3rem, 8vw, 6rem)
font-family: monospace
font-weight: bold

/* Stats table em 2 colunas no lg */
lg:col-span-2
```

---

## Criterios de Aceite

1. Dialog "DIAGNOSTICO" nao corta em 1366x768
2. UI nao engasga com spam de pacotes (throttle 100ms + push in-place)
3. Peak hold zera apos 2s e UI atualiza mesmo sem novo pacote
4. Stats por deviceId corretas (min/max/avg/p90/p95)
5. Samples gravam ~12s e persistem apos reload
6. Apenas 300 eventos persistidos (2000 em memoria)
7. Export JSON + 2 CSV com escaping correto
8. Device labels default preenchidos no first run
9. Placar do Campeonato NAO afetado

