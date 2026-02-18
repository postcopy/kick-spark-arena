

# Remover Combos do Modo Duelo (Arcade)

## Resumo

Eliminar toda a mecanica de combo do modo Duelo. Chutes terao sempre dano fixo (baseado no tipo: colete ou capacete), sem bonus por sequencia rapida.

## Alteracoes

### 1. `src/hooks/useArcadeState.ts` — Logica principal

- **`calculateDamage`**: Remover logica de combo. Retornar apenas dano base (vest ou helmet), sem `comboBonus`. Simplificar para retornar `{ damage }` sem `newCombo`.
- **`registerKick`**: Remover `comboCount` e `lastKickAt` do state update. Remover chamada `onCombo?.()`. Remover bloco que seta `setShowCombo`.
- **Estado**: Remover `showCombo` state e seu setter.
- **`resetGame` / `resetRound`**: Remover `setShowCombo(null)`.
- **Retorno do hook**: Remover `showCombo` do objeto retornado.

### 2. `src/components/game/ArcadeScreenTV.tsx` — UI da TV

- Remover as duas secoes de combo (`showCombo?.side === 'red'` e `showCombo?.side === 'blue'`).
- Remover `showCombo` da desestruturacao de props.

### 3. `src/components/game/ArcadeSetupScreen.tsx` — Regras

- Remover a linha de regra sobre combo: `"Combo: chutes rapidos em sequencia (ate +4 dano)"`.

### 4. `src/pages/Index.tsx` — Som

- Remover callback `onCombo: () => playComboRef.current()` do config do `useArcadeState`.

### 5. `src/types/game.ts` — Tipos (limpeza opcional)

- Remover `comboWindowMs` de `ArcadeConfig`.
- Remover `comboCount` e `lastKickAt` de `ArcadePlayerState`.

### 6. Arquivos que podem ser mantidos sem alteracao

- `ComboIndicator.tsx` e `ComboIndicatorTV.tsx` podem permanecer no projeto (nao serao mais referenciados). Nao ha necessidade de deletar.

## Resultado

- Cada chute causa dano fixo (colete ou capacete), sem multiplicadores
- Sem indicador visual de combo
- Sem som de combo
- Regras de setup atualizadas

