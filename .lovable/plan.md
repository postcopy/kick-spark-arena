
## Plano: Bateria dos Equipamentos + Diferenciação Colete/Capacete

### Resumo

Implementar duas funcionalidades baseadas no protocolo CSV documentado:
1. **Mostrar bateria** dos 4 equipamentos em tempo real (terceiro valor do CSV)
2. **Diferenciar colete/capacete** pelos IDs 1-4

---

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/game/EquipmentStatus.tsx` | Componente visual para mostrar bateria dos 4 equipamentos |

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/types/serial.ts` | Adicionar tipos para equipamentos e bateria |
| `src/hooks/useSerialPort.ts` | Parsear 3 valores CSV + rastrear bateria por dispositivo |
| `src/components/game/HomeScreen.tsx` | Mostrar status dos equipamentos no footer |
| `src/components/game/GameScreen.tsx` | Exibir badges de bateria durante jogo |
| `src/components/game/ArcadeScreenTV.tsx` | Exibir badges de bateria no modo duelo |

---

### 1. Novos Tipos (`src/types/serial.ts`)

```typescript
// Tipos de equipamento
export type EquipmentType = 'vest' | 'helmet';
export type EquipmentSlot = 1 | 2 | 3 | 4;

// Estado de um equipamento individual
export interface EquipmentState {
  id: EquipmentSlot;
  type: EquipmentType;
  side: 'red' | 'blue';
  battery: number | null; // 0-100 ou null se desconhecido
  lastSeen: number | null; // timestamp
}

// Mapeamento fixo baseado na documentação:
// ID 1 = Colete Vermelho
// ID 2 = Colete Azul
// ID 3 = Capacete Vermelho  
// ID 4 = Capacete Azul

export interface UseSerialPortReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  // NOVO:
  equipment: Map<EquipmentSlot, EquipmentState>;
}
```

---

### 2. Parsing CSV Completo (`src/hooks/useSerialPort.ts`)

Modificar `parseLine` para extrair os 3 valores e atualizar estado de bateria:

```typescript
interface ParsedLine {
  intensity: number;  // Valor 1
  deviceId: number;   // Valor 2 (1-4 = equipamentos, 5-7 = juízes)
  battery: number;    // Valor 3 (0-100)
}

function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!LINE_REGEX.test(trimmed)) return null;
  
  const parts = trimmed.split(',');
  return {
    intensity: parseInt(parts[0], 10),
    deviceId: parseInt(parts[1], 10),
    battery: parseInt(parts[2], 10),
  };
}

function getEquipmentType(id: number): EquipmentType {
  return id <= 2 ? 'vest' : 'helmet';
}

function getEquipmentSide(id: number): 'red' | 'blue' {
  // IDs 1 e 3 = vermelho, IDs 2 e 4 = azul
  return id % 2 === 1 ? 'red' : 'blue';
}
```

**Fluxo atualizado:**
1. Recebe linha CSV: `"45,2,87"`
2. Parseia: `{ intensity: 45, deviceId: 2, battery: 87 }`
3. Atualiza `equipment[2]` com `{ battery: 87, lastSeen: Date.now() }`
4. Se `deviceId` é 1 ou 2, converte para `Side` e chama `onKick`

---

### 3. Estado de Equipamentos no Hook

```typescript
// Estado interno
const equipmentRef = useRef<Map<EquipmentSlot, EquipmentState>>(new Map([
  [1, { id: 1, type: 'vest', side: 'red', battery: null, lastSeen: null }],
  [2, { id: 2, type: 'vest', side: 'blue', battery: null, lastSeen: null }],
  [3, { id: 3, type: 'helmet', side: 'red', battery: null, lastSeen: null }],
  [4, { id: 4, type: 'helmet', side: 'blue', battery: null, lastSeen: null }],
]));

// Atualizar ao receber dados
const updateEquipment = (deviceId: number, battery: number) => {
  if (deviceId >= 1 && deviceId <= 4) {
    const slot = deviceId as EquipmentSlot;
    const current = equipmentRef.current.get(slot);
    if (current) {
      equipmentRef.current.set(slot, {
        ...current,
        battery,
        lastSeen: Date.now(),
      });
      // Trigger re-render
      setEquipmentVersion(v => v + 1);
    }
  }
};
```

---

### 4. Componente `EquipmentStatus.tsx`

Exibe os 4 equipamentos com ícone, cor do lado, e porcentagem de bateria:

```typescript
interface EquipmentStatusProps {
  equipment: Map<EquipmentSlot, EquipmentState>;
  compact?: boolean; // Para usar no header/footer
}

export function EquipmentStatus({ equipment, compact }: EquipmentStatusProps) {
  const slots = [1, 2, 3, 4] as EquipmentSlot[];
  
  return (
    <div className="flex items-center gap-2">
      {slots.map(slot => {
        const eq = equipment.get(slot);
        if (!eq) return null;
        
        const Icon = eq.type === 'vest' ? ShirtIcon : HardHatIcon;
        const colorClass = eq.side === 'red' ? 'text-game-red' : 'text-game-blue';
        const batteryColor = getBatteryColor(eq.battery);
        
        return (
          <div 
            key={slot}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5",
              compact && "px-1.5 py-0.5"
            )}
          >
            <Icon className={cn("w-4 h-4", colorClass)} />
            {eq.battery !== null ? (
              <span className={cn("text-xs font-medium tabular-nums", batteryColor)}>
                {eq.battery}%
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">--</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getBatteryColor(battery: number | null): string {
  if (battery === null) return 'text-muted-foreground';
  if (battery <= 15) return 'text-destructive';
  if (battery <= 30) return 'text-yellow-500';
  return 'text-green-500';
}
```

