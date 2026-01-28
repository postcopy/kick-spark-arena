
# Plano Revisado: Modo de Treino de Reação Visual

## Ajustes Incorporados

### 1. BlockPlan com suporte a tempo
```typescript
export interface BlockConfig {
  mode: 'rounds' | 'time';
  rounds?: number;      // Se mode === 'rounds'
  durationSec?: number; // Se mode === 'time'
  restSec: number;
}
```

### 2. NO_GO sem duplicação
- `drillType === 'goNoGo'` → usa cueSet `['GO', 'NO_GO']`, ignora `noGoRate`
- Outros drills → `noGoRate` pode injetar um `NO_GO` override (não entra no cueSet)

### 3. twoStep conta 2 cues
- Cada par (lado + altura) conta como **2 estímulos exibidos**
- Simplifica progresso e distribuição

### 4. Hooks de som preparados
- Adicionar novos sons ao `SoundName` type
- Criar callbacks no hook: `onCueShow`, `onCueHide`, `onSessionStart`, `onSessionEnd`, `onBlockRest`
- Sons serão conectados depois (arquivos ainda não existem)

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/types/reaction.ts` | Tipos com BlockConfig atualizado |
| `src/hooks/useReactionState.ts` | Engine com ajustes |
| `src/components/game/ReactionSetupScreen.tsx` | Tela de configuração |
| `src/components/game/ReactionScreen.tsx` | Tela de treino |
| `src/components/game/ReactionFinishedScreen.tsx` | Relatório + RPE |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/types/game.ts` | Adicionar `'reaction'` ao GameMode |
| `src/pages/Index.tsx` | Orquestração do novo modo |
| `src/components/game/HomeScreen.tsx` | Botão do modo reação |
| `src/hooks/useSoundEffects.ts` | Novos SoundName para reação |

---

## 1. Tipos Atualizados (`src/types/reaction.ts`)

```typescript
export type ReactionCue = 
  | 'L' | 'R'
  | 'HEAD' | 'BODY'
  | 'FRONT_LEG' | 'BACK_LEG'
  | 'GO' | 'NO_GO'
  | 'COUNTER' | 'CUT' | 'SPIN' | 'FAKE';

export type DrillType = 
  | 'single'
  | 'twoStep'
  | 'octagon'
  | 'goNoGo'
  | 'ruleSwitch';

export type RuleMode = 'normal' | 'inverted' | 'alternating';
export type LevelPreset = 'beginner' | 'intermediate' | 'advanced';

// AJUSTE 1: BlockConfig com modo tempo/rounds
export interface BlockConfig {
  mode: 'rounds' | 'time';
  rounds?: number;
  durationSec?: number;
  restSec: number;
}

export interface ReactionConfig {
  levelPreset: LevelPreset;
  drillType: DrillType;
  cueSet: ReactionCue[];      // NÃO inclui NO_GO aqui (exceto goNoGo drill)
  cueDurationMs: number;
  gapMinMs: number;
  gapMaxMs: number;
  noGoRate: number;           // 0-100, ignorado se drillType === 'goNoGo'
  sessionMode: 'time' | 'rounds';
  totalTimeSec?: number;
  totalRounds?: number;
  blockPlan?: BlockConfig[];
  ruleMode: RuleMode;
  ruleSwitchEveryN?: number;
}

export interface CueDisplay {
  cue: ReactionCue;
  position?: number;   // 0-7 para octagon
  isNoGo: boolean;     // true = não reagir
  step?: 1 | 2;        // Para twoStep
}

export interface ReactionSessionResult {
  mode: 'reaction';
  config: ReactionConfig;
  totalCues: number;          // AJUSTE 3: twoStep conta 2
  cueDistribution: Record<string, number>;
  noGoCount: number;
  blocksCompleted: number;
  totalDurationSec: number;
  averageGapMs: number;
  rpe?: number;
  timestamp: number;
}

// AJUSTE 4: Callbacks para sons
export interface ReactionSoundCallbacks {
  onCueShow?: (cue: CueDisplay) => void;
  onCueHide?: () => void;
  onSessionStart?: () => void;
  onSessionEnd?: (result: ReactionSessionResult) => void;
  onBlockRest?: (blockNumber: number) => void;
  onCountdown?: (count: number) => void;
}
```

