

# Alinhar modo IMPACTOS com logica legacy (Tadashi)

## Resumo das mudancas

Tres diferencas fundamentais entre o sistema atual e o legado:

1. **Threshold absoluto** (legado) vs relativo ao floor (atual) -- scoring usa `peakIntensity` direto, sem subtrair noiseFloor
2. **Anti-duplicata por deviceId** (legado) vs por lado/MatchSide (atual) -- janela de 300ms por sensor individual, descarta o impacto inteiro
3. **Sem merge HEAD/BODY** (legado) vs merge por lado (atual) -- remove toda a logica de MERGED/DUPLICATE por lado

## Detalhes tecnicos

### 1. Arquivo: `src/pages/ChampionshipMat.tsx` (handler de impacto, linhas ~93-189)

**Reescrever a logica de scoring no `handleImpactRef`:**

- Remover calculo de `peakAboveFloor` -- usar `impact.peakIntensity` direto contra os thresholds
- Classificacao: `peakIntensity >= pointMin` -> POINT; `peakIntensity >= hitMin` -> HIT; senao IGNORED
- Anti-duplicata por `deviceId` (nao por `matchSide`): manter um Map de `lastAcceptedTs` por deviceId; se `now - lastTs < 300ms`, descartar o impacto inteiro (decision = 'DUPLICATE')
- Remover toda a logica de merge (MERGED, comparacao HEAD vs BODY, `lastScoredRef` por lado)
- HIT counter: incrementar quando decision === 'HIT' (nao precisa de anti-duplo extra, o filtro por deviceId ja cobre)
- POINT: incrementar score + hit quando decision === 'POINT'
- Log atualizado: `[IMPACT] dev=X peak=Y hitMin=Z pointMin=W -> DECISION (type/side)`

**Refs simplificados:**
- Substituir `lastScoredRef` (Map por MatchSide) por `lastAcceptedTsRef` (Map por deviceId/number)
- Remover `lastHitTsRef` (nao precisa mais de anti-duplo separado para hits)

### 2. Arquivo: `src/components/championship/DiagnosticsDialog.tsx` (handleApplyThresholds, linhas ~109-131)

**Mudar `sensToThreshold` para retornar threshold absoluto:**

Hoje: `sensToThreshold = (1 - sens/100) * rangeAboveFloor` (relativo)

Novo: `sensToThreshold = (1 - sens/100) * globalMax` (absoluto, sem subtrair floor)

- Sensibilidade 100 -> threshold 0 (tudo pontua)
- Sensibilidade 0 -> threshold = globalMax (precisa do pico maximo)
- Sensibilidade 50 -> threshold = globalMax * 0.5

Manter a regra `pointMin >= hitMin + 1` e o log de diagnostico.

O noiseFloor continua sendo enviado no config (para diagnostico/UI), mas nao e usado no scoring.

### 3. Arquivo: `src/types/championship.ts` (comentario, linha 78)

Atualizar o comentario do `antiDuplicateWindowMs` de "for merging BODY+HEAD on same side" para "per deviceId, discards entire impact within window".

### 4. ShadowLog (dentro de ChampionshipMat.tsx)

Atualizar o campo `peakAboveFloor` no log entry para ser informativo (pode manter para diagnostico), mas a decisao usa `peakIntensity` absoluto. Adicionar campo `threshold` com o valor usado na decisao (hitMin ou pointMin conforme o caso).

## Resultado esperado

- Toque leve no colete com `peakIntensity` < `vestPointMin` -> HIT (ou IGNORED se < hitMin)
- Golpe forte com `peakIntensity` >= `vestPointMin` -> POINT
- Dois eventos do mesmo sensor em < 300ms -> segundo e DUPLICATE (descartado)
- Sem mais logica de merge HEAD/BODY por lado
- Thresholds sao valores absolutos de intensidade, independentes do noise floor

