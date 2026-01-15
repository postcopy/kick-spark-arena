import { Timer, Swords, Zap } from 'lucide-react';
import logo from '@/assets/logo-desafio-relampago.png';
import { UseSerialPortReturn } from '@/types/serial';
import { MenuDrawer } from './MenuDrawer';
import type { GameMode } from '@/types/game';

interface HomeScreenProps {
  onSelectMode: (mode: GameMode) => void;
  serialPort?: UseSerialPortReturn;
}

export function HomeScreen({ onSelectMode, serialPort }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 md:p-8">
      {/* Menu Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <MenuDrawer
          serialConnected={serialPort?.isConnected}
          onConnectSerial={serialPort?.connect}
          onDisconnectSerial={serialPort?.disconnect}
          serialSupported={serialPort?.isSupported}
        />
      </div>

      {/* Logo / Title - Simplified */}
      <div className="mb-10 text-center">
        <img 
          src={logo} 
          alt="Desafio Relâmpago" 
          className="h-28 md:h-36 w-auto mx-auto drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]" 
        />
      </div>

      {/* Game Mode Cards - BIG and Simple */}
      <div className="w-full max-w-lg flex flex-col gap-5">
        {/* Time Attack */}
        <button
          onClick={() => onSelectMode('time_attack')}
          className="group relative w-full p-8 md:p-10 bg-gradient-to-br from-game-yellow/20 to-game-yellow/5 border-3 border-game-yellow/50 rounded-3xl hover:border-game-yellow hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-game-yellow/10"
        >
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="p-5 bg-game-yellow/20 rounded-2xl group-hover:bg-game-yellow/30 transition-colors">
              <Timer className="w-14 h-14 md:w-16 md:h-16 text-game-yellow" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2">
            TIME ATTACK
          </h2>
          
          {/* Simple Description */}
          <p className="text-lg md:text-xl text-game-yellow text-center font-medium">
            Quem chuta mais em X segundos?
          </p>
          
          {/* Mode indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Zap className="w-4 h-4 text-game-yellow/70" />
            <span className="text-sm text-game-yellow/70 uppercase tracking-wider">
              1 ou 2 jogadores
            </span>
          </div>
        </button>

        {/* Arcade */}
        <button
          onClick={() => onSelectMode('arcade')}
          className="group relative w-full p-8 md:p-10 bg-gradient-to-br from-game-red/20 to-game-red/5 border-3 border-game-red/50 rounded-3xl hover:border-game-red hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-game-red/10"
        >
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="p-5 bg-game-red/20 rounded-2xl group-hover:bg-game-red/30 transition-colors">
              <Swords className="w-14 h-14 md:w-16 md:h-16 text-game-red" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2">
            ARCADE
          </h2>
          
          {/* Simple Description */}
          <p className="text-lg md:text-xl text-game-red text-center font-medium">
            Luta até o K.O.!
          </p>
          
          {/* Mode indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Zap className="w-4 h-4 text-game-red/70" />
            <span className="text-sm text-game-red/70 uppercase tracking-wider">
              2 jogadores
            </span>
          </div>
        </button>
      </div>

      {/* Serial Status Indicator - Subtle */}
      {serialPort && (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${serialPort.isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          <span>{serialPort.isConnected ? 'Plaquinha conectada' : 'Use A e L no teclado'}</span>
        </div>
      )}
    </div>
  );
}