---

## 2. Engine (`src/hooks/useReactionState.ts`)

### Shuffle-Bag com anti-repetição
```typescript
function createShuffleBag<T>(items: T[]): T[] {
  const bag = [...items];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function getNextFromBag<T>(
  bag: T[], 
  lastItem: T | null, 
  originalItems: T[]
): { item: T; newBag: T[] } {
  let newBag = [...bag];
  
  if (newBag.length === 0) {
    newBag = createShuffleBag(originalItems);
  }
  
  let item = newBag.pop()!;
  
  // Evita repetir o último
  if (item === lastItem && newBag.length > 0) {
    const swap = newBag.pop()!;
    newBag.push(item);
    item = swap;
  }
  
  return { item, newBag };
}
```

### NO_GO Logic (Ajuste 2)
```typescript
function determineNextCue(
  config: ReactionConfig,
  bag: ReactionCue[],
  lastCue: ReactionCue | null
): { cue: CueDisplay; newBag: ReactionCue[] } {
  
  // Drill Go/No-Go: usa cueSet diretamente (GO/NO_GO)
  if (config.drillType === 'goNoGo') {
    const { item, newBag } = getNextFromBag(bag, lastCue, config.cueSet);
    return {
      cue: {
        cue: item,
        isNoGo: item === 'NO_GO',
        position: config.drillType === 'octagon' ? randomPosition() : undefined,
      },
      newBag,
    };
  }
  
  // Outros drills: noGoRate pode injetar NO_GO
  const isNoGoOverride = Math.random() * 100 < config.noGoRate;
  
  if (isNoGoOverride) {
    return {
      cue: {
        cue: 'NO_GO',
        isNoGo: true,
        position: config.drillType === 'octagon' ? randomPosition() : undefined,
      },
      newBag: bag, // Não consome do bag
    };
  }
  
  const { item, newBag } = getNextFromBag(bag, lastCue, config.cueSet);
  return {
    cue: {
      cue: item,
      isNoGo: false,
      position: config.drillType === 'octagon' ? randomPosition() : undefined,
    },
    newBag,
  };
}
```

### twoStep (Ajuste 3)
```typescript
// No loop principal, twoStep exibe 2 cues sequenciais
if (config.drillType === 'twoStep') {
  // Passo 1: Lado (L/R)
  const sideCues: ReactionCue[] = ['L', 'R'];
  const { item: side } = getNextFromBag(sideBag, lastSide, sideCues);
  
  showCue({ cue: side, isNoGo: false, step: 1 });
  await wait(config.cueDurationMs);
  hideCue();
  incrementCueCount(); // Conta +1
  
  await wait(150); // Pausa curta entre steps
  
  // Passo 2: Altura (HEAD/BODY)
  const heightCues: ReactionCue[] = ['HEAD', 'BODY'];
  const { item: height } = getNextFromBag(heightBag, lastHeight, heightCues);
  
  showCue({ cue: height, isNoGo: false, step: 2 });
  await wait(config.cueDurationMs);
  hideCue();
  incrementCueCount(); // Conta +1 (total = 2 para o par)
}
```

### BlockPlan com tempo (Ajuste 1)
```typescript
function shouldEndBlock(
  block: BlockConfig,
  cuesInBlock: number,
  blockTimeElapsed: number
): boolean {
  if (block.mode === 'rounds') {
    return cuesInBlock >= (block.rounds ?? 0);
  } else {
    return blockTimeElapsed >= (block.durationSec ?? 0) * 1000;
  }
}
```

