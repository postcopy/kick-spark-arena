import { Timer, Target, Zap, Usb, Swords } from 'lucide-react';
import logo from '@/assets/logo-desafio-relampago.png';
import { SerialStatus } from './SerialStatus';
import { UseSerialPortReturn } from '@/types/serial';
import type { GameMode } from '@/types/game';

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

      {/* Game Mode Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Time Attack */}
        <div
          onClick={() => onSelectMode('time_attack')}
          className="group cursor-pointer p-6 bg-game-surface border-2 border-game-yellow/30 rounded-lg hover:border-game-yellow/60 hover:bg-game-surface-elevated transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-game-yellow/10 rounded-lg group-hover:bg-game-yellow/20 transition-colors">
              <Timer className="w-10 h-10 text-game-yellow" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">TIME ATTACK</h2>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-4 h-4 text-game-yellow" />
                <span className="text-xs text-game-yellow uppercase tracking-wider">Modo Quantidade</span>
              </div>
            </div>
            <Target className="w-6 h-6 text-muted-foreground group-hover:text-game-yellow transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground">
            Quem fizer <span className="text-foreground font-semibold">mais chutes</span> no tempo vence!
          </p>
        </div>

        {/* Arcade Duel */}
        <div
          onClick={() => onSelectMode('arcade')}
          className="group cursor-pointer p-6 bg-game-surface border-2 border-game-red/30 rounded-lg hover:border-game-red/60 hover:bg-game-surface-elevated transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-game-red/10 rounded-lg group-hover:bg-game-red/20 transition-colors">
              <Swords className="w-10 h-10 text-game-red" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">ARCADE</h2>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-4 h-4 text-game-red" />
                <span className="text-xs text-game-red uppercase tracking-wider">Modo Duelo</span>
              </div>
            </div>
            <Target className="w-6 h-6 text-muted-foreground group-hover:text-game-red transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground">
            Derrube a barra do rival com <span className="text-foreground font-semibold">combos</span>. K.O. vence!
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
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
            <span>{serialPort.isConnected ? "Plaquinha ativa" : "Modo demo (teclado)"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