**Visual:**
```text
┌─────────────────────────────────────┐
│ [👕 85%] [👕 72%] [🪖 90%] [🪖 65%] │
│  (red)   (blue)   (red)   (blue)   │
└─────────────────────────────────────┘
```

---

### 5. Integração na HomeScreen

Adicionar status de equipamentos no footer:

```typescript
{serialPort && (
  <footer className="flex-shrink-0 p-4 border-t border-border">
    <div className="flex flex-col items-center gap-2">
      {/* Status da placa */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${serialPort.isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
        <span>{serialPort.isConnected ? 'Plaquinha conectada' : 'Use A e L no teclado'}</span>
      </div>
      
      {/* Bateria dos equipamentos - só mostra se conectado */}
      {serialPort.isConnected && (
        <EquipmentStatus equipment={serialPort.equipment} compact />
      )}
    </div>
  </footer>
)}
```

---

### 6. Integração nas Telas de Jogo

**GameScreen (Time Attack):**
- Pequenos badges no canto superior (não atrapalham gameplay)
- Só mostram se bateria <= 30% (alerta)

**ArcadeScreenTV (Duelo):**
- Badges abaixo do nome do jogador
- Mostram colete + capacete do lado correspondente

```typescript
// No footer do ArcadeScreenTV
<div className="flex items-center gap-4">
  <span className="text-[clamp(12px,1.5vw,18px)] text-game-red/80 font-bold uppercase">
    Energia
  </span>
  {/* Bateria equipamentos vermelhos */}
  <div className="flex items-center gap-1">
    <BatteryBadge equipment={equipment.get(1)} /> {/* Colete vermelho */}
    <BatteryBadge equipment={equipment.get(3)} /> {/* Capacete vermelho */}
  </div>
</div>
```

---

### 7. Mapeamento de Ícones

| ID | Equipamento | Lado | Ícone |
|----|-------------|------|-------|
| 1 | Colete | Vermelho | `Shirt` (lucide) |
| 2 | Colete | Azul | `Shirt` (lucide) |
| 3 | Capacete | Vermelho | `HardHat` (lucide) |
| 4 | Capacete | Azul | `HardHat` (lucide) |

---

### 8. Lógica de Kick Atualizada

O sistema atual já funciona, mas vamos melhorar para suportar capacetes (futuramente):

```typescript
// Mapeamento atual (coletes apenas)
// ID 1 → vermelho chutou (colete azul foi atingido)
// ID 2 → azul chutou (colete vermelho foi atingido)

// Com capacetes (preparação futura):
// ID 3 → vermelho chutou na cabeça
// ID 4 → azul chutou na cabeça

function deviceIdToSide(deviceId: number): Side | null {
  // Equipamento atingido → quem chutou é o oposto
  if (deviceId === 1 || deviceId === 3) {
    // Vermelho foi atingido → Azul chutou
    return 'blue';
  }
  if (deviceId === 2 || deviceId === 4) {
    // Azul foi atingido → Vermelho chutou
    return 'red';
  }
  return null;
}
```

---

### Fluxo de Dados

```text
1. Placa envia: "45,2,87\n"
   |
2. parseLine() → { intensity: 45, deviceId: 2, battery: 87 }
   |
3. updateEquipment(2, 87)
   |-> equipment[2] = { battery: 87, lastSeen: now }
   |
4. deviceIdToSide(2) → 'red' (vermelho chutou)
   |
5. onKick('red')
   |
6. UI atualiza:
   - Score vermelho +1
   - Badge bateria colete azul: 87%
```

---

### Resultado Esperado

| Local | O que mostra |
|-------|--------------|
| HomeScreen (footer) | 4 badges: [👕 VM 85%] [👕 AZ 72%] [🪖 VM 90%] [🪖 AZ 65%] |
| GameScreen (corner) | Alerta se bateria <= 30% |
| ArcadeScreen (bottom) | Bateria por lado (VM: colete+capacete / AZ: colete+capacete) |

---

### Seção Técnica

**Estrutura do CSV (documentação EngFlex):**
```
Valor1,Valor2,Valor3
  │       │       │
  │       │       └─ Bateria (0-100%)
  │       └───────── Device ID (1-4 equipamentos, 5-7 juízes)
  └───────────────── Intensidade (0-1023) ou Botão
```

**Mapeamento de IDs:**
- 1 = Colete Vermelho
- 2 = Colete Azul
- 3 = Capacete Vermelho
- 4 = Capacete Azul
- 5, 6, 7 = Juízes externos (ignorados por enquanto)

**Compatibilidade:**
- Mantém funcionamento atual (coletes IDs 1-2)
- Prepara suporte para capacetes (IDs 3-4)
- Bateria atualiza em tempo real a cada mensagem recebida
