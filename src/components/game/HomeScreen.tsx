import { Timer, Swords, Zap, Eye, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logoSfighter from '@/assets/logo-sfighter.png';
import bgMenuModos from '@/assets/menu-modos.jpg';
import { UseSerialPortReturn } from '@/types/serial';
import { MenuDrawer } from './MenuDrawer';
import { EquipmentStatus } from './EquipmentStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import type { GameMode } from '@/types/game';
import { cn } from '@/lib/utils';

interface HomeScreenProps {
  onSelectMode: (mode: GameMode) => void;
  serialPort?: UseSerialPortReturn;
}

const gameModes = [
  {
    id: 'time_attack' as GameMode,
    title: 'CONTRA O TEMPO',
    subtitle: 'Quem chuta mais?',
    info: '1-2 JOGADORES',
    hardware: 'Requer sensor',
    icon: Timer,
    color: '#F97316',
    colorRgb: '249,115,22',
    gradient: 'from-orange-600/30 via-orange-900/20 to-transparent',
    borderHover: 'hover:border-orange-500/50',
    textColor: 'text-orange-400',
    bgAccent: 'bg-orange-500',
    description: 'Chute o máximo possível antes do tempo acabar. Solo ou em dupla!',
  },
  {
    id: 'arcade' as GameMode,
    title: 'DUELO',
    subtitle: 'Luta até o K.O.!',
    info: '2 JOGADORES',
    hardware: 'Requer sensor',
    icon: Swords,
    color: '#E11D48',
    colorRgb: '225,29,72',
    gradient: 'from-red-600/30 via-red-900/20 to-transparent',
    borderHover: 'hover:border-red-500/50',
    textColor: 'text-red-400',
    bgAccent: 'bg-red-500',
    description: 'Arena de combate! Drene a vida do oponente com chutes precisos.',
  },
  {
    id: 'reaction' as GameMode,
    title: 'REAÇÃO',
    subtitle: 'Reflexo e controle',
    info: 'TURMA INTEIRA',
    hardware: 'Tela touch / Teclado',
    icon: Eye,
    color: '#22C55E',
    colorRgb: '34,197,94',
    gradient: 'from-green-600/30 via-green-900/20 to-transparent',
    borderHover: 'hover:border-green-500/50',
    textColor: 'text-green-400',
    bgAccent: 'bg-green-500',
    description: 'Treine reflexos e tempo de reação com estímulos visuais.',
  },
] as const;

export function HomeScreen({ onSelectMode, serialPort }: HomeScreenProps) {
  const { user } = useAuth();
  const { unlockAudio, initFullPreload, play } = useSound();
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSelectMode = (mode: GameMode) => {
    unlockAudio();
    initFullPreload();
    onSelectMode(mode);
  };

  const handleClick = (id: string) => {
    handleSelectMode(id as GameMode);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative bg-[#0A0A0F]">
      {/* Background image */}
      <img src={bgMenuModos} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.06] z-0" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0F] via-transparent to-[#0A0A0F] z-[1]" />

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Compact Header */}
        <header className="flex-shrink-0 w-full flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src={logoSfighter} alt="S-Fight" className="h-7 md:h-8 w-auto opacity-80" />
            <div className="flex items-center gap-1.5">
              {serialPort?.isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-white/50" aria-hidden="true" />
              )}
              <span className="font-mono text-[10px] text-white/50">
                {serialPort?.isConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {serialPort?.isConnected && (
              <EquipmentStatus equipment={serialPort.equipment} compact />
            )}
            <span className="font-mono text-[10px] text-white/50 hidden sm:block">
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

        {/* Main - Mode Selection Panels */}
        <main className="flex-1 min-h-0 flex flex-col">
          {/* Title */}
          <div className="text-center py-3 md:py-4">
            <p className="font-mono text-[10px] md:text-xs text-white/50 tracking-[0.5em] uppercase">
              Selecione o modo
            </p>
          </div>

          {/* Game Mode Panels - Character Select Style */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 md:gap-3 px-3 md:px-4 pb-2">
            {gameModes.map((mode, index) => {
              const Icon = mode.icon;
              const isHovered = hoveredIndex === index;
              const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

              return (
                <button
                  key={mode.id}
                  onClick={() => handleClick(mode.id)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "animated-border relative overflow-hidden rounded-xl border border-white/[0.06] transition-all duration-500 ease-out",
                    "flex flex-col items-center justify-center text-center",
                    "group cursor-pointer",
                    // Flex grow behavior on hover (desktop)
                    "lg:flex-1",
                    isHovered && "lg:flex-[2] border-white/10",
                    isOtherHovered && "lg:flex-[0.7] opacity-60",
                    // Mobile: fixed height
                    "min-h-[120px] md:min-h-[140px]",
                    mode.borderHover,
                  )}
                  style={{
                    ['--border-color' as any]: `rgba(${mode.colorRgb},0.7)`,
                    background: isHovered
                      ? `radial-gradient(ellipse at 50% 80%, rgba(${mode.colorRgb},0.12) 0%, transparent 70%)`
                      : `radial-gradient(ellipse at 50% 80%, rgba(${mode.colorRgb},0.04) 0%, transparent 70%)`,
                  }}
                >
                  {/* Top accent line */}
                  <div
                    className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-500",
                      isHovered ? "w-3/4 opacity-100" : "w-1/4 opacity-40"
                    )}
                    style={{ background: mode.color }}
                  />

                  {/* Glow orb behind icon */}
                  <div
                    className={cn(
                      "absolute transition-all duration-700",
                      isHovered ? "opacity-30 scale-150" : "opacity-10 scale-100"
                    )}
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${mode.color}, transparent 70%)`,
                      filter: 'blur(40px)',
                    }}
                  />

                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 mb-3 md:mb-4 transition-all duration-500",
                    isHovered ? "scale-125" : "scale-100"
                  )}>
                    <Icon
                      className={cn(
                        "w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 transition-all duration-500",
                        mode.textColor,
                      )}
                      strokeWidth={1.5}
                      style={{
                        filter: isHovered
                          ? `drop-shadow(0 0 20px ${mode.color})`
                          : `drop-shadow(0 0 8px rgba(${mode.colorRgb},0.3))`,
                      }}
                    />
                  </div>

                  {/* Title */}
                  <h2 className={cn(
                    "relative z-10 font-display font-black text-lg md:text-2xl lg:text-3xl text-white uppercase tracking-tight transition-all duration-500",
                    isHovered && "tracking-wider"
                  )}>
                    {mode.title}
                  </h2>

                  {/* Subtitle */}
                  <p className={cn(
                    "relative z-10 text-xs md:text-sm font-semibold mt-1 transition-all duration-300",
                    mode.textColor,
                    isHovered ? "opacity-100" : "opacity-60"
                  )}>
                    {mode.subtitle}
                  </p>

                  {/* Description - only visible on hover (desktop) */}
                  <p className={cn(
                    "relative z-10 text-xs text-white/40 mt-2 max-w-[240px] transition-all duration-500 hidden lg:block",
                    isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}>
                    {mode.description}
                  </p>

                  {/* Player count badge */}
                  <div className={cn(
                    "relative z-10 mt-3 md:mt-4 px-3 py-1 rounded-full border transition-all duration-300",
                    isHovered ? "border-white/15 bg-white/5" : "border-white/5 bg-transparent"
                  )}>
                    <span className="font-mono text-[9px] md:text-[10px] tracking-[0.2em] text-white/50">
                      {mode.info}
                    </span>
                  </div>

                  {/* Hardware requirement */}
                  <span className={cn(
                    "relative z-10 mt-1.5 font-mono text-[9px] tracking-wider transition-all duration-300",
                    mode.hardware === 'Tela touch / Teclado' ? "text-green-400/40" : "text-white/25",
                    isHovered ? "opacity-100" : "opacity-60"
                  )}>
                    {mode.hardware}
                  </span>
                </button>
              );
            })}
          </div>

        </main>

        {/* Minimal Footer */}
        <footer className="flex-shrink-0 border-t border-white/5 px-4 py-2">
          <div className="flex items-center justify-center gap-5">
            {!serialPort?.isConnected && (
              <>
                <div className="flex items-center gap-1.5">
                  <kbd className="bg-white/8 border border-white/15 rounded px-1.5 py-0.5 font-mono text-[10px] text-white/60">A</kbd>
                  <span className="font-mono text-[10px] text-white/50">Verm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="bg-white/8 border border-white/15 rounded px-1.5 py-0.5 font-mono text-[10px] text-white/60">L</kbd>
                  <span className="font-mono text-[10px] text-white/50">Azul</span>
                </div>
                <div className="flex items-center gap-1.5 hidden sm:flex">
                  <kbd className="bg-white/8 border border-white/15 rounded px-1.5 py-0.5 font-mono text-[10px] text-white/60">ESC</kbd>
                  <span className="font-mono text-[10px] text-white/50">Menu</span>
                </div>
              </>
            )}
            {serialPort?.isConnected && (
              <div className="flex items-center gap-2" role="status">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                <span className="font-mono text-[10px] text-white/50">Hardware conectado</span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
