

# Fix: Tie Decision Modal Showing When Hits Already Decided the Winner

## Problem

The `isTie` variable in `ChampionshipMat.tsx` (line 227-228) only checks if round scores are equal:

```typescript
const isTie = sync.state.status === 'ROUND_END' && 
              sync.state.roundScoreRed === sync.state.roundScoreBlue;
```

But the round-end logic in `useChampionshipSync.ts` already correctly awards the round to the athlete with more hits (when scores are tied). It logs "Azul vence por superioridade (HITS)" and calls `handleRoundEndWithWinner`, which increments `roundWinsBlue`.

The result: the round is already decided (Blue won), but the UI still shows the "EMPATE -- Declarar Vencedor" buttons because it only checks scores, not whether the round was actually left undecided.

## Root Cause

Two independent pieces of logic are out of sync:
1. **Backend (hook)**: Checks scores, then hits, then declares tie -- correct
2. **Frontend (UI)**: Only checks scores to show tie modal -- incomplete

## Fix

### `src/pages/ChampionshipMat.tsx` (line 227-228)

Update `isTie` to also require hits to be equal:

```typescript
const isTie = sync.state.status === 'ROUND_END' && 
              sync.state.roundScoreRed === sync.state.roundScoreBlue &&
              sync.state.hitsRed === sync.state.hitsBlue;
```

This is a 1-line change. The tie decision modal will now only appear when there is a true total tie (both scores AND hits are identical), which is when the operator genuinely needs to make a manual call.

## Result

- Scores different: winner auto-declared, no modal (unchanged)
- Scores tied, hits different: winner auto-declared by hits, no modal (fixed)
- Scores tied, hits tied: manual decision modal shown (unchanged)

