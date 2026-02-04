

# Corrigir Layout da Mesa de Luta

## Problema Identificado

O layout atual usa `flex-col` onde:
- **Scoreboard** tem `flex-1 min-h-0` (cresce/encolhe)
- **ScoringButtons** e **EventLog** têm altura implícita

Quando eventos são adicionados, o navegador recalcula o layout e o Scoreboard é "empurrado para cima" porque os elementos inferiores competem pelo espaço.

```text
ANTES (problema):
+---------------------------+
| Header (h-14 - FIXO)      |
+---------------------------+
| Scoreboard (flex-1)       | ← Encolhe quando itens abaixo crescem
|                           |
+---------------------------+
| ScoringButtons (implícito)| ← Altura não definida
+---------------------------+
| EventLog (implícito)      | ← Cresce com eventos, empurra acima
+---------------------------+
```

## Solucao

Fixar as alturas dos elementos inferiores para que o `flex-1` do Scoreboard funcione corretamente:

```text
DEPOIS (corrigido):
+---------------------------+
| Header (h-14 - FIXO)      |
+---------------------------+
| Scoreboard (flex-1)       | ← Ocupa todo espaço restante
|                           |
+---------------------------+
| ScoringButtons (h-28 FIXO)| ← Altura fixa
+---------------------------+
| EventLog (h-32 FIXO)      | ← Altura fixa com scroll interno
+---------------------------+
```

## Arquivos a Modificar

### 1. ChampionshipMat.tsx

Adicionar `shrink-0` nos containers dos elementos inferiores para prevenir encolhimento:

```tsx
{/* Scoreboard - flex-1 para ocupar espaço restante */}
<div className="flex-1 min-h-0 overflow-hidden">
  <ScoreboardMain state={sync.state} />
</div>

{/* ScoringButtons - altura fixa, nao encolhe */}
<div className="shrink-0">
  <ScoringButtons ... />
</div>

{/* EventLog - altura fixa, nao encolhe */}
<div className="shrink-0">
  <EventLog ... />
</div>
```

### 2. EventLog.tsx

Garantir altura fixa do container:

```tsx
// Mudar de:
<div className="border-t border-zinc-700 p-3 bg-zinc-900/30">

// Para:
<div className="border-t border-zinc-700 p-3 bg-zinc-900/30 h-32 flex flex-col">
  ...
  <div className="space-y-1 flex-1 overflow-y-auto">
```

### 3. ScoringButtons.tsx

Garantir altura consistente:

```tsx
// Mudar de:
<div className="border-t border-zinc-700 p-4 bg-zinc-900/50">

// Para:
<div className="border-t border-zinc-700 p-4 bg-zinc-900/50 shrink-0">
```

---

## Resumo das Mudancas

| Arquivo | Mudanca |
|---------|---------|
| `ChampionshipMat.tsx` | Adicionar `shrink-0` e `overflow-hidden` |
| `EventLog.tsx` | Altura fixa `h-32` com scroll interno |
| `ScoringButtons.tsx` | Adicionar `shrink-0` para prevenir encolhimento |

## Resultado Esperado

- O Scoreboard permanece estável independente de quantos eventos sejam adicionados
- EventLog faz scroll interno quando há muitos eventos
- Layout não "pula" quando pontuação é aplicada

