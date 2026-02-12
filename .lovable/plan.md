

# Redesign: Tela de Resultado do Treino de Reacao (Full Screen)

## Problema
A tela de resultado tem muito espaco vazio na parte inferior e as informacoes (grafico, cards de stats) estao pequenas, limitadas a `max-w-lg` (~32rem). Em telas grandes, o conteudo fica concentrado no topo com metade da tela vazia.

## Solucao
Expandir o layout para preencher toda a tela, usando `flex-1` para distribuir o espaco verticalmente e removendo o `max-w-lg` restritivo. O grafico e os cards crescerao para ocupar o espaco disponivel.

## Arquivo
`src/components/game/ReactionFinishedScreen.tsx` (unico arquivo)

## Alteracoes

### 1. Header -- tipografia maior
- Titulo "TREINO COMPLETO!": de `text-2xl md:text-3xl` para `text-3xl md:text-4xl`
- Icones Trophy: de `w-7 h-7` para `w-8 h-8`
- Nivel: de `text-sm` para `text-base`

### 2. Area principal -- expandir para preencher a tela
- Container `main`: remover `items-center` fixo, adicionar `justify-center` para centralizar verticalmente quando ha espaco
- Grafico: de `max-w-lg h-48 md:h-56` para `max-w-3xl h-[30vh] min-h-[200px]` -- ocupa 30% da altura da tela
- Stats grid: de `max-w-lg` para `max-w-3xl`
- Cards de stats: padding de `p-4` para `p-5 md:p-6`, valores de `text-2xl md:text-3xl` para `text-3xl md:text-4xl`, labels de `text-xs` para `text-sm`

### 3. Footer -- botoes maiores
- Container: de `max-w-lg` para `max-w-3xl`
- Botoes: de `py-5` para `py-6`, texto maior

### 4. Sub-componentes StandardStatsGrid, CognitiveStatsGrid, NoHardwareStatsGrid
- Aumentar padding, tamanho de fonte dos valores e labels em todos os cards
- Icones: de `w-4 h-4` para `w-5 h-5`

## Resultado esperado
O conteudo se distribui verticalmente por toda a tela: header compacto no topo, grafico grande no centro, 4 cards de stats preenchendo a largura, e footer com botoes na base. Sem espacos vazios grandes.

