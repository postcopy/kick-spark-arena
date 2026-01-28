

## Plano: Corrigir Parsing de Dados Serial (Remover \r)

### Problema Encontrado

A função `parseLine` usa apenas `trim()` que **não remove** o caractere `\r` (carriage return) enviado pelo ESP32. O regex falha porque encontra `850,1,85\r` ao invés de `850,1,85`.

---

### Evidência nos Logs

Nos screenshots que você enviou, todas as linhas terminam com `\r`:
- `"ESP-ROM:esp32s3-20210327\r"`
- `"\r"` (linha vazia que é só \r)

Quando o ESP32 enviar um golpe como `850,1,85\r`, o regex `^\d+,\d+,\d+$` vai rejeitar porque o `$` espera o fim da string, mas encontra `\r`.

---

### Solução

Atualizar a função `parseLine` para remover `\r` explicitamente antes de validar:

---

### Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSerialPort.ts` | Atualizar função `parseLine` (linhas 40-50) |

---

### Código Atual vs Novo

**Atual (linhas 40-50):**
```typescript
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
```

**Novo:**
```typescript
function parseLine(line: string): ParsedLine | null {
  // Clean the line: remove \r, ANSI codes, and trim whitespace
  const cleanLine = line
    .replace(/\r/g, '')                    // Remove carriage return (ESP32 sends \r\n)
    .replace(/\x1b\[[0-9;]*m/g, '')        // Remove ANSI color codes from debug output
    .trim();
  
  if (!LINE_REGEX.test(cleanLine)) return null;
  
  const parts = cleanLine.split(',');
  return {
    intensity: parseInt(parts[0], 10),
    deviceId: parseInt(parts[1], 10),
    battery: parseInt(parts[2], 10),
  };
}
```

---

### O Que Vai Acontecer

| Entrada | Limpeza | Resultado |
|---------|---------|-----------|
| `"850,1,85\r"` | `"850,1,85"` | Parsed OK |
| `"ESP-ROM:esp32s3\r"` | `"ESP-ROM:esp32s3"` | Parse failed (correto) |
| `"\x1b[0;32mI (801)...\r"` | `"I (801)..."` | Parse failed (correto) |

---

### Resultado Esperado

Após a correção:
1. Mensagens de boot do ESP32 → Continuam sendo rejeitadas (correto)
2. Dados de golpe `850,1,85\r` → Serão aceitos e processados
3. Golpes serão registrados nos modos de jogo

---

### Seção Técnica

**Por que `trim()` não funciona?**

`String.trim()` remove apenas espaços em branco do início e fim (space, tab, newline). O `\r` (carriage return, código 13) é considerado whitespace, MAS apenas quando está sozinho ou com espaços. Quando está junto de outros caracteres como em `85\r`, o comportamento pode variar.

A solução mais segura é remover `\r` explicitamente com `.replace(/\r/g, '')`.

**Por que remover códigos ANSI?**

O ESP32 envia cores no terminal (ex: `\x1b[0;32m` = verde). Embora não afetem dados de golpe, é bom limpar para evitar problemas futuros se o firmware mudar.

