import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  | 'victory'
  | 'victoryRed'
  | 'victoryBlue'
  | 'fightModeBg';

// Map sound names to filenames
const SOUND_FILENAMES: Record<SoundName, string> = {
  hit: 'hit.mp3',
  hitHeavy: 'hit-heavy.mp3',
  combo: 'combo.mp3',
  specialReady: 'special-ready.mp3',
  specialAttack: 'special-attack.mp3',
  ko: 'ko.mp3',
  countdown3: 'countdown-3.mp3',
  countdown2: 'countdown-2.mp3',
  countdown1: 'countdown-1.mp3',
  countdownGo: 'countdown-go.mp3',
  timeUp: 'time-up.mp3',
  victory: 'victory.mp3',
  victoryRed: 'victory-red.mp3',
  victoryBlue: 'victory-blue.mp3',
  fightModeBg: 'fight-mode-bg.mp3',
};

// Fallback to public/sounds/ if not in Storage
const FALLBACK_PATHS: Record<SoundName, string> = {
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
  victoryRed: '/sounds/victory-red.mp3',
  victoryBlue: '/sounds/victory-blue.mp3',
  fightModeBg: '/sounds/fight-mode-bg.mp3',
};

const STORAGE_KEY = 'kickcounter_soundMuted';

export function useSoundEffects() {
  const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const soundUrls = useRef<Map<SoundName, string>>(new Map());
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(0.7);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sounds from Storage with fallback to public/sounds/
  useEffect(() => {
    const loadSounds = async () => {
      const entries = Object.entries(SOUND_FILENAMES) as [SoundName, string][];
      
      // Check which sounds exist in Storage
      const { data: files } = await supabase.storage.from('sounds').list('', { limit: 100 });
      const storedFiles = new Set(files?.map(f => f.name) || []);

      for (const [name, filename] of entries) {
        let url: string;
        
        if (storedFiles.has(filename)) {
          // Use Storage URL
          const { data } = supabase.storage.from('sounds').getPublicUrl(filename);
          url = data.publicUrl;
        } else {
          // Fallback to public/sounds/
          url = FALLBACK_PATHS[name];
        }

        soundUrls.current.set(name, url);
        
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = volume;
        audioCache.current.set(name, audio);
      }

      setIsLoaded(true);
    };

    loadSounds();

    return () => {
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
      soundUrls.current.clear();
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

  // Play a sound and return the audio element reference (for stopping later)
  const playWithRef = useCallback((name: SoundName, volumeMultiplier = 1): HTMLAudioElement | null => {
    if (isMuted) return null;

    const cachedAudio = audioCache.current.get(name);
    if (cachedAudio) {
      const audio = cachedAudio.cloneNode() as HTMLAudioElement;
      audio.volume = volume * volumeMultiplier;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
      return audio;
    }
    return null;
  }, [isMuted, volume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Reload sounds from Storage (useful after generating new sounds)
  const reloadSounds = useCallback(async () => {
    const entries = Object.entries(SOUND_FILENAMES) as [SoundName, string][];
    const { data: files } = await supabase.storage.from('sounds').list('', { limit: 100 });
    const storedFiles = new Set(files?.map(f => f.name) || []);

    for (const [name, filename] of entries) {
      let url: string;
      
      if (storedFiles.has(filename)) {
        const { data } = supabase.storage.from('sounds').getPublicUrl(filename);
        url = data.publicUrl;
      } else {
        url = FALLBACK_PATHS[name];
      }

      // Only update if URL changed
      if (soundUrls.current.get(name) !== url) {
        soundUrls.current.set(name, url);
        
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = volume;
        audioCache.current.set(name, audio);
      }
    }
  }, [volume]);

  return {
    play,
    playWithRef,
    isMuted,
    toggleMute,
    setMuted: setIsMuted,
    volume,
    setVolume,
    isLoaded,
    reloadSounds,
  };
}

export type UseSoundEffectsReturn = ReturnType<typeof useSoundEffects>;
