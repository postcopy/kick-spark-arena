

# Fix: Flush heartbeat runs but flush() never executes

## Root Cause (probable)

The flush interval code has this structure:
```
if (detectorRef.current && onImpactRef.current) {
  const finalized = detectorRef.current.flush(Date.now());
  ...
}
```

The heartbeat log is BEFORE this guard, so it shows "detector exists: true" even when `onImpactRef.current` is null/undefined. If `onImpactRef` is falsy, `flush()` never runs, and impacts accumulate forever without being finalized or delivered.

## Changes

### 1. `src/hooks/useSerialPort.ts` - Enhanced heartbeat logging

Update the heartbeat (every ~5s) to also log `onImpactRef.current` existence:

```
console.log('[useSerialPort] flush heartbeat, detector:', !!detectorRef.current, 'onImpact:', !!onImpactRef.current);
```

Also add a one-time log when flush() actually produces results or when the guard blocks execution, to definitively confirm which branch runs.

### 2. `src/hooks/useSerialPort.ts` - Remove onImpactRef guard from flush

The guard `onImpactRef.current` prevents flush() from even running when onImpact is not set. But flush() MUST always run to finalize impacts (otherwise pendingFinalized grows forever and memory leaks). The guard should only wrap the callback delivery, not the flush call itself:

```typescript
// BEFORE (broken):
if (detectorRef.current && onImpactRef.current) {
  const finalized = detectorRef.current.flush(Date.now());
  for (const impact of finalized) {
    onImpactRef.current({...});
  }
}

// AFTER (fixed):
if (detectorRef.current) {
  const finalized = detectorRef.current.flush(Date.now());
  if (finalized.length > 0) {
    console.log(`[useSerialPort] flush -> ${finalized.length} impacts finalized`);
    if (onImpactRef.current) {
      for (const impact of finalized) {
        onImpactRef.current({...});
      }
    }
  }
}
```

This ensures flush() always runs to clean up stale impacts, and the callback is only invoked when available.

## Files modified

- `src/hooks/useSerialPort.ts` - Fix flush guard structure + enhance heartbeat log

## Expected result

- flush() runs unconditionally when detector exists (no longer blocked by onImpactRef)
- Impacts finalize correctly after maxDurationMs (2000ms)
- Console shows "flush -> N impacts finalized" confirming the pipeline works
- If onImpact callback is missing, impacts still finalize (no memory leak) but aren't delivered to scoring

