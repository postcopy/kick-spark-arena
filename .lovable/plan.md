

# Scoring por Impacto no Campeonato

## Resumo

Criar um detector de impactos compartilhado (core puro), integrar ao useSerialPort com flush via setInterval, e conectar ao ChampionshipMat com thresholds relativos ao noiseFloor, anti-duplicado por lado, e shadow log. Modo RAW (legado) fica intocado.

## Arquivos e Ordem

### 1. Criar `src/lib/impactDetector.ts` -- Core puro (sem React)

Extrair a logica de histerese que hoje vive nas linhas 540-579 e 404-456 do `useHardwareDiagnostics.ts` para uma classe reutilizavel.

**Exportacoes:**
- Constantes: `SILENCE_GAP_MS` (200), `MIN_IMPACT_PKTS` (3), `MIN_IMPACT_DURATION_MS` (40), `DEFAULT_DELTA_START` (4), `DEFAULT_DELTA_CONTINUE` (2)
- Interface `ImpactDetectorConfig`: `noiseFloor`, `deltaStart`, `deltaContinue`, `silenceGapMs`, `minPackets`, `minDurationMs`
- Interface `FinalizedImpact`: `deviceId`, `startTs`, `endTs`, `durationMs`, `peakIntensity`, `avgIntensity`, `packetCount`
- Classe `ImpactDetector`:
  - `feed(deviceId, intensity, ts)` -- alimenta pacote, gerencia activeImpacts Map internamente
  - `flush(now): FinalizedImpact[]` -- verifica impactos inativos (gap > silenceGapMs), finaliza os que atendem criterios (minPackets/minDurationMs), retorna array de finalizados. Importante: funciona mesmo sem novos pacotes (o setInterval externo garante chamadas periodicas)
  - `updateConfig(partial)` -- atualiza config em runtime (ex: noiseFloor mudou)
  - `setWizardMode(active)` -- relaxa criterios para 1 pkt / 1 ms

A logica interna e identica a atual: histerese com `startThreshold = noiseFloor[deviceId] + deltaStart` e `continueThreshold = noiseFloor[deviceId] + deltaContinue`. Impacto ativo continua enquanto intensity > continueThreshold. Finaliza quando gap > silenceGapMs.

### 2. Atualizar `src/types/serial.ts`

Adicionar ao `UseSerialPortOptions`:
- `onImpact?: (impact: { deviceId: number; peakIntensity: number; avgIntensity: number; durationMs: number; packetCount: number; ts: number }) => void`
- `impactDetectorConfig?: { noiseFloor: Record<string, number>; enabled: boolean }`

Adicionar ao `UseSerialPortReturn`:
- Nenhuma mudanca necessaria (onImpact e callback, nao retorno)

### 3. Atualizar `src/types/championship.ts`

Adicionar ao `MatchConfig`:
```typescript
scoringInput?: 'raw' | 'impacts';  // default 'raw'
impactThresholds?: {
  vestHitMin: number;
  vestPointMin: number;
  helmetHitMin: number;
  helmetPointMin: number;
  noiseFloor: Record<string, number>;
};
antiDuplicateWindowMs?: number;  // default 300
```

Atualizar `DEFAULT_MATCH_CONFIG` com `scoringInput: 'raw'`.

### 4. Refatorar `src/hooks/useHardwareDiagnostics.ts`

Substituir a logica inline de deteccao de impactos pelo `ImpactDetector` importado:
- Remover a `ActiveImpactState` interface local e `activeImpactsRef`
- Criar `detectorRef = useRef(new ImpactDetector(config))`
- No `onRawPacket` (linha 540+): substituir logica de histerese por `detectorRef.current.feed(deviceKey, intensity, ts)`
- No `setInterval` de UI throttle (linha 404+): substituir loop de finalizacao por `const finalized = detectorRef.current.flush(now)` e processar cada impacto finalizado da mesma forma (criar ImpactEvent, push em impactsRef, wizard collection)
- Conectar `setWizardMode` do detector ao wizardModeRef
- Comportamento externo 100% identico

### 5. Atualizar `src/hooks/useSerialPort.ts`

Mudancas condicionais (so quando `impactDetectorConfig?.enabled === true`):

