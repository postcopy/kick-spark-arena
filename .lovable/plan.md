
# Melhoria do Grafico de Performance

## Alteracoes

**Arquivo:** `src/components/game/ReactionFinishedScreen.tsx`

Tres ajustes no componente `<Area>` (linhas 119-125):

1. **Tipo linear** — trocar `type="monotone"` por `type="linear"` para linhas retas entre pontos (sem overshoot)
2. **Dots visiveis** — adicionar `dot={{ r: 4, fill: '#39FF14' }}` e `activeDot={{ r: 6 }}` para marcar cada chute
3. **Margem** — ja esta aplicada (`left: 40`) desde a correcao anterior

### Resultado visual
O grafico passa de curvas suaves para um visual "ziguezague" com marcadores em cada ponto, tornando a instabilidade de tempo de reacao muito mais evidente para o treinador.

## Secao tecnica

```text
// De (linha 119-125):
<Area
  type="monotone"
  dataKey="time"
  stroke="#39FF14"
  strokeWidth={2}
  fill="url(#reactionGradient)"
/>

// Para:
<Area
  type="linear"
  dataKey="time"
  stroke="#39FF14"
  strokeWidth={2}
  fill="url(#reactionGradient)"
  dot={{ r: 4, fill: '#39FF14' }}
  activeDot={{ r: 6 }}
/>
```

## Arquivos modificados
1. `src/components/game/ReactionFinishedScreen.tsx` — tipo linear + dots no Area
