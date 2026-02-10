

# HUD Tatico + Debounce de Hardware — ReactionScreen

## Resumo

Duas mudancas: (1) reformular o layout da tela de treino para maxima visibilidade a distancia com cronometro gigante, contador de hits e barra de live stats no rodape; (2) adicionar filtro de debounce no `registerImpact` para ignorar leituras falsas de hardware abaixo de 100ms.

## Mudancas por Arquivo

### 1. `src/components/game/ReactionScreen.tsx` — Reescrita do layout de treino

**A. Cronometro Gigante (Topo Centro)**
- Posicionado abaixo do header de round, centralizado
- Fonte: `font-mono text-[clamp(4rem,12vw,8rem)] font-black text-white`
- Formato `M:SS` (ex: `0:18`)
- Quando `workTimeLeft <= 5`: aplica `text-red-500 animate-pulse`

**B. Contador de Hits**
- Logo abaixo do cronometro: `HITS: XX`
- Fonte: `text-3xl md:text-4xl font-bold text-yellow-400`
- Valor: `reactionTimes.length`

**C. Circulo de Estimulo**
- Mantem no centro vertical, entre o cronometro e o rodape
- Mantem o feedback de tempo de reacao (fade 2s) abaixo do circulo

**D. Barra de Live Stats (Rodape Fixo)**
- Substitui o texto "Prepare-se" atual
- Estilo: `fixed bottom-0 left-0 w-full bg-black/60 backdrop-blur-md border-t border-white/10 py-4`
- Grid de 3 colunas (`grid grid-cols-3 text-center`):

| Coluna | Label | Cor | Logica |
|--------|-------|-----|--------|
| ULTIMO | Ultimo tempo | Verde neon (`text-green-400`) se < 500ms, senao `text-white` | `lastReactionTime` ou `--` |
| MEDIA | Media da sessao | `text-white` | `Math.round(sum / hits)` ou `--` |
| MELHOR | Menor tempo | `text-yellow-400` | `Math.min(...reactionTimes)` ou `--` |

**E. Dados computados inline (sem mudanca no hook)**

```text
const hits = reactionTimes.length;
const sum = reactionTimes.reduce((a, b) => a + b, 0);
const avgTime = hits > 0 ? Math.round(sum / hits) : null;
const bestTime = hits > 0 ? Math.min(...reactionTimes) : null;
```

**F. Padding inferior**
- Adicionar `pb-24` ao container principal para evitar que o circulo fique oculto atras da barra fixa do rodape

**Tela de descanso**: Permanece inalterada (fundo azul com countdown gigante).

### 2. `src/hooks/useReactionState.ts` — Debounce de 100ms

Na funcao `registerImpact`, adicionar uma verificacao: se `delta < 100`, ignorar o impacto (considerar leitura falsa de hardware). Isso impede que ruido eletrico ou vibracao residual registre um tempo de reacao humanamente impossivel.

Mudanca pontual na linha 112 — trocar o guard de `delta < 0` para `delta < 100`:

```text
// Antes:
if (delta < 0 || delta > configRef.current.flashMs + 50) return;

// Depois:
if (delta < 100 || delta > configRef.current.flashMs + 50) return;
```

Isso significa que qualquer impacto registrado em menos de 100ms apos o estimulo acender sera descartado silenciosamente.

## Layout Final da Tela de Treino

```text
+----------------------------------+
| [<]  Round 2/6                   |
|                                  |
|           0:18                   |  <-- cronometro gigante mono
|          HITS: 05                |  <-- contador amarelo
|                                  |
|           ( O )                  |  <-- circulo estimulo
|           380ms                  |  <-- feedback (fade 2s)
|                                  |
+==================================+
| ULTIMO    |  MEDIA   |  MELHOR   |  <-- barra fixa rodape
| 198ms     |  205ms   |  150ms   |
+----------------------------------+
```

## Arquivos modificados
1. `src/components/game/ReactionScreen.tsx`
2. `src/hooks/useReactionState.ts`
