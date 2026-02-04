
# Plano: Refinamento Visual Final Sulsport

## Confirmação CSS Variables
As variáveis Sulsport estão em **formato HSL triplet**:
```css
--sulsport-yellow: 45 93% 47%;
```
✅ Portanto, `hsl(var(--sulsport-x))` está **correto** e não precisa mudar.

---

## Arquivos a Modificar

| # | Arquivo | Mudanças |
|---|---------|----------|
| 1 | `src/types/championship.ts` | Adicionar `matchNumber?: string` ao MatchConfig |
| 2 | `src/components/championship/ScoreboardMain.tsx` | Centro: faixa `h-20`, matchNumber, status PAUSADO/T.MÉDICO no lugar certo |
| 3 | `src/pages/ChampionshipTV.tsx` | Remover TODOS os badges, faixa fina, overlay VENCEDOR só em MATCH_END |

---

## 1. MatchConfig - Adicionar matchNumber

```typescript
// Adicionar em MatchConfig (após matId):
matchNumber?: string;  // "001", "002", etc.
```

---

## 2. ScoreboardMain.tsx - Centro Redesenhado

### Estrutura Atual (Problema)
```text
┌──────────────────┐
│      MATCH       │ ← Sem número
├──────────────────┤
│                  │
│     1:30         │ ← flex-1 (bloco grande)
│                  │
├──────────────────┤
│      ROUND 1     │
├──────────────────┤
│    T. MÉDICO     │ ← Posição errada (embaixo)
└──────────────────┘
```

### Nova Estrutura (Sulsport)
```text
┌──────────────────┐
│      MATCH       │ ← Label
│       001        │ ← config.matchNumber || "001"
├──────────────────┤
│ ████ 1:30 ██████ │ ← h-20 (faixa fina amarela)
├──────────────────┤
│     PAUSADO      │ ← Só quando !isRunning && !isMatchEnd
├──────────────────┤
│      ROUND       │
│        1         │
└──────────────────┘
(VENCEDOR só quando MATCH_END, integrado no centro)
```

### Mudanças Específicas

**Linhas 71-130 - Coluna Central:**

```tsx
{/* CENTER Column - Timer & Round */}
<div className="w-48 flex flex-col bg-[hsl(var(--sulsport-black))] rounded-lg overflow-hidden">
  {/* MATCH header + number */}
  <div className="flex-1 flex flex-col items-center justify-center border-b border-white/10">
    <span className="text-lg font-bold text-white uppercase tracking-[0.2em]">MATCH</span>
    <span className="text-2xl font-bold text-white tabular-nums">
      {state.config.matchNumber || '001'}
    </span>
  </div>
  
  {/* Timer - Yellow BAND (thin, fixed height h-20) */}
  <div className={cn(
    "h-20 flex items-center justify-center",
    isMedical 
      ? "bg-[hsl(var(--sulsport-yellow-dark))]" 
      : "bg-[hsl(var(--sulsport-yellow))]"
  )}>
    <div 
      className={cn(
        "text-[clamp(36px,6vw,56px)] font-black leading-none tabular-nums text-black",
        state.timeLeftMs <= 10000 && isRunning && "animate-pulse"
      )}
    >
      {formatTime(state.timeLeftMs)}
    </div>
  </div>
  
  {/* Status (PAUSADO / T. MÉDICO) - abaixo da faixa amarela */}
  {!isRunning && !isMatchEnd && (
    <div className="h-10 flex items-center justify-center bg-[hsl(var(--sulsport-yellow))]/10">
      <span className="text-sm font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider">
        {isMedical ? 'T. MÉDICO' : 'PAUSADO'}
      </span>
    </div>
  )}
  
  {/* ROUND info */}
  <div className="flex-1 flex flex-col items-center justify-center border-t border-white/10">
    <span className="text-xs text-white/60 uppercase font-bold tracking-wider">ROUND</span>
    <span className="text-4xl font-black text-white">{state.round}</span>
  </div>
  
  {/* Match winner - só quando MATCH_END, integrado no centro */}
  {isMatchEnd && (
    <div className="h-16 flex flex-col items-center justify-center bg-white/5 border-t border-white/10">
      <div className="text-xs text-white/60 uppercase tracking-wider">VENCEDOR</div>
      <div className={cn(
        "text-sm font-black uppercase",
        state.roundWinsRed > state.roundWinsBlue 
          ? "text-[hsl(var(--sulsport-red-light))]" 
          : "text-[hsl(var(--sulsport-blue-light))]"
      )}>
        {state.roundWinsRed > state.roundWinsBlue 
          ? (state.config.athleteRed?.name || 'HONG')
          : (state.config.athleteBlue?.name || 'CHUNG')
        }
      </div>
    </div>
  )}
</div>
```

**Remover:** Linhas 104-111 (indicador T. MÉDICO duplicado no final)

---

## 3. ChampionshipTV.tsx - 100% Read-Only

### Remover Completamente

**Linhas 154-176:** Todos os badges de status
```tsx
// REMOVER TUDO ISSO:
{isMedical && (
  <span className="px-4 py-1 bg-[hsl(var(--sulsport-yellow))]/20 ...">TEMPO MÉDICO</span>
)}
{isRunning && !isMedical && (
  <span className="px-4 py-1 bg-green-500/20 ...">AO VIVO</span>
)}
{isRoundEnd && !isMatchEnd && (
  <span className="px-4 py-1 bg-[hsl(var(--sulsport-yellow))]/20 ...">FIM ROUND</span>
)}
{isMatchEnd && (
  <span className="px-4 py-1 bg-purple-500/20 ...">FIM LUTA</span>
)}
```

