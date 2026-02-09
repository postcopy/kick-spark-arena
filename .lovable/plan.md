
# Ajuste do Gam-jeom para regras WT

## Diagnostico

Apos analisar o codigo, a logica de gam-jeom **ja esta correta** para os itens 1 e 2:
- Adicionar gam-jeom ja adiciona +1 ao adversario (penalidade cruzada)
- Remover gam-jeom ja subtrai -1 do adversario

O que precisa mudar:

## Mudancas

### 1. Alterar o limite padrao de 10 para 5 (`src/types/championship.ts`)
- Mudar `maxGamjeom: 10` para `maxGamjeom: 5` no `DEFAULT_MATCH_CONFIG`

### 2. Melhorar a mensagem de limite de faltas (`src/hooks/useChampionshipSync.ts`)
- Trocar as mensagens de `"Limite de Gam-jeom! Azul vence o round"` e `"Limite de Gam-jeom! Vermelho vence o round"` para incluir **"Vitoria por Limite de Faltas (PUN)"** conforme solicitado

### Arquivos modificados
1. `src/types/championship.ts` - maxGamjeom de 10 para 5
2. `src/hooks/useChampionshipSync.ts` - mensagens do evento GAMJEOM_LIMIT

### Nota
As regras 1 (penalidade cruzada) e 2 (desfazer) ja estao funcionando corretamente, conforme verificado no teste anterior.
