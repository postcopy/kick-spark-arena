
# Fix Botao "Sair" Sobreposto no Menu Lateral

## Problema

O botao "Sair" usa `absolute bottom-0` e sobrepoe os itens "Meu Plano" e "Ajuda" quando a lista de itens e longa.

## Solucao

Reestruturar o layout do drawer com flexbox: header fixo no topo, menu items com scroll no meio, e botao "Sair" fixo no rodape sem sobreposicao.

## Alteracoes

### Arquivo: `src/components/game/MenuDrawer.tsx`

1. **Container do drawer** (linha 50-54): Adicionar `flex flex-col` ao container principal do drawer
2. **Menu items** (linha 88): Envolver a secao de itens em um container com `flex-1 overflow-y-auto` para permitir scroll
3. **Botao Sair** (linhas 182-196): Trocar `absolute bottom-0 left-0 right-0` por layout estatico com `mt-auto` (ou simplesmente remover o absolute, ja que o flex cuida do posicionamento). Adicionar `shrink-0` para garantir que nao encolha.

### Resultado esperado

- Menu com muitos itens: itens rolam, "Sair" fica visivel no rodape
- Menu com poucos itens: "Sair" fica no rodape, sem sobreposicao
