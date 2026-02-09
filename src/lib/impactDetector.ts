// ImpactDetector - Pure logic module for impact detection via hysteresis
// Used by both useHardwareDiagnostics and useSerialPort (championship scoring)

// ─── Constants (shared between diagnostics and scoring) ───
export const NOISE_INTENSITY_MIN = 15; // Hardcoded noise floor: intensity < 15 = NOISE (ignored)
export const SILENCE_GAP_MS = 200;
export const MIN_IMPACT_PKTS = 1;
export const MIN_IMPACT_DURATION_MS = 0;
export const DEFAULT_DELTA_START = 4;
export const DEFAULT_DELTA_CONTINUE = 2;

// ─── Interfaces ───
export interface ImpactDetectorConfig {
  noiseFloor: Record<string, number>;
  deltaStart: number;
  deltaContinue: number;
  silenceGapMs: number;
  minPackets: number;
  minDurationMs: number;
  maxDurationMs: number;
}

export interface FinalizedImpact {
  deviceId: number;
  startTs: number;
  endTs: number;
  durationMs: number;
  peakIntensity: number;
  avgIntensity: number;
  packetCount: number;
}

// ─── Internal State ───
interface ActiveImpactState {
  startTs: number;
  lastAboveTs: number;
  peak: number;
  sum: number;
  packetCount: number;
}

// ─── ImpactDetector Class ───
export class ImpactDetector {
  private activeImpacts = new Map<number, ActiveImpactState>();
  private pendingFinalized: FinalizedImpact[] = [];
  private config: ImpactDetectorConfig;
  private wizardMode = false;

  constructor(config?: Partial<ImpactDetectorConfig>) {
    this.config = {
      noiseFloor: {},
      deltaStart: DEFAULT_DELTA_START,
      deltaContinue: DEFAULT_DELTA_CONTINUE,
      silenceGapMs: SILENCE_GAP_MS,
      minPackets: MIN_IMPACT_PKTS,
      minDurationMs: MIN_IMPACT_DURATION_MS,
      maxDurationMs: 2000,
      ...config,
    };
  }

  /** Finalize an active impact into a FinalizedImpact (or null if anti-noise filters reject it) */
  private finalizeActive(deviceId: number, active: ActiveImpactState): FinalizedImpact | null {
    const durationMs = active.lastAboveTs - active.startTs;
    const minPkts = this.wizardMode ? 1 : this.config.minPackets;
    const minDur = this.wizardMode ? 1 : this.config.minDurationMs;

    if (active.packetCount >= minPkts || durationMs >= minDur) {
      return {
        deviceId,
        startTs: active.startTs,
        endTs: active.lastAboveTs,
        durationMs,
        peakIntensity: active.peak,
        avgIntensity: Math.round(active.sum / active.packetCount),
        packetCount: active.packetCount,
      };
    }
    return null;
  }

  /** Feed a raw packet into the detector */
  feed(deviceId: number, intensity: number, ts: number): void {
    // Hardcoded noise floor: discard before any threshold logic
    if (intensity < NOISE_INTENSITY_MIN) return;
    
    const floor = this.config.noiseFloor[String(deviceId)] ?? 0;
    const startThreshold = floor + this.config.deltaStart;
    const continueThreshold = floor + this.config.deltaContinue;

    const active = this.activeImpacts.get(deviceId);

    // If active impact exceeded max duration, force-finalize before processing new data
    if (active && (ts - active.startTs) > this.config.maxDurationMs) {
      const finalized = this.finalizeActive(deviceId, active);
      if (finalized) {
        this.pendingFinalized.push(finalized);
      }
      this.activeImpacts.delete(deviceId);
    }

    const currentActive = this.activeImpacts.get(deviceId);

    if (!currentActive) {
      // Start new impact if above start threshold
      if (intensity > startThreshold) {
        this.activeImpacts.set(deviceId, {
          startTs: ts,
          lastAboveTs: ts,
          peak: intensity,
          sum: intensity,
          packetCount: 1,
        });
      }
    } else {
      // Continue if above continue threshold
      if (intensity > continueThreshold) {
        currentActive.sum += intensity;
        currentActive.packetCount++;
        currentActive.lastAboveTs = ts;
        if (intensity > currentActive.peak) {
          currentActive.peak = intensity;
        }
      }
      // If below continueThreshold: don't update lastAboveTs,
      // flush() will finalize when gap > silenceGapMs
    }
  }

  /** Check for inactive impacts and finalize them. Call periodically (e.g. every 30ms). */
  flush(now: number): FinalizedImpact[] {
    // Start with any impacts force-finalized during feed()
    const finalized: FinalizedImpact[] = this.pendingFinalized.splice(0);

    this.activeImpacts.forEach((active, deviceId) => {
      const gapMs = now - active.lastAboveTs;
      const durationMs = now - active.startTs;
      const shouldFinalize = gapMs > this.config.silenceGapMs || durationMs > this.config.maxDurationMs;

      if (shouldFinalize) {
        const result = this.finalizeActive(deviceId, active);
        if (result) {
          finalized.push(result);
        }
        this.activeImpacts.delete(deviceId);
      }
    });

    return finalized;
  }

  /** Update config at runtime (e.g. noiseFloor changed) */
  updateConfig(partial: Partial<ImpactDetectorConfig>): void {
    Object.assign(this.config, partial);
  }

  /** Relax anti-noise criteria for calibration wizard */
  setWizardMode(active: boolean): void {
    this.wizardMode = active;
  }

  /** Get current wizard mode state */
  isWizardMode(): boolean {
    return this.wizardMode;
  }

  /** Get number of active (in-progress) impacts for diagnostics */
  getActiveCount(): number {
    return this.activeImpacts.size;
  }

  /** Reset all active impacts (e.g. on disconnect) */
  reset(): void {
    this.activeImpacts.clear();
  }
}
