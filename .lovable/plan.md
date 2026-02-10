
# Modulo de Gestao de Alunos e Analise de Performance

## Visao Geral

Criar um modulo completo para o treinador gerenciar seus alunos e visualizar a evolucao de performance ao longo do tempo. Inclui lista de alunos, perfil individual com graficos de evolucao, e integracao automatica com o modo de treino de reacao.

## O que ja existe

- Tabela `athletes` no banco (id, academy_id, name, nickname, belt, category, avatar_url, is_active)
- Tabela `solo_results` para modo time_attack (kicks, duration)
- Tipo `Athlete` em `src/types/game.ts`
- Dialog de adicionar atleta (`AddAthleteDialog`)
- Estado `selectedAthlete` no `Index.tsx`

## Plano de Implementacao

### 1. Migracao SQL

- Adicionar `birth_date` (date) e `weight_kg` (numeric) na tabela `athletes`
- Criar tabela `training_sessions` (id, athlete_id, academy_id, mode, avg_score, best_score, details jsonb, created_at)
- RLS: academy vê apenas seus dados
- Indice em (athlete_id, created_at DESC)

### 2. Pagina de Lista de Alunos (`src/pages/Students.tsx`)

- Grid de cards com avatar, nome e tag colorida da faixa
- Botao flutuante (+) para adicionar novo aluno
- Clicar no card navega para `/students/:id`

### 3. Pagina de Perfil e Analytics (`src/pages/StudentProfile.tsx`)

- Cabecalho: avatar grande, nome, faixa (com cor), idade calculada
- Filtros de tempo: Semana / Mes / Ano / Tudo
- AreaChart linear de evolucao (X: datas, Y: tempo medio ms)
- Historico recente: lista das ultimas sessoes

### 4. Seletor de Atleta Ativo (`src/components/game/AthletePickerDialog.tsx`)

- Dialog com lista de atletas para selecionar o ativo
- **Modo Visitante (Guest):** Opcao no topo "Visitante (Sem Salvar)" para demonstracoes sem cadastro. Permite treinar normalmente mas nao salva resultados no banco.
- Botao na HomeScreen para abrir o dialog

### 5. Avatar Placeholder com Iniciais

- Se o aluno nao tiver foto (`avatar_url` null), renderizar um circulo com as iniciais do nome (ex: "Joao Silva" -> "JS")
- Cor de fundo baseada na faixa do aluno (mapeamento de cores das faixas)
- Componente reutilizavel `StudentAvatar` usado tanto na lista quanto no perfil

### 6. Integracao com ReactionFinishedScreen

- Se ha atleta selecionado (e nao e visitante): salvar training_session automaticamente
- Se e visitante: treina normalmente, nao salva
- Toast de confirmacao ao salvar

### 7. Rotas e Navegacao

- `/students` e `/students/:id` no App.tsx
- Link "Meus Alunos" no MenuDrawer

## Cores das faixas (mapeamento)

```text
white    -> #FFFFFF (borda cinza)
yellow   -> #FACC15
orange   -> #F97316
green    -> #22C55E
purple   -> #A855F7
brown    -> #92400E
black    -> #1C1917
red      -> #EF4444
```

## Arquivos novos
1. `src/pages/Students.tsx`
2. `src/pages/StudentProfile.tsx`
3. `src/components/game/AthletePickerDialog.tsx`
4. `src/components/game/StudentAvatar.tsx`
5. `src/hooks/useTrainingSessions.ts`

## Arquivos modificados
1. `src/App.tsx` — rotas
2. `src/components/game/HomeScreen.tsx` — botao selecionar atleta
3. `src/components/game/MenuDrawer.tsx` — link /students
4. `src/components/game/ReactionFinishedScreen.tsx` — salvar sessao
5. `src/components/game/AddAthleteDialog.tsx` — campos birth_date e weight_kg
6. `src/pages/Index.tsx` — passar selectedAthlete e flag isGuest
