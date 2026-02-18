

# Fix: Placares do Modo Duo — Centralizar e Aumentar

## Problema

No modo Duo (Contra o Tempo), os numeros dos placares (vermelho e azul) estao colados nas laterais da tela, com o "11" azul sendo cortado pela borda direita. Os numeros precisam ficar mais centralizados visualmente e maiores.

## Causa

O grid `grid-cols-12` com `px-4` no container e `px-2` nos paineis laterais deixa pouco espaco interno. Os numeros com `fontSize: clamp(7rem, 18vw, 20rem)` combinados com `border-l-4`/`border-r-4` empurram o conteudo para as bordas.

## Solucao

### Arquivo: `src/components/game/GameScreen.tsx`

1. **Container do grid (linha 317)**: Aumentar padding lateral de `px-4` para `px-8 md:px-12`

2. **Painel Vermelho (linhas 320-334)**:
   - Trocar `px-2` por `px-6 md:px-10` para afastar o numero da borda esquerda
   - Adicionar `items-center` para centralizar o conteudo horizontalmente dentro do painel
   - Aumentar fonte de `clamp(7rem, 18vw, 20rem)` para `clamp(8rem, 20vw, 22rem)`

3. **Painel Azul (linhas 358-373)**:
   - Trocar `px-2` por `px-6 md:px-10` para afastar o numero da borda direita
   - Aumentar fonte de `clamp(7rem, 18vw, 20rem)` para `clamp(8rem, 20vw, 22rem)`

4. **Labels HITS e CPM**: Aumentar padding para acompanhar o reposicionamento dos numeros

### Resultado

- Numeros visivelmente centralizados dentro de cada metade da tela
- Fonte maior para melhor visibilidade em TVs/monitores
- Nenhum corte nas laterais

