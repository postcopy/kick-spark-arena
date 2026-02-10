

# Ordem do Debounce no registerImpact

## Objetivo

Garantir que o filtro de ruido (delta < 100ms) seja a PRIMEIRA verificacao dentro de `registerImpact`, antes de qualquer logica de jogo (cor do estimulo, modo cognitivo, etc.). Isso evita que vibracoes do tatame ou ruido eletrico disparem falsos "FALTA!" no modo cognitivo.

## Mudanca

**Arquivo:** `src/hooks/useReactionState.ts` — funcao `registerImpact`

O fluxo atual ja faz o debounce antes de qualquer logica de jogo (linha 112: `if (delta < 100 || ...) return;`), pois a verificacao de cor do modo cognitivo sera adicionada DEPOIS desse guard.

Na implementacao do modo cognitivo, o codigo deve seguir estritamente esta ordem:

```text
const registerImpact = () => {
  const now = Date.now();
  const delta = now - stimulusOnTimeRef.current;

  // 1. FILTRO DE RUIDO — sempre primeiro, antes de qualquer logica
  if (delta < 100 || delta > configRef.current.flashMs + 50) return;

  // 2. Marca hit registrado
  hitRegisteredRef.current = true;

  // 3. Agora sim, logica do jogo (cognitivo ou normal)
  if (configRef.current.cognitiveMode && stimulusColorRef.current === 'red') {
    // Commission Error — chutou no vermelho
    setCommissionErrors(prev => prev + 1);
    onCommissionErrorRef.current?.();
    setStimulusActive(false);
    setStimulusColor(null);
    // Cancel flash, schedule next...
    return;
  }

  // 4. Acerto normal (verde ou modo padrao)
  setLastReactionTime(delta);
  setReactionTimes(prev => [...prev, delta]);
  setStimulusActive(false);
  // ...
};
```

Esta e apenas uma diretriz de ordenacao para quando o modo cognitivo for implementado. O guard de debounce ja existe na linha correta hoje (linha 112). A regra e: nunca inserir logica de cor/cognitivo acima dessa linha.

## Arquivos modificados
1. `src/hooks/useReactionState.ts` (diretriz aplicada na implementacao do modo cognitivo)

