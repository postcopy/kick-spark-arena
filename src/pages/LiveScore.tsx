import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatTime } from '@/types/championship';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoSpe from '@/assets/logo-spe-branca.png';

export default function LiveScore() {
  const [searchParams] = useSearchParams();
  const matId = parseInt(searchParams.get('mat') || '1');
  const academyId = searchParams.get('aid') || undefined;

  const handleSyncCommand = useCallback(() => {
    // No-op for mobile live view — no bracket/scoreboard switching
  }, []);

  const { state, isConnected, connectedDevices } = useChampionshipSync({
    role: 'listener',
    matId,
    academyId,
    onCommand: handleSyncCommand,
  });

  const [pulseRed, setPulseRed] = useState(false);
  const [pulseBlue, setPulseBlue] = useState(false);

  // Pulse on score change
  useEffect(() => {
    setPulseRed(true);
    const t = setTimeout(() => setPulseRed(false), 300);
    return () => clearTimeout(t);
  }, [state.roundScoreRed]);

  useEffect(() => {
    setPulseBlue(true);
    const t = setTimeout(() => setPulseBlue(false), 300);
    return () => clearTimeout(t);
  }, [state.roundScoreBlue]);

  // Keep screen awake via Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch { /* ignore */ }
    };
    request();
    // Re-acquire on visibility change (e.g. tab switch)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLock?.release();
    };
  }, []);

  // No signal
  if (!isConnected) {
    return (
      <div className="h-[100dvh] w-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <WifiOff className="h-20 w-20 text-zinc-500 mb-6" />
        <div className="text-3xl font-black text-zinc-400 mb-3 text-center">SEM SINAL</div>
        <div className="text-lg text-zinc-500 text-center">
          Aguardando conexão com Quadra {matId}
        </div>
        <div className="mt-10 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-zinc-500 animate-pulse" />
          <span className="text-sm text-zinc-600">Conectando...</span>
        </div>
        {/* Debug info — remove after fixing */}
        <div className="mt-8 text-[10px] text-zinc-700 font-mono text-center space-y-1">
          <div>devices: {connectedDevices} | status: {state.status}</div>
          <div>score: {state.roundScoreBlue}-{state.roundScoreRed} | round: {state.round}</div>
          <div>hasConfig: {String(state.hasConfig)} | time: {state.timeLeftMs}</div>
        </div>
      </div>
    );
  }

  const isRunning = state.status === 'RUNNING';
  const isMedical = state.isMedicalTime;
  const isMatchEnd = state.status === 'MATCH_END';
  const isRoundEnd = state.status === 'ROUND_END';

  const blueAthlete = state.config.athleteBlue?.name || state.config.athleteBlueName || 'CHUNG';
  const redAthlete = state.config.athleteRed?.name || state.config.athleteRedName || 'HONG';

  const neededToWin = state.config.maxRounds === 1 ? 1 : 2;

  return (
    <div className="h-[100dvh] w-screen bg-zinc-950 flex flex-col overflow-hidden select-none">
      {/* Header — compact, smaller in landscape */}
      <header className="h-10 landscape:h-8 bg-zinc-900 flex items-center justify-between px-4 shrink-0 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <img src={logoSpe} alt="SPE" className="h-6 w-auto" />
          <span className="text-xs text-zinc-500 font-bold">LIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400 uppercase font-bold tracking-wide">
            Quadra {matId}
          </span>
          <Wifi className="h-4 w-4 text-green-500" />
          {connectedDevices > 1 && (
            <span className="text-xs text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">{connectedDevices}</span>
          )}
        </div>
      </header>

      {/* Status bar — high contrast */}
      <div className={cn(
        "h-8 landscape:h-6 flex items-center justify-center shrink-0 text-sm landscape:text-xs font-black uppercase tracking-wider",
        isRunning && "bg-green-600/30 text-green-400",
        state.status === 'PAUSED' && "bg-yellow-600/30 text-yellow-400",
        isMedical && "bg-orange-600/30 text-orange-400",
        isRoundEnd && "bg-zinc-800 text-zinc-300",
        isMatchEnd && "bg-red-600/30 text-red-400",
        state.status === 'IDLE' && "bg-zinc-800 text-zinc-400",
      )}>
        {state.status === 'IDLE' && 'AGUARDANDO'}
        {isRunning && !isMedical && 'EM ANDAMENTO'}
        {state.status === 'PAUSED' && !isMedical && 'PAUSADO'}
        {isMedical && '⏱ TEMPO MÉDICO'}
        {isRoundEnd && !isMatchEnd && 'FIM DO ROUND'}
        {isMatchEnd && '🏁 FIM DA LUTA'}
      </div>

      {/* Match end overlay */}
      {isMatchEnd ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-xl text-zinc-400 uppercase tracking-wider mb-6 font-black">
            Resultado
          </div>

          {/* Final scores */}
          <div className="flex items-stretch gap-1 mb-6 w-full max-w-sm">
            <div className="flex-1 bg-[hsl(var(--sulsport-blue))] rounded-l-xl p-5 text-center">
              <div className="text-sm text-white/80 font-bold uppercase truncate">{blueAthlete}</div>
              <div className="text-6xl font-black text-white tabular-nums mt-1">{state.roundScoreBlue}</div>
              <div className="text-base text-white/60 mt-2 font-bold">Rounds: {state.roundWinsBlue}</div>
            </div>
            <div className="flex-1 bg-[hsl(var(--sulsport-red))] rounded-r-xl p-5 text-center">
              <div className="text-sm text-white/80 font-bold uppercase truncate">{redAthlete}</div>
              <div className="text-6xl font-black text-white tabular-nums mt-1">{state.roundScoreRed}</div>
              <div className="text-base text-white/60 mt-2 font-bold">Rounds: {state.roundWinsRed}</div>
            </div>
          </div>

          {/* Winner */}
          {state.roundWinsBlue !== state.roundWinsRed && (
            <div className={cn(
              "px-8 py-4 rounded-xl text-center",
              state.roundWinsBlue > state.roundWinsRed
                ? "bg-[hsl(var(--sulsport-blue))]/20"
                : "bg-[hsl(var(--sulsport-red))]/20",
            )}>
              <div className="text-sm text-zinc-400 uppercase mb-1 font-bold">Vencedor</div>
              <div className={cn(
                "text-3xl font-black uppercase",
                state.roundWinsBlue > state.roundWinsRed
                  ? "text-[hsl(var(--sulsport-blue-light))]"
                  : "text-[hsl(var(--sulsport-red-light))]",
              )}>
                {state.roundWinsBlue > state.roundWinsRed ? blueAthlete : redAthlete}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Timer — large, compact in landscape */}
          <div className={cn(
            "py-2 landscape:py-1 flex flex-col items-center justify-center shrink-0",
            isMedical ? "bg-orange-500/10" : "bg-zinc-900",
          )}>
            <span
              className={cn(
                "font-black tabular-nums leading-none",
                isMedical ? "text-orange-400" : "text-[hsl(var(--sulsport-yellow))]",
                state.timeLeftMs <= 10000 && isRunning && "animate-pulse",
              )}
              style={{ fontSize: 'clamp(36px, 10vw, 80px)' }}
            >
              {formatTime(state.timeLeftMs)}
            </span>
            {/* Round info inline with timer */}
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm landscape:text-xs text-zinc-400 font-bold uppercase">
                Round {state.round}/{state.config.maxRounds}
              </span>
              <span className="text-sm text-zinc-600">•</span>
              <span className="text-sm landscape:text-xs text-zinc-500 font-medium">
                Luta {state.config.matchNumber || '001'}
              </span>
            </div>
          </div>

          {/* Scores — main area, fills remaining space */}
          <div className="flex-1 flex gap-1.5 p-1.5 landscape:p-1 min-h-0">
            {/* BLUE */}
            <div className={cn(
              "flex-1 bg-[hsl(var(--sulsport-blue))] rounded-2xl flex flex-col overflow-hidden transition-transform duration-200",
              pulseBlue && "scale-[1.02]",
            )}>
              {/* Athlete name */}
              <div className="px-3 pt-3 pb-1 text-center">
                <div className="text-base font-black text-white/90 uppercase truncate">{blueAthlete}</div>
              </div>

              {/* Score */}
              <div className="flex-1 flex items-center justify-center">
                <span
                  className={cn(
                    "font-black text-white tabular-nums leading-none transition-transform duration-200",
                    pulseBlue && "scale-110",
                  )}
                  style={{ fontSize: 'clamp(80px, 22vw, 160px)' }}
                >
                  {state.roundScoreBlue}
                </span>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-3 divide-x divide-white/10 bg-black/25 py-2 landscape:py-1">
                <div className="text-center">
                  <div className="text-xs text-white/60 uppercase font-bold tracking-wider">GJ</div>
                  <div className="text-2xl font-black text-white mt-0.5">{state.gamjeomBlue}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 uppercase font-bold tracking-wider">Rounds</div>
                  <div className="flex justify-center gap-1.5 mt-1.5">
                    {Array.from({ length: neededToWin }, (_, i) => (
                      <span key={i} className="text-lg text-white">
                        {i < state.roundWinsBlue ? '●' : '○'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 uppercase font-bold tracking-wider">Hits</div>
                  <div className="text-2xl font-black text-white mt-0.5">{state.hitsBlue}</div>
                </div>
              </div>
            </div>

            {/* RED */}
            <div className={cn(
              "flex-1 bg-[hsl(var(--sulsport-red))] rounded-2xl flex flex-col overflow-hidden transition-transform duration-200",
              pulseRed && "scale-[1.02]",
            )}>
              {/* Athlete name */}
              <div className="px-3 pt-3 pb-1 text-center">
                <div className="text-base font-black text-white/90 uppercase truncate">{redAthlete}</div>
              </div>

              {/* Score */}
              <div className="flex-1 flex items-center justify-center">
                <span
                  className={cn(
                    "font-black text-white tabular-nums leading-none transition-transform duration-200",
                    pulseRed && "scale-110",
                  )}
                  style={{ fontSize: 'clamp(80px, 22vw, 160px)' }}
                >
                  {state.roundScoreRed}
                </span>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-3 divide-x divide-white/10 bg-black/25 py-2 landscape:py-1">
                <div className="text-center">
                  <div className="text-xs text-white/60 uppercase font-bold tracking-wider">GJ</div>
                  <div className="text-2xl font-black text-white mt-0.5">{state.gamjeomRed}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 uppercase font-bold tracking-wider">Rounds</div>
                  <div className="flex justify-center gap-1.5 mt-1.5">
                    {Array.from({ length: neededToWin }, (_, i) => (
                      <span key={i} className="text-lg text-white">
                        {i < state.roundWinsRed ? '●' : '○'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/60 uppercase font-bold tracking-wider">Hits</div>
                  <div className="text-2xl font-black text-white mt-0.5">{state.hitsRed}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tie indicator */}
          {isRoundEnd && state.roundScoreRed === state.roundScoreBlue && state.hitsRed === state.hitsBlue && (
            <div className="h-12 bg-yellow-500/15 flex items-center justify-center shrink-0">
              <span className="text-base font-black text-yellow-400 uppercase">
                Empate — Aguardando Decisão
              </span>
            </div>
          )}
        </>
      )}

      {/* Footer — subtle, hidden in landscape */}
      <div className="h-6 landscape:h-4 bg-zinc-900 flex items-center justify-center shrink-0 border-t border-zinc-800/50">
        <span className="text-[10px] landscape:text-[8px] text-zinc-600 uppercase tracking-wider font-medium">
          SPE Sulsport • Placar ao Vivo
        </span>
      </div>
    </div>
  );
}
