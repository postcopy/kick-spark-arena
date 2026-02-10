

# Correcao: Eixo Y cortado no grafico de resultados

## Problema
O `AreaChart` em `ReactionFinishedScreen.tsx` usa `margin.left: -10`, o que corta os rotulos do eixo Y (ex: "700ms").

## Correcao
**Arquivo:** `src/components/game/ReactionFinishedScreen.tsx` (linha 75)

Alterar a margem esquerda de `-10` para `40`:

```text
// De:
margin={{ top: 10, right: 10, left: -10, bottom: 0 }}

// Para:
margin={{ top: 10, right: 10, left: 40, bottom: 0 }}
```

Isso garante espaco suficiente para rotulos como "1000ms" sem corte pela borda do card.

## Arquivos modificados
1. `src/components/game/ReactionFinishedScreen.tsx` — ajuste de margem esquerda do AreaChart

