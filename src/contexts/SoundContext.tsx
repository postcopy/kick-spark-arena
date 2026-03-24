import { createContext, useContext, ReactNode, useCallback, useState } from 'react';
import { useSoundEffects, UseSoundEffectsReturn } from '@/hooks/useSoundEffects';

// Stub that does nothing — used when sound system fails to init
const SOUND_STUB: UseSoundEffectsReturn = {
  play: () => {},
  playWithRef: () => null,
  isMuted: false,
  toggleMute: () => {},
  setMuted: () => {},
  volume: 0.7,
  setVolume: () => {},
  isLoaded: true,
  reloadSounds: () => {},
  unlockAudio: () => {},
  initFullPreload: () => {},
  waitForAudioReady: async () => ({ ready: true, progress: 100 }),
  getAudioProgress: () => 100,
  warmUpSounds: async () => {},
};

const SoundContext = createContext<UseSoundEffectsReturn | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  // Hook called unconditionally (React Rules of Hooks).
  // useSoundEffects() is internally crash-proof — all Audio operations
  // are wrapped in try/catch. It never throws during render.
  const soundEffects = useSoundEffects();

  return (
    <SoundContext.Provider value={soundEffects}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // Instead of throwing, return stub — prevents crash in components
    console.warn('useSound called outside SoundProvider — returning stub');
    return SOUND_STUB;
  }
  return context;
}
