

# Fix: ImpactDetector nunca finaliza impactos (impacto infinito)

## Causa raiz

O `ImpactDetector` usa histerese com `continueThreshold = noiseFloor + 2`. Quando o noise floor nao e calibrado (= 0), qualquer pacote com intensidade > 2 mantem o impacto ativo. Sensores tipicamente enviam valores de repouso entre 3-15 continuamente. O impacto NUNCA finaliza porque nunca ha um gap de silencio > 200ms onde TODOS os pacotes estejam abaixo de 2.

Resultado: um unico impacto eterno que engole todos os golpes reais. O `flush()` nunca retorna impactos finalizados. O handler de scoring nunca e chamado.

```text
Sensor envia continuamente: 5, 3, 4, 6, 3, 5, ...  (repouso)
continueThreshold = 0 + 2 = 2
Todos > 2 -> lastAboveTs atualizado a cada pacote
gap nunca > 200ms -> flush() retorna [] sempre
Golpe real (peak=25) -> absorvido pelo impacto infinito
```

## Solucao (3 mudancas)

### 1. ImpactDetector: Adicionar limite de duracao maxima

Novo parametro `maxDurationMs` (default 2000ms). No `flush()`, alem de checar o gap de silencio, tambem forcar finalizacao se `now - startTs > maxDurationMs`. Isso garante que mesmo com ruido continuo, impactos sao entregues.

### 2. ImpactDetector: Forcar finalizacao antes de iniciar novo impacto

No `feed()`, se ja existe um impacto ativo para o deviceId e a duracao atual excede `maxDurationMs`, finalizar o impacto atual e iniciar um novo. Isso evita que um impacto "infinito" bloqueie golpes reais.

### 3. Debug logging no pipeline de scoring

Adicionar console.log em pontos criticos do useSerialPort e ChampionshipMat para que o operador possa verificar o fluxo no console do navegador:
- Quando o detector e criado/habilitado
- Quando flush() produz impactos finalizados
- No inicio do handleImpactRef mostrando guards (status, scoringInput, thresholds)

## Mudancas por arquivo

### `src/lib/impactDetector.ts`

- Novo campo `maxDurationMs: number` no `ImpactDetectorConfig` (default 2000)
- `flush()`: alem da condicao `gapMs > silenceGapMs`, adicionar `|| (now - active.startTs > maxDurationMs)` para forcar finalizacao
- `feed()`: antes de atualizar um impacto ativo, checar se `ts - active.startTs > maxDurationMs`. Se sim, finalizar o impacto atual (via logica similar ao flush) e iniciar um novo

### `src/hooks/useSerialPort.ts`

- Adicionar console.log quando o detector e criado: `'[useSerialPort] ImpactDetector ENABLED, noiseFloor:', parsedNoiseFloor`
- Adicionar console.log quando o detector e desabilitado: `'[useSerialPort] ImpactDetector DISABLED'`
- No flush interval, quando impacts sao finalizados: `'[useSerialPort] flush -> N impacts finalized'`

### `src/pages/ChampionshipMat.tsx`

- No inicio do `handleImpactRef.current`, log detalhado: `'[handleImpact] status=X scoringInput=Y hasThresholds=Z'`
- Isso permite rastrear exatamente onde o fluxo para

## Logica final do ImpactDetector

```text
feed(deviceId, intensity, ts):
  Se existe impacto ativo E duracao > maxDurationMs:
    Finalizar impacto atual (guardar internamente)
    Limpar ativo
  Se nao existe ativo E intensity > startThreshold:
    Criar novo impacto
  Se existe ativo E intensity > continueThreshold:
    Atualizar peak/sum/lastAboveTs

flush(now):
  Para cada impacto ativo:
    Se gap > silenceGapMs OU duracao > maxDurationMs:
      Finalizar e entregar
```

## Resultado esperado

- Impactos finalizados mesmo com ruido continuo (max 2 segundos de duracao)
- Cada golpe real produz um impacto independente
- Debug logging permite verificar o fluxo completo no console
- Compativel com noise floor calibrado (funciona melhor) e sem calibracao (funciona com safety net)

