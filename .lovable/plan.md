
# Remover Logo do Header na HomeScreen

## Resumo

Remover a logo `S-Fighter` do canto superior esquerdo do header, ja que ela agora esta centralizada no conteudo principal da tela.

## Alteracao

### Arquivo: `src/components/game/HomeScreen.tsx`

- **Remover** o `<img src={logoSfighter}>` do header (linhas 95-99)
- O header continuara existindo com o nome do usuario e o MenuDrawer no lado direito
- A logo centralizada no `<main>` permanece inalterada
