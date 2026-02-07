

# Corrigir recebimento de dados no modo Campeonato

## Problema raiz

O `impactDetectorConfig` passado ao `useSerialPort` e recriado como um novo objeto a cada render (a cada 100ms pelo timer). Isso dispara o `useEffect` (linha 111-159 do `useSerialPort.ts`) repetidamente, que no cleanup destroi o `flushIntervalRef` e recria. Durante essas janelas de destruicao/recriacao, impactos sao perdidos. Alem disso, o `noiseFloor` e um objeto novo a cada render, entao o `useEffect` sempre detecta mudanca.

## Correcao

Estabilizar o `impactDetectorConfig` com `useMemo` no `ChampionshipMat.tsx`, e usar comparacao serializada no `useSerialPort.ts` para evitar re-runs desnecessarios do useEffect.

## Detalhes tecnicos

### Arquivo 1: `src/pages/ChampionshipMat.tsx`

Substituir a criacao inline do `impactDetectorConfig` (linhas 230-232) por um `useMemo`:

```typescript
const impactDetectorConfigMemo = useMemo(() => {
  if (scoringInput !== 'impacts') {
    return { enabled: false as const, noiseFloor: {} };
  }
  return {
    enabled: true as const,
    noiseFloor: impactThresholds?.noiseFloor ?? {},
  };
}, [scoringInput, JSON.stringify(impactThresholds?.noiseFloor ?? {})]);
```

E passar `impactDetectorConfigMemo` ao `useSerialPort`.

### Arquivo 2: `src/hooks/useSerialPort.ts`

Estabilizar a dependencia do `useEffect` do ImpactDetector (linha 159):
- Guardar o `noiseFloor` serializado num ref e so atualizar o detector quando realmente mudar.
- Substituir a dependencia `impactDetectorConfig?.noiseFloor` por uma string serializada para evitar comparacoes por referencia.

```typescript
const noiseFloorJson = JSON.stringify(impactDetectorConfig?.noiseFloor ?? {});

useEffect(() => {
  // ... logica existente usando impactDetectorConfig
}, [impactDetectorConfig?.enabled, noiseFloorJson]);
```

Tambem remover a funcao de cleanup que limpa o `flushIntervalRef` no retorno do useEffect, movendo essa limpeza apenas para o caso `enabled === false` e para o cleanup do componente (unmount). Isso evita que o interval seja destruido e recriado desnecessariamente.

## O que nao muda

- Pipeline serial (leitura, parsing): intocado
- Logica de pontuacao (thresholds, shadow log): intocada
- Modos Time Attack / Arcade: intocados
- stateRef pattern aplicado anteriormente: mantido

