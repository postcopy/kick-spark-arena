
## Plano: Corrigir Vazamento de Áudio ao Voltar ao Menu

### Problema Identificado

Quando o usuário entra no modo Duelo, inicia a contagem regressiva e clica em "Voltar" para o menu, a música de fundo continua tocando. Isso acontece porque:

1. **Música começa em `countdown === 6`** - A música é disparada no `CountdownScreen` e a referência é enviada via callback `onMusicStarted` para o `Index.tsx`
2. **Problema de timing** - Se o usuário voltar *durante* a contagem, a música já pode ter começado mas a limpeza não é garantida
3. **Nenhum botão de voltar no CountdownScreen** - Durante a contagem, o usuário não tem como voltar (exceto pela tecla ESC que chama `resetGame` mas não limpa o áudio diretamente)
4. **`handleBackToMenu` não para a música via `stopBgMusic`** - Ele usa `pause()` direto, mas isso pode não funcionar se a referência ainda não foi capturada

---

### Análise do Fluxo Atual

```text
Usuário inicia Duelo
        │
        ▼
  CountdownScreen renderiza
        │
        ▼
  countdown = 6 → playWithRef('fightModeBg')
        │                    │
        ▼                    ▼
  audio.play()        onMusicStarted(audio)
        │                    │
        ▼                    ▼
  MÚSICA TOCANDO      bgMusicRef.current = audio
        │
        ▼
  Usuário aperta ESC (ou não tem opção de voltar!)
        │
        ▼
  arcadeState.resetGame() ← Limpa timers, mas NÃO para a música!
        │
        ▼
  gameMode = null → volta pro menu
        │
        ▼
  MÚSICA AINDA TOCANDO! ← BUG
```

---

### Causa Raiz

| Problema | Local | Impacto |
|----------|-------|---------|
| `resetGame()` do arcade não para música | `useArcadeState.ts:97-113` | Ao apertar ESC durante countdown, música continua |
| `handleBackToMenu` não chama `stopBgMusic()` | `Index.tsx:171-183` | Usa `pause()` direto que pode não funcionar com fade |
| Nenhum botão de voltar no CountdownScreen | `CountdownScreen.tsx` | Usuário só pode usar ESC |
| Timer do countdown continua se usuário sair | `useArcadeState.ts:140-149` | Pode causar efeitos colaterais |

---

### Solução Proposta

#### Parte 1: Adicionar função global de parar tudo no Index.tsx

Criar uma função `stopAllGameProcesses` que:
- Para a música de fundo (com `pause()` imediato, sem fade)
- Reseta os estados dos jogos
- Limpa qualquer referência de áudio

```typescript
// Nova função centralizada
const stopAllGameProcesses = useCallback(() => {
  // 1. Parar música imediatamente (sem fade)
  if (bgMusicRef.current) {
    bgMusicRef.current.pause();
    bgMusicRef.current.currentTime = 0;
    bgMusicRef.current = null;
  }
  
  // 2. Resetar estados dos jogos (isso limpa os timers internos)
  timeAttackState.resetGame();
  arcadeState.resetGame();
  
  // 3. Resetar flags
  isNewRoundRef.current = true;
}, [timeAttackState, arcadeState]);
```

#### Parte 2: Usar `stopAllGameProcesses` no `handleBackToMenu`

```typescript
const handleBackToMenu = useCallback(() => {
  stopAllGameProcesses(); // ← Usar a nova função
  setGameMode(null);
  setTimeAttackVariant('duo');
  setSelectedAthlete(null);
}, [stopAllGameProcesses]);
```

#### Parte 3: Adicionar botão de voltar no CountdownScreen

Adicionar um botão discreto no canto superior esquerdo para permitir que o usuário volte durante a contagem:

```typescript
// CountdownScreen.tsx
interface CountdownScreenProps {
  countdown: number;
  onMusicStarted?: (audio: HTMLAudioElement) => void;
  shouldStartMusic?: boolean;
  onBack?: () => void; // NOVO
}

export function CountdownScreen({ countdown, onMusicStarted, shouldStartMusic = true, onBack }: CountdownScreenProps) {
  // ...
  
  return (
    <div className="...">
      {/* Botão de voltar */}
      {onBack && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="absolute top-4 left-4 p-3 rounded-xl bg-black/50 text-white/70 hover:bg-black/70 hover:text-white transition-all z-20"
          aria-label="Voltar ao menu"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* Resto do conteúdo... */}
    </div>
  );
}
```

#### Parte 4: Passar `handleBackToMenu` para o CountdownScreen

No `Index.tsx`, onde o `CountdownScreen` é renderizado, passar o callback:

```typescript
// Para Time Attack
case 'countdown':
  content = (
    <CountdownScreen 
      countdown={countdown} 
      onMusicStarted={handleMusicStarted}
      onBack={handleBackToMenu} // NOVO
    />
  );
  break;

// Para Arcade
case 'countdown':
  content = (
    <CountdownScreen 
      countdown={countdown} 
      onMusicStarted={handleMusicStarted} 
      shouldStartMusic={isNewRoundRef.current}
      onBack={handleBackToMenu} // NOVO
    />
  );
  break;
```

#### Parte 5: Garantir que ESC também pare tudo

Adicionar listener de ESC no Index.tsx que chama `stopAllGameProcesses`:

