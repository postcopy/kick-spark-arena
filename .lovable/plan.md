

# Melhorar Visibilidade e Layout dos Controles do Operador

## Problema 1: Botoes "apagados" / pouco visiveis

Os botoes PAUSAR, ZERAR TEMPO, LOGS, ALTERAR PLACAR, DESFAZER, CALIBRAGEM, GERENCIAR LUTA e NOVA LUTA usam `bg-zinc-700` sem borda, ficando quase invisiveis no fundo escuro. Vou adicionar uma borda clara (`border border-zinc-600`) e um texto mais visivel (`text-zinc-200`) em todos esses botoes secundarios para criar contraste sem mudar o esquema de cores principal.

## Problema 2: Conteudo cortado em monitores menores

O painel tem muitas secoes empilhadas verticalmente com espacamento generoso (`p-4`, `space-y-2`, `h-12`). Vou compactar:
- Reduzir botoes de `h-12` para `h-10` na secao CONTROLES
- Reduzir padding das secoes de `p-4` para `p-3`
- Reduzir `space-y-2` para `space-y-1.5` nos botoes
- Reduzir `mb-3` dos titulos de secao para `mb-2`

## Detalhes Tecnicos

### Arquivo: `src/components/championship/OperatorPanel.tsx`

**Botoes secundarios (zinc-700)** -- adicionar borda e garantir texto claro:
- Linhas 113, 123, 158, 167, 177, 333, 345, 373, 381: adicionar `border border-zinc-600 text-zinc-200`

**Compactacao vertical**:
- Todas as `<section className="p-4 ...">` mudam para `p-3`
- Todos os `mb-3` dos titulos de secao mudam para `mb-2`
- `space-y-2` nos botoes de CONTROLES muda para `space-y-1.5`
- Botoes CONTROLES de `h-12` para `h-10`
- Botao ABRIR PLACAR TV de `h-12` para `h-10`

Nenhuma logica e alterada -- apenas classes CSS de estilo e espacamento.

