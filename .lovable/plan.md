

# Redesign Maximalista: HUD Gigante para Modo Individual

## Resumo
Aplicar escalas agressivas com `clamp()` no modo individual do "Contra o Tempo" para que Timer e Contador ocupem 70-80% da tela. O modo Duo permanece inalterado.

## Arquivo
`src/components/game/GameScreen.tsx` (unico arquivo)

## Alteracoes

### 1. Container principal (linha 144)
- De `flex flex-1 relative pt-[3vh]` para `flex-1 flex pt-[2vh] items-center justify-center`

### 2. Container do HUD individual (linha 148)
- Remover `bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a]`
- Adicionar `h-full`, trocar `gap-[2vh]` por `gap-[1vh]`, adicionar `-mt-8`

### 3. Timer Circular (linhas 155-171)
- SVG: de `clamp(7rem, 25vh, 18rem)` para `clamp(12rem, 42vh, 40rem)`
- strokeWidth: de `8` para `6`
- Stroke fundo: de `rgba(255,255,255,0.1)` para `rgba(255,255,255,0.05)`
- Fonte: de `clamp(3rem, 15vh, 8rem)` para `clamp(4rem, 18vh, 14rem)`
- Usar `font-black` em vez de `font-bold`
- Mostrar `{timeLeft}` em vez de `{formatTime(timeLeft)}`

### 4. Contador de Hits (linhas 174-192)
- Container: adicionar `-mt-4` e `justify-center`
- Fonte hits: de `clamp(4rem, 20vh, 12rem)` para `clamp(6rem, 28vh, 20rem)`
- Drop shadow mais forte: `drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]`
- Flash scale: de `scale-110` para `scale-105`
- Label "HITS": de `clamp(1.2rem, 3vh, 2.5rem)` para `clamp(1.5rem, 4vh, 4rem)`, adicionar `mt-2`
- Badge CPM: gap `gap-3`, padding `px-6 py-2`, icone `w-5 h-5`, fonte inline `clamp(1rem, 2.5vh, 2rem)`, margin `mt-4`

### 5. Footer Individual (linhas 237-259)
- De relativo para `fixed bottom-0 left-0 w-full`
- Background: `bg-black/90 backdrop-blur-xl`
- Padding: `py-6`
- Container: `max-w-4xl`
- Labels: inline style `clamp(0.7rem, 1.5vh, 1.2rem)` com `font-semibold`
- Valores: `font-black` com inline `clamp(1.5rem, 3.5vh, 3rem)`
- "Ritmo Atual" simplificado para "Ritmo"

### Modo Duo
Nenhuma alteracao.
