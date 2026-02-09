import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { useSerialPort } from '@/hooks/useSerialPort';
import { useHardwareDiagnostics } from '@/hooks/useHardwareDiagnostics';
import { useSound } from '@/contexts/SoundContext';
import { OperatorPanel } from '@/components/championship/OperatorPanel';
import { ScoreboardMain } from '@/components/championship/ScoreboardMain';
import { ScoringButtons } from '@/components/championship/ScoringButtons';
import { EventLog } from '@/components/championship/EventLog';
import { MatchConfigDialog } from '@/components/championship/MatchConfigDialog';
import { HelpDialog } from '@/components/championship/HelpDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import logoSpe from '@/assets/logo-spe-branca.png';
import { deviceIdToMatchSide, deviceIdToEquipmentType } from '@/lib/deviceMapping';
import type { Side, HitType } from '@/types/game';
import type { MatchSide, ScoreType, MatchConfig } from '@/types/championship';
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
  decision: 'HIT' | 'POINT' | 'DUPLICATE';
  threshold: number;
  scored: boolean;
}

const MAX_SHADOW_LOG = 500;

function ChampionshipMatInner() {
  const matId = 1;
  
  const sync = useChampionshipSync({ role: 'master', matId });
  const { play, isMuted, toggleMute, unlockAudio, initFullPreload } = useSound();
  const prevStatusRef = useRef(sync.state.status);
  const [isTVOpen, setIsTVOpen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const tvWindowRef = useRef<Window | null>(null);
  
  // Shadow log for impact scoring
  const shadowLogRef = useRef<ShadowLogEntry[]>([]);
  
  // Anti-duplicate tracking per deviceId (legacy logic: 300ms per sensor)
  const lastAcceptedTsRef = useRef<Map<number, number>>(new Map());
  
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
      const config = sync.state.config;
      
      if (sync.state.status !== 'RUNNING') return;
      
      // Guard: noise should already be filtered by ImpactDetector, but double-check
      if (impact.peakIntensity < 15) return;
      
      const matchSide = deviceIdToMatchSide(impact.deviceId);
      const equipType = deviceIdToEquipmentType(impact.deviceId);
      if (!matchSide) return;
      
      const thresholds = config.impactThresholds ?? { vestPointMin: 19, helmetPointMin: 10, vestHitMin: 15, helmetHitMin: 5, noiseFloor: {} };
      const floor = thresholds.noiseFloor[String(impact.deviceId)] ?? 0;
      const peakAboveFloor = impact.peakIntensity - floor;
      
      const isHelmet = equipType === 'helmet';
      const pointMin = isHelmet ? thresholds.helmetPointMin : thresholds.vestPointMin;
      
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
        const scoreType: ScoreType = isHelmet ? 'HEAD' : 'BODY';
        sync.addScore(matchSide, scoreType);
        play('scoreBeep');
      } else {
        sync.addHit(matchSide);
      }
    };
  }, [sync.state.status, sync.state.config, sync.addScore, sync.addHit]);
  
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
  
  // Hardware diagnostics
  const diagnostics = useHardwareDiagnostics({ 
    storageKey: 'sulsport:championship:diag:v1' 
  });
  
  // Always impacts mode — no RAW path
  const impactThresholds = sync.state.config.impactThresholds;
  
  // Stabilize impactDetectorConfig to avoid re-creating on every render (timer runs every 100ms)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const noiseFloorJson = JSON.stringify(impactThresholds?.noiseFloor ?? {});
  const impactDetectorConfigMemo = useMemo(() => ({
    enabled: true as const,
    noiseFloor: impactThresholds?.noiseFloor ?? {},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [noiseFloorJson]);

  // Debug: log when impactDetectorConfig changes
  useEffect(() => {
    console.log('[ChampionshipMat] impactDetectorConfig changed:', impactDetectorConfigMemo);
  }, [impactDetectorConfigMemo]);

  const serialPort = useSerialPort({
    onKick: handleHardwareKick,
    onRawPacket: diagnostics.onRawPacket,
    onImpact: handleImpact,
    debounceMs: 150,
    impactDetectorConfig: impactDetectorConfigMemo,
  });
  
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
  }, [sync.state.status, play]);
  
  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        const status = sync.state.status;
        if (status === 'RUNNING') {
          sync.pauseTimer();
        } else if (status === 'IDLE' || status === 'PAUSED') {
          sync.startTimer();
        }
      }
      if (e.code === 'Escape') {
        if (sync.state.status === 'RUNNING') {
          sync.pauseTimer();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sync]);
  
  const handleOpenTV = () => {
    tvWindowRef.current = window.open(
      `/championship/tv?mat=${matId}`, 
      `championship-tv-${matId}`,
      'width=1920,height=1080'
    );
    if (tvWindowRef.current) {
      setIsTVOpen(true);
    }
  };
  
  // Polling to detect when TV window is closed
  useEffect(() => {
    if (!isTVOpen || !tvWindowRef.current) return;
    
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
  
  const isTie = sync.state.status === 'ROUND_END' && 
                sync.state.roundScoreRed === sync.state.roundScoreBlue &&
                sync.state.hitsRed === sync.state.hitsBlue;
  
  return (
    <div className="h-screen flex bg-[hsl(var(--sulsport-black))]">
      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center justify-center relative px-6">
          <button
            onClick={() => setShowHelpDialog(true)}
            className="absolute left-6 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Guia de Ajuda"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <img src={logoSpe} alt="SPE" className="h-8 w-auto object-contain" />
          <div className="absolute right-6 flex items-center gap-4 text-sm">
            <span className="px-2 py-1 rounded-md font-bold text-xs uppercase bg-purple-500/20 text-purple-400">
              IMPACTOS
            </span>
            <span className={cn(
              "px-2 py-1 rounded-md font-bold text-xs uppercase",
              serialPort.isConnected 
                ? "bg-green-500/20 text-green-400" 
                : "bg-zinc-700 text-zinc-500"
            )}>
              {serialPort.isConnected ? 'USB' : 'USB OFF'}
            </span>
            <span className={cn(
              "px-2 py-1 rounded-md font-bold uppercase",
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
            <span className="text-zinc-400 font-bold">
              ROUND {sync.state.round}/{sync.state.config.maxRounds}
            </span>
          </div>
        </header>
        
        {/* Scoreboard */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScoreboardMain 
            state={sync.state} 
            onResetMatch={() => setShowResetDialog(true)}
          />
        </div>
        
        {/* Tie Decision */}
        {isTie && (
          <div className="shrink-0 bg-[hsl(var(--sulsport-yellow))]/10 border-y border-[hsl(var(--sulsport-yellow))]/30 p-4">
            <div className="text-center mb-3">
              <span className="text-lg font-bold text-[hsl(var(--sulsport-yellow))] uppercase">
                EMPATE — Declarar Vencedor do Round
              </span>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => sync.declareRoundWinner('BLUE')}
                className="bg-[hsl(var(--sulsport-blue))] hover:bg-[hsl(var(--sulsport-blue-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md"
              >
                VITÓRIA AZUL
              </Button>
              <Button
                onClick={() => sync.declareRoundWinner('RED')}
                className="bg-[hsl(var(--sulsport-red))] hover:bg-[hsl(var(--sulsport-red-light))] text-white px-8 py-6 text-lg font-bold uppercase rounded-md"
              >
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
          />
        </div>
        
        {/* Event Log */}
        <div className="shrink-0">
          <EventLog 
            events={sync.state.events}
            onUndo={sync.undoLast}
            canUndo={sync.canUndo}
          />
        </div>
      </main>
      
      {/* Operator Panel (Right Sidebar) */}
      <OperatorPanel
        state={sync.state}
        actions={sync}
        onOpenTV={handleOpenTV}
        isTVOpen={isTVOpen}
        serialPort={serialPort}
        diagnostics={diagnostics}
        onOpenConfig={() => setShowConfigDialog(true)}
        scoringInput="impacts"
        onExportShadowLog={handleExportShadowLog}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onThresholdsApplied={(t: HardwareThresholds) => {
          console.log('[Championship] Applying wizard thresholds to match config:', t, '— switching scoringInput to impacts');
          sync.updateConfigInPlace(config => ({
            ...config,
            scoringInput: 'impacts',
            impactThresholds: {
              ...config.impactThresholds,
              vestHitMin: t.vestHitMin,
              vestPointMin: t.vestPointMin,
              helmetHitMin: t.helmetHitMin,
              helmetPointMin: t.helmetPointMin,
              noiseFloor: diagnostics.noiseFloor,
            },
          }));
        }}
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
      
      {/* Help Dialog */}
      <HelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />
    </div>
  );
}

// Re-export directly — SoundProvider is already in App.tsx
export default ChampionshipMatInner;
