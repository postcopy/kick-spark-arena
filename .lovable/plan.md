

# Fix: Thresholds absolutos ficam altos demais com globalMax=100 (default)

## Causa raiz

A funcao `sensToThreshold` usa `maxScale` que faz fallback para 100 quando o operador ainda nao observou impactos fortes (ou o `globalMax` observado e baixo). Com preset MEDIA:

```text
maxScale = 100 (fallback)
hitMin   = (1 - 0.50) * 100 = 50
pointMin = (1 - 0.35) * 100 = 65
```

Se os sensores operam numa escala de 0-30, nenhum impacto atinge 50. Tudo vira IGNORED.

## Solucao

### 1. Bloquear o botao APLICAR enquanto nao houver globalMax real

No `DiagnosticsDialog.tsx`, desabilitar o botao "APLICAR NO PLACAR" quando `diagnostics.observedScale.globalMax <= 0`. Exibir uma mensagem: "Bata no equipamento para registrar a escala antes de aplicar."

Isso impede que o operador aplique thresholds baseados no fallback de 100.

### 2. Remover o fallback de 100

Mudar a linha 82 para usar o `globalMax` real (sem fallback) e so permitir o calculo quando ele for > 0. Se for 0, `sensToThreshold` retorna 0 (mas o botao estara desabilitado, entao nunca sera aplicado).

```text
const maxScale = diagnostics.observedScale.globalMax;
```

### 3. Log de seguranca no APLICAR

Adicionar ao log existente do `handleApplyThresholds` o valor de `maxScale` para confirmar que nao esta usando 100 por engano. (Ja existe parcialmente, so confirmar que mostra o valor correto.)

## Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

### Linha 82 - Remover fallback

De: `const maxScale = diagnostics.observedScale.globalMax > 0 ? diagnostics.observedScale.globalMax : 100;`

Para: `const maxScale = diagnostics.observedScale.globalMax;`

### Botao APLICAR - Adicionar disabled + mensagem

Desabilitar o botao quando `maxScale <= 0` e exibir texto explicativo abaixo do botao.

### sensToThreshold - Proteger contra maxScale=0

Adicionar guard: `if (maxScale <= 0) return 0;` antes do calculo. Isso e uma seguranca extra, ja que o botao estara desabilitado.

## Resultado esperado

- Operador precisa bater no equipamento (gerando globalMax real) antes de aplicar thresholds
- Thresholds refletem a escala real do hardware (ex: se globalMax=30, hitMin=15, pointMin=20)
- Sem mais fallback para 100 que gera thresholds impossiveis de atingir
- Log confirma o maxScale usado

