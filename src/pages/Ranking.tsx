import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Loader2, User, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#E11D48]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
        <div className="p-5 bg-[#F59E0B]/10 rounded-2xl">
          <Trophy className="w-14 h-14 text-[#F59E0B]" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="font-display font-bold text-xl text-white">Ranking de Chutes</h2>
          <p className="text-[#94A3B8]">Faca login para ver o ranking da sua academia</p>
        </div>
        <Link to="/login">
          <Button className="h-12 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035]">
            Entrar para ver
          </Button>
        </Link>
      </div>
    );
  }

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="w-7 h-7 text-[#F59E0B]" />;
    if (position === 2) return <Medal className="w-7 h-7 text-[#94A3B8]" />;
    if (position === 3) return <Medal className="w-7 h-7 text-[#CD7F32]" />;
    return (
      <span className="w-7 h-7 flex items-center justify-center font-mono text-sm font-bold text-[#64748B]">
        {position}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Ranking</h1>
        <p className="text-sm text-[#94A3B8]">Quem chutou mais?</p>
      </div>

      {/* Period Filters */}
      <div className="flex gap-2">
        {[
          { value: 'today', label: 'Hoje' },
          { value: 'week', label: 'Semana' },
          { value: 'all', label: 'Todos' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setPeriod(filter.value as PeriodFilter)}
            className={cn(
              'flex-1 h-11 text-sm font-bold rounded-xl transition-all duration-200',
              period === filter.value
                ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white shadow-lg shadow-[#E11D48]/20'
                : 'bg-[#1E1E2E] text-[#94A3B8] hover:text-white hover:bg-[#2D2D3F]'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Ranking List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#E11D48]" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Trophy className="w-12 h-12 text-[#2D2D3F] mx-auto" />
            <p className="text-[#94A3B8] font-medium">Nenhum resultado ainda</p>
            <p className="text-sm text-[#64748B]">Jogue para aparecer aqui!</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                index === 0
                  ? 'bg-gradient-to-r from-[#F59E0B]/10 to-transparent border-[#F59E0B]/30'
                  : index < 3
                    ? 'bg-[#141420] border-[#F59E0B]/15'
                    : 'bg-[#141420]/60 border-[#1E1E2E]'
              )}
            >
              {/* Position */}
              <div className="flex-shrink-0 w-10 flex items-center justify-center">
                {getMedalIcon(index + 1)}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#1E1E2E] flex items-center justify-center flex-shrink-0 border border-[#2D2D3F]">
                  <User className="w-5 h-5 text-[#64748B]" />
                </div>
                <span className="font-display font-semibold text-base text-white truncate">
                  {entry.athleteName}
                </span>
              </div>

              {/* Kicks */}
              <div className="text-right flex-shrink-0">
                <span className={cn(
                  'font-mono text-xl font-bold',
                  index === 0 ? 'text-[#F59E0B]' : 'text-white'
                )}>
                  {entry.kicks}
                </span>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider">chutes</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
