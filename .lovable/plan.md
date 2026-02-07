

# Corrigir aplicacao dos thresholds do Wizard de Calibracao

## Problema encontrado

O wizard calcula e aplica corretamente os valores de `vestHitMin`, `vestPointMin`, `helmetHitMin` e `helmetPointMin` na configuracao da luta. Porem, o **noise floor** (piso de ruido calibrado por dispositivo) que esta guardado no hook de diagnostico **nunca e copiado para a configuracao da luta**.

Resultado: na hora de pontuar, o sistema usa `noiseFloor = {}`, ou seja `floor = 0` para todos os dispositivos. O `peakAboveFloor` fica igual ao `peakIntensity` bruto, e os thresholds calculados pelo wizard (que foram baseados em valores relativos ao noise floor) nao fazem sentido -- qualquer toque fraco ja passa do threshold.

## Correcao

Quando o wizard aplicar os thresholds, tambem copiar o `noiseFloor` atual do diagnostico para a configuracao da luta.

## Detalhes tecnicos

### Arquivo: `src/pages/ChampionshipMat.tsx`

Na callback `onThresholdsApplied` (linha 386-398), incluir o `noiseFloor` do diagnostico:

```typescript
onThresholdsApplied={(t: HardwareThresholds) => {
  console.log('[Championship] Applying wizard thresholds to match config:', t);
  sync.updateConfigInPlace(config => ({
    ...config,
    impactThresholds: {
      ...config.impactThresholds,
      vestHitMin: t.vestHitMin,
      vestPointMin: t.vestPointMin,
      helmetHitMin: t.helmetHitMin,
      helmetPointMin: t.helmetPointMin,
      noiseFloor: diagnostics.noiseFloor,  // <-- ESTA LINHA MUDA
    },
  }));
}}
```

A unica mudanca e na linha 396: em vez de `config.impactThresholds?.noiseFloor ?? {}`, usar `diagnostics.noiseFloor` que contem os valores reais calibrados pelo diagnostico.

### Nenhum outro arquivo precisa ser alterado

O `diagnostics.noiseFloor` ja e exposto pelo hook `useHardwareDiagnostics` e ja esta disponivel no escopo do componente.

