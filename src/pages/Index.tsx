import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useArcadeState } from '@/hooks/useArcadeState';
import { useSerialPort } from '@/hooks/useSerialPort';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { WelcomeScreen } from '@/components/game/WelcomeScreen';
import { HomeScreen } from '@/components/game/HomeScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { FinishedScreen } from '@/components/game/FinishedScreen';
import { ArcadeSetupScreen } from '@/components/game/ArcadeSetupScreen';
import { ArcadeScreen } from '@/components/game/ArcadeScreen';
import { ArcadeFinishedScreen } from '@/components/game/ArcadeFinishedScreen';
import { EquipmentSetupScreen } from '@/components/game/EquipmentSetupScreen';
import { Paywall } from '@/components/Paywall';
import { Loader2 } from 'lucide-react';
import type { Side, GameMode, Athlete, HitType } from '@/types/game';

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
  const [roundDuration, setRoundDuration] = useState(45);
  const [vestDamage, setVestDamage] = useState(2);
  const [helmetDamage, setHelmetDamage] = useState(3);
  const [bestOf, setBestOf] = useState<1 | 3>(3);
  
  // Time Attack variant state
  const [timeAttackVariant, setTimeAttackVariant] = useState<TimeAttackVariant>('duo');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  
  // Equipment setup flow state
  const [showEquipmentSetup, setShowEquipmentSetup] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  
  // Background music reference
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  // Track if it's a new round (should start music)
  const isNewRoundRef = useRef(true);

  // === Latest Ref Pattern: garantir callbacks de som sempre atualizados ===
  const playHitRef = useRef(() => play('hit'));
  const playHitHeavyRef = useRef(() => play('hitHeavy'));
  const playComboRef = useRef(() => play('combo'));
  const playSpecialReadyRef = useRef(() => play('specialReady'));
  const playSpecialAttackRef = useRef(() => play('specialAttack'));
  const playKORef = useRef(() => play('ko'));
  const playTimeUpRef = useRef(() => play('timeUp'));

  // Manter refs sincronizadas com a versão mais recente de play
  useEffect(() => {
    playHitRef.current = () => play('hit');
    playHitHeavyRef.current = () => play('hitHeavy');
    playComboRef.current = () => play('combo');
    playSpecialReadyRef.current = () => play('specialReady');
    playSpecialAttackRef.current = () => play('specialAttack');
    playKORef.current = () => play('ko');
    playTimeUpRef.current = () => play('timeUp');
  }, [play]);

  const timeAttackState = useGameState({
    duration, 
    minIntervalMs: 120,
    onHit: () => playHitRef.current(),
    onGameEnd: () => playTimeUpRef.current(),
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
    vestDamage,
    helmetDamage,
    onHit: () => playHitRef.current(),
    onHitHeavy: () => playHitHeavyRef.current(),
    onCombo: () => playComboRef.current(),
    onSpecialReady: () => playSpecialReadyRef.current(),
    onSpecialAttack: () => playSpecialAttackRef.current(),
    onKO: () => playKORef.current(),
    onTimeUp: () => playTimeUpRef.current(),
    onRoundEnd: () => {
      stopBgMusic();
      isNewRoundRef.current = true;
    },
  });

  // Serial port kick handler with hit type
  const handleSerialKick = useCallback((side: Side, hitType: HitType = 'vest') => {
    if (gameMode === 'time_attack') {
      // In individual mode, both sides count as one kick
      // Time attack doesn't differentiate hit types
      timeAttackState.registerKick(side);
    } else if (gameMode === 'arcade') {
      arcadeState.registerKick(side, hitType);
    }
  }, [gameMode, timeAttackState, arcadeState]);

  const serialPort = useSerialPort({ 
    onKick: handleSerialKick,
    debounceMs: 150,
  });

  // Determine if user can play
  // Admin always can play, subscribed users can play, users in trial can play
  const canPlay = isAdmin || subscription.isSubscribed || subscription.isTrialing;

  const handleSelectMode = useCallback((mode: GameMode) => {
    // Check if user can play
    if (!canPlay) {
      return;
    }
    
    // If not connected to hardware, show equipment setup first
    if (!serialPort.isConnected) {
      setPendingMode(mode);
      setShowEquipmentSetup(true);
      return;
    }
    
    // Already connected, go directly to setup
    setGameMode(mode);
    if (mode === 'time_attack') {
      timeAttackState.goToSetup();
    } else if (mode === 'arcade') {
      arcadeState.goToSetup();
    }
  }, [canPlay, serialPort.isConnected, timeAttackState, arcadeState]);

  // Handler for continuing from equipment setup
  const handleEquipmentContinue = useCallback(() => {
    if (!pendingMode) return;
    setShowEquipmentSetup(false);
    setGameMode(pendingMode);
    if (pendingMode === 'time_attack') {
      timeAttackState.goToSetup();
    } else if (pendingMode === 'arcade') {
      arcadeState.goToSetup();
    }
    setPendingMode(null);
  }, [pendingMode, timeAttackState, arcadeState]);

  // Handler for skipping equipment setup (keyboard mode)
  const handleEquipmentSkip = useCallback(() => {
    if (!pendingMode) return;
    setShowEquipmentSetup(false);
    setGameMode(pendingMode);
    if (pendingMode === 'time_attack') {
      timeAttackState.goToSetup();
    } else if (pendingMode === 'arcade') {
      arcadeState.goToSetup();
    }
    setPendingMode(null);
  }, [pendingMode, timeAttackState, arcadeState]);

  // Handler for going back from equipment setup
  const handleEquipmentBack = useCallback(() => {
    setShowEquipmentSetup(false);
    setPendingMode(null);
  }, []);

  // Stop all game processes immediately (no fade)
  const stopAllGameProcesses = useCallback(() => {
    // Stop background music immediately
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      try { bgMusicRef.current.currentTime = 0; } catch {}
      bgMusicRef.current = null;
    }
    // Reset game states (clears internal timers)
    timeAttackState.resetGame();
    arcadeState.resetGame();
    // Reset flags
    isNewRoundRef.current = true;
  }, [timeAttackState, arcadeState]);

  const handleBackToMenu = useCallback(() => {
    stopAllGameProcesses();
    setGameMode(null);
    setTimeAttackVariant('duo');
    setSelectedAthlete(null);
  }, [stopAllGameProcesses]);

  // Global ESC handler to exit game modes
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameMode) {
        e.preventDefault();
        handleBackToMenu();
      }
    };
    
    window.addEventListener('keydown', handleGlobalEscape);
    return () => window.removeEventListener('keydown', handleGlobalEscape);
  }, [gameMode, handleBackToMenu]);

  // Handle music started from countdown
  const handleMusicStarted = useCallback((audio: HTMLAudioElement) => {
    // Stop previous music if exists
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
    }
    bgMusicRef.current = audio;
    isNewRoundRef.current = false; // Mark that music has started for this round
  }, []);


  // Build content based on state
  let content: React.ReactNode;

  // Show loading while auth is loading
  if (authLoading || subscription.isLoading) {
    content = (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-game-yellow" />
      </div>
    );
  } else if (!user) {
    // Usuário não logado = WelcomeScreen
    content = <WelcomeScreen />;
  } else if (showEquipmentSetup && pendingMode) {
    // Equipment setup screen - before entering game mode
    content = (
      <EquipmentSetupScreen
        serialPort={serialPort}
        onContinue={handleEquipmentContinue}
        onSkip={handleEquipmentSkip}
        onBack={handleEquipmentBack}
      />
    );
  } else if (!gameMode) {
    // Home screen - seletor de modos (só para logados)
    content = (
      <>
        <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />
        {!canPlay && <Paywall />}
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
        content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} onBack={handleBackToMenu} />;
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
            equipment={serialPort.equipment}
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
            vestDamage={vestDamage}
            onVestDamageChange={setVestDamage}
            helmetDamage={helmetDamage}
            onHelmetDamageChange={setHelmetDamage}
            bestOf={bestOf}
            onBestOfChange={setBestOf}
          />
        );
        break;
      case 'countdown':
        content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} shouldStartMusic={isNewRoundRef.current} onBack={handleBackToMenu} />;
        break;
      case 'running':
      case 'round_end':
        content = <ArcadeScreen arcadeState={arcadeState} equipment={serialPort.equipment} />;
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
