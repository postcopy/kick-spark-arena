import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Trophy, TrendingDown, TrendingUp, Flame, Brain, Zap, Target, Swords, Timer, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StudentAvatar } from '@/components/game/StudentAvatar';

type TimeFilter = 'week' | 'month' | 'year' | 'all';

interface AthleteRow {
  id: string; name: string; nickname: string | null; belt: string | null;
  category: string | null; avatar_url: string | null; birth_date: string | null;
  weight_kg: number | null; is_active: boolean | null;
}

interface SessionRow {
  id: string; mode: string; avg_score: number | null; best_score: number | null;
  details: Record<string, unknown> | null; created_at: string;
}

interface SoloRow {
  id: string; kicks: number; duration_seconds: number; kicks_per_second: number | null; created_at: string;
}

interface MatchRow {
  id: string; red_athlete_name: string | null; blue_athlete_name: string | null;
  winner_side: string | null; status: string; created_at: string;
}

const BELT_RING_COLORS: Record<string, string> = {
  branca: 'ring-zinc-300', amarela: 'ring-yellow-400', laranja: 'ring-orange-500',
  verde: 'ring-green-500', roxa: 'ring-purple-500', marrom: 'ring-amber-800',
  preta: 'ring-zinc-600', vermelha: 'ring-red-500',
};

const BELT_BADGE_COLORS: Record<string, string> = {
  branca: 'bg-zinc-300 text-zinc-800', amarela: 'bg-yellow-400 text-yellow-950',
  laranja: 'bg-orange-500 text-white', verde: 'bg-green-500 text-white',
  roxa: 'bg-purple-500 text-white', marrom: 'bg-amber-800 text-white',
  preta: 'bg-zinc-900 text-white border border-zinc-600', vermelha: 'bg-red-500 text-white',
};

const CHART_TOOLTIP = {
  background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))',
  borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: 13,
};

