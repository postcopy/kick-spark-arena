
# Fix: Implement 3-Tier Intensity Logic and Remove RAW Mode

## Problem

The scoring system is too sensitive -- any touch registers as a point because:
1. The "RAW" mode bypasses intensity thresholds entirely (any intensity > 0 triggers onKick -> score)
2. Even in "impacts" mode, the ImpactDetector uses low hysteresis deltas (deltaStart=4) allowing very weak signals to start impacts
3. There is no hardcoded noise floor -- the system relies entirely on calibration

## Solution

Implement hardcoded 3-tier intensity classification and remove the RAW scoring path.

```text
Intensity Range    | Classification | Action
-------------------|----------------|----------------------------------------
0 - 14             | NOISE          | Completely ignored, no log, no score
15 - 19            | HIT            | Visual flash + log for tiebreak, NO score
20+                | POINT          | Score added (2 vest / 3 helmet) + sound
```

## Changes

### 1. `src/lib/impactDetector.ts` -- Hardcoded noise floor

Add a minimum intensity constant. Any packet with intensity < 15 is discarded in `feed()` before threshold logic runs. This prevents weak signals from even starting an impact.

```typescript
export const NOISE_INTENSITY_MIN = 15;

// In feed():
if (intensity < NOISE_INTENSITY_MIN) return; // discard noise at source
```

### 2. `src/types/championship.ts` -- Remove 'raw' option

- Change `scoringInput` type from `'raw' | 'impacts'` to just `'impacts'`
- Change default from `'raw'` to `'impacts'`
- Set default `impactThresholds` with hardcoded values:
  - `vestPointMin: 20`, `helmetPointMin: 20`
  - `vestHitMin: 15`, `helmetHitMin: 15`
  - `noiseFloor: {}` (empty -- the hardcoded floor in ImpactDetector handles this)

### 3. `src/pages/ChampionshipMat.tsx` -- Remove RAW mode path

- Remove the `handleHardwareKickRef` / `handleHardwareKick` legacy handler entirely (lines 69-86)
- Always pass `onKick` as a no-op to useSerialPort (required by the interface)
- The `impactDetectorConfigMemo` will always be `{ enabled: true, noiseFloor: ... }` since scoringInput is always 'impacts'
- Update `handleImpactRef` to use the 3-tier logic:
  - If `peakIntensity < 15`: should not arrive (filtered in ImpactDetector), but guard anyway
  - If `peakIntensity >= 15 && < pointMin (20)`: log as HIT, call `sync.addHit()`, do NOT call `sync.addScore()`
  - If `peakIntensity >= pointMin (20)`: log as POINT, call both `sync.addHit()` and `sync.addScore()`

### 4. `src/components/championship/MatchConfigDialog.tsx` -- Remove RAW radio option

Remove the RadioGroup that lets users switch between 'raw' and 'impacts'. The system is now always in impacts mode.

### 5. `src/components/championship/OperatorPanel.tsx` -- Clean up RAW references

Remove any conditional UI that shows/hides based on `scoringInput === 'raw'`.

## Files modified

- `src/lib/impactDetector.ts` -- Add NOISE_INTENSITY_MIN guard in feed()
- `src/types/championship.ts` -- Remove 'raw' option, add default thresholds
- `src/pages/ChampionshipMat.tsx` -- Remove legacy RAW handler, simplify to impacts-only
- `src/components/championship/MatchConfigDialog.tsx` -- Remove RAW/impacts radio toggle
- `src/components/championship/OperatorPanel.tsx` -- Remove RAW-conditional UI

## Anti-duplication

The existing 300ms per-deviceId lockout remains unchanged. After an impact is accepted (HIT or POINT), the same sensor is locked for 300ms.

## Expected result

- Touches with intensity 0-14 are silently ignored
- Touches with intensity 15-19 show as HIT (visual + log) but never change the score
- Touches with intensity 20+ add 2pts (vest) or 3pts (helmet) to the score
- No configuration needed -- thresholds are hardcoded (configurable later)
