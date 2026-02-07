

# Corrigir Hardware no Modo Campeonato (stateRef pattern)

## Problema

As funcoes `addScore`, `addGamjeom` e `addHit` dependem de `state` (que muda 10x/seg pelo timer). Isso recria os callbacks constantemente, criando janelas onde o `handleHardwareKickRef` aponta para uma versao antiga que ve `status !== 'RUNNING'` e ignora o kick.

## Correcao

Aplicar o padrao `stateRef` -- um `useRef` que sempre aponta para o state mais recente, eliminando `state` das dependencias dos `useCallback`.

## Arquivo 1: `src/hooks/useChampionshipSync.ts`

**Adicionar stateRef** (apos linha 93):
```typescript
const stateRef = useRef(state);
useEffect(() => { stateRef.current = state; }, [state]);
```

**Estabilizar `addScore`** (linhas 492-516):
- Trocar `state.status` por `stateRef.current.status`
- Trocar `state.config.scoring` por `stateRef.current.config.scoring`
- Remover `state` do array de dependencias, manter `[role, saveToHistory, broadcast]`

**Estabilizar `addGamjeom`** (linhas 518-540):
- Trocar `state.status` por `stateRef.current.status`
- Remover `state` do array de dependencias

**Estabilizar `addHit`** (linhas 628-641):
- Trocar `state.status` por `stateRef.current.status`
- Remover `state.status` do array de dependencias, manter `[role, broadcast]`

## Arquivo 2: `src/pages/ChampionshipMat.tsx`

**Adicionar log de debug** no `handleHardwareKickRef` (linha 75):
```typescript
console.log('[Championship] Kick:', side, hitType, 'status:', sync.state.status);
```

Nenhuma outra mudanca necessaria -- com `addScore` estavel, o `useEffect` que atualiza o ref ja funciona corretamente.

## O que NAO muda

- Pipeline serial (useSerialPort): intocado
- Modos Time Attack / Arcade: intocados
- Logica de impact detection: intocada
- Botoes manuais: continuam funcionando (usam o mesmo addScore, agora estavel)
- UI do placar: intocada

