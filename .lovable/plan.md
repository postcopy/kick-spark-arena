

# Ajuste de Presets do Modo Reacao

## Problema
Os valores do preset Elite (gap 300-600ms, flash 600ms) sao fisicamente impossiveis para executar um Bandal com tecnica correta e retornar a base.

## Arquivo
`src/types/reaction.ts` -- objeto `REACTION_PRESETS` (linhas 42-68)

## Alteracoes

Atualizar os tres presets com valores mais realistas:

| Parametro | Beginner (atual -> novo) | Intermediate (atual -> novo) | Elite (atual -> novo) |
|-----------|--------------------------|-----------------------------|-----------------------|
| workSec | 20 -> 30 | 30 -> 45 | 30 -> 60 |
| restSec | 40 -> 30 | 45 -> 30 | 30 -> 30 |
| rounds | 6 -> 3 | 6 -> 5 | 8 -> 8 (sem mudanca) |
| gapMs.min | 1500 -> 2000 | 800 -> 1000 | 300 -> 800 |
| gapMs.max | 2500 -> 4000 | 1500 -> 2500 | 600 -> 1500 |
| flashMs | 1000 -> 3000 | 800 -> 1500 | 600 -> 900 |

Nenhuma alteracao em `cognitiveMode` ou `goProbability` (permanecem `false` e `75`).

## Impacto
- Apenas valores numericos no objeto de constantes
- Nenhuma mudanca de logica, interface ou componentes
- A tela de setup continuara mostrando os valores atualizados nos inputs

