
# Substituir Roxo por Dourado/Amarelo

## Escopo da Mudanca

A cor roxa (`purple-500`, `purple-600`) é usada em 5 arquivos para elementos de destaque e acões secundárias no modo campeonato. Vou substituir por **amarelo/dourado** (`yellow-500`, `yellow-600`) que combina com a faixa do timer.

## Arquivos a Modificar

### 1. ChampionshipMat.tsx
**Status indicator e botão de reset:**
```tsx
// DE:
"bg-purple-500/20 text-purple-500"
"bg-purple-600 hover:bg-purple-500"

// PARA:
"bg-yellow-500/20 text-yellow-500"
"bg-yellow-600 hover:bg-yellow-500 text-black"
```

### 2. ScoreboardMain.tsx
**Overlay de fim de luta:**
```tsx
// DE:
"bg-purple-600 hover:bg-purple-500"
"text-primary" (roxo atual)

// PARA:
"bg-yellow-600 hover:bg-yellow-500 text-black"
"text-[hsl(var(--sulsport-yellow))]"
```

### 3. OperatorPanel.tsx
**Botões de próximo round, conectar e reset:**
```tsx
// DE:
"bg-purple-600 hover:bg-purple-500"

// PARA:
"bg-yellow-600 hover:bg-yellow-500 text-black"
```

### 4. EventLogDialog.tsx
**Cor do evento MATCH_END:**
```tsx
// DE:
"text-purple-400"

// PARA:
"text-yellow-400"
```

### 5. HomeScreen.tsx
**Botão de campeonato na home:**
```tsx
// DE:
"from-purple-500/20 to-purple-500/5 border-purple-500/50"
"bg-purple-500/20 text-purple-500"

// PARA:
"from-yellow-500/20 to-yellow-500/5 border-yellow-500/50"
"bg-yellow-500/20 text-yellow-500"
```

---

## Paleta Final

| Uso | Antes (Roxo) | Depois (Dourado) |
|-----|--------------|------------------|
| Botões primários | `bg-purple-600` | `bg-yellow-600 text-black` |
| Hover | `bg-purple-500` | `bg-yellow-500` |
| Texto destaque | `text-purple-500` | `text-yellow-500` |
| Background sutil | `bg-purple-500/20` | `bg-yellow-500/20` |

## Nota Tecnica

Como o amarelo é uma cor clara, os botões precisam de `text-black` para garantir contraste e legibilidade.
