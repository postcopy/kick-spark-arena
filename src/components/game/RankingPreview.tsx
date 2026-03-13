import { useState, useEffect } from 'react';
import { Trophy, Medal, User, X, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RankingEntry {
  athleteId: string;
  athleteName: string;
  bestKicks: number;
  bestKicksPerSecond: number;
  totalGames: number;
}

interface RankingPreviewProps {
  onClose: () => void;
  durationFilter?: number;
  limit?: number;
}

export function RankingPreview({ onClose, durationFilter, limit = 10 }: RankingPreviewProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRanking = async () => {
      setIsLoading(true);

      // Query to get best result per athlete
      let query = supabase
        .from('solo_results')
        .select(`
          athlete_id,
          kicks,
          kicks_per_second,
          athletes!inner (
            name
          )
        `)
        .eq('academy_id', user.id);

      if (durationFilter) {
        query = query.eq('duration_seconds', durationFilter);
      }

      const { data, error } = await query.order('kicks', { ascending: false });

      if (!error && data) {
        // Group by athlete, keeping only best result
        const athleteMap = new Map<string, RankingEntry>();

        data.forEach((item: any) => {
          const athleteId = item.athlete_id;
          const kicks = item.kicks;
          const kps = parseFloat(item.kicks_per_second) || 0;
          const athleteName = item.athletes?.name || 'Desconhecido';

          if (!athleteMap.has(athleteId)) {
            athleteMap.set(athleteId, {
              athleteId,
              athleteName,
              bestKicks: kicks,
              bestKicksPerSecond: kps,
              totalGames: 1,
            });
          } else {
            const existing = athleteMap.get(athleteId)!;
            existing.totalGames++;
            if (kicks > existing.bestKicks) {
              existing.bestKicks = kicks;
              existing.bestKicksPerSecond = kps;
            }
          }
        });

        // Sort by best kicks and limit
        const sorted = Array.from(athleteMap.values())
          .sort((a, b) => b.bestKicks - a.bestKicks)
          .slice(0, limit);

        setEntries(sorted);
      }

      setIsLoading(false);
    };

    fetchRanking();
  }, [user, durationFilter, limit]);

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="w-6 h-6 text-yellow-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return (
      <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">
        {position}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-game-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-game-gold/10">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-game-gold" />
            <h2 className="text-xl font-bold text-foreground">Ranking da Academia</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-game-gold" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum resultado ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Jogue para aparecer no ranking!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.athleteId}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-colors',
                    index < 3 ? 'bg-game-gold/10' : 'bg-muted/30'
                  )}
                >
                  <div className="w-8 flex items-center justify-center">
                    {getMedalIcon(index + 1)}
                  </div>

                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {entry.athleteName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.totalGames} {entry.totalGames === 1 ? 'partida' : 'partidas'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={cn(
                      'font-bold text-lg',
                      index === 0 ? 'text-game-gold' : 'text-foreground'
                    )}>
                      {entry.bestKicks}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.bestKicksPerSecond.toFixed(1)}/s
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-12 rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component to show athlete stats
interface AthleteStatsProps {
  athleteId: string;
  athleteName: string;
}

export function AthleteStats({ athleteId, athleteName }: AthleteStatsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    totalGames: number;
    bestKicks: number;
    avgKicks: number;
    rank: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !athleteId) return;

    const fetchStats = async () => {
      setIsLoading(true);

      // Get all results for this athlete
      const { data: athleteResults, error: athleteError } = await supabase
        .from('solo_results')
        .select('kicks, kicks_per_second')
        .eq('academy_id', user.id)
        .eq('athlete_id', athleteId);

      if (athleteError || !athleteResults) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      if (athleteResults.length === 0) {
        setStats({
          totalGames: 0,
          bestKicks: 0,
          avgKicks: 0,
          rank: 0,
        });
        setIsLoading(false);
        return;
      }

      const totalGames = athleteResults.length;
      const bestKicks = Math.max(...athleteResults.map(r => r.kicks));
      const avgKicks = Math.round(athleteResults.reduce((acc, r) => acc + r.kicks, 0) / totalGames);

      // Get rank
      const { data: allResults } = await supabase
        .from('solo_results')
        .select('athlete_id, kicks')
        .eq('academy_id', user.id);

      let rank = 1;
      if (allResults) {
        // Group by athlete, get best
        const bestByAthlete = new Map<string, number>();
        allResults.forEach((r: any) => {
          const current = bestByAthlete.get(r.athlete_id) || 0;
          if (r.kicks > current) {
            bestByAthlete.set(r.athlete_id, r.kicks);
          }
        });

        const sorted = Array.from(bestByAthlete.entries()).sort((a, b) => b[1] - a[1]);
        rank = sorted.findIndex(([id]) => id === athleteId) + 1;
        if (rank === 0) rank = sorted.length + 1;
      }

      setStats({ totalGames, bestKicks, avgKicks, rank });
      setIsLoading(false);
    };

    fetchStats();
  }, [user, athleteId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-game-gold" />
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <div className="text-center py-4 px-6 bg-game-surface/50 rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">Primeira partida de {athleteName}!</p>
      </div>
    );
  }

  const getMedalEmoji = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  return (
    <div className="grid grid-cols-4 gap-2 p-4 bg-game-surface/50 rounded-xl border border-border">
      <div className="text-center">
        <p className="text-2xl font-bold text-game-gold">{getMedalEmoji(stats.rank)}</p>
        <p className="text-xs text-muted-foreground">Rank</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-foreground">{stats.bestKicks}</p>
        <p className="text-xs text-muted-foreground">Recorde</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-foreground">{stats.avgKicks}</p>
        <p className="text-xs text-muted-foreground">Média</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-foreground">{stats.totalGames}</p>
        <p className="text-xs text-muted-foreground">Partidas</p>
      </div>
    </div>
  );
}
