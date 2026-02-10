

# Tela de Resultados Finais — ReactionFinishedScreen

## Resumo

Reescrever o `ReactionFinishedScreen` com grafico de performance (recharts AreaChart), grid de estatisticas com 4 cards, e barra de 3 acoes no rodape. Tambem ajustar as props e o Index.tsx para suportar os novos callbacks.

## Mudancas por Arquivo

### 1. `src/components/game/ReactionFinishedScreen.tsx` — Reescrita completa

**Grafico de Performance (AreaChart):**
- Eixo X: Numero do estimulo (1, 2, 3...)
- Eixo Y: Tempo de reacao (ms)
- Linha de referencia horizontal pontilhada mostrando a media
- Gradiente verde para tempos abaixo da media, vermelho para acima
- Tooltip com tempo exato ao passar mouse/dedo
- Usar recharts (ja instalado): AreaChart, XAxis, YAxis, Tooltip, ReferenceLine, Area

**Grid de Estatisticas (4 cards):**

| Card | Icone | Label | Valor |
|------|-------|-------|-------|
| Melhor Marca | Trophy | Melhor (PB) | ex: 310ms |
| Media | TrendingDown | Media | ex: 405ms |
| Total Hits | Zap | Total Hits | ex: 24/25 |
| Estabilidade | Target | Estabilidade | ex: ±15ms (desvio padrao) |

**Barra de Acoes (3 botoes):**
- **Trocar Atleta** (outline/cinza): chama `onSwitchAthlete` — limpa sessao atual, volta para selecao de perfil
- **Ajustar** (ghost/cinza): chama `onAdjustSetup` — volta para ReactionSetupScreen mantendo usuario
- **REPETIR TREINO** (verde/destaque): chama `onPlayAgain` — reinicia imediatamente com mesmas configs

**Quando nao ha dados de reacao** (hardware nao conectado): ocultar grafico e cards de tempo, mostrar apenas rounds e total de estimulos com os 3 botoes.

### 2. `src/pages/Index.tsx` — Novos callbacks

- Adicionar `onAdjustSetup` que chama `reactionState.goToSetup()` (ja existe, so renomear a prop)
- Adicionar `onSwitchAthlete` que limpa `selectedAthlete`, chama `handleBackToMenu()` (volta ao menu principal/selecao)
- Passar as 3 callbacks para `ReactionFinishedScreen`:
  - `onPlayAgain` -> reinicia com `startCountdown()` diretamente (instant replay, sem passar pelo setup)
  - `onAdjustSetup` -> `goToSetup()`
  - `onSwitchAthlete` -> limpa atleta + volta ao menu

### 3. `src/hooks/useReactionState.ts` — Adicionar replay direto

- Adicionar funcao `replay()` que reseta contadores (rounds, tempos, stimuli) mas mantem a config atual e inicia o countdown imediatamente
- Isso permite o "REPETIR TREINO" sem passar pela tela de setup

## Secao Tecnica

### Calculo do Desvio Padrao (Estabilidade)

```text
mean = sum(times) / n
variance = sum((t - mean)^2) / n
stdDev = sqrt(variance)
exibir como "±{stdDev}ms"
```

### Estrutura do Grafico (recharts)

```text
const data = reactionTimes.map((t, i) => ({ index: i + 1, time: t }));

<AreaChart data={data}>
  <XAxis dataKey="index" />
  <YAxis domain={['auto', 'auto']} />
  <Tooltip />
  <ReferenceLine y={avgTime} stroke="#888" strokeDasharray="3 3" label="Media" />
  <Area dataKey="time" stroke="#39FF14" fill="url(#gradient)" />
  <defs>
    <!-- gradiente verde/vermelho baseado na media -->
  </defs>
</AreaChart>
```

### Layout da Tela

```text
+----------------------------------+
|     TREINO COMPLETO!             |
|     Nivel: Intermediario         |
+----------------------------------+
|                                  |
|   [===== AreaChart =====]        |
|   |  .    .              |       |
|   | . \  / \    .        |       |
|   |    \/    \  / \      |       |
|   |--- media --------    |       |
|   +------------------+   |       |
|                                  |
|   +------+  +------+            |
|   | PB   |  | Media|            |
|   | 310ms|  | 405ms|            |
|   +------+  +------+            |
|   +------+  +------+            |
|   | Hits |  | ±15ms|            |
|   | 24/25|  | Estab|            |
|   +------+  +------+            |
+----------------------------------+
| [Trocar] [Ajustar] [REPETIR]    |
+----------------------------------+
```

### Arquivos modificados
1. `src/components/game/ReactionFinishedScreen.tsx`
2. `src/pages/Index.tsx`
3. `src/hooks/useReactionState.ts`

