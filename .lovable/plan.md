

# Fase 2: Dashboard da Academia + Perfil Completo + Filtros de Atletas

## Visao Geral

Implementar 3 melhorias baseadas no prototipo enviado (`dashboard-prototype.jsx`), adaptando o design inline-style para Tailwind CSS e conectando aos dados reais do banco.

---

## 1. Filtros e Busca de Atletas (`Students.tsx`)

**Mudancas:**
- Barra de pesquisa por nome/apelido (client-side, `useState` + `.filter()`)
- Chips de filtro por faixa (branca, amarela, verde, etc.)
- Toggle para mostrar inativos (query atual filtra `is_active = true`; mudar para buscar todos e filtrar client-side)
- Contador dinamico que reflete filtros aplicados

**Arquivos:** `src/pages/Students.tsx`

---

## 2. Dashboard da Academia (nova pagina)

Baseado nas 4 tabs do prototipo: Visao Geral, Atletas, Desempenho, Crescimento.

**Adaptacoes do prototipo para producao:**
- Substituir inline styles por Tailwind CSS (classes do projeto)
- Substituir mock data por queries reais ao banco (`athletes`, `training_sessions`, `solo_results`, `championship_matches`)
- Usar componentes shadcn/ui existentes (`Card`, `Badge`, `Button`, `Tabs`)
- Manter Recharts (ja instalado) para todos os graficos

**Secoes com dados reais:**
- **KPI Cards**: Total atletas ativos, sessoes na semana, total de chutes (via `solo_results`), media de reacao (via `training_sessions` mode=reaction)
- **Sessoes da Semana**: `BarChart` agrupando `training_sessions` por dia da semana
- **Atividade Recente**: Ultimas 5 sessoes com nome do atleta (join com `athletes`)
- **Distribuicao de Golpes**: `PieChart` — dados de `training_sessions.details` (colete vs capacete)
- **Uso por Modo**: `PieChart` — contagem de `training_sessions` agrupado por `mode`
- **Top Chutadores**: Ranking por total de chutes (via `solo_results` ou `training_sessions` details)
- **Evolucao de Reacao**: `LineChart` com top 3 atletas mais ativos
- **Radar Comparativo**: Sera preenchido com metricas calculadas (velocidade = kicks/s, reacao = avg_score, etc.)
- **Cards de Insight**: Calculados dinamicamente (melhor evolucao, mais consistente, precisa de atencao)
- **Crescimento**: `AreaChart` com novos atletas por mes (via `athletes.created_at`)

**Secoes simplificadas (sem dados reais disponiveis):**
- Taxa de retencao, ticket medio, NPS — exibidos como "Em breve" ou omitidos (nao ha tabela de pagamentos/feedback)
- Insights de captacao — texto estatico inspiracional (como no prototipo)

**Arquivos:** 
- `src/pages/Dashboard.tsx` (novo)
- `src/App.tsx` (adicionar rota `/dashboard` com `ProtectedRoute`)

---

## 3. Perfil do Atleta Completo (`StudentProfile.tsx`)

**Problema atual:** So mostra KPIs e grafico de Reacao. Sessoes de Time Attack e Arcade aparecem no historico mas sem metricas proprias.

**Melhorias:**

### KPIs adicionais (acima do grafico)
- **Time Attack**: Melhor score (chutes), media de chutes — via `training_sessions` mode=time_attack ou `solo_results`
- **Arcade**: Vitorias/Derrotas, total de lutas — via `training_sessions` mode=arcade, details contendo resultado
- **Campeonato**: Lutas disputadas, vitorias — via `championship_matches` filtrando por `red_athlete_name` ou `blue_athlete_name` == athlete.name

### Historico multi-modo
- Icones diferenciados para cada modo (ja existe para Reacao/Cognitivo, adicionar Time Attack e Arcade)
- Metricas por modo no item do historico:
  - Reacao: avg_score em ms
  - Time Attack: total de chutes + duracao
  - Arcade: resultado (W/L) + HP restante

### Grafico com tabs de modo
- Tab "Reacao" (atual): AreaChart com avg_score
- Tab "Time Attack": BarChart com chutes por sessao
- Tab "Arcade": linha de vitorias acumuladas

**Arquivos:** `src/pages/StudentProfile.tsx`

---

## Detalhes Tecnicos

### Queries do Dashboard

```text
-- Atletas ativos
SELECT count(*) FROM athletes WHERE academy_id = uid AND is_active = true

-- Sessoes ultimos 7 dias
SELECT count(*) FROM training_sessions WHERE academy_id = uid AND created_at >= now() - 7 days

-- Sessoes por dia (ultimos 7 dias)
SELECT date_trunc('day', created_at) as day, count(*) 
FROM training_sessions WHERE academy_id = uid AND created_at >= now() - 7 days
GROUP BY day

-- Ultimas 5 sessoes com athlete_id para join
SELECT ts.*, a.name FROM training_sessions ts
JOIN athletes a ON a.id = ts.athlete_id
WHERE ts.academy_id = uid ORDER BY ts.created_at DESC LIMIT 5

-- Uso por modo
SELECT mode, count(*) FROM training_sessions WHERE academy_id = uid GROUP BY mode

-- Top 5 atletas por sessoes
SELECT athlete_id, count(*) as total FROM training_sessions 
WHERE academy_id = uid GROUP BY athlete_id ORDER BY total DESC LIMIT 5
```

Todas executadas client-side via Supabase JS SDK. Nao requerem novas tabelas ou migrations.

### Estrutura do Dashboard

O componente `Dashboard.tsx` usara `Tabs` do shadcn/ui para as 4 abas. Cada aba sera um componente inline (nao extraido para arquivo separado) para simplicidade inicial. Os dados serao carregados em um unico `useEffect` no mount.

### Ordem de Execucao

1. **Filtros em Students.tsx** — mais rapido, independente
2. **Dashboard.tsx + rota** — nova pagina com dados reais
3. **StudentProfile.tsx expandido** — refatoracao do perfil existente

