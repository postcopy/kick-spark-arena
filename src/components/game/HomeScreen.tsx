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
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header - Fixo no topo */}
      <header className="flex-shrink-0 w-full flex items-center justify-between p-4 md:px-6 border-b border-border">
        <img 
          src={logo} 
          alt="Desafio Relâmpago" 
          className="h-10 md:h-12 w-auto" 
        />
        
        <div className="flex items-center gap-2 md:gap-3">
          {!user ? (
            <>
              <Link to="/login">
                <Button variant="outline" className="h-12 px-4 gap-2 rounded-xl">
                  <LogIn className="w-5 h-5" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="h-12 px-4 rounded-xl bg-game-yellow text-background hover:bg-game-yellow/90 font-semibold">
                  Começar
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

      {/* Main - Área principal com scroll se precisar */}
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-4 md:p-6">
        {/* Logo Grande */}
        <div className="mb-4 md:mb-6 text-center">
          <img 
            src={logo} 
            alt="Desafio Relâmpago" 
            className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto mx-auto drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]" 
          />
        </div>

        {/* Título simples */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 text-center">
          Escolha um modo
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6 text-center">
          Toque para começar
        </p>

        {/* Botões de Modo - Stack vertical em mobile, lado a lado em desktop */}
        <div className="w-full max-w-lg lg:max-w-3xl flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Time Attack */}
          <button
            onClick={() => onSelectMode('time_attack')}
            className="group flex-1 p-4 md:p-6 bg-gradient-to-br from-game-yellow/20 to-game-yellow/5 border-2 border-game-yellow/50 rounded-2xl hover:border-game-yellow hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] h-[clamp(120px,20vh,180px)]"
          >
            <div className="flex items-center justify-center mb-2">
              <div className="p-3 bg-game-yellow/20 rounded-xl group-hover:bg-game-yellow/30 transition-colors">
                <Timer className="w-8 h-8 md:w-10 md:h-10 text-game-yellow" />
              </div>
            </div>
            
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center mb-1">
              CONTRA O TEMPO
            </h2>
            
            <p className="text-base md:text-lg text-game-yellow text-center font-medium">
              Quem chuta mais?
            </p>
            
            <div className="hidden lg:flex items-center justify-center gap-2 mt-2">
              <Zap className="w-4 h-4 text-game-yellow/70" />
              <span className="text-sm text-game-yellow/70">
                1 ou 2 jogadores
              </span>
            </div>
          </button>

          {/* Arcade Duel */}
          <button
            onClick={() => onSelectMode('arcade')}
            className="group flex-1 p-4 md:p-6 bg-gradient-to-br from-game-red/20 to-game-red/5 border-2 border-game-red/50 rounded-2xl hover:border-game-red hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] h-[clamp(120px,20vh,180px)]"
          >
            <div className="flex items-center justify-center mb-2">
              <div className="p-3 bg-game-red/20 rounded-xl group-hover:bg-game-red/30 transition-colors">
                <Swords className="w-8 h-8 md:w-10 md:h-10 text-game-red" />
              </div>
            </div>
            
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center mb-1">
              DUELO
            </h2>
            
            <p className="text-base md:text-lg text-game-red text-center font-medium">
              Luta até o K.O.!
            </p>
            
            <div className="hidden lg:flex items-center justify-center gap-2 mt-2">
              <Zap className="w-4 h-4 text-game-red/70" />
              <span className="text-sm text-game-red/70">
                2 jogadores
              </span>
            </div>
          </button>
        </div>
      </main>

      {/* Footer - Status da plaquinha */}
      {serialPort && (
        <footer className="flex-shrink-0 p-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${serialPort.isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            <span>{serialPort.isConnected ? 'Plaquinha conectada' : 'Use A e L no teclado'}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
