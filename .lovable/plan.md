

# Recriar Modo de Reacao (Reaction Training)

## Resumo

Reescrever completamente o Modo Reacao com logica baseada em fisiologia (Work/Rest Ratio), estimulo visual por circulo central, som de bip, edicao manual dos parametros, e integracao opcional com hardware para medir tempo de reacao com feedback instantaneo ("matar a luz").

## Ajuste Crucial de UX: "Matar a Luz"

O `flashDuration` configurado (ex: 1000ms) e o tempo MAXIMO que o circulo fica aceso. Se o hardware detectar impacto valido durante a janela:

1. Registra o tempo de reacao (delta)
2. Apaga o circulo IMEDIATAMENTE (cancela o timer de flash)
3. Toca som de acerto (hit sound)
4. Exibe o tempo de reacao na tela

Se ninguem chutar, o circulo apaga sozinho apos o flashDuration e segue para o proximo gap.

## Mudancas por Arquivo

### 1. `src/types/reaction.ts` — Novos tipos e presets

Reescrever com presets baseados em Work/Rest Ratio:

| Preset | Trabalho | Descanso | Ratio | Gap entre estimulos | Flash max |
|--------|----------|----------|-------|---------------------|-----------|
| Iniciante | 20s | 40s | 1:2 | 1.5s - 2.5s | 1000ms |
| Intermediario | 30s | 45s | 1:1.5 | 0.8s - 1.5s | 800ms |
| Elite | 30s | 30s | 1:1 | 0.3s - 0.6s | 600ms |

- Remover `stopRate`, `burst` (nao usados)
- Renomear nivel `advanced` para `elite`
- `flashMs` agora e o tempo MAXIMO do estimulo
- Adicionar `rounds` no lugar de `blocks`
- `ReactionResult` com campo `reactionTimes: number[]`

### 2. `src/hooks/useReactionState.ts` — Nova logica com "matar a luz"

Reescrever completamente:

- **Rounds** com timer de trabalho + descanso
- **Gerador de estimulos**: gap aleatorio -> acende + bip -> aguarda flashMs OU impacto -> apaga -> repete
- **`registerImpact()`**: chamado pelo hardware. Se estimulo esta aceso e ainda nao foi "matado":
  - Calcula `delta = Date.now() - stimulusOnTimestamp`
  - Cancela o timer de flash (`clearTimeout`)
  - Forca `currentSignal = 'off'`
  - Salva delta em `reactionTimes[]` e `lastReactionTime`
  - Seta flag `hitRegistered = true` para ignorar impactos duplicados
  - Agenda proximo estimulo (gap)
- Aceitar config customizada para edicao manual
- Expor `lastReactionTime`, `reactionTimes`, `stimulusActive` (bool)

### 3. `src/components/game/ReactionSetupScreen.tsx` — Tela de configuracao

Reescrever com:
- 3 presets (Iniciante, Intermediario, Elite) como botoes
- Campos editaveis: tempo trabalho, descanso, rounds, intervalo min/max, flash max
- Selecionar preset preenche campos; editar muda para "Personalizado"
- Status de hardware (readonly)
- Botao INICIAR TREINO

### 4. `src/components/game/ReactionScreen.tsx` — Tela de execucao

Reescrever:
- Fundo escuro (bg-slate-950)
- Circulo central grande (~40vw):
  - Apagado: cinza escuro
  - Aceso: verde neon (#39FF14)
  - Transicao instantanea
- Header: Round atual / total + timer de trabalho
- Feedback de reacao: tempo em ms abaixo do circulo com fade-out
- Descanso: bg azul escuro, timer regressivo, texto "DESCANSE"
- Sons: bip ao acender, som de acerto ao "matar a luz", apito inicio/fim round

### 5. `src/components/game/ReactionFinishedScreen.tsx` — Resultados

Atualizar para mostrar:
- Rounds completados, total de estimulos
- Com hardware: tempo medio, melhor, pior
- Sem hardware: apenas contagens

### 6. `src/pages/Index.tsx` — Integracao hardware

- No `handleSerialKick` para `gameMode === 'reaction'`: chamar `reactionState.registerImpact()`
- Passar `isConnected` para ReactionSetupScreen

### 7. Sons

Reutilizar existentes:
- Estimulo: `score-beep.mp3`
- Acerto (matar luz): `hit.mp3`
- Inicio round: `round-start.mp3`
- Fim round: `time-up.mp3`
- Fim sessao: `victory.mp3`

## Secao Tecnica

### Fluxo do Estimulo com "Matar a Luz"

```text
[GAP aleatorio] --> [Acende + bip] --> aguarda...
                                         |
                        +---------+------+--------+
                        |                          |
                  Impacto detectado          Timer expira (flashMs)
                        |                          |
                  Apaga IMEDIATO             Apaga normal
                  + som de acerto            (sem registro)
                  + mostra "450ms"
                  + cancela timer
                        |                          |
                        +----------+---------------+
                                   |
                             [Proximo GAP]
```

### registerImpact() — Pseudocodigo

```text
function registerImpact():
  if stimulusActive AND NOT hitRegistered:
    delta = now() - stimulusOnTimestamp
    reactionTimes.push(delta)
    lastReactionTime = delta
    hitRegistered = true
    clearTimeout(flashTimer)
    currentSignal = 'off'
    playHitSound()
    scheduleNextStimulus(gap)
```

### Arquivos modificados
1. `src/types/reaction.ts`
2. `src/hooks/useReactionState.ts`
3. `src/components/game/ReactionSetupScreen.tsx`
4. `src/components/game/ReactionScreen.tsx`
5. `src/components/game/ReactionFinishedScreen.tsx`
6. `src/pages/Index.tsx`

