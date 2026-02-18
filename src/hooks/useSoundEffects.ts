// Audio warm-up system v2
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
  | 'roundStart'
  | 'fightModeBg'
  | 'scoreBeep'
  | 'erro';

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
  roundStart: '/sounds/round-start.mp3',
  fightModeBg: '/sounds/fight-mode-bg.mp3',
  scoreBeep: '/sounds/score-beep.mp3',
  erro: '/sounds/erro.mp3',
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
  roundStart: 1,
  scoreBeep: 2,
  erro: 2,
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

    // Fase 1.5: Preload IMEDIATO dos sons mais críticos
    // Música de fundo PRIMEIRO - é o maior arquivo e precisa de mais tempo
    if (bgMusicAudio.current) {
      bgMusicAudio.current.preload = 'auto';
      bgMusicAudio.current.load();
    }

    const criticalPool = audioPool.current.get('hit');
    if (criticalPool?.[0]) {
      criticalPool[0].preload = 'auto';
      criticalPool[0].load();
    }
    
    const heavyPool = audioPool.current.get('hitHeavy');
    if (heavyPool?.[0]) {
      heavyPool[0].preload = 'auto';
      heavyPool[0].load();
    }

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

    // fightModeBg PRIMEIRO no batch crítico - é o maior arquivo
    const criticalSounds: SoundName[] = ['fightModeBg', 'hit', 'hitHeavy', 'countdown3'];
    
    const criticalAudios: HTMLAudioElement[] = [];
    const otherAudios: HTMLAudioElement[] = [];
    
    // Música de fundo primeiro
    if (bgMusicAudio.current) {
      criticalAudios.push(bgMusicAudio.current);
    }
    
    audioPool.current.forEach((pool, name) => {
      if (criticalSounds.includes(name) && name !== 'fightModeBg') {
        pool.forEach(a => criticalAudios.push(a));
      } else {
        pool.forEach(a => otherAudios.push(a));
      }
    });

    // Carregar críticos primeiro (música + hits + countdown), depois os outros
    const audios = [...criticalAudios, ...otherAudios];

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
    if (!pool || pool.length === 0) {
      console.warn(`[Sound] Pool not found for: ${name}`);
      return;
    }

    const poolSize = pool.length;
    let idx = (poolIndex.current.get(name) ?? 0) % poolSize;

    const picked = pickReadyInstance(pool, idx);
    const audio = picked.audio;
    const chosenIdx = picked.idx;

    // Log se nenhuma instância está pronta
    if (audio.readyState < 2) {
      console.debug(`[Sound] Playing ${name} with readyState=${audio.readyState} (may be silent)`);
    }

    poolIndex.current.set(name, (chosenIdx + 1) % poolSize);

    safeResetAudio(audio, volume);
    audio.play().catch((err) => {
      console.warn(`[Sound] Failed to play ${name}:`, err.message);
    });
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

  // Warm-up: force decode by playing at volume 0 then immediately pausing
  // Plain function (not a hook) — only uses refs, no need for useCallback
  const warmUpSounds = async (soundNames: SoundName[]): Promise<void> => {
    const promises = soundNames.map(async (name) => {
      let audio: HTMLAudioElement | null = null;

      if (name === BG_MUSIC_SOUND) {
        audio = bgMusicAudio.current;
      } else {
        const pool = audioPool.current.get(name);
        audio = pool?.[0] ?? null;
      }

      if (!audio) return;

      const originalVolume = audio.volume;
      audio.volume = 0;

      try {
        await audio.play();
        audio.pause();
        try { audio.currentTime = 0; } catch {}
      } catch (err) {
        // Autoplay blocked or other error — still reset
        console.debug(`[Audio] Warm-up play failed for ${name}:`, (err as Error).message);
      }

      audio.volume = originalVolume;

      if (isNaN(audio.duration)) {
        console.warn(`[Audio] Duration still NaN after warm-up for ${name}`);
      }
    });

    await Promise.all(promises);
  };

  // Wait for critical audio files to be ready (buffered + decoded)
  const waitForAudioReady = useCallback(async (
    requiredSounds: (typeof FALLBACK_PATHS extends Record<infer K, any> ? K : never)[] = ['fightModeBg', 'hit', 'hitHeavy', 'countdown3'],
    timeoutMs: number = 5000
  ): Promise<{ ready: boolean; progress: number }> => {
    // Ensure preload has started
    if (!preloadStarted.current) {
      initFullPreload();
    }

    const audiosToWait: HTMLAudioElement[] = [];
    const soundNamesTyped: SoundName[] = [];

    // Collect audio elements to wait for
    for (const name of requiredSounds) {
      if (name === 'fightModeBg') {
        if (bgMusicAudio.current) {
          audiosToWait.push(bgMusicAudio.current);
          soundNamesTyped.push(name as SoundName);
        }
      } else {
        const pool = audioPool.current.get(name as SoundName);
        if (pool?.[0]) {
          audiosToWait.push(pool[0]);
          soundNamesTyped.push(name as SoundName);
        }
      }
    }

    if (audiosToWait.length === 0) {
      return { ready: true, progress: 100 };
    }

    // Phase 1: Wait for readyState >= 3 AND valid duration
    const isAudioReady = (a: HTMLAudioElement) => a.readyState >= 3 && !isNaN(a.duration);

    const downloadReady = await new Promise<{ ready: boolean; progress: number }>((resolve) => {
      const startTime = Date.now();

      const check = () => {
        const readyCount = audiosToWait.filter(isAudioReady).length;
        const progress = Math.round((readyCount / audiosToWait.length) * 100);
        const allReady = readyCount === audiosToWait.length;
        const elapsed = Date.now() - startTime;

        if (allReady) {
          resolve({ ready: true, progress: 100 });
        } else if (elapsed >= timeoutMs) {
          // Smart retry for fightModeBg before giving up
          const bgAudio = bgMusicAudio.current;
          if (bgAudio && !isAudioReady(bgAudio)) {
            console.warn('[Audio] fightModeBg not ready after timeout, forcing reload...');
            bgAudio.load();
          }
          console.warn('[Audio] Timeout waiting for audio ready, proceeding with partial load');
          resolve({ ready: false, progress });
        } else {
          requestAnimationFrame(check);
        }
      };

      check();
    });

    // Phase 2: Warm-up — force decode into active memory
    try {
      await warmUpSounds(soundNamesTyped);
    } catch (err) {
      console.warn('[Audio] Warm-up phase failed:', err);
    }

    return downloadReady;
  }, [initFullPreload]);

  // Get current loading progress for UI feedback
  const getAudioProgress = useCallback((
    requiredSounds: (typeof FALLBACK_PATHS extends Record<infer K, any> ? K : never)[] = ['fightModeBg', 'hit', 'hitHeavy', 'countdown3']
  ): number => {
    const audiosToCheck: HTMLAudioElement[] = [];

    for (const name of requiredSounds) {
      if (name === 'fightModeBg') {
        if (bgMusicAudio.current) audiosToCheck.push(bgMusicAudio.current);
      } else {
        const pool = audioPool.current.get(name as SoundName);
        if (pool?.[0]) audiosToCheck.push(pool[0]);
      }
    }

    if (audiosToCheck.length === 0) return 100;

    const readyCount = audiosToCheck.filter(a => a.readyState >= 3).length;
    return Math.round((readyCount / audiosToCheck.length) * 100);
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
    waitForAudioReady,
    getAudioProgress,
    warmUpSounds,
  };
}

export type UseSoundEffectsReturn = ReturnType<typeof useSoundEffects>;