**Linhas 231-249:** Barra fixa VENCEDOR no rodapé
```tsx
// REMOVER TUDO ISSO:
{isMatchEnd && (
  <div className="h-24 bg-gradient-to-r from-...">
    <div className="text-center">
      <div className="text-lg ...">VENCEDOR</div>
      ...
    </div>
  </div>
)}
```

### Nova Coluna Central (Linhas 120-177)

```tsx
{/* CENTER Column - Timer & Round */}
<div className="w-72 flex flex-col bg-[hsl(var(--sulsport-dark))] rounded-2xl overflow-hidden border border-[hsl(var(--sulsport-gray))]">
  {/* MATCH header + number */}
  <div className="flex-1 flex flex-col items-center justify-center border-b border-[hsl(var(--sulsport-gray))]">
    <span className="text-2xl font-bold text-white uppercase tracking-[0.3em]">MATCH</span>
    <span className="text-4xl font-bold text-white tabular-nums">
      {state.config.matchNumber || '001'}
    </span>
  </div>
  
  {/* Timer - Yellow BAND (thin, fixed height h-24) */}
  <div className={cn(
    "h-24 flex items-center justify-center",
    isMedical 
      ? "bg-[hsl(var(--sulsport-yellow-dark))]" 
      : "bg-[hsl(var(--sulsport-yellow))]"
  )}>
    <div 
      className={cn(
        "font-black leading-none tabular-nums text-black",
        state.timeLeftMs <= 10000 && isRunning && "animate-pulse"
      )}
      style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
    >
      {formatTime(state.timeLeftMs)}
    </div>
  </div>
  
  {/* Status (PAUSADO / T. MÉDICO) - texto simples, NÃO badge */}
  {!isRunning && !isMatchEnd && (
    <div className="h-12 flex items-center justify-center">
      <span className="text-xl font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider">
        {isMedical ? 'T. MÉDICO' : 'PAUSADO'}
      </span>
    </div>
  )}
  
  {/* ROUND info */}
  <div className="flex-1 flex flex-col items-center justify-center border-t border-[hsl(var(--sulsport-gray))]">
    <span className="text-lg text-white/60 uppercase font-bold tracking-wider">ROUND</span>
    <span className="text-7xl font-black text-white">{state.round}</span>
  </div>
</div>
```

### Novo Overlay VENCEDOR (após o main layout, antes do fechamento)

```tsx
{/* VENCEDOR - Overlay discreto SOMENTE quando MATCH_END */}
{isMatchEnd && (
  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="text-3xl text-white/60 uppercase tracking-[0.3em] mb-4">VENCEDOR</div>
      <div className={cn(
        "text-7xl font-black uppercase",
        state.roundWinsRed > state.roundWinsBlue 
          ? "text-[hsl(var(--sulsport-red-light))]" 
          : "text-[hsl(var(--sulsport-blue-light))]"
      )}>
        {state.roundWinsRed > state.roundWinsBlue 
          ? (state.config.athleteRed?.name || 'HONG')
          : (state.config.athleteBlue?.name || 'CHUNG')
        }
      </div>
    </div>
  </div>
)}
```

**Manter:** Linhas 251-257 (barra de empate) - faz sentido manter para decisão do árbitro.

---

## Resumo Visual das Mudanças

### ScoreboardMain - Centro
| Antes | Depois |
|-------|--------|
| Timer `flex-1` (bloco) | Timer `h-20` (faixa fina) |
| MATCH sem número | MATCH + "001" |
| T. MÉDICO no fundo | Status abaixo da faixa |
| Sem PAUSADO | PAUSADO quando pausado |

### ChampionshipTV
| Antes | Depois |
|-------|--------|
| Badges (AO VIVO, FIM LUTA, etc.) | Removidos |
| Timer `flex-1` (bloco) | Timer `h-24` (faixa fina) |
| MATCH sem número | MATCH + "001" |
| Barra fixa VENCEDOR | Overlay central só em MATCH_END |
| Sem status de pausa | PAUSADO/T.MÉDICO como texto simples |

---

## Ordem de Execução

1. `src/types/championship.ts` - Adicionar `matchNumber?: string`
2. `src/components/championship/ScoreboardMain.tsx` - Redesign centro completo
3. `src/pages/ChampionshipTV.tsx` - Remover badges, redesign centro, overlay VENCEDOR

---

## Critérios de Aceite

| # | Critério | Status |
|---|----------|--------|
| 1 | Centro com faixa amarela fina (`h-20`/`h-24`) | ⬜ |
| 2 | MATCH + matchNumber no topo do centro | ⬜ |
| 3 | Status PAUSADO/T.MÉDICO abaixo da faixa (texto simples) | ⬜ |
| 4 | ROUND + número grande embaixo | ⬜ |
| 5 | TV sem badges (AO VIVO, FIM LUTA removidos) | ⬜ |
| 6 | TV sem barra fixa VENCEDOR | ⬜ |
| 7 | VENCEDOR como overlay central só em MATCH_END | ⬜ |
| 8 | CSS usando `hsl(var(--sulsport-x))` corretamente | ✅ |

