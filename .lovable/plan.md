
# Auditoria Global de Responsividade (Kiosk Mode)

## Resultado da Auditoria

### Arquivos JA OK (nenhuma alteracao necessaria)
- **GameScreen.tsx** - Ja usa `vh` em todos os `clamp()`. Container tem `overflow-hidden`. Footer tem altura fixa.
- **ReactionScreen.tsx** - Corrigido na sessao anterior. Tudo usando `vh`/`vmin`.
- **FinishedScreen.tsx** - Layout flex com `overflow-y-auto` no conteudo. OK.
- **ArcadeFinishedScreen.tsx** - Layout flex com `overflow-y-auto`. OK.
- **ReactionFinishedScreen.tsx** - Layout flex com `overflow-y-auto` e footer `flex-shrink-0`. OK.

---

### Arquivos com Problemas

#### 1. ArcadeScreenTV.tsx (13 violacoes de `vw`)

Este e o arquivo mais critico. Quase todos os tamanhos de texto usam `vw`, o que causa escala exagerada em monitores widescreen.

| Linha | Atual | Correcao |
|-------|-------|----------|
| 98 | `text-[clamp(36px,5vw,72px)]` (nome VERMELHO) | `text-[clamp(36px,5vmin,72px)]` |
| 109 | `text-[clamp(48px,6vw,96px)]` (VS) | `text-[clamp(48px,6vmin,96px)]` |
| 120 | `text-[clamp(36px,5vw,72px)]` (nome AZUL) | `text-[clamp(36px,5vmin,72px)]` |
| 162 | `text-[clamp(80px,14vw,220px)]` (HP vermelho) | `text-[clamp(80px,14vmin,220px)]` |
| 177 | `text-[clamp(48px,6vw,96px)]` (dano popup red) | `text-[clamp(48px,6vmin,96px)]` |
| 197 | `text-[clamp(24px,3vw,48px)]` (COMBO text red) | `text-[clamp(24px,3vmin,48px)]` |
| 202 | `text-[clamp(72px,10vw,140px)]` (combo count red) | `text-[clamp(72px,10vmin,140px)]` |
| 261 | `text-[clamp(64px,9vw,140px)]` (timer central) | `text-[clamp(64px,9vmin,140px)]` |
| 310 | `text-[clamp(80px,14vw,220px)]` (HP azul) | `text-[clamp(80px,14vmin,220px)]` |
| 327 | `text-[clamp(48px,6vw,96px)]` (dano popup blue) | `text-[clamp(48px,6vmin,96px)]` |
| 347 | `text-[clamp(24px,3vw,48px)]` (COMBO text blue) | `text-[clamp(24px,3vmin,48px)]` |
| 352 | `text-[clamp(72px,10vw,140px)]` (combo count blue) | `text-[clamp(72px,10vmin,140px)]` |
| 419 | `text-[clamp(200px,28vw,400px)]` (K.O. overlay) | `text-[clamp(200px,28vmin,400px)]` |
| 431 | `text-[clamp(48px,6vw,96px)]` (winner text KO) | `text-[clamp(48px,6vmin,96px)]` |
| 446 | `text-[clamp(18px,2vw,28px)]` (proximo round) | `text-[clamp(18px,2vmin,28px)]` |
| 449 | `text-[clamp(80px,10vw,140px)]` (recovery countdown) | `text-[clamp(80px,10vmin,140px)]` |
| 465 | `text-[clamp(140px,16vw,260px)]` (TEMPO!) | `text-[clamp(140px,16vmin,260px)]` |
| 476 | `text-[clamp(48px,6vw,96px)]` (winner text tempo) | `text-[clamp(48px,6vmin,96px)]` |
| 489 | `text-[clamp(18px,2vw,28px)]` (proximo round tempo) | `text-[clamp(18px,2vmin,28px)]` |
| 492 | `text-[clamp(80px,10vw,140px)]` (recovery tempo) | `text-[clamp(80px,10vmin,140px)]` |
| 506 | `text-[clamp(12px,1.5vw,18px)]` (energia red) | `text-[clamp(12px,1.5vmin,18px)]` |
| 554 | `text-[clamp(12px,1.5vw,18px)]` (energia blue) | `text-[clamp(12px,1.5vmin,18px)]` |

Regra: Trocar todas as ocorrencias de `vw` por `vmin` neste arquivo.

#### 2. CountdownScreen.tsx (1 violacao)

| Linha | Atual | Correcao |
|-------|-------|----------|
| 79 | `text-[12rem] md:text-[20rem]` (numeros 3,2,1 e FIGHT!) | `text-[clamp(8rem,25vmin,20rem)]` |

O texto fixo de `20rem` (320px) pode cortar verticalmente em telas 768px de altura. Usar `vmin` com `clamp` resolve.

#### 3. KickPanel.tsx (2 violacoes - tamanhos fixos)

| Linha | Atual | Correcao |
|-------|-------|----------|
| 35 | `w-[480px] h-[480px]` (container do arco) | `w-[clamp(280px,50vmin,480px)] h-[clamp(280px,50vmin,480px)]` |
| 41 | `text-[14rem]` (score gigante) | `text-[clamp(6rem,20vmin,14rem)]` |

Em notebooks 768px de altura, o arco de 480px + rodape de 96px = 576px > 768px. Cortar e garantido.

---

## Resumo de Alteracoes

| Arquivo | Quantidade de Edits | Tipo |
|---------|---------------------|------|
| ArcadeScreenTV.tsx | ~22 linhas | `vw` -> `vmin` |
| CountdownScreen.tsx | 1 linha | `rem` fixo -> `clamp(vmin)` |
| KickPanel.tsx | 2 linhas | `px`/`rem` fixo -> `clamp(vmin)` |

- Total: 3 arquivos alterados
- Apenas CSS, nenhuma logica alterada
- Zero novos arquivos
