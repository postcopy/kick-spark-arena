import { useEffect, useRef, useState } from 'react';
import { Trophy, RotateCcw, Home, Medal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GameResult } from '@/types/game';
import { Confetti } from './Confetti';
import { FighterMascot } from './FighterMascot';
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

  // Duo Mode UI - Simplified
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background relative">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-8">
      <Confetti />

      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: isTie
            ? 'radial-gradient(circle at 50% 30%, hsl(var(--game-yellow) / 0.4), transparent 60%)'
            : winner === 'red'
            ? 'radial-gradient(circle at 50% 30%, hsl(var(--game-red) / 0.4), transparent 60%)'
            : 'radial-gradient(circle at 50% 30%, hsl(var(--game-blue) / 0.4), transparent 60%)',
        }}
      />

      {/* Trophy */}
      <div className="relative mb-3 animate-trophy-bounce">
        <Trophy className={cn(
          'w-14 h-14 md:w-16 md:h-16',
          isTie ? 'text-game-yellow' : winner === 'red' ? 'text-game-red' : 'text-game-blue'
        )} />
        <div className={cn(
          'absolute inset-0 w-14 h-14 md:w-16 md:h-16 rounded-full blur-2xl animate-trophy-pulse opacity-50',
          isTie ? 'bg-game-yellow' : winner === 'red' ? 'bg-game-red' : 'bg-game-blue'
        )} />
      </div>

      {/* Winner Text */}
      <h1 className={cn(
        'text-4xl md:text-5xl font-bold text-center mb-4 animate-winner-text',
        isTie ? 'text-game-yellow' : winner === 'red' ? 'text-game-red' : 'text-game-blue'
      )}>
        {winnerText}
      </h1>

      {/* Score Cards */}
      <div className="flex gap-3 md:gap-6 mb-6 relative z-10">
        {/* Red Score */}
        <div className={cn(
          'p-4 md:p-6 rounded-2xl border-2 text-center min-w-[100px] md:min-w-[140px] animate-score-slide-left',
          winner === 'red'
            ? 'bg-game-red/20 border-game-red'
            : 'bg-game-surface border-border'
        )}>
          <div className="text-4xl md:text-5xl font-bold text-game-red">{scores.red}</div>
          {/* Mascote vermelho */}
          <div className="mt-2 flex justify-center">
            <FighterMascot 
              side="red" 
              state={winner === 'red' ? 'winner' : winner === 'tie' ? 'idle' : 'loser'} 
              size="sm"
            />
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center">
          <span className="text-2xl md:text-3xl font-bold text-muted-foreground">VS</span>
        </div>

        {/* Blue Score */}
        <div className={cn(
          'p-4 md:p-6 rounded-2xl border-2 text-center min-w-[100px] md:min-w-[140px] animate-score-slide-right',
          winner === 'blue'
            ? 'bg-game-blue/20 border-game-blue'
            : 'bg-game-surface border-border'
        )}>
          <div className="text-4xl md:text-5xl font-bold text-game-blue">{scores.blue}</div>
          {/* Mascote azul */}
          <div className="mt-2 flex justify-center">
            <FighterMascot 
              side="blue" 
              state={winner === 'blue' ? 'winner' : winner === 'tie' ? 'idle' : 'loser'} 
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full max-w-sm gap-3 relative z-10">
        <Button
          size="lg"
          onClick={onPlayAgain}
          className="w-full h-16 text-xl font-bold rounded-2xl bg-game-yellow hover:bg-game-yellow/90 text-background transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RotateCcw className="mr-3 h-6 w-6" />
          JOGAR DE NOVO
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onBackToMenu}
          className="w-full h-14 text-lg rounded-2xl"
        >
          <Home className="mr-2 h-5 w-5" />
          Menu
        </Button>
      </div>
      </div>
    </div>
  );
}