### Sound Callbacks (Ajuste 4)
```typescript
interface UseReactionStateProps {
  config: ReactionConfig;
  soundCallbacks?: ReactionSoundCallbacks;
}

export function useReactionState({ config, soundCallbacks }: UseReactionStateProps) {
  // ...
  
  const showCue = (cue: CueDisplay) => {
    setCurrentCue(cue);
    setCueVisible(true);
    soundCallbacks?.onCueShow?.(cue); // HOOK PARA SOM
  };
  
  const hideCue = () => {
    setCueVisible(false);
    soundCallbacks?.onCueHide?.(); // HOOK PARA SOM
  };
  
  const startSession = () => {
    soundCallbacks?.onSessionStart?.(); // HOOK PARA SOM
    // ...
  };
  
  const endSession = (result: ReactionSessionResult) => {
    soundCallbacks?.onSessionEnd?.(result); // HOOK PARA SOM
    // ...
  };
  
  const startBlockRest = (blockNumber: number) => {
    soundCallbacks?.onBlockRest?.(blockNumber); // HOOK PARA SOM
    // ...
  };
}
```

---

## 3. Presets Atualizados

### Iniciante
```typescript
const BEGINNER_PRESET: ReactionConfig = {
  levelPreset: 'beginner',
  drillType: 'single',
  cueSet: ['L', 'R'],  // Sem NO_GO no cueSet
  cueDurationMs: 1000,
  gapMinMs: 600,
  gapMaxMs: 1200,
  noGoRate: 0,         // Não injeta NO_GO
  sessionMode: 'rounds',
  totalRounds: 40,
  ruleMode: 'normal',
};
```

### Intermediário (com blocos por tempo)
```typescript
const INTERMEDIATE_PRESET: ReactionConfig = {
  levelPreset: 'intermediate',
  drillType: 'twoStep',
  cueSet: ['L', 'R', 'HEAD', 'BODY'],
  cueDurationMs: 600,
  gapMinMs: 350,
  gapMaxMs: 1100,
  noGoRate: 12,
  sessionMode: 'time',
  totalTimeSec: 180,
  blockPlan: [
    { mode: 'time', durationSec: 50, restSec: 15 },
    { mode: 'time', durationSec: 50, restSec: 15 },
    { mode: 'time', durationSec: 50, restSec: 0 },
  ],
  ruleMode: 'normal',
};
```

### Go/No-Go Drill
```typescript
const GO_NOGO_DRILL: ReactionConfig = {
  levelPreset: 'intermediate',
  drillType: 'goNoGo',
  cueSet: ['GO', 'NO_GO'],  // Aqui SIM inclui NO_GO
  cueDurationMs: 800,
  gapMinMs: 400,
  gapMaxMs: 1000,
  noGoRate: 0,              // Ignorado neste drill
  sessionMode: 'rounds',
  totalRounds: 50,
  ruleMode: 'normal',
};
```

---

## 4. Preparação de Sons (`useSoundEffects.ts`)

### Novos SoundName
```typescript
type SoundName = 
  | 'hit'
  | 'hitHeavy'
  // ... existentes ...
  // NOVOS para Reação
  | 'reactionCue'       // Som quando cue aparece
  | 'reactionNoGo'      // Som especial para NO_GO
  | 'reactionStart'     // Início da sessão
  | 'reactionComplete'  // Fim da sessão
  | 'reactionRest';     // Início do descanso entre blocos
```

### Fallback Paths (placeholder até ter os arquivos)
```typescript
const FALLBACK_PATHS: Record<SoundName, string> = {
  // ... existentes ...
  reactionCue: '/sounds/reaction-cue.mp3',
  reactionNoGo: '/sounds/reaction-nogo.mp3',
  reactionStart: '/sounds/reaction-start.mp3',
  reactionComplete: '/sounds/victory.mp3',  // Reutiliza victory por ora
  reactionRest: '/sounds/reaction-rest.mp3',
};
```

### Integração no Index.tsx
```typescript
// Callbacks de som para reação
const reactionSoundCallbacks: ReactionSoundCallbacks = {
  onCueShow: (cue) => {
    if (cue.isNoGo) {
      soundEffects.play('reactionNoGo');
    } else {
      soundEffects.play('reactionCue');
    }
  },
  onSessionStart: () => soundEffects.play('reactionStart'),
  onSessionEnd: () => soundEffects.play('reactionComplete'),
  onBlockRest: () => soundEffects.play('reactionRest'),
  onCountdown: (count) => {
    if (count === 3) soundEffects.play('countdown3');
    else if (count === 2) soundEffects.play('countdown2');
    else if (count === 1) soundEffects.play('countdown1');
    else if (count === 0) soundEffects.play('countdownGo');
  },
};

const reactionState = useReactionState({ 
  config: reactionConfig,
  soundCallbacks: reactionSoundCallbacks,
});
```

