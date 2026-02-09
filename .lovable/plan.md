

# Novos Valores Padrao de Calibragem

## Resumo

Alterar os valores padrao (default) dos thresholds de sensibilidade para os valores da imagem de referencia:

| Campo | Valor Atual | Novo Valor |
|-------|------------|------------|
| Colete -- Min. PONTO | 20 | 19 |
| Colete -- Min. HIT | 15 | 15 (sem mudanca) |
| Capacete -- Min. PONTO | 20 | 10 |
| Capacete -- Min. HIT | 15 | 5 |

## Arquivos a modificar

### 1. `src/types/championship.ts` -- Default do impactThresholds
Linha 93-96: Alterar `vestPointMin: 20` para `19`, `helmetHitMin: 15` para `5`, `helmetPointMin` de `20` para `10`.

### 2. `src/components/championship/DiagnosticsDialog.tsx` -- useState defaults
Linhas 62-65: Atualizar os valores iniciais dos estados para `vestPointMin: 19`, `helmetPointMin: 10`, `helmetHitMin: 5`.
Linhas 72-75: Atualizar os fallbacks no useEffect.

### 3. `src/components/championship/MatchConfigDialog.tsx` -- Fallbacks espalhados
Atualizar todos os fallbacks `?? 20` e `?? 15` para os novos valores (`vestPointMin ?? 19`, `helmetPointMin ?? 10`, `helmetHitMin ?? 5`).

### 4. `src/pages/ChampionshipMat.tsx` -- Fallback na linha de scoring
Linha 96: Atualizar o fallback `vestPointMin: 20, helmetPointMin: 20, helmetHitMin: 15` para os novos valores.

