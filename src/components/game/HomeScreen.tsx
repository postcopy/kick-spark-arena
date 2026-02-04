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

export function HomeScreen({ onSelectMode, serialPort }: HomeScreenProps) {
  const { user } = useAuth();
  const { unlockAudio, initFullPreload } = useSound();
  const navigate = useNavigate();

  const handleSelectMode = (mode: GameMode) => {
    unlockAudio();
    initFullPreload();
    onSelectMode(mode);
  };

  const handleChampionship = () => {
    navigate('/championship/mat');
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header - Fixo no topo */}
      <header className="flex-shrink-0 w-full flex items-center justify-between p-4 md:px-6 border-b border-border">
        <img 
          src={logoSfighter} 
          alt="S-Fighter" 
          className="h-10 md:h-12 w-auto" 
        />
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Olá, {user?.email?.split('@')[0]}
          </span>
          <MenuDrawer
            serialConnected={serialPort?.isConnected}
            onConnectSerial={serialPort?.connect}
            onDisconnectSerial={serialPort?.disconnect}
            serialSupported={serialPort?.isSupported}
          />
        </div>
      </header>

      {/* Main - Área principal com scroll se precisar */}
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-3 md:p-6">
        {/* Título simples */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 text-center">
          Escolha um modo
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4 text-center">
          Toque para começar
        </p>

        {/* Botões de Modo - Grid responsivo 2x2 em desktop */}
        <div className="w-full max-w-lg lg:max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4">
          {/* Time Attack */}
          <button
            onClick={() => handleSelectMode('time_attack')}
            className="group p-4 md:p-5 lg:p-6 bg-gradient-to-br from-game-yellow/20 to-game-yellow/5 border-2 border-game-yellow/50 rounded-2xl hover:border-game-yellow hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] min-h-[90px] md:min-h-[100px] lg:min-h-[120px]"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center lg:flex-col lg:items-center gap-3 lg:gap-2 flex-1">
                <div className="p-2 md:p-3 bg-game-yellow/20 rounded-xl group-hover:bg-game-yellow/30 transition-colors lg:mb-2">
                  <Timer className="w-6 h-6 md:w-7 md:h-7 text-game-yellow" />
                </div>
                
                <div className="flex-1 lg:flex-none text-left lg:text-center">
                  <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">
                    CONTRA O TEMPO
                  </h2>
                  <p className="text-sm text-game-yellow font-medium">
                    Quem chuta mais?
                  </p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center justify-center gap-2 mt-auto pt-2">
                <Zap className="w-4 h-4 text-game-yellow/70" />
                <span className="text-xs text-game-yellow/70">
                  1 ou 2 jogadores
                </span>
              </div>
            </div>
          </button>

          {/* Arcade Duel */}
          <button
            onClick={() => handleSelectMode('arcade')}
            className="group p-4 md:p-5 lg:p-6 bg-gradient-to-br from-game-red/20 to-game-red/5 border-2 border-game-red/50 rounded-2xl hover:border-game-red hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] min-h-[90px] md:min-h-[100px] lg:min-h-[120px]"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center lg:flex-col lg:items-center gap-3 lg:gap-2 flex-1">
                <div className="p-2 md:p-3 bg-game-red/20 rounded-xl group-hover:bg-game-red/30 transition-colors lg:mb-2">
                  <Swords className="w-6 h-6 md:w-7 md:h-7 text-game-red" />
                </div>
                
                <div className="flex-1 lg:flex-none text-left lg:text-center">
                  <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">
                    DUELO
                  </h2>
                  <p className="text-sm text-game-red font-medium">
                    Luta até o K.O.!
                  </p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center justify-center gap-2 mt-auto pt-2">
                <Zap className="w-4 h-4 text-game-red/70" />
                <span className="text-xs text-game-red/70">
                  2 jogadores
                </span>
              </div>
            </div>
          </button>

          {/* Reaction */}
          <button
            onClick={() => handleSelectMode('reaction')}
            className="group p-4 md:p-5 lg:p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/50 rounded-2xl hover:border-green-500 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] min-h-[90px] md:min-h-[100px] lg:min-h-[120px]"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center lg:flex-col lg:items-center gap-3 lg:gap-2 flex-1">
                <div className="p-2 md:p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors lg:mb-2">
                  <Eye className="w-6 h-6 md:w-7 md:h-7 text-green-500" />
                </div>
                
                <div className="flex-1 lg:flex-none text-left lg:text-center">
                  <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">
                    REAÇÃO
                  </h2>
                  <p className="text-sm text-green-500 font-medium">
                    Reflexo e controle
                  </p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center justify-center gap-2 mt-auto pt-2">
                <Zap className="w-4 h-4 text-green-500/70" />
                <span className="text-xs text-green-500/70">
                  Turma inteira
                </span>
              </div>
            </div>
          </button>

          {/* Championship */}
          <button
            onClick={handleChampionship}
            className="group p-4 md:p-5 lg:p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-2 border-yellow-500/50 rounded-2xl hover:border-yellow-500 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] min-h-[90px] md:min-h-[100px] lg:min-h-[120px]"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center lg:flex-col lg:items-center gap-3 lg:gap-2 flex-1">
                <div className="p-2 md:p-3 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-colors lg:mb-2">
                  <Trophy className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />
                </div>
                
                <div className="flex-1 lg:flex-none text-left lg:text-center">
                  <h2 className="text-base md:text-lg lg:text-xl font-bold text-foreground">
                    CAMPEONATO
                  </h2>
                  <p className="text-sm text-yellow-500 font-medium">
                    Placar profissional
                  </p>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center justify-center gap-2 mt-auto pt-2">
                <span className="text-xs text-yellow-500/70 bg-yellow-500/10 px-2 py-0.5 rounded">
                  2 telas
                </span>
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* Footer - Status da plaquinha */}
      {serialPort && (
        <footer className="flex-shrink-0 p-4 border-t border-border">
          <div className="flex flex-col items-center gap-2">
            {/* Status da placa */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${serialPort.isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span>{serialPort.isConnected ? 'Plaquinha conectada' : 'Use A e L no teclado'}</span>
            </div>
            
            {/* Bateria dos equipamentos - só mostra se conectado */}
            {serialPort.isConnected && (
              <EquipmentStatus equipment={serialPort.equipment} compact />
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
