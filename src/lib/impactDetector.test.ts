import { describe, it, expect, beforeEach } from 'vitest';
import {
  ImpactDetector,
  NOISE_INTENSITY_MIN,
  SILENCE_GAP_MS,
  DEFAULT_DELTA_START,
  DEFAULT_DELTA_CONTINUE,
} from './impactDetector';

describe('ImpactDetector', () => {
  let detector: ImpactDetector;

  beforeEach(() => {
    detector = new ImpactDetector();
  });

  describe('basic impact detection', () => {
    it('should detect an impact when intensity exceeds start threshold', () => {
      const ts = 1000;
      // Default noiseFloor is 0, deltaStart is 4, so threshold is 4
      // Intensity must also be >= noiseIntensityMin (1)
      detector.feed(1, 20, ts);
      const results = detector.flush(ts + SILENCE_GAP_MS + 1);
      expect(results).toHaveLength(1);
      expect(results[0].deviceId).toBe(1);
      expect(results[0].peakIntensity).toBe(20);
    });

    it('should return empty array when no impacts are active', () => {
      const results = detector.flush(1000);
      expect(results).toHaveLength(0);
    });

    it('should not finalize an impact before silence gap elapses', () => {
      detector.feed(1, 20, 1000);
      const results = detector.flush(1000 + SILENCE_GAP_MS - 1);
      expect(results).toHaveLength(0);
      expect(detector.getActiveCount()).toBe(1);
    });
  });

  describe('noise filtering', () => {
    it('should ignore intensity below noiseIntensityMin', () => {
      // NOISE_INTENSITY_MIN is 1, so intensity 0 should be rejected
      detector.feed(1, 0, 1000);
      const results = detector.flush(2000);
      expect(results).toHaveLength(0);
      expect(detector.getActiveCount()).toBe(0);
      expect(detector.getRejectedCount()).toBe(1);
    });

    it('should ignore intensity exactly at noiseIntensityMin but below start threshold', () => {
      // noiseIntensityMin=1, but startThreshold=20+4=24 with custom noiseFloor
      const det = new ImpactDetector({ noiseFloor: { '1': 20 } });
      // startThreshold = 20 + 4 = 24
      det.feed(1, 20, 1000); // 20 >= 1 (passes noise) but 20 <= 24 (below start threshold)
      const results = det.flush(2000);
      expect(results).toHaveLength(0);
    });

    it('should accept intensity at noiseIntensityMin when above start threshold', () => {
      // NOISE_INTENSITY_MIN=1, startThreshold=0+4=4
      // Feed intensity 5: passes noise (5>=1) and passes start (5>4)
      detector.feed(1, 5, 1000);
      const results = detector.flush(1000 + SILENCE_GAP_MS + 1);
      expect(results).toHaveLength(1);
    });

    it('should reject intensity below custom noiseIntensityMin', () => {
      const det = new ImpactDetector({ noiseIntensityMin: 10 });
      det.feed(1, 5, 1000);
      const results = det.flush(2000);
      expect(results).toHaveLength(0);
      expect(det.getRejectedCount()).toBe(1);
    });
  });

  describe('peak detection', () => {
    it('should record the highest intensity as peak', () => {
      detector.feed(1, 20, 1000);
      detector.feed(1, 50, 1010);
      detector.feed(1, 30, 1020);
      const results = detector.flush(1020 + SILENCE_GAP_MS + 1);
      expect(results).toHaveLength(1);
      expect(results[0].peakIntensity).toBe(50);
      expect(results[0].packetCount).toBe(3);
    });

    it('should compute average intensity', () => {
      detector.feed(1, 20, 1000);
      detector.feed(1, 40, 1010);
      const results = detector.flush(1010 + SILENCE_GAP_MS + 1);
      expect(results).toHaveLength(1);
      expect(results[0].avgIntensity).toBe(30); // (20+40)/2
    });
  });

  describe('silence gap finalization', () => {
    it('should finalize impact after silenceGapMs of no activity', () => {
      detector.feed(1, 20, 1000);
      // Flush just after gap
      const results = detector.flush(1000 + SILENCE_GAP_MS + 1);
      expect(results).toHaveLength(1);
      expect(results[0].startTs).toBe(1000);
      expect(results[0].endTs).toBe(1000);
      expect(results[0].durationMs).toBe(0);
    });

    it('should track duration from first to last above-threshold packet', () => {
      detector.feed(1, 20, 1000);
      detector.feed(1, 25, 1100);
      const results = detector.flush(1100 + SILENCE_GAP_MS + 1);
      expect(results).toHaveLength(1);
      expect(results[0].durationMs).toBe(100);
    });
  });

  describe('multiple devices', () => {
    it('should track each device independently', () => {
      detector.feed(1, 20, 1000);
      detector.feed(2, 30, 1005);
      expect(detector.getActiveCount()).toBe(2);

      const results = detector.flush(1005 + SILENCE_GAP_MS + 1);
      expect(results).toHaveLength(2);

      const dev1 = results.find(r => r.deviceId === 1);
      const dev2 = results.find(r => r.deviceId === 2);
      expect(dev1?.peakIntensity).toBe(20);
      expect(dev2?.peakIntensity).toBe(30);
    });

    it('should finalize devices at different times based on their last activity', () => {
      detector.feed(1, 20, 1000);
      detector.feed(2, 30, 1000 + SILENCE_GAP_MS); // device 2 later

      // Flush at time where only device 1's gap has elapsed
      const results1 = detector.flush(1000 + SILENCE_GAP_MS + 1);
      expect(results1).toHaveLength(1);
      expect(results1[0].deviceId).toBe(1);

      // Device 2 still active
      expect(detector.getActiveCount()).toBe(1);

      // Now flush device 2
      const results2 = detector.flush(1000 + 2 * SILENCE_GAP_MS + 1);
      expect(results2).toHaveLength(1);
      expect(results2[0].deviceId).toBe(2);
    });
  });

  describe('reset', () => {
    it('should clear all active impacts', () => {
      detector.feed(1, 20, 1000);
      detector.feed(2, 30, 1000);
      expect(detector.getActiveCount()).toBe(2);

      detector.reset();
      expect(detector.getActiveCount()).toBe(0);

      const results = detector.flush(2000);
      expect(results).toHaveLength(0);
    });
  });

  describe('max duration', () => {
    it('should force-finalize impact exceeding maxDurationMs during feed', () => {
      const det = new ImpactDetector({ maxDurationMs: 500 });
      det.feed(1, 20, 1000);
      // Feed again after max duration exceeded
      det.feed(1, 25, 1600);
      // The first impact should have been force-finalized
      const results = det.flush(1600 + SILENCE_GAP_MS + 1);
      // Should get 2 impacts: one force-finalized, one from the new feed
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.peakIntensity === 20)).toBe(true);
    });
  });

  describe('wizard mode', () => {
    it('should toggle wizard mode', () => {
      expect(detector.isWizardMode()).toBe(false);
      detector.setWizardMode(true);
      expect(detector.isWizardMode()).toBe(true);
      detector.setWizardMode(false);
      expect(detector.isWizardMode()).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update config at runtime', () => {
      detector.updateConfig({ noiseIntensityMin: 50 });
      detector.feed(1, 30, 1000); // below new noiseIntensityMin
      const results = detector.flush(2000);
      expect(results).toHaveLength(0);
    });
  });

  describe('diagnostics', () => {
    it('should track rejected count', () => {
      expect(detector.getRejectedCount()).toBe(0);
      detector.feed(1, 0, 1000); // intensity 0 < 1 → rejected
      expect(detector.getRejectedCount()).toBe(1);
      detector.feed(1, 0, 1100);
      expect(detector.getRejectedCount()).toBe(2);
    });

    it('should track last fed values', () => {
      detector.feed(2, 42, 1000);
      expect(detector.getLastFedIntensity()).toBe(42);
      expect(detector.getLastFedDeviceId()).toBe(2);
    });

    it('should return config snapshot', () => {
      const snap = detector.getConfigSnapshot();
      expect(snap.noiseIntensityMin).toBe(NOISE_INTENSITY_MIN);
      expect(snap.deltaStart).toBe(DEFAULT_DELTA_START);
      expect(snap.passThroughMode).toBe(false);
    });
  });

  describe('pass-through mode', () => {
    it('should create immediate finalized impact for every packet', () => {
      const det = new ImpactDetector({ passThroughMode: true });
      det.feed(1, 3, 1000); // would normally be filtered (3 < startThreshold=4)
      const results = det.flush(1001);
      expect(results).toHaveLength(1);
      expect(results[0].deviceId).toBe(1);
      expect(results[0].peakIntensity).toBe(3);
      expect(results[0].packetCount).toBe(1);
    });

    it('should bypass noiseIntensityMin filter', () => {
      const det = new ImpactDetector({ passThroughMode: true, noiseIntensityMin: 100 });
      det.feed(1, 5, 1000);
      const results = det.flush(1001);
      expect(results).toHaveLength(1);
      expect(det.getRejectedCount()).toBe(0); // not rejected in pass-through
    });

    it('can be toggled at runtime', () => {
      detector.updateConfig({ passThroughMode: true });
      detector.feed(1, 0, 1000); // even intensity 0 passes in pass-through
      const results = detector.flush(1001);
      expect(results).toHaveLength(1);
    });
  });
});
