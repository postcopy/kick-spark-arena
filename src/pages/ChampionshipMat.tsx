import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { useSerialPort } from '@/hooks/useSerialPort';
import { useHardwareDiagnostics } from '@/hooks/useHardwareDiagnostics';
import { OperatorPanel } from '@/components/championship/OperatorPanel';
import { ScoreboardMain } from '@/components/championship/ScoreboardMain';
import { ScoringButtons } from '@/components/championship/ScoringButtons';
import { EventLog } from '@/components/championship/EventLog';
import { MatchConfigDialog } from '@/components/championship/MatchConfigDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  decision: 'IGNORED' | 'HIT' | 'POINT' | 'DUPLICATE';
  threshold: number;
  scored: boolean;
}

const MAX_SHADOW_LOG = 500;

export default function ChampionshipMat() {
  const matId = 1;
  
  const sync = useChampionshipSync({ role: 'master', matId });
  const [isTVOpen, setIsTVOpen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
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
  
  // ─── Legacy onKick handler (RAW mode) ───
  const handleHardwareKickRef = useRef<(side: Side, hitType: HitType) => void>(() => {});
  
  useEffect(() => {
    handleHardwareKickRef.current = (side: Side, hitType: HitType) => {
      // Block raw scoring when in IMPACTS mode — only ImpactDetector should score
      if (sync.state.config.scoringInput === 'impacts') return;
      console.log('[Championship] Kick:', side, hitType, 'status:', sync.state.status);
      if (sync.state.status !== 'RUNNING') return;
      const matchSide: MatchSide = side === 'red' ? 'RED' : 'BLUE';
      const scoreType: ScoreType = hitType === 'helmet' ? 'HEAD' : 'BODY';
      sync.addScore(matchSide, scoreType);
    };
  }, [sync.state.status, sync.addScore]);
  
  const handleHardwareKick = useCallback((side: Side, hitType: HitType) => {
    handleHardwareKickRef.current(side, hitType);
  }, []);
  
  // ─── Impact handler (IMPACTS mode) ───
  const handleImpactRef = useRef<(impact: ImpactCallbackData) => void>(() => {});
  
  useEffect(() => {
    handleImpactRef.current = (impact: ImpactCallbackData) => {
      if (sync.state.status !== 'RUNNING') return;
      
      const config = sync.state.config;
      if (config.scoringInput !== 'impacts' || !config.impactThresholds) return;
      
      const matchSide = deviceIdToMatchSide(impact.deviceId);
      const equipType = deviceIdToEquipmentType(impact.deviceId);
      if (!matchSide) return;
      
      const thresholds = config.impactThresholds;
      const floor = thresholds.noiseFloor[String(impact.deviceId)] ?? 0;
      const peakAboveFloor = impact.peakIntensity - floor; // kept for diagnostics only
      
      const isHelmet = equipType === 'helmet';
      const pointMin = isHelmet ? thresholds.helmetPointMin : thresholds.vestPointMin;
      const hitMin = isHelmet ? thresholds.helmetHitMin : thresholds.vestHitMin;
      
      const antiDupMs = config.antiDuplicateWindowMs ?? 300;
      const now = impact.ts;
      
      // ─── Anti-duplicate per deviceId (legacy: 300ms per sensor, discard entire impact) ───
      const lastTs = lastAcceptedTsRef.current.get(impact.deviceId) ?? 0;
      if (now - lastTs < antiDupMs) {
        const entry: ShadowLogEntry = {
          ts: now, deviceId: impact.deviceId, peakIntensity: impact.peakIntensity,
          peakAboveFloor, avgIntensity: impact.avgIntensity, durationMs: impact.durationMs,
          packetCount: impact.packetCount, side: matchSide, hitType: equipType,
          threshold: hitMin, decision: 'DUPLICATE', scored: false,
        };
        shadowLogRef.current.push(entry);
        if (shadowLogRef.current.length > MAX_SHADOW_LOG) {
          shadowLogRef.current = shadowLogRef.current.slice(-MAX_SHADOW_LOG);
        }
        console.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} hitMin=${hitMin} pointMin=${pointMin} -> DUPLICATE (${equipType}/${matchSide})`);
        return;
      }
      
      // ─── Classification using absolute peakIntensity (legacy logic) ───
      let decision: ShadowLogEntry['decision'];
      let thresholdUsed: number;
      if (impact.peakIntensity >= pointMin) {
        decision = 'POINT';
        thresholdUsed = pointMin;
      } else if (impact.peakIntensity >= hitMin) {
        decision = 'HIT';
        thresholdUsed = hitMin;
      } else {
        decision = 'IGNORED';
        thresholdUsed = hitMin;
      }
      
      console.log(`[IMPACT] dev=${impact.deviceId} peak=${impact.peakIntensity} hitMin=${hitMin} pointMin=${pointMin} -> ${decision} (${equipType}/${matchSide})`);
      
      const scored = decision === 'POINT';
      const entry: ShadowLogEntry = {
        ts: now, deviceId: impact.deviceId, peakIntensity: impact.peakIntensity,
        peakAboveFloor, avgIntensity: impact.avgIntensity, durationMs: impact.durationMs,
        packetCount: impact.packetCount, side: matchSide, hitType: equipType,
        threshold: thresholdUsed, decision, scored,
      };
      
      shadowLogRef.current.push(entry);
      if (shadowLogRef.current.length > MAX_SHADOW_LOG) {
        shadowLogRef.current = shadowLogRef.current.slice(-MAX_SHADOW_LOG);
      }
      
      // Accept timestamp for this device
      if (decision !== 'IGNORED') {
        lastAcceptedTsRef.current.set(impact.deviceId, now);
      }
      
      // Score if POINT
      if (scored) {
        const scoreType: ScoreType = isHelmet ? 'HEAD' : 'BODY';
        sync.addScore(matchSide, scoreType);
        sync.addHit(matchSide);
      }
      
      // Increment HIT counter only for HIT decisions
      if (decision === 'HIT') {
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
  
  // Determine scoring mode from config
  const scoringInput = sync.state.config.scoringInput ?? 'raw';
  const impactThresholds = sync.state.config.impactThresholds;
  
  // Stabilize impactDetectorConfig to avoid re-creating on every render (timer runs every 100ms)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const noiseFloorJson = JSON.stringify(impactThresholds?.noiseFloor ?? {});
  const impactDetectorConfigMemo = useMemo(() => {
    if (scoringInput !== 'impacts') {
      return { enabled: false as const, noiseFloor: {} };
    }
    return {
      enabled: true as const,
      noiseFloor: impactThresholds?.noiseFloor ?? {},
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoringInput, noiseFloorJson]);

  const serialPort = useSerialPort({
    onKick: handleHardwareKick,
    onRawPacket: diagnostics.onRawPacket,
    onImpact: handleImpact,
    debounceMs: 150,
    impactDetectorConfig: impactDetectorConfigMemo,
  });
  
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
                sync.state.roundScoreRed === sync.state.roundScoreBlue;
  
  return (
    <div className="h-screen flex bg-[hsl(var(--sulsport-black))]">
      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center justify-center relative px-6">
          <img src={logoSpe} alt="SPE" className="h-8 w-auto object-contain" />
          <div className="absolute right-6 flex items-center gap-4 text-sm">
            {/* Scoring mode indicator */}
            {scoringInput === 'impacts' && (
              <span className="px-2 py-1 rounded-md font-bold text-xs uppercase bg-purple-500/20 text-purple-400">
                IMPACTOS
              </span>
            )}
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
        scoringInput={scoringInput}
        onExportShadowLog={handleExportShadowLog}
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
    </div>
  );
}
