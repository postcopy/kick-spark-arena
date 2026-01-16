import { Timer, Swords, Zap, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo-desafio-relampago.png';
import { UseSerialPortReturn } from '@/types/serial';
import { MenuDrawer } from './MenuDrawer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { GameMode } from '@/types/game';

interface HomeScreenProps {
  onSelectMode: (mode: GameMode) => void;
  serialPort?: UseSerialPortReturn;
}

export function HomeScreen({ onSelectMode, serialPort }: HomeScreenProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-auto">
      {/* Header - Fixed Top */}
      <header className="w-full flex items-center justify-between p-4 md:px-8">
        {/* Logo pequeno no header */}
        <img 
          src={logo} 
          alt="Desafio Relâmpago" 
          className="h-10 md:h-12 w-auto" 
        />
        
        {/* Auth Buttons ou Menu */}
        <div className="flex items-center gap-2 md:gap-3">
          {!user ? (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-game-yellow text-background hover:bg-game-yellow/90">
                  Começar Grátis
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Olá, {user.email?.split('@')[0]}
              </span>
              <MenuDrawer
                serialConnected={serialPort?.isConnected}
                onConnectSerial={serialPort?.connect}
                onDisconnectSerial={serialPort?.disconnect}
                serialSupported={serialPort?.isSupported}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
        {/* Logo Grande - Apenas se não logado ou em telas maiores */}
        <div className="mb-6 md:mb-8 lg:mb-10 text-center">
          <img 
            src={logo} 
            alt="Desafio Relâmpago" 
            className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto mx-auto drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]" 
          />
        </div>

        {/* Game Mode Cards - Responsive: Vertical em mobile, Side-by-Side em desktop */}
        <div className="w-full max-w-lg lg:max-w-4xl flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Time Attack - CONTRA O TEMPO */}
          <button
            onClick={() => onSelectMode('time_attack')}
            className="group flex-1 p-6 md:p-8 lg:p-10 bg-gradient-to-br from-game-yellow/20 to-game-yellow/5 border-2 lg:border-3 border-game-yellow/50 rounded-2xl lg:rounded-3xl hover:border-game-yellow hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-game-yellow/10"
          >
            {/* Icon */}
            <div className="flex items-center justify-center mb-3 lg:mb-4">
              <div className="p-4 lg:p-5 bg-game-yellow/20 rounded-xl lg:rounded-2xl group-hover:bg-game-yellow/30 transition-colors">
                <Timer className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-game-yellow" />
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-2">
              CONTRA O TEMPO
            </h2>
            
            {/* Simple Description */}
            <p className="text-base md:text-lg lg:text-xl text-game-yellow text-center font-medium">
              Quem chuta mais em X segundos?
            </p>
            
            {/* Mode indicator */}
            <div className="flex items-center justify-center gap-2 mt-3 lg:mt-4">
              <Zap className="w-4 h-4 text-game-yellow/70" />
              <span className="text-xs md:text-sm text-game-yellow/70 uppercase tracking-wider">
                1 ou 2 jogadores
              </span>
            </div>
          </button>

          {/* Arcade - DUELO */}
          <button
            onClick={() => onSelectMode('arcade')}
            className="group flex-1 p-6 md:p-8 lg:p-10 bg-gradient-to-br from-game-red/20 to-game-red/5 border-2 lg:border-3 border-game-red/50 rounded-2xl lg:rounded-3xl hover:border-game-red hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-game-red/10"
          >
            {/* Icon */}
            <div className="flex items-center justify-center mb-3 lg:mb-4">
              <div className="p-4 lg:p-5 bg-game-red/20 rounded-xl lg:rounded-2xl group-hover:bg-game-red/30 transition-colors">
                <Swords className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-game-red" />
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-2">
              DUELO
            </h2>
            
            {/* Simple Description */}
            <p className="text-base md:text-lg lg:text-xl text-game-red text-center font-medium">
              Luta até o K.O.!
            </p>
            
            {/* Mode indicator */}
            <div className="flex items-center justify-center gap-2 mt-3 lg:mt-4">
              <Zap className="w-4 h-4 text-game-red/70" />
              <span className="text-xs md:text-sm text-game-red/70 uppercase tracking-wider">
                2 jogadores
              </span>
            </div>
          </button>
        </div>

        {/* Serial Status Indicator - Subtle */}
        {serialPort && (
          <div className="mt-6 lg:mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${serialPort.isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            <span>{serialPort.isConnected ? 'Plaquinha conectada' : 'Use A e L no teclado'}</span>
          </div>
        )}
      </main>
    </div>
  );
}
