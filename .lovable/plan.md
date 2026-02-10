
# Ajuste de Responsividade com clamp() no GameScreen

## Problema
O modo individual do `GameScreen` usa tamanhos fixos (`text-[10rem]`, `text-[14rem]`, `text-5xl`, `text-6xl`) que podem estourar o layout em telas com altura reduzida (notebooks 13", tablets landscape).

## Solucao

### Arquivo: `src/components/game/GameScreen.tsx` (unico arquivo)

### 1. Timer Central -- clamp baseado em vh
**Linhas 106-108**: Substituir `text-5xl md:text-6xl` por estilo inline com clamp:
```typescript
style={{ fontSize: 'clamp(3rem, 15vh, 8rem)' }}
```
Remover as classes de tamanho fixo, manter `font-bold font-mono tabular-nums`.

**Linhas 80**: Ajustar o SVG do anel de progresso para escalar com a viewport:
```
className="w-[clamp(7rem,25vh,18rem)] h-[clamp(7rem,25vh,18rem)] -rotate-90"
```

### 2. Contador de Chutes -- clamp baseado em vh
**Linhas 154-161**: Substituir `text-[10rem] md:text-[14rem]` por estilo inline:
```typescript
style={{ fontSize: 'clamp(4rem, 20vh, 12rem)' }}
```

**Linhas 162-164**: Label "chutes" -- substituir `text-3xl md:text-4xl` por:
```typescript
style={{ fontSize: 'clamp(1.2rem, 3vh, 2.5rem)' }}
```

### 3. Container Principal -- espacamento responsivo
**Linha 143**: Substituir `pt-28 md:pt-32` por `pt-[3vh]` para que o padding superior tambem escale.

**Linha 152**: No container de texto central, adicionar `gap-[2vh]` e usar flex column:
```
className="text-center flex flex-col items-center justify-center gap-[2vh]"
```

### 4. Footer -- tamanhos responsivos
**Linhas 222, 229, 235**: Substituir `text-3xl md:text-5xl` por estilo inline:
```typescript
style={{ fontSize: 'clamp(1.5rem, 4vh, 3rem)' }}
```

### 5. Overlay de Pausa -- clamp
**Linha 132**: Substituir `text-6xl md:text-8xl` por:
```typescript
style={{ fontSize: 'clamp(3rem, 12vh, 6rem)' }}
```

## Resumo das substituicoes

| Elemento | Antes | Depois |
|----------|-------|--------|
| Timer | `text-5xl md:text-6xl` | `clamp(3rem, 15vh, 8rem)` + `font-mono` |
| Anel SVG | `w-28 h-28 md:w-36 md:h-36` | `clamp(7rem, 25vh, 18rem)` |
| Score individual | `text-[10rem] md:text-[14rem]` | `clamp(4rem, 20vh, 12rem)` |
| Label "chutes" | `text-3xl md:text-4xl` | `clamp(1.2rem, 3vh, 2.5rem)` |
| Footer nomes | `text-3xl md:text-5xl` | `clamp(1.5rem, 4vh, 3rem)` |
| Pausa overlay | `text-6xl md:text-8xl` | `clamp(3rem, 12vh, 6rem)` |
| Padding topo | `pt-28 md:pt-32` | `pt-[3vh]` |

## Por que funciona
- **Monitor gamer (1080p+)**: 15vh = ~162px, limitado pelo clamp max em 8rem
- **Notebook 13" (768px altura)**: 15vh = ~115px, cabe sem scroll
- **Celular landscape (~400px altura)**: 15vh = ~60px, limitado pelo clamp min em 3rem
- O modo **Duo permanece inalterado** (KickPanel tem sua propria logica de sizing)
