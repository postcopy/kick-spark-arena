
## Plano: Buffer de Carregamento de Áudio

### Problema Identificado
A música de fundo (`fightModeBg`) é colocada no **final da fila de preload** e o sistema atual não aguarda o buffer completar antes de iniciar o countdown. Isso causa atraso/silêncio no início do jogo.

### Solução Proposta
Criar uma tela de **loading intermediária** que aguarda os áudios críticos ficarem prontos antes de iniciar o countdown.

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSoundEffects.ts` | Adicionar função `waitForAudioReady()` que retorna Promise |
| `src/contexts/SoundContext.tsx` | Expor nova função `waitForAudioReady` |
| `src/components/game/LoadingScreen.tsx` | **NOVO** - Tela de carregamento com progresso |
| `src/pages/Index.tsx` | Integrar LoadingScreen entre setup e countdown |
| `src/components/game/SetupScreen.tsx` | Simplificar - remover delay de 800ms |
| `src/components/game/ArcadeSetupScreen.tsx` | Simplificar - remover delay de 800ms |
| `src/components/game/ReactionSetupScreen.tsx` | Adicionar unlock e preload no start |

---

### Implementação

#### 1. Função `waitForAudioReady` (`useSoundEffects.ts`)

Adicionar nova função que aguarda os áudios críticos:

```typescript
const waitForAudioReady = useCallback(async (
  requiredSounds: SoundName[] = ['fightModeBg', 'hit', 'hitHeavy', 'countdown3'],
  timeoutMs: number = 5000
): Promise<boolean> => {
  // Primeiro, garantir que o preload iniciou
  if (!preloadStarted.current) {
    initFullPreload();
  }

  const audiosToWait: HTMLAudioElement[] = [];

  // Coletar áudios a aguardar
  for (const name of requiredSounds) {
    if (name === 'fightModeBg') {
      if (bgMusicAudio.current) audiosToWait.push(bgMusicAudio.current);
    } else {
      const pool = audioPool.current.get(name);
      if (pool?.[0]) audiosToWait.push(pool[0]);
    }
  }

  // Aguardar todos ficarem prontos (readyState >= 3)
  return new Promise((resolve) => {
    const startTime = Date.now();

    const check = () => {
      const allReady = audiosToWait.every(a => a.readyState >= 3);
      const elapsed = Date.now() - startTime;

      if (allReady) {
        resolve(true);
      } else if (elapsed >= timeoutMs) {
        // Timeout - prosseguir mesmo assim
        console.warn('[Audio] Timeout waiting for audio ready');
        resolve(false);
      } else {
        requestAnimationFrame(check);
      }
    };

    check();
  });
}, [initFullPreload]);
```

#### 2. Nova tela `LoadingScreen.tsx`

Tela simples com feedback visual:

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│            🎵 Carregando áudio...           │
│                                             │
│              ████████░░░░  70%              │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

Props:
```typescript
interface LoadingScreenProps {
  onReady: () => void;     // Chamado quando áudio está pronto
  onTimeout?: () => void;  // Chamado se timeout (ainda prossegue)
}
```

Lógica interna:
- Chama `waitForAudioReady()` no mount
- Mostra spinner/progress enquanto aguarda
- Chama `onReady()` quando Promise resolve
- Timeout máximo de 5 segundos (fallback)

#### 3. Novo estado no `Index.tsx`

Adicionar estado `loading` entre `setup` e `countdown`:

```typescript
// Novo fluxo:
// setup -> loading -> countdown -> running -> finished

// Handler quando loading completa
const handleLoadingComplete = useCallback(() => {
  if (gameMode === 'time_attack') {
    timeAttackState.startCountdown();
  } else if (gameMode === 'arcade') {
    arcadeState.startCountdown();
  } else if (gameMode === 'reaction') {
    reactionState.startCountdown();
  }
}, [gameMode, timeAttackState, arcadeState, reactionState]);

// Novo case no switch
case 'loading':
  content = <LoadingScreen onReady={handleLoadingComplete} />;
  break;
```

#### 4. Simplificar Setup Screens

Remover o delay de 800ms e estado `isPreparing`:

**Antes (SetupScreen.tsx):**
```typescript
const handleStart = () => {
  unlockAudio();
  initFullPreload();
  setIsPreparing(true);
  setTimeout(() => {
    setIsPreparing(false);
    onStart();
  }, 800);
};
```

**Depois:**
```typescript
const handleStart = () => {
  unlockAudio();
  initFullPreload();
  onStart(); // Vai para 'loading' state
};
```

O loading real acontece na `LoadingScreen`, não mais como delay fixo.

#### 5. Atualizar GameState

Adicionar `'loading'` ao tipo:

```typescript
export type GameState = 'idle' | 'setup' | 'loading' | 'countdown' | 'running' | 'paused' | 'finished' | 'round_end';
```

#### 6. Atualizar hooks de estado

Cada hook (`useGameState`, `useArcadeState`, `useReactionState`) precisa:
- Adicionar `goToLoading()` que seta estado para `'loading'`
- O `startCountdown()` só é chamado após loading completar

---

### Fluxo Visual

```text
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌───────────┐    ┌─────────┐
│  SETUP  │───▶│ LOADING │───▶│COUNTDOWN│───▶│  RUNNING  │───▶│FINISHED │
└─────────┘    └─────────┘    └─────────┘    └───────────┘    └─────────┘
    │              │
    │              │ waitForAudioReady()
    │              │ (máx 5s timeout)
    │              │
    └──────────────┘
       unlockAudio()
       initFullPreload()
```

---

### Prioridade de Carregamento

O `waitForAudioReady` aguarda por padrão:
1. `fightModeBg` - Música de fundo (mais pesada)
2. `hit` - Som de golpe básico
3. `hitHeavy` - Som de golpe forte
4. `countdown3` - Primeiro som do countdown

Para o modo Reação (sem música), pode passar lista vazia ou só hits.

---

### Considerações

**Timeout fallback:**
- Se após 5 segundos os áudios não estiverem prontos, prossegue mesmo assim
- Isso evita travamento em conexões muito lentas
- Console warning é logado para debug

**Progresso visual:**
- Mostrar % aproximado baseado em `readyState` dos áudios
- Transição suave de 0% a 100%

**Modo Reação:**
- Não usa música de fundo atualmente
- Loading pode ser mais rápido (aguarda apenas hits/countdown)

---

### Resultado Esperado

1. Usuário clica "JOGAR" → tela de loading aparece imediatamente
2. Barra de progresso mostra carregamento do áudio
3. Quando pronto (ou após timeout), countdown inicia
4. Música toca sem delay/falhas
5. Experiência mais profissional e previsível
