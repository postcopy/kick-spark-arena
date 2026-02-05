
# Corrigir Reconhecimento da Placa no Modo Campeonato

## Problema Identificado

O callback `handleHardwareKick` no ChampionshipMat.tsx esta capturando uma versao desatualizada de `sync.state.status`. Quando a luta inicia e o status muda para `'RUNNING'`, o callback ainda verifica a versao antiga do estado.

### Codigo Atual com Problema

```tsx
const handleHardwareKick = useCallback((side: Side, hitType: HitType) => {
  // BUG: sync.state.status esta desatualizado dentro desta closure!
  if (sync.state.status !== 'RUNNING') return;
  
  const matchSide: MatchSide = side === 'red' ? 'RED' : 'BLUE';
  const scoreType: ScoreType = hitType === 'helmet' ? 'HEAD' : 'BODY';
  
  sync.addScore(matchSide, scoreType);
}, [sync]); // sync e um objeto estavel, nao muda mesmo quando state.status muda
```

### Por Que Funciona nos Outros Modos?

Nos modos time_attack e arcade, o callback nao verifica o estado diretamente - ele delega para `registerKick()` que tem acesso ao estado atualizado internamente:

```tsx
// Index.tsx - funciona porque registerKick verifica estado internamente
const handleSerialKick = useCallback((side: Side, hitType: HitType) => {
  if (gameMode === 'arcade') {
    arcadeState.registerKick(side, hitType); // registerKick verifica estado atualizado
  }
}, [gameMode, arcadeState]);
```

---

## Solucao

Usar uma **ref** para armazenar a funcao de callback, permitindo que ela sempre use a versao mais recente do estado. Este e o mesmo padrao usado no Index.tsx (veja linhas 67-85).

### ChampionshipMat.tsx - Modificacoes

**Adicionar import de useRef:**
```tsx
import { useState, useRef, useEffect, useCallback } from 'react';
```

**Criar ref para o callback:**
```tsx
// Ref para manter callback atualizado
const handleHardwareKickRef = useRef<(side: Side, hitType: HitType) => void>(() => {});

// Atualizar ref quando estado muda
useEffect(() => {
  handleHardwareKickRef.current = (side: Side, hitType: HitType) => {
    // Agora sync.state.status esta sempre atualizado
    if (sync.state.status !== 'RUNNING') return;
    
    const matchSide: MatchSide = side === 'red' ? 'RED' : 'BLUE';
    const scoreType: ScoreType = hitType === 'helmet' ? 'HEAD' : 'BODY';
    
    sync.addScore(matchSide, scoreType);
  };
}, [sync.state.status, sync.addScore]);

// Callback wrapper que chama a ref
const handleHardwareKick = useCallback((side: Side, hitType: HitType) => {
  handleHardwareKickRef.current(side, hitType);
}, []);
```

---

## Diagrama do Problema

```text
ANTES (BUG):
+-------------------+     +-------------------+
| useSerialPort     |     | handleHardwareKick|
| onKickRef.current |--->| status = 'IDLE'   | <-- Closure captura valor antigo
+-------------------+     +-------------------+
                                   |
                                   v
                          if (status !== 'RUNNING')
                              return; // SEMPRE RETORNA!

DEPOIS (FIX):
+-------------------+     +-------------------+     +-----------------------+
| useSerialPort     |     | handleHardwareKick|     | handleHardwareKickRef |
| onKickRef.current |--->| wrapper estavel   |--->| status = sync.state   |
+-------------------+     +-------------------+     +-----------------------+
                                                            |
                                                            v
                                                   if (status !== 'RUNNING')
                                                       // Verifica valor atual!
```

---

## Arquivo a Modificar

**src/pages/ChampionshipMat.tsx**

Substituir o bloco de handleHardwareKick (linhas 41-56) pelo novo codigo com useRef + useEffect.

---

## Validacao

Apos a correcao:
1. Abrir modo campeonato
2. Conectar placa USB
3. Iniciar round (status = RUNNING)
4. Golpear equipamento
5. Verificar que pontos sao registrados

O problema original era que os chutes da placa eram **ignorados** porque o callback verificava `status !== 'RUNNING'` mas a closure tinha o valor antigo `'IDLE'`.
