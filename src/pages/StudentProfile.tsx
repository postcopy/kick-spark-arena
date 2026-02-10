import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StudentAvatar } from '@/components/game/StudentAvatar';
import { LEVEL_LABELS } from '@/types/reaction';
import type { ReactionLevel } from '@/types/reaction';

type TimeFilter = 'week' | 'month' | 'year' | 'all';

interface AthleteRow {
  id: string;
  name: string;
  nickname: string | null;
  belt: string | null;
  category: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  weight_kg: number | null;
}

interface SessionRow {
  id: string;
  mode: string;
  avg_score: number | null;
  best_score: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

function calcAge(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function filterSince(filter: TimeFilter): Date | undefined {
  const now = new Date();
  switch (filter) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return undefined;
  }
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState<AthleteRow | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('month');

  useEffect(() => {
    if (!user || !id) return;
    setLoading(true);

    Promise.all([
      supabase
        .from('athletes')
        .select('id, name, nickname, belt, category, avatar_url, birth_date, weight_kg')
        .eq('id', id)
        .eq('academy_id', user.id)
        .maybeSingle(),
      supabase
        .from('training_sessions')
        .select('id, mode, avg_score, best_score, details, created_at')
        .eq('athlete_id', id)
        .eq('academy_id', user.id)
        .order('created_at', { ascending: true }),
    ]).then(([athleteRes, sessionsRes]) => {
      setAthlete((athleteRes.data as AthleteRow) || null);
      setSessions((sessionsRes.data as SessionRow[]) || []);
      setLoading(false);
    });
  }, [user, id]);

  const since = filterSince(filter);

  const filteredSessions = useMemo(() => {
    if (!since) return sessions;
    return sessions.filter((s) => new Date(s.created_at) >= since);
  }, [sessions, since]);

  const reactionSessions = useMemo(
    () => filteredSessions.filter((s) => s.mode === 'reaction' && s.avg_score != null),
    [filteredSessions],
  );

  const chartData = useMemo(
    () =>
      reactionSessions.map((s) => ({
        date: new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        avg: Math.round(s.avg_score!),
      })),
    [reactionSessions],
  );

  const globalAvg = useMemo(() => {
    if (reactionSessions.length === 0) return null;
    const sum = reactionSessions.reduce((acc, s) => acc + (s.avg_score || 0), 0);
    return Math.round(sum / reactionSessions.length);
  }, [reactionSessions]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">Atleta não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/students')}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground truncate">{athlete.name}</h1>
      </header>

      {/* Main scrollable */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 max-w-2xl mx-auto w-full">
        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <StudentAvatar
            name={athlete.name}
            avatarUrl={athlete.avatar_url}
            belt={athlete.belt}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-foreground truncate">{athlete.name}</h2>
            <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
              {athlete.belt && <span className="capitalize">{athlete.belt}</span>}
              {athlete.birth_date && (
                <span>{calcAge(athlete.birth_date)} anos</span>
              )}
              {athlete.weight_kg && <span>{athlete.weight_kg}kg</span>}
            </div>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as TimeFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="flex-1"
            >
              {{ week: 'Semana', month: 'Mês', year: 'Ano', all: 'Tudo' }[f]}
            </Button>
          ))}
        </div>

        {/* Evolution Chart */}
        {chartData.length > 1 ? (
          <div className="w-full h-52 md:h-64">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Evolução – Tempo de Reação</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <defs>
                  <linearGradient id="evoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#39FF14" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#39FF14" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="ms"
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [`${value}ms`, 'Média']}
                />
                {globalAvg && (
                  <ReferenceLine
                    y={globalAvg}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    label={{
                      value: `Média ${globalAvg}ms`,
                      position: 'insideTopRight',
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                    }}
                  />
                )}
                <Area
                  type="linear"
                  dataKey="avg"
                  stroke="#39FF14"
                  strokeWidth={2}
                  fill="url(#evoGradient)"
                  dot={{ r: 4, fill: '#39FF14' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center text-muted-foreground gap-2">
            <Calendar className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm">
              {filteredSessions.length === 0
                ? 'Nenhuma sessão registrada neste período'
                : 'Precisa de pelo menos 2 sessões para gerar o gráfico'}
            </p>
          </div>
        )}

        {/* Recent History */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Histórico Recente ({filteredSessions.length})
          </h3>
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">Nenhuma sessão encontrada.</p>
          ) : (
            <div className="space-y-2">
              {[...filteredSessions]
                .reverse()
                .slice(0, 20)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground capitalize">
                        {s.mode === 'reaction' ? 'Reação' : s.mode}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      {s.avg_score != null && (
                        <span className="text-lg font-black text-foreground">
                          {Math.round(s.avg_score)}ms
                        </span>
                      )}
                      {s.best_score != null && (
                        <span className="text-xs text-muted-foreground block">
                          PB: {Math.round(s.best_score)}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
