import { useEffect, useRef, useState } from 'react';
import { Trophy, RotateCcw, Home, Medal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameResult } from '@/types/game';
import { Confetti } from './Confetti';
import bgMenuModos from '@/assets/menu-modos.jpg';
import { useSound } from '@/contexts/SoundContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FinishedScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function FinishedScreen({ result, onPlayAgain, onBackToMenu }: FinishedScreenProps) {
  const { scores, winner, duration, isIndividual, athleteName, totalKicks } = result;
  const isTie = winner === 'tie';
  const { play } = useSound();
  const { user } = useAuth();
  const hasPlayedRef = useRef(false);
  const [rank, setRank] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      if (isIndividual) {
        play('victory');
      } else if (winner === 'red') {
        play('victoryRed');
      } else if (winner === 'blue') {
        play('victoryBlue');
      } else {
        play('victory');
      }
    }
  }, [play, winner, isIndividual]);

  // Fetch rank for individual mode
  useEffect(() => {
    if (isIndividual && user && result.athleteId && totalKicks) {
      fetchRankAndRecord();
    }
  }, [isIndividual, user, result.athleteId, totalKicks]);

  const fetchRankAndRecord = async () => {
    if (!user || !result.athleteId) return;

    try {
      const { data: prevBest } = await supabase
        .from('solo_results')
        .select('kicks')
        .eq('athlete_id', result.athleteId)
        .eq('duration_seconds', duration)
        .order('kicks', { ascending: false })
        .limit(1);

      if (prevBest && prevBest.length > 0) {
        const { count } = await supabase
          .from('solo_results')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', result.athleteId)
          .eq('duration_seconds', duration);
        
        setIsNewRecord(count === 1 || (totalKicks || 0) >= prevBest[0].kicks);
      } else {
        setIsNewRecord(true);
      }

      const { data: allResults } = await supabase
        .from('solo_results')
        .select('kicks, athlete_id')
        .eq('academy_id', user.id)
        .eq('duration_seconds', duration)
        .order('kicks', { ascending: false });

      if (allResults) {
        const bestByAthlete = new Map<string, number>();
        allResults.forEach((r) => {
          if (!bestByAthlete.has(r.athlete_id) || r.kicks > bestByAthlete.get(r.athlete_id)!) {
            bestByAthlete.set(r.athlete_id, r.kicks);
          }
        });

        const sorted = Array.from(bestByAthlete.entries()).sort((a, b) => b[1] - a[1]);
        const athleteRank = sorted.findIndex(([id]) => id === result.athleteId) + 1;
        setRank(athleteRank || null);
      }
    } catch (err) {
      console.error('Error fetching rank:', err);
    }
  };

  // Winner color
  const winnerColor = isTie ? 'game-yellow' : winner === 'red' ? 'game-red' : 'game-blue';
  const winnerText = isTie ? 'EMPATE!' : winner === 'red' ? 'VERMELHO!' : 'AZUL!';

  // Individual Mode UI - Simplified
  if (isIndividual) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-[#0b1120] relative border-2 border-white/5 rounded-xl m-4">
        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
          }}
        />

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-8 relative z-20">
        <Confetti />

        {/* Background Glow - Cyan */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(34,211,238,0.15), transparent 60%)',
          }}
        />

        {/* Trophy - Cyan Neon */}
        <div className="relative mb-6 animate-trophy-bounce" style={{ filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.6))' }}>
          <Trophy className="w-20 h-20 md:w-24 md:h-24 text-[#22d3ee]" />
        </div>

        {/* Athlete Name - Technical */}
        <h2 className="font-mono text-slate-400 uppercase tracking-[0.2em] text-sm text-center mb-2 animate-fade-in">
          {athleteName}
        </h2>

        {/* Score - Gradient Gold/Cyan */}
        <div className="my-4 animate-scale-in" style={{ filter: 'drop-shadow(0 0 25px rgba(34,211,238,0.5))' }}>
          <div className="text-[clamp(5rem,15vh,10rem)] font-bold leading-none text-center bg-gradient-to-r from-yellow-400 to-cyan-400 bg-clip-text text-transparent">
            {totalKicks}
          </div>
          <div className="text-sm font-mono text-slate-500 text-center uppercase tracking-[0.3em] mt-1">
            chutes
          </div>
        </div>

        {/* New Record Badge - Neon Tag */}
        {isNewRecord && (
          <div className="mb-4 px-4 py-1.5 bg-cyan-500 text-black rounded-sm flex items-center gap-2 animate-fade-in shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Novo Recorde!
            </span>
          </div>
        )}

        {/* Rank - Technical */}
        {rank && rank <= 3 && (
          <div className="mb-4 flex items-center gap-2 font-mono text-xs text-slate-400 uppercase tracking-wider animate-fade-in">
            <Medal className="w-4 h-4 text-[#22d3ee]" />
            <span>RANK #{rank} — TOP PERFORMANCE</span>
          </div>
        )}

        {/* Actions - Technical Buttons */}
        <div className="flex flex-col w-full max-w-sm gap-3 relative z-10 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          <button
            onClick={onPlayAgain}
            className="w-full h-16 text-xl font-bold uppercase tracking-wider rounded-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-3"
          >
            <RotateCcw className="h-6 w-6" />
            JOGAR DE NOVO
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full h-14 text-lg font-mono uppercase tracking-wider rounded-sm border border-white/10 hover:border-cyan-400 hover:text-cyan-400 text-slate-300 bg-transparent transition-all flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Menu
          </button>
        </div>
        </div>
      </div>
    );
  }

  // Duo Mode UI — Industrial Cyber After-Action Report
  const redCpmFinal = duration > 0 ? Math.round((scores.red / duration) * 60) : 0;
  const blueCpmFinal = duration > 0 ? Math.round((scores.blue / duration) * 60) : 0;
  const isRedWinner = winner === 'red';
  const isBlueWinner = winner === 'blue';

  const buttonClipPath = 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)';

  return (
    <div className="fixed inset-0 bg-[#0b1120] flex flex-col items-center justify-center overflow-hidden">
      {/* Background image */}
      <img src={bgMenuModos} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.05] pointer-events-none" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
        }}
      />

      <Confetti />

      {/* Header — O Veredito */}
      <div className="relative z-20 flex flex-col items-center mt-8 mb-6">
        <span className="tracking-[0.5em] text-white/40 uppercase font-mono text-xs mb-3">
          SESSÃO FINALIZADA
        </span>
        <h1
          className={cn(
            'text-6xl md:text-8xl font-black italic text-center',
            isTie && 'text-white',
            isRedWinner && 'text-red-500',
            isBlueWinner && 'text-blue-500',
          )}
          style={{
            filter: isTie
              ? 'drop-shadow(0 0 40px rgba(255,255,255,0.3))'
              : isRedWinner
              ? 'drop-shadow(0 0 40px rgba(239,68,68,0.5))'
              : 'drop-shadow(0 0 40px rgba(59,130,246,0.5))',
          }}
        >
          {winnerText}
        </h1>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 gap-6 max-w-3xl w-full px-8 relative z-20">
        {/* Red Card */}
        <div
          className={cn(
            'bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md border border-white/10 rounded-none p-6 flex flex-col items-start transition-opacity',
            isBlueWinner && 'opacity-60',
          )}
        >
          <div className="h-1 w-full bg-red-500 mb-4" />
          <span className="text-8xl font-black italic text-red-500 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {scores.red}
          </span>
          <span className="font-mono text-white/40 uppercase tracking-widest text-sm mt-2">HITS</span>
          <span className="font-mono text-white/30 text-xs mt-1">CPM: {redCpmFinal}</span>
        </div>

        {/* Blue Card */}
        <div
          className={cn(
            'bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md border border-white/10 rounded-none p-6 flex flex-col items-end text-right transition-opacity',
            isRedWinner && 'opacity-60',
          )}
        >
          <div className="h-1 w-full bg-blue-500 mb-4" />
          <span className="text-8xl font-black italic text-blue-500 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {scores.blue}
          </span>
          <span className="font-mono text-white/40 uppercase tracking-widest text-sm mt-2">HITS</span>
          <span className="font-mono text-white/30 text-xs mt-1">CPM: {blueCpmFinal}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-auto pb-8 relative z-20">
        <button
          onClick={onPlayAgain}
          className="px-8 py-4 bg-[#FFD700] text-black font-bold uppercase tracking-wider hover:brightness-110 transition-all"
          style={{ clipPath: buttonClipPath }}
        >
          <span className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            JOGAR DE NOVO
          </span>
        </button>
        <button
          onClick={onBackToMenu}
          className="px-8 py-4 border border-white/20 text-white hover:bg-white/10 bg-transparent font-bold uppercase tracking-wider transition-all"
          style={{ clipPath: buttonClipPath }}
        >
          <span className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            MENU
          </span>
        </button>
      </div>
    </div>
  );
}
