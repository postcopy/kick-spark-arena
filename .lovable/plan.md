

## Plano: Tela de Preparação de Equipamentos

### Resumo

Integrar o componente `EquipmentSetupScreen` que você criou, com os seguintes ajustes:
1. Criar o componente `OctagonBackground` que ele importa
2. Ajustar tipos para compatibilidade com o sistema existente
3. Integrar no fluxo de navegação do `Index.tsx`

---

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/game/OctagonBackground.tsx` | Background SVG estilo octógono/arena |
| `src/components/game/EquipmentSetupScreen.tsx` | Seu componente (com pequenos ajustes) |

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Index.tsx` | Adicionar estado e fluxo para tela de equipamentos |

---

### 1. Componente `OctagonBackground.tsx`

Background visual inspirado em arena de luta:

```typescript
export function OctagonBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Padrão octógono sutil */}
      <svg className="absolute inset-0 w-full h-full opacity-10" ...>
        {/* Linhas do octógono */}
      </svg>
      
      {/* Brilhos nos cantos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-500/10 blur-3xl" />
    </div>
  );
}
```

---

### 2. Ajustes no `EquipmentSetupScreen.tsx`

O componente que você enviou está quase pronto. Ajustes necessários:

#### Corrigir mapeamento de IDs conforme documentação EngFlex

A documentação do projeto define:
- **ID 1 = Colete Vermelho** (não azul)
- **ID 2 = Colete Azul** (não vermelho)
- **ID 3 = Capacete Vermelho**
- **ID 4 = Capacete Azul**

```typescript
// ANTES (no seu código):
const EQUIPAMENTOS = [
  { id: 1, nome: "Colete azul", cor: "azul" },     // ❌ 
  { id: 2, nome: "Colete vermelho", cor: "vermelho" },
  ...
];

// DEPOIS (corrigido):
const EQUIPAMENTOS = [
  { id: 1, nome: "Colete vermelho", cor: "vermelho" },  // ✓
  { id: 2, nome: "Colete azul", cor: "azul" },
  { id: 3, nome: "Capacete vermelho", cor: "vermelho" },
  { id: 4, nome: "Capacete azul", cor: "azul" },
];
```

#### Ajustar layout para usar `h-full` em vez de `min-h-screen`

Conforme constraint do projeto (apenas Index.tsx usa `h-[100dvh]`):

```typescript
// ANTES:
<div className="relative min-h-screen bg-gradient-navy ...">

// DEPOIS:
<div className="relative h-full w-full overflow-hidden bg-background ...">
```

#### Ajustar tipo para compatibilidade

```typescript
import { UseSerialPortReturn } from '@/types/serial';

export interface EquipmentSetupScreenProps {
  serialPort: UseSerialPortReturn;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
}
```

---

### 3. Integração no `Index.tsx`

Adicionar estado intermediário para mostrar tela de equipamentos:

```typescript
// Novo estado
const [showEquipmentSetup, setShowEquipmentSetup] = useState(false);
const [pendingMode, setPendingMode] = useState<GameMode | null>(null);

// Modificar handleSelectMode
const handleSelectMode = useCallback((mode: GameMode) => {
  if (!canPlay) return;
  
  // Se não está conectado, mostrar tela de equipamentos primeiro
  if (!serialPort.isConnected) {
    setPendingMode(mode);
    setShowEquipmentSetup(true);
    return;
  }
  
  // Já conectado, ir direto para setup
  setGameMode(mode);
  if (mode === 'time_attack') {
    timeAttackState.goToSetup();
  } else if (mode === 'arcade') {
    arcadeState.goToSetup();
  }
}, [canPlay, serialPort.isConnected, timeAttackState, arcadeState]);

// No render, antes do switch normal:
if (showEquipmentSetup && pendingMode) {
  content = (
    <EquipmentSetupScreen
      serialPort={serialPort}
      onContinue={() => {
        setShowEquipmentSetup(false);
        setGameMode(pendingMode);
        if (pendingMode === 'time_attack') {
          timeAttackState.goToSetup();
        } else if (pendingMode === 'arcade') {
          arcadeState.goToSetup();
        }
        setPendingMode(null);
      }}
      onSkip={() => {
        setShowEquipmentSetup(false);
        setGameMode(pendingMode);
        if (pendingMode === 'time_attack') {
          timeAttackState.goToSetup();
        } else if (pendingMode === 'arcade') {
          arcadeState.goToSetup();
        }
        setPendingMode(null);
      }}
      onBack={() => {
        setShowEquipmentSetup(false);
        setPendingMode(null);
      }}
    />
  );
}
```

---

### 4. Fluxo de Navegação Final

```text
HomeScreen
    │
    ├── [Clica em modo] (hardware NÃO conectado)
    │         │
    │         ▼
    │   EquipmentSetupScreen
    │         │
    │         ├── [Conectar USB + Ligar equipamentos]
    │         │         │
    │         │         ▼
    │         │   [Tudo pronto] → Continuar → SetupScreen
    │         │
    │         ├── [Pular] → SetupScreen (modo teclado)
    │         │
    │         └── [Voltar] → HomeScreen
    │
    └── [Clica em modo] (hardware JÁ conectado)
              │
              ▼
        SetupScreen (pula tela de equipamentos)
```

---

### 5. Mudanças Visuais Opcionais

| Elemento | Atual | Proposto |
|----------|-------|----------|
| Background | `bg-gradient-navy` (não existe) | `bg-background` ou gradiente custom |
| Logo | "S-Fight" hardcoded | Usar logo do projeto |
| Classe `cn()` | Definida inline | Importar de `@/lib/utils` |

---

### Resultado Esperado

| Situação | Comportamento |
|----------|---------------|
| Clica modo sem hardware | Abre tela de preparação |
| Conecta placa USB | Card 1 fica verde |
| Liga colete vermelho | Item 1 fica "Online" + bateria |
| 4 equipamentos online | Banner "TUDO PRONTO!" |
| Clica "Continuar" | Vai para setup do modo escolhido |
| Clica "Pular" | Vai para setup (modo teclado) |
| Hardware já conectado | Pula direto para setup |

---

### Seção Técnica

**Compatibilidade de Tipos:**
O seu componente usa `Map<number, any>` para equipment. O sistema atual usa `Map<EquipmentSlot, EquipmentState>` onde:
- `EquipmentSlot` = `1 | 2 | 3 | 4`
- `EquipmentState` = `{ id, type, side, battery, lastSeen }`

Seu código já lida com isso via `raw?.battery ?? raw?.bateria`.

**Constraint de Layout:**
- Apenas `Index.tsx` pode usar `h-[100dvh]`
- Todos os game screens usam `h-full w-full`
- Isso evita nested full-viewport issues

**Mapeamento Correto de IDs (EngFlex):**
```text
ID 1 = Colete Vermelho (Red Vest)
ID 2 = Colete Azul (Blue Vest)
ID 3 = Capacete Vermelho (Red Helmet)
ID 4 = Capacete Azul (Blue Helmet)
```

