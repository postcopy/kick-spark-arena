import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface RankingEntry {
  id: string;
  athleteId: string;
  athleteName: string;
  kicks: number;
  kicksPerSecond: number;
  durationSeconds: number;
  createdAt: Date;
}

type PeriodFilter = 'today' | 'week' | 'all';

export default function Ranking() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('all');

  useEffect(() => {
    if (!user) return;

    const fetchRanking = async () => {
      setIsLoading(true);

      let query = supabase
        .from('solo_results')
        .select(`
          id,
          athlete_id,
          kicks,
          kicks_per_second,
          duration_seconds,
          created_at,
          athletes!inner (
            name
          )
        `)
        .eq('academy_id', user.id);

      // Apply period filter
      if (period !== 'all') {
        const now = new Date();
        let startDate: Date;

        if (period === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.order('kicks', { ascending: false });

      if (!error && data) {
        // Group by athlete - keep only the best result for each athlete
        const athleteMap = new Map<string, RankingEntry>();

        data.forEach((item: any) => {
          const athleteId = item.athlete_id;
          const existing = athleteMap.get(athleteId);

          if (!existing || item.kicks > existing.kicks) {
            athleteMap.set(athleteId, {
              id: item.id,
              athleteId: item.athlete_id,
              athleteName: item.athletes?.name || 'Desconhecido',
              kicks: item.kicks,
              kicksPerSecond: parseFloat(item.kicks_per_second) || 0,
              durationSeconds: item.duration_seconds,
              createdAt: new Date(item.created_at),
            });
          }
        });

        const uniqueEntries = Array.from(athleteMap.values())
          .sort((a, b) => b.kicks - a.kicks)
          .slice(0, 50);

        setEntries(uniqueEntries);
      }

      setIsLoading(false);
    };

    fetchRanking();
  }, [user, period]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-game-yellow" />
      </div>
    );
  }

  if (!user) {
    return (
      <SiteLayout 
        title="Ranking" 
        subtitle="Quem chutou mais?"
        centered
        footer={
          <Link to="/login" className="block">
            <Button className="w-full h-14 md:h-16 text-lg md:text-xl font-bold rounded-xl bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90">
              Entrar para ver
            </Button>
          </Link>
        }
      >
        <div className="text-center space-y-6">
          <div className="p-6 bg-game-yellow/10 rounded-full w-fit mx-auto">
            <Trophy className="w-16 h-16 text-game-yellow" />
          </div>
          <p className="text-lg text-muted-foreground">
            Faça login para ver o ranking da sua academia
          </p>
        </div>
      </SiteLayout>
    );
  }

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="w-7 h-7 text-yellow-400" />;
    if (position === 2) return <Medal className="w-7 h-7 text-gray-400" />;
    if (position === 3) return <Medal className="w-7 h-7 text-amber-600" />;
    return <span className="w-7 h-7 flex items-center justify-center text-lg text-muted-foreground font-bold">{position}</span>;
  };

  return (
    <SiteLayout 
      title="Ranking" 
      subtitle="Quem chutou mais?"
      backTo="/"
    >
      <div className="space-y-4 md:space-y-6">
        {/* Filtros como botões grandes */}
        <div className="flex gap-2 md:gap-3">
          {[
            { value: 'today', label: 'Hoje' },
            { value: 'week', label: 'Semana' },
            { value: 'all', label: 'Todos' },
          ].map((filter) => (
            <Button
              key={filter.value}
              onClick={() => setPeriod(filter.value as PeriodFilter)}
              variant={period === filter.value ? 'default' : 'outline'}
              className={cn(
                'flex-1 h-12 md:h-14 text-base md:text-lg font-semibold rounded-xl',
                period === filter.value && 'bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Lista de Ranking */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-lg text-muted-foreground">
                Nenhum resultado ainda
              </p>
              <p className="text-base text-muted-foreground">
                Jogue para aparecer aqui!
              </p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 transition-colors',
                  index < 3 
                    ? 'bg-game-yellow/10 border-game-yellow/30' 
                    : 'bg-game-surface border-border'
                )}
              >
                {/* Posição */}
                <div className="flex-shrink-0 w-10">
                  {getMedalIcon(index + 1)}
                </div>

                {/* Avatar + Nome */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="font-semibold text-lg truncate">
                    {entry.athleteName}
                  </span>
                </div>

                {/* Chutes */}
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    'text-2xl font-bold',
                    index === 0 ? 'text-game-yellow' : 'text-foreground'
                  )}>
                    {entry.kicks}
                  </span>
                  <p className="text-sm text-muted-foreground">chutes</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
