import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { useChampionshipPersistence } from '@/hooks/useChampionshipPersistence';
import { useSerialPortContext } from '@/contexts/SerialPortContext';
import { useHardwareDiagnostics } from '@/hooks/useHardwareDiagnostics';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { OperatorPanel } from '@/components/championship/OperatorPanel';
import { ScoreboardMain } from '@/components/championship/ScoreboardMain';
import { ScoringButtons } from '@/components/championship/ScoringButtons';
import { Button } from '@/components/ui/button';
import { MatchConfigDialog } from '@/components/championship/MatchConfigDialog';
import { HelpDialog } from '@/components/championship/HelpDialog';
import { HardwareTestOverlay } from '@/components/championship/HardwareTestOverlay';
import { cn } from '@/lib/utils';
import { ArrowLeft, HelpCircle, Wifi } from 'lucide-react';
import logoSpe from '@/assets/logo-spe-branca.png';
import { useTournament } from '@/hooks/useTournament';
import { TournamentHeader } from '@/components/championship/TournamentHeader';
import { NextMatchBar } from '@/components/championship/NextMatchBar';
import { getNextReadyMatch } from '@/hooks/useBracketGenerator';
import { deviceIdToMatchSide, deviceIdToEquipmentType } from '@/lib/deviceMapping';
import type { Side, HitType } from '@/types/game';
import type { MatchSide, ScoreType, MatchConfig, HardwareTestHit } from '@/types/championship';
import type { ImpactCallbackData } from '@/types/serial';
import type { HardwareThresholds } from '@/types/hardwareDiagnostics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─── Shadow Log Types ───
export interface ShadowLogEntry {
  ts: number;
  deviceId: number;
  peakIntensity: number;
  peakAboveFloor: number;
  avgIntensity: number;
  durationMs: number;
  packetCount: number;
  side: MatchSide;
  hitType: 'vest' | 'helmet';
  decision: 'HIT' | 'POINT' | 'DUPLICATE' | 'IGNORED' | 'NOT_RUNNING';
  threshold: number;
  scored: boolean;
}

const MAX_SHADOW_LOG = 500;

