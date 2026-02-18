

# Fix de Layout: Modo Campeonato "Full-View" (Sem Scroll)

Refatorar o OperatorPanel para eliminar scroll vertical, compactando controles e removendo blocos redundantes.

## Alteracoes

### 1. Remover blocos redundantes (OperatorPanel.tsx)

| Bloco | Acao | Motivo |
|-------|------|--------|
| STATUS (linhas 282-307) | Remover inteiro | Ja exibido no header do ChampionshipMat (badges USB, status, round) |
| HARDWARE (linhas 309-367) | Remover inteiro | SerialPortContext global ja gerencia conexao; status USB ja aparece no header |

Isso libera ~85px de altura vertical.

### 2. Compactar CONTROLES em grid 2 colunas (OperatorPanel.tsx)

Botoes secundarios lado a lado em `grid grid-cols-2 gap-1.5`:

```text
[  INICIAR ROUND  ] (full width, h-10)
[ PAUSAR ] [ ZERAR TEMPO ]
[ T. MEDICO ] [ DESFAZER ]
[ LOGS ] [ ALT. PLACAR ]
[ ENCERRAR LUTA ] (full width, h-10)
```

Isso reduz 8 linhas verticais para ~5 linhas, economizando ~120px.

### 3. Compactar GAM-JEOM (OperatorPanel.tsx)

Colocar nome, valor e botoes +/- na mesma linha horizontal:

```text
BLUE [3] [-][+]    RED [1] [-][+]
```

Cada lado em uma unica linha em vez de duas. Remover texto explicativo inferior. Economiza ~40px.

### 4. Compactar CONFIGURACOES (OperatorPanel.tsx)

Colocar "Gerenciar Luta" e "Nova Luta" lado a lado em grid 2 colunas. Manter "Som" e "Abrir Placar TV" em largura total. Remover texto "F11" e status "2a Tela" para economizar espaco.

### 5. Container da sidebar (OperatorPanel.tsx)

Mudar o `<aside>` de `overflow-y-auto` para `h-full flex flex-col justify-between overflow-hidden`, garantindo que nao haja scroll.

## Resumo de Arquivos

| Arquivo | Mudancas |
|---------|----------|
| `src/components/championship/OperatorPanel.tsx` | Remover secoes STATUS e HARDWARE; reorganizar botoes em grid 2 colunas; compactar GAM-JEOM em linha unica; compactar CONFIGURACOES; ajustar container para overflow-hidden |

Nenhuma mudanca em ChampionshipMat.tsx -- toda a refatoracao e interna ao OperatorPanel.

## Resultado Esperado

- Todos os controles visiveis sem scroll em telas 1080p e notebooks
- ~30% de espaco vertical recuperado
- Funcionalidade 100% preservada (botoes, dialogs, props permanecem iguais)

