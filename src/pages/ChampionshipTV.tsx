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

  // Result overlay sticky guard — abre quando status entra em MATCH_END,
  // fecha SOMENTE em transição explícita pra IDLE/RUNNING (operador resetou
  // ou começou nova luta). Status transitórios stale (ROUND_END, PAUSED,
  // MEDICAL etc) entregues por race entre canais não fecham. Mesmo padrão
  // do fix QuickMatchLayout (UI-AUDIT round 6 H2).
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const prevStatusRef = useRef<typeof state.status | null>(null);

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

  // Sticky result overlay — abre em MATCH_END, fecha SÓ em IDLE/RUNNING
  // (transição explícita do operador). Estados intermediários ou snapshots
  // stale entre canais (BC/Realtime/polling) não fecham — evita flicker.
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (state.status === 'MATCH_END' && prev !== 'MATCH_END') {
      setShowResultOverlay(true);
    }
    if (prev === 'MATCH_END' && (state.status === 'IDLE' || state.status === 'RUNNING')) {
      setShowResultOverlay(false);
    }
    prevStatusRef.current = state.status;
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
      
      {/* TELA DE VITÓRIA - Sticky até operador resetar (IDLE/RUNNING) */}
      {showResultOverlay && (() => {
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
          <div
            className="absolute inset-0 z-50 animate-in fade-in duration-500 overflow-auto font-display flex flex-col"
            style={{
              background: isBlueWinner
                ? 'radial-gradient(ellipse at center 38%, hsl(var(--chung)) 0%, hsl(var(--chung-bg)) 55%, #050511 100%)'
                : isRedWinner
                ? 'radial-gradient(ellipse at center 38%, hsl(var(--hong)) 0%, hsl(var(--hong-bg)) 55%, #050511 100%)'
                : 'radial-gradient(ellipse at center 38%, #5C4500 0%, #1A1308 55%, #050511 100%)',
            }}
          >
            {/* HEADER */}
            <header className="h-16 px-10 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/40 backdrop-blur-sm z-10">
              <div className="flex items-center gap-5">
                <img src={logoSpe} alt="SPE" className="h-5 opacity-90" draggable={false} />
                <div className="h-3 w-px bg-white/20" />
                <div className="font-mono font-bold tracking-[0.3em] text-white/85 uppercase text-[13px]">
                  Resultado · Luta {String(state.config.matchNumber || 1).padStart(3, '0')}
                </div>
              </div>
              <div className="font-mono font-bold tracking-[0.25em] text-white/55 uppercase text-[11px]">
                {state.config.maxRounds || 3} rounds · sistema WT
              </div>
            </header>

            {/* HERO: Vencedor / Empate */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 py-8 relative z-10">
              {/* Faixa VENCEDOR / EMPATE */}
              <div className="mb-7 flex items-center gap-5">
                <div
                  className={cn(
                    'h-px',
                    isBlueWinner && 'bg-chung-accent',
                    isRedWinner && 'bg-hong-accent',
                    isTie && 'bg-amber-400',
                  )}
                  style={{ width: 'clamp(40px, 8vw, 140px)' }}
                />
                <span
                  className={cn(
                    'font-black uppercase tabular-nums',
                    isBlueWinner && 'text-chung-accent',
                    isRedWinner && 'text-hong-accent',
                    isTie && 'text-amber-400',
                  )}
                  style={{
                    fontSize: 'clamp(1.75rem, 3.2vw, 3rem)',
                    letterSpacing: '0.4em',
                    textShadow: isBlueWinner
                      ? '0 0 40px rgba(51, 153, 255, 0.7)'
                      : isRedWinner
                      ? '0 0 40px rgba(255, 51, 51, 0.7)'
                      : '0 0 40px rgba(250, 204, 21, 0.7)',
                  }}
                >
                  {isTie ? 'Empate' : 'Vencedor'}
                </span>
                <div
                  className={cn(
                    'h-px',
                    isBlueWinner && 'bg-chung-accent',
                    isRedWinner && 'bg-hong-accent',
                    isTie && 'bg-amber-400',
                  )}
                  style={{ width: 'clamp(40px, 8vw, 140px)' }}
                />
              </div>

              {/* Bandeira (vencedor com país conhecido) */}
              {!isTie && flagDisplay && (
                <div
                  className="mb-3 leading-none"
                  style={{
                    fontSize: 'clamp(3rem, 7vw, 6rem)',
                    filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.6))',
                  }}
                >
                  {flagDisplay}
                </div>
              )}

              {/* Nome do vencedor (ou empate dual) */}
              {!isTie ? (
                <div
                  className="font-black uppercase text-white text-center leading-[0.88] max-w-[90vw]"
                  style={{
                    fontSize: 'clamp(4rem, 13vw, 13rem)',
                    letterSpacing: '-0.025em',
                    textShadow: isBlueWinner
                      ? '0 6px 40px rgba(0,0,0,0.85), 0 0 70px rgba(51,153,255,0.45)'
                      : '0 6px 40px rgba(0,0,0,0.85), 0 0 70px rgba(255,51,51,0.45)',
                  }}
                >
                  {winnerName}
                </div>
              ) : (
                <div className="flex items-center gap-7 mb-2 max-w-[92vw] flex-wrap justify-center">
                  <span
                    className="font-black text-chung-accent uppercase leading-none"
                    style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}
                  >
                    {state.config.athleteBlue?.name || 'CHUNG'}
                  </span>
                  <span
                    className="text-white/45 font-bold uppercase tracking-[0.4em]"
                    style={{ fontSize: 'clamp(1rem, 2vw, 2rem)' }}
                  >
                    vs
                  </span>
                  <span
                    className="font-black text-hong-accent uppercase leading-none"
                    style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}
                  >
                    {state.config.athleteRed?.name || 'HONG'}
                  </span>
                </div>
              )}

              {/* País (sem bandeira mas com código) */}
              {!isTie && winnerCountry && !flagDisplay && (
                <div
                  className="mt-3 font-mono font-bold tracking-[0.35em] text-white/75 uppercase"
                  style={{ fontSize: 'clamp(0.875rem, 1.4vw, 1.25rem)' }}
                >
                  {winnerCountry}
                </div>
              )}

              {/* Placar final — destacado, lado vencedor em branco, perdedor desbotado */}
              <div className="mt-9 flex items-end gap-8 sm:gap-14">
                <div className="flex flex-col items-center">
                  <span
                    className="font-mono font-black tracking-[0.4em] text-chung-accent uppercase mb-2"
                    style={{ fontSize: 'clamp(0.7rem, 1.1vw, 1rem)' }}
                  >
                    CHUNG
                  </span>
                  <span
                    className={cn(
                      'font-black tabular-nums leading-none',
                      isBlueWinner ? 'text-white' : isTie ? 'text-white/75' : 'text-white/45',
                    )}
                    style={{
                      fontSize: 'clamp(4.5rem, 11vw, 11rem)',
                      letterSpacing: '-0.04em',
                      textShadow: isBlueWinner ? '0 4px 30px rgba(0,0,0,0.65)' : 'none',
                    }}
                  >
                    {stats.blue.totalPoints}
                  </span>
                </div>

                <div
                  className="font-black text-white/35 leading-none pb-3"
                  style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}
                >
                  ·
                </div>

                <div className="flex flex-col items-center">
                  <span
                    className="font-mono font-black tracking-[0.4em] text-hong-accent uppercase mb-2"
                    style={{ fontSize: 'clamp(0.7rem, 1.1vw, 1rem)' }}
                  >
                    HONG
                  </span>
                  <span
                    className={cn(
                      'font-black tabular-nums leading-none',
                      isRedWinner ? 'text-white' : isTie ? 'text-white/75' : 'text-white/45',
                    )}
                    style={{
                      fontSize: 'clamp(4.5rem, 11vw, 11rem)',
                      letterSpacing: '-0.04em',
                      textShadow: isRedWinner ? '0 4px 30px rgba(0,0,0,0.65)' : 'none',
                    }}
                  >
                    {stats.red.totalPoints}
                  </span>
                </div>
              </div>
            </div>

            {/* STATS BAND inferior — broadcast-grade pra treinadores das quadras */}
            <div className="shrink-0 bg-black/55 backdrop-blur-md border-t border-white/15 z-10">
              {/* Top: Rounds, Hits PSS, Gam-jeom — 3 colunas, fontes pra TV ginásio (10m+) */}
              <div className="grid grid-cols-3 divide-x divide-white/10">
                {[
                  { label: 'Rounds vencidos', blue: state.roundWinsBlue, red: state.roundWinsRed, accent: false },
                  { label: 'Hits PSS', blue: state.hitsBlue, red: state.hitsRed, accent: false },
                  { label: 'Gam-jeom', blue: state.gamjeomBlue, red: state.gamjeomRed, accent: true },
                ].map((row, i) => (
                  <div key={i} className="px-6 py-7 flex flex-col items-center">
                    <span
                      className={cn(
                        'font-mono font-black tracking-[0.32em] uppercase mb-3',
                        row.accent ? 'text-amber-400' : 'text-white/70',
                      )}
                      style={{ fontSize: 'clamp(1rem, 1.5vw, 1.4rem)' }}
                    >
                      {row.label}
                    </span>
                    <div className="flex items-baseline gap-5 sm:gap-8 tabular-nums">
                      <span
                        className={cn(
                          'font-black leading-none',
                          row.accent ? 'text-amber-400' : 'text-chung-accent',
                        )}
                        style={{ fontSize: 'clamp(2.5rem, 4.5vw, 4.5rem)' }}
                      >
                        {row.blue}
                      </span>
                      <span
                        className="text-white/40 font-black leading-none"
                        style={{ fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}
                      >
                        ×
                      </span>
                      <span
                        className={cn(
                          'font-black leading-none',
                          row.accent ? 'text-amber-400' : 'text-hong-accent',
                        )}
                        style={{ fontSize: 'clamp(2.5rem, 4.5vw, 4.5rem)' }}
                      >
                        {row.red}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats por categoria — tabela editorial, fontes legíveis a 10m+ */}
              <div className="border-t border-white/10 px-10 py-7">
                <div
                  className="font-mono font-black tracking-[0.32em] uppercase text-white/65 mb-5 text-center"
                  style={{ fontSize: 'clamp(0.95rem, 1.4vw, 1.25rem)' }}
                >
                  Golpes pontuados — por categoria
                </div>
                <div
                  className="grid gap-y-2 max-w-[1100px] mx-auto"
                  style={{ gridTemplateColumns: '1fr minmax(220px, auto) 1fr' }}
                >
                  {/* Header da tabela */}
                  <div
                    className="text-right pr-6 font-mono font-black uppercase tracking-[0.3em] text-chung-accent pb-3"
                    style={{ fontSize: 'clamp(1rem, 1.5vw, 1.4rem)' }}
                  >
                    CHUNG
                  </div>
                  <div />
                  <div
                    className="text-left pl-6 font-mono font-black uppercase tracking-[0.3em] text-hong-accent pb-3"
                    style={{ fontSize: 'clamp(1rem, 1.5vw, 1.4rem)' }}
                  >
                    HONG
                  </div>

                  {/* Linhas por categoria */}
                  {statRows.map(({ key, label }) => {
                    const blueVal = stats.blue[key];
                    const redVal = stats.red[key];
                    const blueWins = blueVal > redVal;
                    const redWins = redVal > blueVal;
                    return (
                      <Fragment key={key}>
                        <div
                          className={cn(
                            'text-right pr-6 font-black tabular-nums leading-none',
                            blueWins ? 'text-white' : 'text-white/45',
                          )}
                          style={{ fontSize: 'clamp(1.75rem, 2.8vw, 2.75rem)' }}
                        >
                          {blueVal}
                        </div>
                        <div
                          className="text-center px-4 font-mono font-black uppercase tracking-[0.28em] text-white/70 self-center"
                          style={{ fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }}
                        >
                          {label}
                        </div>
                        <div
                          className={cn(
                            'text-left pl-6 font-black tabular-nums leading-none',
                            redWins ? 'text-white' : 'text-white/45',
                          )}
                          style={{ fontSize: 'clamp(1.75rem, 2.8vw, 2.75rem)' }}
                        >
                          {redVal}
                        </div>
                      </Fragment>
                    );
                  })}

                  {/* Total golpes */}
                  <div
                    className="text-right pr-6 font-black tabular-nums text-chung-accent pt-4 border-t border-white/20 mt-2 leading-none"
                    style={{ fontSize: 'clamp(2.25rem, 3.5vw, 3.5rem)' }}
                  >
                    {stats.blue.totalHits}
                  </div>
                  <div
                    className="text-center px-4 font-mono font-black uppercase tracking-[0.32em] text-white/85 self-center pt-4 border-t border-white/20 mt-2"
                    style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)' }}
                  >
                    Total
                  </div>
                  <div
                    className="text-left pl-6 font-black tabular-nums text-hong-accent pt-4 border-t border-white/20 mt-2 leading-none"
                    style={{ fontSize: 'clamp(2.25rem, 3.5vw, 3.5rem)' }}
                  >
                    {stats.red.totalHits}
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
