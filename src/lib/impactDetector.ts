// ImpactDetector - Pure logic module for impact detection via hysteresis
// Used by both useHardwareDiagnostics and useSerialPort (championship scoring)

// ─── Constants (shared between diagnostics and scoring) ───
export const SILENCE_GAP_MS = 200;
export const MIN_IMPACT_PKTS = 3;
export const MIN_IMPACT_DURATION_MS = 40;
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
      ...config,
    };
  }

  /** Feed a raw packet into the detector */
  feed(deviceId: number, intensity: number, ts: number): void {
    const floor = this.config.noiseFloor[String(deviceId)] ?? 0;
    const startThreshold = floor + this.config.deltaStart;
    const continueThreshold = floor + this.config.deltaContinue;

    const active = this.activeImpacts.get(deviceId);

    if (!active) {
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
        active.sum += intensity;
        active.packetCount++;
        active.lastAboveTs = ts;
        if (intensity > active.peak) {
          active.peak = intensity;
        }
      }
      // If below continueThreshold: don't update lastAboveTs,
      // flush() will finalize when gap > silenceGapMs
    }
  }

  /** Check for inactive impacts and finalize them. Call periodically (e.g. every 30ms). */
  flush(now: number): FinalizedImpact[] {
    const finalized: FinalizedImpact[] = [];

    this.activeImpacts.forEach((active, deviceId) => {
      const gapMs = now - active.lastAboveTs;
      if (gapMs > this.config.silenceGapMs) {
        const durationMs = active.lastAboveTs - active.startTs;

        // Anti-noise: relaxed in wizard mode
        const minPkts = this.wizardMode ? 1 : this.config.minPackets;
        const minDur = this.wizardMode ? 1 : this.config.minDurationMs;

        if (active.packetCount >= minPkts || durationMs >= minDur) {
          finalized.push({
            deviceId,
            startTs: active.startTs,
            endTs: active.lastAboveTs,
            durationMs,
            peakIntensity: active.peak,
            avgIntensity: Math.round(active.sum / active.packetCount),
            packetCount: active.packetCount,
          });
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

  /** Reset all active impacts (e.g. on disconnect) */
  reset(): void {
    this.activeImpacts.clear();
  }
}
