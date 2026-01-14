import { useCallback, useEffect, useRef, useState } from 'react';

type SoundName = 
  | 'hit'
  | 'hitHeavy'
  | 'combo'
  | 'specialReady'
  | 'specialAttack'
  | 'ko'
  | 'countdown3'
  | 'countdown2'
  | 'countdown1'
  | 'countdownGo'
  | 'timeUp'
  | 'victory';

const SOUND_FILES: Record<SoundName, string> = {
  hit: '/sounds/hit.mp3',
  hitHeavy: '/sounds/hit-heavy.mp3',
  combo: '/sounds/combo.mp3',
  specialReady: '/sounds/special-ready.mp3',
  specialAttack: '/sounds/special-attack.mp3',
  ko: '/sounds/ko.mp3',
  countdown3: '/sounds/countdown-3.mp3',
  countdown2: '/sounds/countdown-2.mp3',
  countdown1: '/sounds/countdown-1.mp3',
  countdownGo: '/sounds/countdown-go.mp3',
  timeUp: '/sounds/time-up.mp3',
  victory: '/sounds/victory.mp3',
};

const STORAGE_KEY = 'kickcounter_soundMuted';

export function useSoundEffects() {
  const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(0.7);

  // Preload all sounds
  useEffect(() => {
    const entries = Object.entries(SOUND_FILES) as [SoundName, string][];
    
    entries.forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = volume;
      audioCache.current.set(name, audio);
    });

    return () => {
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
    };
  }, []);

  // Update volume for all cached audio
  useEffect(() => {
    audioCache.current.forEach(audio => {
      audio.volume = volume;
    });
  }, [volume]);

  // Save mute state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isMuted));
    } catch {
      // Ignore storage errors
    }
  }, [isMuted]);

  const play = useCallback((name: SoundName) => {
    if (isMuted) return;

    const cachedAudio = audioCache.current.get(name);
    if (cachedAudio) {
      // Clone the audio to allow overlapping sounds
      const audio = cachedAudio.cloneNode() as HTMLAudioElement;
      audio.volume = volume;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [isMuted, volume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    play,
    isMuted,
    toggleMute,
    setMuted: setIsMuted,
    volume,
    setVolume,
  };
}

export type UseSoundEffectsReturn = ReturnType<typeof useSoundEffects>;
