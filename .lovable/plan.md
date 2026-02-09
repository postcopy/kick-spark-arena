
# Trocar o som de ponto do Campeonato

## Resumo

Substituir o som usado para registrar pontos no modo Campeonato pelo arquivo `ponto.mp3` enviado. Para nao afetar os outros modos de jogo (que continuam usando `hit`), sera criado um novo som dedicado `scoreBeep`.

## Mudancas

### 1. Copiar o arquivo de audio
- Copiar `user-uploads://ponto.mp3` para `public/sounds/score-beep.mp3`

### 2. Registrar o novo som (`src/hooks/useSoundEffects.ts`)
- Adicionar `'scoreBeep'` ao tipo `SoundName`
- Adicionar em `FALLBACK_PATHS`: `scoreBeep: '/sounds/score-beep.mp3'`
- Adicionar em `POOL_SIZES`: `scoreBeep: 2`

### 3. Usar o novo som no Campeonato (`src/pages/ChampionshipMat.tsx`)
- Trocar `play('hit')` por `play('scoreBeep')` na linha onde o ponto e registrado pelo hardware (dentro do `handleImpact`, quando `isPoint === true`)

Os outros modos de jogo continuam usando `play('hit')` normalmente -- nenhuma mudanca neles.

### Arquivos modificados
1. `public/sounds/score-beep.mp3` (novo)
2. `src/hooks/useSoundEffects.ts` (adicionar scoreBeep)
3. `src/pages/ChampionshipMat.tsx` (trocar hit por scoreBeep)
