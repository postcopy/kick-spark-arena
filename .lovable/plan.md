
# Separar Botao de Desconectar do Botao de Fechar

## Problema

O botao "DESCONECTAR" e o badge "CONECTADO" estao na mesma linha do titulo, colidindo com o botao X de fechar o dialog (canto superior direito).

## Solucao

Mover o badge de status e o botao de conexao para uma segunda linha abaixo do titulo, separando-os do botao X.

## Detalhes Tecnicos

### Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

Alterar o bloco do DialogHeader (linhas 113-147) para separar em duas linhas:

1. **Linha 1**: Apenas o titulo "CALIBRAGEM DE HARDWARE" (o botao X do dialog fica naturalmente no canto direito, sem conflito)
2. **Linha 2**: Badge de status (CONECTADO/DESCONECTADO) + botao DESCONECTAR/CONECTAR USB lado a lado

Estrutura resultante:

```
CALIBRAGEM DE HARDWARE                    [X]
[● CONECTADO]  [DESCONECTAR]
```

Apenas reorganizacao de layout -- nenhuma logica alterada.