---

## 5. Fluxo de Telas

```text
HomeScreen
    │
    ▼ [Seleciona "REAÇÃO"]
ReactionSetupScreen
    │ - Escolhe nível (Iniciante/Intermediário/Avançado)
    │ - Escolhe drill específico
    │ - Ajustes finos (duração, gap, noGoRate)
    │ - Vê legenda dos cues
    │
    ▼ [INICIAR]
CountdownScreen (3, 2, 1, VAI!)
    │
    ▼
ReactionScreen
    │ - Exibe cues em tela cheia
    │ - Barra de progresso mínima
    │ - Se blockPlan: vai para BLOCK_REST entre blocos
    │
    ▼ [Tempo/Rounds acabou]
ReactionFinishedScreen
    │ - Relatório da sessão
    │ - Distribuição dos cues
    │ - Escala RPE (1-10)
    │
    ▼ [Menu] ou [Repetir]
HomeScreen / ReactionSetupScreen
```

---

## 6. UI da Tela de Treino

### Layout Centralizado (Full Screen)
```text
┌─────────────────────────────────────────┐
│  23/50  ●●●●●●●●○○○○○○○○  NORMAL        │  ← Barra mínima
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                         │
│                  ←                      │  ← CUE GIGANTE
│                                         │    (ou HEAD, BODY, etc.)
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Layout Octagon (8 posições)
```text
         [0]
      [7]   [1]
    [6]       [2]
      [5]   [3]
         [4]
```

### Visual dos Cues
```typescript
const CUE_VISUALS: Record<ReactionCue, { symbol: string; color: string; label: string }> = {
  'L':         { symbol: '←', color: 'text-blue-500', label: 'Esquerda' },
  'R':         { symbol: '→', color: 'text-red-500', label: 'Direita' },
  'HEAD':      { symbol: '⬆', color: 'text-yellow-500', label: 'Cabeça' },
  'BODY':      { symbol: '⬇', color: 'text-green-500', label: 'Corpo' },
  'FRONT_LEG': { symbol: 'F', color: 'text-cyan-500', label: 'Perna Frente' },
  'BACK_LEG':  { symbol: 'B', color: 'text-orange-500', label: 'Perna Trás' },
  'GO':        { symbol: '●', color: 'text-green-500', label: 'VAI!' },
  'NO_GO':     { symbol: '●', color: 'text-red-500', label: 'PARA!' },
  'COUNTER':   { symbol: '⟲', color: 'text-purple-500', label: 'Contra' },
  'CUT':       { symbol: '✕', color: 'text-white', label: 'Corta' },
  'SPIN':      { symbol: '↻', color: 'text-pink-500', label: 'Giro' },
  'FAKE':      { symbol: '?', color: 'text-gray-400', label: 'Feint' },
};
```

---

## 7. Relatório Final

```typescript
interface ReactionFinishedScreenProps {
  result: ReactionSessionResult;
  onRepeat: () => void;
  onMenu: () => void;
  onSetRPE: (value: number) => void;
}

// Exibe:
// - Total de estímulos
// - Duração total
// - Intervalo médio
// - Distribuição dos cues (gráfico de barras)
// - Quantos NO_GO apareceram
// - Escala RPE (1-10) para atleta marcar esforço
```

---

## Resultado Esperado

1. Novo botão **roxo "REAÇÃO"** na HomeScreen
2. Setup com **3 níveis** e **drills específicos**
3. Engine com **shuffle-bag anti-padrão**
4. **BlockPlan** suporta tempo E rounds
5. **NO_GO** sem duplicação de lógica
6. **twoStep** conta 2 cues por par
7. **Sound callbacks** prontos para conectar depois
8. Relatório final com **estatísticas + RPE**
