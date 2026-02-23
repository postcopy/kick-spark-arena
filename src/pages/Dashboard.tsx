import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, Zap, Activity, Trophy, Clock, Gamepad2, Loader2, TrendingUp, AlertTriangle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StudentAvatar } from '@/components/game/StudentAvatar';

const CHART_TOOLTIP_STYLE = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: 13,
};

const MODE_COLORS: Record<string, string> = {
  time_attack: '#f59e0b',
  arcade: '#ef4444',
  reaction: '#10b981',
  cognitive: '#8b5cf6',
};

const MODE_LABELS: Record<string, string> = {
  time_attack: 'Contra o Tempo',
  arcade: 'Duelo',
  reaction: 'Reação',
  cognitive: 'Cognitivo',
};

interface DashboardData {
  totalAthletes: number;
  weekSessions: number;
  totalKicks: number;
  avgReaction: number | null;
  sessionsByDay: { day: string; sessoes: number }[];
  recentSessions: { athlete: string; mode: string; result: string; time: string; avatarUrl?: string; belt?: string }[];
  modeUsage: { name: string; value: number; color: string }[];
  topAthletes: { name: string; sessions: number; avatarUrl?: string; belt?: string }[];
  monthlyGrowth: { mes: string; ativos: number; novos: number }[];
  athletesList: { id: string; name: string; belt?: string; avatarUrl?: string; active: boolean; sessionCount: number }[];
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDashboard(user.id);
  }, [user]);

  async function loadDashboard(uid: string) {
    setLoading(true);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();

    const [athletesRes, sessionsRes, soloRes, allSessionsRes] = await Promise.all([
      supabase.from('athletes').select('id, name, nickname, belt, avatar_url, is_active, created_at').eq('academy_id', uid),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, best_score, details, created_at').eq('academy_id', uid).gte('created_at', weekAgoISO).order('created_at', { ascending: false }),
      supabase.from('solo_results').select('id, athlete_id, kicks, created_at').eq('academy_id', uid).gte('created_at', weekAgoISO),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, created_at').eq('academy_id', uid).order('created_at', { ascending: false }).limit(500),
    ]);

    const athletes = athletesRes.data || [];
    const sessions = sessionsRes.data || [];
    const soloResults = soloRes.data || [];
    const allSessions = allSessionsRes.data || [];

    const activeAthletes = athletes.filter(a => a.is_active !== false);
    const athleteMap = new Map(athletes.map(a => [a.id, a]));

    // KPIs
    const totalKicks = soloResults.reduce((sum, r) => sum + (r.kicks || 0), 0);
    const reactionSessions = sessions.filter(s => s.mode === 'reaction' && s.avg_score != null);
    const avgReaction = reactionSessions.length > 0
      ? Math.round(reactionSessions.reduce((sum, s) => sum + s.avg_score!, 0) / reactionSessions.length)
      : null;

    // Sessions by day of week
    const dayBuckets: Record<number, number> = {};
    for (let i = 0; i < 7; i++) dayBuckets[i] = 0;
    sessions.forEach(s => {
      const d = new Date(s.created_at).getDay();
      dayBuckets[d]++;
    });
    const sessionsByDay = DAY_NAMES.map((day, i) => ({ day, sessoes: dayBuckets[i] }));

    // Recent sessions (last 5)
    const recentSessions = sessions.slice(0, 5).map(s => {
      const ath = athleteMap.get(s.athlete_id);
      let result = s.mode;
      if (s.mode === 'reaction' && s.avg_score) result = `${Math.round(s.avg_score)}ms`;
      else if (s.mode === 'time_attack') result = 'Contra o Tempo';
      else if (s.mode === 'arcade') result = 'Duelo';
      
      const minutesAgo = Math.round((now.getTime() - new Date(s.created_at).getTime()) / 60000);
      let time = '';
      if (minutesAgo < 60) time = `${minutesAgo}min atrás`;
      else if (minutesAgo < 1440) time = `${Math.round(minutesAgo / 60)}h atrás`;
      else time = `${Math.round(minutesAgo / 1440)}d atrás`;

      return {
        athlete: ath?.name || 'Desconhecido',
        mode: MODE_LABELS[s.mode] || s.mode,
        result,
        time,
        avatarUrl: ath?.avatar_url || undefined,
        belt: ath?.belt || undefined,
      };
    });

    // Mode usage
    const modeCount: Record<string, number> = {};
    sessions.forEach(s => { modeCount[s.mode] = (modeCount[s.mode] || 0) + 1; });
    const modeUsage = Object.entries(modeCount).map(([mode, value]) => ({
      name: MODE_LABELS[mode] || mode,
      value,
      color: MODE_COLORS[mode] || '#64748b',
    }));

    // Top athletes by session count (all time, last 500)
    const athleteSessionCount: Record<string, number> = {};
    allSessions.forEach(s => { athleteSessionCount[s.athlete_id] = (athleteSessionCount[s.athlete_id] || 0) + 1; });
    const topAthletes = Object.entries(athleteSessionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => {
        const ath = athleteMap.get(id);
        return { name: ath?.name || 'Desconhecido', sessions: count, avatarUrl: ath?.avatar_url || undefined, belt: ath?.belt || undefined };
      });

    // Monthly growth (last 6 months)
    const monthlyGrowth: { mes: string; ativos: number; novos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const novos = athletes.filter(a => {
        if (!a.created_at) return false;
        const c = new Date(a.created_at);
        return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
      }).length;
      const ativos = athletes.filter(a => {
        if (!a.created_at) return false;
        return new Date(a.created_at) <= monthEnd && a.is_active !== false;
      }).length;
      monthlyGrowth.push({ mes: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1), ativos, novos });
    }

    // Athletes list with session count
    const athletesList = athletes.map(a => ({
      id: a.id,
      name: a.name,
      belt: a.belt || undefined,
      avatarUrl: a.avatar_url || undefined,
      active: a.is_active !== false,
      sessionCount: athleteSessionCount[a.id] || 0,
    })).sort((a, b) => b.sessionCount - a.sessionCount);

    setData({
      totalAthletes: activeAthletes.length,
      weekSessions: sessions.length,
      totalKicks,
      avgReaction,
      sessionsByDay,
      recentSessions,
      modeUsage,
      topAthletes,
      monthlyGrowth,
      athletesList,
    });
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Activity className="w-5 h-5 text-primary" />
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">Dashboard</h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Painel da Academia</p>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          <Tabs defaultValue="visao_geral">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="visao_geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="atletas">Atletas</TabsTrigger>
              <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
              <TabsTrigger value="crescimento">Crescimento</TabsTrigger>
            </TabsList>

            {/* ═══ VISÃO GERAL ═══ */}
            <TabsContent value="visao_geral" className="space-y-6 mt-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={<Users className="w-5 h-5" />} label="Alunos Ativos" value={String(data.totalAthletes)} color="text-green-400" />
                <KPICard icon={<Target className="w-5 h-5" />} label="Sessões (7d)" value={String(data.weekSessions)} color="text-blue-400" />
                <KPICard icon={<Activity className="w-5 h-5" />} label="Chutes (7d)" value={data.totalKicks > 999 ? `${(data.totalKicks / 1000).toFixed(1)}k` : String(data.totalKicks)} color="text-yellow-400" />
                <KPICard icon={<Zap className="w-5 h-5" />} label="Reação Média" value={data.avgReaction ? `${data.avgReaction}ms` : '--'} color="text-purple-400" />
              </div>

              {/* Sessions chart + Recent */}
              <div className="grid lg:grid-cols-5 gap-4">
                <Card className="lg:col-span-3 bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Sessões da Semana
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.sessionsByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="sessoes" name="Sessões" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Atividade Recente
                    </h3>
                    <div className="space-y-2">
                      {data.recentSessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground/60">Nenhuma sessão recente.</p>
                      ) : data.recentSessions.map((s, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background border border-border">
                          <StudentAvatar name={s.athlete} avatarUrl={s.avatarUrl} belt={s.belt} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{s.athlete}</p>
                            <p className="text-[10px] text-muted-foreground">{s.mode}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-primary">{s.result}</p>
                            <p className="text-[10px] text-muted-foreground">{s.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pie charts */}
              {data.modeUsage.length > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4" /> Uso por Modo
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={data.modeUsage} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {data.modeUsage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══ ATLETAS ═══ */}
            <TabsContent value="atletas" className="space-y-6 mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Atletas da Academia ({data.athletesList.length})
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.athletesList.map(a => (
                  <button key={a.id} onClick={() => navigate(`/students/${a.id}`)}
                    className={`flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left ${!a.active ? 'opacity-50' : ''}`}>
                    <StudentAvatar name={a.name} avatarUrl={a.avatarUrl} belt={a.belt} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.sessionCount} sessões</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.active ? 'bg-green-500' : 'bg-zinc-500'}`} />
                  </button>
                ))}
              </div>

              {/* Top athletes ranking */}
              {data.topAthletes.length > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> Top Atletas por Sessões
                    </h3>
                    <div className="space-y-3">
                      {data.topAthletes.map((a, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? 'bg-yellow-500 text-yellow-950' : i === 1 ? 'bg-zinc-400 text-zinc-900' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {i + 1}
                          </div>
                          <StudentAvatar name={a.name} avatarUrl={a.avatarUrl} belt={a.belt} size="sm" />
                          <span className="flex-1 text-sm font-semibold text-foreground">{a.name}</span>
                          <span className="text-lg font-black text-primary">{a.sessions}</span>
                          <span className="text-xs text-muted-foreground">sessões</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══ DESEMPENHO ═══ */}
            <TabsContent value="desempenho" className="space-y-6 mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Gráficos de Desempenho</h3>
                  <p className="text-xs text-muted-foreground/60">
                    Evolução de reação, radar comparativo e insights serão exibidos aqui conforme os atletas acumulam sessões.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ CRESCIMENTO ═══ */}
            <TabsContent value="crescimento" className="space-y-6 mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Crescimento da Academia
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.monthlyGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="ativos" name="Ativos" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2.5} />
                      <Area type="monotone" dataKey="novos" name="Novos" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Growth KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <KPICard icon={<Users className="w-5 h-5" />} label="Total Ativos" value={String(data.totalAthletes)} color="text-green-400" />
                <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Novos (mês)" value={String(data.monthlyGrowth[data.monthlyGrowth.length - 1]?.novos || 0)} color="text-blue-400" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={color}>{icon}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <span className="text-2xl font-black text-foreground">{value}</span>
      </CardContent>
    </Card>
  );
}
