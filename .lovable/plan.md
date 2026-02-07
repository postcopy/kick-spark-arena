

# Fix: Scoring duplo - onKick raw dispara junto com o modo IMPACTOS

## Causa raiz encontrada

O bug principal NAO esta nos thresholds nem na sensibilidade. O problema e que **os dois caminhos de scoring disparam ao mesmo tempo**:

```text
Pacote serial chega
  |
  +---> ImpactDetector.feed() --> flush --> handleImpact (com thresholds) --> pode virar HIT ou POINT
  |
  +---> onKick() --> handleHardwareKick --> sync.addScore() DIRETO (sem threshold nenhum!)
```

O `handleHardwareKick` em ChampionshipMat.tsx (linha 73-79) NAO verifica se o modo e 'impacts'. Ele chama `sync.addScore()` para qualquer pacote que passe o debounce de 150ms. Resultado: qualquer toque leve vira POINT instantaneamente pelo caminho raw, ignorando completamente o sistema de thresholds.

## Solucao

### 1. ChampionshipMat.tsx - Bloquear onKick quando scoringInput === 'impacts'

No `handleHardwareKickRef` (useEffect, linha 72-80), adicionar um guard no inicio:

```
if (sync.state.config.scoringInput === 'impacts') return;
```

Isso garante que quando o modo IMPACTOS esta ativo, apenas o `handleImpact` (que tem thresholds) processa os dados. O caminho raw (`onKick`) fica desativado.

### 2. useSerialPort.ts - Pular pipeline onKick quando detector esta ativo

Como segunda camada de seguranca, no `startReading` (linha 248-265), envolver o bloco do onKick com um guard:

```
if (!detectorRef.current) {
  // Legacy onKick pipeline
  ...
}
```

Quando o ImpactDetector esta ativo, o pipeline de onKick nem executa. Isso evita logs desnecessarios e garante que nao ha bypass possivel.

## Arquivos modificados

- `src/pages/ChampionshipMat.tsx` - 1 linha adicionada no handleHardwareKickRef
- `src/hooks/useSerialPort.ts` - Envolver bloco onKick com guard `if (!detectorRef.current)`

## Resultado esperado

- No modo RAW: funciona como antes (onKick dispara, sem thresholds)
- No modo IMPACTOS: apenas o ImpactDetector processa os dados, com thresholds absolutos
- Toque leve no modo IMPACTOS: peakIntensity avaliado contra hitMin/pointMin, nao pontua direto
- Sem mais scoring duplo

