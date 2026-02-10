

# Correção: HIT não registra mesmo com threshold baixo

## Problema Identificado

O sistema tem um **filtro de ruído fixo (hardcoded) de intensidade 15** dentro do `ImpactDetector`. Isso significa que qualquer toque com intensidade abaixo de 15 é **silenciosamente descartado** antes mesmo de chegar à lógica de pontuação. Mesmo que você configure `vestHitMin = 1` na interface, o filtro interno já jogou fora o sinal.

Além disso, os valores de `hitMin` configurados na interface **nunca são usados** na classificação -- o código apenas verifica se o impacto é forte o suficiente para ser PONTO. Qualquer coisa abaixo do limiar de ponto é automaticamente classificada como HIT, mas só se passar pelo filtro de ruído fixo de 15.

## Solução

Tornar o filtro de ruído do ImpactDetector configurável usando os valores de `hitMin` da configuração, em vez do valor fixo 15.

### Arquivo 1: `src/lib/impactDetector.ts`

- Adicionar uma nova propriedade `noiseIntensityMin` ao `ImpactDetectorConfig` com valor padrão de 15 (comportamento atual mantido por padrão)
- Substituir o check hardcoded `if (intensity < NOISE_INTENSITY_MIN) return` por `if (intensity < this.config.noiseIntensityMin) return`
- Manter a constante `NOISE_INTENSITY_MIN = 15` como fallback padrão

### Arquivo 2: `src/pages/ChampionshipMat.tsx`

- No `impactDetectorConfigMemo`, calcular o menor `hitMin` entre colete e capacete e passar como `noiseIntensityMin` para o detector
- Assim, se o usuario configurar `vestHitMin = 5` e `helmetHitMin = 3`, o detector usara `noiseIntensityMin = 3`, permitindo que toques leves cheguem à lógica de pontuação

- Na classificação de impactos (handler `handleImpactRef`), adicionar verificação real do `hitMin`: se `peakIntensity < hitMin` para aquele tipo de equipamento, classificar como IGNORED em vez de HIT

### Arquivo 3: `src/types/championship.ts`

- Verificar se o tipo `ShadowLogEntry` já suporta `decision: 'IGNORED'` -- se não, adicionar

## Fluxo Corrigido

```text
Toque leve (intensidade 5):
  ANTES: ImpactDetector descarta (< 15) -> nunca chega ao scoring
  DEPOIS: ImpactDetector aceita (>= hitMin configurado) -> scoring classifica como HIT

Toque forte (intensidade 25):
  ANTES: ImpactDetector aceita -> scoring classifica como POINT
  DEPOIS: Mesmo comportamento (sem mudança)

Ruído (intensidade 2, hitMin = 5):
  ANTES: ImpactDetector descarta (< 15)
  DEPOIS: ImpactDetector descarta (< 5 = hitMin configurado)
```

## Detalhes Técnicos

### impactDetector.ts
- Nova propriedade no config: `noiseIntensityMin: number` (default: `NOISE_INTENSITY_MIN` = 15)
- Linha 85: `if (intensity < this.config.noiseIntensityMin) return;`

### ChampionshipMat.tsx
- No `useMemo` do `impactDetectorConfigMemo` (linha 184): calcular `Math.min(thresholds.vestHitMin, thresholds.helmetHitMin)` e passar como `noiseIntensityMin`
- No handler de impactos (linha 124): adicionar gate real do hitMin
```text
const hitMin = isHelmet ? thresholds.helmetHitMin : thresholds.vestHitMin;
if (impact.peakIntensity < hitMin) -> IGNORED (log no shadow, nao pontua, nao conta hit)
if (impact.peakIntensity >= pointMin) -> POINT
else -> HIT
```

### useSerialPort.ts
- No `useEffect` que cria o detector (linha 119): passar `noiseIntensityMin` do config se disponível

### Tipos (serial.ts)
- Adicionar `noiseIntensityMin?: number` ao tipo `impactDetectorConfig`

## Impacto
- Modo Campeonato: hits leves passam a ser registrados conforme configuração
- Outros modos (Arcade, Time Attack): sem mudança (usam debounce, não ImpactDetector)
- Comportamento padrão mantido (15) quando nenhum threshold customizado é configurado
