
# Fix: Substituir Inputs por Selects no ChampionshipSetup

## Problema
Os campos `<Input type="number">` para Minutos/Segundos estao concatenando digitos quando o usuario digita:
- Input mostra `1` minuto
- Usuario digita `2`
- Resultado: `12` minutos (em vez de substituir para `2`)

Alem disso, o codigo atual tem bug de **stale state** - usa `roundTime.seconds` (valor derivado) em vez de ler de `prev` no callback.

---

## Solucao

Substituir os 6 inputs numericos por componentes `<Select>` com opcoes predefinidas e corrigir o stale state.

---

## Mudancas no Codigo

### 1. Adicionar Import do Select

```text
Linha 5: Adicionar import do Select apos o Input
```

```typescript
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

### 2. Criar Arrays de Opcoes

```text
Linha 99 (apos breakTime): Adicionar arrays de opcoes
```

```typescript
// Options for time selects - avoid concatenation bug
const minuteOptions = Array.from({ length: 16 }, (_, i) => i); // 0..15
const secondOptions = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10...55
```

### 3. Substituir os 6 Inputs por Selects

#### 3.1 Tempo de Round - Minutos (linhas 143-153)

```text
Antes:
<Input type="number" min={0} max={10} value={roundTime.minutes} onChange={...} />

Depois:
```

```tsx
<Select
  value={String(roundTime.minutes)}
  onValueChange={(value) => setConfig(prev => {
    const cur = formatMsToMinSec(prev.roundTimeMs);
    return {
      ...prev,
      roundTimeMs: parseMinSecToMs(parseInt(value), cur.seconds)
    };
  })}
>
  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {minuteOptions.map((min) => (
      <SelectItem key={min} value={String(min)}>
        {min}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 3.2 Tempo de Round - Segundos (linhas 157-167)

```tsx
<Select
  value={String(roundTime.seconds)}
  onValueChange={(value) => setConfig(prev => {
    const cur = formatMsToMinSec(prev.roundTimeMs);
    return {
      ...prev,
      roundTimeMs: parseMinSecToMs(cur.minutes, parseInt(value))
    };
  })}
>
  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {secondOptions.map((sec) => (
      <SelectItem key={sec} value={String(sec)}>
        {sec.toString().padStart(2, '0')}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 3.3 Tempo Medico - Minutos (linhas 181-191)

```tsx
<Select
  value={String(medicalTime.minutes)}
  onValueChange={(value) => setConfig(prev => {
    const cur = formatMsToMinSec(prev.medicalTimeMs);
    return {
      ...prev,
      medicalTimeMs: parseMinSecToMs(parseInt(value), cur.seconds)
    };
  })}
>
  {/* SelectTrigger + SelectContent com minuteOptions */}
</Select>
```

#### 3.4 Tempo Medico - Segundos (linhas 195-205)

```tsx
<Select
  value={String(medicalTime.seconds)}
  onValueChange={(value) => setConfig(prev => {
    const cur = formatMsToMinSec(prev.medicalTimeMs);
    return {
      ...prev,
      medicalTimeMs: parseMinSecToMs(cur.minutes, parseInt(value))
    };
  })}
>
  {/* SelectTrigger + SelectContent com secondOptions */}
</Select>
```

#### 3.5 Intervalo entre Rounds - Minutos (linhas 219-229)

```tsx
<Select
  value={String(breakTime.minutes)}
  onValueChange={(value) => setConfig(prev => {
    const cur = formatMsToMinSec(prev.breakTimeMs);
    return {
      ...prev,
      breakTimeMs: parseMinSecToMs(parseInt(value), cur.seconds)
    };
  })}
>
  {/* SelectTrigger + SelectContent com minuteOptions */}
</Select>
```

#### 3.6 Intervalo entre Rounds - Segundos (linhas 233-243)

```tsx
<Select
  value={String(breakTime.seconds)}
  onValueChange={(value) => setConfig(prev => {
    const cur = formatMsToMinSec(prev.breakTimeMs);
    return {
      ...prev,
      breakTimeMs: parseMinSecToMs(cur.minutes, parseInt(value))
    };
  })}
>
  {/* SelectTrigger + SelectContent com secondOptions */}
</Select>
```

---

## Resumo das Substituicoes

| Campo | Input Antes | Select Depois |
|-------|-------------|---------------|
| Round Time (min) | `type="number" min=0 max=10` | `Select 0-15` |
| Round Time (seg) | `type="number" min=0 max=59` | `Select 0-55 step 5` |
| Medical Time (min) | `type="number" min=0 max=5` | `Select 0-15` |
| Medical Time (seg) | `type="number" min=0 max=59` | `Select 0-55 step 5` |
| Break Time (min) | `type="number" min=0 max=5` | `Select 0-15` |
| Break Time (seg) | `type="number" min=0 max=59` | `Select 0-55 step 5` |

---

## Correcao do Stale State

O codigo atual tinha este bug:

```tsx
// ERRADO - roundTime.seconds e valor derivado, pode estar stale
onChange={(e) => setConfig(prev => ({
  ...prev,
  roundTimeMs: parseMinSecToMs(parseInt(e.target.value), roundTime.seconds) // stale!
}))}
```

Corrigido para:

```tsx
// CORRETO - lê de prev.roundTimeMs dentro do callback
onValueChange={(value) => setConfig(prev => {
  const cur = formatMsToMinSec(prev.roundTimeMs); // sempre fresco
  return {
    ...prev,
    roundTimeMs: parseMinSecToMs(parseInt(value), cur.seconds)
  };
})}
```

---

## Criterios de Aceite

| # | Criterio | Validacao |
|---|----------|-----------|
| 1 | Selecionar 1 min + 30 seg | Timer mostra 01:30 na Mesa/TV (90.000ms) |
| 2 | Segundos apenas valores validos | Select oferece 0, 5, 10, 15...55 |
| 3 | Minutos de 0 a 15 | Cobre kids (1:00), padrao (2:00), variacoes (5:00+) |
| 4 | Persistencia localStorage | Reabrir Setup mantem selecao |
| 5 | Sem bug de concatenacao | Impossivel com Select |
| 6 | Stale state corrigido | Usa `prev.xxxTimeMs` no callback |

---

## Secao Tecnica

### Arquivo Modificado
- `src/pages/ChampionshipSetup.tsx`

### Linhas Afetadas
- Linha 5: Novo import
- Linha 99: Arrays de opcoes
- Linhas 143-153: Round Time minutos
- Linhas 157-167: Round Time segundos
- Linhas 181-191: Medical Time minutos
- Linhas 195-205: Medical Time segundos
- Linhas 219-229: Break Time minutos
- Linhas 233-243: Break Time segundos

### Dependencias Usadas
- `@/components/ui/select` (ja existe no projeto)
