import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatTime, MatchEvent, ScoreType, getChannelName } from '@/types/championship';
import type { ChampionshipSyncMessage, HardwareTestHit } from '@/types/championship';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
import { Wifi, WifiOff } from 'lucide-react';
import { useTournament } from '@/hooks/useTournament';
import { BracketView } from '@/components/championship/BracketView';
import { HardwareTestOverlay } from '@/components/championship/HardwareTestOverlay';
import { cn } from '@/lib/utils';
import logoSpe from '@/assets/logo-spe-branca.png';

// Calculate match statistics from events
interface MatchStats {
  blue: {
    punch: number;
    body: number;
    head: number;
    spinBody: number;
    spinHead: number;
    totalHits: number;
    totalPoints: number;
  };
  red: {
    punch: number;
    body: number;
    head: number;
    spinBody: number;
    spinHead: number;
    totalHits: number;
    totalPoints: number;
  };
}

function calculateMatchStats(events: MatchEvent[]): MatchStats {
  const scoreTypes: ScoreType[] = ['PUNCH', 'BODY', 'HEAD', 'SPIN_BODY', 'SPIN_HEAD'];
  
  const stats: MatchStats = {
    blue: { punch: 0, body: 0, head: 0, spinBody: 0, spinHead: 0, totalHits: 0, totalPoints: 0 },
    red: { punch: 0, body: 0, head: 0, spinBody: 0, spinHead: 0, totalHits: 0, totalPoints: 0 },
  };
  
  events.forEach(event => {
    if (!event.side || !scoreTypes.includes(event.type as ScoreType)) return;
    
    const side = event.side === 'BLUE' ? 'blue' : 'red';
    const points = event.points || 0;
    
    // Only count if it has points (scored hit, not just touch)
    if (points > 0) {
      switch (event.type) {
        case 'PUNCH': stats[side].punch++; break;
        case 'BODY': stats[side].body++; break;
        case 'HEAD': stats[side].head++; break;
        case 'SPIN_BODY': stats[side].spinBody++; break;
        case 'SPIN_HEAD': stats[side].spinHead++; break;
      }
      stats[side].totalHits++;
      stats[side].totalPoints += points;
    }
  });
  
  return stats;
}

