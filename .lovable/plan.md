

# Auto-Pause Inteligente no Gam-jeom

## Resumo

Duas mudancas simples para permitir que o Gam-jeom seja aplicado tanto com o timer rodando (auto-pause) quanto ja pausado.

## Mudancas

### 1. `src/components/championship/OperatorPanel.tsx` — Habilitar botao [+] em RUNNING e PAUSED

- Linha 90: Trocar `const canAddGamjeom = isRunning;` para `const canAddGamjeom = isRunning || state.status === 'PAUSED';`
- Atualizar as classes CSS dos botoes para refletir o novo estado habilitado (ja usam `canAddGamjeom`, entao funciona automaticamente)

### 2. `src/hooks/useChampionshipSync.ts` — Logica hibrida no `addGamjeom`

- Linha 527: Trocar `if (s.status !== 'RUNNING') return;` para `if (s.status !== 'RUNNING' && s.status !== 'PAUSED') return;`
- Dentro do `setState` (linhas 534-545), adicionar:
  - Verificar `prev.status === 'RUNNING'` para decidir se faz auto-pause
  - Se RUNNING: setar `status: 'PAUSED'` e adicionar evento extra `TIMER_PAUSE` ("Auto-pause: Gam-jeom aplicado")
  - Se PAUSED: manter status, registrar apenas o evento de Gam-jeom

```typescript
setState(prev => {
  const isRunning = prev.status === 'RUNNING';
  const newState: MatchState = {
    ...prev,
    status: isRunning ? 'PAUSED' : prev.status,
    gamjeomRed: side === 'RED' ? prev.gamjeomRed + 1 : prev.gamjeomRed,
    gamjeomBlue: side === 'BLUE' ? prev.gamjeomBlue + 1 : prev.gamjeomBlue,
    roundScoreRed: side === 'BLUE' ? prev.roundScoreRed + 1 : prev.roundScoreRed,
    roundScoreBlue: side === 'RED' ? prev.roundScoreBlue + 1 : prev.roundScoreBlue,
    events: [
      createEvent('GAMJEOM', `GAM-JEOM ${sideLabel} (+1 ponto ${opponentLabel})`, side, 1),
      ...(isRunning ? [createEvent('TIMER_PAUSE', 'Auto-pause: Gam-jeom aplicado')] : []),
      ...prev.events
    ].slice(0, MAX_EVENTS),
  };
  broadcast(newState, true);
  return newState;
});
```

### Arquivos modificados
1. `src/hooks/useChampionshipSync.ts` — guard e logica auto-pause no `addGamjeom`
2. `src/components/championship/OperatorPanel.tsx` — habilitar botao [+] em PAUSED

### Comportamento esperado
- **Timer RUNNING + clique [+]**: Pausa automatica, aplica falta, log de auto-pause
- **Timer PAUSED + clique [+]**: Aplica falta sem mudar status, sem log extra
- **Botao [-]**: Continua funcionando apenas em PAUSED (sem mudanca)