- Importar `ImpactDetector` do core
- Adicionar `detectorRef`, `onImpactRef`, `flushIntervalRef`
- No connect/mount: se enabled, instanciar `new ImpactDetector({ noiseFloor: config.noiseFloor })`
- **setInterval de 30ms** que chama `detectorRef.current.flush(Date.now())` e dispara `onImpactRef.current(impact)` para cada impacto finalizado. Isso garante que o ultimo impacto finaliza mesmo no silencio (ajuste obrigatorio #1)
- No loop de leitura (linha 191+): apos `onRawPacket`, se detector existe, chamar `detectorRef.current.feed(deviceId, intensity, Date.now())`
- O `onKick` legado permanece intocado (debounce por side, sem mudancas)
- No disconnect: limpar o setInterval

### 6. Atualizar `src/pages/ChampionshipMat.tsx`

**Novo tipo ShadowLogEntry:**
```typescript
interface ShadowLogEntry {
  ts: number;
  deviceId: number;
  peakIntensity: number;
  peakAboveFloor: number;
  avgIntensity: number;
  durationMs: number;
  packetCount: number;
  side: MatchSide;
  hitType: 'vest' | 'helmet';
  decision: 'IGNORED' | 'HIT' | 'POINT' | 'MERGED' | 'DUPLICATE';
  threshold: number;
  scored: boolean;
}
```

**Logica condicional:** Ler `scoringInput` do `sync.state.config`. Se `'impacts'`, usar `onImpact`; se `'raw'`, usar `onKick` como hoje.

**handleImpact (novo callback):**

1. Converter deviceId usando funcoes existentes `deviceIdToKickingSide(deviceId)` e `deviceIdToHitType(deviceId)` -- exportar essas funcoes do useSerialPort ou mover para um util

2. Se `sync.state.status !== 'RUNNING'`: ignorar

3. **Threshold relativo ao floor (ajuste obrigatorio #2):**
   - `floor = config.impactThresholds.noiseFloor[String(deviceId)] ?? 0`
   - `peakAboveFloor = impact.peakIntensity - floor`
   - Comparar `peakAboveFloor` contra `vestPointMin` / `helmetPointMin` / `vestHitMin` / `helmetHitMin`

4. **Anti-duplicado por lado (ajuste obrigatorio #3):**
   - Manter `lastScoredRef: Map<MatchSide, { ts: number; hitType: string; entryIndex: number }>`
   - Se mesmo lado foi pontuado ha menos de `antiDuplicateWindowMs` ms:
     - Se novo e HEAD e anterior era BODY: retroativamente marcar anterior como MERGED no shadow log, pontuar HEAD
     - Se novo e BODY e anterior era HEAD: marcar novo como MERGED (HEAD ja pontuou)
     - Se mesmo tipo (2x BODY ou 2x HEAD): marcar novo como DUPLICATE
   - Se nao ha colisao: processar normalmente

5. **Decisao:**
   - `peakAboveFloor >= pointMin` -> POINT, chamar `sync.addScore(matchSide, scoreType)`
   - `peakAboveFloor >= hitMin` mas `< pointMin` -> HIT (shadow log only)
   - `peakAboveFloor < hitMin` -> IGNORED

6. **Shadow log:** `shadowLogRef.current.push(entry)`, max 500 entradas

**Passar config ao useSerialPort:**
```typescript
const serialPort = useSerialPort({
  onKick: handleHardwareKick,
  onRawPacket: diagnostics.onRawPacket,
  onImpact: handleImpact,
  debounceMs: 150,
  impactDetectorConfig: scoringInput === 'impacts' 
    ? { enabled: true, noiseFloor: config.impactThresholds?.noiseFloor ?? {} }
    : { enabled: false, noiseFloor: {} },
});
```

**Exportar funcoes de mapeamento:** Mover `deviceIdToKickingSide` e `deviceIdToHitType` do `useSerialPort.ts` para `src/lib/deviceMapping.ts` (ou exportar diretamente) para uso no ChampionshipMat.

### 7. Atualizar `src/components/championship/MatchConfigDialog.tsx`

Adicionar nova tab "Hardware" (5a tab):

- **Toggle:** `RAW (legado)` / `IMPACTOS (recomendado)` -- controla `scoringInput`
- **Quando IMPACTOS selecionado:**
  - Campos numericos: `vestHitMin`, `vestPointMin`, `helmetHitMin`, `helmetPointMin`
  - Campo `antiDuplicateWindowMs` (default 300)
  - Campos de noiseFloor por device (4 campos: devices 1-4)
  - Botao "Usar Calibracao" que le do localStorage (`sulsport:championship:diag:v1`) e preenche os campos. Valores ficam salvos no MatchConfig, sem dependencia implicita de localStorage em runtime

### 8. Atualizar `src/components/championship/OperatorPanel.tsx`

Quando `scoringInput === 'impacts'`, adicionar botao "Exportar Shadow Log" na secao de controles. Ao clicar, baixa JSON com todas as entradas do shadowLogRef. O OperatorPanel precisa receber o shadowLog como prop (ou um callback `onExportShadowLog`).

## Pipeline Final (modo impacts)

```text
Pacote Serial (intensity, deviceId, battery)
       |
       +---> onRawPacket -> diagnostics (inalterado)
       |
       +---> onKick -> scoring legado (quando scoringInput='raw', inalterado)
       |
       +---> ImpactDetector.feed() (quando scoringInput='impacts')
       |
       +---> setInterval 30ms -> ImpactDetector.flush()
                    |
                    v
              onImpact(deviceId, peakIntensity, ...)
                    |
                    v
              ChampionshipMat.handleImpact()
                    |
                    +---> peakAboveFloor = peak - noiseFloor[deviceId]
                    |
                    +---> anti-duplo check (por lado, janela configuravel)
                    |     HEAD > BODY; mesmo tipo = DUPLICATE
                    |
                    +---> threshold check:
                    |       >= pointMin -> POINT (addScore)
                    |       >= hitMin   -> HIT (shadow log only)
                    |       < hitMin    -> IGNORED
                    |
                    +---> shadow log (sempre, toda decisao)
```

## O que NAO muda

- Modo RAW: zero alteracoes no debounce, onKick, pipeline
- Botoes manuais de scoring (PUNCH, SPIN_BODY, SPIN_HEAD)
- onRawPacket para diagnostics
- TV sync, rounds, gam-jeom, point gap
- useHardwareDiagnostics: comportamento externo identico (motor interno muda para core compartilhado)

## Ordem de Implementacao

1. `src/lib/impactDetector.ts` -- core puro
2. `src/lib/deviceMapping.ts` -- extrair funcoes de mapeamento
3. `src/types/serial.ts` + `src/types/championship.ts` -- tipos
4. `src/hooks/useHardwareDiagnostics.ts` -- refatorar para usar core
5. `src/hooks/useSerialPort.ts` -- adicionar onImpact + detector + setInterval flush
6. `src/pages/ChampionshipMat.tsx` -- handleImpact + shadow log
7. `src/components/championship/MatchConfigDialog.tsx` -- tab Hardware
8. `src/components/championship/OperatorPanel.tsx` -- botao exportar shadow log

