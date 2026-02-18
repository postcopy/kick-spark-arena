
# Fix: Fluxo de Conexao Inteligente (Auto-Open)

## Resumo

Refatorar a funcao `connect()` para tentar reusar portas ja autorizadas antes de abrir o pop-up do navegador, e garantir que `isAutoConnecting` seja sempre resetado corretamente.

## Alteracoes

### 1. `src/hooks/useSerialPort.ts` -- Funcao `connect()` (linhas 335-374)

Refatorar para duas etapas:

- **Etapa A (silenciosa):** Chamar `getPorts()`. Se houver porta conhecida:
  - Se `port.readable || port.writable` -> reusar diretamente (setar `isConnected=true`, chamar `startReading`)
  - Senao -> tentar `port.open()`. Se der `InvalidStateError` e `port.readable` existir, reusar mesmo assim
- **Etapa B (manual):** Somente se nenhuma porta conhecida for encontrada ou reusada, chamar `requestPort()` (pop-up)

```text
connect():
  1. getPorts() -> portas conhecidas?
     SIM -> porta.readable? -> reusar (isConnected=true)
            senao -> try open() -> sucesso -> isConnected=true
                                -> erro InvalidState + readable -> reusar
     NAO -> requestPort() (pop-up) -> open() -> isConnected=true
```

### 2. `src/hooks/useSerialPort.ts` -- Auto-reconnect (linhas 376-418)

- No bloco catch do auto-reconnect (linha 401), adicionar verificacao: se o erro for `InvalidStateError` e `port.readable` existir, considerar como conectado em vez de falhar silenciosamente
- No cleanup do useEffect (linhas 415-417), adicionar `setIsAutoConnecting(false)` antes de `disconnect()` para evitar travamento da UI

```text
// Cleanup corrigido:
return () => {
  setIsAutoConnecting(false);
  disconnect();
};
```

### 3. `src/components/game/EquipmentSetupScreen.tsx` -- Sem alteracoes

A tela ja trata corretamente todos os estados (`isAutoConnecting`, `isConnecting`, `isConnected`). O checklist terminal, os botoes e o link "Pular" ja respondem a essas flags. Nenhuma alteracao necessaria neste arquivo.
