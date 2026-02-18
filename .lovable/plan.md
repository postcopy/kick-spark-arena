

# Aplicar Padrao Brutalista: SetupScreen + ReactionSetupScreen

## Resumo

Aplicar o mesmo padrao de Minimalismo Brutalista do `ArcadeSetupScreen` nas telas `SetupScreen` (Contra o Tempo) e `ReactionSetupScreen` (Reacao). Remover icones, aplicar tipografia pesada, cards flat com amarelo solido no estado ativo, sliders tecnicos, botoes chanfrados e bloco de regras estilo "Nota de Sistema".

## Arquivo 1: `src/components/game/SetupScreen.tsx`

### 1. Imports — Limpar icones
- Remover: `ChevronLeft, Users, User, Search, Plus, Play, Check, Trophy` do Lucide.
- Adicionar: `import bgMenuModos from '@/assets/menu-modos.jpg'` e `import { cn } from '@/lib/utils'` (ja existe).
- Manter imports funcionais: `useState, useEffect, supabase, useAuth, useSound, AddAthleteDialog, RankingPreview, AthleteStats, Input`.

### 2. Background
- Adicionar `relative` ao container principal e imagem `bgMenuModos` com `opacity-[0.03]` como overlay absoluto (mesmo padrao do Arcade).

### 3. Progress Indicator
- Substituir bolinhas arredondadas por barras retangulares flat: `w-8 h-1 rounded-none` em vez de `w-3 h-3 rounded-full`.
- Cor ativa: `bg-[#FFD700]`, inativa: `bg-white/20`.

### 4. Step "players" — Cards Duo/Individual
- Remover icones `Users` e `User`.
- Remover descricoes ("2 pessoas, quem chuta mais", "Ranking e recordes pessoais").
- Transformar em barras horizontais flat (mesmo padrao dos cards do Arcade):
  - `h-14 md:h-16`, `flex items-center justify-between px-6`.
  - Esquerda: titulo `text-2xl md:text-3xl font-black uppercase tracking-tighter`.
  - Direita: info tecnica em `font-mono text-lg`.
  - Ativo: `bg-[#FFD700] text-black border-transparent`.
  - Inativo: `bg-transparent border border-white/5 text-white/20 hover:bg-white/5`.
- Remover `rounded-2xl`, `border-2`, icones com backgrounds arredondados.

### 5. Step "athlete" — Grid de Atletas
- Manter funcionalidade (search, grid, add).
- Header: alinhar esquerda, `font-mono font-black uppercase tracking-tighter`.
- Remover icone `Trophy` do botao de ranking — texto puro.
- Remover icone `Search` do input — manter input limpo com estilo mono.
- Cards de atleta: remover `rounded-xl`, usar bordas flat. Ativo: `bg-[#FFD700] text-black`.
- Remover icone `User` dos avatares — usar apenas inicial do nome em fundo flat.
- Remover icone `Plus` do botao "Novo Atleta" — texto puro com `+` unicode.
- Botao ranking: estilo flat, sem icone.

### 6. Step "duration" — Opcoes de Tempo
- Transformar opcoes de duracao em barras horizontais flat (mesmo padrao):
  - `h-14 md:h-16`, `flex items-center justify-between px-6`.
  - Esquerda: valor grande (`text-2xl md:text-3xl font-black`).
  - Direita: sublabel em `font-mono text-white/20`.
  - Ativo: `bg-[#FFD700] text-black`.
  - Inativo: `bg-transparent border border-white/5 text-white/20 hover:bg-white/5`.
- Remover `rounded-xl`, `border-2`, checkmark icon, badge "RECOMENDADO" arredondada (substituir por tag flat simples).
- Preview RED/BLUE: simplificar com bordas flat, sem `rounded-xl`.

### 7. Botao "JOGAR!"
- Substituir `Button` por `<button>` nativo com clip-path chanfrado.
- `bg-[#FFD700] text-black font-black uppercase tracking-widest text-lg`.
- Remover icone `Play`.

### 8. Botao Voltar
- Remover icone `ChevronLeft`.
- Texto puro: `← VOLTAR` com `font-mono text-xs text-white/30`.

### 9. Header dos Steps
- Alinhar titulos a esquerda.
- Estilo terminal: `font-mono font-black uppercase tracking-tighter text-white`.
- Remover subtitulos descritivos.

## Arquivo 2: `src/components/game/ReactionSetupScreen.tsx`

### 1. Imports — Limpar icones
- Remover: `ArrowLeft, Zap, Clock, Repeat, Timer, Wifi, WifiOff, Brain, UserCheck, UserX` do Lucide.
- Adicionar: `import bgMenuModos from '@/assets/menu-modos.jpg'`.

### 2. Background
- Adicionar `relative` ao container e imagem `bgMenuModos` com `opacity-[0.03]`.

### 3. Header — Terminal style
- Remover icone `Zap`.
- Alinhar esquerda.
- `font-mono font-black uppercase tracking-tighter text-white`.
- "REACAO" destacado em `text-green-400` (cor do modo).

### 4. Cards de Dificuldade (Beginner/Intermediate/Elite)
- Transformar de grid 3 colunas arredondado em barras horizontais flat:
  - `h-14 md:h-16`, `flex items-center justify-between px-6`.
  - Esquerda: label `text-2xl md:text-3xl font-black uppercase tracking-tighter`.
  - Direita: meta tecnica em `font-mono` (ex: `"30s / 3R"`, `"45s / 5R"`, `"60s / 8R"`).
  - Ativo: `bg-green-500 text-black` (cor do modo Reacao, nao amarelo).
  - Inativo: `bg-transparent border border-white/5 text-white/20 hover:bg-white/5`.
- Remover `bg-slate-900/50`, `rounded-xl`, `rounded-lg`.

### 5. Card de Atleta
- Remover icones `UserCheck`, `UserX`.
- Simplificar: barra flat com nome ou "Selecionar Atleta" / "Visitante".
- Remover `rounded-xl`, `bg-slate-900/50`.

### 6. Parametros do Treino
- Container: `bg-black/20 rounded-xl p-4 md:p-6 border border-white/10` (padrao do Arcade).
- Labels: `font-mono text-xs uppercase tracking-[0.2em] text-white/40`.
- Remover icones `Clock`, `Timer`, `Repeat` dos labels.
- Inputs: manter funcionais, ajustar bordas flat.

### 7. Modo Cognitivo (Go/No-Go)
- Remover icone `Brain`.
- Container: `bg-black/20 rounded-xl border border-white/10`.
- Slider de probabilidade: usar thumbClassName/trackClassName tecnicos (quadrado `#FFD700` ou verde).
- Labels mono.

### 8. Hardware Status
- Remover icones `Wifi`/`WifiOff`.
- Indicador simples: bolinha `w-2 h-2` verde ou vermelha + texto mono.
- Remover `rounded-lg`, `bg-green-500/10`.

### 9. Bloco de Regras (Footer)
- Estilo "Nota de Sistema": `border-l-2 border-cyan-500/50 pl-4`.
- `font-mono text-xs text-white/40`.
- Remover `bg-slate-900/50`, `rounded-xl`.

### 10. Botao "INICIAR TREINO"
- Substituir `Button` por `<button>` nativo com clip-path chanfrado.
- `bg-green-500 text-black font-black uppercase tracking-widest text-lg`.
- Botao voltar: `← VOLTAR` texto puro mono.

## Arquivos alterados

- `src/components/game/SetupScreen.tsx` — redesign brutalista completo
- `src/components/game/ReactionSetupScreen.tsx` — redesign brutalista completo

