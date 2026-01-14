import { useState, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { HomeScreen } from '@/components/game/HomeScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { FinishedScreen } from '@/components/game/FinishedScreen';

const Index = () => {
  const [duration, setDuration] = useState(60);

  const {
    gameState,
    scores,
    timeLeft,
    countdown,
    lastResult,
    flashSide,
    goToSetup,
    startCountdown,
    resetGame,
  } = useGameState({ duration, minIntervalMs: 120 });

  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  // Render based on game state
  switch (gameState) {
    case 'idle':
      return <HomeScreen onStartSetup={goToSetup} />;

    case 'setup':
      return (
        <SetupScreen
          onStart={startCountdown}
          onBack={resetGame}
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
          onBackToMenu={resetGame}
        />
      ) : null;

    default:
      return <HomeScreen onStartSetup={goToSetup} />;
  }
};

export default Index;
