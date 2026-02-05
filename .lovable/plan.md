
# Correção do Wizard de Calibração

## Problema Identificado

O wizard não está coletando impactos porque a detecção de impactos está muito restritiva. Há 3 problemas:

### 1. Thresholds dependem do NoiseFloor não calibrado
```typescript
const floor = noiseFloorRef.current[String(deviceKey)] ?? 0;
const startThreshold = floor + 4;  // Se floor=0, threshold=4
```
Se o noise floor não foi calibrado, usa 0. Mas se os valores de intensidade do hardware forem de escala baixa (ex: 0-50) ou alta (ex: 0-1000), o threshold de 4 pode não ser adequado.

### 2. Critérios anti-ruído muito restritivos
```typescript
// Só cria impacto se:
if (packetCount >= 3 || durationMs >= 40) { ... }
```
Chutes rápidos com menos de 3 pacotes E menos de 40ms são descartados.

### 3. Wizard depende do sistema de detecção normal
O wizard usa os mesmos impactos que o sistema normal detecta. Se não há impactos sendo detectados normalmente, o wizard também não coleta nada.

---

## Solução Proposta

### Opção A: Ajustar critérios anti-ruído para o wizard

Durante o wizard, usar critérios mais permissivos para capturar mais impactos:
- `MIN_IMPACT_PKTS = 1` (era 3)
- `MIN_IMPACT_DURATION_MS = 1` (era 40)

Isso garante que qualquer impacto detectado seja coletado, mesmo rápido.

### Opção B: Wizard coleta pacotes RAW ao invés de impactos

Modificar o wizard para coletar diretamente os pacotes raw acima de um threshold mínimo absoluto (ex: intensity > 5), sem depender do sistema de detecção de impactos.

### Opção C (Recomendada): Ambas + Diagnóstico

1. Relaxar critérios durante wizard
2. Mostrar feedback em tempo real dos pacotes recebidos
3. Adicionar indicador "Recebendo dados" para confirmar que hardware está funcionando

---

## Implementação (Opção C)

### 1. Adicionar flag para modo wizard permissivo

```typescript
// No hook
const wizardModeRef = useRef(false);

const startCalibrationWizard = useCallback(() => {
  wizardModeRef.current = true;
  // ...
});

const cancelWizard = useCallback(() => {
  wizardModeRef.current = false;
  // ...
});
```

### 2. Relaxar anti-ruído durante wizard

No throttle loop, ao validar impacto:
```typescript
// Critérios normais
const minPkts = wizardModeRef.current ? 1 : MIN_IMPACT_PKTS;
const minDur = wizardModeRef.current ? 1 : MIN_IMPACT_DURATION_MS;

if (active.packetCount >= minPkts || durationMs >= minDur) {
  // Cria impacto
}
```

### 3. Adicionar contador de pacotes raw no wizard

Expor `wizardRawPacketCount` para mostrar na UI que dados estão chegando, mesmo que não virem impactos:

```typescript
const wizardRawCountRef = useRef(0);

// No onRawPacket:
if (wizardModeRef.current) {
  wizardRawCountRef.current++;
}
```

### 4. Mostrar no CalibrationWizardDialog

```tsx
<div className="text-sm text-zinc-500">
  Pacotes recebidos: {wizardRawPacketCount}
</div>
```

### 5. Adicionar indicador visual de conexão

Se após 2 segundos não houver pacotes, mostrar alerta:
```tsx
{wizardRawPacketCount === 0 && timeProgress > 25 && (
  <div className="text-yellow-400 text-sm">
    Nenhum dado recebido. Verifique a conexão USB.
  </div>
)}
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/hooks/useHardwareDiagnostics.ts` | Adicionar wizardModeRef, relaxar critérios durante wizard, expor wizardRawPacketCount |
| `src/types/hardwareDiagnostics.ts` | Adicionar wizardRawPacketCount ao UseHardwareDiagnosticsReturn |
| `src/components/championship/CalibrationWizardDialog.tsx` | Mostrar contador de pacotes e alerta de conexão |

---

## Critérios de Aceite

| # | Critério |
|---|----------|
| 1 | Durante wizard, impactos rápidos (1 pacote) são coletados |
| 2 | UI mostra contador de pacotes raw recebidos |
| 3 | Se não receber dados em 2s, mostra alerta de conexão |
| 4 | Após wizard, critérios voltam ao normal (3 pkts / 40ms) |
| 5 | Thresholds sugeridos são calculados corretamente |
