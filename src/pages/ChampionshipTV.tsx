import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatTime, MatchEvent, ScoreType } from '@/types/championship';
import { useChampionshipSync } from '@/hooks/useChampionshipSync';
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
  
  const { state, isConnected } = useChampionshipSync({
    role: 'listener',
    matId,
  });
  
  const [pulseRed, setPulseRed] = useState(false);
  const [pulseBlue, setPulseBlue] = useState(false);
  
  // Track score changes for pulse animation
  useEffect(() => {
    setPulseRed(true);
    const timer = setTimeout(() => setPulseRed(false), 300);
    return () => clearTimeout(timer);
  }, [state.roundScoreRed]);
  
  useEffect(() => {
    setPulseBlue(true);
    const timer = setTimeout(() => setPulseBlue(false), 300);
    return () => clearTimeout(timer);
  }, [state.roundScoreBlue]);
  
  // No signal state
  if (!isConnected) {
    return (
      <div className="h-screen w-screen bg-[hsl(var(--sulsport-black))] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-zinc-600 mb-4">SEM SINAL</div>
          <div className="text-xl text-zinc-700">
            Aguardando conexão com Mesa de Luta (MAT {matId})
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
    <div className="h-screen w-screen bg-[hsl(var(--sulsport-black))] flex flex-col overflow-hidden select-none">
      {/* Header Superior com Logo SPE */}
      <header className="h-14 bg-[hsl(var(--sulsport-dark))] border-b border-[hsl(var(--sulsport-gray))] flex items-center justify-center">
        <img 
          src={logoSpe} 
          alt="SPE" 
          className="h-8 w-auto object-contain"
        />
      </header>
      
      {/* Main 3-Column Layout */}
      <div className="flex-1 flex items-stretch p-6 gap-4">
        {/* BLUE Side - Left Column */}
        <div className={cn(
          "flex-1 flex flex-col bg-[hsl(var(--sulsport-blue))] rounded-2xl overflow-hidden transition-transform duration-200",
          pulseBlue && "scale-[1.01]"
        )}>
          {/* Athlete Name */}
          <div className="h-24 flex items-center justify-center border-b border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white uppercase tracking-wider">
                {state.config.athleteBlue?.name || 'CHUNG'}
              </div>
              {state.config.athleteBlue?.country && (
                <div className="text-xl text-white/70">
                  ({state.config.athleteBlue.country})
                </div>
              )}
            </div>
          </div>
          
          {/* Score */}
          <div className="flex-1 flex items-center justify-center">
            <div 
              className={cn(
                "font-black text-white leading-none tabular-nums transition-transform duration-200",
                pulseBlue && "scale-105"
              )}
              style={{ fontSize: 'clamp(140px, 20vw, 280px)' }}
            >
              {state.roundScoreBlue}
            </div>
          </div>
          
          {/* Footer: GAM-JEOM / ROUNDS / HITS */}
          <div className="h-32 bg-[hsl(var(--sulsport-blue-dark))] grid grid-cols-3 divide-x divide-white/10">
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">GAM-JEOM</div>
              <div className="text-4xl font-black text-white">{state.gamjeomBlue}</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">ROUNDS</div>
              <div className="flex gap-2 text-white">
                {renderRoundIndicators(state.roundWinsBlue, state.config.maxRounds)}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">HITS</div>
              <div className="text-4xl font-black text-white">{state.hitsBlue}</div>
            </div>
          </div>
        </div>
        
        {/* CENTER Column - Timer & Round */}
        <div className="w-72 flex flex-col bg-[hsl(var(--sulsport-dark))] rounded-2xl overflow-hidden border border-[hsl(var(--sulsport-gray))]">
          {/* MATCH header + number */}
          <div className="flex-1 flex flex-col items-center justify-center border-b border-[hsl(var(--sulsport-gray))]">
            <span className="text-2xl font-bold text-white uppercase tracking-[0.3em]">MATCH</span>
            <span className="text-4xl font-bold text-white tabular-nums">
              {state.config.matchNumber || '001'}
            </span>
          </div>
          
          {/* Timer - Yellow BAND (thin, fixed height h-24) */}
          <div className={cn(
            "h-24 flex items-center justify-center",
            isMedical 
              ? "bg-[hsl(var(--sulsport-yellow-dark))]" 
              : "bg-[hsl(var(--sulsport-yellow))]"
          )}>
            <div 
              className={cn(
                "font-black leading-none tabular-nums text-black",
                state.timeLeftMs <= 10000 && isRunning && "animate-pulse"
              )}
              style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
            >
              {formatTime(state.timeLeftMs)}
            </div>
          </div>
          
          {/* Status (PAUSADO / T. MÉDICO) - texto simples, NÃO badge */}
          {!isRunning && !isMatchEnd && (
            <div className="h-12 flex items-center justify-center">
              <span className="text-xl font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider">
                {isMedical ? 'T. MÉDICO' : 'PAUSADO'}
              </span>
            </div>
          )}
          
          {/* ROUND info */}
          <div className="flex-1 flex flex-col items-center justify-center border-t border-[hsl(var(--sulsport-gray))]">
            <span className="text-lg text-white/60 uppercase font-bold tracking-wider">ROUND</span>
            <span className="text-7xl font-black text-white">{state.round}</span>
          </div>
        </div>
        
        {/* RED Side - Right Column */}
        <div className={cn(
          "flex-1 flex flex-col bg-[hsl(var(--sulsport-red))] rounded-2xl overflow-hidden transition-transform duration-200",
          pulseRed && "scale-[1.01]"
        )}>
          {/* Athlete Name */}
          <div className="h-24 flex items-center justify-center border-b border-white/10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white uppercase tracking-wider">
                {state.config.athleteRed?.name || 'HONG'}
              </div>
              {state.config.athleteRed?.country && (
                <div className="text-xl text-white/70">
                  ({state.config.athleteRed.country})
                </div>
              )}
            </div>
          </div>
          
          {/* Score */}
          <div className="flex-1 flex items-center justify-center">
            <div 
              className={cn(
                "font-black text-white leading-none tabular-nums transition-transform duration-200",
                pulseRed && "scale-105"
              )}
              style={{ fontSize: 'clamp(140px, 20vw, 280px)' }}
            >
              {state.roundScoreRed}
            </div>
          </div>
          
          {/* Footer: GAM-JEOM / ROUNDS / HITS */}
          <div className="h-32 bg-[hsl(var(--sulsport-red-dark))] grid grid-cols-3 divide-x divide-white/10">
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">GAM-JEOM</div>
              <div className="text-4xl font-black text-white">{state.gamjeomRed}</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">ROUNDS</div>
              <div className="flex gap-2 text-white">
                {renderRoundIndicators(state.roundWinsRed, state.config.maxRounds)}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-white/60 uppercase font-bold tracking-wider">HITS</div>
              <div className="text-4xl font-black text-white">{state.hitsRed}</div>
            </div>
          </div>
        </div>
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
          <div className="absolute inset-0 bg-[hsl(var(--sulsport-black))] flex flex-col items-center justify-center z-50 animate-in fade-in duration-500 overflow-auto py-4">
            {/* Background gradient based on winner */}
            <div className={cn(
              "absolute inset-0 opacity-20",
              isBlueWinner && "bg-gradient-to-br from-[hsl(var(--sulsport-blue))] to-transparent",
              isRedWinner && "bg-gradient-to-br from-[hsl(var(--sulsport-red))] to-transparent",
              isTie && "bg-gradient-to-br from-[hsl(var(--sulsport-yellow))] to-transparent"
            )} />
            
            <div className="relative z-10 flex flex-col items-center max-w-[90vw] w-full">
              {/* Header: MATCH 001 RESULT */}
              <div className="text-center mb-4">
                <h1 
                  className="font-black text-white uppercase tracking-[0.2em]"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)' }}
                >
                  MATCH {state.config.matchNumber || '001'} RESULT
                </h1>
              </div>
              
              {/* Faixa VENCEDOR/EMPATE + Placar Final (PONTOS TOTAIS) */}
              <div className="flex items-stretch mb-4">
                {/* VENCEDOR / EMPATE - Faixa amarela */}
                <div className="bg-[hsl(var(--sulsport-yellow))] px-6 py-3 flex items-center">
                  <span 
                    className="font-black text-black uppercase"
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                  >
                    {isTie ? 'EMPATE' : 'VENCEDOR'}
                  </span>
                </div>
                
                {/* Placar Final AZUL (total points from events) */}
                <div className="bg-[hsl(var(--sulsport-blue))] px-5 py-3 flex flex-col items-center justify-center min-w-[70px]">
                  <span 
                    className="font-black text-white tabular-nums leading-none"
                    style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}
                  >
                    {stats.blue.totalPoints}
                  </span>
                </div>
                
                {/* Placar Final VERMELHO (total points from events) */}
                <div className="bg-[hsl(var(--sulsport-red))] px-5 py-3 flex flex-col items-center justify-center min-w-[70px]">
                  <span 
                    className="font-black text-white tabular-nums leading-none"
                    style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}
                  >
                    {stats.red.totalPoints}
                  </span>
                </div>
              </div>
              
              {/* Rounds ganhos - Secundário */}
              <div className="flex items-center gap-3 mb-4 text-white/60">
                <span className="uppercase tracking-wider" style={{ fontSize: 'clamp(0.75rem, 1.25vw, 1rem)' }}>
                  Rounds:
                </span>
                <span className="font-bold text-[hsl(var(--sulsport-blue-light))]" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}>
                  {state.roundWinsBlue}
                </span>
                <span>x</span>
                <span className="font-bold text-[hsl(var(--sulsport-red-light))]" style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}>
                  {state.roundWinsRed}
                </span>
              </div>
              
              {/* Nome do Vencedor ou ambos em caso de empate */}
              {!isTie ? (
                <div className="flex items-stretch mb-6">
                  {/* Bandeira/País */}
                  {flagDisplay && (
                    <div className="bg-zinc-800 px-4 flex items-center justify-center border-r border-white/20">
                      <span style={{ fontSize: 'clamp(1.5rem, 3vw, 3rem)' }}>
                        {flagDisplay}
                      </span>
                    </div>
                  )}
                  
                  {/* Nome do Vencedor */}
                  <div className={cn(
                    "px-8 py-4 flex items-center",
                    isBlueWinner ? "bg-[hsl(var(--sulsport-blue))]" : "bg-[hsl(var(--sulsport-red))]"
                  )}>
                    <span 
                      className="font-black text-white uppercase"
                      style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
                    >
                      {winnerName}
                    </span>
                  </div>
                </div>
              ) : (
                /* Empate - Mostra ambos os nomes */
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[hsl(var(--sulsport-blue))] px-6 py-3">
                    <span 
                      className="font-bold text-white uppercase"
                      style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                    >
                      {state.config.athleteBlue?.name || 'CHUNG'}
                    </span>
                  </div>
                  <span 
                    className="text-white/60 font-bold"
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                  >
                    vs
                  </span>
                  <div className="bg-[hsl(var(--sulsport-red))] px-6 py-3">
                    <span 
                      className="font-bold text-white uppercase"
                      style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
                    >
                      {state.config.athleteRed?.name || 'HONG'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* ESTATÍSTICAS DA LUTA - Modo compacto para 720p */}
              <div className="w-full max-w-[600px]">
                <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                  <h2 
                    className="text-center text-white/50 uppercase tracking-[0.2em] mb-3 font-bold"
                    style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1rem)' }}
                  >
                    Estatísticas (Golpes Pontuados)
                  </h2>
                  
                  {/* Grid compacto de stats */}
                  <div className="grid grid-cols-3 gap-y-1 text-center">
                    {/* Header */}
                    <div 
                      className="text-[hsl(var(--sulsport-blue-light))] font-bold uppercase"
                      style={{ fontSize: 'clamp(0.625rem, 1vw, 0.875rem)' }}
                    >
                      AZUL
                    </div>
                    <div></div>
                    <div 
                      className="text-[hsl(var(--sulsport-red-light))] font-bold uppercase"
                      style={{ fontSize: 'clamp(0.625rem, 1vw, 0.875rem)' }}
                    >
                      VERMELHO
                    </div>
                    
                    {/* Stats rows */}
                    {statRows.map(({ key, label }) => (
                      <Fragment key={key}>
                        <div 
                          className="text-[hsl(var(--sulsport-blue-light))] font-bold tabular-nums"
                          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
                        >
                          {stats.blue[key]}
                        </div>
                        <div 
                          className="text-white/50 uppercase"
                          style={{ fontSize: 'clamp(0.5rem, 0.9vw, 0.75rem)' }}
                        >
                          {label}
                        </div>
                        <div 
                          className="text-[hsl(var(--sulsport-red-light))] font-bold tabular-nums"
                          style={{ fontSize: 'clamp(0.875rem, 1.5vw, 1.25rem)' }}
                        >
                          {stats.red[key]}
                        </div>
                      </Fragment>
                    ))}
                    
                    {/* Separator */}
                    <div className="col-span-3 border-t border-white/20 my-2"></div>
                    
                    {/* Total Hits */}
                    <div 
                      className="text-[hsl(var(--sulsport-blue-light))] font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {stats.blue.totalHits}
                    </div>
                    <div 
                      className="text-white font-bold uppercase"
                      style={{ fontSize: 'clamp(0.625rem, 1vw, 0.875rem)' }}
                    >
                      TOTAL GOLPES
                    </div>
                    <div 
                      className="text-[hsl(var(--sulsport-red-light))] font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {stats.red.totalHits}
                    </div>
                    
                    {/* HITS (hardware touches) */}
                    <div 
                      className="text-[hsl(var(--sulsport-blue-light))] font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {state.hitsBlue}
                    </div>
                    <div 
                      className="text-white font-bold uppercase"
                      style={{ fontSize: 'clamp(0.625rem, 1vw, 0.875rem)' }}
                    >
                      HITS
                    </div>
                    <div 
                      className="text-[hsl(var(--sulsport-red-light))] font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {state.hitsRed}
                    </div>
                    
                    {/* Gam-jeoms */}
                    <div 
                      className="text-[hsl(var(--sulsport-blue-light))] font-black tabular-nums"
                      style={{ fontSize: 'clamp(1rem, 1.75vw, 1.5rem)' }}
                    >
                      {state.gamjeomBlue}
                    </div>
                    <div 
                      className="text-white font-bold uppercase"
                      style={{ fontSize: 'clamp(0.625rem, 1vw, 0.875rem)' }}
                    >
                      GAM-JEOM
                    </div>
                    <div 
                      className="text-[hsl(var(--sulsport-red-light))] font-black tabular-nums"
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
      
      {isRoundEnd && !isMatchEnd && state.roundScoreRed === state.roundScoreBlue && state.hitsRed === state.hitsBlue && (
        <div className="h-20 bg-[hsl(var(--sulsport-yellow))]/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-[hsl(var(--sulsport-yellow))] uppercase tracking-wider">
            EMPATE — AGUARDANDO DECISÃO DO ÁRBITRO
          </span>
        </div>
      )}
    </div>
  );
}
