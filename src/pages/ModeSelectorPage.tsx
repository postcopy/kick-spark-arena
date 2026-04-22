// Mode Selector — SPE Sulsport Home
// Menu direto: BÁSICO × PROFISSIONAL.

import { useNavigate } from 'react-router-dom';
import logoSpe from '@/assets/logo-spe-branca.png';

export default function ModeSelectorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030305] flex flex-col relative overflow-hidden select-none">

      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,40,0.12),transparent)]" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6">
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
      <div className="relative z-10 flex justify-center pb-6">
        <span className="text-zinc-600 text-xs tracking-[0.3em]">v1.0.0</span>
      </div>
    </div>
  );
}
