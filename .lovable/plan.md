
# Fix: Reorganizacao do Header do Campeonato

## Problema

Os badges de status (IMPACTOS, USB, EM ANDAMENTO, ROUND) estao posicionados com `absolute right-6` e crescem para a esquerda, invadindo o espaco da logo central.

## Solucao

Trocar o layout de `justify-center` + absolutos para um `justify-between` com 3 zonas explicitas (esquerda, centro, direita), garantindo espaco exclusivo para a logo.

## Alteracao

**Arquivo:** `src/pages/ChampionshipMat.tsx` (linhas 334-388)

Reestruturar o `<header>` de:

```text
header (justify-center, relative)
  div (absolute left) -> Voltar + Ajuda
  img (logo centralizada pelo justify-center)
  div (absolute right) -> badges + round
```

Para:

```text
header (justify-between)
  div (left) -> Voltar + Ajuda
  div (center, flex-1 flex justify-center) -> Logo
  div (right) -> badges + round (sem absolute)
```

### Detalhes

1. Remover `relative` e `justify-center` do `<header>`
2. Usar `justify-between` no header
3. Remover `absolute left-6` do grupo esquerdo -- manter como elemento normal do flex
4. Envolver a logo em um `div` com `flex-1 flex justify-center` para centralizacao natural
5. Remover `absolute right-6` do grupo direito -- manter como elemento normal do flex
6. Reduzir o `text-xs` dos badges de status da luta (que esta sem `text-xs`) para consistencia visual
7. Os 3 grupos terao larguras flexiveis, com o centro sempre centralizado

Nenhuma mudanca funcional -- apenas redistribuicao de CSS no header.
