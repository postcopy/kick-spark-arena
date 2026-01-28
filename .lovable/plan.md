

## Plano: Corrigir Mapeamento de Device IDs

### Problema

O código atual está com o mapeamento de equipamentos **invertido** em relação à documentação oficial do protocolo.

| Device ID | Código Atual | Documentação Oficial |
|-----------|--------------|---------------------|
| 1 | Colete vermelho | Colete **azul** |
| 2 | Colete azul | Colete **vermelho** |
| 3 | Capacete vermelho | Capacete **azul** |
| 4 | Capacete azul | Capacete **vermelho** |

---

### Impacto

Quando o jogador **vermelho** chuta o colete **azul** (ID 1), o código atual acha que o azul chutou e dá ponto para o azul ao invés do vermelho!

---

### Solução

Corrigir **duas funções** em `src/hooks/useSerialPort.ts`:

#### 1. `getEquipmentSide` (linha 61-64)

```text
Atual (errado):
  return id % 2 === 1 ? 'red' : 'blue';

Correto:
  // Documentação: 1=azul, 2=vermelho, 3=azul, 4=vermelho
  return id % 2 === 1 ? 'blue' : 'red';
```

#### 2. `deviceIdToKickingSide` (linha 66-73)

```text
Atual (errado):
  if (deviceId === 1 || deviceId === 3) return 'blue';
  if (deviceId === 2 || deviceId === 4) return 'red';

Correto:
  // ID 1 (colete azul) ou ID 3 (capacete azul) atingido → Vermelho chutou
  // ID 2 (colete vermelho) ou ID 4 (capacete vermelho) atingido → Azul chutou
  if (deviceId === 1 || deviceId === 3) return 'red';
  if (deviceId === 2 || deviceId === 4) return 'blue';
```

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSerialPort.ts` | Corrigir `getEquipmentSide` (linha 61-64) |
| `src/hooks/useSerialPort.ts` | Corrigir `deviceIdToKickingSide` (linha 66-73) |
| `src/hooks/useSerialPort.ts` | Atualizar `createInitialEquipment` (linha 84-91) para refletir os lados corretos |

---

### Código Detalhado

**Função `getEquipmentSide` (linha 61-64):**
```typescript
function getEquipmentSide(id: number): 'red' | 'blue' {
  // Documentação oficial: IDs 1 e 3 = azul, IDs 2 e 4 = vermelho
  return id % 2 === 1 ? 'blue' : 'red';
}
```

**Função `deviceIdToKickingSide` (linha 66-73):**
```typescript
function deviceIdToKickingSide(deviceId: number): Side | null {
  // Equipamento atingido → quem chutou é o lado oposto
  // ID 1 (colete azul) ou ID 3 (capacete azul) → Vermelho chutou
  // ID 2 (colete vermelho) ou ID 4 (capacete vermelho) → Azul chutou
  if (deviceId === 1 || deviceId === 3) return 'red';
  if (deviceId === 2 || deviceId === 4) return 'blue';
  return null;
}
```

**Função `createInitialEquipment` (linha 84-91):**
```typescript
function createInitialEquipment(): Map<EquipmentSlot, EquipmentState> {
  return new Map([
    [1, { id: 1, type: 'vest', side: 'blue', battery: null, lastSeen: null }],   // Colete azul
    [2, { id: 2, type: 'vest', side: 'red', battery: null, lastSeen: null }],    // Colete vermelho
    [3, { id: 3, type: 'helmet', side: 'blue', battery: null, lastSeen: null }], // Capacete azul
    [4, { id: 4, type: 'helmet', side: 'red', battery: null, lastSeen: null }],  // Capacete vermelho
  ]);
}
```

---

### Resultado Esperado

Após a correção:
- Golpe no colete azul (ID 1) → Ponto para o **vermelho**
- Golpe no colete vermelho (ID 2) → Ponto para o **azul**
- Golpe no capacete azul (ID 3) → Ponto para o **vermelho**
- Golpe no capacete vermelho (ID 4) → Ponto para o **azul**

---

### Seção Técnica

**Lógica correta:**
```text
Colete/Capacete AZUL (IDs 1, 3) atingido = Jogador VERMELHO chutou = Ponto VERMELHO
Colete/Capacete VERMELHO (IDs 2, 4) atingido = Jogador AZUL chutou = Ponto AZUL
```

**Diagrama:**
```text
Jogador VERMELHO ──chuta──> Colete AZUL (ID 1) ──> Ponto VERMELHO
Jogador AZUL ──chuta──> Colete VERMELHO (ID 2) ──> Ponto AZUL
```

