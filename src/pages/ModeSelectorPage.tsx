// Mode Selector — SPE Sulsport Home
// EA-style cinematic intro with sound → premium mode selector

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSpe from '@/assets/logo-spe-branca.png';
import openingSound from '@/assets/opening-9sec.mp3';

type Phase = 'black' | 'logo-in' | 'tagline' | 'flash' | 'menu';

export default function ModeSelectorPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('black');
  const [skipTransition, setSkipTransition] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Skip intro on click/key during animation
  const skipIntro = useCallback(() => {
    if (phase === 'menu') return;
    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSkipTransition(true);
    setPhase('menu');
    sessionStorage.setItem('spe_intro_done', '1');
  }, [phase]);

  useEffect(() => {
    // Check if intro was already shown this session
    if (sessionStorage.getItem('spe_intro_done')) {
      setSkipTransition(true);
      setPhase('menu');
      return;
    }

    // Play opening sound
    const audio = new Audio(openingSound);
    audio.volume = 0.7;
    audioRef.current = audio;
    audio.play().catch(() => {
      // Autoplay blocked — continue silently
    });

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase sequence synced to ~9s audio:
    // 0ms      → black (silence builds)
    // 800ms    → logo-in (logo fades in with ambient glow)
    // 3500ms   → tagline (text + light streak)
    // 7200ms   → flash (bright flash transition)
    // 8200ms   → menu (cards slide in, audio ends ~9s)
    timers.push(setTimeout(() => setPhase('logo-in'), 800));
    timers.push(setTimeout(() => setPhase('tagline'), 3500));
    timers.push(setTimeout(() => setPhase('flash'), 7200));
    timers.push(setTimeout(() => {
      setPhase('menu');
      sessionStorage.setItem('spe_intro_done', '1');
    }, 8200));

    return () => {
      timers.forEach(clearTimeout);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  // Listen for skip events
  useEffect(() => {
    const handler = () => skipIntro();
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [skipIntro]);

  const isIntro = phase !== 'menu';

  return (
    <div className="min-h-screen bg-[#030305] flex flex-col relative overflow-hidden select-none">

      {/* ═══════════════════════════════════════════════ */}
      {/* INTRO CINEMATIC OVERLAY                        */}
      {/* ═══════════════════════════════════════════════ */}
      {isIntro && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030305]">
          {/* Ambient radial light behind logo */}
          <div
            className="absolute transition-all duration-[2500ms] ease-out"
            style={{
              width: 700,
              height: 700,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(225,29,72,0.10) 0%, rgba(225,29,72,0.04) 40%, transparent 70%)',
              opacity: phase === 'logo-in' || phase === 'tagline' ? 1 : 0,
              transform: phase === 'tagline' ? 'scale(1.4)' : 'scale(0.7)',
            }}
          />

          {/* Secondary warm glow */}
          <div
            className="absolute transition-all duration-[3000ms] ease-out"
            style={{
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(180,140,40,0.06) 0%, transparent 60%)',
              opacity: phase === 'tagline' ? 1 : 0,
              transform: phase === 'tagline' ? 'scale(1.2) translateY(-20px)' : 'scale(0.5)',
            }}
          />

          {/* Horizontal light streak */}
          <div
            className="absolute h-[1px] transition-all ease-out"
            style={{
              width: phase === 'tagline' || phase === 'flash' ? 600 : 0,
              background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.4), rgba(255,255,255,0.7), rgba(225,29,72,0.4), transparent)',
              opacity: phase === 'flash' ? 0 : 0.8,
              transitionDuration: phase === 'flash' ? '400ms' : '1800ms',
            }}
          />

          {/* Logo */}
          <div className="relative flex flex-col items-center">
            <img
              src={logoSpe}
              alt="SPE Sulsport"
              className="relative"
              style={{
                height: 80,
                willChange: 'transform, opacity',
                opacity: phase === 'black' ? 0 : phase === 'flash' ? 0 : 1,
                transform:
                  phase === 'black' ? 'scale(0.6) translateY(15px)' :
                  phase === 'logo-in' ? 'scale(1) translateY(0)' :
                  phase === 'tagline' ? 'scale(1.04) translateY(0)' :
                  'scale(1.15) translateY(0)',
                transition: `opacity ${phase === 'flash' ? '400ms' : '1800ms'} ease-out, transform ${phase === 'flash' ? '400ms' : '1800ms'} ease-out`,
              }}
            />
            {/* Glow effect behind logo (separate element to avoid filter jitter) */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(225,29,72,0.35) 0%, rgba(225,29,72,0.12) 40%, transparent 70%)',
                opacity: phase === 'tagline' ? 1 : phase === 'logo-in' ? 0.3 : 0,
                transform: phase === 'tagline' ? 'scale(1.5)' : 'scale(0.8)',
                transition: `opacity ${phase === 'flash' ? '400ms' : '2000ms'} ease-out, transform ${phase === 'flash' ? '400ms' : '2000ms'} ease-out`,
                willChange: 'transform, opacity',
              }}
            />

            {/* Tagline reveal */}
            <div
              className="mt-7 flex items-center gap-4 transition-all ease-out"
              style={{
                opacity: phase === 'tagline' ? 1 : 0,
                transform: phase === 'tagline' ? 'translateY(0)' : 'translateY(10px)',
                transitionDuration: '1000ms',
                transitionDelay: phase === 'tagline' ? '300ms' : '0ms',
              }}
            >
              <div className="w-14 h-px bg-gradient-to-r from-transparent to-white/25" />
              <span className="text-sm text-white/50 tracking-[0.5em] uppercase font-light">
                Eventos Profissionais
              </span>
              <div className="w-14 h-px bg-gradient-to-l from-transparent to-white/25" />
            </div>
          </div>

          {/* Flash overlay */}
          <div
            className="absolute inset-0 bg-white pointer-events-none transition-opacity"
            style={{
              opacity: phase === 'flash' ? 0.08 : 0,
              transitionDuration: '500ms',
            }}
          />

          {/* Skip hint */}
          <div
            className="absolute bottom-8 transition-opacity duration-[1500ms]"
            style={{ opacity: phase === 'tagline' ? 0.35 : 0 }}
          >
            <span className="text-xs text-zinc-500 tracking-[0.3em] uppercase">
              Pressione para continuar
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* MAIN MENU (fades in after intro)               */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,40,0.12),transparent)]" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Content — slides up into view */}
      <div
        className="relative z-10 flex flex-col items-center justify-center flex-1 px-6"
        style={{
          opacity: phase === 'menu' ? 1 : 0,
          transform: phase === 'menu' ? 'translateY(0)' : 'translateY(30px)',
          transition: skipTransition ? 'none' : 'opacity 800ms ease-out, transform 800ms ease-out',
        }}
      >
        {/* Logo block */}
        <div className="flex flex-col items-center mb-20">
          <img
            src={logoSpe}
            alt="SPE Sulsport"
            className="h-20 mb-4 object-contain opacity-90"
          />
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-zinc-700" />
            <span className="text-xs text-zinc-500 tracking-[0.4em] uppercase font-medium">
              Eventos Profissionais
            </span>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-zinc-700" />
          </div>
        </div>

        {/* Cards container */}
        <div className="flex gap-6 max-w-[780px] w-full">
          {/* BÁSICO */}
          <button
            onClick={() => navigate('/championship/hub?mat=1&mode=basic')}
            className="group flex-1 relative overflow-hidden transition-all duration-500 hover:scale-[1.015] active:scale-[0.99]"
          >
            <div className="relative bg-[#0c0c12] border border-white/[0.04] overflow-hidden"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)' }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.06),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="h-[2px] bg-gradient-to-r from-red-600/60 via-red-500/80 to-red-600/60 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="px-10 pt-14 pb-16 flex flex-col items-center">
                <h2 className="text-3xl font-black text-white/90 tracking-[0.2em] mb-3 group-hover:text-white transition-colors duration-500">
                  BÁSICO
                </h2>
                <div className="w-10 h-[1px] bg-red-500/30 group-hover:w-16 group-hover:bg-red-500/60 transition-all duration-500 mb-4" />
                <p className="text-zinc-500 text-base tracking-wide group-hover:text-zinc-400 transition-colors duration-500">
                  Luta a luta, sem chaves
                </p>
              </div>

              <div className="absolute bottom-0 right-6 w-[1px] h-6 bg-red-500/20 group-hover:bg-red-500/50 transition-colors duration-500" />
            </div>
          </button>

          {/* Divider */}
          <div className="flex flex-col items-center justify-center gap-2 px-1">
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-zinc-800 to-transparent" />
            <span className="text-sm text-zinc-600 font-bold tracking-wider">OU</span>
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-zinc-800 to-transparent" />
          </div>

          {/* PROFISSIONAL */}
          <button
            onClick={() => navigate('/professional')}
            className="group flex-1 relative overflow-hidden transition-all duration-500 hover:scale-[1.015] active:scale-[0.99]"
          >
            <div className="relative bg-[#0c0c12] border border-white/[0.04] overflow-hidden"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 24px 100%, 0 calc(100% - 24px))' }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,140,40,0.06),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="h-[2px] bg-gradient-to-r from-[hsl(var(--sulsport-yellow))]/60 via-[hsl(var(--sulsport-yellow))]/80 to-[hsl(var(--sulsport-yellow))]/60 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="px-10 pt-14 pb-16 flex flex-col items-center">
                <h2 className="text-3xl font-black text-white/90 tracking-[0.2em] mb-3 group-hover:text-white transition-colors duration-500">
                  PROFISSIONAL
                </h2>
                <div className="w-10 h-[1px] bg-[hsl(var(--sulsport-yellow))]/30 group-hover:w-16 group-hover:bg-[hsl(var(--sulsport-yellow))]/60 transition-all duration-500 mb-4" />
                <p className="text-zinc-500 text-base tracking-wide group-hover:text-zinc-400 transition-colors duration-500">
                  Torneio com chaves e quadras
                </p>
              </div>

              <div className="absolute bottom-6 left-0 w-6 h-[1px] bg-[hsl(var(--sulsport-yellow))]/20 group-hover:bg-[hsl(var(--sulsport-yellow))]/50 transition-colors duration-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative z-10 flex justify-center pb-6"
        style={{
          opacity: phase === 'menu' ? 1 : 0,
          transition: skipTransition ? 'none' : 'opacity 800ms ease-out 200ms',
        }}
      >
        <span className="text-zinc-600 text-xs tracking-[0.3em]">v1.0.0</span>
      </div>
    </div>
  );
}
