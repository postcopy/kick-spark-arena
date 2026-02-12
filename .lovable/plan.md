

# Adicionar botao de voltar no modo Campeonato

## Problema
A tela `/championship/mat` nao tem nenhum botao para voltar a tela inicial (HomeScreen), obrigando o usuario a usar o botao do navegador ou digitar a URL manualmente.

## Solucao
Adicionar um botao de voltar no header da tela, ao lado do logo, usando `useNavigate` do React Router para redirecionar para `/`.

## Arquivo
`src/pages/ChampionshipMat.tsx`

## Alteracoes

### 1. Import
- Adicionar `useNavigate` de `react-router-dom`
- Adicionar icone `ArrowLeft` de `lucide-react`

### 2. Dentro do componente `ChampionshipMatInner`
- Criar `const navigate = useNavigate()`

### 3. No header (area do logo)
- Adicionar um botao com icone `ArrowLeft` antes do logo existente
- Ao clicar, navega para `/` com `navigate('/')`
- Se a luta estiver em andamento (status RUNNING), mostrar um dialogo de confirmacao antes de sair para evitar perda de dados

## Resultado
O usuario tera um botao visivel no canto superior esquerdo para retornar a tela de selecao de modos a qualquer momento.

