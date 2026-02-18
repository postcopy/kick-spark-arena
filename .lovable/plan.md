

# Fix: Tela de Reacao — Botao Atleta, Campos Cortados e Labels

## Problemas Identificados

1. **Botao "SELECIONAR ATLETA"** praticamente invisivel (borda `border-white/5` sobre fundo escuro). Precisa de cor de destaque para chamar atencao.
2. **Campos "Flash max", "Gap min", "Gap max"** cortados porque o container de parametros usa `flex-1 min-h-0 overflow-hidden` e o grid de 6 campos nao cabe.
3. **Labels tecnicos** como "Flash max (ms)", "Gap min (ms)", "Gap max (ms)" nao sao intuitivos para professores de artes marciais.

## Solucao

### 1. Botao SELECIONAR ATLETA com cor visivel

Quando nenhum atleta esta selecionado, o botao tera fundo `bg-green-500/20 border-green-500/40` com texto verde para indicar que e uma acao pendente. Quando selecionado, mantem estilo discreto atual.

### 2. Campos de parametros sempre visiveis

Remover `flex-1 min-h-0 overflow-hidden` do container de parametros e usar `flex-shrink-0` para garantir que todos os 6 campos aparecam. Como o objetivo e fit-to-screen, compensar reduzindo o `gap` interno dos inputs e usando `h-8` nos inputs (ao inves de `h-9`).

### 3. Labels amigaveis para professores

Renomear os labels para linguagem acessivel:

| Label atual | Label novo |
|---|---|
| Flash max (ms) | Tempo do alvo (ms) |
| Gap min (ms) | Intervalo min (ms) |
| Gap max (ms) | Intervalo max (ms) |
| Trabalho (s) | Trabalho (s) — manter |
| Descanso (s) | Descanso (s) — manter |
| Rounds | Rounds — manter |

## Alteracoes

### Arquivo: `src/components/game/ReactionSetupScreen.tsx`

**Botao SELECIONAR ATLETA (linhas 105-122):**
- Quando `!canStart`: `bg-green-500/15 border-green-500/40 text-green-400` com animacao `animate-pulse` sutil
- Quando selecionado: manter estilo atual discreto

**Container de parametros (linha 167):**
- Trocar `flex-1 min-h-0 overflow-hidden` por `flex-shrink-0`

**Labels (linhas 203, 211, 219):**
- "Flash max (ms)" -> "Tempo do alvo (ms)"
- "Gap min (ms)" -> "Intervalo min (ms)"  
- "Gap max (ms)" -> "Intervalo max (ms)"

**Inputs (linhas 179, 189, 199, 207, 215, 223):**
- Reduzir altura de `h-9` para `h-8` para economizar espaco vertical

