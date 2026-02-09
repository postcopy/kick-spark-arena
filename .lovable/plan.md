

# Melhorias de UX: Atalhos de Teclado e Sons para Mesa de Luta

## Resumo

Adicionar atalhos de teclado (Espaco/ESC) e efeitos sonoros (hit para pontos, buzina para fim de round, beep para inicio de round) ao modo campeonato, reutilizando o sistema de audio existente e adicionando o som enviado pelo usuario.

## Mudancas

### 1. Copiar som de inicio de round
- Copiar o arquivo `ES_Truck_Reverse_Beep_-_Epidemic_Sound.mp3` para `public/sounds/round-start.mp3`

### 2. Registrar novo som no sistema de audio (`src/hooks/useSoundEffects.ts`)
- Adicionar `'roundStart'` ao tipo `SoundName`
- Adicionar path em `FALLBACK_PATHS`: `roundStart: '/sounds/round-start.mp3'`
- Adicionar pool size em `POOL_SIZES`: `roundStart: 1`

### 3. Criar componente interno com SoundProvider (`src/pages/ChampionshipMat.tsx`)

Reestruturar para:

```text
ChampionshipMat (exportado)
  SoundProvider
    ChampionshipMatInner (toda a logica atual + hooks de som/teclado)
```

Adicionar dentro de `ChampionshipMatInner`:

**a) Som ao registrar ponto (hardware)**
- No `handleImpact`, quando `isPoint === true`, chamar `play('hit')`

**b) Som de fim de round / fim de luta**
- `useEffect` observando `sync.state.status` -- ao mudar para `ROUND_END` ou `MATCH_END`, chamar `play('timeUp')`

**c) Som de inicio de round**
- `useEffect` observando `sync.state.status` -- ao mudar para `RUNNING` (round iniciou), chamar `play('roundStart')`

**d) Atalhos de teclado**
- `useEffect` com listener `keydown`:
  - **Espaco**: se `IDLE` ou `PAUSED` -> `startTimer()` / se `RUNNING` -> `pauseTimer()`
  - **ESC**: se `RUNNING` -> `pauseTimer()`
  - Ignora se foco em `INPUT`, `TEXTAREA`, `SELECT` ou `contentEditable`
  - `e.preventDefault()` para evitar scroll

**e) Unlock audio + preload**
- Chamar `unlockAudio()` e `initFullPreload()` no mount

**f) Passar `isMuted` e `toggleMute` ao OperatorPanel**

### 4. Botao Mute no OperatorPanel (`src/components/championship/OperatorPanel.tsx`)

- Adicionar props `isMuted?: boolean` e `onToggleMute?: () => void`
- Adicionar botao na secao CONFIGURACOES com icone `Volume2` (ligado) ou `VolumeX` (desligado)
- Texto: "SOM: LIGADO" / "SOM: DESLIGADO"
- Mesmo estilo dos botoes secundarios (zinc-700, border)

## Arquivos modificados
1. `public/sounds/round-start.mp3` (novo - copia do upload)
2. `src/hooks/useSoundEffects.ts` (adicionar soundName roundStart)
3. `src/pages/ChampionshipMat.tsx` (SoundProvider wrapper + atalhos + sons)
4. `src/components/championship/OperatorPanel.tsx` (botao mute)

