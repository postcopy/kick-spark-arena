

## Plano: Corrigir Cards de Modo de Jogo Cortando Texto

### Problema Identificado

Os cards de seleção de modo estão cortando o texto na parte inferior. Isso acontece porque:

1. Os buttons têm **altura fixa** (`lg:h-[clamp(120px,18vh,160px)]`)
2. O conteúdo (ícone + título + subtítulo + badge "X jogadores") não cabe nessa altura
3. O texto "1 ou 2 jogadores" e "2 jogadores" está sendo cortado

---

### Solução

Trocar a altura fixa por altura mínima (`min-h`) e usar `overflow-visible` para garantir que todo o conteúdo seja exibido. Também ajustar o layout interno para distribuir melhor o espaço.

---

### Mudanças no Código

**Arquivo:** `src/components/game/HomeScreen.tsx`

| Problema | Solução |
|----------|---------|
| `lg:h-[clamp(120px,18vh,160px)]` altura fixa | Trocar por `lg:min-h-[140px]` altura mínima |
| Conteúdo sem overflow explícito | Adicionar `overflow-visible` |
| Layout interno apertado | Usar `flex-col h-full justify-between` para distribuir |

---

### Código Atualizado

```typescript
// ANTES - Card Time Attack (linha 61-86):
<button
  onClick={() => handleSelectMode('time_attack')}
  className="group flex-1 p-3 md:p-4 lg:p-6 bg-gradient-to-br from-game-yellow/20 to-game-yellow/5 border-2 border-game-yellow/50 rounded-2xl hover:border-game-yellow hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] min-h-[80px] md:min-h-[100px] lg:h-[clamp(120px,18vh,160px)]"
>

// DEPOIS:
<button
  onClick={() => handleSelectMode('time_attack')}
  className="group flex-1 p-4 md:p-5 lg:p-6 bg-gradient-to-br from-game-yellow/20 to-game-yellow/5 border-2 border-game-yellow/50 rounded-2xl hover:border-game-yellow hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] min-h-[100px] md:min-h-[120px] lg:min-h-[160px]"
>
```

**Mesma mudança para o card DUELO (linha 89-114).**

---

### Layout Interno Ajustado

Reorganizar o conteúdo interno para usar flexbox vertical com espaçamento automático:

```typescript
// ANTES:
<div className="flex items-center lg:flex-col lg:items-center gap-3 lg:gap-0">
  ...
</div>
<div className="hidden lg:flex items-center justify-center gap-2 mt-2">
  ...
</div>

// DEPOIS:
<div className="flex flex-col h-full">
  <div className="flex items-center lg:flex-col lg:items-center gap-3 lg:gap-2 flex-1">
    ...
  </div>
  <div className="hidden lg:flex items-center justify-center gap-2 mt-auto pt-2">
    ...
  </div>
</div>
```

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Texto "1 ou 2 jogadores" cortado | Todo texto visível |
| Altura fixa causa overflow | Altura mínima se adapta ao conteúdo |
| Layout apertado | Espaçamento equilibrado |

---

### Seção Técnica

**Mudanças específicas:**

1. **Linha 63**: Trocar `lg:h-[clamp(120px,18vh,160px)]` por `lg:min-h-[160px]`
2. **Linha 63**: Aumentar padding de `p-3` para `p-4`
3. **Linha 65**: Adicionar wrapper `flex flex-col h-full` para conteúdo
4. **Linha 80**: Adicionar `mt-auto pt-2` no div do badge para empurrar para baixo
5. **Aplicar mesmas mudanças ao card DUELO (linhas 89-114)**

**Classes atualizadas:**
- Botões: `min-h-[100px] md:min-h-[120px] lg:min-h-[160px]` (altura mínima em vez de fixa)
- Padding: `p-4 md:p-5 lg:p-6` (mais espaço interno)
- Container interno: `flex flex-col h-full` para distribuição vertical

