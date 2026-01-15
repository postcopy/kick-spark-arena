import { useEffect, useRef, useState } from 'react';
import { Trophy, RotateCcw, Home, Timer, Medal, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      // Play sound based on winner
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
      // Check if this is a new personal record
      const { data: prevBest } = await supabase
        .from('solo_results')
        .select('kicks')
        .eq('athlete_id', result.athleteId)
        .eq('duration_seconds', duration)
        .order('kicks', { ascending: false })
        .limit(1);

      if (prevBest && prevBest.length > 0) {
        // If current kicks equals the best (we just saved it), check if there's only one entry
        const { count } = await supabase
          .from('solo_results')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', result.athleteId)
          .eq('duration_seconds', duration);
        
        setIsNewRecord(count === 1 || (totalKicks || 0) >= prevBest[0].kicks);
      } else {
        setIsNewRecord(true);
      }

      // Calculate rank in academy for this duration
      const { data: allResults } = await supabase
        .from('solo_results')
        .select('kicks, athlete_id')
        .eq('academy_id', user.id)
        .eq('duration_seconds', duration)
        .order('kicks', { ascending: false });

      if (allResults) {
        // Get unique best scores per athlete
        const bestByAthlete = new Map<string, number>();
        allResults.forEach((r) => {
          if (!bestByAthlete.has(r.athlete_id) || r.kicks > bestByAthlete.get(r.athlete_id)!) {
            bestByAthlete.set(r.athlete_id, r.kicks);
          }
        });

        // Sort and find rank
        const sorted = Array.from(bestByAthlete.entries()).sort((a, b) => b[1] - a[1]);
        const athleteRank = sorted.findIndex(([id]) => id === result.athleteId) + 1;
        setRank(athleteRank || null);
      }
    } catch (err) {
      console.error('Error fetching rank:', err);
    }
  };

  // Individual Mode UI
  if (isIndividual) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative overflow-hidden">
        {/* Confetti Animation */}
        <Confetti />

        {/* Background Glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 50% 30%, hsl(var(--game-gold) / 0.3), transparent 70%)',
          }}
        />

        {/* Winner Announcement */}
        <div className="mb-12 text-center relative z-10">
          {/* Trophy with bounce animation */}
          <div className="relative inline-block">
            <Trophy
              className="w-32 h-32 mx-auto mb-6 animate-trophy-bounce text-game-gold"
              style={{ animationDelay: '0s' }}
            />
            {/* Trophy glow pulse */}
            <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full blur-2xl animate-trophy-pulse opacity-50 bg-game-gold" />
          </div>

          {/* Mode indicator */}
          <div
            className="flex items-center justify-center gap-2 mb-4 animate-winner-text opacity-0"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
          >
            <Timer className="w-6 h-6 text-game-gold" />
            <span className="text-xl text-game-gold uppercase tracking-wider font-semibold">
              Time Attack Individual
            </span>
          </div>

          {/* Athlete Name */}
          <div
            className="flex items-center justify-center gap-3 mb-4 animate-winner-text opacity-0"
            style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
          >
            <User className="w-8 h-8 text-game-gold" />
            <span className="text-4xl font-bold text-foreground">{athleteName}</span>
          </div>

          {/* Duration */}
          <p
            className="text-2xl text-muted-foreground animate-winner-text opacity-0"
            style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
          >
            Tempo: {duration}s
          </p>
        </div>

        {/* Score Card */}
        <div
          className="p-10 rounded-xl border-4 border-game-gold text-center min-w-[320px] bg-game-gold/10 box-glow-gold opacity-0 animate-winner-text mb-8"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
          <div className="text-[10rem] font-bold text-game-gold leading-none">{totalKicks}</div>
          <span className="text-2xl text-muted-foreground">chutes</span>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-game-gold/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-game-gold">
                {((totalKicks || 0) / duration).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">chutes/s</div>
            </div>
            {rank && (
              <div className="text-center">
                <div className="text-3xl font-bold text-game-gold flex items-center justify-center gap-1">
                  <Medal className="w-6 h-6" />
                  {rank}º
                </div>
                <div className="text-sm text-muted-foreground">ranking</div>
              </div>
            )}
          </div>
        </div>

        {/* New Record Badge */}
        {isNewRecord && (
          <div
            className="mb-8 px-6 py-3 bg-game-gold/20 border-2 border-game-gold rounded-full animate-winner-text opacity-0"
            style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
          >
            <span className="text-xl font-bold text-game-gold uppercase tracking-wider">
              🎉 Novo Recorde Pessoal!
            </span>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex gap-4 relative z-10 opacity-0 animate-buttons-fade"
          style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={onBackToMenu}
            className="text-xl px-8 py-6 transition-transform hover:scale-105"
          >
            <Home className="mr-2 h-6 w-6" />
            Menu
          </Button>
          <Button
            size="lg"
            onClick={onPlayAgain}
            className="text-xl px-12 py-6 bg-game-gold hover:bg-game-gold/90 text-background font-bold transition-transform hover:scale-105"
          >
            <RotateCcw className="mr-2 h-6 w-6" />
            JOGAR DE NOVO
          </Button>
        </div>

        {/* Keyboard hint */}
        <p
          className="mt-8 text-muted-foreground relative z-10 opacity-0 animate-buttons-fade"
          style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}
        >
          <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd> para jogar novamente •{' '}
          <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">ESC</kbd> para voltar ao menu
        </p>
      </div>
    );
  }

  // Duo Mode UI (original)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Confetti Animation */}
      <Confetti />

      {/* Background Glow */}
      <div
        className={cn(
          'absolute inset-0 opacity-20',
          isTie
            ? 'bg-radial-gradient from-game-yellow/30 to-transparent'
            : winner === 'red'
            ? 'bg-radial-gradient from-game-red/30 to-transparent'
            : 'bg-radial-gradient from-game-blue/30 to-transparent'
        )}
        style={{
          background: isTie
            ? 'radial-gradient(circle at 50% 30%, hsl(var(--game-yellow) / 0.3), transparent 70%)'
            : winner === 'red'
            ? 'radial-gradient(circle at 50% 30%, hsl(var(--game-red) / 0.3), transparent 70%)'
            : 'radial-gradient(circle at 50% 30%, hsl(var(--game-blue) / 0.3), transparent 70%)',
        }}
      />

      {/* Winner Announcement */}
      <div className="mb-12 text-center relative z-10">
        {/* Trophy with bounce animation */}
        <div className="relative inline-block">
          <Trophy
            className={cn(
              'w-32 h-32 mx-auto mb-6 animate-trophy-bounce',
              isTie ? 'text-game-yellow' : winner === 'red' ? 'text-game-red' : 'text-game-blue'
            )}
            style={{ animationDelay: '0s' }}
          />
          {/* Trophy glow pulse */}
          <div
            className={cn(
              'absolute inset-0 w-32 h-32 mx-auto rounded-full blur-2xl animate-trophy-pulse opacity-50',
              isTie ? 'bg-game-yellow' : winner === 'red' ? 'bg-game-red' : 'bg-game-blue'
            )}
          />
        </div>

        {/* Mode indicator */}
        <div
          className="flex items-center justify-center gap-2 mb-4 animate-winner-text opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          <Timer className="w-6 h-6 text-game-yellow" />
          <span className="text-xl text-game-yellow uppercase tracking-wider font-semibold">
            Time Attack
          </span>
        </div>

        {/* Winner text with scale animation */}
        <h1
          className={cn(
            'text-7xl md:text-8xl font-bold mb-2 animate-winner-text opacity-0',
            isTie
              ? 'text-game-yellow text-glow-yellow'
              : winner === 'red'
              ? 'text-game-red text-glow-red'
              : 'text-game-blue text-glow-blue'
          )}
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          {isTie ? 'EMPATE!' : `${winner.toUpperCase()} VENCE!`}
        </h1>
        <p
          className="text-2xl text-muted-foreground animate-winner-text opacity-0"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
          Tempo: {duration}s
        </p>
      </div>

      {/* Score Cards */}
      <div className="flex gap-8 mb-12 relative z-10">
        {/* Red Score - slides from left */}
        <div
          className={cn(
            'p-8 rounded-xl border-2 text-center min-w-[260px] opacity-0 animate-score-slide-left',
            winner === 'red'
              ? 'bg-game-red/20 border-game-red box-glow-red'
              : 'bg-game-surface border-border'
          )}
          style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}
        >
          <span className="text-2xl font-bold text-game-red uppercase tracking-wider">RED</span>
          <div className="text-9xl font-bold text-game-red mt-2">{scores.red}</div>
          <span className="text-lg text-muted-foreground">chutes</span>
        </div>

        {/* VS */}
        <div
          className="flex items-center opacity-0 animate-winner-text"
          style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
        >
          <span className="text-5xl font-bold text-muted-foreground">VS</span>
        </div>

        {/* Blue Score - slides from right */}
        <div
          className={cn(
            'p-8 rounded-xl border-2 text-center min-w-[260px] opacity-0 animate-score-slide-right',
            winner === 'blue'
              ? 'bg-game-blue/20 border-game-blue box-glow-blue'
              : 'bg-game-surface border-border'
          )}
          style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}
        >
          <span className="text-2xl font-bold text-game-blue uppercase tracking-wider">BLUE</span>
          <div className="text-9xl font-bold text-game-blue mt-2">{scores.blue}</div>
          <span className="text-lg text-muted-foreground">chutes</span>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex gap-4 relative z-10 opacity-0 animate-buttons-fade"
        style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={onBackToMenu}
          className="text-xl px-8 py-6 transition-transform hover:scale-105"
        >
          <Home className="mr-2 h-6 w-6" />
          Menu
        </Button>
        <Button
          size="lg"
          onClick={onPlayAgain}
          className="text-xl px-12 py-6 bg-game-yellow hover:bg-game-yellow-glow text-background font-bold transition-transform hover:scale-105"
        >
          <RotateCcw className="mr-2 h-6 w-6" />
          JOGAR DE NOVO
        </Button>
      </div>

      {/* Keyboard hint */}
      <p
        className="mt-8 text-muted-foreground relative z-10 opacity-0 animate-buttons-fade"
        style={{ animationDelay: '1.3s', animationFillMode: 'forwards' }}
      >
        <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">SPACE</kbd> para jogar novamente •{' '}
        <kbd className="px-2 py-1 bg-secondary rounded text-sm font-mono">ESC</kbd> para voltar ao menu
      </p>
    </div>
  );
}
