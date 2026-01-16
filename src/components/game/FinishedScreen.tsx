import { useEffect, useRef, useState } from 'react';
import { Trophy, RotateCcw, Home, Medal, Sparkles } from 'lucide-react';
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
      <div className="flex flex-col h-full w-full overflow-hidden bg-background relative">
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6 md:p-8">
        <Confetti />

        {/* Background Glow */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 30%, hsl(var(--game-gold) / 0.4), transparent 60%)',
          }}
        />

        {/* Trophy */}
        <div className="relative mb-6 animate-trophy-bounce">
          <Trophy className="w-24 h-24 md:w-32 md:h-32 text-game-gold" />
          <div className="absolute inset-0 w-24 h-24 md:w-32 md:h-32 rounded-full blur-2xl animate-trophy-pulse opacity-50 bg-game-gold" />
        </div>

        {/* Athlete Name */}
        <h1 className="text-3xl md:text-5xl font-bold text-foreground text-center mb-2 animate-fade-in">
          {athleteName}
        </h1>

        {/* Score - BIG */}
        <div className="my-8 animate-scale-in">
          <div className="text-[10rem] md:text-[14rem] font-bold text-game-gold leading-none text-center drop-shadow-[0_0_40px_rgba(255,215,0,0.4)]">
            {totalKicks}
          </div>
          <div className="text-2xl md:text-3xl text-muted-foreground text-center uppercase tracking-widest">
            chutes
          </div>
        </div>

        {/* Mascote celebrando */}
        <div className="mb-4">
          <FighterMascot 
            side="red"
            state="winner" 
            size="lg"
          />
        </div>

        {/* New Record Badge */}
        {isNewRecord && (
          <div className="mb-6 px-6 py-3 bg-game-gold/20 border-2 border-game-gold rounded-full flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-5 h-5 text-game-gold" />
            <span className="text-lg font-bold text-game-gold uppercase tracking-wider">
              Novo Recorde!
            </span>
          </div>
        )}

        {/* Rank - Only if top 3 */}
        {rank && rank <= 3 && (
          <div className="mb-8 flex items-center gap-2 text-xl text-game-gold animate-fade-in">
            <Medal className="w-6 h-6" />
            <span>{rank}º lugar na academia</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col w-full max-w-sm gap-3 relative z-10">
          <Button
            size="lg"
            onClick={onPlayAgain}
            className="w-full h-16 text-xl font-bold rounded-2xl bg-game-gold hover:bg-game-gold/90 text-background transition-all hover:scale-[1.02] active:scale-[0.98]"
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
      <div className="relative mb-4 animate-trophy-bounce">
        <Trophy className={cn(
          'w-20 h-20 md:w-28 md:h-28',
          isTie ? 'text-game-yellow' : winner === 'red' ? 'text-game-red' : 'text-game-blue'
        )} />
        <div className={cn(
          'absolute inset-0 w-20 h-20 md:w-28 md:h-28 rounded-full blur-2xl animate-trophy-pulse opacity-50',
          isTie ? 'bg-game-yellow' : winner === 'red' ? 'bg-game-red' : 'bg-game-blue'
        )} />
      </div>

      {/* Winner Text - BIG */}
      <h1 className={cn(
        'text-5xl md:text-7xl font-bold text-center mb-8 animate-winner-text',
        isTie ? 'text-game-yellow' : winner === 'red' ? 'text-game-red' : 'text-game-blue'
      )}>
        {winnerText}
      </h1>

      {/* Score Cards */}
      <div className="flex gap-4 md:gap-8 mb-10 relative z-10">
        {/* Red Score */}
        <div className={cn(
          'p-6 md:p-8 rounded-2xl border-2 text-center min-w-[140px] md:min-w-[200px] animate-score-slide-left',
          winner === 'red'
            ? 'bg-game-red/20 border-game-red'
            : 'bg-game-surface border-border'
        )}>
          <div className="text-6xl md:text-8xl font-bold text-game-red">{scores.red}</div>
          {/* Mascote vermelho */}
          <div className="mt-4 flex justify-center">
            <FighterMascot 
              side="red" 
              state={winner === 'red' ? 'winner' : winner === 'tie' ? 'idle' : 'loser'} 
              size="sm"
            />
          </div>
        </div>

        {/* VS */}
        <div className="flex items-center">
          <span className="text-3xl md:text-4xl font-bold text-muted-foreground">VS</span>
        </div>

        {/* Blue Score */}
        <div className={cn(
          'p-6 md:p-8 rounded-2xl border-2 text-center min-w-[140px] md:min-w-[200px] animate-score-slide-right',
          winner === 'blue'
            ? 'bg-game-blue/20 border-game-blue'
            : 'bg-game-surface border-border'
        )}>
          <div className="text-6xl md:text-8xl font-bold text-game-blue">{scores.blue}</div>
          {/* Mascote azul */}
          <div className="mt-4 flex justify-center">
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
