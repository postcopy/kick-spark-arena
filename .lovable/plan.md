
# Wizard de Calibração Guiada com 3 Etapas

## Visão Geral

Implementar um wizard de calibração que guia o usuário em 3 etapas sequenciais (RASPAGEM, TOQUE, PONTO), coletando impactos em cada fase e sugerindo automaticamente os thresholds baseados na distribuição de `peakIntensity` observada.

---

## Fluxo do Wizard

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          WIZARD DE CALIBRAÇÃO                                   │
│                                                                                 │
│   ETAPA 1: RASPAGEM                ETAPA 2: TOQUE               ETAPA 3: PONTO │
│   ┌──────────────────┐            ┌──────────────────┐         ┌──────────────────┐
│   │ "Encoste leve    │            │ "Dê toques       │         │ "Dê chutes com   │
│   │  no equipamento  │   PRÓXIMO  │  moderados no    │  PRÓXIMO│  força total     │
│   │  sem força"      │ ────────▶  │  equipamento"    │ ────────▶  para pontuar"   │
│   │                  │            │                  │         │                  │
│   │ [Barra 8s]       │            │ [Barra 8s]       │         │ [Barra 8s]       │
│   │ Impactos: 12     │            │ Impactos: 15     │         │ Impactos: 10     │
│   │ Peak max: 8      │            │ Peak max: 22     │         │ Peak max: 45     │
│   └──────────────────┘            └──────────────────┘         └──────────────────┘
│                                                                         │
│                                                                         ▼
│                                   RESULTADO                                      │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │ Análise dos impactos coletados:                                          │  │
│   │                                                                          │  │
│   │   RASPAGEM: P95 = 7    ▓▓░░░░░░░░░░░░░░░░░░                              │  │
│   │   TOQUE:    P95 = 20   ▓▓▓▓▓▓▓░░░░░░░░░░░░░                              │  │
│   │   PONTO:    P95 = 42   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░                              │  │
│   │                                                                          │  │
│   │   Thresholds sugeridos:                                                  │  │
│   │   ┌────────────────┬───────────┬────────────┐                            │  │
│   │   │ Tipo           │ HIT mín   │ PONTO mín  │                            │  │
│   │   ├────────────────┼───────────┼────────────┤                            │  │
│   │   │ Colete         │ 14        │ 31         │                            │  │
│   │   │ Capacete       │ 10        │ 25         │                            │  │
│   │   └────────────────┴───────────┴────────────┘                            │  │
│   │                                                                          │  │
│   │   [APLICAR THRESHOLDS]     [DESCARTAR]                                   │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura

### Novos Tipos (`src/types/hardwareDiagnostics.ts`)

```typescript
/** Etapa do wizard de calibração */
export type CalibrationWizardStep = 'idle' | 'raspagem' | 'toque' | 'ponto' | 'result';

/** Dados coletados em uma etapa do wizard */
export interface CalibrationStepData {
  impacts: ImpactEvent[];
  stats: HardwareStats | null;  // Calculado sobre peakIntensity
}

/** Estado completo do wizard */
export interface CalibrationWizardState {
  step: CalibrationWizardStep;
  stepStartedAt: number | null;
  stepDurationMs: number;
  raspagem: CalibrationStepData;
  toque: CalibrationStepData;
  ponto: CalibrationStepData;
  suggestedThresholds: HardwareThresholds | null;
}

/** Extensão do UseHardwareDiagnosticsReturn */
export interface UseHardwareDiagnosticsReturn {
  // ... existentes ...
  
  // Wizard de calibração
  calibrationWizard: CalibrationWizardState;
  startCalibrationWizard: () => void;
  advanceWizardStep: () => void;
  cancelWizard: () => void;
  applyWizardThresholds: () => void;
}
```

### Constantes

```typescript
const WIZARD_STEP_DURATION_MS = 8000;  // 8 segundos por etapa
const WIZARD_STEPS: CalibrationWizardStep[] = ['raspagem', 'toque', 'ponto'];
```

---

## Lógica no Hook (`src/hooks/useHardwareDiagnostics.ts`)

### Estado do Wizard

```typescript
// Wizard state
const [calibrationWizard, setCalibrationWizard] = useState<CalibrationWizardState>({
  step: 'idle',
  stepStartedAt: null,
  stepDurationMs: WIZARD_STEP_DURATION_MS,
  raspagem: { impacts: [], stats: null },
  toque: { impacts: [], stats: null },
  ponto: { impacts: [], stats: null },
  suggestedThresholds: null,
});

// Ref para coletar impactos durante o wizard
const wizardImpactsRef = useRef<ImpactEvent[]>([]);
const wizardActiveRef = useRef<CalibrationWizardStep>('idle');
```

