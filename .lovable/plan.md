
# Fix: Verify ImpactDetector internal state during flush

## Diagnosis

The heartbeat confirms `detector: true, onImpact: true`, and serial data flows (device 1, intensities 4-40). Yet `flush()` never returns finalized impacts. Two possibilities:

1. **feed() is called but impacts never start** (all intensities fail the `> startThreshold` check somehow)
2. **Impacts start but never finalize** (continuous data prevents silence gap AND maxDuration check has a bug)

We need visibility into the detector's internal state to distinguish these cases.

## Changes

### 1. `src/lib/impactDetector.ts` - Add debug method

Add a `getActiveCount()` method to expose how many active (in-progress) impacts exist. This is read-only and safe for production.

```typescript
getActiveCount(): number {
  return this.activeImpacts.size;
}
```

### 2. `src/hooks/useSerialPort.ts` - Enhanced diagnostics

**In the flush heartbeat (every ~5s):** Also log the number of active impacts inside the detector. This tells us if impacts are starting but never finalizing.

```typescript
if (flushCountRef.current % 150 === 0) {
  console.log('[useSerialPort] flush heartbeat, detector:', !!detectorRef.current, 
    'onImpact:', !!onImpactRef.current,
    'activeImpacts:', detectorRef.current?.getActiveCount() ?? 0);
}
```

**After feed() call (one-time):** Confirm data is reaching the detector instance.

```typescript
if (detectorRef.current) {
  detectorRef.current.feed(deviceId, intensity, Date.now());
  if (!loggedFeedRef.current) {
    console.log('[useSerialPort] feed() confirmed on detector, intensity:', intensity, 'deviceId:', deviceId);
    loggedFeedRef.current = true;
  }
}
```

Add `loggedFeedRef` as a new `useRef<boolean>(false)`.

## Expected result

The heartbeat will now show one of:
- `activeImpacts: 0` -- feed() isn't starting impacts (threshold issue)
- `activeImpacts: 1+` -- impacts start but never finalize (maxDuration or gap issue)

This pinpoints the exact failure layer for the definitive fix.

## Files modified

- `src/lib/impactDetector.ts` - Add `getActiveCount()` debug method
- `src/hooks/useSerialPort.ts` - Enhanced heartbeat + one-time feed confirmation log
