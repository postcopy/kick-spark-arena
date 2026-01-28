
## Plano: Intervalo de Recuperação entre Rounds no Modo Duelo

### Objetivo
Adicionar um intervalo configurável entre os rounds no modo "Melhor de 3" para que os atletas possam descansar antes do próximo round.

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/types/game.ts` | Adicionar `recoveryIntervalSec` ao tipo `ArcadeConfig` |
| `src/pages/Index.tsx` | Adicionar estado para o intervalo e passar ao hook/setup |
| `src/components/game/ArcadeSetupScreen.tsx` | Adicionar slider para configurar intervalo |
| `src/hooks/useArcadeState.ts` | Usar intervalo configurável + expor countdown de recuperação |
| `src/components/game/ArcadeScreenTV.tsx` | Exibir contagem regressiva durante intervalo |

---

### Implementação

#### 1. Tipo `ArcadeConfig` (`src/types/game.ts`)

Adicionar novo campo:
```typescript
export interface ArcadeConfig {
  // ... campos existentes
  recoveryIntervalSec: number;  // Novo: tempo de descanso entre rounds
}
```

#### 2. Estado em `Index.tsx`

Adicionar estado e passar para os componentes:
```typescript
const [recoveryInterval, setRecoveryInterval] = useState(15); // 15 segundos padrão

const arcadeState = useArcadeState({ 
  // ... config existente
  recoveryIntervalSec: recoveryInterval,
});

// Na renderização do ArcadeSetupScreen
<ArcadeSetupScreen
  // ... props existentes
  recoveryInterval={recoveryInterval}
  onRecoveryIntervalChange={setRecoveryInterval}
/>
```

#### 3. UI do Slider (`ArcadeSetupScreen.tsx`)

Adicionar novo slider para o intervalo (visível apenas quando "Melhor de 3"):
```typescript
{bestOf === 3 && (
  <div className="bg-game-surface p-3 md:p-4 rounded-lg border border-border">
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <div className="flex items-center gap-2 md:gap-3">
        <Timer className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">INTERVALO</h2>
      </div>
      <span className="text-2xl md:text-3xl font-black text-green-500">{recoveryInterval}s</span>
    </div>
    <Slider
      value={[recoveryInterval]}
      onValueChange={(values) => onRecoveryIntervalChange(values[0])}
      min={5}
      max={60}
      step={5}
    />
    <div className="flex justify-between text-xs text-muted-foreground mt-1">
      <span>5s</span>
      <span>60s</span>
    </div>
  </div>
)}
```

#### 4. Hook `useArcadeState.ts`

Modificações:
- Adicionar `recoveryCountdown` ao estado
- Usar `recoveryIntervalSec` ao invés do `ROUND_END_DELAY` fixo
- Criar contagem regressiva visual

```typescript
const [recoveryCountdown, setRecoveryCountdown] = useState(0);

// No endRound, quando há mais rounds:
} else {
  setGameState('round_end');
  setRecoveryCountdown(fullConfig.recoveryIntervalSec);
  
  // Timer de recuperação com countdown
  const recoveryTimer = window.setInterval(() => {
    setRecoveryCountdown(prev => {
      if (prev <= 1) {
        window.clearInterval(recoveryTimer);
        setCurrentRound(p => p + 1);
        setShowKO(null);
        startCountdown();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
}

// Retornar no objeto:
return {
  // ... existente
  recoveryCountdown,
};
```

#### 5. Exibição do Countdown (`ArcadeScreenTV.tsx`)

Mostrar tempo restante de recuperação durante `round_end`:
```typescript
{gameState === 'round_end' && (
  <div className="...">
    {/* Vencedor do round */}
    ...
    
    {/* Countdown de recuperação */}
    <div className="mt-6 text-center">
      <span className="text-white/70 text-2xl uppercase tracking-wider">
        Próximo round em
      </span>
      <div className="text-[clamp(80px,12vw,160px)] font-black text-green-500 animate-pulse">
        {arcadeState.recoveryCountdown}
      </div>
    </div>
  </div>
)}
```

---

### Valores Sugeridos

| Categoria | Intervalo Padrão |
|-----------|------------------|
| Kids | 10-15s |
| Juvenil | 15-20s |
| Adulto | 20-30s |

Os presets existentes também podem ser atualizados para incluir valores de intervalo:
```typescript
const PRESETS = [
  { label: 'Kids', duration: 20, vest: 3, helmet: 5, recovery: 10 },
  { label: 'Juvenil', duration: 45, vest: 2, helmet: 3, recovery: 15 },
  { label: 'Adulto', duration: 60, vest: 1, helmet: 2, recovery: 20 },
];
```

---

### Resultado Esperado

1. Novo slider "INTERVALO" aparece na tela de configuração quando "Melhor de 3" está selecionado
2. Entre rounds, exibe countdown de recuperação (ex: "Próximo round em 15, 14, 13...")
3. Atletas têm tempo para descansar e se preparar
4. Intervalo é customizável de 5s a 60s

---

### Seção Técnica

**Estado novo:**
- `recoveryCountdown: number` - Countdown do intervalo entre rounds

**Props novos no ArcadeSetupScreen:**
- `recoveryInterval: number`
- `onRecoveryIntervalChange: (interval: number) => void`

**Config atualizado no ArcadeConfig:**
- `recoveryIntervalSec: number` (default: 15)
