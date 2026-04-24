import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { useChampionshipPersistence } from '@/hooks/useChampionshipPersistence';
import { useSerialPortContext } from '@/contexts/SerialPortContext';
import { useHardwareDiagnostics } from '@/hooks/useHardwareDiagnostics';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { MatchConfigDialog } from '@/components/championship/MatchConfigDialog';
import { HelpDialog } from '@/components/championship/HelpDialog';
import { HardwareTestOverlay } from '@/components/championship/HardwareTestOverlay';
import { QuickMatchLayout } from '@/components/championship/QuickMatchLayout';
import { cn } from '@/lib/utils';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import logoSpe from '@/assets/logo-spe-branca.png';
import { useTournament } from '@/hooks/useTournament';
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
  const isBasicMode = searchParams.get('mode') === 'basic';

  const { user } = useAuth();
  // Use user.id as academyId, or generate a persistent device ID for non-logged-in users
  const deviceAcademyId = useMemo(() => {
    if (user?.id) return user.id;
    const stored = localStorage.getItem('sulsport:device-academy-id');
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem('sulsport:device-academy-id', id);
    return id;
  }, [user?.id]);
  const sync = useChampionshipSync({ role: 'master', matId, academyId: deviceAcademyId });
  useChampionshipPersistence(sync.state);
  const { play, isMuted, toggleMute, unlockAudio, initFullPreload } = useSound();

  // Proxy: envolve actions do sync pra tocar som KPNP automaticamente.
  // Qualquer componente que recebe `actions` toca som sem precisar saber.
  const soundActions = useMemo(() => ({
    ...sync,
    addScore: (side: MatchSide, type: ScoreType) => {
      sync.addScore(side, type);
      const isHead = type === 'HEAD' || type === 'SPIN_HEAD';
      const isPunch = type === 'PUNCH';
      play(isPunch ? 'speHitPunch' : isHead ? 'speHitHead' : 'speHitBody');
    },
    addGamjeom: (side: MatchSide) => {
      sync.addGamjeom(side);
      play('speGamjeom');
    },
    removeGamjeom: (side: MatchSide) => {
      sync.removeGamjeom(side);
      play('speGamjeomRemove');
    },
    adjustScore: (side: MatchSide, roundScore: number, gamjeom: number) => {
      const before = side === 'BLUE' ? sync.state.roundScoreBlue : sync.state.roundScoreRed;
      sync.adjustScore(side, roundScore, gamjeom);
      play(roundScore > before ? 'speManualAdd' : 'speManualRemove');
    },
    startMedicalTime: () => {
      sync.startMedicalTime();
      play('speRefereeCall');
    },
  }), [sync, play]);
  const prevStatusRef = useRef(sync.state.status);
  const [isTVOpen, setIsTVOpen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showQuickExitDialog, setShowQuickExitDialog] = useState(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const tvWindowRef = useRef<Window | null>(null);

  // Hardware Test mode
  const [showHardwareTest, setShowHardwareTest] = useState(false);
  const hwTestHitCallbackRef = useRef<((hit: HardwareTestHit) => void) | null>(null);

  // Tournament integration
  const tournamentHook = useTournament();
  const hasTournament = !isBasicMode && tournamentHook.tournament?.status === 'IN_PROGRESS';
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

  // Hub query-param handoff: open overlay/dialog once on mount based on ?openHwTest / ?openConfig
  const hubOpenHandledRef = useRef(false);
  useEffect(() => {
    if (hubOpenHandledRef.current) return;
    hubOpenHandledRef.current = true;
    if (searchParams.get('openHwTest') === '1') setShowHardwareTest(true);
    if (searchParams.get('openConfig') === '1') setShowConfigDialog(true);
  }, [searchParams]);
  
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
      logger.log(`[DEBUG-IMPACT] #${debugImpactCountRef.current} dev=${impact.deviceId} peak=${impact.peakIntensity} avg=${impact.avgIntensity} dur=${impact.durationMs}ms pkts=${impact.packetCount}`);

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
        logger.log(`[IMPACT] ⚠ MATCH NOT RUNNING (${sync.state.status}), impact from dev=${impact.deviceId} peak=${impact.peakIntensity} DISCARDED [notRunning=${debugNotRunningCountRef.current}]`);
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
      
      const thresholds = config.impactThresholds ?? { vestPointMin: 5, helmetPointMin: 3, vestHitMin: 5, helmetHitMin: 3, noiseFloor: {} };
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
        logger.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} hitMin=${hitMin} pointMin=${pointMin} -> IGNORED (${equipType}/${matchSide}) [ignored=${debugIgnoredCountRef.current}]`);
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
        logger.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} pointMin=${pointMin} -> DUPLICATE (${equipType}/${matchSide})`);
        return;
      }
      
      // ─── Classification: POINT or HIT (no IGNORED — ImpactDetector already filters noise) ───
      const isPoint = impact.peakIntensity >= pointMin;
      const decision: ShadowLogEntry['decision'] = isPoint ? 'POINT' : 'HIT';
      
      logger.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} pointMin=${pointMin} -> ${decision} (${equipType}/${matchSide})`);
      
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
        // Som KPNP especifico por tipo (head vs body)
        play(isHelmet ? 'speHitHead' : 'speHitBody');
        logger.log(`[IMPACT] ★ SCORED! dev=${impact.deviceId} peak=${impact.peakIntensity} type=${scoreType} side=${matchSide} [scored=${debugScoredCountRef.current}]`);
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
    logger.log('[ChampionshipMat] impactDetectorConfig changed:', impactDetectorConfigMemo);
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
      logger.warn('[ChampMat] USB disconnected during RUNNING — auto-paused');
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
    if (curr === 'ROUND_END') {
      play('speBoong');        // buzina curta de fim de round (KPNP)
    }
    if (curr === 'MATCH_END') {
      play('speMatchEnd');     // buzina longa de fim de luta (KPNP)
      toast.success('Luta registrada!');
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
      if (showConfigDialog || showResetDialog || showHelpDialog || showExitDialog || showQuickExitDialog) return;

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
        // Som especifico por tipo (KPNP): PUNCH→funch, BODY/SPIN_BODY→body, HEAD/SPIN_HEAD→head
        const isHead = scoreType === 'HEAD' || scoreType === 'SPIN_HEAD';
        const isPunch = scoreType === 'PUNCH';
        play(isPunch ? 'speHitPunch' : isHead ? 'speHitHead' : 'speHitBody');
        return;
      }

      // ─── GAM-JEOM: F1/F2 = add, Shift+F1/F2 = remove (when RUNNING or PAUSED) ───
      if ((status === 'RUNNING' || status === 'PAUSED') && (e.code === 'F1' || e.code === 'F2')) {
        e.preventDefault();
        const side: MatchSide = e.code === 'F1' ? 'BLUE' : 'RED';
        if (e.shiftKey) {
          sync.removeGamjeom(side);
          play('speGamjeomRemove');
        } else {
          sync.addGamjeom(side);
          play('speGamjeom');
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
            play('speRefereeCall');
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
        const result = await window.electronAPI.openTVWindow(matId, isBasicMode ? 'basic' : undefined);
        if (result.success) {
          setIsTVOpen(true);
          logger.log(`[TV] Opened on display ${result.display}, secondary: ${result.isSecondary}`);
        }
      } catch (err) {
        console.error('[TV] Failed to open via IPC:', err);
      }
    } else {
      // Browser fallback: window.open
      tvWindowRef.current = window.open(
        `${window.location.origin}${window.location.pathname}#/championship/tv?mat=${matId}${isBasicMode ? '&mode=basic' : ''}`,
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
    <div className="h-screen flex bg-wt-bg font-display">
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

      {isBasicMode ? (
        <QuickMatchLayout
          state={sync.state}
          actions={soundActions}
          serialPortConnected={serialPort.isConnected}
          serialPortConnecting={serialPort.isConnecting}
          onConnectUsb={() => { if (!serialPort.isConnected) serialPort.connect(); }}
          hwFlash={hwFlash}
          blockedImpactWarning={blockedImpactWarning && serialPort.isConnected && sync.state.status !== 'RUNNING'}
          onOpenTV={handleOpenTV}
          onOpenConfig={() => setShowConfigDialog(true)}
          onOpenHardwareTest={handleOpenHardwareTest}
          onOpenHelp={() => setShowHelpDialog(true)}
          onBack={() => {
            if (sync.state.status === 'RUNNING') setShowQuickExitDialog(true);
            else navigate(`/championship/hub?mat=${matId}&mode=basic`);
          }}
          matId={matId}
          academyId={deviceAcademyId}
          isTVOpen={isTVOpen}
          events={sync.state.events}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      ) : /* ═══════════════════════════════════════════════════════════════
             MODO COMPETIÇÃO PROFISSIONAL — mesma UI do treino +
             acréscimos específicos (TournamentHeader, tie UI, NextMatchBar)
             renderizados como overlays quando aplicável.
             Ver nota de migração: phase 1 — visual unificado; tie UI e
             NextMatchBar ficam como widgets flutuantes em vez de inline.
          ═══════════════════════════════════════════════════════════════ */ (
        <>
          <QuickMatchLayout
            competitionMode
            state={sync.state}
            actions={soundActions}
            serialPortConnected={serialPort.isConnected}
            serialPortConnecting={serialPort.isConnecting}
            onConnectUsb={() => { if (!serialPort.isConnected) serialPort.connect(); }}
            hwFlash={hwFlash}
            blockedImpactWarning={blockedImpactWarning && serialPort.isConnected && sync.state.status !== 'RUNNING'}
            onOpenTV={handleOpenTV}
            onOpenConfig={() => setShowConfigDialog(true)}
            onOpenHardwareTest={handleOpenHardwareTest}
            onOpenHelp={() => setShowHelpDialog(true)}
            onBack={() => {
              if (sync.state.status === 'RUNNING') setShowExitDialog(true);
              else navigate('/professional');
            }}
            matId={matId}
            academyId={deviceAcademyId}
            isTVOpen={isTVOpen}
            events={sync.state.events}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />

          {/* Tie Decision — overlay quando empate ao fim do round */}
          {isTie && (
            <div className="fixed inset-x-0 bottom-0 z-30 bg-wt-manual/95 backdrop-blur border-t-2 border-wt-manual p-4">
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-black mb-1">
                    Empate
                  </div>
                  <div className="text-base font-bold uppercase tracking-wider text-black">
                    Declarar vencedor do round
                  </div>
                </div>
                <div className="flex justify-center gap-[2px]">
                  <Button
                    onClick={() => sync.declareRoundWinner('BLUE')}
                    className="bg-chung hover:bg-chung-accent text-white px-10 py-5 text-base font-bold uppercase tracking-wider rounded-none border border-chung"
                  >
                    Vitória azul
                  </Button>
                  <Button
                    onClick={() => sync.declareRoundWinner('RED')}
                    className="bg-hong hover:bg-hong-accent text-white px-10 py-5 text-base font-bold uppercase tracking-wider rounded-none border border-hong"
                  >
                    Vitória vermelho
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tournament NextMatchBar — overlay no fim da luta quando em torneio */}
          {hasTournament && tournamentHook.tournament && sync.state.status === 'MATCH_END' && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-wt-manual">
              <NextMatchBar
                tournament={tournamentHook.tournament}
                currentMatchWinnerSide={sync.state.roundWinsRed > sync.state.roundWinsBlue ? 'RED' : 'BLUE'}
                onNextMatch={handleNextMatch}
                onOverrideWinner={handleOverrideWinner}
                onGoToTournament={handleGoToTournament}
              />
            </div>
          )}
        </>
      )}

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
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Nova Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary">
              Esta ação resetará todos os placares e iniciará uma nova luta. As configurações serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                sync.resetMatch();
                setShowResetDialog(false);
              }}
              className="bg-wt-warning hover:bg-wt-warning/90 text-black rounded-none uppercase tracking-wider text-xs font-bold"
            >
              Iniciar Nova Luta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-wt-fg-primary uppercase tracking-wider">Sair da Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary">
              A luta está em andamento. Se sair agora, o progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Continuar Luta
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate('/professional')}
              className="bg-wt-danger hover:bg-wt-danger/90 text-white rounded-none uppercase tracking-wider text-xs font-bold"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Confirmation Dialog — BASIC mode (goes to Hub) */}
      <AlertDialog open={showQuickExitDialog} onOpenChange={setShowQuickExitDialog}>
        <AlertDialogContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-wt-fg-primary uppercase tracking-wider">Sair da Luta?</AlertDialogTitle>
            <AlertDialogDescription className="text-wt-fg-secondary">
              A luta está em andamento. Se sair agora, o progresso será perdido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-wt-bg-tertiary border-wt-divider text-wt-fg-primary hover:bg-wt-bg-tertiary/70 rounded-none uppercase tracking-wider text-xs font-bold">
              Continuar Luta
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate(`/championship/hub?mat=${matId}&mode=basic`)}
              className="bg-wt-danger hover:bg-wt-danger/90 text-white rounded-none uppercase tracking-wider text-xs font-bold"
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
