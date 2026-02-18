import { Timer, Swords, Zap, Eye, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoSfighter from '@/assets/logo-sfighter.png';
import { UseSerialPortReturn } from '@/types/serial';
import { MenuDrawer } from './MenuDrawer';
import { EquipmentStatus } from './EquipmentStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import type { GameMode } from '@/types/game';

interface HomeScreenProps {
  onSelectMode: (mode: GameMode) => void;
  serialPort?: UseSerialPortReturn;
}

const modes = [
  {
    id: 'time_attack' as GameMode,
    title: 'CONTRA O TEMPO',
    subtitle: 'Quem chuta mais?',
    info: '1-2 JOGADORES',
    icon: Timer,
    color: '#eab308',
    glow: 'shadow-[0_0_24px_rgba(234,179,8,0.4)]',
    glowHover: 'group-hover:shadow-[0_0_40px_rgba(234,179,8,0.6)]',
    border: 'border-yellow-500/30 hover:border-yellow-500/80',
    bg: 'from-transparent via-yellow-500/5 to-yellow-500/20',
    iconBg: 'bg-yellow-500/15',
    textColor: 'text-yellow-500',
    textMuted: 'text-yellow-500/60',
  },
  {
    id: 'arcade' as GameMode,
    title: 'DUELO',
    subtitle: 'Luta até o K.O.!',
    info: '2 JOGADORES',
    icon: Swords,
    color: '#ef4444',
    glow: 'shadow-[0_0_24px_rgba(239,68,68,0.4)]',
    glowHover: 'group-hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]',
    border: 'border-red-500/30 hover:border-red-500/80',
    bg: 'from-transparent via-red-500/5 to-red-500/20',
    iconBg: 'bg-red-500/15',
    textColor: 'text-red-500',
    textMuted: 'text-red-500/60',
  },
  {
    id: 'reaction' as GameMode,
    title: 'REAÇÃO',
    subtitle: 'Reflexo e controle',
    info: 'TURMA INTEIRA',
    icon: Eye,
    color: '#22c55e',
    glow: 'shadow-[0_0_24px_rgba(34,197,94,0.4)]',
    glowHover: 'group-hover:shadow-[0_0_40px_rgba(34,197,94,0.6)]',
    border: 'border-green-500/30 hover:border-green-500/80',
    bg: 'from-transparent via-green-500/5 to-green-500/20',
    iconBg: 'bg-green-500/15',
    textColor: 'text-green-500',
    textMuted: 'text-green-500/60',
  },
  {
    id: 'championship' as const,
    title: 'CAMPEONATO',
    subtitle: 'Placar profissional',
    info: '2 TELAS',
    icon: Trophy,
    color: '#eab308',
    glow: 'shadow-[0_0_24px_rgba(234,179,8,0.4)]',
    glowHover: 'group-hover:shadow-[0_0_40px_rgba(234,179,8,0.6)]',
    border: 'border-yellow-500/30 hover:border-yellow-500/80',
    bg: 'from-transparent via-yellow-500/5 to-yellow-500/20',
    iconBg: 'bg-yellow-500/15',
    textColor: 'text-yellow-500',
    textMuted: 'text-yellow-500/60',
  },
] as const;

export function HomeScreen({ onSelectMode, serialPort }: HomeScreenProps) {
  const { user } = useAuth();
  const { unlockAudio, initFullPreload } = useSound();
  const navigate = useNavigate();

  const handleSelectMode = (mode: GameMode) => {
    unlockAudio();
    initFullPreload();
    onSelectMode(mode);
  };

  const handleClick = (id: string) => {
    if (id === 'championship') {
      navigate('/championship/mat');
    } else {
      handleSelectMode(id as GameMode);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: '#0b1120' }}>
      {/* Header - translucent bar */}
      <header className="flex-shrink-0 w-full flex items-center justify-between px-4 md:px-6 py-3 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <img
          src={logoSfighter}
          alt="S-Fighter"
          className="h-9 md:h-11 w-auto"
        />
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-white/50 hidden sm:block">
            {user?.email?.split('@')[0]}
          </span>
          <MenuDrawer
            serialConnected={serialPort?.isConnected}
            onConnectSerial={serialPort?.connect}
            onDisconnectSerial={serialPort?.disconnect}
            serialSupported={serialPort?.isSupported}
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-3 md:p-6">
        {/* Section label */}
        <p className="font-mono font-bold text-white/30 tracking-[0.3em] text-[10px] md:text-xs uppercase mb-4 md:mb-6">
          Selecione o modo
        </p>

        {/* Hero Cards Grid */}
        <div className="w-full max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 isolate z-0 relative">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => handleClick(mode.id)}
                className={`group relative flex flex-col items-center text-center rounded-2xl border bg-gradient-to-b p-4 md:p-6 lg:p-8
                  ${mode.border} ${mode.bg}
                  hover:scale-[1.03] active:scale-[0.97]
                  transition-all duration-300 ease-out
                  min-h-[140px] md:min-h-[200px] lg:min-h-[280px]`}
              >
                {/* Icon with glow */}
                <div
                  className={`w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center
                    ${mode.iconBg} ${mode.glow} ${mode.glowHover}
                    transition-shadow duration-300 icon-glow mb-3 md:mb-5`}
                >
                  <Icon
                    className={`w-7 h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 ${mode.textColor}`}
                    strokeWidth={2}
                  />
                </div>

                {/* Title */}
                <h2 className="font-black italic text-base md:text-lg lg:text-2xl text-white uppercase tracking-tight leading-tight">
                  {mode.title}
                </h2>

                {/* Subtitle */}
                <p className={`text-xs md:text-sm font-medium mt-1 ${mode.textColor}`}>
                  {mode.subtitle}
                </p>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Tech info badge */}
                <div className="w-full border-t border-white/10 pt-2 mt-3 md:mt-4">
                  <span className={`font-mono text-[10px] md:text-[11px] ${mode.textMuted}`}>
                    {mode.info}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer - Shortcut bar */}
      <footer className="flex-shrink-0 bg-white/5 border-t border-white/10 px-4 py-2.5">
        <div className="flex items-center justify-center gap-5 md:gap-8">
          {serialPort?.isConnected ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-xs text-white/50">Plaquinha conectada</span>
              </div>
              <EquipmentStatus equipment={serialPort.equipment} compact />
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <kbd className="bg-white/10 border border-white/20 rounded px-2 py-0.5 font-mono text-[11px] text-white/80">A</kbd>
                <span className="font-mono text-[11px] text-white/40">Vermelho</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="bg-white/10 border border-white/20 rounded px-2 py-0.5 font-mono text-[11px] text-white/80">L</kbd>
                <span className="font-mono text-[11px] text-white/40">Azul</span>
              </div>
              <div className="flex items-center gap-1.5 hidden sm:flex">
                <kbd className="bg-white/10 border border-white/20 rounded px-2 py-0.5 font-mono text-[11px] text-white/80">ESC</kbd>
                <span className="font-mono text-[11px] text-white/40">Menu</span>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
