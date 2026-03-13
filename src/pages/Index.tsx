import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useArcadeState } from '@/hooks/useArcadeState';
import { useReactionState } from '@/hooks/useReactionState';
import { useSerialPortContext } from '@/contexts/SerialPortContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { WelcomeScreen } from '@/components/game/WelcomeScreen';
import { HomeScreen } from '@/components/game/HomeScreen';
import { SetupScreen } from '@/components/game/SetupScreen';
import { LoadingScreen } from '@/components/game/LoadingScreen';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { GameScreen } from '@/components/game/GameScreen';
import { FinishedScreen } from '@/components/game/FinishedScreen';
import { ArcadeSetupScreen } from '@/components/game/ArcadeSetupScreen';
import { ArcadeScreen } from '@/components/game/ArcadeScreen';
import { ArcadeFinishedScreen } from '@/components/game/ArcadeFinishedScreen';
import { ReactionSetupScreen } from '@/components/game/ReactionSetupScreen';
import { ReactionScreen } from '@/components/game/ReactionScreen';
import { ReactionFinishedScreen } from '@/components/game/ReactionFinishedScreen';
import { EquipmentSetupScreen } from '@/components/game/EquipmentSetupScreen';
import { Paywall } from '@/components/Paywall';
import { Loader2 } from 'lucide-react';
import type { Side, GameMode, Athlete, HitType } from '@/types/game';
import type { ReactionLevel, ReactionConfig } from '@/types/reaction';
import { REACTION_PRESETS } from '@/types/reaction';

type TimeAttackVariant = 'duo' | 'individual';

