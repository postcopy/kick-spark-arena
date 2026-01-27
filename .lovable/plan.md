

## Plano: Pontuação Diferenciada no Modo Duelo (Colete vs Capacete)

### Resumo

Implementar pontuação diferenciada baseada no tipo de equipamento atingido:
- **Capacete (IDs 3-4)**: Golpes na cabeça valem MAIS pontos
- **Colete (IDs 1-2)**: Golpes no corpo valem MENOS pontos
- Pontos adaptados por nível de dificuldade (Kids, Juvenil, Adulto)

---

### Tabela de Pontuação por Nível

| Nível | Tempo | Dano Colete | Dano Capacete | Bônus Especial |
|-------|-------|-------------|---------------|----------------|
| Kids 4-6 | 20s | 3 | 5 | +10 |
| Kids 7-9 | 30s | 2 | 4 | +12 |
| Juvenil | 45s | 2 | 3 | +12 |
| Adulto | 60s | 1 | 2 | +15 |

**Lógica Taekwondo Real:**
- Chute no corpo: 2 pontos
- Chute na cabeça: 3 pontos
- Chute giratório na cabeça: 4-5 pontos

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/types/game.ts` | Adicionar `HitType` e expandir `ArcadeConfig` |
| `src/types/serial.ts` | Exportar tipo de equipamento no callback |
| `src/hooks/useSerialPort.ts` | Passar tipo de equipamento junto com o kick |
| `src/hooks/useArcadeState.ts` | Calcular dano baseado no tipo de golpe |
| `src/components/game/ArcadeSetupScreen.tsx` | Mostrar pontuação diferenciada por nível |
| `src/components/game/ArcadeScreenTV.tsx` | Indicar visualmente tipo de golpe (colete/capacete) |
| `src/pages/Index.tsx` | Passar hit type para o arcade state |

---

### 1. Novos Tipos (`src/types/game.ts`)

```typescript
// Tipo de golpe baseado no equipamento atingido
export type HitType = 'vest' | 'helmet';

// Config expandido para pontuação diferenciada
export interface ArcadeConfig {
  roundDurationSec: number;
  startingHP: number;
  bestOf: 1 | 3;
  comboWindowMs: number;
  energyPerKick: number;
  energyMax: number;
  // NOVOS - Dano por tipo de equipamento
  vestDamage: number;     // Dano base colete
  helmetDamage: number;   // Dano base capacete
  specialDamageBonus: number;
  minIntervalMs: number;
}
```

---

### 2. Callback Expandido (`src/types/serial.ts`)

```typescript
export interface UseSerialPortOptions {
  onKick: (side: Side, hitType: HitType) => void; // AGORA passa tipo de golpe
  debounceMs?: number;
}
```

---

### 3. Serial Port Passa Tipo de Golpe (`src/hooks/useSerialPort.ts`)

```typescript
import { HitType } from '@/types/game';

function deviceIdToHitType(deviceId: number): HitType {
  // IDs 1-2 = coletes, IDs 3-4 = capacetes
  return deviceId <= 2 ? 'vest' : 'helmet';
}

// No loop de leitura:
const kickingSide = deviceIdToKickingSide(deviceId);
const hitType = deviceIdToHitType(deviceId);

if (kickingSide && !shouldDebounce(kickingSide)) {
  onKickRef.current(kickingSide, hitType);
}
```

---

### 4. Arcade State com Dano Diferenciado (`src/hooks/useArcadeState.ts`)

```typescript
// Configs por nível de dificuldade
const DIFFICULTY_CONFIGS = {
  20: { vestDamage: 3, helmetDamage: 5, specialDamageBonus: 10 },  // Kids 4-6
  30: { vestDamage: 2, helmetDamage: 4, specialDamageBonus: 12 },  // Kids 7-9
  45: { vestDamage: 2, helmetDamage: 3, specialDamageBonus: 12 },  // Juvenil
  60: { vestDamage: 1, helmetDamage: 2, specialDamageBonus: 15 },  // Adulto
};

// calculateDamage recebe tipo de golpe
const calculateDamage = useCallback((
  attackerState: ArcadePlayerState, 
  now: number,
  hitType: HitType // NOVO
): { damage: number; newCombo: number; usedSpecial: boolean } => {
  const timeSinceLastKick = now - attackerState.lastKickAt;
  const isCombo = timeSinceLastKick <= fullConfig.comboWindowMs && attackerState.lastKickAt > 0;
  const newCombo = isCombo ? attackerState.comboCount + 1 : 1;
  
  // DANO BASEADO NO TIPO DE GOLPE
  const baseDamage = hitType === 'helmet' 
    ? fullConfig.helmetDamage 
    : fullConfig.vestDamage;
  
  // Bônus de combo (max +4)
  const comboBonus = Math.min(newCombo - 1, 4);
  let damage = baseDamage + comboBonus;
  
  // Especial
  const usedSpecial = attackerState.specialReady;
  if (usedSpecial) {
    damage += fullConfig.specialDamageBonus;
  }
  
  return { damage, newCombo, usedSpecial };
}, [fullConfig]);

// registerKick agora recebe hitType
const registerKick = useCallback((side: Side, hitType: HitType = 'vest') => {
  // ...
  const { damage, newCombo, usedSpecial } = calculateDamage(attackerState, now, hitType);
  // ...
}, [/* deps */]);
```

---

### 5. Setup Screen Mostra Pontuação (`src/components/game/ArcadeSetupScreen.tsx`)

```typescript
const DURATION_OPTIONS = [
  { value: 20, label: '20s', sublabel: 'Kids 4-6', vest: 3, helmet: 5 },
  { value: 30, label: '30s', sublabel: 'Kids 7-9', vest: 2, helmet: 4 },
  { value: 45, label: '45s', sublabel: 'Juvenil', vest: 2, helmet: 3, recommended: true },
  { value: 60, label: '60s', sublabel: 'Adulto', vest: 1, helmet: 2 },
];

