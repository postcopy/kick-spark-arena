
# Fluxo Rapido de Rotacao de Alunos

## Problema Atual
O botao "Trocar Atleta" no `ReactionFinishedScreen` chama `handleBackToMenu()`, que reseta o `gameMode` para `null` e volta para a Home. Isso quebra o fluxo de rotacao em aula -- o treinador precisa re-selecionar o modo Reacao e re-configurar dificuldade toda vez.

## Solucao

### 1. Index.tsx -- Novo callback `handleSwitchAthlete`
Alterar o `onSwitchAthlete` no bloco `reaction > finished` (linhas 469-473) para:
- Limpar `selectedAthlete` (null) e `isGuest` (false)
- Chamar `reactionState.goToSetup()` para voltar ao `ReactionSetupScreen`
- **Nao** chamar `handleBackToMenu()` (manter `gameMode = 'reaction'`)

Codigo resultante:
```
onSwitchAthlete={() => {
  setSelectedAthlete(null);
  setIsGuest(false);
  reactionState.goToSetup();
}}
```

### 2. ReactionFinishedScreen.tsx -- Destaque visual no botao "Trocar"
Atualmente o botao "Trocar" usa `variant="outline"`. Vamos torna-lo mais visivel:
- Mudar para uma borda branca/clara com fundo sutil para se destacar como acao principal de rotacao
- Usar classes como `border-white/60 bg-white/10 hover:bg-white/20 text-white` para destaque sem competir com o botao verde "REPETIR"
- Manter o icone `UserRoundCog` e o texto "Trocar"

## Secao Tecnica

### Arquivos modificados
1. **`src/pages/Index.tsx`** (linhas 469-473) -- substituir `handleBackToMenu()` por `reactionState.goToSetup()`
2. **`src/components/game/ReactionFinishedScreen.tsx`** (linha 204) -- atualizar classes do botao "Trocar" para destaque visual

### Fluxo atualizado
```text
ReactionFinishedScreen
  [Trocar Atleta] --> ReactionSetupScreen (athlete=null, isGuest=false, config mantida)
                      Botao INICIAR bloqueado ate selecionar proximo aluno
  [Ajustar]       --> ReactionSetupScreen (athlete mantido, config editavel)
  [REPETIR]       --> Replay imediato (mesmo atleta, mesma config)
```
