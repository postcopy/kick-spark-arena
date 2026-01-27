// @refresh reset - Force full reload on HMR to avoid React state corruption
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
  | 'victory'
  | 'victoryRed'
  | 'victoryBlue'
  | 'fightModeBg';

// Fallback to public/sounds/
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

// ================================
// Pool calibrado por frequência
// ================================
const POOL_SIZES: Partial<Record<SoundName, number>> = {
  hit: 3,
  hitHeavy: 3,
  combo: 3,
  countdown3: 2,
  countdown2: 2,
  countdown1: 2,
  countdownGo: 2,
  specialReady: 2,
  specialAttack: 2,
  ko: 1,
  timeUp: 1,
  victory: 1,
  victoryRed: 1,
  victoryBlue: 1,
};

// Evitar 404 (victory-red/blue inexistentes)
const SOUND_URL_OVERRIDES: Partial<Record<SoundName, string>> = {
  victoryRed: '/sounds/victory.mp3',
  victoryBlue: '/sounds/victory.mp3',
};

// Música de fundo fora do pool
const BG_MUSIC_SOUND: SoundName = 'fightModeBg';

function safeResetAudio(a: HTMLAudioElement, volume: number) {
  a.pause();
  try { a.currentTime = 0; } catch {}
  a.muted = false;
  a.playbackRate = 1;
  a.volume = volume;
}

function pickReadyInstance(pool: HTMLAudioElement[], startIdx: number) {
  const n = pool.length;
  const cur = pool[startIdx];

  if (cur.readyState >= 2) return { audio: cur, idx: startIdx };

  for (let i = 0; i < n; i++) {
    const idx = (startIdx + i) % n;
    const cand = pool[idx];
    if (cand.readyState >= 2) return { audio: cand, idx };
  }

  return { audio: cur, idx: startIdx };
}

