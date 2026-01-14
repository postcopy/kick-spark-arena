import { useState, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useArcadeState } from '@/hooks/useArcadeState';
import { useSerialPort } from '@/hooks/useSerialPort';
import { HomeScreen } from '@/components/game/HomeScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { FinishedScreen } from '@/components/game/FinishedScreen';
import { ArcadeSetupScreen } from '@/components/game/ArcadeSetupScreen';
import { ArcadeScreen } from '@/components/game/ArcadeScreen';
import { ArcadeFinishedScreen } from '@/components/game/ArcadeFinishedScreen';
import type { Side, GameMode } from '@/types/game';

const Index = () => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [duration, setDuration] = useState(60);
  const [roundDuration, setRoundDuration] = useState(60);
  const [bestOf, setBestOf] = useState<1 | 3>(3);

  const timeAttackState = useGameState({ duration, minIntervalMs: 120 });
  const arcadeState = useArcadeState({ roundDurationSec: roundDuration, bestOf });

  // Serial port kick handler
  const handleSerialKick = useCallback((side: Side) => {
    if (gameMode === 'time_attack') {
      timeAttackState.registerKick(side);
    } else if (gameMode === 'arcade') {
      arcadeState.registerKick(side);
    }
  }, [gameMode, timeAttackState, arcadeState]);

  const serialPort = useSerialPort({ 
    onKick: handleSerialKick,
    debounceMs: 150,
  });

  const handleSelectMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'time_attack') {
      timeAttackState.goToSetup();
    } else if (mode === 'arcade') {
      arcadeState.goToSetup();
    }
  }, [timeAttackState, arcadeState]);

  const handleBackToMenu = useCallback(() => {
    setGameMode(null);
    timeAttackState.resetGame();
    arcadeState.resetGame();
  }, [timeAttackState, arcadeState]);

  // Home screen
  if (!gameMode) {
    return <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
  }

  // Time Attack Mode
  if (gameMode === 'time_attack') {
    const { gameState, scores, timeLeft, countdown, lastResult, flashSide, goToSetup, startCountdown } = timeAttackState;

    switch (gameState) {
      case 'idle':
      case 'setup':
        return (
          <SetupScreen
            onStart={startCountdown}
            onBack={handleBackToMenu}
            duration={duration}
            onDurationChange={setDuration}
          />
        );
      case 'countdown':
        return <CountdownScreen countdown={countdown} />;
      case 'running':
      case 'paused':
        return (
          <GameScreen
            scores={scores}
            timeLeft={timeLeft}
            isPaused={gameState === 'paused'}
            flashSide={flashSide}
          />
        );
      case 'finished':
        return lastResult ? (
          <FinishedScreen result={lastResult} onPlayAgain={goToSetup} onBackToMenu={handleBackToMenu} />
        ) : null;
    }
  }

  // Arcade Mode
  if (gameMode === 'arcade') {
    const { gameState, countdown, lastResult, goToSetup, startCountdown } = arcadeState;

    switch (gameState) {
      case 'idle':
      case 'setup':
        return (
          <ArcadeSetupScreen
            onStart={startCountdown}
            onBack={handleBackToMenu}
            roundDuration={roundDuration}
            onRoundDurationChange={setRoundDuration}
            bestOf={bestOf}
            onBestOfChange={setBestOf}
          />
        );
      case 'countdown':
        return <CountdownScreen countdown={countdown} />;
      case 'running':
      case 'round_end':
        return <ArcadeScreen arcadeState={arcadeState} />;
      case 'finished':
        return lastResult ? (
          <ArcadeFinishedScreen result={lastResult} onPlayAgain={goToSetup} onBackToMenu={handleBackToMenu} />
        ) : null;
    }
  }

  return <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
};

export default Index;
