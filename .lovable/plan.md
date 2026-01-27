

## Plano: Melhorar HomeScreen - Remover Duplicação da Logo

### Problema Identificado

A logo S-Fighter aparece **duas vezes** na mesma tela:
1. No **header** (canto superior esquerdo)
2. No **centro da tela** (acima do título "Escolha um modo")

Isso causa redundância visual e ocupa espaço desnecessário.

---

### Solução Proposta

Remover a logo duplicada do centro e reorganizar o layout para ficar mais limpo e focado na seleção de modo.

---

### Mudanças no `HomeScreen.tsx`

| Local | Antes | Depois |
|-------|-------|--------|
| Centro da tela | Logo + título "Escolha um modo" | Apenas título (sem logo) |
| Header | Logo pequena | Mantém (única instância) |
| Espaçamento | Muito espaço ocupado pela logo central | Mais compacto e equilibrado |

---

### Layout Proposto

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Logo S-Fighter]                        Olá, vendas  [☰ Menu] │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│                                                                 │
│                      Escolha um modo                            │
│                     Toque para começar                          │
│                                                                 │
│     ┌─────────────────────┐  ┌─────────────────────┐           │
│     │   ⏱ CONTRA O TEMPO  │  │    ⚔ DUELO         │           │
│     │   Quem chuta mais?   │  │   Luta até o K.O.! │           │
│     └─────────────────────┘  └─────────────────────┘           │
│                                                                 │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│                    ● Use A e L no teclado                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### Código a Modificar

**Arquivo:** `src/components/game/HomeScreen.tsx`

**Remover linhas 50-57** (logo central duplicada):

```typescript
// REMOVER ESTE BLOCO:
{/* Logo Grande */}
<div className="mb-2 md:mb-4 text-center">
  <img 
    src={logoSfighter} 
    alt="S-Fighter" 
    className="h-10 sm:h-12 md:h-16 lg:h-20 w-auto mx-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
  />
</div>
```

**Ajustar espaçamento do título** (já que não tem mais logo acima):

```typescript
// ANTES:
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-0.5 text-center">

// DEPOIS: Título um pouco maior para preencher melhor o espaço
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 text-center">
```

---

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| Logo no header + Logo no centro | Logo apenas no header |
| Visual repetitivo | Visual limpo e focado |
| Muito espaço vertical ocupado | Melhor aproveitamento do espaço |

---

### Seção Técnica

**Arquivo modificado:** `src/components/game/HomeScreen.tsx`

**Mudanças:**
1. Remover bloco das linhas 50-57 (div com logo central)
2. Aumentar tamanho da fonte do título h1
3. Ajustar margin-bottom do título

**Impacto:** Nenhum em outros arquivos - mudança isolada no HomeScreen.

