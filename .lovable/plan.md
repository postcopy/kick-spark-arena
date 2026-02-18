

# Fix: Menu Drawer Transparencia e Sobreposicao

## Problema

O MenuDrawer usa implementacao manual (div com translate-x), e mesmo com z-[100], os `box-shadow` (glow) dos Hero Cards "vazam" visualmente por cima do backdrop e do drawer. Isso acontece porque os cards e o drawer compartilham o mesmo contexto de empilhamento (stacking context).

## Solucao (3 ajustes no mesmo arquivo)

| Arquivo | Acao |
|---------|------|
| `src/components/game/MenuDrawer.tsx` | Backdrop mais opaco + drawer totalmente isolado |
| `src/components/game/HomeScreen.tsx` | Isolar stacking context dos cards |

### 1. HomeScreen.tsx - Isolar cards

Adicionar `isolation: isolate` (classe Tailwind `isolate`) e `z-0` no container do grid dos cards. Isso cria um novo stacking context que impede que os `box-shadow` dos cards escapem para camadas superiores.

```text
Container do grid: adicionar "isolate z-0 relative"
```

### 2. MenuDrawer.tsx - Backdrop mais opaco

Mudar o backdrop de `bg-black/60` para `bg-black/80` para escurecer mais e cobrir melhor os glows.

### 3. MenuDrawer.tsx - Drawer com fundo reforçado

Adicionar `shadow-[-10px_0_30px_rgba(0,0,0,0.8)]` ao drawer para criar uma sombra lateral escura que "corta" qualquer vazamento residual de glow dos cards.

## Resultado Esperado

- Ao abrir o menu, fundo fica escuro (80% opacidade) cobrindo totalmente os cards
- O painel lateral tem fundo solido sem nenhum brilho vazando por baixo
- Cards ficam confinados em seu proprio stacking context (`isolate`)

