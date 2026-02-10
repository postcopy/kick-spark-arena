
# Upgrade Visual do Perfil do Aluno -- Estilo High Performance

## Visao Geral
Transformar o `StudentProfile.tsx` de um layout basico para um dashboard de performance estilo Strava/Garmin, com hero section rica, KPIs visuais, grafico contextualizado e historico com indicadores de tendencia.

## Alteracoes Detalhadas

### 1. Hero Section Rica
**Arquivo: `src/pages/StudentProfile.tsx`** (linhas 153-171)

Substituir o card de perfil simples por uma hero section completa:

- **Avatar com borda de faixa**: Envolver o `StudentAvatar` em um container com `ring-3` usando a cor correspondente a faixa do aluno. Mapeamento de cores:
  - branca -> ring-zinc-300
  - amarela -> ring-yellow-400
  - laranja -> ring-orange-500
  - verde -> ring-green-500
  - roxa -> ring-purple-500
  - marrom -> ring-amber-800
  - preta -> ring-zinc-600
  - vermelha -> ring-red-500

- **Badges** (usando componente `Badge` existente): Ao lado do nome, exibir badges compactos para:
  - Faixa (ex: "Amarela") com cor da faixa como fundo
  - Categoria, se preenchida (ex: "Juvenil") com estilo `secondary`
  - Peso, se preenchido (ex: "74kg") com estilo `outline`

- **Status Ativo/Inativo**: Bolinha circular (8x8px) ao lado do nome:
  - Verde (`bg-green-500`) + texto "Ativo" se `is_active !== false`
  - Cinza (`bg-zinc-500`) + texto "Inativo" se `is_active === false`
  - O campo `is_active` ja existe na tabela `athletes` mas nao e buscado atualmente -- adicionar ao SELECT

### 2. Grid de KPIs (4 Cards)
**Arquivo: `src/pages/StudentProfile.tsx`** (inserir entre filtros de tempo e o grafico)

Criar um grid `grid-cols-2 gap-3` com 4 cards de estatisticas, estilo `bg-slate-900/80 border border-white/10 rounded-xl`:

| KPI | Calculo | Icone |
|-----|---------|-------|
| **Recorde (PB)** | `Math.min(...allReactionSessions.map(s => s.best_score))` de TODAS as sessoes (sem filtro de tempo) | Trophy (amarelo) |
| **Media Geral** | Media de `avg_score` das sessoes de reacao no periodo filtrado (ja existe como `globalAvg`) | TrendingDown (verde) |
| **Assiduidade** | Contagem de sessoes no periodo filtrado: `filteredSessions.length` + label "Treinos" | Flame (laranja) |
| **Precisao Cognitiva** | Para sessoes com `details.cognitiveMode === true`: media de `(correctInhibitions / totalNoGoStimuli) * 100`. Se nao houver sessoes cognitivas, exibir "--" | Brain (roxo) |

Cada card segue o padrao visual do `ReactionFinishedScreen`: icone + label pequena + valor grande em negrito.

### 3. Upgrade no Grafico
**Arquivo: `src/pages/StudentProfile.tsx`** (linhas 188-258)

Adicionar uma segunda `ReferenceLine` horizontal pontilhada:
- `y={450}` (valor fixo por enquanto)
- `stroke` em cor distinta (amarelo/laranja claro, ex: `#F59E0B`)
- `strokeDasharray="6 3"` para diferenciar da linha de media pessoal
- Label: "Media da Categoria" posicionada `insideBottomRight`

Os dots ja existem no grafico atual (`dot={{ r: 4, fill: '#39FF14' }}`), manter como esta.

### 4. Historico Visual Aprimorado
**Arquivo: `src/pages/StudentProfile.tsx`** (linhas 260-306)

Para cada item do historico:

- **Icone do modo**: 
  - `reaction` -> icone `Zap` (amarelo)
  - `cognitive` / sessoes com `cognitiveMode: true` nos details -> icone `Brain` (roxo)
  - Outros modos -> icone `Target` (cinza)

- **Seta de tendencia**: Comparar `avg_score` da sessao com a media acumulada das sessoes anteriores:
  - Se `avg_score < mediaAnterior` (melhor): seta `TrendingDown` em verde
  - Se `avg_score > mediaAnterior` (pior): seta `TrendingUp` em vermelho
  - Se igual ou primeira sessao: sem seta

- **Estilo dark**: Trocar `bg-card border-border` por `bg-slate-900/80 border border-white/10`

### Secao Tecnica

**Arquivo modificado:** `src/pages/StudentProfile.tsx` (unico arquivo)

**Novos imports necessarios:**
- `Badge` de `@/components/ui/badge`
- `Trophy`, `Zap`, `Target`, `TrendingDown`, `TrendingUp`, `Flame`, `Brain` de `lucide-react`
- `BELT_COLORS` de `@/components/game/StudentAvatar` (para mapeamento de cores do ring)

**Novos dados computados (useMemo):**

```typescript
// PB absoluto (todas as sessoes, sem filtro de tempo)
const absolutePB = useMemo(() => {
  const allBests = sessions
    .filter(s => s.mode === 'reaction' && s.best_score != null)
    .map(s => s.best_score!);
  return allBests.length > 0 ? Math.round(Math.min(...allBests)) : null;
}, [sessions]);

// Precisao cognitiva
const cognitiveAccuracy = useMemo(() => {
  const cognitiveSessions = filteredSessions.filter(s => {
    const d = s.details as any;
    return d?.cognitiveMode === true && d?.totalNoGoStimuli > 0;
  });
  if (cognitiveSessions.length === 0) return null;
  const sum = cognitiveSessions.reduce((acc, s) => {
    const d = s.details as any;
    return acc + (d.correctInhibitions / d.totalNoGoStimuli) * 100;
  }, 0);
  return Math.round(sum / cognitiveSessions.length);
}, [filteredSessions]);

// Media acumulada para tendencia (indice -> media ate aquele ponto)
const runningAverages = useMemo(() => {
  const reactionOnly = sessions.filter(s => s.mode === 'reaction' && s.avg_score != null);
  let sum = 0;
  return reactionOnly.map((s, i) => {
    sum += s.avg_score!;
    return { id: s.id, avg: sum / (i + 1) };
  });
}, [sessions]);
```

**Mapeamento de cores do ring para o avatar (inline no componente):**
```typescript
const BELT_RING_COLORS: Record<string, string> = {
  branca: 'ring-zinc-300',
  amarela: 'ring-yellow-400',
  laranja: 'ring-orange-500',
  verde: 'ring-green-500',
  roxa: 'ring-purple-500',
  marrom: 'ring-amber-800',
  preta: 'ring-zinc-600',
  vermelha: 'ring-red-500',
};
```

**Query do atleta atualizada:**
Adicionar `is_active` ao SELECT da query de `athletes` e a interface `AthleteRow`.

**Nenhum arquivo novo criado.** Todas as alteracoes sao no `StudentProfile.tsx`, reutilizando componentes existentes (`Badge`, `StudentAvatar`, icones lucide).
