

# Fix: Tela de Setup Reacao — Fit-to-Screen sem Scroll

## Problema

A correcao anterior adicionou `overflow-y-auto` e `flex-shrink-0`, criando scroll. O objetivo correto e que tudo caiba na tela sem rolar, em qualquer monitor.

## Solucao

Reverter para a estrategia "Fit-to-Screen" (overflow-hidden), mas tornar TODAS as secoes flexiveis (nenhuma com `flex-shrink-0` rigido). Usar `flex-1 min-h-0` no main e permitir que as 3 rows encolham proporcionalmente. Reduzir paddings e alturas fixas em telas menores usando classes responsivas.

## Alteracoes

### Arquivo: `src/components/game/ReactionSetupScreen.tsx`

1. **Linha 84** — Main container: Trocar `overflow-y-auto` por `overflow-hidden`. Manter `flex-1 min-h-0`
2. **Linha 86** — Row 1 (Athlete+Difficulty): Remover `flex-shrink-0` para permitir encolhimento
3. **Linha 90, 114** — Botoes de atleta e dificuldade: Reduzir altura fixa de `h-14 md:h-16` para `h-10 md:h-12` para economizar espaco vertical
4. **Linha 138** — Row 2 (Parametros): Trocar `flex-shrink-0` por `flex-1 min-h-0 overflow-hidden` para encolher proporcionalmente. Reduzir padding de `p-4 md:p-6` para `p-3 md:p-4`
5. **Linha 201** — Row 3 (Cognitive): Remover `flex-shrink-0` para permitir encolhimento. Reduzir padding de `p-4 md:p-6` para `p-3 md:p-4`
6. **Linha 77** — Header: Reduzir `mb-4 md:mb-6` para `mb-2 md:mb-3` para economizar espaco
7. **Linha 84** — Gap entre rows: Reduzir `gap-3` para `gap-2`

### Resultado

- Todas as secoes encolhem proporcionalmente quando a tela e baixa
- Sem scroll em nenhuma resolucao
- Em telas altas: layout respira normalmente
- Em telas de 768px de altura: tudo cabe sem sobreposicao

