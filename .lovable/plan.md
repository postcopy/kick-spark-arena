

# Fix: Z-Index e Fundo do MenuDrawer

## Problema

Os Hero Cards com efeitos de glow (`box-shadow`, `icon-glow`) estao "vazando" visualmente por cima do menu lateral porque ambos usam `z-50`. O fundo do drawer tambem e semi-transparente (`bg-game-surface`), permitindo que brilhos e textos dos cards aparecam por baixo.

## Alteracoes

| Arquivo | Acao |
|---------|------|
| `src/components/game/MenuDrawer.tsx` | Aumentar z-index e tornar fundo opaco |

### Detalhes

1. **Backdrop (overlay)**: Mudar de `z-50` para `z-[90]` - isola visualmente os cards
2. **Drawer (painel lateral)**: Mudar de `z-50` para `z-[100]` - fica acima de tudo
3. **Fundo do Drawer**: Trocar `bg-game-surface` por `bg-[#0b1120]` (solido, opaco) e adicionar `backdrop-blur-xl` como fallback extra para eliminar qualquer transparencia residual

Essas 3 mudancas sao todas na mesma arquivo, linhas 43, 51.

