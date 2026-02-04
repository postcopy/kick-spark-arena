# Plano: Ajustes Visuais Sulsport + Correções Técnicas

## Status: APROVADO ✅

## Confirmações Finais Alinhadas

| # | Requisito | Implementação |
|---|-----------|---------------|
| 1 | GAM-JEOM [+] habilitado SOMENTE quando `status === 'RUNNING'` | ✅ |
| 2 | GAM-JEOM [-] habilitado SOMENTE quando `status !== 'RUNNING'` E `gamjeom > 0` | ✅ |
| 3 | Regra do [-]: NÃO durante RUNNING (mais seguro em competição) | ✅ |
| 4 | CSS variables HEX dentro de `:root { }`, fáceis de ajustar | ✅ |
| 5 | removeGamjeom: log claro + sem negativos | ✅ |
| 6 | `const MAX_EVENTS = 500` como constante, usar `.slice(0, MAX_EVENTS)` | ✅ |

---

## Arquivos a Modificar (ordem de execução)

1. `src/index.css` - Adicionar CSS variables Sulsport no `:root`
2. `src/hooks/useChampionshipSync.ts` - Adicionar `removeGamjeom` + `MAX_EVENTS = 500`
3. `src/components/championship/ScoreboardMain.tsx` - Redesign layout 3 colunas Sulsport
4. `src/pages/ChampionshipTV.tsx` - Redesign layout 3 colunas Sulsport fullscreen
5. `src/components/championship/OperatorPanel.tsx` - GAM-JEOM [-][+] ativos + botões quadrados uppercase
6. `src/pages/ChampionshipMat.tsx` - Detectar fechamento real da janela TV via `windowRef.closed`
7. `src/components/championship/EventLog.tsx` - Exibir últimos 10 eventos (slice apenas na UI)

---

## Mudanças Detalhadas

### 1. CSS Variables Sulsport (`src/index.css`)

Adicionar dentro do `:root { ... }` existente:

```css
/* ========================================
   SULSPORT CHAMPIONSHIP COLORS
   Solid HEX - Easy to adjust for 100% match
   ======================================== */
--sulsport-blue: #1e40af;        /* Main blue panel */
--sulsport-blue-light: #3b82f6;  /* Blue text/accents */
--sulsport-blue-dark: #1e3a8a;   /* Blue darker variant */
--sulsport-red: #b91c1c;         /* Main red panel */
--sulsport-red-light: #ef4444;   /* Red text/accents */
--sulsport-red-dark: #991b1b;    /* Red darker variant */
--sulsport-yellow: #eab308;      /* Timer band */
--sulsport-yellow-dark: #ca8a04; /* Yellow darker */
--sulsport-black: #0a0a0a;       /* Center column */
--sulsport-dark: #18181b;        /* Panel backgrounds */
--sulsport-gray: #27272a;        /* Borders/dividers */
```

### 2. Hook - MAX_EVENTS + removeGamjeom (`src/hooks/useChampionshipSync.ts`)

#### Adicionar constante no topo:
```typescript
const MAX_EVENTS = 500;
```

#### Adicionar no interface `UseChampionshipSyncReturn`:
```typescript
removeGamjeom: (side: MatchSide) => void;
```

#### Adicionar função `removeGamjeom` após `addGamjeom`:
```typescript
const removeGamjeom = useCallback((side: MatchSide) => {
  if (role !== 'master') return;
  // [-] só habilitado quando NÃO está RUNNING
  if (state.status === 'RUNNING') return;
  
  // Não permite negativo
  const currentGamjeom = side === 'RED' ? state.gamjeomRed : state.gamjeomBlue;
  if (currentGamjeom <= 0) return;
  
  saveToHistory(state);
  
  const sideLabel = side === 'RED' ? 'Vermelho' : 'Azul';
  const opponentLabel = side === 'RED' ? 'Azul' : 'Vermelho';
  
  setState(prev => {
    const newState: MatchState = {
      ...prev,
      gamjeomRed: side === 'RED' ? prev.gamjeomRed - 1 : prev.gamjeomRed,
      gamjeomBlue: side === 'BLUE' ? prev.gamjeomBlue - 1 : prev.gamjeomBlue,
      // Remove 1 ponto do oponente (reverso do addGamjeom)
      roundScoreRed: side === 'BLUE' ? Math.max(0, prev.roundScoreRed - 1) : prev.roundScoreRed,
      roundScoreBlue: side === 'RED' ? Math.max(0, prev.roundScoreBlue - 1) : prev.roundScoreBlue,
      events: [
        createEvent('GAMJEOM', `GAM-JEOM REMOVIDO (${sideLabel}) → -1 ponto ${opponentLabel}`, side, -1),
        ...prev.events
      ].slice(0, MAX_EVENTS),
    };
    broadcast(newState, true);
    return newState;
  });
}, [role, state, saveToHistory, broadcast]);
```

