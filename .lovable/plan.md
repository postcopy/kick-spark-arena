

# Redesign: Interface "Telemetria Profissional" para Modo Individual

## Resumo
Transformar o HUD individual de estilo "arcade maximalista" (dourado, glow, fonte gigante) para um painel de monitoramento tecnico/cientifico: fundo slate escuro (#0b1120), timer com anel ciano fino, contador limpo branco, e dashboard inferior com gauge de intensidade CPM.

## Arquivo
`src/components/game/GameScreen.tsx` (unico arquivo)

## Alteracoes Detalhadas

### 1. Imports (linha 2)
- Adicionar `TrendingUp`, `User`, `Pause` aos imports de lucide-react

### 2. Gauge Variables (apos linha 61)
- Adicionar constantes para o calculo do gauge SVG:
  - `gaugeMax = 200`
  - `gaugeCircumference = Math.PI * 40` (~126)
  - `gaugeProgress` e `gaugeDashoffset` baseados no CPM

### 3. formatTime (linha 67-71)
- Ajustar para sempre retornar formato `mm:ss` com padStart(2, '0') em ambos

### 4. Container Global (linha 86)
- Condicional: se `isIndividual`, usar `bg-[#0b1120]` em vez de `bg-black`

### 5. Overlay de Pausa (linhas 127-141)
- Estilo tecnico: trocar "PAUSADO" por "Sessao Pausada" em `font-medium text-cyan-400`
- Trocar "Toque para continuar" por "Retomar Treino" como botao sutil

### 6. Container Individual (linhas 144-192) -- Reescrita Completa
Substituir todo o bloco individual por:

**Header de Contexto (novo):**
- Barra superior com "MODO: CONTRA O TEMPO"
- Estilo: `text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono`
- Icone Pause no canto direito (`text-slate-400`)

**Timer Circular Tecnico:**
- SVG: de `clamp(12rem, 42vh, 40rem)` para `clamp(8rem, 22vh, 14rem)` (menor)
- strokeWidth: de `6` para `3` (linha fina)
- Stroke fundo: de `rgba(255,255,255,0.05)` para `#1e293b`
- Cor progresso: de `#FFD700` para `#22d3ee` (cyan), vermelho nos ultimos 5s
- Texto: `font-medium font-mono` com `formatTime(timeLeft)` (mm:ss)
- Tamanho fonte: de `clamp(4rem, 18vh, 14rem)` para `clamp(2rem, 8vh, 5rem)`

**Contador de Hits (Clean):**
- Numero: de `text-[#FFD700]` com glow para `text-white font-semibold`
- Tamanho: de `clamp(6rem, 28vh, 20rem)` para `clamp(4rem, 16vh, 10rem)`
- Remover drop-shadow dourado
- Label: de "HITS" dourado para "TOTAL HITS" em `text-slate-500 tracking-[0.2em] text-xs uppercase`
- Remover badge CPM flutuante (movido para dashboard)

**Flash Effect:**
- De `bg-[#FFD700]/20` para `bg-cyan-400/10`

### 7. Footer/Dashboard Individual (linhas 236-258) -- Reescrita Completa
Substituir por painel de telemetria com 3 blocos:

- Background: `bg-[#0b1120] border-t border-white/10`
- Grid: `grid-cols-3` com divisores verticais

**Bloco 1 -- Melhor da Sessao:**
- Label: `text-[10px] text-slate-500 uppercase tracking-wider font-mono`
- Valor: `text-3xl text-white font-medium tabular-nums`
- Icone TrendingUp cyan ao lado do valor

**Bloco 2 -- Intensidade (CPM) com Gauge SVG:**
- Valor CPM: `text-4xl text-white font-bold tabular-nums`
- Gauge: arco SVG de 180 graus (meia-lua), 64x32px
  - Fundo: `stroke="#1e293b"` strokeWidth 8
  - Progresso: `stroke="#22d3ee"`, verde (`#4ade80`) quando CPM > 150
  - Preenchimento via strokeDashoffset baseado em cpm/200
- Glow sutil de fundo em cyan

**Bloco 3 -- Atleta:**
- Icone User discreto `text-slate-600`
- Label: mesma formatacao dos outros blocos
- Nome: `text-2xl text-white font-medium truncate`

### Modo Duo
Nenhuma alteracao. Permanece identico.

## Paleta de Cores
- Background: `#0b1120`
- Texto primario: `#ffffff`
- Texto secundario: `#64748b` (slate-500)
- Acento: `#22d3ee` (cyan-400)
- Bordas: `border-white/10`
- Stroke fundo: `#1e293b` (slate-800)

