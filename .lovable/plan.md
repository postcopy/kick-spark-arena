

# Plano de Execucao — Fase 1: Desbloqueio de Producao

## Escopo desta fase

Implementar os 3 itens que bloqueiam uso real do sistema em competicoes e academias:
1. Feature gates para planos de assinatura (item #3)
2. Persistencia de resultados do Campeonato no banco (item #1)
3. Limpeza de codigo morto (combo/energy) — debito tecnico que afeta manutencao

O item #2 (hardware nao conectado) esta **incorreto** — o codigo em `ChampionshipMat.tsx` linhas 100-170 ja roteia impactos para pontuacao. Se ha problema, e de configuracao de thresholds ou status da luta.

O item #4 (audit trail) sera resolvido junto com o item #1, pois a tabela de eventos do campeonato ja funcionara como log de auditoria.

---

## 1. Feature Gates para Assinatura

### Problema
`canPlay` so e verificado ao selecionar modo em `Index.tsx`. Rotas como `/championship/mat`, `/students`, `/ranking` sao acessiveis diretamente pela URL sem verificacao.

### Solucao

**Criar componente `ProtectedRoute.tsx`:**
```tsx
// Verifica autenticacao + subscription ativa (ou trial)
// Redireciona para /login se nao autenticado
// Mostra Paywall se trial expirado e sem assinatura
```

**Aplicar no `App.tsx`:**
- Rotas protegidas: `/`, `/students`, `/students/:id`, `/ranking`, `/championship/*`
- Rotas publicas: `/login`, `/signup`, `/pricing`
- Rotas admin: `/admin`, `/admin/sounds` (verificacao adicional de role)

**Arquivos afetados:**
- `src/components/ProtectedRoute.tsx` (novo)
- `src/App.tsx` (envolver rotas com ProtectedRoute)

---

## 2. Persistencia do Campeonato no Banco

### Tabelas a criar

**`championship_matches`**
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| academy_id | uuid NOT NULL | FK logica para auth.users |
| match_number | text | "001", "002" |
| mat_id | integer | Tatame |
| config | jsonb | MatchConfig completo |
| status | text | IDLE/RUNNING/MATCH_END |
| winner_side | text | RED/BLUE/null |
| red_athlete_name | text | |
| blue_athlete_name | text | |
| red_round_wins | integer DEFAULT 0 | |
| blue_round_wins | integer DEFAULT 0 | |
| started_at | timestamptz | |
| ended_at | timestamptz | |
| created_at | timestamptz DEFAULT now() | |

**`championship_events`**
| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| match_id | uuid FK | Referencia championship_matches |
| event_type | text | PUNCH/BODY/HEAD/GAMJEOM/UNDO/etc |
| side | text | RED/BLUE |
| points | integer | |
| round | integer | |
| description | text | |
| ts | bigint | Timestamp original do evento |
| created_at | timestamptz DEFAULT now() | |

**RLS**: Ambas com politica `academy_id = auth.uid()` para SELECT/INSERT.

### Integracao no codigo

**Novo hook `useChampionshipPersistence.ts`:**
- Recebe `MatchState` do `useChampionshipSync`
- Ao iniciar luta (saveConfig): cria registro em `championship_matches`
- Ao ocorrer evento (addScore, addGamjeom, etc): insere em `championship_events`
- Ao finalizar luta (MATCH_END): atualiza `championship_matches` com winner e ended_at
- Usa debounce para nao sobrecarregar o banco durante timer updates

**Modificar `ChampionshipMat.tsx`:**
- Importar e inicializar `useChampionshipPersistence(sync.state)`
- Eventos sao salvos em tempo real (fire-and-forget, sem bloquear a UI)

Isso automaticamente resolve o item #4 (audit trail), pois cada evento fica registrado com timestamp no banco.

---

## 3. Limpeza de Codigo Morto

### Remocoes em `src/types/game.ts`
- `comboWindowMs` de `ArcadeConfig`
- `comboCount` e `lastKickAt` de `ArcadePlayerState`
- `energy` e `specialReady` de `ArcadePlayerState` (nao usados apos remocao de combo)

### Remocoes em `src/hooks/useArcadeState.ts`
- Tipo `InternalPlayerState` (linha 19) — nao mais necessario
- `energy`, `comboCount`, `lastKickAt`, `specialReady` de `createInitialPlayerState`
- `comboWindowMs` de `DEFAULT_ARCADE_CONFIG`
- `energyPerKick`, `energyMax`, `specialDamageBonus` de `DEFAULT_ARCADE_CONFIG`
- Callbacks `onSpecialReady` e `onSpecialAttack` das options

### Remocoes em `src/pages/Index.tsx`
- `playComboRef` se ainda existir
- Callbacks de special attack/ready

---

## Ordem de Execucao

1. Limpeza de codigo morto (tipos + arcade hook) — rapido, reduz ruido
2. Feature gates (ProtectedRoute + App.tsx) — pequeno esforco, alto impacto
3. Tabelas do campeonato (migration SQL) — banco primeiro
4. Hook de persistencia + integracao no ChampionshipMat — finaliza

## Estimativa

- Limpeza: ~15 min
- Feature gates: ~20 min
- Persistencia campeonato: ~30 min

