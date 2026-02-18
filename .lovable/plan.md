

# Refinamento: Hover Feedback nos Cards Inativos

## Resumo

Adicionar `hover:bg-white/5` ao estado inativo dos cards de intensidade para dar feedback visual de "clicavel" sem quebrar o brutalismo.

## Alteracao

### Arquivo: `src/components/game/ArcadeSetupScreen.tsx`

**Linha 91** — Adicionar `hover:bg-white/5` a classe do estado inativo:

De:
```
"bg-transparent border border-white/5 text-white/20 hover:text-white/40 hover:border-white/10"
```

Para:
```
"bg-transparent border border-white/5 text-white/20 hover:bg-white/5 hover:text-white/40 hover:border-white/10"
```

Isso e tudo. Uma unica propriedade CSS adicionada. O hover ja tem `text-white/40` e `hover:border-white/10` implementados — faltava apenas o fundo sutil.

### Arquivos alterados

- `src/components/game/ArcadeSetupScreen.tsx` — linha 91 (adicionar hover:bg-white/5)

