import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, Medal, Filter, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

type PeriodFilter = 'today' | 'week' | 'month' | 'all';
type DurationFilter = '30' | '45' | '60' | 'all';

export default function Ranking() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [duration, setDuration] = useState<DurationFilter>('all');

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
        .eq('academy_id', user.id)
        .order('kicks', { ascending: false })
        .limit(100);

      // Apply period filter
      if (period !== 'all') {
        const now = new Date();
        let startDate: Date;

        if (period === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply duration filter
      if (duration !== 'all') {
        query = query.eq('duration_seconds', parseInt(duration));
      }

      const { data, error } = await query;

      if (!error && data) {
        setEntries(data.map((item: any) => ({
          id: item.id,
          athleteId: item.athlete_id,
          athleteName: item.athletes?.name || 'Desconhecido',
          kicks: item.kicks,
          kicksPerSecond: parseFloat(item.kicks_per_second) || 0,
          durationSeconds: item.duration_seconds,
          createdAt: new Date(item.created_at),
        })));
      }

      setIsLoading(false);
    };

    fetchRanking();
  }, [user, period, duration]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-game-yellow" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
        <Trophy className="w-16 h-16 text-game-yellow mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">Ranking</h1>
        <p className="text-muted-foreground mb-6">Faça login para ver o ranking da sua academia.</p>
        <Link to="/login">
          <Button className="bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90">
            Entrar
          </Button>
        </Link>
      </div>
    );
  }

  const getMedalIcon = (position: number) => {
    if (position === 1) return <Medal className="w-6 h-6 text-yellow-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground">{position}</span>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Trophy className="w-8 h-8 text-game-yellow" />
              Ranking
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Melhores resultados do Solo Challenge
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-game-surface rounded-lg border border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>

          <Select value={duration} onValueChange={(v) => setDuration(v as DurationFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Duração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="30">30 segundos</SelectItem>
              <SelectItem value="45">45 segundos</SelectItem>
              <SelectItem value="60">60 segundos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ranking Table */}
        <div className="bg-game-surface rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Jogue o Solo Challenge para aparecer no ranking!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead className="text-center">Chutes</TableHead>
                  <TableHead className="text-center">Velocidade</TableHead>
                  <TableHead className="text-center">Duração</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      index < 3 && "bg-game-yellow/5"
                    )}
                  >
                    <TableCell className="text-center">
                      {getMedalIcon(index + 1)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{entry.athleteName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-bold text-lg",
                        index === 0 && "text-game-yellow"
                      )}>
                        {entry.kicks}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {entry.kicksPerSecond.toFixed(2)}/s
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 bg-secondary rounded text-sm">
                        {entry.durationSeconds}s
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {entry.createdAt.toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
