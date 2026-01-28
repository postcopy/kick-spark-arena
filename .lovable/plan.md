

## Plano: Restaurar SFX de Hits em Todos os Modos

### Diagnóstico

Após análise do código, o fluxo de som para hits está correto em teoria:

1. `Index.tsx` passa `onHit: () => play('hit')` para os hooks
2. `useGameState.ts` e `useArcadeState.ts` chamam `config.onHit?.()` / `onHit?.()` em `registerKick()`
3. Arquivos `hit.mp3` e `hit-heavy.mp3` existem em `public/sounds/`

**Problema Provável**: O callback `onHit` pode estar sendo capturado com uma versão stale do `play` devido à dependência do `useCallback`. Quando o hook é criado, o `play` é capturado, mas se o estado de áudio não estiver pronto ou mudar posteriormente, o callback continua usando a versão antiga.

---

### Solução

Modificar a forma como os sons são tocados nos hooks, movendo a responsabilidade de tocar som diretamente para os componentes que renderizam a tela de jogo, ou garantir que os callbacks são sempre atualizados.

#### Opção A: Usar refs para garantir callbacks atualizados (Recomendada)

**Arquivos a modificar:**
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Index.tsx` | Usar `useRef` para os callbacks de som, garantindo versão mais recente |

**Código:**
```typescript
// Criar refs para os callbacks de som
const playHitRef = useRef(() => play('hit'));
const playHitHeavyRef = useRef(() => play('hitHeavy'));

// Manter refs atualizadas
useEffect(() => {
  playHitRef.current = () => play('hit');
  playHitHeavyRef.current = () => play('hitHeavy');
}, [play]);

// Usar nos hooks
const timeAttackState = useGameState({
  duration, 
  minIntervalMs: 120,
  onHit: () => playHitRef.current(),
  // ...
});

const arcadeState = useArcadeState({ 
  // ...
  onHit: () => playHitRef.current(),
  onHitHeavy: () => playHitHeavyRef.current(),
  // ...
});
```

#### Opção B: Adicionar logs de debug para diagnóstico

Se a opção A não resolver, adicionar logs temporários:

**Arquivo: `src/hooks/useGameState.ts`**
```typescript
// No registerKick, antes de chamar onHit:
console.log('[GameState] registerKick called, about to play hit');
config.onHit?.();
```

**Arquivo: `src/hooks/useSoundEffects.ts`**
```typescript
// No play():
console.log(`[Sound] play() called for: ${name}, isMuted: ${isMuted}`);
```

---

### Implementação Detalhada

#### 1. `src/pages/Index.tsx` (linhas 36, 57-64, 83-99)

**Adicionar refs após a declaração de `play`:**
```typescript
const { play } = useSound();

// Refs para manter callbacks de som sempre atualizados
const playHitRef = useRef(() => play('hit'));
const playHitHeavyRef = useRef(() => play('hitHeavy'));
const playComboRef = useRef(() => play('combo'));
const playSpecialReadyRef = useRef(() => play('specialReady'));
const playSpecialAttackRef = useRef(() => play('specialAttack'));
const playKORef = useRef(() => play('ko'));
const playTimeUpRef = useRef(() => play('timeUp'));

// Manter refs sincronizadas com a versão mais recente de play
useEffect(() => {
  playHitRef.current = () => play('hit');
  playHitHeavyRef.current = () => play('hitHeavy');
  playComboRef.current = () => play('combo');
  playSpecialReadyRef.current = () => play('specialReady');
  playSpecialAttackRef.current = () => play('specialAttack');
  playKORef.current = () => play('ko');
  playTimeUpRef.current = () => play('timeUp');
}, [play]);
```

**Atualizar `useGameState`:**
```typescript
const timeAttackState = useGameState({
  duration, 
  minIntervalMs: 120,
  onHit: () => playHitRef.current(),
  onGameEnd: () => playTimeUpRef.current(),
  isIndividual: timeAttackVariant === 'individual',
  selectedAthlete: timeAttackVariant === 'individual' ? selectedAthlete : null,
});
```

**Atualizar `useArcadeState`:**
```typescript
const arcadeState = useArcadeState({ 
  roundDurationSec: roundDuration, 
  bestOf,
  vestDamage,
  helmetDamage,
  onHit: () => playHitRef.current(),
  onHitHeavy: () => playHitHeavyRef.current(),
  onCombo: () => playComboRef.current(),
  onSpecialReady: () => playSpecialReadyRef.current(),
  onSpecialAttack: () => playSpecialAttackRef.current(),
  onKO: () => playKORef.current(),
  onTimeUp: () => playTimeUpRef.current(),
  onRoundEnd: () => {
    stopBgMusic();
    isNewRoundRef.current = true;
  },
});
```

---

### Por que isso resolve?

O `useCallback` nos hooks (`useGameState`, `useArcadeState`) memoriza os callbacks baseado nas dependências. Se `play` mudar (por exemplo, após o unlock do áudio ou mudança de volume), o callback `onHit` antigo pode ainda estar referenciando a versão antiga de `play`.

Usando refs, garantimos que ao chamar `playHitRef.current()`, sempre executamos a versão mais recente da função `play`.

---

### Resultado Esperado

- Sons de hit tocarão corretamente em todos os modos (Time Attack duo/individual, Arcade/Duelo)
- Sons de combo, especial, K.O. e time up também funcionarão consistentemente

---

### Seção Técnica

**Padrão utilizado:** "Latest Ref Pattern"
- Refs em React não causam re-renders quando atualizadas
- `useEffect` sincroniza a ref sempre que `play` muda
- O callback passado ao hook sempre executa a versão mais recente via `ref.current()`

**Imports necessários:**
```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
```

