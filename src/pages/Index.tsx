import { useState, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useSerialPort } from '@/hooks/useSerialPort';
import { HomeScreen } from '@/components/game/HomeScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { FinishedScreen } from '@/components/game/FinishedScreen';
import type { Side } from '@/types/game';

const Index = () => {
  const [showHome, setShowHome] = useState(true);
  const [duration, setDuration] = useState(60);

  const timeAttackState = useGameState({ duration, minIntervalMs: 120 });

  // Serial port kick handler
  const handleSerialKick = useCallback((side: Side) => {
    timeAttackState.registerKick(side);
  }, [timeAttackState]);

  const serialPort = useSerialPort({ 
    onKick: handleSerialKick,
    debounceMs: 150,
  });

  const handleStart = useCallback(() => {
    setShowHome(false);
    timeAttackState.goToSetup();
  }, [timeAttackState]);

  const handleBackToMenu = useCallback(() => {
    setShowHome(true);
    timeAttackState.resetGame();
  }, [timeAttackState]);

  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  // Show home screen
  if (showHome) {
    return <HomeScreen onStart={handleStart} serialPort={serialPort} />;
  }

  // Time Attack Mode
  const { gameState, scores, timeLeft, countdown, lastResult, flashSide, goToSetup, startCountdown } = timeAttackState;

  switch (gameState) {
    case 'idle':
    case 'setup':
      return (
        <SetupScreen
          onStart={startCountdown}
          onBack={handleBackToMenu}
          duration={duration}
          onDurationChange={handleDurationChange}
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
        <FinishedScreen
          result={lastResult}
          onPlayAgain={goToSetup}
          onBackToMenu={handleBackToMenu}
        />
      ) : null;

    default:
      return <HomeScreen onStart={handleStart} serialPort={serialPort} />;
  }
};

export default Index;
