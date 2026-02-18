

# Fix: Menu Drawer Preso Dentro do Header

## Causa Raiz

O `<header>` na HomeScreen usa `backdrop-blur-sm`, que no CSS cria um **novo "containing block"**. Isso faz com que os elementos `position: fixed` do MenuDrawer (backdrop e painel lateral) fiquem posicionados **relativos ao header** em vez da tela inteira. Por isso o fundo escuro nao cobre a tela toda e o drawer parece misturado com os cards.

## Solucao

Usar um **React Portal** para renderizar o backdrop e o drawer diretamente no `<body>`, escapando completamente do contexto do header.

## Alteracao

| Arquivo | Acao |
|---------|------|
| `src/components/game/MenuDrawer.tsx` | Envolver backdrop + drawer em `createPortal` |

## Detalhes Tecnicos

1. Importar `createPortal` de `react-dom`
2. Manter o botao do menu (hamburguer) no lugar atual dentro do header
3. Envolver **apenas** o backdrop e o drawer com `createPortal(..., document.body)`
4. Manter todos os z-index, cores e estilos como estao (`z-[90]`, `z-[100]`, `bg-[#0b1120]`)

Isso garante que o backdrop e o painel lateral sejam renderizados fora de qualquer ancestor com `backdrop-blur`, `transform` ou `overflow`, resolvendo definitivamente o problema de sobreposicao.

