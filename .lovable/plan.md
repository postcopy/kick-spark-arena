

# Alinhar Dashboard ao Prototipo

O Dashboard atual ja tem a estrutura de 4 abas e dados reais, mas falta implementar varias secoes do prototipo.

## Gaps identificados

### Aba "Visao Geral"
- **Falta**: Grafico "Distribuicao de Golpes" (PieChart colete vs capacete) — o prototipo mostra dois PieCharts lado a lado, o atual so tem "Uso por Modo"

### Aba "Atletas"
- **Falta**: Ranking "Top Chutadores" com total de chutes, media por sessao e melhor sessao (dados de `solo_results`)
- **Falta**: Indicador de streak (dias seguidos) nos cards de atleta

### Aba "Desempenho" (COMPLETAMENTE VAZIA)
- **Falta**: LineChart "Evolucao do Tempo de Reacao" com top 3 atletas
- **Falta**: RadarChart "Perfil Comparativo de Atletas" com metricas (velocidade, potencia, reacao, resistencia, precisao, consistencia)
- **Falta**: Cards de Insight (Melhor Evolucao, Mais Consistente, Precisa de Atencao)

### Aba "Crescimento"
- **Falta**: Linha de "Cancelamentos/Churn" no AreaChart (atletas que ficaram inativos)
- **Falta**: Cards de insight (Taxa de Retencao, Ticket Medio, NPS) — exibir como "Em breve" para os que nao tem dados reais
- **Falta**: Secao "Insights para Captacao" com dicas estaticas

---

## Implementacao

### 1. Visao Geral — adicionar PieChart de golpes
- Buscar dados de `training_sessions.details` para contar golpes no colete vs capacete
- Exibir dois PieCharts lado a lado: "Distribuicao de Golpes" + "Uso por Modo" (este ja existe)

### 2. Atletas — Top Chutadores
- Query em `solo_results` agrupada por `athlete_id`: SUM(kicks), AVG(kicks), MAX(kicks)
- Renderizar ranking com posicao, nome, total, media e melhor

### 3. Desempenho — preencher com graficos reais

**Evolucao de Reacao (LineChart)**:
- Buscar `training_sessions` mode=reaction dos ultimos 60 dias
- Agrupar por semana para os top 3 atletas com mais sessoes
- Cada atleta = uma Line com cor diferente

**Radar Comparativo (RadarChart)**:
- Calcular metricas para top 3 atletas:
  - Velocidade: kicks_per_second medio (de solo_results)
  - Potencia: melhor score de chutes
  - Reacao: inverso do avg_score (menor = melhor)
  - Resistencia: total de sessoes
  - Precisao: cognitiveAccuracy (se houver)
  - Consistencia: desvio padrao baixo = melhor
- Normalizar valores para escala 0-100
- Importar `RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis` do Recharts

**Cards de Insight**:
- "Melhor Evolucao": atleta com maior reducao percentual no tempo de reacao
- "Mais Consistente": atleta com mais sessoes nos ultimos 30 dias
- "Precisa de Atencao": atleta ativo sem sessoes nos ultimos 14 dias (ou com piora)

### 4. Crescimento — completar
- Calcular churn: atletas que ficaram inativos por mes
- Adicionar Area de "Cancelamentos" no grafico
- Adicionar cards estaticos "Em breve" para NPS/Ticket Medio
- Adicionar secao "Insights para Captacao" com textos inspiracionais (estaticos, como no prototipo)

---

## Arquivos afetados
- `src/pages/Dashboard.tsx` — unico arquivo modificado

## Dados necessarios (novas queries)
- `solo_results` com athlete_id, kicks, kicks_per_second (para top chutadores e radar)
- `training_sessions` mode=reaction de 60 dias (para evolucao por atleta)
- Calculo de churn a partir de `athletes.is_active` e `created_at`

Nenhuma migration ou tabela nova necessaria.