// Na UI, abaixo do sublabel:
<div className="flex gap-2 mt-1 text-xs">
  <span className="flex items-center gap-1">
    <Shirt className="w-3 h-3" /> {option.vest}
  </span>
  <span className="flex items-center gap-1">
    <HardHat className="w-3 h-3" /> {option.helmet}
  </span>
</div>
```

---

### 6. Indicador Visual na Tela de Jogo (`src/components/game/ArcadeScreenTV.tsx`)

Quando ocorre um golpe de capacete, mostrar indicador especial:

```typescript
// Novo state no hook:
const [lastHitType, setLastHitType] = useState<{ side: Side; type: HitType } | null>(null);

// No damage popup, diferenciar visualmente:
{lastDamage?.side === 'red' && (
  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10">
    <span className={cn(
      "font-black animate-damage-popup drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]",
      "text-[clamp(48px,6vw,96px)]",
      lastHitType?.type === 'helmet' ? "text-game-yellow" : "text-white" // Amarelo para capacete!
    )}>
      -{lastDamage.amount}
    </span>
    {lastHitType?.type === 'helmet' && (
      <span className="block text-center text-game-yellow text-xl font-bold uppercase">
        CABEÇA!
      </span>
    )}
  </div>
)}
```

---

### 7. Integração no Index.tsx

```typescript
// Modificar o handleSerialKick para passar hitType
const handleSerialKick = useCallback((side: Side, hitType: HitType = 'vest') => {
  if (gameMode === 'arcade') {
    arcadeState.registerKick(side, hitType);
  } else if (gameMode === 'time_attack') {
    gameState.registerKick(side);
  }
}, [gameMode, arcadeState, gameState]);

// useSerialPort agora passa 2 argumentos
const serialPort = useSerialPort({
  onKick: handleSerialKick, // (side, hitType) => ...
  debounceMs: 150,
});
```

---

### 8. Suporte a Teclado (Modo Teste)

Para testes, teclas extras para simular capacete:

```typescript
// No useArcadeState keyboard handler:
case 'a':
  registerKick('red', 'vest');
  break;
case 'q': // NOVO: capacete vermelho
  registerKick('red', 'helmet');
  break;
case 'l':
  registerKick('blue', 'vest');
  break;
case 'p': // NOVO: capacete azul
  registerKick('blue', 'helmet');
  break;
```

---

### Fluxo de Dados Atualizado

```text
1. Placa envia: "45,3,87" (golpe no capacete vermelho)
   |
2. parseLine() → { deviceId: 3, battery: 87 }
   |
3. deviceIdToKickingSide(3) → 'blue' (azul chutou)
   deviceIdToHitType(3) → 'helmet' (capacete)
   |
4. onKick('blue', 'helmet')
   |
5. registerKick('blue', 'helmet')
   |-> calculateDamage(..., 'helmet')
   |-> baseDamage = config.helmetDamage (ex: 3)
   |-> damage = 3 + comboBonus + especial
   |
6. UI mostra: "-3" em AMARELO + "CABEÇA!"
```

---

### Regras de Pontuação Completas

```text
┌────────────────────────────────────────────────────────┐
│ MODO DUELO - PONTUAÇÃO                                 │
├──────────────┬──────────┬──────────┬──────────────────┤
│ Nível        │ Colete   │ Capacete │ Combo Máx (+4)   │
├──────────────┼──────────┼──────────┼──────────────────┤
│ Kids 4-6     │    3     │    5     │ Colete: 7, Cap: 9│
│ Kids 7-9     │    2     │    4     │ Colete: 6, Cap: 8│
│ Juvenil      │    2     │    3     │ Colete: 6, Cap: 7│
│ Adulto       │    1     │    2     │ Colete: 5, Cap: 6│
└──────────────┴──────────┴──────────┴──────────────────┘

Especial adiciona bônus fixo ao dano!
```

---

### Resultado Esperado

| Situação | Antes | Depois |
|----------|-------|--------|
| Chute no colete | 2 dano | 1-3 dano (varia por nível) |
| Chute no capacete | 2 dano (igual) | 2-5 dano (MAIS que colete) |
| Visual do golpe | Número branco | Branco (colete) / Amarelo + "CABEÇA!" (capacete) |
| Setup screen | Só tempo | Tempo + preview de pontos |
| Teclado teste | A/L | A/L (colete) + Q/P (capacete) |

---

### Seção Tecnica

**Mapeamento de Device IDs (EngFlex):**
```text
ID 1 = Colete Vermelho → golpe de AZUL no corpo
ID 2 = Colete Azul     → golpe de VERMELHO no corpo  
ID 3 = Capacete Vermelho → golpe de AZUL na cabeça
ID 4 = Capacete Azul     → golpe de VERMELHO na cabeça
```

**Balanceamento:**
- Capacete vale ~1.5x mais que colete
- Níveis mais fáceis (Kids) têm dano maior para partidas mais rápidas
- Níveis mais difíceis (Adulto) têm dano menor para partidas táticas
- Combo bônus é ADITIVO ao dano base (não multiplicativo)

**Compatibilidade:**
- Teclado continua funcionando (A/L para colete, Q/P para capacete)
- Serial port funciona automaticamente baseado no ID do equipamento
- Não quebra partidas existentes (default = colete)

