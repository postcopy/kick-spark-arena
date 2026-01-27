

## Plano: Otimização Definitiva de Áudio para Notebooks

### Resumo
Refatorar o sistema de áudio para eliminar atraso/jitter em notebooks fracos, removendo completamente `cloneNode()` e implementando:
- Pool round-robin calibrado para TODOS os sons
- Unlock de áudio no primeiro clique (bypass autoplay)
- Preload em batches após interação do usuário
- Estado "Preparando..." no botão (UX mínima, sem tela nova)

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSoundEffects.ts` | Substituir arquivo inteiro |
| `src/components/game/HomeScreen.tsx` | Adicionar `handleSelectMode` com unlock + preload |
| `src/components/game/SetupScreen.tsx` | Adicionar estado "Preparando..." + unlock/preload |
| `src/components/game/ArcadeSetupScreen.tsx` | Adicionar estado "Preparando..." + unlock/preload |

---

### 1. `src/hooks/useSoundEffects.ts` - SUBSTITUIR INTEIRO

**Principais mudanças:**
- Remover `audioCache` (que usava `cloneNode()`)
- Pool calibrado por frequência (`POOL_SIZES`) para TODOS os sons
- Override para evitar 404 (`victoryRed`/`Blue` -> `victory.mp3`)
- Fase 1 (mount): criar instâncias com `preload='none'`
- `unlockAudio()`: toca 1 elemento muted para desbloquear browser
- `initFullPreload()`: carrega em batches de 4 com `requestIdleCallback`
- `play()`: round-robin com seleção de instância pronta (`readyState >= 2`)
- `playWithRef()`: música de fundo usa instância dedicada
- Cleanup correto: `removeAttribute('src')` + `load()`

**Estrutura do novo arquivo:**

```text
POOL_SIZES: hit/combo=3, countdown=2, ko/victory=1
SOUND_URL_OVERRIDES: victoryRed/Blue -> victory.mp3
BG_MUSIC_SOUND = 'fightModeBg' (instância dedicada)
safeResetAudio(): pause + currentTime=0 + muted=false + playbackRate=1 + volume
pickReadyInstance(): busca instância com readyState >= 2 no pool
Fase 1: cria instâncias com preload='none', listeners de readiness
unlockAudio(): 1 elemento muted, idempotente
initFullPreload(): batches de 4 com requestIdleCallback
play(): pool round-robin, sem cloneNode
playWithRef(): bgMusic dedicada, outros usam pool
return: play, playWithRef, isMuted, toggleMute, setMuted, volume, setVolume, isLoaded, reloadSounds, unlockAudio, initFullPreload
```

---

### 2. `src/components/game/HomeScreen.tsx`

**Mudanças (linha 7):**
- Adicionar import: `import { useSound } from '@/contexts/SoundContext';`

**Mudanças (após linha 16, dentro do componente):**
```typescript
const { unlockAudio, initFullPreload } = useSound();

const handleSelectMode = (mode: GameMode) => {
  unlockAudio();
  initFullPreload();
  onSelectMode(mode);
};
```

**Mudanças nos botões:**
- Linha 82: `onClick={() => handleSelectMode('time_attack')}`
- Linha 110: `onClick={() => handleSelectMode('arcade')}`

---

### 3. `src/components/game/SetupScreen.tsx`

**Mudanças (linha 9):**
- Adicionar import: `import { useSound } from '@/contexts/SoundContext';`

**Mudanças (após linha 49, dentro do componente):**
```typescript
const { unlockAudio, initFullPreload } = useSound();
const [isPreparing, setIsPreparing] = useState(false);
```

**Modificar `handleVariantSelect` (linhas 100-107):**
```typescript
const handleVariantSelect = (v: TimeAttackVariant) => {
  unlockAudio();
  initFullPreload();
  onVariantChange?.(v);
  if (v === 'duo') {
    setStep('duration');
  } else {
    setStep('athlete');
  }
};
```

**Modificar `handleAthleteSelect` (linhas 109-112):**
```typescript
const handleAthleteSelect = (athlete: Athlete) => {
  unlockAudio();
  initFullPreload();
  onAthleteChange?.(athlete);
  setStep('duration');
};
```

**Adicionar novo handler para botão JOGAR (após linha 112):**
```typescript
const handleStart = () => {
  unlockAudio();
  initFullPreload();
  setIsPreparing(true);
  setTimeout(() => {
    setIsPreparing(false);
    onStart();
  }, 400);
};
```

**Modificar botão JOGAR (linhas 392-405):**
```typescript
<Button
  size="lg"
  onClick={handleStart}
  disabled={!canStart || isPreparing}
  className={cn(
    'w-full h-16 text-2xl font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]',
    variant === 'individual'
      ? 'bg-game-gold hover:bg-game-gold/90 text-background'
      : 'bg-game-yellow hover:bg-game-yellow/90 text-background'
  )}