export function useSoundEffects() {
  const audioPool = useRef<Map<SoundName, HTMLAudioElement[]>>(new Map());
  const poolIndex = useRef<Map<SoundName, number>>(new Map());
  const soundUrls = useRef<Map<SoundName, string>>(new Map());

  const isUnlocked = useRef(false);
  const preloadStarted = useRef(false);
  const bgMusicAudio = useRef<HTMLAudioElement | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [volume, setVolume] = useState(0.7);

  const toggleMute = useCallback(() => setIsMuted(v => !v), []);

  // Save mute state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isMuted));
    } catch {
      // Ignore storage errors
    }
  }, [isMuted]);

  useEffect(() => {
    // Fase 1: cria instâncias sem load (preload none)
    audioPool.current.clear();
    poolIndex.current.clear();
    soundUrls.current.clear();

    const entries = Object.entries(POOL_SIZES) as [SoundName, number][];

    for (const [name, poolSize] of entries) {
      const url = SOUND_URL_OVERRIDES[name] ?? FALLBACK_PATHS[name];
      soundUrls.current.set(name, url);

      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < poolSize; i++) {
        const a = new Audio(url);
        a.preload = 'none';
        (a as any).playsInline = true;

        // listeners readiness (ajuda debug e pipeline)
        a.addEventListener('canplaythrough', () => {}, { once: true });
        a.addEventListener('canplay', () => {}, { once: true });
        a.addEventListener('loadeddata', () => {}, { once: true });

        a.volume = volume;
        pool.push(a);
      }

      audioPool.current.set(name, pool);
      poolIndex.current.set(name, 0);
    }

    // bg music criada na fase 1 para entrar no preload full
    const bgUrl = FALLBACK_PATHS[BG_MUSIC_SOUND];
    soundUrls.current.set(BG_MUSIC_SOUND, bgUrl);

    const bg = new Audio(bgUrl);
    bg.preload = 'none';
    (bg as any).playsInline = true;
    bg.addEventListener('canplaythrough', () => {}, { once: true });
    bg.addEventListener('canplay', () => {}, { once: true });
    bg.addEventListener('loadeddata', () => {}, { once: true });
    bg.volume = volume;
    bgMusicAudio.current = bg;

    setIsLoaded(true);

    return () => {
      // cleanup correto: removeAttribute('src') + load()
      audioPool.current.forEach(pool => {
        pool.forEach(a => {
          a.pause();
          a.removeAttribute('src');
          a.load();
        });
      });
      audioPool.current.clear();
      poolIndex.current.clear();
      soundUrls.current.clear();

      if (bgMusicAudio.current) {
        bgMusicAudio.current.pause();
        bgMusicAudio.current.removeAttribute('src');
        bgMusicAudio.current.load();
        bgMusicAudio.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // atualizar volume em tudo
  useEffect(() => {
    audioPool.current.forEach(pool => pool.forEach(a => (a.volume = volume)));
    if (bgMusicAudio.current) bgMusicAudio.current.volume = volume;
  }, [volume]);

  // se mutar, para bg
  useEffect(() => {
    if (isMuted && bgMusicAudio.current) bgMusicAudio.current.pause();
  }, [isMuted]);

  const unlockAudio = useCallback(() => {
    if (isUnlocked.current) return;
    isUnlocked.current = true;

    const firstPool = audioPool.current.values().next().value as HTMLAudioElement[] | undefined;
    const firstAudio = firstPool?.[0];
    if (!firstAudio) return;

    firstAudio.muted = true;
    firstAudio.play()
      .then(() => {
        firstAudio.pause();
        try { firstAudio.currentTime = 0; } catch {}
        firstAudio.muted = false;
      })
      .catch(() => {
        firstAudio.muted = false;
      });
  }, []);

  const initFullPreload = useCallback(() => {
    if (preloadStarted.current) return;
    preloadStarted.current = true;

    const audios: HTMLAudioElement[] = [];
    audioPool.current.forEach(pool => pool.forEach(a => audios.push(a)));
    if (bgMusicAudio.current) audios.push(bgMusicAudio.current);

    let i = 0;
    const BATCH_SIZE = 4;

    const loadBatch = () => {
      const end = Math.min(i + BATCH_SIZE, audios.length);
      for (; i < end; i++) {
        const a = audios[i];
        a.preload = 'auto';
        a.load();
      }

      if (i < audios.length) {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(loadBatch);
        } else {
          setTimeout(loadBatch, 0);
        }
      }
    };

    loadBatch();
  }, []);

  const play = useCallback((name: SoundName) => {
    if (isMuted) return;

    const pool = audioPool.current.get(name);
    if (!pool || pool.length === 0) return;

    const poolSize = pool.length;
    let idx = (poolIndex.current.get(name) ?? 0) % poolSize;

    const picked = pickReadyInstance(pool, idx);
    const audio = picked.audio;
    const chosenIdx = picked.idx;

    poolIndex.current.set(name, (chosenIdx + 1) % poolSize);

    safeResetAudio(audio, volume);
    audio.play().catch(() => {});
  }, [isMuted, volume]);

  const playWithRef = useCallback((name: SoundName, volumeMultiplier = 1): HTMLAudioElement | null => {
    if (isMuted) return null;

    if (name === BG_MUSIC_SOUND) {
      const bg = bgMusicAudio.current;
      if (!bg) return null;

      safeResetAudio(bg, volume * volumeMultiplier);
      bg.play().catch(() => {});
      return bg;
    }

    const pool = audioPool.current.get(name);
    if (!pool || pool.length === 0) return null;

    const poolSize = pool.length;
    let idx = (poolIndex.current.get(name) ?? 0) % poolSize;

    const picked = pickReadyInstance(pool, idx);
    const audio = picked.audio;
    const chosenIdx = picked.idx;

    poolIndex.current.set(name, (chosenIdx + 1) % poolSize);

    safeResetAudio(audio, volume * volumeMultiplier);
    audio.play().catch(() => {});
    return audio;
  }, [isMuted, volume]);

  const reloadSounds = useCallback(() => {
    isUnlocked.current = false;
    preloadStarted.current = false;
    setIsLoaded(false);
    // Recarregar a página/rota geralmente é suficiente
    setIsLoaded(true);
  }, []);

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
    unlockAudio,
    initFullPreload,
  };
}

export type UseSoundEffectsReturn = ReturnType<typeof useSoundEffects>;
