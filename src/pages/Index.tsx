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

// Frame component - single root with h-[100dvh]
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

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
  
  // Stop music callback with fade out - optimized interval
  const stopBgMusic = useCallback(() => {
    if (bgMusicRef.current) {
      const audio = bgMusicRef.current;
      const fadeInterval = window.setInterval(() => {
        if (audio.volume > 0.15) {
          audio.volume = Math.max(0, audio.volume - 0.15);
        } else {
          window.clearInterval(fadeInterval);
          audio.pause();
          audio.volume = 0.6; // Reset for next time
          bgMusicRef.current = null;
        }
      }, 100); // Increased from 50ms for better performance
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

  // Build content based on state
  let content: React.ReactNode;

  // Show loading while auth is loading
  if (authLoading || subscription.isLoading) {
    content = (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-game-yellow" />
      </div>
    );
  } else if (!gameMode) {
    // Home screen - always accessible (preview mode)
    content = (
      <>
        <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />
        {/* Show paywall if user is logged in but expired, or trying to play without login */}
        {user && !canPlay && <Paywall />}
      </>
    );
  } else if (!canPlay) {
    // If user is playing but not allowed (edge case - shouldn't happen)
    content = (
      <>
        <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />
        <Paywall />
      </>
    );
  } else if (gameMode === 'time_attack') {
    // Time Attack Mode
    const { gameState, scores, timeLeft, countdown, lastResult, flashSide, goToSetup, startCountdown } = timeAttackState;

    // Check if can start (for individual mode, need athlete selected)
    const canStart = timeAttackVariant === 'duo' || (timeAttackVariant === 'individual' && selectedAthlete !== null);

    switch (gameState) {
      case 'idle':
      case 'setup':
        content = (
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
        break;
      case 'countdown':
        content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} />;
        break;
      case 'running':
      case 'paused':
        content = (
          <GameScreen
            scores={scores}
            timeLeft={timeLeft}
            isPaused={gameState === 'paused'}
            flashSide={flashSide}
            isIndividual={timeAttackVariant === 'individual'}
            athlete={selectedAthlete}
          />
        );
        break;
      case 'finished':
        stopBgMusic();
        content = lastResult ? (
          <FinishedScreen result={lastResult} onPlayAgain={goToSetup} onBackToMenu={handleBackToMenu} />
        ) : null;
        break;
      default:
        content = <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
    }
  } else if (gameMode === 'arcade') {
    // Arcade Mode
    const { gameState, countdown, lastResult, goToSetup, startCountdown } = arcadeState;

    switch (gameState) {
      case 'idle':
      case 'setup':
        content = (
          <ArcadeSetupScreen
            onStart={startCountdown}
            onBack={handleBackToMenu}
            roundDuration={roundDuration}
            onRoundDurationChange={setRoundDuration}
            bestOf={bestOf}
            onBestOfChange={setBestOf}
          />
        );
        break;
      case 'countdown':
        content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} shouldStartMusic={isNewRoundRef.current} />;
        break;
      case 'running':
      case 'round_end':
        content = <ArcadeScreen arcadeState={arcadeState} />;
        break;
      case 'finished':
        stopBgMusic();
        content = lastResult ? (
          <ArcadeFinishedScreen result={lastResult} onPlayAgain={goToSetup} onBackToMenu={handleBackToMenu} />
        ) : null;
        break;
      default:
        content = <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
    }
  } else {
    content = <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
  }

  return <Frame>{content}</Frame>;
};

export default Index;
