

# Redesign Visual do Dashboard — Fidelidade ao Prototipo

## Problema
O Dashboard atual usa componentes genericos do shadcn/ui (Card, Tabs) com estilo minimalista. O prototipo tem um visual gaming/e-sports com gradientes escuros, cores vibrantes, bordas coloridas e tipografia impactante.

## Solucao
Reescrever **apenas a camada visual** (JSX/CSS) do `Dashboard.tsx`, mantendo toda a logica de dados (loadDashboard, queries ao banco, calculos de KPIs, radar, insights) intacta.

### Mudancas visuais principais

**Header**:
- Gradiente horizontal `#0f172a -> #1e1b4b -> #0f172a`
- Logo S-FIGHT com gradiente vermelho/amarelo
- Tabs customizadas com fundo vermelho quando ativa
- Seletor de periodo (semana/mes/ano)
- Sticky com backdrop-filter blur

**KPI Cards (StatCard)**:
- Gradiente `#1a1a2e -> #16213e`
- Borda colorida semi-transparente (`${color}33`)
- Icone emoji gigante com opacidade 0.07 no canto
- Valor com fonte 36px bold na cor do card
- Subtitulo em cinza

**Secoes e graficos**:
- Fundo `#1a1a2e` com borda `#1e293b` e border-radius 16px
- Titulos com emoji + texto branco
- Tooltips com fundo `#1e1b4b` e borda `#312e81`
- Graficos com grid `#1e293b` e eixos `#475569`

**Aba Atletas**:
- Cards com avatar gradiente vermelho/amarelo (ativo) ou cinza (inativo)
- BeltBadge com cores de faixa
- Indicador de streak com emoji fogo
- Selecao com gradiente indigo

**Aba Desempenho**:
- LineChart e RadarChart com mesmo estilo do prototipo
- Insight cards com gradientes tematicos (indigo, verde, vermelho)

**Aba Crescimento**:
- AreaChart com 3 linhas (ativos, novos, churn)
- StatCards para Taxa de Retencao, Novos, Ticket Medio, NPS
- Secao Insights para Captacao com cards escuros

**Footer**:
- Texto discreto com borda superior

### O que NAO muda
- Toda a funcao `loadDashboard()` (linhas 76-426) permanece identica
- Interface `DashboardData` permanece identica
- Queries ao banco permanecem identicas
- Calculos de radar, insights, streak permanecem identicos
- Imports do Recharts permanecem identicos

### Arquivo afetado
- `src/pages/Dashboard.tsx` — reescrever apenas o JSX (return) e componentes auxiliares (KPICard, ComingSoonCard), substituindo por inline styles fieis ao prototipo

