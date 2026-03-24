// ─── Ambient Music Player for S-FIGHT PRO ───
// Independent from SFX system. Uses a single Audio element for bg music.
// Shuffles playlist, auto-advances, supports fade transitions.

const STORAGE_KEY = 'sfight_music_volume';
const STORAGE_TRACK_KEY = 'sfight_music_track';

export interface MusicTrack {
  file: string;
  title: string;
}

// Manifest — add entries here when adding music to public/music/
// The app reads this list, NOT the filesystem.
export const MUSIC_MANIFEST: MusicTrack[] = [
  { file: './music/sfight-321-fight.mp3', title: 'S-Fight: 3, 2, 1, Fight!' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class MusicPlayer {
  private audio: HTMLAudioElement;
  private playlist: MusicTrack[] = [];
  private currentIndex = 0;
  private baseVolume: number;
  private volumeMultiplier = 1;
  private fadeRaf: number | null = null;
  private _isPlaying = false;
  private listeners = new Set<() => void>();

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    (this.audio as any).playsInline = true;

    // Load saved volume
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.baseVolume = saved ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.5;
    } catch {
      this.baseVolume = 0.5;
    }
    this.audio.volume = this.baseVolume;

    // Auto-advance when track ends
    this.audio.addEventListener('ended', () => {
      this.next();
    });

    // Handle load errors — skip to next
    this.audio.addEventListener('error', () => {
      console.warn(`[MusicPlayer] Failed to load: ${this.currentTrack?.title}`);
      if (this.playlist.length > 1) {
        setTimeout(() => this.next(), 500);
      }
    });

    // Shuffle playlist
    this.reshufflePlaylist();
  }

  private reshufflePlaylist() {
    if (MUSIC_MANIFEST.length === 0) {
      this.playlist = [];
      return;
    }
    this.playlist = shuffle(MUSIC_MANIFEST);
    this.currentIndex = 0;
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  get currentTrack(): MusicTrack | null {
    if (this.playlist.length === 0) return null;
    return this.playlist[this.currentIndex] ?? null;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get volume(): number {
    return this.baseVolume;
  }

  get hasMusic(): boolean {
    return MUSIC_MANIFEST.length > 0;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private loadCurrent() {
    const track = this.currentTrack;
    if (!track) return;
    this.audio.src = track.file;
    this.audio.load();
    // Save current track
    try {
      localStorage.setItem(STORAGE_TRACK_KEY, track.file);
    } catch {}
  }

  play() {
    if (this.playlist.length === 0) return;
    if (!this.audio.src || this.audio.src === '') {
      this.loadCurrent();
    }
    this.audio.volume = this.baseVolume * this.volumeMultiplier;
    this.audio.play().catch(() => {});
    this._isPlaying = true;
    this.notify();
  }

  pause() {
    this.audio.pause();
    this._isPlaying = false;
    this.notify();
  }

  toggle() {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  next() {
    if (this.playlist.length === 0) return;
    this.currentIndex++;
    if (this.currentIndex >= this.playlist.length) {
      this.reshufflePlaylist();
    }
    this.loadCurrent();
    if (this._isPlaying) {
      this.audio.play().catch(() => {});
    }
    this.notify();
  }

  prev() {
    if (this.playlist.length === 0) return;
    // If more than 3s into track, restart it. Otherwise go to previous.
    if (this.audio.currentTime > 3) {
      try { this.audio.currentTime = 0; } catch {}
      return;
    }
    this.currentIndex = this.currentIndex > 0
      ? this.currentIndex - 1
      : this.playlist.length - 1;
    this.loadCurrent();
    if (this._isPlaying) {
      this.audio.play().catch(() => {});
    }
    this.notify();
  }

  setVolume(v: number) {
    this.baseVolume = Math.max(0, Math.min(1, v));
    this.audio.volume = this.baseVolume * this.volumeMultiplier;
    try {
      localStorage.setItem(STORAGE_KEY, String(this.baseVolume));
    } catch {}
    this.notify();
  }

  /** Smoothly fade the volume multiplier to a target (0-1) over durationMs */
  fadeToVolume(targetMultiplier: number, durationMs: number) {
    if (this.fadeRaf !== null) {
      cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = null;
    }

    const startMult = this.volumeMultiplier;
    const diff = targetMultiplier - startMult;
    if (Math.abs(diff) < 0.01) {
      this.volumeMultiplier = targetMultiplier;
      this.audio.volume = this.baseVolume * this.volumeMultiplier;
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / durationMs, 1);
      // Ease-in-out curve
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.volumeMultiplier = startMult + diff * eased;
      this.audio.volume = Math.max(0, Math.min(1, this.baseVolume * this.volumeMultiplier));

      if (t < 1) {
        this.fadeRaf = requestAnimationFrame(step);
      } else {
        this.fadeRaf = null;
        this.volumeMultiplier = targetMultiplier;
        this.audio.volume = Math.max(0, Math.min(1, this.baseVolume * this.volumeMultiplier));
      }
    };

    this.fadeRaf = requestAnimationFrame(step);
  }

  /** Mute completely (for when game mode has its own music) */
  mute() {
    this.fadeToVolume(0, 500);
  }

  /** Restore to full volume */
  unmute() {
    this.fadeToVolume(1, 1000);
  }

  destroy() {
    if (this.fadeRaf !== null) {
      cancelAnimationFrame(this.fadeRaf);
    }
    this.audio.pause();
    this.audio.src = '';
    this.listeners.clear();
  }
}

// Singleton instance — survives React remounts
let _instance: MusicPlayer | null = null;

export function getMusicPlayer(): MusicPlayer {
  if (!_instance) {
    _instance = new MusicPlayer();
  }
  return _instance;
}
