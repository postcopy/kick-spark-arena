

# Fix: Centralizar logo no header do Campeonato

## Problema

A logo esta centralizada no espaco restante do flexbox, nao no centro real do header. Como o grupo direito (USB + PAUSADO + ROUND) e mais largo que o grupo esquerdo (2 icones), a logo fica visivelmente deslocada para a esquerda.

## Solucao

Usar posicionamento absoluto na logo para centraliza-la em relacao ao header inteiro, independente do tamanho dos grupos laterais.

## Alteracao

**Arquivo:** `src/pages/ChampionshipMat.tsx`

1. Adicionar `relative` ao `<header>` (linha 334)
2. Trocar o wrapper da logo (linha 357) de `flex-1 flex justify-center` para `absolute left-1/2 -translate-x-1/2` -- isso garante centralizacao real independente dos tamanhos laterais
3. Manter os grupos esquerdo e direito como estao (sem flex-1)

```text
header (justify-between, relative)
  div (left)  -> Voltar + Ajuda
  div (absolute center) -> Logo  <-- centralizada de verdade
  div (right) -> USB + Status + Round
```

