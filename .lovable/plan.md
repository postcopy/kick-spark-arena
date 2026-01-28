

## Plano: Configuração Personalizada no Modo Duelo

### Objetivo

Substituir as 4 opções predefinidas por controles que permitem escolher livremente:
- **Tempo do round** (em segundos)
- **Dano do colete** (pontos por golpe)
- **Dano do capacete** (pontos por golpe)

---

### Visual Proposto

Em vez de 4 botões com presets, teremos 3 controles deslizantes (sliders) com valores claros:

| Configuração | Mínimo | Máximo | Padrão | Incremento |
|--------------|--------|--------|--------|------------|
| Tempo | 15s | 120s | 45s | 5s |
| Colete | 1 | 10 | 2 | 1 |
| Capacete | 1 | 15 | 3 | 1 |

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/game/ArcadeSetupScreen.tsx` | Redesenhar UI com sliders para tempo e dano |
| `src/pages/Index.tsx` | Adicionar estados para `vestDamage` e `helmetDamage`, passar para hook |
| `src/hooks/useArcadeState.ts` | Aceitar `vestDamage` e `helmetDamage` como props opcionais (sobrescrever auto-config) |

---

### Mudanças Detalhadas

#### 1. `ArcadeSetupScreen.tsx`

**Props adicionais:**
```typescript
interface ArcadeSetupScreenProps {
  onStart: () => void;
  onBack: () => void;
  roundDuration: number;
  onRoundDurationChange: (duration: number) => void;
  vestDamage: number;
  onVestDamageChange: (damage: number) => void;
  helmetDamage: number;
  onHelmetDamageChange: (damage: number) => void;
  bestOf: 1 | 3;
  onBestOfChange: (bestOf: 1 | 3) => void;
}
```

**Nova UI:**
- Remover `DURATION_OPTIONS` grid
- Adicionar 3 sliders (Slider do Radix/Shadcn):
  1. **TEMPO DO ROUND**: 15s-120s (exibe valor atual)
  2. **DANO DO COLETE**: 1-10 (com ícone Shirt)
  3. **DANO DO CAPACETE**: 1-15 (com ícone HardHat, cor amarela)
- Manter seção de Formato (Rápido/Melhor de 3)
- Atualizar preview de regras dinamicamente

#### 2. `Index.tsx`

**Novos estados:**
```typescript
const [vestDamage, setVestDamage] = useState(2);
const [helmetDamage, setHelmetDamage] = useState(3);
```

**Passar para hook:**
```typescript
const arcadeState = useArcadeState({ 
  roundDurationSec: roundDuration, 
  bestOf,
  vestDamage,      // Novo
  helmetDamage,    // Novo
  // ... callbacks
});
```

**Passar para ArcadeSetupScreen:**
```jsx
<ArcadeSetupScreen
  roundDuration={roundDuration}
  onRoundDurationChange={setRoundDuration}
  vestDamage={vestDamage}
  onVestDamageChange={setVestDamage}
  helmetDamage={helmetDamage}
  onHelmetDamageChange={setHelmetDamage}
  bestOf={bestOf}
  onBestOfChange={setBestOf}
  onStart={...}
  onBack={...}
/>
```

#### 3. `useArcadeState.ts`

**Modificar lógica de config:**
```typescript
// Se vestDamage/helmetDamage forem passados explicitamente, usar eles
// Senão, usar o valor do DIFFICULTY_CONFIGS como fallback
const fullConfig = { 
  ...DEFAULT_ARCADE_CONFIG, 
  ...difficultyConfig,
  ...config  // Props do usuário sobrescrevem tudo
};
```

Não precisa mudar nada - já funciona assim! O spread `...config` no final já sobrescreve qualquer valor.

---

### Layout da Nova Tela

```text
┌─────────────────────────────────────────┐
│        DUELO ARCADE                     │
│  Derrube a barra do rival com combos    │
├─────────────────────────────────────────┤
│                                         │
│  ⏱️ TEMPO DO ROUND                      │
│  ◀──────────●───────────────────▶       │
│            45s                          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  👕 DANO DO COLETE                      │
│  ◀───●──────────────────────────▶       │
│      2                                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ⛑️ DANO DO CAPACETE                    │
│  ◀─────●────────────────────────▶       │
│        3                                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🏆 FORMATO                             │
│  [ RÁPIDO ]  [ MELHOR DE 3 ]            │
│                                         │
├─────────────────────────────────────────┤
│  REGRAS                                 │
│  • HP inicial: 100                      │
│  • Combo: até +4 dano                   │
│  • Especial: +12 dano                   │
├─────────────────────────────────────────┤
│   [ Voltar ]      [ INICIAR DUELO ]     │
└─────────────────────────────────────────┘
```

---

### Valores Padrão Inteligentes

Para facilitar, podemos adicionar botões de "preset" pequenos abaixo dos sliders:

```text
  Sugestões: [Kids] [Juvenil] [Adulto]
```

Ao clicar, seta os 3 valores de uma vez (opcional, não obrigatório).

---

### Seção Técnica

**Por que usar Slider ao invés de Input?**
- Mais intuitivo para crianças e adultos
- Visual consistente com o estilo do jogo
- Limita valores a ranges válidos automaticamente
- Touch-friendly para tablets

**Componente Slider já existe:**
- `src/components/ui/slider.tsx` (Radix UI Slider)
- Estilo Shadcn já configurado

**Dependência do hook:**
O `useArcadeState` já aceita props opcionais que sobrescrevem os defaults:
```typescript
const fullConfig = { 
  ...DEFAULT_ARCADE_CONFIG, 
  ...difficultyConfig,
  ...config  // <- vestDamage e helmetDamage aqui sobrescrevem
};
```

