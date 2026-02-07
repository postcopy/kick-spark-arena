

# Fix: Sensibilidade excessiva e ausencia de HITs

## Causa raiz

O mapeamento `sensToThreshold` usa `rangeAboveFloor = globalMax - avgFloor`. Se o operador aplica os thresholds cedo (antes de observar golpes fortes), `globalMax` pode ser baixo, resultando em thresholds minusculos. Exemplo:

```text
globalMax=15, avgFloor=10 -> rangeAboveFloor=5
sensHit=50  -> hitMin   = (1-0.50)*5 = 2.5 -> 3
sensPoint=35 -> pointMin = (1-0.35)*5 = 3.25 -> 3
```

Resultado: hitMin=3, pointMin=3 -- qualquer impacto acima de 3 vai direto para POINT, nunca cai na faixa de HIT.

## Solucao (3 partes)

### 1. Log no momento do APLICAR (DiagnosticsDialog)

Adicionar `console.log` em `handleApplyThresholds` mostrando os valores computados:

```text
[APPLY] rangeAboveFloor=5 avgFloor=10 globalMax=15
  vestHit: sens=50 -> minAboveFloor=3
  vestPoint: sens=35 -> minAboveFloor=3
  helmetHit: sens=50 -> minAboveFloor=3
  helmetPoint: sens=35 -> minAboveFloor=3
```

Isso permite diagnosticar imediatamente se os thresholds estao corretos.

### 2. Garantir separacao minima entre hitMin e pointMin

No `handleApplyThresholds`, apos calcular os thresholds, garantir que `pointMin >= hitMin + 1`. Se o arredondamento fizer os dois convergirem, ajustar pointMin para cima:

```text
if (vestPointMin <= vestHitMin) vestPointMin = vestHitMin + 1;
if (helmetPointMin <= helmetHitMin) helmetPointMin = helmetHitMin + 1;
```

Isso garante que sempre exista uma faixa de HIT entre hitMin e pointMin.

### 3. Aviso visual quando rangeAboveFloor e muito pequeno

Se `rangeAboveFloor < 5`, exibir um aviso no card de sensibilidade: "Escala observada muito baixa. Bata forte no equipamento antes de aplicar para melhorar a calibracao."

Isso orienta o operador a gerar impactos de referencia antes de aplicar os thresholds.

## Detalhes tecnicos

### Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

**`handleApplyThresholds` (linha 109-118):**

- Adicionar log completo com rangeAboveFloor, avgFloor, globalMax e todos os thresholds computados
- Apos calcular os 4 thresholds, aplicar a regra `pointMin >= hitMin + 1`
- Passar os valores corrigidos para `onThresholdsApplied`

**Card SENSIBILIDADE (corpo do card):**

- Adicionar alerta condicional: se `rangeAboveFloor < 5`, mostrar um texto amarelo avisando que a escala observada e pequena demais

### Arquivo: `src/pages/ChampionshipMat.tsx`

Nenhuma mudanca necessaria -- o log por impacto ja esta no lugar (linha 160). Com os thresholds corrigidos, os HITs vao aparecer naturalmente.

## Resultado esperado

- Sempre existe uma faixa de intensidade onde impactos sao classificados como HIT (entre hitMin e pointMin)
- Thresholds nao ficam absurdamente baixos quando globalMax e pequeno
- Operador recebe feedback visual se a escala observada e insuficiente
- Log no console mostra exatamente os valores computados ao aplicar
