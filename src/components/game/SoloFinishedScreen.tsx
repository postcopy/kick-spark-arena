import { useState, useEffect } from 'react';
import { Trophy, RotateCcw, Home, User, Loader2, Medal, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SoloResult } from '@/types/game';

interface SoloFinishedScreenProps {
  result: SoloResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function SoloFinishedScreen({ result, onPlayAgain, onBackToMenu }: SoloFinishedScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Save result to database
  useEffect(() => {
    if (!user || saved) return;

    const saveResult = async () => {
      setIsSaving(true);

      // Check if this is a new personal record
      const { data: existingRecords } = await supabase
        .from('solo_results')
        .select('kicks')
        .eq('athlete_id', result.athleteId)
        .eq('duration_seconds', result.duration)
        .order('kicks', { ascending: false })
        .limit(1);

      const isRecord = !existingRecords?.length || result.kicks > existingRecords[0].kicks;
      setIsNewRecord(isRecord);

      // Insert new result
      const { error } = await supabase.from('solo_results').insert({
        athlete_id: result.athleteId,
        academy_id: user.id,
        kicks: result.kicks,
        duration_seconds: result.duration,
      });

      if (error) {
        toast({
          title: 'Erro ao salvar',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setSaved(true);

        // Get ranking position
        const { count } = await supabase
          .from('solo_results')
          .select('*', { count: 'exact', head: true })
          .eq('academy_id', user.id)
          .eq('duration_seconds', result.duration)
          .gt('kicks', result.kicks);

        setRank((count ?? 0) + 1);
      }

      setIsSaving(false);
    };

    saveResult();
  }, [user, result, saved, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      {/* Trophy Icon */}
      <div className="mb-6">
        <div className="w-24 h-24 rounded-full bg-game-yellow/10 flex items-center justify-center">
          <Trophy className="w-12 h-12 text-game-yellow" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold text-foreground mb-2 animate-winner">
        DESAFIO CONCLUÍDO!
      </h1>

      {/* Athlete info */}
      <div className="flex items-center gap-3 mb-8 text-muted-foreground">
        <User className="w-5 h-5" />
        <span className="text-lg">{result.athleteName}</span>
        <span>•</span>
        <span>{result.duration}s</span>
      </div>

      {/* Main Score */}
      <div className="bg-game-surface rounded-2xl p-8 mb-6 text-center border border-game-yellow/30 box-glow-gold">
        <div className="text-8xl font-black text-game-yellow text-glow-yellow mb-2">
          {result.kicks}
        </div>
        <div className="text-xl text-muted-foreground uppercase tracking-wider">
          Chutes
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-sm">
        {/* Kicks per second */}
        <div className="bg-game-surface rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-game-blue" />
            <span className="text-sm text-muted-foreground">Velocidade</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {result.kicksPerSecond.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">chutes/seg</div>
        </div>

        {/* Ranking */}
        <div className="bg-game-surface rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Medal className="w-5 h-5 text-game-gold" />
            <span className="text-sm text-muted-foreground">Ranking</span>
          </div>
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          ) : rank ? (
            <>
              <div className="text-3xl font-bold text-foreground">#{rank}</div>
              <div className="text-xs text-muted-foreground">na academia</div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </div>
      </div>

      {/* New Record Badge */}
      {isNewRecord && (
        <div className="mb-6 px-6 py-3 bg-game-yellow/10 border border-game-yellow/50 rounded-full animate-pulse">
          <span className="text-game-yellow font-bold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            🎉 NOVO RECORDE PESSOAL!
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBackToMenu} className="gap-2">
          <Home className="w-5 h-5" />
          Menu
        </Button>
        <Button
          onClick={onPlayAgain}
          className="gap-2 bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
        >
          <RotateCcw className="w-5 h-5" />
          Jogar Novamente
        </Button>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Salvando resultado...
        </div>
      )}
    </div>
  );
}
