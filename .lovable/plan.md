
# Correcao da faixa de empate na TV

## Problema

Na linha 591 de `src/pages/ChampionshipTV.tsx`, a condicao para exibir "EMPATE -- AGUARDANDO DECISAO DO ARBITRO" verifica apenas pontos:

```
state.roundScoreRed === state.roundScoreBlue
```

Isso ignora o desempate por HITS, mostrando a faixa mesmo quando ha um vencedor claro por volume de golpes.

## Correcao

### `src/pages/ChampionshipTV.tsx` -- Linha 591

Adicionar verificacao de hits na condicao:

```
isRoundEnd && !isMatchEnd &&
state.roundScoreRed === state.roundScoreBlue &&
state.hitsRed === state.hitsBlue
```

Assim, a faixa de "AGUARDANDO DECISAO" so aparece em empate total (pontos E hits iguais), alinhado com a logica da Mesa.

### Arquivo modificado
1. `src/pages/ChampionshipTV.tsx` -- linha 591, adicionar `&& state.hitsRed === state.hitsBlue`
