

# Redesign: Modo Reacao Widescreen (Dashboard Mode)

## Resumo

Refatorar o ReactionSetupScreen de um layout vertical com scroll (max-w-lg) para um layout dashboard widescreen (max-w-6xl) sem scroll, seguindo o mesmo padrao do ArcadeSetupScreen.

---

## Arquivo Alterado

| Arquivo | Acao |
|---------|------|
| `src/components/game/ReactionSetupScreen.tsx` | Reescrever layout (mesma logica) |

---

## Layout Atual vs. Novo

```text
ATUAL (vertical, scroll)          NOVO (widescreen, fit-to-screen)
+------------------+              +------------------------------------------+
| Header           |              | Header (compacto, centralizado)          |
|------------------|              |------------------------------------------|
| [Atleta]         |              | [Atleta card]    | [Dificuldade botoes]  |
| [Dificuldade]    |  scroll      |------------------------------------------|
| [Trabalho]       |    |         | Trab | Desc | Rounds | Flash | GapMin/Max|
| [Descanso]       |    v         |------------------------------------------|
| [Rounds]         |              | [Cognitivo toggle + slider]  | [HW+Info] |
| [Flash]          |              |------------------------------------------|
| [Gap min/max]    |              | [INICIAR TREINO] botao largo             |
| [Cognitivo]      |              +------------------------------------------+
| [Hardware]       |
| [Como funciona]  |
|------------------|
| [INICIAR]        |
+------------------+
```

---

## Estrutura Detalhada

### 1. Container Principal

- Antes: `flex flex-col h-full w-full overflow-hidden bg-background`
- Depois: `flex flex-col h-full w-full bg-[#0b1120] p-4 md:p-6 overflow-hidden`
- Fundo escuro consistente com ArcadeSetupScreen

### 2. Header (flex-shrink-0)

- Titulo "MODO REACAO" centralizado com icone Zap
- Subtitulo curto descritivo
- Botao voltar no canto esquerdo
- Margens verticais reduzidas (`mb-2 md:mb-3`)

### 3. Main (flex-1 min-h-0, max-w-6xl mx-auto)

Organizado em 3 faixas verticais flexiveis:

#### Faixa 1: Atleta + Dificuldade (grid 2 colunas)

```text
grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3
```

- **Coluna esquerda**: Card do atleta (mesmo botao atual, adaptado ao tema escuro)
- **Coluna direita**: Card de dificuldade com 3 botoes horizontais (Iniciante/Intermediario/Elite) + indicador "Personalizado"

#### Faixa 2: Parametros do Treino (flex-1 min-h-0)

Area flexivel que encolhe em telas pequenas:

```text
bg-slate-900/50 p-3 md:p-4 rounded-xl border border-white/5
grid grid-cols-2 md:grid-cols-3 gap-3
```

6 campos organizados em 3 colunas (desktop) ou 2 colunas (mobile):
- Trabalho (s) | Descanso (s) | Rounds
- Flash max (ms) | Gap min (ms) | Gap max (ms)

Inputs compactos com labels menores (`text-xs`), fundo escuro (`bg-white/10 border-white/10 text-white`).

#### Faixa 3: Cognitivo + Hardware + Info (flex-shrink-0)

```text
grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3
```

- **Coluna 1-2 (md:col-span-2)**: Modo Cognitivo toggle + slider de probabilidade (quando ativo)
- **Coluna 3**: Status do hardware (compacto) + resumo "Como Funciona" condensado

### 4. Footer (flex-shrink-0)

```text
grid grid-cols-1 md:grid-cols-3 gap-3 items-end
```

- **Colunas 1-2**: Resumo das regras em card compacto (como no ArcadeSetupScreen)
- **Coluna 3**: Botao "INICIAR TREINO" + link "Voltar"

Botao estilizado: `bg-green-500 hover:bg-green-600 text-black font-bold font-mono`

---

## Estilizacao (Tema Escuro)

Seguir o padrao do ArcadeSetupScreen:
- Fundo: `bg-[#0b1120]`
- Cards/paineis: `bg-slate-900/50 border border-white/5`
- Textos: `text-white`, `text-white/60`, `text-white/40`
- Inputs: fundo `bg-white/10`, borda `border-white/10`, texto `text-white`
- Cor de destaque: verde (`text-green-400`, `bg-green-500`) em vez do amarelo do Arcade
- Font: `font-mono` para titulos e valores numericos

---

## Responsividade

- Mobile (< md): Colunas empilham verticalmente, `overflow-y-auto` no main
- Desktop (>= md): Layout widescreen completo, zero scroll
- Inputs e labels usam tamanhos compactos (`h-9`, `text-xs`)
- `flex-1 min-h-0` na faixa de parametros permite compressao em telas 768p

---

## O Que NAO Muda

- Props do componente (mesma interface)
- Logica de presets, updateField, handleStart
- AthletePickerDialog
- Valores dos campos e validacoes

