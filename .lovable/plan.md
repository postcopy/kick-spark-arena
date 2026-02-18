

# Fix: Estabilidade da Aplicacao (Remover Loading Fantasma)

## Resumo

Duas alteracoes cirurgicas para eliminar o spinner amarelo fantasma ao trocar de aba ou apos inatividade.

## Alteracoes

### 1. `src/App.tsx` — QueryClient com opcoes estáveis

Linha 22: substituir `new QueryClient()` por configuracao que desativa refetch automatico.

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24, // 24h
      retry: false,
    },
  },
});
```

### 2. `src/contexts/AuthContext.tsx` — Verificacao de sessao nao-bloqueante

O `onAuthStateChange` atual chama `checkSubscription(true)` que seta `isLoading: true` na subscription, podendo causar re-render com loading. O fix e:

- No listener `onAuthStateChange`, usar `checkSubscription(false)` em vez de `true` para mudancas posteriores (nao mostrar loading apos login inicial).
- No `initializeAuth` (getSession), manter `checkSubscription(true)` apenas na carga inicial.
- Garantir que `setIsLoading(false)` acontece antes de qualquer setTimeout, evitando que o auth loading bloqueie a UI por tempo indeterminado.

Concretamente, na linha 119 dentro de `onAuthStateChange`, mudar `checkSubscription(true)` para `checkSubscription(false)` — o loading inicial ja e coberto pelo `getSession` nas linhas 130-137.

### Arquivos alterados

- `src/App.tsx` — linha 22 (QueryClient config)
- `src/contexts/AuthContext.tsx` — linha 119 (checkSubscription false no listener)

