

# Fix: Modo IMPACTOS nao registra HIT nem PONTO

## Problemas encontrados (3 bugs independentes)

### Bug 1: Logica IGNORED nao existe no legado

O sistema atual tem TRES categorias: POINT, HIT, IGNORED. O legado do Tadashi tem apenas DUAS: POINT e HIT. No legado, o sensor ja filtra raspagem — todo evento que chega ao software e valido e vira HIT ou POINT. No nosso sistema, o ImpactDetector faz a funcao do sensor (filtra ruido). Portanto, todo impacto finalizado pelo detector ja e valido e deve ser no minimo HIT.

O problema: com preset MEDIA e globalMax=30, hitMin = 0.5 * 30 = 15. Um toque com peakIntensity=12 vira IGNORED quando deveria ser HIT. So deveria existir um threshold: o de PONTO.

**Solucao**: Remover a categoria IGNORED. Todo impacto finalizado pelo ImpactDetector que passa o anti-duplicata vira HIT. Se peakIntensity >= pointMin, vira POINT.

### Bug 2: Sliders de HIT sao desnecessarios e confundem

O legado usa UM threshold por equipamento (colete e capacete). Acima = PONTO, abaixo = HIT. Os 4 sliders atuais (vestHit, vestPoint, helmetHit, helmetPoint) nao correspondem ao legado. Os sliders de HIT criam um threshold inferior que gera IGNORED — algo que nao existe no sistema original.

**Solucao**: Simplificar para 2 sliders (vestPoint e helmetPoint). Remover vestHit e helmetHit. Presets ajustados:
- BAIXA: point=15 (facil pontuar)
- MEDIA: point=35
- ALTA: point=60 (precisa golpe forte)

### Bug 3: Closure stale no handleHardwareKickRef

O useEffect (linha 72-82) que define o handler do modo RAW nao inclui `sync.state.config.scoringInput` nas dependencias. Quando o modo muda de 'raw' para 'impacts', o guard `if (scoringInput === 'impacts') return` usa o valor antigo (stale closure). Isso nao causa o bug atual (o guard no useSerialPort bloqueia), mas e um bug latente.

**Solucao**: Adicionar `sync.state.config` nas dependencias do useEffect.

## Mudancas por arquivo

### 1. `src/pages/ChampionshipMat.tsx`

- **handleImpactRef**: Remover logica de hitMin. Classificacao simplificada:
  - `peakIntensity >= pointMin` -> POINT (addScore + addHit)
  - Senao -> HIT (addHit)
  - Sem IGNORED
- **ShadowLogEntry**: Remover 'IGNORED' do tipo decision
- **handleHardwareKickRef useEffect**: Adicionar `sync.state.config` ao array de dependencias

### 2. `src/components/championship/DiagnosticsDialog.tsx`

- Remover sliders de HIT (vestHitSens, helmetHitSens e handlers)
- Manter apenas 2 sliders: vestPointSens e helmetPointSens
- Presets ajustados: BAIXA(15), MEDIA(35), ALTA(60)
- handleApplyThresholds: enviar hitMin=0 (sem filtro extra) e pointMin calculado
- Remover regra de separacao hitMin/pointMin (nao precisa mais)

### 3. `src/types/championship.ts`

- Manter campos hitMin nos types por retrocompatibilidade, mas documentar que sao ignorados no scoring (valor=0)

## Logica final (alinhada com legado Tadashi)

```text
ImpactDetector finaliza impacto (filtro de ruido = substitui o sensor)
  |
  v
Anti-duplicata 300ms por deviceId
  |
  v
peakIntensity >= pointMin?
  SIM -> POINT (addScore + addHit)
  NAO -> HIT (addHit)
```

## Resultado esperado

- Todo toque que o ImpactDetector considera valido (nao ruido) vira no minimo HIT
- Golpes fortes (acima do threshold de PONTO) viram POINT
- Sem mais IGNORED — o ImpactDetector ja faz o filtro de ruido
- UI simplificada com 2 sliders em vez de 4
- Alinhamento 1:1 com a logica do software legado do Tadashi

