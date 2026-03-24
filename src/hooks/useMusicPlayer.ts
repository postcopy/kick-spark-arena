import { useState, useEffect, useCallback } from 'react';
import { getMusicPlayer } from '@/lib/musicPlayer';
import type { MusicTrack } from '@/lib/musicPlayer';

export interface UseMusicPlayerReturn {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  hasMusic: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  fadeToVolume: (target: number, durationMs: number) => void;
  mute: () => void;
  unmute: () => void;
}

export function useMusicPlayer(): UseMusicPlayerReturn {
  const player = getMusicPlayer();
  const [, forceUpdate] = useState(0);

  // Subscribe to player state changes
  useEffect(() => {
    return player.subscribe(() => forceUpdate((n) => n + 1));
  }, [player]);

  return {
    currentTrack: player.currentTrack,
    isPlaying: player.isPlaying,
    volume: player.volume,
    hasMusic: player.hasMusic,
    play: useCallback(() => player.play(), [player]),
    pause: useCallback(() => player.pause(), [player]),
    toggle: useCallback(() => player.toggle(), [player]),
    next: useCallback(() => player.next(), [player]),
    prev: useCallback(() => player.prev(), [player]),
    setVolume: useCallback((v: number) => player.setVolume(v), [player]),
    fadeToVolume: useCallback((t: number, d: number) => player.fadeToVolume(t, d), [player]),
    mute: useCallback(() => player.mute(), [player]),
    unmute: useCallback(() => player.unmute(), [player]),
  };
}
