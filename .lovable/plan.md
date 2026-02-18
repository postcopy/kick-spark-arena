
# Fix de Layout: Limite de Altura em Telas 4K

## Resumo

Adicionar `max-h-[500px]` ao grid dos cartoes de intensidade e `flex flex-col justify-center` ao wrapper, para travar o crescimento vertical em telas 4K e centralizar os cards na area disponivel.

---

## Arquivo Alterado

| Arquivo | Tipo |
|---------|------|
| `src/components/game/ArcadeSetupScreen.tsx` | Ajuste CSS/Tailwind (2 linhas) |

---

## Alteracoes

### 1. Wrapper dos Cards (linha 120)
- **Antes**: `flex-1 min-h-0 mb-3`
- **Depois**: `flex-1 min-h-0 mb-3 flex flex-col justify-center`
- Motivo: centraliza verticalmente os cards quando ha espaco sobrando (4K)

### 2. Grid dos Cards (linha 121)
- **Antes**: `grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 h-full`
- **Depois**: `grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 h-full max-h-[500px]`
- Motivo: trava o crescimento em 500px; em telas menores o `h-full` continua encolhendo normalmente

---

## O Que NAO Muda

- Nenhuma logica, props, callbacks
- Comportamento em laptops (< 500px de espaco disponivel = sem efeito)
- Layout horizontal (3 colunas)
