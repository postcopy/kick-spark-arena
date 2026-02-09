

# Fix: ImpactDetector dropping valid impacts due to minPackets/minDuration filters

## Root Cause

The `ImpactDetector.finalizeActive()` method has two anti-noise gates:
- `minPackets = 3` (need 3+ packets above threshold)
- `minDurationMs = 40` (impact must span 40ms+)

These were designed to reject noise spikes before we added `NOISE_INTENSITY_MIN = 15`. Now they are redundant and actively blocking real impacts.

A typical hardware hit pattern: one packet at intensity 25 surrounded by noise (intensity 4-8). Only the 25 passes the noise floor, giving `packetCount = 1` and `durationMs = 0`. Both filters reject it, so the impact is silently dropped. No HIT, no POINT, nothing.

## Fix

### `src/lib/impactDetector.ts`

Change the two constants:

```
MIN_IMPACT_PKTS: 3 -> 1
MIN_IMPACT_DURATION_MS: 40 -> 0
```

With the hardcoded noise floor at 15, any packet that reaches `finalizeActive()` is already a genuine contact. We no longer need the multi-packet / duration gate.

This is a single-file, 2-line change. No other files are affected.

## Why this is safe

- Noise (intensity 0-14) is already discarded in `feed()` before any impact can start
- The 3-tier classification (HIT 15-19, POINT 20+) in `ChampionshipMat.tsx` remains unchanged
- The 300ms anti-duplicate lockout per device still prevents double scoring
- The silence gap (200ms) and max duration (2000ms) logic are unaffected

## Expected result

After this fix:
- A single packet at intensity 20+ will finalize as an impact and register as a POINT
- A single packet at intensity 15-19 will finalize as an impact and register as a HIT
- Noise below 15 continues to be completely ignored

