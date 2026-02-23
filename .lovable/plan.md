

# Adicionar Link do Dashboard no Menu

## Problema
A página `/dashboard` existe e está funcionando, mas não há nenhum botão ou link visível no app para navegar até ela. O único jeito de acessar é digitando a URL manualmente.

## Solução
Adicionar um link "Dashboard" no **MenuDrawer** (o menu lateral que abre ao clicar no botão de menu na tela inicial). Esse é o lugar natural, já que o menu já tem links para "Ranking", "Meus Alunos", "Meu Plano", etc.

## O que será feito

**Arquivo:** `src/components/game/MenuDrawer.tsx`

- Adicionar um item "Dashboard" com ícone de gráfico (BarChart3 do Lucide) no menu lateral
- Posicionar logo acima de "Ranking" ou como primeiro item da lista de navegação
- Usar o mesmo estilo visual dos outros links do menu

Mudança simples, uma única linha de link a ser adicionada no componente existente.
