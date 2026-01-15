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
import type { Side, GameMode, Athlete } from '@/types/game';

type TimeAttackVariant = 'duo' | 'individual';

const Index = () => {
  const { user, subscription, isLoading: authLoading, isAdmin } = useAuth();
  const { play } = useSound();
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [duration, setDuration] = useState(60);
  const [roundDuration, setRoundDuration] = useState(60);
  const [bestOf, setBestOf] = useState<1 | 3>(3);
  
  // Time Attack variant state
  const [timeAttackVariant, setTimeAttackVariant] = useState<TimeAttackVariant>('duo');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  
  // Background music reference
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  // Track if it's a new round (should start music)
  const isNewRoundRef = useRef(true);

  const timeAttackState = useGameState({
    duration, 
    minIntervalMs: 120,
    onHit: () => play('hit'),
    onGameEnd: () => play('timeUp'),
    isIndividual: timeAttackVariant === 'individual',
    selectedAthlete: timeAttackVariant === 'individual' ? selectedAthlete : null,
  });
  
  // Stop music callback with fade out
  const stopBgMusic = useCallback(() => {
    if (bgMusicRef.current) {
      const audio = bgMusicRef.current;
      const fadeInterval = window.setInterval(() => {
        if (audio.volume > 0.1) {
          audio.volume = Math.max(0, audio.volume - 0.1);
        } else {
          window.clearInterval(fadeInterval);
          audio.pause();
          audio.volume = 0.6; // Reset for next time
          bgMusicRef.current = null;
        }
      }, 50);
    }
  }, []);

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
    onRoundEnd: () => {
      stopBgMusic();
      isNewRoundRef.current = true;
    },
  });

  // Serial port kick handler
  const handleSerialKick = useCallback((side: Side) => {
    if (gameMode === 'time_attack') {
      // In individual mode, both sides count as one kick
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
    // Reset variant state
    setTimeAttackVariant('duo');
    setSelectedAthlete(null);
  }, [timeAttackState, arcadeState]);

  // Handle music started from countdown
  const handleMusicStarted = useCallback((audio: HTMLAudioElement) => {
    // Stop previous music if exists
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
    }
    bgMusicRef.current = audio;
    isNewRoundRef.current = false; // Mark that music has started for this round
  }, []);

  // Determine if user can play
  // Admin always can play, subscribed users can play, users in trial can play
  const canPlay = isAdmin || subscription.isSubscribed || subscription.isTrialing;

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

    // Check if can start (for individual mode, need athlete selected)
    const canStart = timeAttackVariant === 'duo' || (timeAttackVariant === 'individual' && selectedAthlete !== null);

    switch (gameState) {
      case 'idle':
      case 'setup':
        return (
          <SetupScreen
            onStart={() => canStart && startCountdown()}
            onBack={handleBackToMenu}
            duration={duration}
            onDurationChange={setDuration}
            variant={timeAttackVariant}
            onVariantChange={setTimeAttackVariant}
            selectedAthlete={selectedAthlete}
            onAthleteChange={setSelectedAthlete}
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
            isIndividual={timeAttackVariant === 'individual'}
            athlete={selectedAthlete}
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
        return <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} shouldStartMusic={isNewRoundRef.current} />;
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
