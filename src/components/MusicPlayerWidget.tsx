import React from 'react';
import { SkipBack, Play, Pause, SkipForward, Volume2 } from 'lucide-react';
import type { UseMusicPlayerReturn } from '@/hooks/useMusicPlayer';

interface MusicPlayerWidgetProps {
  music: UseMusicPlayerReturn;
  hidden?: boolean;
}

export function MusicPlayerWidget({ music, hidden }: MusicPlayerWidgetProps) {
  if (!music.hasMusic || hidden) return null;

  const trackName = music.currentTrack?.title ?? 'Sem musica';
  const displayName = trackName.length > 28 ? trackName.slice(0, 28) + '...' : trackName;

  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 shadow-lg select-none"
      style={{ maxWidth: 280 }}
    >
      {/* Track name */}
      <span className="text-white/50 text-[11px] truncate min-w-0 flex-shrink" style={{ maxWidth: 90 }}>
        {displayName}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => music.prev()}
          className="p-1 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Musica anterior"
        >
          <SkipBack size={13} />
        </button>
        <button
          onClick={() => music.toggle()}
          className="p-1 text-white/60 hover:text-white transition-colors"
          aria-label={music.isPlaying ? 'Pausar' : 'Tocar'}
        >
          {music.isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          onClick={() => music.next()}
          className="p-1 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Proxima musica"
        >
          <SkipForward size={13} />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Volume2 size={12} className="text-white/30" />
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(music.volume * 100)}
          onChange={(e) => music.setVolume(parseInt(e.target.value, 10) / 100)}
          className="w-14 h-1 accent-rose-500 cursor-pointer"
          style={{ WebkitAppearance: 'none', background: 'linear-gradient(to right, #f43f5e, #f43f5e ' + (music.volume * 100) + '%, rgba(255,255,255,0.15) ' + (music.volume * 100) + '%)' }}
          aria-label="Volume da musica"
        />
      </div>
    </div>
  );
}
