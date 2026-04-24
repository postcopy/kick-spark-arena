// Mode Selector — SPE Sulsport Home
// Split hero: TREINO (academia, dia a dia) × COMPETIÇÃO (federação, oficial).
// Inspiração visual: UFC/broadcast premium + dourado federativo.

import { useNavigate } from 'react-router-dom';
import { Zap, Trophy, ArrowRight } from 'lucide-react';
import logoSpe from '@/assets/logo-spe-branca.png';

export default function ModeSelectorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050507] flex relative overflow-hidden select-none">
      {/* Logo + badge no topo central, flutuante sobre os dois painéis */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-6 flex flex-col items-center pointer-events-none">
        <img src={logoSpe} alt="SPE Sulsport" className="h-9 object-contain opacity-95" />
        <div className="flex items-center gap-3 mt-3">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-zinc-600" />
          <span className="text-[9px] text-zinc-500 tracking-[0.5em] uppercase font-bold">
            Escolha o modo
          </span>
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-zinc-600" />
        </div>
      </div>

      {/* PAINEL ESQUERDO — TREINO */}
      <button
        onClick={() => navigate('/championship/hub?mat=1&mode=basic')}
        className="group relative flex-1 h-screen overflow-hidden transition-all duration-700 hover:flex-[1.15] focus:outline-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 60%, rgba(196,30,30,0.14) 0%, rgba(127,29,29,0.05) 40%, transparent 70%)',
        }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Accent line left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-red-600/40 to-transparent group-hover:via-red-500/80 transition-all duration-700" />

        {/* Subtle ambient glow (intensifies on hover) */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 30% 60%, rgba(220,38,38,0.10), transparent 60%)',
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 h-full flex flex-col items-start justify-center pl-12 pr-8 text-left overflow-hidden">
          {/* Tag superior */}
          <div className="flex items-center gap-2 mb-6 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <Zap className="w-3.5 h-3.5 text-red-500 shrink-0" strokeWidth={2.5} />
            <span className="text-[10px] text-red-500/80 tracking-[0.45em] font-bold">
              ACADEMIA · DIA A DIA
            </span>
          </div>

          {/* Título dominante — dimensionado pra caber ate 10 letras no painel */}
          <h1
            className="text-white font-black leading-[0.85] tracking-[-0.02em] mb-5 transition-all duration-700 max-w-full"
            style={{ fontSize: 'clamp(56px, 7vw, 112px)' }}
          >
            TREINO
          </h1>

          {/* Sublinhado animado */}
          <div className="w-16 h-[2px] bg-red-500/40 group-hover:w-32 group-hover:bg-red-500/80 transition-all duration-500 mb-8" />

          {/* Descrição */}
          <p className="text-zinc-500 text-lg tracking-wide max-w-sm leading-relaxed mb-2 group-hover:text-zinc-300 transition-colors duration-500">
            Luta rápida, sem chaveamento.
          </p>
          <p className="text-zinc-600 text-sm tracking-wide max-w-sm leading-relaxed group-hover:text-zinc-400 transition-colors duration-500">
            Para aulas, sparring e eventos internos.
          </p>

          {/* CTA (aparece no hover) */}
          <div className="mt-12 flex items-center gap-3 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
            <span className="text-xs font-bold text-red-400 tracking-[0.35em] uppercase">
              Entrar
            </span>
            <ArrowRight className="w-4 h-4 text-red-400" strokeWidth={2.5} />
          </div>
        </div>

        {/* Marcador diagonal inferior direito */}
        <div className="absolute bottom-0 right-0 w-40 h-40 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none">
          <div className="absolute bottom-6 right-6 w-20 h-[1px] bg-red-500 rotate-45 origin-right" />
          <div className="absolute bottom-6 right-6 w-8 h-[1px] bg-red-500/60 rotate-45 origin-right translate-y-3" />
        </div>
      </button>

      {/* DIVISOR CENTRAL vertical */}
      <div className="relative w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent flex items-center justify-center z-10 pointer-events-none">
        <div className="absolute bg-[#050507] py-3 px-2">
          <span className="text-[10px] font-black tracking-[0.5em] text-zinc-700">OU</span>
        </div>
      </div>

      {/* PAINEL DIREITO — COMPETIÇÃO */}
      <button
        onClick={() => navigate('/professional')}
        className="group relative flex-1 h-screen overflow-hidden transition-all duration-700 hover:flex-[1.15] focus:outline-none"
        style={{
          background: 'radial-gradient(ellipse at 70% 40%, rgba(212,175,55,0.10) 0%, rgba(168,135,28,0.04) 40%, transparent 70%)',
        }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Accent line right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-[#D4AF37]/40 to-transparent group-hover:via-[#D4AF37]/80 transition-all duration-700" />

        {/* Ambient gold glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 40%, rgba(212,175,55,0.10), transparent 60%)',
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 h-full flex flex-col items-end justify-center pr-12 pl-8 text-right overflow-hidden">
          {/* Tag superior */}
          <div className="flex items-center gap-2 mb-6 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-[10px] text-[#D4AF37]/80 tracking-[0.45em] font-bold">
              FEDERAÇÃO · EVENTO OFICIAL
            </span>
            <Trophy className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" strokeWidth={2.5} />
          </div>

          {/* Título dominante — dimensionado pra COMPETIÇÃO (10 letras) caber */}
          <h1
            className="text-white font-black leading-[0.85] tracking-[-0.02em] mb-5 transition-all duration-700 max-w-full"
            style={{ fontSize: 'clamp(56px, 7vw, 112px)' }}
          >
            COMPETIÇÃO
          </h1>

          {/* Sublinhado animado */}
          <div className="w-16 h-[2px] bg-[#D4AF37]/40 group-hover:w-32 group-hover:bg-[#D4AF37]/80 transition-all duration-500 mb-8" />

          {/* Descrição */}
          <p className="text-zinc-500 text-lg tracking-wide max-w-sm leading-relaxed mb-2 group-hover:text-zinc-300 transition-colors duration-500">
            Chaveamento, arbitragem, quadras.
          </p>
          <p className="text-zinc-600 text-sm tracking-wide max-w-sm leading-relaxed group-hover:text-zinc-400 transition-colors duration-500">
            Para torneios federativos, estaduais e regionais.
          </p>

          {/* CTA (aparece no hover) */}
          <div className="mt-12 flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" strokeWidth={2.5} />
            <span className="text-xs font-bold text-[#D4AF37] tracking-[0.35em] uppercase">
              Entrar
            </span>
          </div>
        </div>

        {/* Marcador diagonal inferior esquerdo */}
        <div className="absolute bottom-0 left-0 w-40 h-40 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none">
          <div className="absolute bottom-6 left-6 w-20 h-[1px] bg-[#D4AF37] -rotate-45 origin-left" />
          <div className="absolute bottom-6 left-6 w-8 h-[1px] bg-[#D4AF37]/60 -rotate-45 origin-left translate-y-3" />
        </div>
      </button>

      {/* Footer — neutro, discreto */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <span className="text-[9px] text-zinc-700 tracking-[0.4em] font-mono">
          SPE · SULSPORT · TECNOLOGIA PARA TAEKWONDO
        </span>
      </div>
    </div>
  );
}
