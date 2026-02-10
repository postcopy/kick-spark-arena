

# Modo Cognitivo (Go/No-Go) — Implementacao Completa

## Resumo

Implementar o modo cognitivo como extensao do treino de reacao. Cada estimulo sorteia entre Verde (GO — chuta!) e Vermelho (NO-GO — segura!). O sistema rastreia inibicoes corretas, erros de impulso e erros de omissao, com feedback visual e sonoro.

## Arquivos Modificados (6)

### 1. `src/types/reaction.ts`

**ReactionConfig** — adicionar:
- `cognitiveMode: boolean` (default false)
- `goProbability: number` (0-100, default 75)

**ReactionState** — adicionar:
- `stimulusColor: 'green' | 'red' | null`

**ReactionResult** — adicionar:
- `cognitiveMode: boolean`
- `correctInhibitions: number`
- `commissionErrors: number`
- `omissionErrors: number`
- `totalGoStimuli: number`
- `totalNoGoStimuli: number`

**REACTION_PRESETS** — adicionar `cognitiveMode: false, goProbability: 75` em cada preset.

---

### 2. `src/hooks/useReactionState.ts`

**Novos props:**
- `onNoGoSuccess?: () => void` — som de "ding" (scoreBeep)
- `onCommissionError?: () => void` — som de "buzz" (ko)

**Novos estados:**
- `stimulusColor`, `correctInhibitions`, `commissionErrors`, `omissionErrors`, `totalGoStimuli`, `totalNoGoStimuli`

**scheduleNextStimulus:**
- Sortear cor: `Math.random() * 100 < goProbability ? 'green' : 'red'`
- Incrementar `totalGoStimuli` ou `totalNoGoStimuli`
- Setar `stimulusColor`

**Timeout do flash (auto-off):**
- Se verde sem chute: `omissionErrors++`
- Se vermelho sem chute: `correctInhibitions++` + `onNoGoSuccess()`

**registerImpact (ordem critica):**
1. Calcular delta
2. FILTRO DE RUIDO: `if (delta < 100 || ...) return;` — ANTES de qualquer logica
3. `hitRegisteredRef.current = true`
4. Se cognitivo E vermelho: `commissionErrors++`, `onCommissionError()`, kill light, return (NAO registra tempo)
5. Se verde/normal: comportamento existente

**Reset/replay:** Zerar todos contadores cognitivos.

**lastResult:** Incluir campos cognitivos.

**Retornar:** `stimulusColor` no objeto de retorno.

---

### 3. `src/components/game/ReactionSetupScreen.tsx`

Nova secao entre "Parametros do Treino" e "Hardware status":

- Switch toggle (Radix Switch) "Modo Cognitivo (Go/No-Go)"
- Se ativado: Slider de probabilidade verde (50%-95%, step 5, default 75%)
- Texto explicativo: "Verde = Chuta! Vermelho = Nao chuta! Treina inibicao de impulso."
- Atualizar `onConfigChange` com `cognitiveMode` e `goProbability`

---

### 4. `src/components/game/ReactionScreen.tsx`

**Circulo de estimulo bicolor:**
- Verde ativo: fundo `#39FF14` + icone Check (lucide, w-16 h-16 branco)
- Vermelho ativo: fundo `#FF3333` + icone X (lucide, w-16 h-16 branco) + box-shadow vermelho
- Inativo: fundo escuro `#1e293b`

**Feedback de commission error:**
- Estado `showFault` (boolean, dura 1.5s)
- Quando ativo: texto "FALTA!" grande vermelho centralizado com fade

**Footer (modo cognitivo):**
- Trocar 3a coluna "Melhor" por "FALTAS" (commissionErrors) em vermelho

Precisa receber `stimulusColor` e `commissionErrors` do reactionState (ja estao no ReturnType).

---

### 5. `src/components/game/ReactionFinishedScreen.tsx`

Se `result.cognitiveMode === true`, trocar o grid de 4 cards:

| Icone | Label | Valor |
|-------|-------|-------|
| ShieldCheck | Inibicoes Corretas | X/Y (Z%) |
| AlertTriangle | Faltas (Impulso) | N |
| Clock | Omissoes | N |
| TrendingDown | Media GO | Xms |

O grafico AreaChart continua mostrando apenas tempos dos acertos no verde (reactionTimes — que so contem hits verdes).

---

### 6. `src/pages/Index.tsx`

Passar novos callbacks para `useReactionState`:
- `onNoGoSuccess: () => play('scoreBeep')`
- `onCommissionError: () => playKORef.current()`

Adicionar refs para esses callbacks seguindo o padrao existente (Latest Ref Pattern).

## Secao Tecnica

### Sorteio de cor

```text
const isGo = !cfg.cognitiveMode || Math.random() * 100 < cfg.goProbability;
const color = isGo ? 'green' : 'red';
setStimulusColor(color);
if (isGo) setTotalGoStimuli(p => p + 1);
else setTotalNoGoStimuli(p => p + 1);
```

### Ordem no registerImpact

```text
// 1. Delta
const delta = now - stimulusOnTimeRef.current;
// 2. FILTRO DE RUIDO (primeira coisa!)
if (delta < 100 || delta > cfg.flashMs + 50) return;
// 3. Mark hit
hitRegisteredRef.current = true;
// 4. Cognitivo + Vermelho = FALTA
if (cfg.cognitiveMode && stimulusColorRef.current === 'red') {
  setCommissionErrors(p => p + 1);
  onCommissionErrorRef.current?.();
  setStimulusActive(false); setStimulusColor(null);
  // cancel flash, schedule next
  return;
}
// 5. Acerto normal
```

### Timeout do flash

```text
if (cfg.cognitiveMode && !hitRegisteredRef.current) {
  const c = stimulusColorRef.current;
  if (c === 'green') setOmissionErrors(p => p + 1);
  if (c === 'red') {
    setCorrectInhibitions(p => p + 1);
    onNoGoSuccessRef.current?.();
  }
}
```

### Sons reutilizados (sem novos arquivos)
- `scoreBeep` → inibicao correta (ding positivo)
- `ko` → erro de impulso (buzz forte)