export default function ChampionshipTV() {
  const [searchParams] = useSearchParams();
  const matId = parseInt(searchParams.get('mat') || '1');
  const isBasicMode = searchParams.get('mode') === 'basic';

  const handleSyncCommand = useCallback((event: string, payload: unknown) => {
    if (event === 'show-bracket') {
      if (isBasicMode) return;
      const p = payload as { categoryId: string } | null;
      if (p?.categoryId) {
        setBracketCategoryId(p.categoryId);
        setTvMode('bracket');
      }
    } else if (event === 'show-scoreboard') {
      setTvMode('scoreboard');
    } else if (event === 'show-hardware-test') {
      const p = payload as { athleteBlue?: string; athleteRed?: string } | null;
      setHwTestAthletes({ blue: p?.athleteBlue, red: p?.athleteRed });
      setHwTestHits([]);
      setTvMode('hardware-test');
    } else if (event === 'hide-hardware-test') {
      setTvMode('scoreboard');
    } else if (event === 'hardware-test-hit') {
      const hit = payload as HardwareTestHit;
      if (hit) setHwTestHits(prev => [...prev, hit]);
    }
  }, []);

  const { state, isConnected, connectedDevices } = useChampionshipSync({
    role: 'listener',
    matId,
    onCommand: handleSyncCommand,
  });
  
  // Tournament bracket display
  const tournamentHook = useTournament();
  const [tvMode, setTvMode] = useState<'scoreboard' | 'bracket' | 'hardware-test'>('scoreboard');
  const [bracketCategoryId, setBracketCategoryId] = useState<string | null>(null);

  // Hardware test state
  const [hwTestAthletes, setHwTestAthletes] = useState<{ blue?: string; red?: string }>({});
  const [hwTestHits, setHwTestHits] = useState<HardwareTestHit[]>([]);

  // Listen for typed messages (SHOW_BRACKET / SHOW_SCOREBOARD / HARDWARE_TEST) via BroadcastChannel (same device)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(getChannelName(matId));
    const handler = (event: MessageEvent) => {
      const msg = event.data as ChampionshipSyncMessage;
      if (msg?.type === 'SHOW_BRACKET') {
        if (isBasicMode) return;
        setBracketCategoryId(msg.payload.categoryId);
        setTvMode('bracket');
      } else if (msg?.type === 'SHOW_SCOREBOARD') {
        setTvMode('scoreboard');
      } else if (msg?.type === 'SHOW_HARDWARE_TEST') {
        setHwTestAthletes({ blue: msg.payload.athleteBlue, red: msg.payload.athleteRed });
        setHwTestHits([]);
        setTvMode('hardware-test');
      } else if (msg?.type === 'HIDE_HARDWARE_TEST') {
        setTvMode('scoreboard');
      } else if (msg?.type === 'HARDWARE_TEST_HIT') {
        setHwTestHits(prev => [...prev, msg.payload]);
      }
    };
    ch.addEventListener('message', handler);
    return () => {
      ch.removeEventListener('message', handler);
      ch.close();
    };
  }, [matId]);


  // Auto-switch to scoreboard when match starts running
  useEffect(() => {
    if (state.status === 'RUNNING') {
      setTvMode('scoreboard');
    }
  }, [state.status]);
  
  // ESC key handler removed — accidental ESC during a live event would close
  // the TV display. Close via the hidden back button or closing the window.

  // No signal state
  if (!isConnected) {
    return (
      <div className="h-screen w-screen bg-wt-bg flex items-center justify-center font-display">
        <div className="text-center">
          <WifiOff className="h-16 w-16 text-wt-danger animate-pulse mx-auto mb-6" />
          <div className="text-5xl font-bold uppercase tracking-[0.3em] text-white/70 mb-3">Sem sinal</div>
          <div className="text-8xl font-black text-white mb-6 tabular-nums tracking-tight">MAT {matId}</div>
          <div className="text-lg text-white/50">
            Aguardando conexão com Mesa de Luta
          </div>
        </div>
      </div>
    );
  }
  
  const isRunning = state.status === 'RUNNING';
  const isMedical = state.isMedicalTime;
  const isMatchEnd = state.status === 'MATCH_END';
  const isRoundEnd = state.status === 'ROUND_END';
  
  // Generate round win indicators (●●○)
  const renderRoundIndicators = (wins: number, maxRounds: number) => {
    const neededToWin = maxRounds === 1 ? 1 : 2;
    const indicators = [];
    for (let i = 0; i < neededToWin; i++) {
      indicators.push(
        <span key={i} className="text-3xl">
          {i < wins ? '●' : '○'}
        </span>
      );
    }
    return indicators;
  };
  
  return (
    <div className="h-screen w-screen bg-wt-bg flex flex-col overflow-hidden select-none font-display">
      {/* Chrome (logo + WiFi) escondido quando tvCleanMode=true (FOB off) */}
      {!state.config.tvCleanMode && (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 opacity-30">
            <img src={logoSpe} alt="SPE" className="h-5 w-auto object-contain" />
          </div>
          <div className="absolute top-3 right-3 z-50 flex items-center gap-1.5 opacity-50">
            <Wifi className="h-3.5 w-3.5 text-green-400" />
            {connectedDevices > 1 && (
              <span className="text-[10px] text-zinc-400 font-mono">{connectedDevices}</span>
            )}
          </div>
        </>
      )}

      {/* Tournament Bracket View (shown between fights) */}
      {!isBasicMode && tvMode === 'bracket' && bracketCategoryId && tournamentHook.tournament && (() => {
        const cat = tournamentHook.tournament!.categories.find(c => c.id === bracketCategoryId);
        if (!cat) return null;
        return (
          <div className="flex-1 flex items-center justify-center p-8">
            <BracketView
              category={cat}
              currentMatchId={tournamentHook.tournament!.currentMatchId}
            />
          </div>
        );
      })()}

      {/* Main 3-Column Layout — Claude Design RODADA 2 (TV broadcast UFC-style) */}
      <div className={cn("flex-1 flex items-stretch overflow-hidden", tvMode === 'bracket' && "hidden")}>
        {/* BLUE Side */}
        {(() => {
          const blueLeading = state.roundScoreBlue > state.roundScoreRed;
          const blueName = state.config.athleteBlue?.name || 'CHUNG';
          const blueCountry = state.config.athleteBlue?.country;
          return (
            <div className="flex-1 flex flex-col overflow-hidden relative bg-chung">
              {/* Stripe superior — CHUNG cor sólida, convenção broadcast */}
              <div className="h-2 w-full bg-chung" />

              {/* Header: CHUNG label + nome + country + LIDERA */}
              <div className="px-8 pt-5 pb-2 flex flex-col items-start">
                <div className="text-white/80 font-bold" style={{ fontSize: 14, letterSpacing: '0.5em' }}>
                  CHUNG
                </div>
                <div className="font-bold text-white leading-tight mt-1 truncate max-w-full uppercase tracking-wide" style={{ fontSize: 46 }}>
                  {blueName}
                </div>
                {blueCountry && (
                  <div className="text-white/60 font-mono mt-0.5" style={{ fontSize: 20, letterSpacing: '0.2em' }}>
                    {blueCountry}
                  </div>
                )}
                {blueLeading && (
                  <div className="mt-2.5 font-bold text-black bg-white"
                    style={{ fontSize: 11, letterSpacing: '0.4em', padding: '5px 13px' }}
                  >
                    LIDERA
                  </div>
                )}
              </div>

              {/* Número gigante — broadcast hero, retangular, zero sombra decorativa */}
              <div className="flex-1 flex items-center justify-center relative">
                <span
                  className="font-black tabular-nums leading-none"
                  style={{
                    fontSize: 'clamp(320px, 52vw, 720px)',
                    letterSpacing: '-0.05em',
                    color: blueLeading ? 'hsl(var(--wt-manual))' : '#FFFFFF',
                  }}
                >
                  {state.roundScoreBlue}
                </span>
              </div>

              {/* Rodape: gam-jeom + rounds + hits — escalas por peso decisional.
                  GAM-JEOM critico (10 GJ = desclassificacao) pesa mais.
                  Round wins visiveis a 10m. GOLPES estatistica, menor. */}
              <div className="px-8 pb-4 flex gap-[2px] justify-start items-stretch">
                <div className="px-5 py-3 bg-black/40 min-w-[140px]">
                  <div className="text-white/70 font-bold" style={{ fontSize: 'clamp(12px, 1vw, 18px)', letterSpacing: '0.3em' }}>GAM-JEOM</div>
                  <div
                    className={cn(
                      "font-black tabular-nums leading-none mt-1",
                      state.gamjeomBlue >= 3 ? "text-wt-warning" : "text-white"
                    )}
                    style={{ fontSize: 'clamp(48px, 4.5vw, 90px)' }}
                  >
                    {state.gamjeomBlue}
                  </div>
                </div>
                <div className="px-5 py-3 bg-black/40 flex gap-5 items-center">
                  {Array.from({ length: state.config.maxRounds }).map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="text-white/70 font-bold" style={{ fontSize: 'clamp(11px, 0.9vw, 16px)', letterSpacing: '0.25em' }}>R{i + 1}</div>
                      <div
                        className="font-black text-white tabular-nums leading-none mt-1"
                        style={{ fontSize: 'clamp(32px, 3vw, 60px)' }}
                      >
                        {i < state.roundWinsBlue ? '●' : '○'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-black/40">
                  <div className="text-white/70 font-bold" style={{ fontSize: 'clamp(12px, 1vw, 18px)', letterSpacing: '0.3em' }}>GOLPES</div>
                  <div className="font-black text-white tabular-nums leading-none mt-1" style={{ fontSize: 'clamp(32px, 2.8vw, 56px)' }}>
                    {state.hitsBlue}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* CENTER — broadcast-grade, números leem a 5m+ em ginásio */}
        <div
          className="flex flex-col items-center justify-center bg-black"
          style={{
            width: 'clamp(300px, 21vw, 440px)',
            padding: 'clamp(16px, 2vh, 32px) clamp(10px, 1vw, 20px)',
            gap: 'clamp(10px, 1.4vh, 20px)',
          }}
        >
          <div className="text-white/60 font-bold" style={{ fontSize: 'clamp(14px, 1.2vw, 22px)', letterSpacing: '0.4em' }}>ROUND</div>
          {state.isGoldenRound ? (
            <>
              <div
                className="font-black text-wt-manual animate-pulse leading-none"
                style={{ fontSize: 'clamp(40px, 3.5vw, 72px)', letterSpacing: '0.15em' }}
              >
                GOLDEN
              </div>
              <div
                className="font-black text-wt-manual leading-none"
                style={{ fontSize: 'clamp(40px, 3.5vw, 72px)', letterSpacing: '0.15em' }}
              >
                ROUND
              </div>
            </>
          ) : (
            <>
              <div
                className="font-black text-white tabular-nums leading-none"
                style={{ fontSize: 'clamp(80px, 6vw, 130px)', letterSpacing: '-0.03em' }}
              >
                {state.round}
              </div>
              <div
                className="text-white/50 font-bold"
                style={{ fontSize: 'clamp(18px, 1.5vw, 28px)', letterSpacing: '0.3em', marginTop: '-0.2em' }}
              >
                / {state.config.maxRounds}
              </div>
            </>
          )}

          <div className="w-3/4 h-px bg-white/15" />

          {/* Timer — padrao broadcast WT/KPNP: M:SS sempre, zero jitter de
              largura. Estado critico (<=10s) anima APENAS a cor do texto
              (steps(2) a 1Hz), sem pill animado, sem troca de formato.
              Pesquisa: UFC/NBA/KPNP nao animam bg — olho briga com 2
              animacoes simultaneas. Medical/Break sao estados distintos,
              mantem bg colorido estatico. */}
          {(() => {
            const critical = !state.isBreakTime && !isMedical && state.timeLeftMs <= 10000 && isRunning;
            const hasStaticBg = state.isBreakTime || isMedical;
            return (
              <div
                className={cn(
                  "font-black tabular-nums leading-none text-center",
                  "flex items-center justify-center",
                  hasStaticBg && "border-2 w-full",
                  state.isBreakTime && "bg-wt-bg-tertiary text-white border-wt-divider",
                  isMedical && "bg-wt-warning text-black border-wt-warning",
                  !hasStaticBg && !critical && "text-white",
                  critical && "animate-[timer-critical-pulse_1s_steps(2)_infinite]",
                )}
                style={{
                  fontSize: 'clamp(110px, 9.5vw, 200px)',
                  padding: hasStaticBg ? 'clamp(8px, 1vh, 16px) clamp(6px, 0.6vw, 12px)' : 0,
                  letterSpacing: '-0.04em',
                  // Min-width reserva espaco pra "10:00" (maior string possivel)
                  // em tabular-nums — evita qualquer jitter de largura.
                  minWidth: '4ch',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatTime(state.isBreakTime ? (state.breakTimeLeftMs || 0) : state.timeLeftMs)}
              </div>
            );
          })()}

          {/* Status label */}
          {state.isBreakTime && !isMatchEnd && (
            <div className="font-bold uppercase text-white/70 tracking-widest animate-pulse" style={{ fontSize: 'clamp(14px, 1.1vw, 22px)' }}>INTERVALO</div>
          )}
          {!state.isBreakTime && !isRunning && !isMatchEnd && (
            <div
              className={cn(
                "font-bold uppercase tracking-widest",
                isMedical ? "text-wt-warning" : "text-white/70 animate-pulse"
              )}
              style={{ fontSize: 'clamp(14px, 1.1vw, 22px)' }}
            >
              {isMedical ? 'TEMPO MÉDICO' : 'PAUSADO'}
            </div>
          )}
          {isRunning && !state.isBreakTime && (
            <div className="font-bold uppercase text-wt-success tracking-widest" style={{ fontSize: 'clamp(14px, 1.1vw, 22px)' }}>EM LUTA</div>
          )}

          {/* LUTA identifier abaixo do timer */}
          <div className="text-white/30 font-bold font-mono" style={{ fontSize: 'clamp(10px, 0.8vw, 14px)', letterSpacing: '0.25em' }}>
            LUTA {state.config.matchNumber || '001'}
          </div>
        </div>

        {/* RED Side */}
        {(() => {
          const redLeading = state.roundScoreRed > state.roundScoreBlue;
          const redName = state.config.athleteRed?.name || 'HONG';
          const redCountry = state.config.athleteRed?.country;
          return (
            <div className="flex-1 flex flex-col overflow-hidden relative bg-hong">
              {/* Stripe superior — HONG cor sólida */}
              <div className="h-2 w-full bg-hong" />

              {/* Header: HONG label + nome + country + LIDERA (alinhado à direita) */}
              <div className="px-8 pt-5 pb-2 flex flex-col items-end text-right">
                <div className="text-white/80 font-bold" style={{ fontSize: 14, letterSpacing: '0.5em' }}>
                  HONG
                </div>
                <div className="font-bold text-white leading-tight mt-1 truncate max-w-full uppercase tracking-wide" style={{ fontSize: 46 }}>
                  {redName}
                </div>
                {redCountry && (
                  <div className="text-white/60 font-mono mt-0.5" style={{ fontSize: 20, letterSpacing: '0.2em' }}>
                    {redCountry}
                  </div>
                )}
                {redLeading && (
                  <div className="mt-2.5 font-bold text-black bg-white"
                    style={{ fontSize: 11, letterSpacing: '0.4em', padding: '5px 13px' }}
                  >
                    LIDERA
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center relative">
                <span
                  className="font-black tabular-nums leading-none"
                  style={{
                    fontSize: 'clamp(320px, 52vw, 720px)',
                    letterSpacing: '-0.05em',
                    color: redLeading ? 'hsl(var(--wt-manual))' : '#FFFFFF',
                  }}
                >
                  {state.roundScoreRed}
                </span>
              </div>

              {/* Rodape alinhado a direita — escalas por peso decisional (igual
                  ao lado CHUNG, espelhado). */}
              <div className="px-8 pb-4 flex gap-[2px] justify-end items-stretch">
                <div className="px-5 py-3 bg-black/40">
                  <div className="text-white/70 font-bold" style={{ fontSize: 'clamp(12px, 1vw, 18px)', letterSpacing: '0.3em' }}>GOLPES</div>
                  <div className="font-black text-white tabular-nums leading-none mt-1" style={{ fontSize: 'clamp(32px, 2.8vw, 56px)' }}>
                    {state.hitsRed}
                  </div>
                </div>
                <div className="px-5 py-3 bg-black/40 flex gap-5 items-center">
                  {Array.from({ length: state.config.maxRounds }).map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="text-white/70 font-bold" style={{ fontSize: 'clamp(11px, 0.9vw, 16px)', letterSpacing: '0.25em' }}>R{i + 1}</div>
                      <div
                        className="font-black text-white tabular-nums leading-none mt-1"
                        style={{ fontSize: 'clamp(32px, 3vw, 60px)' }}
                      >
                        {i < state.roundWinsRed ? '●' : '○'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-black/40 min-w-[140px]">
                  <div className="text-white/70 font-bold" style={{ fontSize: 'clamp(12px, 1vw, 18px)', letterSpacing: '0.3em' }}>GAM-JEOM</div>
                  <div
                    className={cn(
                      "font-black tabular-nums leading-none mt-1",
                      state.gamjeomRed >= 3 ? "text-wt-warning" : "text-white"
                    )}
                    style={{ fontSize: 'clamp(48px, 4.5vw, 90px)' }}
                  >
                    {state.gamjeomRed}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* TELA DE VITÓRIA - Fullscreen quando MATCH_END */}
      {isMatchEnd && (() => {
        // Calculate stats first to get total points
        const stats = calculateMatchStats(state.events);
        
        // Determine winner: first by rounds, then by total points if rounds are tied
        let isBlueWinner = state.roundWinsBlue > state.roundWinsRed;
        let isRedWinner = state.roundWinsRed > state.roundWinsBlue;
        let isTie = state.roundWinsBlue === state.roundWinsRed;
        
        // If rounds are tied, use total points to determine winner
        if (isTie) {
          if (stats.blue.totalPoints > stats.red.totalPoints) {
            isBlueWinner = true;
            isTie = false;
          } else if (stats.red.totalPoints > stats.blue.totalPoints) {
            isRedWinner = true;
            isTie = false;
          }
          // If still tied, try hits tiebreak
          if (isTie && state.config.tiebreakByHits !== false) {
            if (state.hitsBlue > state.hitsRed) {
              isBlueWinner = true;
              isTie = false;
            } else if (state.hitsRed > state.hitsBlue) {
              isRedWinner = true;
              isTie = false;
            }
          }
        }
        
        const winnerName = isBlueWinner 
          ? (state.config.athleteBlue?.name || 'CHUNG')
          : isRedWinner
            ? (state.config.athleteRed?.name || 'HONG')
            : null;
        
        const winnerCountry = isBlueWinner 
          ? state.config.athleteBlue?.country
          : isRedWinner
            ? state.config.athleteRed?.country
            : null;
        
        // Country code to emoji flag mapping with fallback
        const countryFlags: Record<string, string> = {
          'BRA': '🇧🇷', 'KOR': '🇰🇷', 'USA': '🇺🇸', 'CHN': '🇨🇳', 'JPN': '🇯🇵',
          'MEX': '🇲🇽', 'GBR': '🇬🇧', 'ESP': '🇪🇸', 'FRA': '🇫🇷', 'ITA': '🇮🇹',
          'GER': '🇩🇪', 'ARG': '🇦🇷', 'POR': '🇵🇹', 'RUS': '🇷🇺', 'TUR': '🇹🇷',
          'IRI': '🇮🇷', 'THA': '🇹🇭', 'TPE': '🇹🇼', 'CRO': '🇭🇷', 'GRE': '🇬🇷',
        };
        
        const getFlag = (code?: string) => {
          if (!code) return null;
          const upper = code.toUpperCase();
          return countryFlags[upper] || upper;
        };
        
        const flagDisplay = getFlag(winnerCountry);
        
        // Stats already calculated above for winner determination
        
        // Stats rows configuration
        const statRows = [
          { key: 'punch' as const, label: 'SOCOS' },
          { key: 'body' as const, label: 'CORPO' },
          { key: 'head' as const, label: 'CABEÇA' },
          { key: 'spinBody' as const, label: 'GIRO CORPO' },
          { key: 'spinHead' as const, label: 'GIRO CABEÇA' },
        ];
        
        return (
          <div className="absolute inset-0 bg-wt-bg flex flex-col items-center justify-center z-50 animate-in fade-in duration-300 overflow-auto py-6 font-display">
            <div className="relative z-10 flex flex-col items-center max-w-[92vw] w-full">
              {/* Header: MATCH 001 RESULT */}
              <div className="text-center mb-6 border-b border-wt-divider pb-4 w-full max-w-[900px]">
                <div className="text-[11px] font-bold uppercase tracking-[0.45em] text-wt-fg-muted mb-2">
                  Resultado
                </div>
                <h1
                  className="font-black text-wt-fg-primary uppercase tracking-tight leading-none tabular-nums"
                  style={{ fontSize: 'clamp(1.75rem, 4.5vw, 4rem)' }}
                >
                  LUTA {String(state.config.matchNumber || 1).padStart(3, '0')}
                </h1>
              </div>

              {/* Faixa VENCEDOR/EMPATE + Placar Final */}
              <div className="flex items-stretch mb-5 gap-[2px]">
                {/* VENCEDOR / EMPATE — faixa com stripe superior */}
                <div
                  className={cn(
                    'relative px-7 py-4 flex items-center bg-wt-bg-secondary border border-wt-divider',
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0 left-0 right-0 h-[2px]',
                      isTie && 'bg-wt-manual',
                      isBlueWinner && 'bg-chung',
                      isRedWinner && 'bg-hong',
                    )}
                  />
                  <span
                    className={cn(
                      'font-black uppercase tracking-[0.25em]',
                      isTie && 'text-wt-manual',
                      isBlueWinner && 'text-chung-accent',
                      isRedWinner && 'text-hong-accent',
                    )}
                    style={{ fontSize: 'clamp(1rem, 2vw, 1.75rem)' }}
                  >
                    {isTie ? 'Empate' : 'Vencedor'}
                  </span>
                </div>

                {/* Placar final CHUNG */}
                <div className="bg-wt-bg-secondary border border-wt-divider border-l-0 px-6 py-4 flex flex-col items-center justify-center min-w-[90px]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-chung-accent mb-1">
                    Chung
                  </span>
                  <span
                    className="font-black text-wt-fg-primary tabular-nums leading-none"
                    style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}
                  >
                    {stats.blue.totalPoints}
                  </span>
                </div>

                {/* Placar final HONG */}
                <div className="bg-wt-bg-secondary border border-wt-divider border-l-0 px-6 py-4 flex flex-col items-center justify-center min-w-[90px]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-hong-accent mb-1">
                    Hong
                  </span>
                  <span
                    className="font-black text-wt-fg-primary tabular-nums leading-none"
                    style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}
                  >
                    {stats.red.totalPoints}
                  </span>
                </div>
              </div>

              {/* Rounds ganhos */}
              <div className="flex items-center gap-4 mb-6">
                <span
                  className="uppercase tracking-[0.35em] text-wt-fg-muted font-bold"
                  style={{ fontSize: 'clamp(0.625rem, 1vw, 0.75rem)' }}
                >
                  Rounds
                </span>
                <span
                  className="font-black text-chung-accent tabular-nums"
                  style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                >
                  {state.roundWinsBlue}
                </span>
                <span className="text-wt-fg-muted font-bold">×</span>
                <span
                  className="font-black text-hong-accent tabular-nums"
                  style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                >
                  {state.roundWinsRed}
                </span>
              </div>

              {/* Nome do Vencedor (ou ambos em empate) */}
              {!isTie ? (
                <div className="flex items-stretch mb-8">
                  {flagDisplay && (
                    <div className="bg-wt-bg-tertiary border border-wt-divider px-5 flex items-center justify-center">
                      <span style={{ fontSize: 'clamp(1.5rem, 3vw, 3rem)' }}>
                        {flagDisplay}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      'relative px-10 py-5 flex items-center bg-wt-bg-secondary border border-wt-divider',
                      flagDisplay && 'border-l-0',
                    )}
                  >
                    <div
                      className={cn(
                        'absolute left-0 top-0 bottom-0 w-1',
                        isBlueWinner ? 'bg-chung' : 'bg-hong',
                      )}
                    />
                    <span
                      className={cn(
                        'font-black uppercase tracking-tight leading-none pl-3',
                        isBlueWinner ? 'text-chung-accent' : 'text-hong-accent',
                      )}
                      style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
                    >
                      {winnerName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-stretch gap-[2px] mb-8">
                  <div className="relative bg-wt-bg-secondary border border-wt-divider px-6 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-chung" />
                    <span
                      className="font-black text-chung-accent uppercase tracking-tight pl-3"
                      style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                    >
                      {state.config.athleteBlue?.name || 'CHUNG'}
                    </span>
                  </div>
                  <div className="flex items-center px-4 text-wt-fg-muted font-bold uppercase tracking-[0.3em] text-sm">
                    vs
                  </div>
                  <div className="relative bg-wt-bg-secondary border border-wt-divider px-6 py-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-hong" />
                    <span
                      className="font-black text-hong-accent uppercase tracking-tight pl-3"
                      style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                    >
                      {state.config.athleteRed?.name || 'HONG'}
                    </span>
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              <div className="w-full max-w-[900px]">
                <div className="bg-wt-bg-secondary border border-wt-divider p-5">
                  <div className="border-b border-wt-divider pb-3 mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-wt-fg-muted">
                      Estatísticas
                    </div>
                    <h2
                      className="text-wt-fg-primary uppercase tracking-tight font-black leading-none mt-1"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.25rem)' }}
                    >
                      Golpes pontuados
                    </h2>
                  </div>

                  {/* Grid de stats — tipografia tabular, sem cor ornamental */}
                  <div className="grid grid-cols-3 gap-y-2 text-center">
                    <div
                      className="text-chung-accent font-black uppercase tracking-[0.25em]"
                      style={{ fontSize: 'clamp(0.75rem, 1.25vw, 1rem)' }}
                    >
                      Chung
                    </div>
                    <div />
                    <div
                      className="text-hong-accent font-black uppercase tracking-[0.25em]"
                      style={{ fontSize: 'clamp(0.75rem, 1.25vw, 1rem)' }}
                    >
                      Hong
                    </div>

                    {statRows.map(({ key, label }) => (
                      <Fragment key={key}>
                        <div
                          className="text-wt-fg-primary font-bold tabular-nums"
                          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
                        >
                          {stats.blue[key]}
                        </div>
                        <div
                          className="text-wt-fg-muted uppercase tracking-[0.2em] font-bold"
                          style={{ fontSize: 'clamp(0.625rem, 1.15vw, 0.875rem)' }}
                        >
                          {label}
                        </div>
                        <div
                          className="text-wt-fg-primary font-bold tabular-nums"
                          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
                        >
                          {stats.red[key]}
                        </div>
                      </Fragment>
                    ))}

                    <div className="col-span-3 border-t border-wt-divider my-2" />

                    <div
                      className="text-wt-fg-primary font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {stats.blue.totalHits}
                    </div>
                    <div
                      className="text-wt-fg-secondary font-bold uppercase tracking-[0.25em]"
                      style={{ fontSize: 'clamp(0.75rem, 1.25vw, 1rem)' }}
                    >
                      Total golpes
                    </div>
                    <div
                      className="text-wt-fg-primary font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {stats.red.totalHits}
                    </div>

                    <div
                      className="text-wt-fg-primary font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {state.hitsBlue}
                    </div>
                    <div
                      className="text-wt-fg-secondary font-bold uppercase tracking-[0.25em]"
                      style={{ fontSize: 'clamp(0.75rem, 1.25vw, 1rem)' }}
                    >
                      Hits PSS
                    </div>
                    <div
                      className="text-wt-fg-primary font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {state.hitsRed}
                    </div>

                    <div
                      className="text-wt-manual font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {state.gamjeomBlue}
                    </div>
                    <div
                      className="text-wt-manual font-bold uppercase tracking-[0.25em]"
                      style={{ fontSize: 'clamp(0.75rem, 1.25vw, 1rem)' }}
                    >
                      Gam-jeom
                    </div>
                    <div
                      className="text-wt-manual font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {state.gamjeomRed}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {tvMode !== 'bracket' && tvMode !== 'hardware-test' && isRoundEnd && !isMatchEnd && state.roundScoreRed === state.roundScoreBlue && state.hitsRed === state.hitsBlue && (
        <div className="h-28 bg-wt-manual/10 border-t border-wt-manual/40 flex items-center justify-center font-display">
          <span className="text-4xl font-black text-wt-manual uppercase tracking-[0.2em]">
            Empate — aguardando decisão do árbitro
          </span>
        </div>
      )}

      {/* Hardware Test Overlay (TV mode — no controls, receives hits from broadcast) */}
      {tvMode === 'hardware-test' && (
        <HardwareTestOverlay
          onClose={() => setTvMode('scoreboard')}
          externalHits={hwTestHits}
          athleteBlue={hwTestAthletes.blue}
          athleteRed={hwTestAthletes.red}
          hideControls
        />
      )}
    </div>
  );
}