>
  <Play className="mr-3 h-7 w-7" />
  {isPreparing ? 'Preparando...' : 'JOGAR!'}
</Button>
```

---

### 4. `src/components/game/ArcadeSetupScreen.tsx`

**Mudanças (linha 1):**
- Adicionar `useState` ao import: `import { useState } from 'react';`

**Mudanças (linha 2):**
- Adicionar import: `import { useSound } from '@/contexts/SoundContext';`

**Mudanças (após linha 32, dentro do componente):**
```typescript
const { unlockAudio, initFullPreload } = useSound();
const [isPreparing, setIsPreparing] = useState(false);

const handleStart = () => {
  unlockAudio();
  initFullPreload();
  setIsPreparing(true);
  setTimeout(() => {
    setIsPreparing(false);
    onStart();
  }, 400);
};
```

**Modificar botão INICIAR DUELO (linhas 134-141):**
```typescript
<Button
  size="default"
  onClick={handleStart}
  disabled={isPreparing}
  className="flex-1 gap-2 bg-game-yellow text-black hover:bg-game-yellow/90 font-bold text-base md:text-lg"
>
  <Swords className="w-4 h-4 md:w-5 md:h-5" />
  {isPreparing ? 'Preparando...' : 'INICIAR DUELO'}
</Button>
```

---

### Checklist de Eliminação de `cloneNode()`

| Local Original | Antes | Depois |
|----------------|-------|--------|
| `play()` linha 199 | `cachedAudio.cloneNode()` | Pool round-robin |
| `playWithRef()` linha 213 | `cachedAudio.cloneNode()` | bgMusic dedicada / Pool |

**Total de `cloneNode()` após implementação: 0**

---

### SoundContext.tsx - Sem Mudança Necessária

O context atual já usa `UseSoundEffectsReturn = ReturnType<typeof useSoundEffects>`, então as novas funções (`unlockAudio`, `initFullPreload`) serão automaticamente expostas quando o hook for atualizado.

---

### Fluxo Final

```text
1. App monta
   |-> Fase 1: Cria Audio com preload='none'
       |-> isLoaded = true (instantâneo, sem pico)

2. Usuário clica em modo (HomeScreen)
   |-> handleSelectMode():
       |-> unlockAudio() - 1 som muted desbloqueia browser
       |-> initFullPreload() - load em batches de 4
       |-> onSelectMode() - navegação

3. Usuário clica em JOGAR (SetupScreen/ArcadeSetupScreen)
   |-> handleStart():
       |-> unlockAudio() + initFullPreload() (idempotentes)
       |-> Mostra "Preparando..." por 400ms
       |-> onStart() - jogo inicia

4. play() durante gameplay
   |-> Busca instância com readyState >= 2 no pool
   |-> Reset seguro + play
   |-> Round-robin com módulo
   |-> Latência mínima (10-30ms)
```

---

### Métricas Esperadas

| Métrica | Antes | Depois |
|---------|-------|--------|
| `cloneNode()` | 2 lugares | 0 |
| Latência hit/combo | 50-200ms | 10-30ms |
| Primeiro play | Pode falhar (autoplay) | Garantido |
| Jitter em notebooks | Alto | Mínimo |
| Sons 404 | 2 (victoryRed/Blue) | 0 |
| Pico CPU no boot | Alto | Zero |
| Mudanças de UI | - | Apenas texto "Preparando..." |

---

### Seção Técnica

**Pool Calibrado (23 instâncias total):**
- `hit`, `hitHeavy`, `combo`: 3 cada = 9
- `countdown3/2/1/Go`, `specialReady/Attack`: 2 cada = 12
- `ko`, `timeUp`, `victory`, `victoryRed`, `victoryBlue`: 1 cada = 5
- `fightModeBg`: instância dedicada separada

**Por que `preload='none'` na Fase 1?**
- Evita fetch automático no boot
- Zero pico de CPU/rede na inicialização
- Fase 2 carrega sob demanda após interação

**Por que `pickReadyInstance()`?**
- Prefere instância com `readyState >= 2` (HAVE_CURRENT_DATA)
- Se nenhuma pronta, usa atual (não bloqueia)
- Garante menor latência possível

**Por que 400ms de "Preparando..."?**
- Tempo suficiente para 5-6 batches de 4 sons
- Total: ~24 sons = 6 batches x ~50ms cada
- Margem de segurança para notebooks lentos

