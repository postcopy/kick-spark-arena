

# Redesign: Finished Screen — After-Action Report (Cyber Style)

## Resumo

Reescrever completamente o bloco Duo da `FinishedScreen.tsx` para substituir os mascotes, botoes arredondados e cards coloridos por um relatorio pos-combate estilo "Industrial Cyber", consistente com o novo GameScreen Arena Battle. O bloco Individual ja possui estetica Pro e sera mantido sem alteracoes.

## Alteracoes

### Arquivo: `src/components/game/FinishedScreen.tsx`

#### 1. Import de Background

Adicionar import de `bgMenuModos` de `@/assets/menu-modos.jpg` (mesmo usado no GameScreen).

#### 2. Remocoes

- Remover `FighterMascot` do import e de todo o render Duo
- Remover `Trophy` do render Duo (substituido por texto gigante)
- Remover `Button` do import (botoes serao nativos com clip-path)
- Remover o background glow com `hsl(var(--game-*))` — substituido por glow neon direto

#### 3. Container Principal (Duo)

- De: `bg-background relative`
- Para: `fixed inset-0 bg-[#0b1120] flex flex-col`
- Background image `bgMenuModos` com `opacity-[0.05]`, absolute, pointer-events-none
- Scanlines overlay (mesmo padrao do bloco Individual)

#### 4. Header — O Veredito

- Subtitulo: "SESSAO FINALIZADA" em `tracking-[0.5em] text-white/40 uppercase font-mono text-xs`
- Texto do vencedor: `text-6xl md:text-8xl font-black italic`
  - Vermelho venceu: `text-red-500` com `drop-shadow-[0_0_40px_rgba(239,68,68,0.5)]`
  - Azul venceu: `text-blue-500` com `drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]`
  - Empate: `text-white` com `drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]`

#### 5. Cards de Performance (Grid Central)

- Layout: `grid grid-cols-2 gap-6 max-w-3xl w-full px-8`
- Cada card:
  - Fundo: `bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md`
  - Borda: `border border-white/10`
  - Cantos: `rounded-none` (industrial)
  - Topo: Faixa fina `h-1` colorida (vermelho ou azul)
  - Score: `text-8xl font-black italic` com `tabular-nums`
    - Vermelho: `text-red-500`, Azul: `text-blue-500`
  - Label "HITS" abaixo em `font-mono text-white/40 uppercase tracking-widest text-sm`
  - Estatistica CPM: calculado a partir de `scores.red / duration * 60`
  - Card do vencedor: `opacity-100`, card do perdedor: `opacity-60`

#### 6. Botoes de Acao (Footer)

- Container: `flex gap-4 mt-auto pb-8`
- Botao Principal "JOGAR DE NOVO":
  - `bg-[#FFD700] text-black font-bold uppercase tracking-wider`
  - Cantos chanfrados via `clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)`
  - Sem `rounded`
- Botao Secundario "MENU":
  - `border border-white/20 text-white hover:bg-white/10 bg-transparent`
  - Mesmo clip-path chanfrado

#### 7. Confetti

- Manter `Confetti` existente — as cores ja incluem neon (Teal, Blue, Gold) e combinam suficientemente

### Calculos adicionados

```
const redCpmFinal = duration > 0 ? Math.round((scores.red / duration) * 60) : 0;
const blueCpmFinal = duration > 0 ? Math.round((scores.blue / duration) * 60) : 0;
```

### Arquivos alterados

- `src/components/game/FinishedScreen.tsx` — reescrita completa do bloco Duo (linhas 185-288)

