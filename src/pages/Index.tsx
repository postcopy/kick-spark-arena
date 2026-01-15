import { useState, useCallback, useRef } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useArcadeState } from '@/hooks/useArcadeState';
import { useSerialPort } from '@/hooks/useSerialPort';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { HomeScreen } from '@/components/game/HomeScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { FinishedScreen } from '@/components/game/FinishedScreen';
import { ArcadeSetupScreen } from '@/components/game/ArcadeSetupScreen';
import { ArcadeScreen } from '@/components/game/ArcadeScreen';
import { ArcadeFinishedScreen } from '@/components/game/ArcadeFinishedScreen';
import { Paywall } from '@/components/Paywall';
import { Loader2 } from 'lucide-react';
import type { Side, GameMode } from '@/types/game';

const Index = () => {
  const { user, subscription, isLoading: authLoading, isAdmin } = useAuth();
  const { play } = useSound();
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [duration, setDuration] = useState(60);
  const [roundDuration, setRoundDuration] = useState(60);
  const [bestOf, setBestOf] = useState<1 | 3>(3);
  
  // Background music reference
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const timeAttackState = useGameState({ 
    duration, 
    minIntervalMs: 120,
    onHit: () => play('hit'),
    onGameEnd: () => play('timeUp'),
  });
  
  const arcadeState = useArcadeState({ 
    roundDurationSec: roundDuration, 
    bestOf,
    onHit: () => play('hit'),
    onHitHeavy: () => play('hitHeavy'),
    onCombo: () => play('combo'),
    onSpecialReady: () => play('specialReady'),
    onSpecialAttack: () => play('specialAttack'),
    onKO: () => play('ko'),
    onTimeUp: () => play('timeUp'),
  });

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
    // Check if user can play
    if (!canPlay) {
      return;
    }
    
    setGameMode(mode);
    if (mode === 'time_attack') {
      timeAttackState.goToSetup();
    } else if (mode === 'arcade') {
      arcadeState.goToSetup();
    }
  }, [timeAttackState, arcadeState]);

  const handleBackToMenu = useCallback(() => {
    // Stop background music
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current = null;
    }
    setGameMode(null);
    timeAttackState.resetGame();
    arcadeState.resetGame();
  }, [timeAttackState, arcadeState]);

  // Handle music started from countdown
  const handleMusicStarted = useCallback((audio: HTMLAudioElement) => {
    bgMusicRef.current = audio;
  }, []);

  // Stop music when game finishes
  const stopBgMusic = useCallback(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current = null;
    }
  }, []);

  // Determine if user can play
  // Admin always can play, subscribed users can play, users in trial can play
  const canPlay = isAdmin || subscription.isSubscribed || subscription.isLoading;

  // Show loading while auth is loading
  if (authLoading || subscription.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-game-yellow" />
      </div>
    );
  }

  // Home screen - always accessible (preview mode)
  if (!gameMode) {
    return (
      <>
        <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />
        {/* Show paywall if user is logged in but expired, or trying to play without login */}
        {user && !canPlay && <Paywall />}
      </>
    );
  }

  // If user is playing but not allowed (edge case - shouldn't happen)
  if (!canPlay) {
    return (
      <>
        <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />
        <Paywall />
      </>
    );
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
        return <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} />;
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
        stopBgMusic();
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
        return <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} />;
      case 'running':
      case 'round_end':
        return <ArcadeScreen arcadeState={arcadeState} />;
      case 'finished':
        stopBgMusic();
        return lastResult ? (
          <ArcadeFinishedScreen result={lastResult} onPlayAgain={goToSetup} onBackToMenu={handleBackToMenu} />
        ) : null;
    }
  }

  return <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
};

export default Index;
