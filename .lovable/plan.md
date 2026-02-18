

# Duo Score Maximalist — Numeros Gigantes

## Resumo

Aumentar drasticamente os placares do modo Duo no `GameScreen.tsx` para preencher os paineis coloridos. Ajustar tipografia, spacing e leading para que os numeros dominem visualmente.

## Alteracoes

### Arquivo: `src/components/game/GameScreen.tsx`

#### 1. Red Panel (linhas 320-334)

- Score: mudar `fontSize` de `clamp(5rem, 12vw, 14rem)` para `clamp(7rem, 18vw, 20rem)`
- Adicionar `tracking-tighter` e `leading-[0.8]` ao span do score
- Reduzir padding do container de `p-6` para `px-2 py-0`
- Adicionar `flex flex-col justify-center h-full` ao container
- Labels: adicionar `mt-[-2vw]` para colar no numero

#### 2. Blue Panel (linhas 359-373)

- Mesmas alteracoes espelhadas: `fontSize` para `clamp(7rem, 18vw, 20rem)`
- Adicionar `tracking-tighter` e `leading-[0.8]`
- Reduzir padding de `p-6` para `px-2 py-0`
- Adicionar `flex flex-col justify-center h-full`
- Labels: adicionar `mt-[-2vw]`

### Arquivos alterados

- `src/components/game/GameScreen.tsx` — linhas 320-334 (Red Panel) e 359-373 (Blue Panel)

