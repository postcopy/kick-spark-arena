
# Loading Screen — Tempo Minimo de Leitura (Calibracao)

## Objetivo

Garantir que a tela de carregamento permaneca visivel por no minimo 4 segundos, independentemente da velocidade de carregamento do audio. Isso permite que o usuario leia o aviso critico de hardware exibido na tela.

## Alteracoes

### Arquivo: `src/components/game/LoadingScreen.tsx`

#### 1. Logica de Progresso com Duracao Fixa (4s)

Reescrever o `useEffect` principal para combinar duas condicoes antes de completar:
- Audio carregado (via `waitForAudioReady`)
- Timer de 4 segundos expirado

O progresso visual sera **linear ao longo de 4 segundos** (0 a 100%), independente do audio. Ao atingir 100% E o audio estar pronto, marca `isComplete`.

Implementacao:
- Usar `setInterval` de 100ms incrementando progresso linearmente ate 100% em 4000ms (cada tick = +2.5%)
- Usar `Promise.all` com `waitForAudioReady` + um `new Promise(resolve => setTimeout(resolve, 4000))` para so completar quando ambos terminarem

#### 2. Mensagens de Status Contextuais

Substituir o array `BOOT_LOGS` por mensagens que refletem calibracao de hardware:

```
0-30%: '> INITIALIZING CORE KERNEL...',
       '> LOADING ARENA ASSETS...',
       '> ESTABLISHING NEURAL LINK PROTOCOL...'
30-70%: '> CALIBRATING IMPACT SENSORS...',
        '> RUNNING SENSOR DIAGNOSTICS...',
        '> SENSOR THRESHOLD: NOMINAL'
70-100%: '> SYNCHRONIZING TARGETS...',
         '> SYSTEM INTEGRITY CHECK... PASSED',
         '> WARNING: HIGH VOLTAGE DETECTED',
         '> ALL SYSTEMS OPERATIONAL'
```

#### 3. Aviso de Hardware Visivel

Inserir bloco de aviso logo abaixo da barra de progresso (apos o fechamento do div `max-w-[600px]`), dentro do container central. Visivel desde o inicio com animacao `animate-pulse`:

```tsx
<div className="mt-6 flex flex-col items-center gap-2 animate-pulse">
  <div className="flex items-center gap-2 text-yellow-500">
    <span className="text-xl">⚠️</span>
    <span className="font-mono font-bold text-sm uppercase tracking-widest">
      PROTOCOLO DO SENSOR
    </span>
  </div>
  <p className="text-white/80 font-mono text-sm text-center max-w-md">
    O sistema ignora chutes colados.
    <br/>
    <span className="text-yellow-400 font-bold text-base mt-1 block">
      CHUTE -> RECOLHA A PERNA -> CHUTE
    </span>
  </p>
</div>
```

## Secao Tecnica

### Logica do useEffect principal (substituicao completa):

```tsx
useEffect(() => {
  if (hasStartedRef.current) return;
  hasStartedRef.current = true;

  unlockAudio();
  initFullPreload();

  const requiredSounds = skipBgMusic
    ? ['hit', 'hitHeavy', 'countdown3'] as const
    : ['fightModeBg', 'hit', 'hitHeavy', 'countdown3'] as const;

  const MIN_DURATION = 4000;
  const TICK_INTERVAL = 100;
  const totalTicks = MIN_DURATION / TICK_INTERVAL;
  let currentTick = 0;

  progressIntervalRef.current = window.setInterval(() => {
    currentTick++;
    const linearProgress = Math.min((currentTick / totalTicks) * 100, 100);
    setProgress(linearProgress);
    if (currentTick >= totalTicks && progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, TICK_INTERVAL);

  const timerPromise = new Promise(resolve => setTimeout(resolve, MIN_DURATION));
  const audioPromise = waitForAudioReady(requiredSounds as any, 8000);

  Promise.all([timerPromise, audioPromise]).then(() => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(100);
    setIsComplete(true);
  });

  return () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
}, [waitForAudioReady, unlockAudio, initFullPreload, skipBgMusic]);
```

### Novo array BOOT_LOGS:

```tsx
const BOOT_LOGS = [
  '> INITIALIZING CORE KERNEL...',
  '> LOADING ARENA ASSETS...',
  '> ESTABLISHING NEURAL LINK PROTOCOL...',
  '> CALIBRATING IMPACT SENSORS...',
  '> RUNNING SENSOR DIAGNOSTICS...',
  '> SENSOR THRESHOLD: NOMINAL',
  '> SYNCHRONIZING TARGETS...',
  '> SYSTEM INTEGRITY CHECK... PASSED',
  '> WARNING: HIGH VOLTAGE DETECTED',
  '> ALL SYSTEMS OPERATIONAL',
];
```

## Resultado

- Tela de carregamento sempre visivel por pelo menos 4 segundos
- Progresso linear e previsivel (sem pulos)
- Aviso de hardware piscando (animate-pulse) visivel o tempo todo
- Boot logs com mensagens de calibracao de sensores para justificar a espera
- Audio timeout aumentado para 8s (seguranca, ja que o minimo e 4s)
