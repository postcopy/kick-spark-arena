

## Plano: Corrigir Sons Não Tocando

### Diagnóstico

Após análise detalhada, identifiquei os seguintes problemas:

1. **Ordem de preload não prioriza sons críticos**: Os hits (`hit`, `hitHeavy`, `combo`) podem não estar nos primeiros batches de preload
2. **400ms não é suficiente**: O delay de "Preparando..." não garante que os áudios estejam prontos
3. **`pickReadyInstance()` falha silenciosamente**: Quando nenhuma instância tem `readyState >= 2`, o play falha mas o erro é engolido
4. **Sons críticos não têm fallback**: Se o primeiro batch não carregar, o jogo continua sem som

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSoundEffects.ts` | Priorizar sons críticos no preload + adicionar preload imediato para hits |

---

### Solução Proposta

#### 1. Priorizar Sons Críticos no Preload

Modificar `initFullPreload()` para carregar os sons mais importantes primeiro:

```typescript
const initFullPreload = useCallback(() => {
  if (preloadStarted.current) return;
  preloadStarted.current = true;

  // PRIORIZAR sons críticos primeiro
  const criticalSounds: SoundName[] = ['hit', 'hitHeavy', 'combo', 'countdown3', 'countdown2', 'countdown1', 'countdownGo'];
  
  const criticalAudios: HTMLAudioElement[] = [];
  const otherAudios: HTMLAudioElement[] = [];
  
  audioPool.current.forEach((pool, name) => {
    if (criticalSounds.includes(name)) {
      pool.forEach(a => criticalAudios.push(a));
    } else {
      pool.forEach(a => otherAudios.push(a));
    }
  });
  
  if (bgMusicAudio.current) {
    otherAudios.push(bgMusicAudio.current);
  }

  // Carregar críticos primeiro, depois os outros
  const audios = [...criticalAudios, ...otherAudios];
  // ... resto igual
}, []);
```

#### 2. Preload Imediato para Sons Críticos

Modificar o `useEffect` inicial para pré-carregar hits IMEDIATAMENTE (não esperar clique):

```typescript
useEffect(() => {
  // Fase 1: cria instâncias
  // ... código existente ...

  // Fase 1.5: Preload IMEDIATO dos sons mais críticos (hit, hitHeavy, combo)
  // Isso não requer interação do usuário, só baixa os arquivos
  const criticalPool = audioPool.current.get('hit');
  if (criticalPool?.[0]) {
    criticalPool[0].preload = 'auto';
    criticalPool[0].load();
  }
  
  const heavyPool = audioPool.current.get('hitHeavy');
  if (heavyPool?.[0]) {
    heavyPool[0].preload = 'auto';
    heavyPool[0].load();
  }

  setIsLoaded(true);
  // ...
}, []);
```

#### 3. Melhorar o Fallback no Play

Modificar `play()` para tentar tocar mesmo se `readyState < 2`, mas logar quando isso acontecer:

```typescript
const play = useCallback((name: SoundName) => {
  if (isMuted) return;

  const pool = audioPool.current.get(name);
  if (!pool || pool.length === 0) {
    console.warn(`[Sound] Pool not found for: ${name}`);
    return;
  }

  const poolSize = pool.length;
  let idx = (poolIndex.current.get(name) ?? 0) % poolSize;

  const picked = pickReadyInstance(pool, idx);
  const audio = picked.audio;
  const chosenIdx = picked.idx;

  // Log se nenhuma instância está pronta
  if (audio.readyState < 2) {
    console.debug(`[Sound] Playing ${name} with readyState=${audio.readyState} (may be silent)`);
  }

  poolIndex.current.set(name, (chosenIdx + 1) % poolSize);

  safeResetAudio(audio, volume);
  audio.play().catch((err) => {
    console.warn(`[Sound] Failed to play ${name}:`, err.message);
  });
}, [isMuted, volume]);
```

#### 4. Aumentar Tempo de "Preparando..."

Modificar `SetupScreen.tsx` e `ArcadeSetupScreen.tsx` para dar mais tempo:

```typescript
const handleStart = () => {
  unlockAudio();
  initFullPreload();
  setIsPreparing(true);
  setTimeout(() => {
    setIsPreparing(false);
    onStart();
  }, 800); // Aumentar de 400ms para 800ms
};
```

---

### Resumo das Mudanças

| Mudança | Impacto |
|---------|---------|
| Preload imediato de 1 hit + 1 hitHeavy | Garante som no primeiro chute |
| Priorizar sons críticos no batch | Hits e countdowns carregam primeiro |
| Aumentar delay para 800ms | Mais tempo para carregar |
| Logs de debug no play() | Facilita diagnóstico |

---

### Fluxo Corrigido

```text
1. App monta
   |-> Cria pools com preload='none'
   |-> Preload IMEDIATO de hit[0] e hitHeavy[0]
   |-> isLoaded = true

2. Usuário clica em modo (HomeScreen)
   |-> unlockAudio() - 1 som muted
   |-> initFullPreload() - PRIORIZA hits e countdowns

3. Usuário clica em JOGAR (SetupScreen)
   |-> "Preparando..." por 800ms
   |-> Garante que críticos estejam prontos

4. play('hit') durante jogo
   |-> pickReadyInstance() encontra instância pronta
   |-> Som toca imediatamente
```

---

### Resultado Esperado

| Situação | Antes | Depois |
|----------|-------|--------|
| Primeiro hit | Pode não tocar | Sempre toca |
| Countdown | Pode atrasar | Carrega a tempo |
| Debug | Erros engolidos | Logs no console |
| Preload | Ordem aleatória | Críticos primeiro |