function calcAge(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function filterSince(filter: TimeFilter): Date | undefined {
  const now = new Date();
  switch (filter) {
    case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return undefined;
  }
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState<AthleteRow | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [soloResults, setSoloResults] = useState<SoloRow[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('month');

  useEffect(() => {
    if (!user || !id) return;
    setLoading(true);

    Promise.all([
      supabase.from('athletes').select('id, name, nickname, belt, category, avatar_url, birth_date, weight_kg, is_active')
        .eq('id', id).eq('academy_id', user.id).maybeSingle(),
      supabase.from('training_sessions').select('id, mode, avg_score, best_score, details, created_at')
        .eq('athlete_id', id).eq('academy_id', user.id).order('created_at', { ascending: true }),
      supabase.from('solo_results').select('id, kicks, duration_seconds, kicks_per_second, created_at')
        .eq('athlete_id', id).eq('academy_id', user.id).order('created_at', { ascending: true }),
      supabase.from('championship_matches').select('id, red_athlete_name, blue_athlete_name, winner_side, status, created_at')
        .eq('academy_id', user.id).in('status', ['FINISHED', 'finished']),
    ]).then(([athleteRes, sessionsRes, soloRes, matchesRes]) => {
      const ath = (athleteRes.data as AthleteRow) || null;
      setAthlete(ath);
      setSessions((sessionsRes.data as SessionRow[]) || []);
      setSoloResults((soloRes.data as SoloRow[]) || []);
      // Filter matches by athlete name
      const allMatches = (matchesRes.data as MatchRow[]) || [];
      if (ath) {
        const name = ath.name.toLowerCase();
        setMatches(allMatches.filter(m =>
          m.red_athlete_name?.toLowerCase() === name || m.blue_athlete_name?.toLowerCase() === name
        ));
      }
      setLoading(false);
    });
  }, [user, id]);

  const since = filterSince(filter);

  const filteredSessions = useMemo(() => {
    if (!since) return sessions;
    return sessions.filter(s => new Date(s.created_at) >= since);
  }, [sessions, since]);

  const filteredSolo = useMemo(() => {
    if (!since) return soloResults;
    return soloResults.filter(s => new Date(s.created_at) >= since);
  }, [soloResults, since]);

  // === Reaction KPIs ===
  const reactionSessions = useMemo(() => filteredSessions.filter(s => s.mode === 'reaction' && s.avg_score != null), [filteredSessions]);
  const reactionAvg = useMemo(() => {
    if (reactionSessions.length === 0) return null;
    return Math.round(reactionSessions.reduce((a, s) => a + s.avg_score!, 0) / reactionSessions.length);
  }, [reactionSessions]);
  const absolutePB = useMemo(() => {
    const bests = sessions.filter(s => s.mode === 'reaction' && s.best_score != null).map(s => s.best_score!);
    return bests.length > 0 ? Math.round(Math.min(...bests)) : null;
  }, [sessions]);
  const cognitiveAccuracy = useMemo(() => {
    const cogSessions = filteredSessions.filter(s => {
      const d = s.details as any;
      return d?.cognitiveMode === true && d?.totalNoGoStimuli > 0;
    });
    if (cogSessions.length === 0) return null;
    const sum = cogSessions.reduce((acc, s) => {
      const d = s.details as any;
      return acc + (d.correctInhibitions / d.totalNoGoStimuli) * 100;
    }, 0);
    return Math.round(sum / cogSessions.length);
  }, [filteredSessions]);

  // === Time Attack (solo) KPIs ===
  const bestKicks = useMemo(() => {
    if (filteredSolo.length === 0) return null;
    return Math.max(...filteredSolo.map(s => s.kicks));
  }, [filteredSolo]);
  const avgKicks = useMemo(() => {
    if (filteredSolo.length === 0) return null;
    return Math.round(filteredSolo.reduce((a, s) => a + s.kicks, 0) / filteredSolo.length);
  }, [filteredSolo]);

  // === Arcade KPIs ===
  const arcadeSessions = useMemo(() => filteredSessions.filter(s => s.mode === 'arcade'), [filteredSessions]);
  const arcadeWins = useMemo(() => arcadeSessions.filter(s => {
    const d = s.details as any;
    return d?.result === 'win' || d?.winner === 'red';
  }).length, [arcadeSessions]);

  // === Championship KPIs ===
  const champWins = useMemo(() => {
    if (!athlete) return 0;
    const name = athlete.name.toLowerCase();
    return matches.filter(m => {
      if (m.winner_side === 'red' && m.red_athlete_name?.toLowerCase() === name) return true;
      if (m.winner_side === 'blue' && m.blue_athlete_name?.toLowerCase() === name) return true;
      return false;
    }).length;
  }, [matches, athlete]);

  // === Chart data ===
  const reactionChartData = useMemo(() =>
    reactionSessions.map(s => ({
      date: new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      avg: Math.round(s.avg_score!),
    })),
  [reactionSessions]);

  const soloChartData = useMemo(() =>
    filteredSolo.map(s => ({
      date: new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      kicks: s.kicks,
    })),
  [filteredSolo]);

  // Running averages for trend arrows
  const runningAverages = useMemo(() => {
    const rOnly = sessions.filter(s => s.mode === 'reaction' && s.avg_score != null);
    let sum = 0;
    return rOnly.map((s, i) => { sum += s.avg_score!; return { id: s.id, avg: sum / (i + 1) }; });
  }, [sessions]);

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
        <Button variant="outline" onClick={() => navigate('/students')}>Voltar</Button>
      </div>
    );
  }

  const ringColor = BELT_RING_COLORS[athlete.belt || ''] || 'ring-zinc-500';
  const isActive = athlete.is_active !== false;

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      <header className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/students')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground truncate">{athlete.name}</h1>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5 max-w-2xl mx-auto w-full">
        {/* Hero Profile Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
          <div className={`rounded-full ring-3 ${ringColor} p-0.5`}>
            <StudentAvatar name={athlete.name} avatarUrl={athlete.avatar_url} belt={athlete.belt} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground truncate">{athlete.name}</h2>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-zinc-500'}`} />
              <span className="text-xs text-muted-foreground">{isActive ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {athlete.belt && <Badge className={`text-[10px] px-2 py-0.5 ${BELT_BADGE_COLORS[athlete.belt] || ''}`}>{athlete.belt.charAt(0).toUpperCase() + athlete.belt.slice(1)}</Badge>}
              {athlete.category && <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{athlete.category}</Badge>}
              {athlete.weight_kg && <Badge variant="outline" className="text-[10px] px-2 py-0.5">{athlete.weight_kg}kg</Badge>}
              {athlete.birth_date && <Badge variant="outline" className="text-[10px] px-2 py-0.5">{calcAge(athlete.birth_date)} anos</Badge>}
            </div>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as TimeFilter[]).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="flex-1">
              {{ week: 'Semana', month: 'Mês', year: 'Ano', all: 'Tudo' }[f]}
            </Button>
          ))}
        </div>

        {/* KPI Grid - Multi Mode */}
        <div className="grid grid-cols-2 gap-3">
          {/* Reaction */}
          <KPI icon={<Trophy className="w-4 h-4 text-yellow-400" />} label="Recorde" value={absolutePB != null ? `${absolutePB}ms` : '--'} />
          <KPI icon={<TrendingDown className="w-4 h-4 text-green-400" />} label="Média Reação" value={reactionAvg != null ? `${reactionAvg}ms` : '--'} />
          <KPI icon={<Brain className="w-4 h-4 text-purple-400" />} label="Precisão Cogn." value={cognitiveAccuracy != null ? `${cognitiveAccuracy}%` : '--'} />
          <KPI icon={<Flame className="w-4 h-4 text-orange-400" />} label="Assiduidade" value={`${filteredSessions.length}`} sub="treinos" />
          {/* Time Attack */}
          <KPI icon={<Timer className="w-4 h-4 text-yellow-500" />} label="Melhor Chutes" value={bestKicks != null ? String(bestKicks) : '--'} />
          <KPI icon={<Target className="w-4 h-4 text-blue-400" />} label="Média Chutes" value={avgKicks != null ? String(avgKicks) : '--'} />
          {/* Arcade */}
          <KPI icon={<Gamepad2 className="w-4 h-4 text-red-400" />} label="Duelos" value={`${arcadeWins}/${arcadeSessions.length}`} sub="V/T" />
          {/* Championship */}
          <KPI icon={<Swords className="w-4 h-4 text-primary" />} label="Campeonato" value={`${champWins}/${matches.length}`} sub="V/T" />
        </div>

        {/* Evolution Charts with Tabs */}
        <Tabs defaultValue="reaction">
          <TabsList className="w-full">
            <TabsTrigger value="reaction" className="flex-1">⚡ Reação</TabsTrigger>
            <TabsTrigger value="kicks" className="flex-1">🦵 Chutes</TabsTrigger>
          </TabsList>

          <TabsContent value="reaction">
            {reactionChartData.length > 1 ? (
              <div className="w-full h-52 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reactionChartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                    <defs>
                      <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39FF14" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#39FF14" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" width={50} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`${v}ms`, 'Média']} />
                    {reactionAvg && <ReferenceLine y={reactionAvg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
                    <ReferenceLine y={450} stroke="#F59E0B" strokeDasharray="6 3" />
                    <Area type="linear" dataKey="avg" stroke="#39FF14" strokeWidth={2} fill="url(#evoGrad)" dot={{ r: 4, fill: '#39FF14' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text={reactionSessions.length === 0 ? 'Nenhuma sessão de reação neste período' : 'Precisa de 2+ sessões para o gráfico'} />
            )}
          </TabsContent>

          <TabsContent value="kicks">
            {soloChartData.length > 1 ? (
              <div className="w-full h-52 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={soloChartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [v, 'Chutes']} />
                    <Bar dataKey="kicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text={filteredSolo.length === 0 ? 'Nenhuma sessão de chutes neste período' : 'Precisa de 2+ sessões para o gráfico'} />
            )}
          </TabsContent>
        </Tabs>

        {/* Recent History */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Histórico Recente ({filteredSessions.length + filteredSolo.length})
          </h3>
          {filteredSessions.length === 0 && filteredSolo.length === 0 ? (
            <p className="text-sm text-muted-foreground/60">Nenhuma sessão encontrada.</p>
          ) : (
            <div className="space-y-2">
              {buildHistory(filteredSessions, filteredSolo, matches, athlete.name, runningAverages)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function KPI({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-black text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground ml-1">{sub}</span>}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center text-muted-foreground gap-2">
      <Calendar className="w-10 h-10 text-muted-foreground/40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

type RunAvg = { id: string; avg: number };

function buildHistory(sessions: SessionRow[], soloResults: SoloRow[], matches: MatchRow[], athleteName: string, runningAverages: RunAvg[]) {
  // Merge all into a unified timeline
  interface HistoryItem { id: string; date: Date; type: string; label: string; detail: string; icon: React.ReactNode; trendArrow?: React.ReactNode }

  const items: HistoryItem[] = [];

  sessions.forEach(s => {
    const isCognitive = (s.details as any)?.cognitiveMode === true;
    let label = s.mode === 'reaction' ? (isCognitive ? 'Cognitivo' : 'Reação') : s.mode === 'arcade' ? 'Duelo' : s.mode === 'time_attack' ? 'Contra o Tempo' : s.mode;
    let detail = '';
    let icon: React.ReactNode;

    if (isCognitive) {
      icon = <Brain className="w-4 h-4 text-purple-400" />;
      detail = s.avg_score != null ? `${Math.round(s.avg_score)}ms` : '';
    } else if (s.mode === 'reaction') {
      icon = <Zap className="w-4 h-4 text-yellow-400" />;
      detail = s.avg_score != null ? `${Math.round(s.avg_score)}ms` : '';
    } else if (s.mode === 'arcade') {
      icon = <Gamepad2 className="w-4 h-4 text-red-400" />;
      const d = s.details as any;
      detail = d?.result === 'win' ? 'Vitória' : d?.result === 'loss' ? 'Derrota' : 'Duelo';
    } else if (s.mode === 'time_attack') {
      icon = <Timer className="w-4 h-4 text-yellow-500" />;
      detail = '';
    } else {
      icon = <Target className="w-4 h-4 text-zinc-400" />;
    }

    // Trend for reaction
    let trendArrow: React.ReactNode = null;
    if (s.mode === 'reaction' && s.avg_score != null) {
      const ra = runningAverages.find(r => r.id === s.id);
      const idx = runningAverages.findIndex(r => r.id === s.id);
      if (ra && idx > 0) {
        const prev = runningAverages[idx - 1].avg;
        if (s.avg_score < prev) trendArrow = <TrendingDown className="w-4 h-4 text-green-400" />;
        else if (s.avg_score > prev) trendArrow = <TrendingUp className="w-4 h-4 text-red-400" />;
      }
    }

    items.push({ id: s.id, date: new Date(s.created_at), type: 'session', label, detail, icon, trendArrow });
  });

  soloResults.forEach(s => {
    items.push({
      id: s.id,
      date: new Date(s.created_at),
      type: 'solo',
      label: 'Contra o Tempo',
      detail: `${s.kicks} chutes • ${s.duration_seconds}s`,
      icon: <Timer className="w-4 h-4 text-yellow-500" />,
    });
  });

  matches.forEach(m => {
    const name = athleteName.toLowerCase();
    const side = m.red_athlete_name?.toLowerCase() === name ? 'red' : 'blue';
    const won = m.winner_side === side;
    const opponent = side === 'red' ? m.blue_athlete_name : m.red_athlete_name;
    items.push({
      id: m.id,
      date: new Date(m.created_at),
      type: 'match',
      label: 'Campeonato',
      detail: `${won ? 'Vitória' : 'Derrota'} vs ${opponent || '?'}`,
      icon: <Swords className="w-4 h-4 text-primary" />,
    });
  });

  // Sort descending and take 20
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  return items.slice(0, 20).map(item => (
    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2.5">
        {item.icon}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{item.label}</span>
          <span className="text-xs text-muted-foreground">
            {item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {item.trendArrow}
        <span className="text-sm font-bold text-foreground">{item.detail}</span>
      </div>
    </div>
  ));
}
