/**
 * ImmersiveTitleBar — frameless window controls overlay
 *
 * Invisible by default. Slides down when the user moves the mouse near the top
 * edge of the screen. Provides minimize / maximize / close buttons and an app
 * reload shortcut, all styled to match the dark SPE Sulsport aesthetic.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Minus, Square, X, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

interface ElectronAPI {
  isElectron: boolean;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  toggleFullscreen: () => void;
  isFullscreen: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  reload: () => void;
}

function getElectronAPI(): ElectronAPI | null {
  const api = (window as any).electronAPI;
  return api?.isElectron ? api : null;
}

/** Pixel height of the hover-trigger zone at the top of the viewport */
const TRIGGER_ZONE = 16;
/** How long the bar stays visible after the mouse leaves (ms) */
const HIDE_DELAY = 2000;

export default function ImmersiveTitleBar() {
  const api = getElectronAPI();
  const [visible, setVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Query fullscreen state periodically while bar is visible
  useEffect(() => {
    if (!api) return;
    api.isFullscreen().then(setIsFullscreen);
  }, [visible]);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY);
  }, [clearHideTimer]);

  // Mouse-move listener: show bar when cursor is in the trigger zone
  useEffect(() => {
    if (!api) return;

    const onMove = (e: MouseEvent) => {
      if (e.clientY <= TRIGGER_ZONE) {
        clearHideTimer();
        setVisible(true);
      }
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [api, clearHideTimer]);

  // When bar appears, schedule auto-hide; cancel if mouse enters bar
  useEffect(() => {
    if (!visible) return;
    scheduleHide();
    return clearHideTimer;
  }, [visible, scheduleHide, clearHideTimer]);

  if (!api) return null;

  return (
    <div
      ref={barRef}
      onMouseEnter={clearHideTimer}
      onMouseLeave={scheduleHide}
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between select-none"
      style={{
        height: 40,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        transition: visible ? 'transform 250ms ease-out, opacity 200ms ease-out' : 'transform 400ms ease-in, opacity 400ms ease-in',
        background: 'linear-gradient(180deg, rgba(10,10,15,0.97) 0%, rgba(10,10,15,0.85) 100%)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        WebkitAppRegion: 'drag', // Allow dragging the window by the titlebar
      } as React.CSSProperties}
    >
      {/* Left — App label (draggable area) */}
      <div className="flex items-center gap-2 pl-4">
        <span className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase font-medium">
          SPE Sulsport
        </span>
      </div>

      {/* Right — Window controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Reload */}
        <button
          onClick={() => api.reload()}
          className="h-full px-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          title="Atualizar"
        >
          <RotateCw size={13} />
        </button>

        {/* Toggle fullscreen */}
        <button
          onClick={() => {
            api.toggleFullscreen();
            setTimeout(() => api.isFullscreen().then(setIsFullscreen), 200);
          }}
          className="h-full px-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>

        {/* Minimize */}
        <button
          onClick={() => api.minimize()}
          className="h-full px-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          title="Minimizar"
        >
          <Minus size={14} />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={() => api.maximize()}
          className="h-full px-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          title="Maximizar"
        >
          <Square size={12} />
        </button>

        {/* Close */}
        <button
          onClick={() => api.close()}
          className="h-full px-4 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-red-600/80 transition-colors"
          title="Fechar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
