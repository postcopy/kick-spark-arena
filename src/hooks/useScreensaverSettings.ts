import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sfight_screensaver_settings';

interface ScreensaverSettings {
  enabled: boolean;
  timeoutMinutes: number;
}

const DEFAULTS: ScreensaverSettings = {
  enabled: true,
  timeoutMinutes: 5,
};

function readSettings(): ScreensaverSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULTS.enabled,
      timeoutMinutes: typeof parsed.timeoutMinutes === 'number' && parsed.timeoutMinutes > 0
        ? parsed.timeoutMinutes
        : DEFAULTS.timeoutMinutes,
    };
  } catch {
    return DEFAULTS;
  }
}

function writeSettings(settings: ScreensaverSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useScreensaverSettings() {
  const [settings, setSettings] = useState<ScreensaverSettings>(readSettings);

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, enabled };
      writeSettings(next);
      return next;
    });
  }, []);

  const setTimeoutMinutes = useCallback((timeoutMinutes: number) => {
    setSettings((prev) => {
      const next = { ...prev, timeoutMinutes };
      writeSettings(next);
      return next;
    });
  }, []);

  return {
    enabled: settings.enabled,
    timeoutMinutes: settings.timeoutMinutes,
    setEnabled,
    setTimeoutMinutes,
  };
}
