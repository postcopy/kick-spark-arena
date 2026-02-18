

# Fix: Sobreposicao na Tela de Setup do Modo Reacao

## Problema

A secao "Parametros do Treino" (Row 2) usa `flex-1 min-h-0` que permite encolher indefinidamente, enquanto a secao "Modo Cognitivo" (Row 3) usa `flex-shrink-0` e nao encolhe. Em telas com altura limitada, Row 2 encolhe demais e Row 3 se sobrepoe visualmente.

## Solucao

Remover a restricao `overflow-hidden` do container principal e tornar todas as secoes `flex-shrink-0`, permitindo que o `main` role verticalmente quando o conteudo excede a altura da tela. Isso e consistente com o comportamento mobile que ja usa `overflow-y-auto`.

## Alteracoes

### Arquivo: `src/components/game/ReactionSetupScreen.tsx`

1. **Linha 84** — Container `main`: Trocar `md:overflow-hidden` por `overflow-y-auto` para permitir scroll em todas as resolucoes
2. **Linha 138** — Secao de parametros: Trocar `flex-1 min-h-0` por `flex-shrink-0` para que nao encolha e cause sobreposicao

### Resultado

- Em telas altas: layout continua preenchendo a tela normalmente
- Em telas baixas: conteudo rola verticalmente em vez de sobrepor

