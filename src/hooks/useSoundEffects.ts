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
  | 'bgTimeAttack'
  | 'bgArcade'
  | 'bgReaction'
  | 'scoreBeep'
  | 'erro';

// Fallback to public/sounds/ (relative paths for Electron file:// compatibility)
const FALLBACK_PATHS: Record<SoundName, string> = {
  hit: './sounds/hit.wav',
  hitHeavy: './sounds/hit-heavy.wav',
  combo: './sounds/combo.wav',
  specialReady: './sounds/special-ready.wav',
  specialAttack: './sounds/special-attack.wav',
  ko: './sounds/ko.wav',
  countdown3: './sounds/countdown-3.wav',
  countdown2: './sounds/countdown-2.wav',
  countdown1: './sounds/countdown-1.wav',
  countdownGo: './sounds/countdown-go.wav',
  timeUp: './sounds/time-up.wav',
  victory: './sounds/victory.wav',
  victoryRed: './sounds/victory-red.wav',
  victoryBlue: './sounds/victory-blue.wav',
  roundStart: './sounds/round-start.wav',
  fightModeBg: './sounds/bg-arcade.mp3',
  bgTimeAttack: './sounds/bg-time-attack.mp3',
  bgArcade: './sounds/bg-arcade.mp3',
  bgReaction: './sounds/bg-reaction.mp3',
  scoreBeep: './sounds/score-beep.wav',
  erro: './sounds/erro.wav',
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
  victoryRed: './sounds/victory.wav',
  victoryBlue: './sounds/victory.wav',
};

// Músicas de fundo (fora do pool de SFX)
const BG_MUSIC_SOUNDS: Set<SoundName> = new Set(['fightModeBg', 'bgTimeAttack', 'bgArcade', 'bgReaction']);

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
  const bgMusicAudios = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
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

    // bg music tracks criadas na fase 1 para entrar no preload full
    bgMusicAudios.current.clear();
    for (const bgName of BG_MUSIC_SOUNDS) {
      const bgUrl = FALLBACK_PATHS[bgName];
      soundUrls.current.set(bgName, bgUrl);

      const bg = new Audio(bgUrl);
      bg.preload = 'none';
      bg.loop = true;
      (bg as any).playsInline = true;
      bg.addEventListener('canplaythrough', () => {}, { once: true });
      bg.addEventListener('canplay', () => {}, { once: true });
      bg.addEventListener('loadeddata', () => {}, { once: true });
      bg.volume = volume;
      bgMusicAudios.current.set(bgName, bg);
    }
    // Legacy alias
    bgMusicAudio.current = bgMusicAudios.current.get('fightModeBg') ?? null;

    // Fase 1.5: Preload IMEDIATO dos sons mais críticos
    // Música de fundo PRIMEIRO - são os maiores arquivos
    for (const bgAudio of bgMusicAudios.current.values()) {
      bgAudio.preload = 'auto';
      bgAudio.load();
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

      bgMusicAudios.current.forEach(a => {
        a.pause();
        a.removeAttribute('src');
        a.load();
      });
      bgMusicAudios.current.clear();
      bgMusicAudio.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // atualizar volume em tudo
  useEffect(() => {
    audioPool.current.forEach(pool => pool.forEach(a => (a.volume = volume)));
    bgMusicAudios.current.forEach(a => (a.volume = volume));
  }, [volume]);

  // se mutar, para todas as bg musics
  useEffect(() => {
    if (isMuted) bgMusicAudios.current.forEach(a => a.pause());
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

    // BG music tracks + critical SFX first
    const criticalSfx: SoundName[] = ['hit', 'hitHeavy', 'countdown3'];

    const criticalAudios: HTMLAudioElement[] = [];
    const otherAudios: HTMLAudioElement[] = [];

    // All background music tracks first
    bgMusicAudios.current.forEach(a => criticalAudios.push(a));

    audioPool.current.forEach((pool, name) => {
      if (criticalSfx.includes(name)) {
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

    if (BG_MUSIC_SOUNDS.has(name)) {
      const bg = bgMusicAudios.current.get(name);
      if (!bg) return null;

      safeResetAudio(bg, 0); // Start at 0 for fade-in
      bg.loop = true;

      const targetVol = volume * volumeMultiplier;
      bg.play().then(() => {
        // Professional fade-in: ramp from 0 to target over ~1.5s
        const FADE_IN_MS = 1500;
        const FADE_STEP = 50;
        const steps = FADE_IN_MS / FADE_STEP;
        let step = 0;
        const fadeIn = window.setInterval(() => {
          step++;
          // Ease-in curve (quadratic) for smooth ramp
          const t = Math.min(step / steps, 1);
          bg.volume = targetVol * t * t;
          if (step >= steps) {
            window.clearInterval(fadeIn);
            bg.volume = targetVol;
          }
        }, FADE_STEP);
      }).catch(() => {});
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

      if (BG_MUSIC_SOUNDS.has(name)) {
        audio = bgMusicAudios.current.get(name) ?? null;
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
      if (BG_MUSIC_SOUNDS.has(name as SoundName)) {
        const bgAudio = bgMusicAudios.current.get(name as SoundName);
        if (bgAudio) {
          audiosToWait.push(bgAudio);
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
          // Smart retry for bg music before giving up
          bgMusicAudios.current.forEach((bgA, bgName) => {
            if (!isAudioReady(bgA)) {
              console.warn(`[Audio] ${bgName} not ready after timeout, forcing reload...`);
              bgA.load();
            }
          });
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
      if (BG_MUSIC_SOUNDS.has(name as SoundName)) {
        const bgA = bgMusicAudios.current.get(name as SoundName);
        if (bgA) audiosToCheck.push(bgA);
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
