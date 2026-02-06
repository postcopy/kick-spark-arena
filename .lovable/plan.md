

# HIT como Contador Real + Desempate Configuravel

## Resumo

Adicionar `hitsRed`/`hitsBlue` ao `MatchState`, criar `addHit()` no sync, implementar anti-duplo Opcao A (max 1 HIT por lado por janela) SEM atrasar score, e usar HITS como criterio de desempate configuravel. HITS reseta por round.

## Mudancas por Arquivo

### 1. `src/types/championship.ts`

- Adicionar `hitsRed: number` e `hitsBlue: number` ao `MatchState` (default 0)
- Adicionar `tiebreakByHits?: boolean` ao `MatchConfig` (default true)
- Atualizar `INITIAL_MATCH_STATE` com `hitsRed: 0, hitsBlue: 0`

### 2. `src/hooks/useChampionshipSync.ts`

**Nova funcao `addHit(side: MatchSide)`:**
- Incrementa `hitsRed` ou `hitsBlue` no state
- Broadcast atualizado
- Silencioso (sem evento no log)
- So funciona quando `status === 'RUNNING'`

**Expor `addHit` no retorno** (adicionar a `UseChampionshipSyncReturn`)

**Desempate no `handleRoundEnd` (linhas 162-177):**
- Quando `roundScoreRed === roundScoreBlue`:
  - Se `config.tiebreakByHits !== false`:
    - `hitsRed > hitsBlue` -> Vermelho vence automaticamente ("Tempo! Vermelho vence por superioridade (HITS)")
    - `hitsBlue > hitsRed` -> Azul vence automaticamente
    - HITS tambem empatam -> manter comportamento atual (decisao manual)
  - Se `tiebreakByHits === false`: manter decisao manual

**Reset no `nextRound` (linhas 411-427):** Adicionar `hitsRed: 0, hitsBlue: 0` ao novo estado

**`resetMatch` e `saveConfig`:** Ja cobertos pelo spread de `INITIAL_MATCH_STATE` que tera os novos campos zerados

### 3. `src/pages/ChampionshipMat.tsx`

**Anti-duplo reformulado - Opcao A aplicada SOMENTE ao HIT:**

Substituir `lastScoredRef` por `lastHitTsRef: Map<MatchSide, number>`. O score (addScore) continua sendo chamado imediatamente sem atraso.

No `handleImpact`, apos decidir POINT/HIT/IGNORED:

- Se `decision === 'POINT'`:
  - `sync.addScore(matchSide, scoreType)` -- imediato, sem espera
  - Verificar anti-duplo para HIT: se `now - lastHitTs[side] >= antiDuplicateWindowMs` -> `sync.addHit(matchSide)` e atualizar `lastHitTsRef`
  - Se dentro da janela: nao incrementa HIT (ja contou 1 nesta janela)
- Se `decision === 'HIT'`:
  - Nao pontua
  - Verificar anti-duplo: se fora da janela -> `sync.addHit(matchSide)` e atualizar `lastHitTsRef`
  - Se dentro da janela: nao incrementa HIT
- Se `decision === 'IGNORED'`, `'MERGED'`, `'DUPLICATE'`: nada

O anti-duplo no score (MERGED/DUPLICATE para POINTs) permanece como esta hoje -- o HEAD retroativamente marca BODY como MERGED e pontua no lugar. A novidade e que o contador de HIT e limitado a 1 por janela por lado, independente do score.

Shadow log continua registrando todas as decisoes normalmente.

### 4. `src/components/championship/ScoreboardMain.tsx`

- Linha 86: substituir `0` por `{state.hitsBlue}`
- Linha 165: substituir `0` por `{state.hitsRed}`

### 5. `src/pages/ChampionshipTV.tsx`

- Linha 178: substituir `0` por `{state.hitsBlue}`
- Linha 273: substituir `0` por `{state.hitsRed}`

**Tela de vitoria (linha 280+):** Apos verificar rounds e totalPoints empatados, adicionar verificacao por HITS:
- Se `state.config.tiebreakByHits !== false` e rounds + totalPoints empatados: comparar `state.hitsBlue` vs `state.hitsRed`
- Adicionar linha "HITS" no grid de estatisticas da vitoria

### 6. `src/components/championship/MatchConfigDialog.tsx`

Adicionar toggle `tiebreakByHits` na tab de Regras:
- Label: "Desempate por HITS"
- Descricao: "Em empate de pontos no round, o lutador com mais HITS vence automaticamente"
- Default: ativado (checked)

## Fluxo Final

```text
Impacto finalizado
       |
  peakAboveFloor >= pointMin?
  SIM: POINT -> addScore() imediato
       -> anti-duplo HIT: fora da janela? addHit() : skip
  NAO: peakAboveFloor >= hitMin?
  SIM: HIT -> sem score
       -> anti-duplo HIT: fora da janela? addHit() : skip
  NAO: IGNORED -> nada
```

## O que NAO muda

- Modo RAW: HITS permanece em 0
- Botoes manuais: nao incrementam HITS
- Score entra imediatamente (zero latencia no placar)
- Shadow log inalterado
- Anti-duplo de SCORE (MERGED/DUPLICATE para POINTs) inalterado

## Ordem de Implementacao

1. `src/types/championship.ts` -- hitsRed/Blue + tiebreakByHits
2. `src/hooks/useChampionshipSync.ts` -- addHit + desempate + reset
3. `src/pages/ChampionshipMat.tsx` -- anti-duplo HIT com lastHitTsRef
4. `src/components/championship/ScoreboardMain.tsx` -- exibir hits reais
5. `src/pages/ChampionshipTV.tsx` -- exibir hits reais + stats vitoria
6. `src/components/championship/MatchConfigDialog.tsx` -- toggle tiebreakByHits

