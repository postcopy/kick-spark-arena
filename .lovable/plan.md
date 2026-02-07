
# Fix: Golpes no colete nao pontuam

## Causa raiz

O botao "APLICAR NO PLACAR" nos sliders de sensibilidade atualiza os thresholds (`vestHitMin`, `vestPointMin`, etc.) e o `noiseFloor` na config, mas **nao muda `scoringInput` para `'impacts'`**. O valor padrao de `scoringInput` eh `'raw'`.

No handler de impactos (ChampionshipMat.tsx, linha 97):
```text
if (config.scoringInput !== 'impacts' || !config.impactThresholds) return;
```

Se `scoringInput` continua `'raw'`, todos os impactos sao descartados silenciosamente. O modo RAW (legado) usa o callback `onKick` que mapeia 1 pacote = 1 golpe, sem thresholds -- mas quando o ImpactDetector esta ativo, os pacotes individuais podem nao estar disparando `onKick`.

## Solucao

Quando o operador clica "APLICAR NO PLACAR" no painel de sensibilidade, alem de enviar os thresholds, o sistema deve **automaticamente** mudar `scoringInput` para `'impacts'`. Isso elimina o passo manual de ir ate a Config e trocar o modo.

## Mudancas

### 1. `src/pages/ChampionshipMat.tsx` (callback `onThresholdsApplied`)

Na linha 386-399, onde `onThresholdsApplied` eh chamado, adicionar `scoringInput: 'impacts'` no `updateConfigInPlace`:

```text
sync.updateConfigInPlace(config => ({
  ...config,
  scoringInput: 'impacts',        // <-- ADICIONAR
  impactThresholds: {
    ...config.impactThresholds,
    vestHitMin: t.vestHitMin,
    vestPointMin: t.vestPointMin,
    helmetHitMin: t.helmetHitMin,
    helmetPointMin: t.helmetPointMin,
    noiseFloor: diagnostics.noiseFloor,
  },
}));
```

### 2. `src/components/championship/DiagnosticsDialog.tsx` (feedback visual)

Adicionar um log no console ao aplicar, e opcionalmente um toast/feedback indicando que o modo foi trocado para IMPACTOS.

## Resultado esperado

Apos clicar "APLICAR NO PLACAR":
- `scoringInput` muda para `'impacts'` automaticamente
- Os thresholds relativos (minAboveFloor) ficam ativos
- O badge "IMPACTOS" aparece no header do ChampionshipMat
- Golpes no colete com peakAboveFloor >= vestPointMin pontuam como BODY
- Golpes no colete com peakAboveFloor >= vestHitMin contam como HIT (estatistica)
- Golpes abaixo de vestHitMin sao ignorados
