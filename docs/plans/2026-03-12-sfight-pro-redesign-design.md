# S-FIGHT PRO - Redesign Visual Completo

## Resumo
Redesign completo do app S-Fight com visual esportivo profissional, navegacao intuitiva para professores e alunos, e dashboard profissional com metricas completas.

## Decisoes
- **Abordagem:** S-FIGHT PRO - evolucao visual com identidade vermelho/preto/dourado
- **Publico:** Professores e alunos igualmente
- **Estilo:** Esportivo/Energetico
- **Navegacao:** Sidebar (desktop) + bottom tabs (mobile)
- **Marca:** Aberto a sugestoes, manter S-FIGHT ou evoluir

---

## Paleta de Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Preto Profundo | #0A0A0F | Background principal |
| Cinza Escuro | #141420 | Cards, sidebar |
| Cinza Medio | #1E1E2E | Cards secundarios, inputs |
| Vermelho S-Fight | #E11D48 | Acoes primarias, destaque |
| Vermelho Escuro | #9F1239 | Hover, gradientes |
| Dourado | #F59E0B | Badges, rankings |
| Dourado Claro | #FCD34D | Hover dourado, estrelas |
| Branco | #F8FAFC | Texto principal |
| Cinza Texto | #94A3B8 | Texto secundario |
| Verde Sucesso | #10B981 | Metricas positivas |
| Azul Info | #3B82F6 | Links, informacoes |

## Tipografia
- **Titulos:** Rajdhani Bold (700)
- **Corpo:** Rajdhani Regular/Medium (400/500)
- **Numeros/Metricas:** JetBrains Mono
- **Escala:** 12, 14, 16, 20, 24, 32, 48px

## Gradientes
- Primario: `linear-gradient(135deg, #E11D48, #9F1239)`
- Card destaque: `linear-gradient(145deg, #141420, #1E1E2E)`
- Dourado: `linear-gradient(135deg, #F59E0B, #FCD34D)`

---

## Navegacao

### Sidebar Desktop (280px expandida / 72px colapsada)
- Fundo: #141420, borda direita sutil
- Itens: Dashboard, Modos de Jogo, Ranking, Alunos, Campeonato, Config
- Ativo: fundo vermelho 15% opacidade + barra lateral vermelha 3px
- Avatar do professor + logout no bottom
- Botao colapsar/expandir

### Bottom Tabs Mobile (5 itens)
- Dashboard | Jogar | Ranking | Alunos | Menu
- Fundo #141420, borda top sutil
- "Jogar" com destaque (circulo vermelho)

---

## Dashboard

### KPI Cards (4 no topo)
- Alunos Ativos (com tendencia %)
- Sessoes da Semana
- Total de Chutes
- Media Tempo de Reacao

### Tab 1: Visao Geral
- Grafico barras: sessoes por dia da semana
- Grafico rosca: distribuicao chutes (corpo/cabeca)
- Feed atividade recente
- Card "Destaque da Semana"

### Tab 2: Ranking
- Top 3 em destaque (ouro/prata/bronze com glow)
- Tabela ranking completa
- Filtros: periodo + modo de jogo
- Indicadores subida/descida

### Tab 3: Desempenho
- Grafico linha: evolucao reacao (top 5, 8 semanas)
- Radar chart: habilidades comparativas
- Cards insights: maior evolucao, mais consistente, atencao

### Tab 4: Crescimento
- Grafico area: ativos/novos/churn mensal
- KPIs: retencao, media sessoes, engajamento
- Card meta com barra progresso

---

## Tela de Login
- Background gradiente escuro
- Logo S-FIGHT PRO centralizado
- Inputs dark (#1E1E2E), bordas sutis
- Botao "Entrar" gradiente vermelho
- Botao "Criar Conta" outline branco

---

## Pagina de Alunos
- Grid responsivo de cards
- Avatar grande, nome, faixa (cor real), status ativo/inativo
- Busca e filtros por faixa no topo
- Botao "Adicionar Aluno" vermelho

## Perfil do Aluno
- Header com avatar, nome, faixa, dados pessoais
- Cards de estatisticas (sessoes, recordes, media)
- Graficos de evolucao pessoal
- Historico de treinos

---

## Componentes Globais
- Cards: fundo #141420, borda 1px #1E1E2E, border-radius 12px
- Botoes primarios: gradiente vermelho, hover escurece
- Botoes secundarios: outline branco ou ghost
- Badges: vermelho (urgente), dourado (ranking), verde (ativo), cinza (inativo)
- Inputs: fundo #1E1E2E, borda #2D2D3F, focus borda vermelha
- Tabelas: zebra striping sutil, hover na linha