function ChampionshipMatInner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matId = parseInt(searchParams.get('mat') || '1');
  
  const { user } = useAuth();
  const sync = useChampionshipSync({ role: 'master', matId, academyId: user?.id });
  useChampionshipPersistence(sync.state);
  const { play, isMuted, toggleMute, unlockAudio, initFullPreload } = useSound();
  const prevStatusRef = useRef(sync.state.status);
  const [isTVOpen, setIsTVOpen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const tvWindowRef = useRef<Window | null>(null);

  // Hardware Test mode
  const [showHardwareTest, setShowHardwareTest] = useState(false);
  const hwTestHitCallbackRef = useRef<((hit: HardwareTestHit) => void) | null>(null);

  // Tournament integration
  const tournamentHook = useTournament();
  const hasTournament = tournamentHook.tournament?.status === 'IN_PROGRESS';
  const matchResultRecordedRef = useRef(false);
  
  // Shadow log for impact scoring
  const shadowLogRef = useRef<ShadowLogEntry[]>([]);
  
  // Anti-duplicate tracking per deviceId (legacy logic: 300ms per sensor)
  const lastAcceptedTsRef = useRef<Map<number, number>>(new Map());
  
  // Hardware activity flash (shows data is arriving from serial)
  const [hwFlash, setHwFlash] = useState<'red' | 'blue' | null>(null);
  const hwFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Blocked impact warning (match not RUNNING)
  const [blockedImpactWarning, setBlockedImpactWarning] = useState(false);
  const blockedWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── DEBUG: impact flow counters ───
  const debugImpactCountRef = useRef(0);
  const debugScoredCountRef = useRef(0);
  const debugIgnoredCountRef = useRef(0);
  const debugNotRunningCountRef = useRef(0);
  const [debugCounts, setDebugCounts] = useState({ impacts: 0, scored: 0, ignored: 0, notRunning: 0 });
  const [detectorDiag, setDetectorDiag] = useState({ rejected: 0, active: 0, lastInt: 0, lastDev: 0, nim: 1, dS: 4, pt: false });

  // Auto-open config dialog if no config
  useEffect(() => {
    if (!sync.hasConfig) {
      setShowConfigDialog(true);
    }
  }, [sync.hasConfig]);
  
  // ─── onKick no-op (RAW mode removed — all scoring via ImpactDetector) ───
  const handleHardwareKick = useCallback((_side: Side, _hitType: HitType) => {
    // No-op: RAW scoring removed. All scoring goes through handleImpact.
  }, []);
  
  // ─── Impact handler (IMPACTS mode) ───
  const handleImpactRef = useRef<(impact: ImpactCallbackData) => void>(() => {});
  
  useEffect(() => {
    handleImpactRef.current = (impact: ImpactCallbackData) => {
      // DEBUG: count every impact that arrives here
      debugImpactCountRef.current++;
      console.log(`[DEBUG-IMPACT] #${debugImpactCountRef.current} dev=${impact.deviceId} peak=${impact.peakIntensity} avg=${impact.avgIntensity} dur=${impact.durationMs}ms pkts=${impact.packetCount}`);

      const config = sync.state.config;

      // Forward to Hardware Test overlay if open
      if (showHardwareTestRef.current && hwTestHitCallbackRef.current && impact.deviceId >= 1 && impact.deviceId <= 4) {
        const hit: HardwareTestHit = {
          deviceId: impact.deviceId,
          intensity: impact.peakIntensity,
          ts: impact.ts,
        };
        hwTestHitCallbackRef.current(hit);
        // Also broadcast to TV
        sync.broadcastRaw({ type: 'HARDWARE_TEST_HIT', payload: hit });
      }

      // Always show hardware activity flash (proves data is arriving)
      const flashSide = deviceIdToMatchSide(impact.deviceId);
      if (flashSide) {
        setHwFlash(flashSide === 'RED' ? 'red' : 'blue');
        if (hwFlashTimerRef.current) clearTimeout(hwFlashTimerRef.current);
        hwFlashTimerRef.current = setTimeout(() => setHwFlash(null), 400);
      }

      if (sync.state.status !== 'RUNNING') {
        // Show warning that match isn't running (instead of silent discard)
        debugNotRunningCountRef.current++;
        setDebugCounts(c => ({ ...c, impacts: debugImpactCountRef.current, notRunning: debugNotRunningCountRef.current }));
        console.log(`[IMPACT] ⚠ MATCH NOT RUNNING (${sync.state.status}), impact from dev=${impact.deviceId} peak=${impact.peakIntensity} DISCARDED [notRunning=${debugNotRunningCountRef.current}]`);
        setBlockedImpactWarning(true);
        if (blockedWarningTimerRef.current) clearTimeout(blockedWarningTimerRef.current);
        blockedWarningTimerRef.current = setTimeout(() => setBlockedImpactWarning(false), 3000);

        // Still log to shadow log for diagnostics
        const matchSide = deviceIdToMatchSide(impact.deviceId);
        const equipType = deviceIdToEquipmentType(impact.deviceId);
        if (matchSide) {
          shadowLogRef.current.push({
            ts: impact.ts, deviceId: impact.deviceId, peakIntensity: impact.peakIntensity,
            peakAboveFloor: 0, avgIntensity: impact.avgIntensity, durationMs: impact.durationMs,
            packetCount: impact.packetCount, side: matchSide, hitType: equipType,
            threshold: 0, decision: 'NOT_RUNNING', scored: false,
          });
          if (shadowLogRef.current.length > MAX_SHADOW_LOG) {
            shadowLogRef.current = shadowLogRef.current.slice(-MAX_SHADOW_LOG);
          }
        }
        return;
      }

      const matchSide = deviceIdToMatchSide(impact.deviceId);
      const equipType = deviceIdToEquipmentType(impact.deviceId);
      if (!matchSide) return;
      
      const thresholds = config.impactThresholds ?? { vestPointMin: 19, helmetPointMin: 10, vestHitMin: 15, helmetHitMin: 5, noiseFloor: {} };
      const floor = thresholds.noiseFloor[String(impact.deviceId)] ?? 0;
      const peakAboveFloor = impact.peakIntensity - floor;
      
      const isHelmet = equipType === 'helmet';
      const hitMin = isHelmet ? thresholds.helmetHitMin : thresholds.vestHitMin;
      const pointMin = isHelmet ? thresholds.helmetPointMin : thresholds.vestPointMin;
      
      // ─── IGNORED: below hitMin for this equipment type ───
      if (impact.peakIntensity < hitMin) {
        const entry: ShadowLogEntry = {
          ts: impact.ts, deviceId: impact.deviceId, peakIntensity: impact.peakIntensity,
          peakAboveFloor, avgIntensity: impact.avgIntensity, durationMs: impact.durationMs,
          packetCount: impact.packetCount, side: matchSide, hitType: equipType,
          threshold: pointMin, decision: 'IGNORED', scored: false,
        };
        shadowLogRef.current.push(entry);
        if (shadowLogRef.current.length > MAX_SHADOW_LOG) {
          shadowLogRef.current = shadowLogRef.current.slice(-MAX_SHADOW_LOG);
        }
        debugIgnoredCountRef.current++;
        setDebugCounts(c => ({ ...c, impacts: debugImpactCountRef.current, ignored: debugIgnoredCountRef.current }));
        console.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} hitMin=${hitMin} pointMin=${pointMin} -> IGNORED (${equipType}/${matchSide}) [ignored=${debugIgnoredCountRef.current}]`);
        return;
      }
      
      const antiDupMs = config.antiDuplicateWindowMs ?? 300;
      const now = impact.ts;
      
      // ─── Anti-duplicate per deviceId (legacy: 300ms per sensor, discard entire impact) ───
      const lastTs = lastAcceptedTsRef.current.get(impact.deviceId) ?? 0;
      if (now - lastTs < antiDupMs) {
        const entry: ShadowLogEntry = {
          ts: now, deviceId: impact.deviceId, peakIntensity: impact.peakIntensity,
          peakAboveFloor, avgIntensity: impact.avgIntensity, durationMs: impact.durationMs,
          packetCount: impact.packetCount, side: matchSide, hitType: equipType,
          threshold: pointMin, decision: 'DUPLICATE', scored: false,
        };
        shadowLogRef.current.push(entry);
        if (shadowLogRef.current.length > MAX_SHADOW_LOG) {
          shadowLogRef.current = shadowLogRef.current.slice(-MAX_SHADOW_LOG);
        }
        console.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} pointMin=${pointMin} -> DUPLICATE (${equipType}/${matchSide})`);
        return;
      }
      
      // ─── Classification: POINT or HIT (no IGNORED — ImpactDetector already filters noise) ───
      const isPoint = impact.peakIntensity >= pointMin;
      const decision: ShadowLogEntry['decision'] = isPoint ? 'POINT' : 'HIT';
      
      console.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} pointMin=${pointMin} -> ${decision} (${equipType}/${matchSide})`);
      
      const entry: ShadowLogEntry = {
        ts: now, deviceId: impact.deviceId, peakIntensity: impact.peakIntensity,
        peakAboveFloor, avgIntensity: impact.avgIntensity, durationMs: impact.durationMs,
        packetCount: impact.packetCount, side: matchSide, hitType: equipType,
        threshold: pointMin, decision, scored: isPoint,
      };
      
      shadowLogRef.current.push(entry);
      if (shadowLogRef.current.length > MAX_SHADOW_LOG) {
        shadowLogRef.current = shadowLogRef.current.slice(-MAX_SHADOW_LOG);
      }
      
      // Always accept timestamp (no more IGNORED)
      lastAcceptedTsRef.current.set(impact.deviceId, now);
      
      // Mutually exclusive: POINT increments score only, HIT increments hit counter only
      if (isPoint) {
        debugScoredCountRef.current++;
        setDebugCounts(c => ({ ...c, impacts: debugImpactCountRef.current, scored: debugScoredCountRef.current }));
        const scoreType: ScoreType = isHelmet ? 'HEAD' : 'BODY';
        sync.addScore(matchSide, scoreType);
        play(matchSide === 'BLUE' ? 'scoreBlue' : 'scoreRed');
        console.log(`[IMPACT] ★ SCORED! dev=${impact.deviceId} peak=${impact.peakIntensity} type=${scoreType} side=${matchSide} [scored=${debugScoredCountRef.current}]`);
      } else {
        sync.addHit(matchSide);
      }
    };
  }, [sync.state.status, sync.state.config, sync.addScore, sync.addHit, sync.broadcastRaw]);
  
  const handleImpact = useCallback((impact: ImpactCallbackData) => {
    handleImpactRef.current(impact);
  }, []);
  
  // Export shadow log
  const handleExportShadowLog = useCallback(() => {
    const data = JSON.stringify(shadowLogRef.current, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow-log-${new Date().toISOString().slice(0, 16).replace('T', '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);
  
  // Forward raw packets to hardware test overlay when active
  const showHardwareTestRef = useRef(showHardwareTest);
  useEffect(() => { showHardwareTestRef.current = showHardwareTest; }, [showHardwareTest]);

  const handleOpenHardwareTest = useCallback(() => {
    setShowHardwareTest(true);
    // Broadcast to TV
    sync.broadcastRaw({
      type: 'SHOW_HARDWARE_TEST',
      payload: {
        athleteBlue: sync.state.config.athleteBlue?.name,
        athleteRed: sync.state.config.athleteRed?.name,
      },
    });
  }, [sync]);

  const handleCloseHardwareTest = useCallback(() => {
    setShowHardwareTest(false);
    // Broadcast to TV to go back to scoreboard
    sync.broadcastRaw({ type: 'HIDE_HARDWARE_TEST' });
  }, [sync]);

  const handleRegisterHwTestCallback = useCallback((cb: (hit: HardwareTestHit) => void) => {
    hwTestHitCallbackRef.current = cb;
  }, []);

  // Hardware diagnostics
  const diagnostics = useHardwareDiagnostics({
    storageKey: 'sulsport:championship:diag:v1'
  });
  
  // Always impacts mode — no RAW path
  const impactThresholds = sync.state.config.impactThresholds;
  
  // ─── Serial Port from global context ───
  const { 
    serialPort, 
    registerKickHandler, unregisterKickHandler,
    registerImpactHandler, unregisterImpactHandler,
    registerRawPacketHandler, unregisterRawPacketHandler,
    setImpactDetectorConfig,
  } = useSerialPortContext();
  
  // Stabilize impactDetectorConfig to avoid re-creating on every render (timer runs every 100ms)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const noiseFloorJson = JSON.stringify(impactThresholds?.noiseFloor ?? {});
  const impactDetectorConfigMemo = useMemo(() => {
    const vestHit = impactThresholds?.vestHitMin ?? 15;
    const helmetHit = impactThresholds?.helmetHitMin ?? 5;
    return {
      enabled: true as const,
      noiseFloor: impactThresholds?.noiseFloor ?? {},
      noiseIntensityMin: 1, // Let startThreshold + hitMin handle real filtering
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noiseFloorJson, impactThresholds?.vestHitMin, impactThresholds?.helmetHitMin]);

  // Debug: log when impactDetectorConfig changes
  useEffect(() => {
    console.log('[ChampionshipMat] impactDetectorConfig changed:', impactDetectorConfigMemo);
  }, [impactDetectorConfigMemo]);

  // Register handlers and impact detector config on mount
  useEffect(() => {
    registerKickHandler(handleHardwareKick);
    registerImpactHandler(handleImpact);
    registerRawPacketHandler(diagnostics.onRawPacket);
    setImpactDetectorConfig(impactDetectorConfigMemo);
    
    return () => {
      unregisterKickHandler();
      unregisterImpactHandler();
      unregisterRawPacketHandler();
      setImpactDetectorConfig(null); // Disable impact detector when leaving championship
      serialPort.setPassThroughMode(false); // Reset pass-through mode on unmount
    };
  }, [
    handleHardwareKick, handleImpact, diagnostics.onRawPacket, impactDetectorConfigMemo,
    registerKickHandler, unregisterKickHandler,
    registerImpactHandler, unregisterImpactHandler,
    registerRawPacketHandler, unregisterRawPacketHandler,
    setImpactDetectorConfig,
  ]);
  
  // ─── Detector diagnostics polling (500ms) ───
  const getDetectorDiagRef = useRef(serialPort.getDetectorDiag);
  getDetectorDiagRef.current = serialPort.getDetectorDiag;
  useEffect(() => {
    if (!serialPort.isConnected) return;
    const iv = setInterval(() => {
      const d = getDetectorDiagRef.current();
      setDetectorDiag({
        rejected: d.rejected, active: d.active,
        lastInt: d.lastInt, lastDev: d.lastDev,
        nim: d.config.noiseIntensityMin, dS: d.config.deltaStart,
        pt: d.config.passThroughMode,
      });
    }, 500);
    return () => clearInterval(iv);
  }, [serialPort.isConnected]);

  // ─── Auto-pause when USB disconnects during RUNNING match ───
  useEffect(() => {
    if (!serialPort.isConnected && sync.state.status === 'RUNNING') {
      sync.pauseTimer();
      console.warn('[ChampMat] USB disconnected during RUNNING — auto-paused');
    }
  }, [serialPort.isConnected, sync.state.status, sync.pauseTimer]);

  // ─── Unlock audio + preload on mount ───
  useEffect(() => {
    unlockAudio();
    initFullPreload();
  }, [unlockAudio, initFullPreload]);
  
  // ─── Sound effects on status change ───
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = sync.state.status;
    prevStatusRef.current = curr;
    
    if (prev === curr) return;
    
    if (curr === 'RUNNING' && (prev === 'IDLE' || prev === 'PAUSED' || prev === 'ROUND_END')) {
      play('roundStart');
    }
    if (curr === 'ROUND_END' || curr === 'MATCH_END') {
      play('timeUp');
    }

    // Reset recording flag when starting a new match
    if (curr === 'IDLE' || curr === 'RUNNING') {
      matchResultRecordedRef.current = false;
    }
  }, [sync.state.status, play]);

  // ─── Tournament: auto-record match result on MATCH_END ───
  useEffect(() => {
    if (sync.state.status !== 'MATCH_END') return;
    if (!hasTournament || matchResultRecordedRef.current) return;
    if (!tournamentHook.tournament?.currentCategoryId || !tournamentHook.tournament?.currentMatchId) return;

    const winnerSide: 'RED' | 'BLUE' = sync.state.roundWinsRed > sync.state.roundWinsBlue ? 'RED' : 'BLUE';
    tournamentHook.recordMatchResult(
      tournamentHook.tournament.currentCategoryId,
      tournamentHook.tournament.currentMatchId,
      winnerSide,
    );
    matchResultRecordedRef.current = true;

    // Broadcast bracket view to TV
    sync.broadcastRaw({ type: 'SHOW_BRACKET', payload: { categoryId: tournamentHook.tournament.currentCategoryId } });
  }, [sync.state.status, hasTournament, tournamentHook, sync]);
  
  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      // Ignore when focus is on form elements
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) return;
      // Ignore when any dialog is open
      if (showConfigDialog || showResetDialog || showHelpDialog || showExitDialog) return;

      const status = sync.state.status;

      // ─── Score key mapping: 1-5 ───
      const scoreKeyMap: Record<string, ScoreType> = {
        'Digit1': 'PUNCH',
        'Digit2': 'BODY',
        'Digit3': 'HEAD',
        'Digit4': 'SPIN_BODY',
        'Digit5': 'SPIN_HEAD',
      };

      // ─── SCORING: 1-5 = BLUE, Shift+1-5 = RED (only when RUNNING) ───
      if (status === 'RUNNING' && scoreKeyMap[e.code] && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const scoreType = scoreKeyMap[e.code];
        const side: MatchSide = e.shiftKey ? 'RED' : 'BLUE';
        sync.addScore(side, scoreType);
        play(side === 'BLUE' ? 'scoreBlue' : 'scoreRed');
        return;
      }

      // ─── GAM-JEOM: F1/F2 = add, Shift+F1/F2 = remove (when RUNNING or PAUSED) ───
      if ((status === 'RUNNING' || status === 'PAUSED') && (e.code === 'F1' || e.code === 'F2')) {
        e.preventDefault();
        const side: MatchSide = e.code === 'F1' ? 'BLUE' : 'RED';
        if (e.shiftKey) {
          sync.removeGamjeom(side);
        } else {
          sync.addGamjeom(side);
        }
        return;
      }

      // ─── Space / Enter: toggle pause/resume ───
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (status === 'RUNNING') {
          sync.pauseTimer();
        } else if (status === 'IDLE' || status === 'PAUSED') {
          sync.startTimer();
        }
        return;
      }

      // ─── Escape: pause or close hardware test ───
      if (e.code === 'Escape') {
        e.preventDefault();
        if (showHardwareTest) {
          handleCloseHardwareTest();
        } else if (status === 'RUNNING') {
          sync.pauseTimer();
        }
        return;
      }

      // ─── N: next round (when ROUND_END) ───
      if (e.code === 'KeyN' && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        if (status === 'ROUND_END') {
          e.preventDefault();
          sync.nextRound();
        }
        return;
      }

      // ─── M: toggle medical time ───
      if (e.code === 'KeyM' && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        if (status === 'RUNNING' || status === 'PAUSED') {
          e.preventDefault();
          if (sync.state.isMedicalTime) {
            sync.endMedicalTime();
          } else {
            sync.startMedicalTime();
          }
        }
        return;
      }

      // ─── Ctrl+Z: undo last action ───
      if (e.ctrlKey && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        sync.undoLast();
        return;
      }

      // ─── Ctrl+Shift+D: toggle debug overlay ───
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        setShowDebugOverlay(prev => !prev);
        return;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sync, showHardwareTest, handleCloseHardwareTest, showConfigDialog, showResetDialog, showHelpDialog, showExitDialog, play]);
  
  const handleOpenTV = async () => {
    // Electron: use IPC to open TV on second display
    if (window.electronAPI?.openTVWindow) {
      try {
        const result = await window.electronAPI.openTVWindow(matId);
        if (result.success) {
          setIsTVOpen(true);
          console.log(`[TV] Opened on display ${result.display}, secondary: ${result.isSecondary}`);
        }
      } catch (err) {
        console.error('[TV] Failed to open via IPC:', err);
      }
    } else {
      // Browser fallback: window.open
      tvWindowRef.current = window.open(
        `${window.location.origin}${window.location.pathname}#/championship/tv?mat=${matId}`,
        `championship-tv-${matId}`,
        'width=1920,height=1080'
      );
      if (tvWindowRef.current) {
        setIsTVOpen(true);
      }
    }
  };
  
  // Detect when TV window is closed (IPC or polling fallback)
  useEffect(() => {
    if (!isTVOpen) return;

    // Electron: listen for IPC close event
    if (window.electronAPI?.onTVWindowClosed) {
      const cleanup = window.electronAPI.onTVWindowClosed(() => {
        setIsTVOpen(false);
        tvWindowRef.current = null;
      });
      return cleanup;
    }

    // Browser fallback: poll
    if (!tvWindowRef.current) return;
    const checkClosed = setInterval(() => {
      if (tvWindowRef.current?.closed) {
        setIsTVOpen(false);
        tvWindowRef.current = null;
      }
    }, 1000);
    return () => clearInterval(checkClosed);
  }, [isTVOpen]);
  
  const handleSaveConfig = (config: MatchConfig) => {
    sync.saveConfig(config);
  };
  
  const isConfigLocked = sync.state.status === 'RUNNING';

  // ─── Tournament: next match handler ───
  const handleNextMatch = useCallback(() => {
    if (!tournamentHook.tournament) return;
    // Find next ready match in tournament
    for (const cat of tournamentHook.tournament.categories) {
      const next = getNextReadyMatch(cat.bracket);
      if (next) {
        // Pre-fill config with next match's athletes
        const currentConfig = sync.state.config;
        sync.saveConfig({
          ...currentConfig,
          athleteRed: next.athleteRed ? { id: next.athleteRed.id || '', name: next.athleteRed.name, country: next.athleteRed.country } : undefined,
          athleteBlue: next.athleteBlue ? { id: next.athleteBlue.id || '', name: next.athleteBlue.name, country: next.athleteBlue.country } : undefined,
        });
        // Broadcast scoreboard mode to TV
        sync.broadcastRaw({ type: 'SHOW_SCOREBOARD' });
        return;
      }
    }
  }, [tournamentHook.tournament, sync]);

  const handleGoToTournament = useCallback(() => {
    navigate('/championship/tournament');
  }, [navigate]);

  const handleOverrideWinner = useCallback(() => {
    // Simple: flip the winner in the tournament bracket
    if (!tournamentHook.tournament?.currentCategoryId || !tournamentHook.tournament?.currentMatchId) return;
    const newWinner: 'RED' | 'BLUE' = sync.state.roundWinsRed > sync.state.roundWinsBlue ? 'BLUE' : 'RED';
    tournamentHook.overrideMatchWinner(
      tournamentHook.tournament.currentCategoryId,
      tournamentHook.tournament.currentMatchId,
      newWinner,
    );
  }, [tournamentHook, sync.state.roundWinsRed, sync.state.roundWinsBlue]);

  const isTie = sync.state.status === 'ROUND_END' &&
                sync.state.roundScoreRed === sync.state.roundScoreBlue &&
                sync.state.hitsRed === sync.state.hitsBlue;
  
  return (
    <div className="h-screen flex bg-[hsl(var(--sulsport-black))]">
      {/* DEBUG overlay — only visible with Ctrl+Shift+D toggle */}
      {showDebugOverlay && (
      <div className="fixed bottom-2 left-2 z-[9999] bg-black/90 text-[10px] font-mono text-white px-2 py-1 rounded border border-yellow-500/50 space-y-0.5">
        <div>RAW: <span className="text-yellow-300">{serialPort.lastRawLine || '---'}</span></div>
        <div>PKT: <span className="text-cyan-400">{serialPort.rawPacketCount}</span> FEED: <span className="text-cyan-300">i={detectorDiag.lastInt} d={detectorDiag.lastDev}</span></div>
        <div>REJ: <span className={detectorDiag.rejected > 0 ? "text-red-400" : "text-green-400"}>{detectorDiag.rejected}</span> ACT: <span className="text-cyan-400">{detectorDiag.active}</span></div>
        <div>IMP: <span className={debugCounts.impacts > 0 ? "text-green-400" : "text-red-400"}>{debugCounts.impacts}</span> SCR: <span className={debugCounts.scored > 0 ? "text-green-400" : "text-yellow-400"}>{debugCounts.scored}</span></div>
        <div>IGN: <span className="text-orange-400">{debugCounts.ignored}</span> !RUN: <span className="text-red-400">{debugCounts.notRunning}</span></div>
        <div>NIM:{detectorDiag.nim} dS:{detectorDiag.dS} ST: <span className="text-purple-400">{sync.state.status}</span></div>
        <button
          className="text-[9px] px-1 rounded border pointer-events-auto"
          style={{ borderColor: detectorDiag.pt ? '#f00' : '#666', color: detectorDiag.pt ? '#f00' : '#888' }}
          onClick={() => serialPort.setPassThroughMode(!detectorDiag.pt)}
          aria-label={`Pass-through mode: ${detectorDiag.pt ? 'ativado' : 'desativado'}`}
        >
          PT:{detectorDiag.pt ? 'ON' : 'off'}
        </button>
      </div>
      )}

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header (h-10) */}
        <header className="h-10 shrink-0 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center justify-between px-4 relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (sync.state.status === 'RUNNING') {
                  setShowExitDialog(true);
                } else {
                  navigate('/professional');
                }
              }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Voltar"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowHelpDialog(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Guia de Ajuda"
              aria-label="Guia de Ajuda"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {/* Hardware activity flash indicator */}
            {hwFlash && (
              <span className={cn(
                "px-1.5 py-0.5 rounded font-black text-[10px] uppercase animate-pulse",
                hwFlash === 'red' ? "bg-red-500/40 text-red-300" : "bg-blue-500/40 text-blue-300",
              )}>
                {hwFlash === 'red' ? 'VERM' : 'AZUL'}
              </span>
            )}
            <button
              onClick={() => {
                if (!serialPort.isConnected) {
                  serialPort.connect();
                }
              }}
              className={cn(
                "px-1.5 py-0.5 rounded font-bold text-[10px] uppercase transition-colors",
                serialPort.isConnected
                  ? "bg-green-500/20 text-green-400 cursor-default"
                  : serialPort.isConnecting
                  ? "bg-amber-500/20 text-amber-400 animate-pulse cursor-wait"
                  : "bg-yellow-600/80 text-black hover:bg-yellow-500 cursor-pointer"
              )}
              title={serialPort.isConnected ? 'USB Conectado' : 'Clique para conectar USB'}
              aria-label={serialPort.isConnected ? 'USB Conectado' : serialPort.isConnecting ? 'Conectando USB' : 'Conectar USB'}
            >
              {serialPort.isConnecting ? 'USB...' : serialPort.isConnected ? 'USB' : 'USB OFF'}
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
            {hasTournament && tournamentHook.tournament ? (
              <TournamentHeader tournament={tournamentHook.tournament} />
            ) : (
              <img src={logoSpe} alt="SPE" className="h-6 w-auto object-contain" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(
              "px-1.5 py-0.5 rounded font-bold text-[10px] uppercase",
              sync.state.status === 'RUNNING'
                ? "bg-green-500/20 text-green-500"
                : sync.state.status === 'MATCH_END'
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-zinc-700 text-zinc-400"
            )}>
              {sync.state.status === 'IDLE' && 'PRONTO'}
              {sync.state.status === 'RUNNING' && 'EM ANDAMENTO'}
              {sync.state.status === 'PAUSED' && 'PAUSADO'}
              {sync.state.status === 'MEDICAL' && 'TEMPO MÉDICO'}
              {sync.state.status === 'ROUND_END' && 'FIM DO ROUND'}
              {sync.state.status === 'MATCH_END' && 'FIM DA LUTA'}
            </span>
            <span className="text-zinc-400 font-bold text-[10px]">
              R{sync.state.round}/{sync.state.config.maxRounds}
            </span>
            {sync.connectedDevices > 1 && (
              <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-blue-500/20 text-blue-400 flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                {sync.connectedDevices}
              </span>
            )}
          </div>
        </header>

        {/* Blocked impact warning */}
        {blockedImpactWarning && serialPort.isConnected && sync.state.status !== 'RUNNING' && (
          <div className="shrink-0 bg-orange-500/20 border-b border-orange-500/40 px-4 py-1.5 flex items-center justify-center gap-3 animate-in fade-in duration-200">
            <span className="text-orange-300 font-bold text-xs uppercase">
              Impacto detectado! Inicie a luta (SPACE) para pontuar
            </span>
          </div>
        )}

        {/* Scoreboard — fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScoreboardMain state={sync.state} onResetMatch={() => setShowResetDialog(true)} />
        </div>

        {/* Tie Decision — conditional */}
        {isTie && (
          <div className="shrink-0 bg-[hsl(var(--sulsport-yellow))]/10 border-y border-[hsl(var(--sulsport-yellow))]/30 p-4">
            <div className="text-center mb-3">
              <span className="text-lg font-bold text-[hsl(var(--sulsport-yellow))] uppercase">
                EMPATE — Declarar Vencedor do Round
              </span>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => sync.declareRoundWinner('BLUE')}
                className="bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md">
                VITÓRIA AZUL
              </Button>
              <Button onClick={() => sync.declareRoundWinner('RED')}
                className="bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md">
                VITÓRIA VERMELHO
              </Button>
            </div>
          </div>
        )}

        {/* Scoring Buttons */}
        <div className="shrink-0">
          <ScoringButtons
            state={sync.state}
            onScore={sync.addScore}
            onAddGamjeom={sync.addGamjeom}
            onRemoveGamjeom={sync.removeGamjeom}
            onUndo={sync.undoLast}
            canUndo={sync.canUndo}
          />
        </div>

        {/* Tournament NextMatchBar */}
        {hasTournament && tournamentHook.tournament && sync.state.status === 'MATCH_END' && (
          <div className="shrink-0">
            <NextMatchBar
              tournament={tournamentHook.tournament}
              currentMatchWinnerSide={sync.state.roundWinsRed > sync.state.roundWinsBlue ? 'RED' : 'BLUE'}
              onNextMatch={handleNextMatch}
              onOverrideWinner={handleOverrideWinner}
              onGoToTournament={handleGoToTournament}
            />
          </div>
        )}
      </main>

      {/* Sidebar — RIGHT PANEL */}
      <OperatorPanel
        state={sync.state}
        actions={sync}
        onOpenTV={handleOpenTV}
        serialPort={serialPort}
        diagnostics={diagnostics}
        onOpenConfig={() => setShowConfigDialog(true)}
        matId={matId}
        academyId={user?.id}
        onExportShadowLog={handleExportShadowLog}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenHardwareTest={handleOpenHardwareTest}
        isTVOpen={isTVOpen}
      />

      {/* Config Dialog */}
      <MatchConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        currentConfig={sync.state.config}
        onSave={handleSaveConfig}
        isLocked={isConfigLocked}
      />

      {/* Reset Match Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Nova Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação resetará todos os placares e iniciará uma nova luta. As configurações serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                sync.resetMatch();
                setShowResetDialog(false);
              }}
              className="bg-yellow-600 hover:bg-yellow-500 text-black"
            >
              Iniciar Nova Luta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-[hsl(var(--sulsport-dark))] border-[hsl(var(--sulsport-gray))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Sair da Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              A luta está em andamento. Se sair agora, o progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600">
              Continuar Luta
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate('/professional')}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Dialog */}
      <HelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />

      {/* Hardware Test Overlay */}
      {showHardwareTest && (
        <HardwareTestOverlay
          onClose={handleCloseHardwareTest}
          onRegisterHitCallback={handleRegisterHwTestCallback}
          athleteBlue={sync.state.config.athleteBlue?.name}
          athleteRed={sync.state.config.athleteRed?.name}
        />
      )}
    </div>
  );
}

// Re-export directly — SoundProvider is already in App.tsx
export default ChampionshipMatInner;
