

# Fix: Make HIT and POINT counts mutually exclusive

## Problem

When a POINT (intensity 20+) is registered, the code calls both `sync.addHit()` and `sync.addScore()`, inflating the Hits counter. Hits should only count contacts that did NOT become points (for tiebreak criteria).

## Change

### `src/pages/ChampionshipMat.tsx` (lines ~137-145)

Replace the current logic:

```typescript
// Current (broken):
sync.addHit(matchSide);           // always
if (isPoint) {
  sync.addScore(matchSide, scoreType);  // also on point
}
```

With mutually exclusive logic:

```typescript
// Fixed:
if (isPoint) {
  sync.addScore(matchSide, scoreType);  // POINT only -> score, no hit
} else {
  sync.addHit(matchSide);              // HIT only -> hit, no score
}
```

This is a ~4 line change in a single file. No other files affected.

## Result

- Intensity 0-14: ignored (unchanged)
- Intensity 15-19: `addHit()` only -- counter increments, score unchanged
- Intensity 20+: `addScore()` only -- score increments, hit counter unchanged
- Hit counter now represents "contacts that didn't become points" for tiebreak use

