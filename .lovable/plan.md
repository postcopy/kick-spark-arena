

## Plano: Corrigir Atualização Automática dos Status de Equipamentos

### Problema Raiz

A tela de "Preparar Equipamentos" não atualiza em tempo real porque:

1. **O Map `equipment` é uma referência estável** - O hook `useSerialPort` retorna `equipmentRef.current` diretamente. Mesmo quando o conteúdo do Map muda, a referência permanece a mesma, então o React não detecta a mudança.

2. **O `useMemo` depende de um timestamp estático** - O `agora = Date.now()` é calculado uma vez por render, e como não há re-renders automáticos, o cálculo de "visto recentemente" fica congelado.

3. **Falta um contador de versão exposto** - O hook tem um `equipmentVersion` interno que incrementa a cada atualização, mas esse valor não é exposto para os consumidores forçarem re-renders.

---

### Solução

#### Parte 1: Expor `equipmentVersion` no hook

Adicionar o contador de versão ao retorno do `useSerialPort` para que componentes possam usá-lo como dependência de efeitos/memos.

**Arquivo:** `src/hooks/useSerialPort.ts`

```typescript
// Adicionar ao tipo de retorno
export interface UseSerialPortReturn {
  // ... existentes ...
  equipmentVersion: number; // ← NOVO
}

// No return do hook
return {
  isConnected,
  isConnecting,
  error,
  isSupported: isWebSerialSupported(),
  connect,
  disconnect,
  equipment: equipmentRef.current,
  equipmentVersion, // ← NOVO
};
```

#### Parte 2: Usar `equipmentVersion` como dependência no EquipmentSetupScreen

**Arquivo:** `src/components/game/EquipmentSetupScreen.tsx`

```typescript
export function EquipmentSetupScreen({
  serialPort,
  onContinue,
  onSkip,
  onBack,
}: EquipmentSetupScreenProps) {
  // Extrair versão para forçar re-cálculo
  const { equipment: mapa, equipmentVersion } = serialPort;
  const agora = Date.now();

  const lista = useMemo(() => {
    return EQUIPAMENTOS.map((item) => {
      const raw = mapa.get(item.id);
      // ... resto da lógica ...
    });
  }, [mapa, agora, equipmentVersion]); // ← Adicionar equipmentVersion
  
  // ...
}
```

#### Parte 3: Atualizar o tipo `UseSerialPortReturn`

**Arquivo:** `src/types/serial.ts`

```typescript
export interface UseSerialPortReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  equipment: Map<EquipmentSlot, EquipmentState>;
  equipmentVersion: number; // ← NOVO
}
```

#### Parte 4: Forçar atualização após conectar placa

O problema de "só ver após refresh" também acontece porque `isConnected` muda, mas a UI precisa de um render completo. A solução acima resolve isso automaticamente porque:

1. Ao conectar a placa → `setIsConnected(true)` dispara render
2. Ao receber dados → `setEquipmentVersion(v => v + 1)` dispara render
3. O `useMemo` recalcula porque `equipmentVersion` mudou

---

### Fluxo Corrigido

```text
Usuário clica "Conectar placa USB"
        │
        ▼
  serialPort.connect()
        │
        ▼
  port.open() → setIsConnected(true)
        │                │
        ▼                ▼
  startReading()    Re-render: "Conectada" ✓
        │
        ▼
  Recebe dados: "850,1,85"
        │
        ▼
  updateEquipment(1, 85)
        │
        ▼
  equipmentRef.current.set(1, {...})
        │
        ▼
  setEquipmentVersion(v => v + 1)
        │
        ▼
  Re-render EquipmentSetupScreen
        │
        ▼
  useMemo recalcula lista (equipmentVersion mudou)
        │
        ▼
  Colete vermelho: "Online" ✓ Bateria: 85%
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/types/serial.ts` | Adicionar `equipmentVersion: number` ao tipo |
| `src/hooks/useSerialPort.ts` | Expor `equipmentVersion` no retorno |
| `src/components/game/EquipmentSetupScreen.tsx` | Usar `equipmentVersion` como dependência do useMemo |

---

### Código Detalhado

#### `src/types/serial.ts` (linha ~47)

```typescript
export interface UseSerialPortReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isSupported: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  equipment: Map<EquipmentSlot, EquipmentState>;
  equipmentVersion: number; // ADICIONAR
}
```

#### `src/hooks/useSerialPort.ts` (linhas 317-326)

```typescript
return {
  isConnected,
  isConnecting,
  error,
  isSupported: isWebSerialSupported(),
  connect,
  disconnect,
  equipment: equipmentRef.current,
  equipmentVersion, // ADICIONAR
};
```

#### `src/components/game/EquipmentSetupScreen.tsx` (linhas 116-137)

```typescript
export function EquipmentSetupScreen({
  serialPort,
  onContinue,
  onSkip,
  onBack,
}: EquipmentSetupScreenProps) {
  const agora = Date.now();
  const mapa = serialPort.equipment;
  const versao = serialPort.equipmentVersion; // ADICIONAR

  const lista = useMemo(() => {
    return EQUIPAMENTOS.map((item) => {
      const raw = mapa.get(item.id);
      const bateria = raw?.battery ?? null;
      const lastSeen = raw?.lastSeen ?? null;
      const vistoRecentemente = lastSeen !== null && agora - lastSeen <= STALE_MS;
      const temBateria = typeof bateria === "number";
      const online = temBateria && vistoRecentemente;
      const stale = temBateria && !vistoRecentemente;

      return {
        ...item,
        bateria,
        online,
        stale,
      };
    });
  }, [mapa, agora, versao]); // MODIFICAR: adicionar 'versao'
  
  // ... resto do código ...
}
```

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Status "Aguardando" não muda | Status atualiza em tempo real |
| "Placa: Ainda não conectada" mesmo após conectar | Muda para "Conectada" imediatamente |
| Precisa dar refresh para ver mudanças | Atualizações automáticas conforme dados chegam |
| Sai da tela ao dar refresh | Não precisa mais de refresh |

---

### Seção Técnica

**Por que usar `equipmentVersion` em vez de criar um novo Map?**

Criar um novo Map a cada atualização (`new Map(...)`) seria mais "React-idiomático", mas:
1. Gera mais garbage collection
2. O Map pode ter 4 equipamentos sendo atualizados rapidamente
3. O contador de versão é mais eficiente para esse caso de uso

**Consideração sobre `agora`:**

O `agora` ainda é calculado apenas no momento do render. Isso é intencional - não queremos um setInterval atualizando constantemente. O cálculo de "stale" (10 segundos sem dados) é reavaliado automaticamente quando novos dados chegam porque `equipmentVersion` muda.

Se no futuro for necessário atualizar o status "Sem sinal..." mesmo sem novos dados, podemos adicionar um `useEffect` com setInterval, mas para o fluxo atual isso não é necessário.