// Frame component - fills AppShell content area
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden">
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
  const [recoveryInterval, setRecoveryInterval] = useState(15);
  
  // Reaction mode state
  const [reactionLevel, setReactionLevel] = useState<ReactionLevel>('beginner');
  const [reactionConfig, setReactionConfig] = useState<ReactionConfig>(REACTION_PRESETS.beginner);
  
  // Time Attack variant state
  const [timeAttackVariant, setTimeAttackVariant] = useState<TimeAttackVariant>('duo');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  
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
  const playKORef = useRef(() => play('ko'));
  const playErrorRef = useRef(() => play('erro'));
  const playTimeUpRef = useRef(() => play('timeUp'));

  useEffect(() => {
    playHitRef.current = () => play('hit');
    playHitHeavyRef.current = () => play('hitHeavy');
    playKORef.current = () => play('ko');
    playErrorRef.current = () => play('erro');
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
  
  // Stop music callback with professional fade out (exponential curve, ~1.2s)
  const stopBgMusic = useCallback(() => {
    if (bgMusicRef.current) {
      const audio = bgMusicRef.current;
      bgMusicRef.current = null; // Prevent double-fade
      const startVol = audio.volume;
      const FADE_OUT_MS = 1200;
      const FADE_STEP = 30;
      const steps = FADE_OUT_MS / FADE_STEP;
      let step = 0;
      const fadeInterval = window.setInterval(() => {
        step++;
        // Exponential ease-out for smooth professional fade
        const t = Math.min(step / steps, 1);
        audio.volume = Math.max(0, startVol * (1 - t) * (1 - t));
        if (step >= steps) {
          window.clearInterval(fadeInterval);
          audio.pause();
          try { audio.currentTime = 0; } catch {}
          audio.volume = startVol; // Reset for next play
        }
      }, FADE_STEP);
    }
  }, []);

  const arcadeState = useArcadeState({ 
    roundDurationSec: roundDuration, 
    bestOf,
    vestDamage,
    helmetDamage,
    recoveryIntervalSec: recoveryInterval,
    onHit: () => playHitRef.current(),
    onHitHeavy: () => playHitHeavyRef.current(),
    onKO: () => playKORef.current(),
    onTimeUp: () => playTimeUpRef.current(),
    onRoundEnd: () => {
      stopBgMusic();
      isNewRoundRef.current = true;
    },
  });

  // Reaction mode state
  const reactionState = useReactionState({
    config: reactionConfig,
    onRoundEnd: () => playTimeUpRef.current(),
    onSessionEnd: () => play('victory'),
    onStimulus: () => play('scoreBeep'),
    onHit: () => playHitRef.current(),
    onNoGoSuccess: () => play('scoreBeep'),
    onCommissionError: () => playErrorRef.current(),
  });

  // Serial port kick handler with hit type
  const handleSerialKick = useCallback((side: Side, hitType: HitType = 'vest') => {
    if (gameMode === 'time_attack') {
      timeAttackState.registerKick(side);
    } else if (gameMode === 'arcade') {
      arcadeState.registerKick(side, hitType);
    } else if (gameMode === 'reaction') {
      reactionState.registerImpact();
    }
  }, [gameMode, timeAttackState, arcadeState, reactionState]);

  const { serialPort, registerKickHandler, unregisterKickHandler } = useSerialPortContext();

  // Register kick handler on mount and when it changes
  useEffect(() => {
    registerKickHandler(handleSerialKick);
    return () => unregisterKickHandler();
  }, [handleSerialKick, registerKickHandler, unregisterKickHandler]);

  // Determine if user can play
  // Admin always can play, subscribed users can play, users in trial can play
  const canPlay = isAdmin || subscription.isSubscribed || subscription.isTrialing;

  const handleSelectMode = useCallback((mode: GameMode) => {
    // Check if user can play
    if (!canPlay) {
      return;
    }
    
    // Reaction mode doesn't need equipment - go directly to setup
    if (mode === 'reaction') {
      setGameMode(mode);
      reactionState.goToSetup();
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
  }, [canPlay, serialPort.isConnected, timeAttackState, arcadeState, reactionState]);

  // Handler for continuing from equipment setup
  const handleEquipmentContinue = useCallback(() => {
    if (!pendingMode) return;
    setShowEquipmentSetup(false);
    setGameMode(pendingMode);
    if (pendingMode === 'time_attack') {
      timeAttackState.goToSetup();
    } else if (pendingMode === 'arcade') {
      arcadeState.goToSetup();
    } else if (pendingMode === 'reaction') {
      reactionState.goToSetup();
    }
    setPendingMode(null);
  }, [pendingMode, timeAttackState, arcadeState, reactionState]);

  // Handler for skipping equipment setup (keyboard mode)
  const handleEquipmentSkip = useCallback(() => {
    if (!pendingMode) return;
    setShowEquipmentSetup(false);
    setGameMode(pendingMode);
    if (pendingMode === 'time_attack') {
      timeAttackState.goToSetup();
    } else if (pendingMode === 'arcade') {
      arcadeState.goToSetup();
    } else if (pendingMode === 'reaction') {
      reactionState.goToSetup();
    }
    setPendingMode(null);
  }, [pendingMode, timeAttackState, arcadeState, reactionState]);

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
    reactionState.resetGame();
    // Reset flags
    isNewRoundRef.current = true;
  }, [timeAttackState, arcadeState, reactionState]);

  const handleBackToMenu = useCallback(() => {
    stopAllGameProcesses();
    setGameMode(null);
    setTimeAttackVariant('duo');
    setSelectedAthlete(null);
    setIsGuest(false);
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
        <Loader2 className="w-8 h-8 animate-spin text-[#E11D48]" />
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
        <HomeScreen
          onSelectMode={handleSelectMode}
          serialPort={serialPort}
        />
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
    const { gameState, scores, timeLeft, countdown, lastResult, flashSide, goToSetup, goToLoading, startCountdown } = timeAttackState;

    // Check if can start (for individual mode, need athlete selected)
    const canStart = timeAttackVariant === 'duo' || (timeAttackVariant === 'individual' && selectedAthlete !== null);

    switch (gameState) {
      case 'idle':
      case 'setup':
        content = (
          <SetupScreen
            onStart={() => canStart && goToLoading()}
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
      case 'loading':
        content = (
          <LoadingScreen
            onReady={() => startCountdown()}
            bgMusicName="bgTimeAttack"
          />
        );
        break;
      case 'countdown':
        content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} bgMusicName="bgTimeAttack" onBack={handleBackToMenu} />;
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
    const { gameState, countdown, lastResult, goToSetup, goToLoading, startCountdown } = arcadeState;

    switch (gameState) {
      case 'idle':
      case 'setup':
        content = (
          <ArcadeSetupScreen
            onStart={goToLoading}
            onBack={handleBackToMenu}
            roundDuration={roundDuration}
            onRoundDurationChange={setRoundDuration}
            vestDamage={vestDamage}
            onVestDamageChange={setVestDamage}
            helmetDamage={helmetDamage}
            onHelmetDamageChange={setHelmetDamage}
            bestOf={bestOf}
            onBestOfChange={setBestOf}
            recoveryInterval={recoveryInterval}
            onRecoveryIntervalChange={setRecoveryInterval}
          />
        );
        break;
      case 'loading':
        content = (
          <LoadingScreen
            onReady={() => startCountdown()}
            bgMusicName="bgArcade"
          />
        );
        break;
      case 'countdown':
        content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} shouldStartMusic={isNewRoundRef.current} bgMusicName="bgArcade" onBack={handleBackToMenu} />;
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
  } else if (gameMode === 'reaction') {
    // Reaction Mode
    const { gameState, countdown, lastResult, goToSetup, goToLoading, startCountdown } = reactionState;

    switch (gameState) {
      case 'idle':
      case 'setup':
        content = (
          <ReactionSetupScreen
            config={reactionConfig}
            onConfigChange={setReactionConfig}
            onStart={goToLoading}
            onBack={handleBackToMenu}
            isHardwareConnected={serialPort.isConnected}
            selectedAthlete={selectedAthlete}
            isGuest={isGuest}
            onAthleteChange={(athlete, guest) => {
              setSelectedAthlete(athlete);
              setIsGuest(guest);
            }}
          />
        );
        break;
      case 'loading':
        content = (
          <LoadingScreen
            onReady={() => startCountdown()}
            bgMusicName="bgReaction"
          />
        );
        break;
      case 'countdown':
        content = <CountdownScreen countdown={countdown} onMusicStarted={handleMusicStarted} bgMusicName="bgReaction" onBack={handleBackToMenu} />;
        break;
      case 'running':
        content = <ReactionScreen reactionState={reactionState} onBack={handleBackToMenu} athleteName={selectedAthlete?.name || (isGuest ? 'Visitante' : undefined)} />;
        break;
      case 'finished':
        stopBgMusic();
        content = lastResult ? (
          <ReactionFinishedScreen
            result={lastResult}
            selectedAthlete={selectedAthlete}
            isGuest={isGuest}
            onPlayAgain={() => reactionState.replay()}
            onAdjustSetup={() => reactionState.goToSetup()}
            onSwitchAthlete={() => {
              setSelectedAthlete(null);
              setIsGuest(false);
              reactionState.goToSetup();
            }}
          />
        ) : null;
        break;
      default:
        content = <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
    }
  } else {
    content = <HomeScreen onSelectMode={handleSelectMode} serialPort={serialPort} />;
  }

  // Derive a key for screen transitions
  const screenKey = !user ? 'welcome'
    : showEquipmentSetup ? 'equip'
    : !gameMode ? 'home'
    : gameMode === 'time_attack' ? `ta-${timeAttackState.gameState}`
    : gameMode === 'arcade' ? `arc-${arcadeState.gameState}`
    : gameMode === 'reaction' ? `rx-${reactionState.gameState}`
    : 'home';

  return (
    <Frame>
      <div key={screenKey} className="h-full w-full animate-screen-enter">
        {content}
      </div>
    </Frame>
  );
};

export default Index;
