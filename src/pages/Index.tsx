import { useState, useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useIronRhythmState } from '@/hooks/useIronRhythmState';
import { useSerialPort } from '@/hooks/useSerialPort';
import { HomeScreen } from '@/components/game/HomeScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { IronRhythmSetupScreen } from '@/components/game/IronRhythmSetupScreen';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { IronRhythmScreen } from '@/components/game/IronRhythmScreen';
import { FinishedScreen } from '@/components/game/FinishedScreen';
import type { GameMode, Side } from '@/types/game';

const Index = () => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [duration, setDuration] = useState(60);
  const [targetKicks, setTargetKicks] = useState(5);

  const timeAttackState = useGameState({ duration, minIntervalMs: 120 });
  const ironRhythmState = useIronRhythmState({
    duration,
    windowSec: 5,
    targetKicksPerWindow: targetKicks,
  });

  // Serial port kick handler - routes to active game mode
  const handleSerialKick = useCallback((side: Side) => {
    if (gameMode === 'time_attack') {
      timeAttackState.registerKick(side);
    } else if (gameMode === 'iron_rhythm') {
      ironRhythmState.registerKick(side);
    }
  }, [gameMode, timeAttackState, ironRhythmState]);

  const serialPort = useSerialPort({ 
    onKick: handleSerialKick,
    debounceMs: 150,
  });

  const handleSelectMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'time_attack') {
      timeAttackState.goToSetup();
    } else {
      ironRhythmState.goToSetup();
    }
  }, [timeAttackState, ironRhythmState]);

  const handleBackToMenu = useCallback(() => {
    setGameMode(null);
    timeAttackState.resetGame();
    ironRhythmState.resetGame();
  }, [timeAttackState, ironRhythmState]);

  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  const handleTargetKicksChange = useCallback((newTarget: number) => {
    setTargetKicks(newTarget);
  }, []);

  // No mode selected - show home screen
  if (!gameMode) {
    return <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
  }

  // Time Attack Mode
  if (gameMode === 'time_attack') {
    const { gameState, scores, timeLeft, countdown, lastResult, flashSide, goToSetup, startCountdown, resetGame } = timeAttackState;

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
        return <HomeScreen onSelectMode={handleSelectMode} />;
    }
  }

  // Iron Rhythm Mode
  if (gameMode === 'iron_rhythm') {
    const {
      gameState,
      scores,
      timeLeft,
      countdown,
      lastResult,
      flashSide,
      config,
      uptimeRed,
      uptimeBlue,
      isOnPaceRed,
      isOnPaceBlue,
      kicksInWindowRed,
      kicksInWindowBlue,
      goToSetup,
      startCountdown,
    } = ironRhythmState;

    switch (gameState) {
      case 'idle':
      case 'setup':
        return (
          <IronRhythmSetupScreen
            onStart={startCountdown}
            onBack={handleBackToMenu}
            duration={duration}
            onDurationChange={handleDurationChange}
            targetKicks={targetKicks}
            onTargetKicksChange={handleTargetKicksChange}
          />
        );

      case 'countdown':
        return <CountdownScreen countdown={countdown} />;

      case 'running':
      case 'paused':
        return (
          <IronRhythmScreen
            scores={scores}
            timeLeft={timeLeft}
            isPaused={gameState === 'paused'}
            flashSide={flashSide}
            config={config}
            uptimeRed={uptimeRed}
            uptimeBlue={uptimeBlue}
            isOnPaceRed={isOnPaceRed}
            isOnPaceBlue={isOnPaceBlue}
            kicksInWindowRed={kicksInWindowRed}
            kicksInWindowBlue={kicksInWindowBlue}
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
        return <HomeScreen onSelectMode={handleSelectMode} />;
    }
  }

  return <HomeScreen onSelectMode={handleSelectMode} />;
};

export default Index;
