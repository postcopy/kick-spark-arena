import { useEffect, useRef, useState } from 'react';
import { Trophy, RotateCcw, Home, Medal, Zap, Flag, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameResult } from '@/types/game';
import { Confetti } from './Confetti';
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
      if (isTie) {
        play('tie');
      } else if (isIndividual) {
        play('victory');
      } else if (winner === 'red') {
        play('victoryRed');
      } else if (winner === 'blue') {
        play('victoryBlue');
      } else {
        play('victory');
      }
    }
  }, [play, winner, isIndividual, isTie]);

  // Play new record sound when detected
  useEffect(() => {
    if (isNewRecord) play('newRecord');
  }, [isNewRecord, play]);

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

  // Individual Mode — Racing Finish Line
  if (isIndividual) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-[#0A0A0F] relative rounded-xl m-4 border border-white/[0.04]">
        <Confetti variant={isNewRecord ? 'golden' : 'standard'} />

        {/* Ambient glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.08) 0%, transparent 70%)' }}
        />

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-8 relative z-20">
          {/* Checkered flag icon */}
          <div className="relative mb-5 animate-trophy-bounce">
            <Flag className="w-16 h-16 md:w-20 md:h-20 text-orange-400" style={{ filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.4))' }} />
          </div>

          {/* Athlete name */}
          <h2 className="font-mono text-white/30 uppercase tracking-[0.3em] text-xs text-center mb-2 animate-fade-in">
            {athleteName}
          </h2>

          {/* Score */}
          <div className="my-4 animate-scale-in">
            <div
              className="text-[clamp(5rem,15vh,10rem)] font-display font-black leading-none text-center text-orange-400 tabular-nums"
              style={{ filter: 'drop-shadow(0 0 40px rgba(249,115,22,0.4))' }}
            >
              {totalKicks}
            </div>
            <div className="text-xs font-mono text-white/20 text-center uppercase tracking-[0.4em] mt-1">
              chutes
            </div>
          </div>

          {/* Zero score message */}
          {(totalKicks === 0 || totalKicks == null) && (
            <div className="mb-4 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center animate-fade-in max-w-sm">
              <p className="text-sm text-yellow-400 font-semibold">Nenhum chute registrado.</p>
              <p className="text-xs text-white/40 mt-1">Verifique se o equipamento está conectado ou use as teclas <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">A</kbd> e <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">L</kbd>.</p>
            </div>
          )}

          {/* Low score encouragement */}
          {totalKicks != null && totalKicks > 0 && totalKicks <= 5 && (
            <div className="mb-4 px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 animate-fade-in">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">Bom começo! Continue praticando!</span>
            </div>
          )}

          {/* New Record Badge */}
          {isNewRecord && totalKicks != null && totalKicks > 0 && (
            <div className="mb-4 px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-2 animate-fade-in">
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                Novo Recorde!
              </span>
            </div>
          )}

          {/* Rank */}
          {rank && rank <= 3 && (
            <div className="mb-4 flex items-center gap-2 font-mono text-xs text-white/30 uppercase tracking-wider animate-fade-in">
              <Medal className="w-4 h-4 text-orange-400/60" />
              <span>POSIÇÃO #{rank}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col w-full max-w-sm gap-3 relative z-10 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
            <button
              onClick={onPlayAgain}
              className="btn-juice w-full h-14 text-lg font-display font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3"
            >
              <RotateCcw className="h-5 w-5" />
              NOVA CORRIDA
            </button>
            <button
              onClick={onBackToMenu}
              className="w-full h-12 text-base font-mono uppercase tracking-wider rounded-xl border border-white/[0.06] hover:border-orange-500/20 hover:bg-orange-500/5 text-white/40 hover:text-white/60 bg-transparent transition-all flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Duo Mode — Race Results
  const redCpmFinal = duration > 0 ? Math.round((scores.red / duration) * 60) : 0;
  const blueCpmFinal = duration > 0 ? Math.round((scores.blue / duration) * 60) : 0;
  const isRedWinner = winner === 'red';
  const isBlueWinner = winner === 'blue';

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] flex flex-col items-center justify-center overflow-hidden">
      <Confetti />

      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: isTie
            ? 'radial-gradient(ellipse, rgba(249,115,22,0.06) 0%, transparent 70%)'
            : isRedWinner
              ? 'radial-gradient(ellipse, rgba(239,68,68,0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="relative z-20 flex flex-col items-center mt-8 mb-6">
        <span className="tracking-[0.5em] text-white/20 uppercase font-mono text-[10px] mb-3">
          CORRIDA FINALIZADA
        </span>
        <h1
          className={cn(
            'text-6xl md:text-8xl font-display font-black text-center',
            isTie && 'text-orange-400',
            isRedWinner && 'text-red-400',
            isBlueWinner && 'text-blue-400',
          )}
          style={{
            filter: isTie
              ? 'drop-shadow(0 0 40px rgba(249,115,22,0.3))'
              : isRedWinner
                ? 'drop-shadow(0 0 40px rgba(239,68,68,0.4))'
                : 'drop-shadow(0 0 40px rgba(59,130,246,0.4))',
          }}
        >
          {isTie ? 'EMPATE!' : isRedWinner ? 'VERMELHO!' : 'AZUL!'}
        </h1>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-3xl w-full px-6 md:px-8 relative z-20">
        {/* Red Card */}
        <div className={cn(
          'rounded-2xl border p-6 flex flex-col items-start transition-opacity',
          isBlueWinner ? 'opacity-50 border-white/[0.04] bg-white/[0.01]' : 'border-red-500/20 bg-red-500/[0.03]',
        )}>
          <div className="h-0.5 w-full bg-red-500/40 rounded-full mb-4" />
          <span className="text-7xl md:text-8xl font-display font-black text-red-400 leading-none tabular-nums">
            {scores.red}
          </span>
          <span className="font-mono text-white/25 uppercase tracking-[0.2em] text-sm mt-2">HITS</span>
          <span className="font-mono text-white/15 text-xs mt-1">{redCpmFinal} cpm</span>
        </div>

        {/* Blue Card */}
        <div className={cn(
          'rounded-2xl border p-6 flex flex-col items-end text-right transition-opacity',
          isRedWinner ? 'opacity-50 border-white/[0.04] bg-white/[0.01]' : 'border-blue-500/20 bg-blue-500/[0.03]',
        )}>
          <div className="h-0.5 w-full bg-blue-500/40 rounded-full mb-4" />
          <span className="text-7xl md:text-8xl font-display font-black text-blue-400 leading-none tabular-nums">
            {scores.blue}
          </span>
          <span className="font-mono text-white/25 uppercase tracking-[0.2em] text-sm mt-2">HITS</span>
          <span className="font-mono text-white/15 text-xs mt-1">{blueCpmFinal} cpm</span>
        </div>
      </div>

      {/* Zero score feedback */}
      {scores.red === 0 && scores.blue === 0 && (
        <div className="relative z-20 mt-4 mx-6 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center max-w-lg">
          <p className="text-sm text-yellow-400 font-semibold">Nenhum chute registrado.</p>
          <p className="text-xs text-white/40 mt-1">Verifique se o equipamento está conectado ou use as teclas <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">A</kbd> e <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">L</kbd>.</p>
        </div>
      )}
      {(scores.red + scores.blue > 0) && (scores.red + scores.blue <= 5) && (
        <div className="relative z-20 mt-4 mx-6 px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-center max-w-lg">
          <p className="text-sm font-semibold text-green-400">Bom começo! Continue praticando!</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-auto pb-8 relative z-20">
        <button
          onClick={onPlayAgain}
          className="btn-juice px-8 py-4 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-display font-bold uppercase tracking-wider hover:from-orange-500 hover:to-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center gap-2"
        >
          <RotateCcw className="h-5 w-5" />
          REVANCHE
        </button>
        <button
          onClick={onBackToMenu}
          className="px-8 py-4 rounded-xl border border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10 hover:bg-white/[0.03] bg-transparent font-display font-bold uppercase tracking-wider transition-all flex items-center gap-2"
        >
          <Home className="h-5 w-5" />
          MENU
        </button>
      </div>
    </div>
  );
}
