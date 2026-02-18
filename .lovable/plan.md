

# Fix: Sincronizacao e Decodificacao de Audio (Warm-Up)

## O Problema

O navegador baixa o arquivo .mp3 (readyState >= 3), mas adia a **decodificacao final** ate o primeiro `play()`. Isso causa um "soluco" audivel na primeira execucao de cada som.

## A Solucao: Warm-Up Play/Pause

Apos o download, forcar um ciclo `play(vol=0) -> pause() -> currentTime=0` para cada som critico. Isso obriga o motor de audio a decodificar o arquivo para a memoria ativa.

---

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useSoundEffects.ts` | Editar - Adicionar `warmUpSounds()` e expor no retorno |
| `src/components/game/LoadingScreen.tsx` | Editar - Chamar warm-up apos download, antes de completar |
| `src/components/game/CountdownScreen.tsx` | Editar - Antecipar play da musica em ~100ms |

---

## Detalhes Tecnicos

### 1. useSoundEffects.ts - Nova funcao `warmUpSounds`

Adicionar uma funcao que recebe uma lista de SoundNames e, para cada um:

1. Obtem a instancia de audio (pool[0] ou bgMusicAudio)
2. Seta `volume = 0`
3. Chama `.play()` (retorna Promise)
4. No resolve do play, chama `.pause()`, `.currentTime = 0`, restaura volume original
5. Verifica `duration` - se `NaN`, marca como nao decodificado

A funcao retorna `Promise.all` de todas as warm-ups.

```text
warmUpSounds(['fightModeBg', 'hit', 'hitHeavy', 'countdown3'])
  |-- Para cada som:
  |     audio.volume = 0
  |     await audio.play()
  |     audio.pause()
  |     audio.currentTime = 0
  |     audio.volume = originalVolume
  |     if (isNaN(audio.duration)) -> warn
  |-- Promise.all(...)
```

Tambem melhorar `waitForAudioReady`:
- Alem de `readyState >= 3`, verificar `!isNaN(duration)` como criterio adicional
- Apos todos passarem o readyState check, chamar `warmUpSounds` automaticamente
- Se `fightModeBg` nao completar warm-up em 5s, forcar `.load()` novamente antes de desistir

Expor `warmUpSounds` no retorno do hook para uso externo se necessario.

### 2. LoadingScreen.tsx - Integrar warm-up no fluxo

O fluxo atual:
```text
unlockAudio() -> initFullPreload() -> poll progress -> waitForAudioReady() -> done
```

Novo fluxo:
```text
unlockAudio() -> initFullPreload() -> poll progress -> waitForAudioReady() -> done
```

A mudanca e interna ao `waitForAudioReady`: ele agora faz o warm-up automaticamente antes de resolver. A LoadingScreen nao precisa de mudancas na logica, mas vamos melhorar o feedback visual:

- Adicionar fase "Decodificando audio..." quando progress >= 75% (download completo, warm-up em andamento)
- Texto de progresso mais granular: "Baixando..." -> "Decodificando..." -> "Pronto!"

### 3. CountdownScreen.tsx - Antecipar musica em 100ms

Atualmente a musica inicia no exato momento em que `countdown === 6`. Para compensar a latencia residual do motor de audio:

- Alterar o trigger de `countdown === 6` para usar um `setTimeout` de 0ms (microtask) para o play, mas visualmente a fase PREPARAR so aparece apos um pequeno delay
- Na pratica: inverter a ordem - chamar `playWithRef` primeiro, depois atualizar o visual

Implementacao: quando `countdown === 6`, chamar `playWithRef` imediatamente (sem esperar o render). Como o warm-up ja aconteceu na LoadingScreen, o play sera instantaneo. O efeito visual "PREPARAR" aparece no mesmo frame, entao a latencia perceptivel sera zero.

---

## Resumo das Mudancas por Arquivo

### useSoundEffects.ts
- Nova funcao `warmUpSounds(soundNames: SoundName[]): Promise<void>`
- `waitForAudioReady` agora chama `warmUpSounds` internamente apos readyState check
- Verificacao adicional de `!isNaN(duration)` no criterio de "pronto"
- Timeout inteligente para fightModeBg: tenta `.load()` forcado antes de desistir
- Expor `warmUpSounds` no retorno

### LoadingScreen.tsx
- Texto de progresso atualizado: fase "Decodificando audio..." quando progress >= 75%
- Sem mudancas na logica de fluxo (warm-up e interno ao waitForAudioReady)

### CountdownScreen.tsx
- Mover o `playWithRef('fightModeBg')` para executar antes do state update visual
- Usar `queueMicrotask` ou execucao sincrona para garantir que o play aconteca no inicio do ciclo de render

---

## O Que NAO Muda

- Pool sizes e round-robin
- Estrutura de preload em batches
- API publica do hook (apenas adicao de warmUpSounds)
- Cleanup no unmount

