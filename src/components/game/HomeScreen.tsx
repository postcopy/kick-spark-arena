import { Timer, Flame, Target, Zap, Usb } from 'lucide-react';
import logo from '@/assets/logo-desafio-relampago.png';
import type { GameMode } from '@/types/game';
import { SerialStatus } from './SerialStatus';
import { UseSerialPortReturn } from '@/types/serial';

interface HomeScreenProps {
  onSelectMode: (mode: GameMode) => void;
  serialPort?: UseSerialPortReturn;
}

export function HomeScreen({ onSelectMode, serialPort }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Logo / Title */}
      <div className="mb-8 text-center">
        <img src={logo} alt="Desafio Relâmpago" className="h-24 w-auto mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-foreground tracking-tight">
          DESAFIO <span className="text-game-yellow">RELÂMPAGO</span>
        </h1>
        <p className="text-xl text-muted-foreground mt-4">
          Sistema de Competição de Chutes
        </p>
      </div>

      {/* Serial Status */}
      {serialPort && (
        <div className="mb-8">
          <SerialStatus
            isConnected={serialPort.isConnected}
            isConnecting={serialPort.isConnecting}
            error={serialPort.error}
            isSupported={serialPort.isSupported}
            onConnect={serialPort.connect}
            onDisconnect={serialPort.disconnect}
          />
        </div>
      )}

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
        {/* Time Attack Mode */}
        <div
          onClick={() => onSelectMode('time_attack')}
          className="group cursor-pointer p-8 bg-game-surface border-2 border-game-yellow/30 rounded-lg hover:border-game-yellow/60 hover:bg-game-surface-elevated transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-game-yellow/10 rounded-lg group-hover:bg-game-yellow/20 transition-colors">
              <Timer className="w-12 h-12 text-game-yellow" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground">
                TIME ATTACK
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-4 h-4 text-game-yellow" />
                <span className="text-sm text-game-yellow uppercase tracking-wider">
                  Modo Quantidade
                </span>
              </div>
            </div>
            <Target className="w-8 h-8 text-muted-foreground group-hover:text-game-yellow transition-colors" />
          </div>
          <p className="text-lg text-muted-foreground">
            Quem fizer <span className="text-foreground font-semibold">mais chutes</span> no tempo definido vence!
            Velocidade pura.
          </p>
        </div>

        {/* Iron Rhythm Mode */}
        <div
          onClick={() => onSelectMode('iron_rhythm')}
          className="group cursor-pointer p-8 bg-game-surface border-2 border-orange-500/30 rounded-lg hover:border-orange-500/60 hover:bg-game-surface-elevated transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
              <Flame className="w-12 h-12 text-orange-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground">
                RITMO DE FERRO
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-500 uppercase tracking-wider">
                  Modo Condicionamento
                </span>
              </div>
            </div>
            <Target className="w-8 h-8 text-muted-foreground group-hover:text-orange-500 transition-colors" />
          </div>
          <p className="text-lg text-muted-foreground">
            Mantenha uma <span className="text-foreground font-semibold">cadência mínima</span> de chutes.
            Vence quem ficar mais tempo em ritmo!
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd>
          <span>Iniciar</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1 bg-secondary rounded text-sm font-mono">A</kbd>
          <span>Chute Vermelho</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-3 py-1 bg-secondary rounded text-sm font-mono">L</kbd>
          <span>Chute Azul</span>
        </div>
        {serialPort && (
          <div className="flex items-center gap-2">
            <Usb className="w-4 h-4" />
            <span>
              {serialPort.isConnected ? "Plaquinha ativa" : "Modo demo (teclado)"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