### Coleta de Impactos Durante Wizard

No throttle loop, quando finalizar um impacto e o wizard estiver ativo:

```typescript
// No throttle loop, ao criar ImpactEvent:
if (wizardActiveRef.current !== 'idle' && wizardActiveRef.current !== 'result') {
  wizardImpactsRef.current.push(impact);
}
```

### Funções do Wizard

```typescript
const startCalibrationWizard = useCallback(() => {
  wizardImpactsRef.current = [];
  wizardActiveRef.current = 'raspagem';
  setCalibrationWizard({
    step: 'raspagem',
    stepStartedAt: Date.now(),
    stepDurationMs: WIZARD_STEP_DURATION_MS,
    raspagem: { impacts: [], stats: null },
    toque: { impacts: [], stats: null },
    ponto: { impacts: [], stats: null },
    suggestedThresholds: null,
  });
}, []);

const advanceWizardStep = useCallback(() => {
  const currentStep = wizardActiveRef.current;
  const collectedImpacts = [...wizardImpactsRef.current];
  wizardImpactsRef.current = [];
  
  // Calcular stats sobre peakIntensity
  const peaks = collectedImpacts.map(i => i.peakIntensity);
  const stats = peaks.length > 0 ? calculateStats(peaks) : null;
  
  setCalibrationWizard(prev => {
    const updated = { ...prev };
    
    // Salvar dados da etapa atual
    if (currentStep === 'raspagem') {
      updated.raspagem = { impacts: collectedImpacts, stats };
    } else if (currentStep === 'toque') {
      updated.toque = { impacts: collectedImpacts, stats };
    } else if (currentStep === 'ponto') {
      updated.ponto = { impacts: collectedImpacts, stats };
    }
    
    // Avançar para próxima etapa
    if (currentStep === 'raspagem') {
      updated.step = 'toque';
      updated.stepStartedAt = Date.now();
      wizardActiveRef.current = 'toque';
    } else if (currentStep === 'toque') {
      updated.step = 'ponto';
      updated.stepStartedAt = Date.now();
      wizardActiveRef.current = 'ponto';
    } else if (currentStep === 'ponto') {
      // Finalizar: calcular thresholds sugeridos
      updated.step = 'result';
      updated.stepStartedAt = null;
      wizardActiveRef.current = 'result';
      updated.suggestedThresholds = calculateSuggestedThresholds(
        updated.raspagem.stats,
        updated.toque.stats,
        updated.ponto.stats
      );
    }
    
    return updated;
  });
}, []);

const cancelWizard = useCallback(() => {
  wizardImpactsRef.current = [];
  wizardActiveRef.current = 'idle';
  setCalibrationWizard({
    step: 'idle',
    stepStartedAt: null,
    stepDurationMs: WIZARD_STEP_DURATION_MS,
    raspagem: { impacts: [], stats: null },
    toque: { impacts: [], stats: null },
    ponto: { impacts: [], stats: null },
    suggestedThresholds: null,
  });
}, []);

const applyWizardThresholds = useCallback(() => {
  if (calibrationWizard.suggestedThresholds) {
    setThresholds(calibrationWizard.suggestedThresholds);
  }
  cancelWizard();
}, [calibrationWizard.suggestedThresholds, cancelWizard]);
```

### Algoritmo de Sugestão de Thresholds

```typescript
function calculateSuggestedThresholds(
  raspagem: HardwareStats | null,
  toque: HardwareStats | null,
  ponto: HardwareStats | null
): HardwareThresholds {
  // Usar P95 de cada categoria como referência
  const raspagemP95 = raspagem?.p95 ?? 0;
  const toqueP95 = toque?.p95 ?? 0;
  const pontoP95 = ponto?.p95 ?? 0;
  
  // HIT threshold: ponto médio entre RASPAGEM e TOQUE
  // (queremos aceitar TOQUE como HIT mas rejeitar RASPAGEM)
  const hitThreshold = Math.round((raspagemP95 + toqueP95) / 2);
  
  // PONTO threshold: ponto médio entre TOQUE e PONTO
  // (queremos aceitar PONTO como ponto válido mas TOQUE é só HIT)
  const pointThreshold = Math.round((toqueP95 + pontoP95) / 2);
  
  // Aplicar fator de segurança para capacete (geralmente 20% menor)
  const helmetFactor = 0.8;
  
  return {
    vestHitMin: Math.max(1, hitThreshold),
    vestPointMin: Math.max(hitThreshold + 1, pointThreshold),
    helmetHitMin: Math.max(1, Math.round(hitThreshold * helmetFactor)),
    helmetPointMin: Math.max(Math.round(hitThreshold * helmetFactor) + 1, Math.round(pointThreshold * helmetFactor)),
  };
}
```