```typescript
// Em Index.tsx, adicionar useEffect para ESC global
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && gameMode) {
      e.preventDefault();
      stopAllGameProcesses();
      handleBackToMenu();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [gameMode, stopAllGameProcesses, handleBackToMenu]);
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Index.tsx` | Adicionar `stopAllGameProcesses`, atualizar `handleBackToMenu`, passar `onBack` para CountdownScreen, adicionar listener ESC global |
| `src/components/game/CountdownScreen.tsx` | Adicionar prop `onBack` e botão de voltar no canto |

---

### Código Detalhado

#### `src/pages/Index.tsx`

**Adicionar função `stopAllGameProcesses` (após linha 79):**

```typescript
// Stop all game processes immediately (no fade)
const stopAllGameProcesses = useCallback(() => {
  // Stop background music immediately
  if (bgMusicRef.current) {
    bgMusicRef.current.pause();
    try { bgMusicRef.current.currentTime = 0; } catch {}
    bgMusicRef.current = null;
  }
  // Reset game states (clears internal timers)
  timeAttackState.resetGame();
  arcadeState.resetGame();
  // Reset flags
  isNewRoundRef.current = true;
}, [timeAttackState, arcadeState]);
```

**Atualizar `handleBackToMenu` (linhas 171-183):**

```typescript
const handleBackToMenu = useCallback(() => {
  stopAllGameProcesses();
  setGameMode(null);
  setTimeAttackVariant('duo');
  setSelectedAthlete(null);
}, [stopAllGameProcesses]);
```

**Adicionar listener ESC global (após `handleBackToMenu`):**

```typescript
// Global ESC handler to exit game modes
useEffect(() => {
  const handleGlobalEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && gameMode) {
      e.preventDefault();
      handleBackToMenu();
    }
  };
  
  window.addEventListener('keydown', handleGlobalEscape);
  return () => window.removeEventListener('keydown', handleGlobalEscape);
}, [gameMode, handleBackToMenu]);
```

**Passar `onBack` para CountdownScreen (linhas 258-259 e 302-303):**

```typescript
// Time Attack countdown
case 'countdown':
  content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} onBack={handleBackToMenu} />;
  break;

// Arcade countdown
case 'countdown':
  content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} shouldStartMusic={isNewRoundRef.current} onBack={handleBackToMenu} />;
  break;
```

#### `src/components/game/CountdownScreen.tsx`

**Adicionar import e prop (linhas 1-11):**

```typescript
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/SoundContext';

interface CountdownScreenProps {
  countdown: number;
  onMusicStarted?: (audio: HTMLAudioElement) => void;
  shouldStartMusic?: boolean;
  onBack?: () => void;
}

export function CountdownScreen({ countdown, onMusicStarted, shouldStartMusic = true, onBack }: CountdownScreenProps) {
```

**Adicionar botão de voltar no JSX (antes do display central, ~linha 43):**

```typescript
return (
  <div className="flex items-center justify-center h-full w-full bg-background overflow-hidden relative">
    {/* Back button */}
    {onBack && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBack();
        }}
        className="absolute top-4 left-4 p-3 rounded-xl bg-black/50 text-white/70 hover:bg-black/70 hover:text-white transition-all z-20"
        aria-label="Voltar ao menu"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
    )}

    {/* Side panels preview */}
    {/* ... resto do código ... */}
  </div>
);
```

---

### Fluxo Corrigido

```text
Usuário inicia Duelo
        │
        ▼
  CountdownScreen renderiza (com botão de voltar)
        │
        ▼
  countdown = 6 → playWithRef('fightModeBg')
        │                    
        ▼                    
  MÚSICA TOCANDO              
        │
        ▼
  Usuário clica no botão ← ou aperta ESC
        │
        ▼
  handleBackToMenu()
        │
        ▼
  stopAllGameProcesses()
        ├─ bgMusicRef.current.pause() → MÚSICA PARADA ✓
        ├─ timeAttackState.resetGame() → timers limpos
        └─ arcadeState.resetGame() → timers limpos
        │
        ▼
  setGameMode(null) → volta pro menu
        │
        ▼
  SILÊNCIO ✓
```

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Música continua após ESC | Música para imediatamente |
| Não tem como voltar durante countdown | Botão de voltar disponível |
| `handleBackToMenu` usa `pause()` que pode falhar | Usa função centralizada que limpa tudo |
| ESC é tratado em cada hook separadamente | ESC global no Index.tsx garante limpeza |

---

### Seção Técnica

**Arquivos modificados:**
1. `src/pages/Index.tsx`:
   - Linha ~80: Nova função `stopAllGameProcesses`
   - Linhas 171-183: Atualizar `handleBackToMenu`
   - Após linha 183: Novo `useEffect` para ESC global
   - Linha 259: Passar `onBack={handleBackToMenu}` no CountdownScreen (Time Attack)
   - Linha 303: Passar `onBack={handleBackToMenu}` no CountdownScreen (Arcade)

2. `src/components/game/CountdownScreen.tsx`:
   - Linha 2: Adicionar import `ArrowLeft`
   - Linha 10: Adicionar prop `onBack?: () => void`
   - Linha 11: Adicionar `onBack` na desestruturação
   - Linhas 43-53: Adicionar botão de voltar no JSX

**Por que parar sem fade?**
Quando o usuário quer voltar ao menu, ele espera que tudo pare imediatamente. O fade-out é bom para transições naturais (fim de round), mas para saída explícita do usuário, parada imediata é a expectativa correta.

**Por que `e.stopPropagation()`?**
O botão de voltar está sobre o container da tela de countdown. Sem `stopPropagation()`, o clique poderia ser capturado por handlers de clique no container pai.
