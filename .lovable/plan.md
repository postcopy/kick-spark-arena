
# Adicionar Feedback ao Botao "SALVAR CONFIGURACAO"

## Problema

O botao "SALVAR CONFIGURACAO" salva os limiares internamente, mas nao da nenhum feedback visual ao usuario -- nao fecha o dialog, nao mostra mensagem de confirmacao, nada acontece.

## Solucao

No `handleSave` do arquivo `src/components/championship/DiagnosticsDialog.tsx`, adicionar:

1. Um **toast de confirmacao** (usando sonner) com mensagem "Configuracao salva com sucesso"
2. **Fechar o dialog** automaticamente apos salvar (chamando `onOpenChange(false)`)

## Detalhes Tecnicos

### Arquivo: `src/components/championship/DiagnosticsDialog.tsx`

1. Adicionar import do `toast` de `sonner`
2. Alterar o `handleSave` (linhas 100-104) para:

```typescript
const handleSave = () => {
  const thresholds: HardwareThresholds = { vestHitMin, vestPointMin, helmetHitMin, helmetPointMin };
  diagnostics.setThresholds(thresholds);
  onThresholdsApplied?.(thresholds);
  toast.success("Configuração salva com sucesso!");
  onOpenChange(false);
};
```

Apenas 2 linhas adicionadas. Nenhuma logica existente e modificada.