---

## UI: Wizard Dialog (`src/components/championship/CalibrationWizardDialog.tsx`)

Novo componente dialog para o wizard:

```tsx
interface CalibrationWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wizard: CalibrationWizardState;
  onAdvance: () => void;
  onCancel: () => void;
  onApply: () => void;
  currentImpactCount: number;  // Impactos coletados na etapa atual
  lastImpact: ImpactEvent | null;
}
```

### Layout por Etapa

**Etapa RASPAGEM / TOQUE / PONTO:**
- Título: "Etapa 1/3: RASPAGEM" (ou TOQUE, PONTO)
- Instrução clara: "Encoste levemente no equipamento várias vezes"
- Barra de progresso com tempo restante
- Contador de impactos coletados
- Último impacto detectado (peak)
- Botões: [CANCELAR] [PRÓXIMO - aguardando timer ou manual]

**Etapa RESULTADO:**
- Resumo das 3 etapas com stats (count, P95)
- Barras visuais mostrando a distribuição
- Thresholds sugeridos em tabela editável
- Validação: alerta se overlap entre categorias
- Botões: [DESCARTAR] [APLICAR THRESHOLDS]

---

## Integração no DiagnosticsDialog

Adicionar botão "WIZARD DE CALIBRAÇÃO" que abre o CalibrationWizardDialog:

```tsx
<Button
  size="sm"
  onClick={diagnostics.startCalibrationWizard}
  disabled={diagnostics.isRecording || !isConnected || diagnostics.calibrationWizard.step !== 'idle'}
  className="bg-[hsl(var(--sulsport-green))] hover:bg-[hsl(var(--sulsport-green-light))] text-white"
>
  WIZARD DE CALIBRAÇÃO
</Button>

<CalibrationWizardDialog
  open={diagnostics.calibrationWizard.step !== 'idle'}
  onOpenChange={(open) => !open && diagnostics.cancelWizard()}
  wizard={diagnostics.calibrationWizard}
  onAdvance={diagnostics.advanceWizardStep}
  onCancel={diagnostics.cancelWizard}
  onApply={diagnostics.applyWizardThresholds}
  currentImpactCount={...}
  lastImpact={...}
/>
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Mudanças |
|---------|------|----------|
| `src/types/hardwareDiagnostics.ts` | Modificar | Adicionar CalibrationWizardStep, CalibrationStepData, CalibrationWizardState; expandir UseHardwareDiagnosticsReturn |
| `src/hooks/useHardwareDiagnostics.ts` | Modificar | Estado do wizard, coleta de impactos durante wizard, funções start/advance/cancel/apply, algoritmo de sugestão |
| `src/components/championship/CalibrationWizardDialog.tsx` | Criar | Novo componente dialog com UI do wizard |
| `src/components/championship/DiagnosticsDialog.tsx` | Modificar | Adicionar botão "WIZARD DE CALIBRAÇÃO" e integrar CalibrationWizardDialog |

---

## Critérios de Aceite

| # | Critério |
|---|----------|
| 1 | Botão "WIZARD DE CALIBRAÇÃO" abre o wizard |
| 2 | Wizard tem 3 etapas (RASPAGEM, TOQUE, PONTO) com 8s cada |
| 3 | Impactos são coletados separadamente por etapa |
| 4 | Ao finalizar, mostra stats de cada etapa (count, P95) |
| 5 | Thresholds são sugeridos automaticamente baseado nos P95 |
| 6 | "APLICAR THRESHOLDS" atualiza os thresholds do diagnóstico |
| 7 | Wizard pode ser cancelado a qualquer momento |
| 8 | Se não houver dados suficientes em alguma etapa, exibe aviso |

---

## Detalhes de UX

- **Timer visual**: Barra de progresso de 8s com countdown
- **Feedback sonoro** (opcional): beep ao iniciar/finalizar etapa
- **Instruções claras**: Texto grande explicando o que fazer
- **Contador de impactos**: Mostra quantos golpes foram registrados
- **Preview do último impacto**: Mostra o peak em tempo real
- **Validação no resultado**: Se TOQUE.P95 >= PONTO.P95, exibe alerta de que os dados podem estar incorretos
