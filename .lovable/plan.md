
## Plano: Preload Antecipado da Música de Fundo

### Problema Identificado
A música de fundo (`fightModeBg`) está sendo colocada no **final da fila de preload** e só começa a baixar quando o usuário já está na `LoadingScreen`. Isso causa delay na primeira vez porque:

1. Os sons críticos (hit, combo, countdown) carregam primeiro
2. A música de fundo só começa depois (em batches de 4)
3. Com um arquivo de maior qualidade, precisa de mais tempo

### Solução
**Priorizar a música de fundo no início do preload** para que comece a baixar assim que o usuário iniciar qualquer interação (seleção de modo/duração).

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSoundEffects.ts` | Mover `fightModeBg` para o início do preload |
| `src/components/game/LoadingScreen.tsx` | Melhorar feedback e timeout |

---

### Implementação

#### 1. Reordenar prioridade no `initFullPreload()` (`useSoundEffects.ts`)

**Antes (linha 242):**
```typescript
const criticalSounds: SoundName[] = ['hit', 'hitHeavy', 'combo', 'countdown3', 'countdown2', 'countdown1', 'countdownGo'];
```

**Depois:**
```typescript
// fightModeBg PRIMEIRO - é o maior arquivo e precisa de mais tempo
const criticalSounds: SoundName[] = ['fightModeBg', 'hit', 'hitHeavy', 'countdown3'];
```

A música de fundo entrará no **primeiro batch de 4** ao invés do último.

#### 2. Iniciar preload imediatamente na fase 1 (`useSoundEffects.ts`)

Adicionar preload automático da música de fundo junto com os hits críticos (linha 167-179):

```typescript
// Fase 1.5: Preload IMEDIATO dos sons mais críticos
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

// NOVO: Também iniciar preload da música de fundo
if (bgMusicAudio.current) {
  bgMusicAudio.current.preload = 'auto';
  bgMusicAudio.current.load();
}
```

#### 3. Melhorar feedback na LoadingScreen

Ajustar a mensagem para indicar progresso mais granular:

```typescript
// Mensagem mais informativa
<p className="text-muted-foreground">
  {isComplete 
    ? 'Iniciando...' 
    : progress < 50 
      ? 'Baixando música de fundo...'
      : 'Finalizando carregamento...'
  }
</p>
```

---

### Fluxo Otimizado

```text
┌─────────────────┐
│  Usuário Logado │
└────────┬────────┘
         │ (Imediatamente)
         ▼
┌─────────────────────────┐
│  PRELOAD AUTOMÁTICO     │
│  - hit.mp3              │
│  - hitHeavy.mp3         │
│  - fightModeBg.mp3  ◄── │  NOVO!
└────────┬────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────┐
│  Seleção Modo   │───▶│ initFull    │
└────────┬────────┘    │ Preload     │
         │             └──────┬──────┘
         ▼                    │
┌─────────────────┐           │ (música já baixando)
│  Loading Screen │◄──────────┘
│  [████████░░] 80% │
└────────┬────────┘
         │ (readyState >= 3)
         ▼
┌─────────────────┐
│    COUNTDOWN    │
└─────────────────┘
```

---

### Resultado Esperado

1. **Primeira vez**: A música começa a baixar assim que a página carrega
2. **LoadingScreen**: Já encontra a música parcialmente ou totalmente carregada
3. **Menos tempo de espera**: O delay visível será muito menor
4. **Próximas vezes**: Música em cache, carrega instantaneamente