#### Alterar todos os `.slice(0, 100)` para `.slice(0, MAX_EVENTS)` (encontrar e substituir)

#### Adicionar no return:
```typescript
removeGamjeom,
```

### 3. ScoreboardMain - Layout 3 Colunas Sulsport

Layout visual:
```
┌────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌────────────────────┐ ┌──────────────┐      │
│ │              │ │       MATCH        │ │              │      │
│ │    CHUNG     │ ├────────────────────┤ │     HONG     │      │
│ │    (BRA)     │ │ ████████████████   │ │    (KOR)     │      │
│ │              │ │      1:30          │ │              │      │
│ │      08      │ │  (faixa amarela)   │ │      12      │      │
│ │              │ ├────────────────────┤ │              │      │
│ │              │ │       ROUND        │ │              │      │
│ │              │ │         1          │ │              │      │
│ ├──────────────┤ └────────────────────┘ ├──────────────┤      │
│ │ GAM-JEOM   1 │                        │ GAM-JEOM   2 │      │
│ │ ROUNDS  ● ○  │                        │ ROUNDS  ● ●  │      │
│ │ HITS      0  │                        │ HITS      0  │      │
│ └──────────────┘                        └──────────────┘      │
└────────────────────────────────────────────────────────────────┘
```

- Lado AZUL: `bg-[var(--sulsport-blue)]` (sem gradiente)
- Lado VERMELHO: `bg-[var(--sulsport-red)]` (sem gradiente)
- Centro: `bg-[var(--sulsport-black)]`
- Timer band: `bg-[var(--sulsport-yellow)] text-black`
- ROUNDS = `roundWinsRed/Blue` (indicadores ●●○)
- HITS = placeholder `0`

### 4. ChampionshipTV - Layout Sulsport Fullscreen

Mesmo layout 3 colunas, adaptado para fullscreen:
- Timer: `font-size: clamp(100px, 15vw, 200px)`
- Placares: `font-size: clamp(140px, 20vw, 280px)`
- Cores sólidas usando CSS variables
- Animação `scale` sutil quando pontuação muda (sem glow)

### 5. OperatorPanel - GAM-JEOM [-][+] Ativos

Regras exatas implementadas nos botões:
- **[+]** `disabled={!isRunning}` - habilitado SOMENTE quando `status === 'RUNNING'`
- **[-]** `disabled={isRunning || state.gamjeomBlue === 0}` - habilitado SOMENTE quando `status !== 'RUNNING'` E `gamjeom > 0`

Estilo dos botões:
- `rounded-md` (mais quadrados)
- Texto UPPERCASE
- Cores Sulsport via CSS variables

Remover texto: "[-] apenas via Alterar Placar"

### 6. ChampionshipMat - Detecção Real de Fechamento TV

```typescript
const [isTVOpen, setIsTVOpen] = useState(false);
const tvWindowRef = useRef<Window | null>(null);

const handleOpenTV = () => {
  tvWindowRef.current = window.open(
    `/championship/tv?mat=${matId}`, 
    `championship-tv-${matId}`,
    'width=1920,height=1080'
  );
  if (tvWindowRef.current) {
    setIsTVOpen(true);
  }
};

// Polling para detectar fechamento
useEffect(() => {
  if (!isTVOpen || !tvWindowRef.current) return;
  
  const checkClosed = setInterval(() => {
    if (tvWindowRef.current?.closed) {
      setIsTVOpen(false);
      tvWindowRef.current = null;
    }
  }, 1000);
  
  return () => clearInterval(checkClosed);
}, [isTVOpen]);
```

### 7. EventLog - Mostrar 10 Eventos na UI

Alterar de `slice(0, 5)` para `slice(0, 10)`:

```typescript
const recentEvents = events.slice(0, 10);
```

---

## Resumo Técnico

| Item | Implementação |
|------|---------------|
| MAX_EVENTS | Constante `500`, usar `.slice(0, MAX_EVENTS)` em todos os pontos |
| removeGamjeom | Decrementa gamjeom, remove 1 ponto do oponente, log claro |
| CSS Variables | HEX dentro de `:root { }`, fácil ajustar |
| GAM-JEOM [+] | Habilitado SOMENTE quando `status === 'RUNNING'` |
| GAM-JEOM [-] | Habilitado SOMENTE quando `status !== 'RUNNING'` E `gamjeom > 0` |
| TV Status | Polling real com `windowRef.closed` |
| ROUNDS | = `roundWinsRed/Blue` (indicadores ●●○) |
| HITS | = placeholder `0` |
