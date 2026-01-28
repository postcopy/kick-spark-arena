
## Plano: Diagnosticar e Corrigir Detecção de Golpes nos Modos de Jogo

### Problema Identificado

A placa do colete acende (recebe dados), mas os golpes não são registrados nos modos de jogo. Após análise do código, identifiquei **três possíveis causas**:

---

### Causa 1: Falta de Logs de Debug

O código atual não tem logs para mostrar os dados recebidos da placa. Sem isso, não é possível saber:
- Se os dados estão chegando
- Em que formato estão (ex: `"850,1,85"`)
- Qual o Device ID sendo enviado

---

### Causa 2: Device ID Não Reconhecido

A função `deviceIdToKickingSide` só reconhece IDs 1-4:

```typescript
function deviceIdToKickingSide(deviceId: number): Side | null {
  if (deviceId === 1 || deviceId === 3) return 'blue';  // Red vest/helmet → Blue kicked
  if (deviceId === 2 || deviceId === 4) return 'red';   // Blue vest/helmet → Red kicked
  return null;  // Qualquer outro ID é IGNORADO!
}
```

Se a placa estiver enviando um ID diferente (ex: 0, 5, 6, 7), os golpes serão silenciosamente ignorados.

---

### Causa 3: Formato de Dados Diferente

O regex espera exatamente 3 números separados por vírgula:

```typescript
const LINE_REGEX = /^\d+,\d+,\d+$/;
```

Se a placa enviar dados em outro formato (ex: com espaços, caracteres extras, ou diferente número de valores), a linha será rejeitada.

---

### Solução Proposta

#### Etapa 1: Adicionar Logs de Debug

Adicionar `console.log` estratégicos no `useSerialPort.ts` para ver:
- Todas as linhas recebidas (antes do parse)
- Resultado do parse (sucesso ou falha)
- Device ID e se foi convertido para um lado válido

```typescript
// Dentro do loop de leitura
for (const line of lines) {
  console.log('[Serial] Linha recebida:', line);  // DEBUG
  
  const parsed = parseLine(line);
  if (!parsed) {
    console.log('[Serial] Linha inválida (regex falhou):', line);  // DEBUG
    continue;
  }
  
  const { intensity, deviceId, battery } = parsed;
  console.log('[Serial] Parsed:', { intensity, deviceId, battery });  // DEBUG
  
  // Update equipment battery state
  updateEquipment(deviceId, battery);
  
  // Convert to kicking side
  const kickingSide = deviceIdToKickingSide(deviceId);
  const hitType = deviceIdToHitType(deviceId);
  
  console.log('[Serial] DeviceID:', deviceId, '→ Side:', kickingSide, 'HitType:', hitType);  // DEBUG
  
  if (kickingSide && !shouldDebounce(kickingSide)) {
    console.log('[Serial] KICK REGISTRADO:', kickingSide, hitType);  // DEBUG
    onKickRef.current(kickingSide, hitType);
  }
}
```

#### Etapa 2: Verificar Dados Reais

Após adicionar os logs, você poderá ver no console do navegador (F12):
1. Se os dados estão chegando
2. Em que formato estão
3. Qual o Device ID real

#### Etapa 3: Ajustar Mapeamento (se necessário)

Se descobrirmos que a placa está enviando IDs diferentes, ajustaremos a função `deviceIdToKickingSide` para reconhecê-los.

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSerialPort.ts` | Adicionar logs de debug no loop de leitura (linhas 165-180) |

---

### Código Detalhado

**`src/hooks/useSerialPort.ts` (linhas 165-180):**

```typescript
for (const line of lines) {
  // DEBUG: Log raw line
  console.log('[Serial] Raw line:', JSON.stringify(line));
  
  const parsed = parseLine(line);
  if (!parsed) {
    console.log('[Serial] Parse failed for:', JSON.stringify(line));
    continue;
  }
  
  const { intensity, deviceId, battery } = parsed;
  console.log('[Serial] Parsed OK:', { intensity, deviceId, battery });
  
  // Update equipment battery state
  updateEquipment(deviceId, battery);
  
  // Convert to kicking side and trigger kick with hit type
  const kickingSide = deviceIdToKickingSide(deviceId);
  const hitType = deviceIdToHitType(deviceId);
  
  console.log('[Serial] DeviceID', deviceId, '→ kickingSide:', kickingSide, 'hitType:', hitType);
  
  if (!kickingSide) {
    console.log('[Serial] Ignored: deviceId not mapped (1-4 only)');
    continue;
  }
  
  if (shouldDebounce(kickingSide)) {
    console.log('[Serial] Debounced:', kickingSide);
    continue;
  }
  
  console.log('[Serial] ✓ Triggering kick:', kickingSide, hitType);
  onKickRef.current(kickingSide, hitType);
}
```

---

### Como Usar os Logs

1. **Abra o Console do Navegador** (F12 → aba Console)
2. **Conecte a placa** na tela de preparação
3. **Inicie um modo de jogo** (Duelo ou Contra o Tempo)
4. **Dê um golpe no colete**
5. **Observe o console** para ver as mensagens `[Serial]`

Os logs mostrarão exatamente onde o fluxo está parando:
- Se não aparecer nenhum `[Serial] Raw line:` → dados não estão chegando
- Se aparecer `[Serial] Parse failed` → formato dos dados está errado
- Se aparecer `DeviceID X → kickingSide: null` → ID não reconhecido
- Se aparecer `Debounced` → golpe ignorado por ser muito rápido
- Se aparecer `✓ Triggering kick` → kick foi enviado (problema está nos hooks de jogo)

---

### Resultado Esperado

Após implementar os logs, teremos visibilidade completa do fluxo de dados e poderemos:
1. Identificar o problema exato
2. Ajustar o mapeamento de IDs se necessário
3. Corrigir o formato do regex se necessário

---

### Seção Técnica

**Fluxo atual sem logs:**
```
Placa → Serial Port → parseLine() → deviceIdToKickingSide() → onKick → registerKick
                                              ↓
                              (silenciosamente ignorado se ID ≠ 1-4)
```

**Fluxo com logs:**
```
Placa → Serial Port → [LOG: Raw line] → parseLine() → [LOG: Parsed/Failed]
                                                          ↓
                            → deviceIdToKickingSide() → [LOG: DeviceID → Side]
                                                          ↓
                            → [LOG: Debounced?] → onKick → [LOG: ✓ Kick triggered]
```

**Possíveis descobertas:**
1. Placa enviando ID 0 ou 5+ → precisamos mapear
2. Formato diferente (ex: `"850; 1; 85"` com ponto-e-vírgula) → ajustar regex
3. Linha com caracteres extras (ex: `"\r850,1,85"`) → normalizar

**Nota importante:** O console do navegador no Lovable preview pode não mostrar os logs da Web Serial devido a restrições de sandbox. Para testar, use o app em uma janela separada via URL publicada ou localhost.
