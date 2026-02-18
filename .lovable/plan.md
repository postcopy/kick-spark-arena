
# Fix: HITS e CPM cortados abaixo dos numeros no Modo Duo

## Problema

Os labels "HITS" e "CPM: X" estao aparecendo muito abaixo dos numeros grandes (2 e 1), ficando parcialmente escondidos ou cortados pela area visivel do painel.

## Causa

Os paineis usam `flex flex-col justify-center items-center h-full` com os numeros em fonte gigante (`clamp(8rem, 20vw, 22rem)`). O HITS/CPM fica em um div separado abaixo, com `marginTop: '-2vw'` que nao e suficiente para puxar os labels para perto dos numeros.

## Solucao

### Arquivo: `src/components/game/GameScreen.tsx`

Mudar o posicionamento dos labels HITS/CPM para ficarem integrados ao bloco do numero, usando posicionamento relativo mais agressivo:

1. **Ambos os paineis (vermelho e azul)**: Alterar o `marginTop` do container HITS/CPM de `'-2vw'` para `'-4vw'` para puxar os labels mais para cima, colando-os na base dos numeros.

2. Caso `-4vw` nao seja suficiente, uma alternativa e usar `position: relative` com `top: -3vw` nos labels para sobrepo-los levemente ao espaco do numero.

### Alteracoes especificas

- **Linha 330** (painel vermelho): `marginTop: '-2vw'` -> `marginTop: '-4vw'`
- **Linha 369** (painel azul): `marginTop: '-2vw'` -> `marginTop: '-4vw'`

## Resultado

HITS e CPM visivelmente colados logo abaixo dos numeros grandes, sem corte, centralizados dentro de cada painel.
