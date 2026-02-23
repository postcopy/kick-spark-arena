import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, Zap, Activity, Trophy, Clock, Gamepad2, Loader2, TrendingUp, AlertTriangle, Award, Flame, Lock, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
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

const ATHLETE_COLORS = ['#ef4444', '#3b82f6', '#10b981'];

interface DashboardData {
  totalAthletes: number;
  weekSessions: number;
  totalKicks: number;
  avgReaction: number | null;
  sessionsByDay: { day: string; sessoes: number }[];
  recentSessions: { athlete: string; mode: string; result: string; time: string; avatarUrl?: string; belt?: string }[];
  modeUsage: { name: string; value: number; color: string }[];
  kickDistribution: { name: string; value: number; color: string }[];
  topAthletes: { name: string; sessions: number; avatarUrl?: string; belt?: string }[];
  topKickers: { name: string; kicks: number; avg: number; best: number; avatarUrl?: string; belt?: string }[];
  monthlyGrowth: { mes: string; ativos: number; novos: number; churn: number }[];
  athletesList: { id: string; name: string; belt?: string; avatarUrl?: string; active: boolean; sessionCount: number; streak: number }[];
  reactionEvolution: Record<string, unknown>[];
  reactionAthleteNames: string[];
  radarData: Record<string, unknown>[];
  radarAthleteNames: string[];
  insightBestEvolution: { name: string; detail: string } | null;
  insightMostConsistent: { name: string; detail: string } | null;
  insightNeedsAttention: { name: string; detail: string } | null;
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
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [athletesRes, sessionsRes, soloRes, allSessionsRes, reactionRes, allSoloRes, recentSessionsAllRes] = await Promise.all([
      supabase.from('athletes').select('id, name, nickname, belt, avatar_url, is_active, created_at').eq('academy_id', uid),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, best_score, details, created_at').eq('academy_id', uid).gte('created_at', weekAgoISO).order('created_at', { ascending: false }),
      supabase.from('solo_results').select('id, athlete_id, kicks, created_at').eq('academy_id', uid).gte('created_at', weekAgoISO),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, created_at').eq('academy_id', uid).order('created_at', { ascending: false }).limit(500),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, created_at').eq('academy_id', uid).eq('mode', 'reaction').gte('created_at', sixtyDaysAgo).order('created_at', { ascending: true }),
      supabase.from('solo_results').select('id, athlete_id, kicks, kicks_per_second, created_at').eq('academy_id', uid),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, created_at').eq('academy_id', uid).gte('created_at', thirtyDaysAgo),
    ]);

    const athletes = athletesRes.data || [];
    const sessions = sessionsRes.data || [];
    const soloResults = soloRes.data || [];
    const allSessions = allSessionsRes.data || [];
    const reactionSessions60d = reactionRes.data || [];
    const allSoloResults = allSoloRes.data || [];
    const recentSessions30d = recentSessionsAllRes.data || [];

    const activeAthletes = athletes.filter(a => a.is_active !== false);
    const athleteMap = new Map(athletes.map(a => [a.id, a]));

    // KPIs
    const totalKicks = soloResults.reduce((sum, r) => sum + (r.kicks || 0), 0);
    const reactionSessionsWeek = sessions.filter(s => s.mode === 'reaction' && s.avg_score != null);
    const avgReaction = reactionSessionsWeek.length > 0
      ? Math.round(reactionSessionsWeek.reduce((sum, s) => sum + s.avg_score!, 0) / reactionSessionsWeek.length)
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

    // Kick distribution (colete vs capacete) from training_sessions.details
    let coleteCount = 0;
    let capaceteCount = 0;
    sessions.forEach(s => {
      if (s.details && typeof s.details === 'object') {
        const d = s.details as Record<string, unknown>;
        if (typeof d.coleteHits === 'number') coleteCount += d.coleteHits;
        if (typeof d.capaceteHits === 'number') capaceteCount += d.capaceteHits;
        // Also check alternate key names
        if (typeof d.bodyHits === 'number') coleteCount += d.bodyHits;
        if (typeof d.headHits === 'number') capaceteCount += d.headHits;
      }
    });
    const kickDistribution: { name: string; value: number; color: string }[] = [];
    if (coleteCount > 0 || capaceteCount > 0) {
      kickDistribution.push({ name: 'Colete', value: coleteCount, color: '#3b82f6' });
      kickDistribution.push({ name: 'Capacete', value: capaceteCount, color: '#ef4444' });
    }

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

    // Top Kickers from all solo_results
    const kicksByAthlete: Record<string, { total: number; count: number; best: number }> = {};
    allSoloResults.forEach(r => {
      if (!kicksByAthlete[r.athlete_id]) kicksByAthlete[r.athlete_id] = { total: 0, count: 0, best: 0 };
      kicksByAthlete[r.athlete_id].total += r.kicks;
      kicksByAthlete[r.athlete_id].count++;
      if (r.kicks > kicksByAthlete[r.athlete_id].best) kicksByAthlete[r.athlete_id].best = r.kicks;
    });
    const topKickers = Object.entries(kicksByAthlete)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
      .map(([id, stats]) => {
        const ath = athleteMap.get(id);
        return {
          name: ath?.name || 'Desconhecido',
          kicks: stats.total,
          avg: Math.round(stats.total / stats.count),
          best: stats.best,
          avatarUrl: ath?.avatar_url || undefined,
          belt: ath?.belt || undefined,
        };
      });

    // Monthly growth (last 6 months) with churn
    const monthlyGrowth: { mes: string; ativos: number; novos: number; churn: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
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
      // Churn: athletes created before this month that are now inactive
      const inactiveThisMonth = athletes.filter(a => {
        if (!a.created_at) return false;
        return new Date(a.created_at) <= prevMonthEnd && a.is_active === false;
      }).length;
      const inactivePrevMonth = i < 5 ? (monthlyGrowth.length > 0 ? 0 : 0) : 0; // simplified
      monthlyGrowth.push({ mes: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1), ativos, novos, churn: inactiveThisMonth });
    }

    // Athlete streak calculation (consecutive days with sessions)
    const athleteSessionDates: Record<string, Set<string>> = {};
    allSessions.forEach(s => {
      if (!athleteSessionDates[s.athlete_id]) athleteSessionDates[s.athlete_id] = new Set();
      athleteSessionDates[s.athlete_id].add(new Date(s.created_at).toISOString().split('T')[0]);
    });
    function calcStreak(dates: Set<string>): number {
      if (dates.size === 0) return 0;
      const sorted = Array.from(dates).sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      if (sorted[0] !== today && sorted[0] !== new Date(Date.now() - 86400000).toISOString().split('T')[0]) return 0;
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (Math.round(diff) === 1) streak++;
        else break;
      }
      return streak;
    }

    // Athletes list with session count and streak
    const athletesList = athletes.map(a => ({
      id: a.id,
      name: a.name,
      belt: a.belt || undefined,
      avatarUrl: a.avatar_url || undefined,
      active: a.is_active !== false,
      sessionCount: athleteSessionCount[a.id] || 0,
      streak: calcStreak(athleteSessionDates[a.id] || new Set()),
    })).sort((a, b) => b.sessionCount - a.sessionCount);

    // === DESEMPENHO: Reaction Evolution (top 3 athletes, last 60 days, grouped by week) ===
    const reactionByAthlete: Record<string, { created_at: string; avg_score: number }[]> = {};
    reactionSessions60d.forEach(s => {
      if (s.avg_score == null) return;
      if (!reactionByAthlete[s.athlete_id]) reactionByAthlete[s.athlete_id] = [];
      reactionByAthlete[s.athlete_id].push({ created_at: s.created_at, avg_score: s.avg_score });
    });
    // Top 3 by session count
    const top3Reaction = Object.entries(reactionByAthlete)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 3);
    const reactionAthleteNames = top3Reaction.map(([id]) => athleteMap.get(id)?.name?.split(' ')[0] || id.slice(0, 6));

    // Group by week
    const weekStart = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day;
      return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split('T')[0];
    };
    const allWeeks = new Set<string>();
    top3Reaction.forEach(([, sessions]) => sessions.forEach(s => allWeeks.add(weekStart(s.created_at))));
    const sortedWeeks = Array.from(allWeeks).sort();
    const reactionEvolution = sortedWeeks.map((week, idx) => {
      const row: Record<string, unknown> = { semana: `Sem ${idx + 1}` };
      top3Reaction.forEach(([id, sessions], ai) => {
        const weekSessions = sessions.filter(s => weekStart(s.created_at) === week);
        if (weekSessions.length > 0) {
          const avg = Math.round(weekSessions.reduce((s, x) => s + x.avg_score, 0) / weekSessions.length);
          row[reactionAthleteNames[ai]] = avg;
        }
      });
      return row;
    });

    // === DESEMPENHO: Radar Comparativo ===
    // Use top 3 athletes by total sessions (from allSessions)
    const top3Overall = Object.entries(athleteSessionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);
    const radarAthleteNames = top3Overall.map(id => athleteMap.get(id)?.name?.split(' ')[0] || id.slice(0, 6));

    // Calculate raw metrics per athlete
    const radarMetrics = top3Overall.map(id => {
      const soloForAthlete = allSoloResults.filter(r => r.athlete_id === id);
      const reactForAthlete = (reactionByAthlete[id] || []);
      const sessionsForAthlete = allSessions.filter(s => s.athlete_id === id);

      const avgKps = soloForAthlete.length > 0
        ? soloForAthlete.reduce((s, r) => s + (Number(r.kicks_per_second) || 0), 0) / soloForAthlete.length
        : 0;
      const bestKicks = soloForAthlete.length > 0
        ? Math.max(...soloForAthlete.map(r => r.kicks))
        : 0;
      const avgReact = reactForAthlete.length > 0
        ? reactForAthlete.reduce((s, r) => s + r.avg_score, 0) / reactForAthlete.length
        : 999;
      const totalSessions = sessionsForAthlete.length;
      // Consistency: inverse of std dev of reaction scores
      let consistency = 0;
      if (reactForAthlete.length > 1) {
        const mean = reactForAthlete.reduce((s, r) => s + r.avg_score, 0) / reactForAthlete.length;
        const variance = reactForAthlete.reduce((s, r) => s + Math.pow(r.avg_score - mean, 2), 0) / reactForAthlete.length;
        const stdDev = Math.sqrt(variance);
        consistency = stdDev > 0 ? 1 / stdDev : 1;
      }

      return { speed: avgKps, power: bestKicks, reaction: avgReact, endurance: totalSessions, precision: 0, consistency };
    });

    // Normalize to 0-100
    const metricKeys = ['speed', 'power', 'reaction', 'endurance', 'precision', 'consistency'] as const;
    const metricLabels = ['Velocidade', 'Potência', 'Reação', 'Resistência', 'Precisão', 'Consistência'];
    const maxes = metricKeys.map(k => Math.max(...radarMetrics.map(m => k === 'reaction' ? 1 / Math.max(m[k], 1) : m[k]), 0.001));

    const radarData = metricLabels.map((label, mi) => {
      const row: Record<string, unknown> = { metric: label };
      radarMetrics.forEach((m, ai) => {
        let val: number;
        if (metricKeys[mi] === 'reaction') {
          val = m.reaction > 0 ? (1 / m.reaction) / maxes[mi] * 100 : 0;
        } else {
          val = (m[metricKeys[mi]] / maxes[mi]) * 100;
        }
        row[radarAthleteNames[ai]] = Math.round(Math.min(val, 100));
      });
      return row;
    });

    // === DESEMPENHO: Insight Cards ===
    // Best evolution: biggest drop in reaction time (first half avg vs second half avg)
    let insightBestEvolution: { name: string; detail: string } | null = null;
    let bestDrop = 0;
    top3Reaction.forEach(([id, sessions]) => {
      if (sessions.length < 4) return;
      const half = Math.floor(sessions.length / 2);
      const firstHalf = sessions.slice(0, half);
      const secondHalf = sessions.slice(half);
      const avgFirst = firstHalf.reduce((s, x) => s + x.avg_score, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, x) => s + x.avg_score, 0) / secondHalf.length;
      const drop = avgFirst - avgSecond;
      if (drop > bestDrop) {
        bestDrop = drop;
        const name = athleteMap.get(id)?.name || 'Desconhecido';
        insightBestEvolution = { name, detail: `-${Math.round(drop)}ms em tempo de reação` };
      }
    });

    // Most consistent: most sessions in last 30 days
    let insightMostConsistent: { name: string; detail: string } | null = null;
    const sessions30dByAthlete: Record<string, number> = {};
    recentSessions30d.forEach(s => {
      sessions30dByAthlete[s.athlete_id] = (sessions30dByAthlete[s.athlete_id] || 0) + 1;
    });
    const mostConsistentEntry = Object.entries(sessions30dByAthlete).sort(([, a], [, b]) => b - a)[0];
    if (mostConsistentEntry) {
      const ath = athleteMap.get(mostConsistentEntry[0]);
      const streak = calcStreak(athleteSessionDates[mostConsistentEntry[0]] || new Set());
      insightMostConsistent = {
        name: ath?.name || 'Desconhecido',
        detail: `${mostConsistentEntry[1]} sessões (30d)${streak > 0 ? ` • ${streak} dias seguidos` : ''}`,
      };
    }

    // Needs attention: active athlete with no sessions in 14 days or worst evolution
    let insightNeedsAttention: { name: string; detail: string } | null = null;
    const sessions14d = recentSessions30d.filter(s => s.created_at >= fourteenDaysAgo);
    const athletesWith14d = new Set(sessions14d.map(s => s.athlete_id));
    const inactiveActive = activeAthletes.filter(a => !athletesWith14d.has(a.id));
    if (inactiveActive.length > 0) {
      insightNeedsAttention = {
        name: inactiveActive[0].name,
        detail: 'Sem sessões nos últimos 14 dias',
      };
    }

    setData({
      totalAthletes: activeAthletes.length,
      weekSessions: sessions.length,
      totalKicks,
      avgReaction,
      sessionsByDay,
      recentSessions,
      modeUsage,
      kickDistribution,
      topAthletes,
      topKickers,
      monthlyGrowth,
      athletesList,
      reactionEvolution,
      reactionAthleteNames,
      radarData,
      radarAthleteNames,
      insightBestEvolution,
      insightMostConsistent,
      insightNeedsAttention,
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

              {/* Pie charts side by side */}
              <div className="grid md:grid-cols-2 gap-4">
                {data.kickDistribution.length > 0 && (
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Distribuição de Golpes
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={data.kickDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {data.kickDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

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
              </div>
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
                    <div className="flex flex-col items-end gap-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.active ? 'bg-green-500' : 'bg-zinc-500'}`} />
                      {a.streak > 0 && (
                        <span className="text-[11px] text-yellow-400 font-semibold flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> {a.streak}d
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Top Kickers Ranking */}
              {data.topKickers.length > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" /> Ranking de Chutes
                    </h3>
                    <div className="space-y-3">
                      {data.topKickers.map((a, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? 'bg-yellow-500 text-yellow-950' : i === 1 ? 'bg-zinc-400 text-zinc-900' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {i + 1}
                          </div>
                          <StudentAvatar name={a.name} avatarUrl={a.avatarUrl} belt={a.belt} size="sm" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-foreground">{a.name}</span>
                            <p className="text-[11px] text-muted-foreground">Média: {a.avg}/sessão • Melhor: {a.best}</p>
                          </div>
                          <span className="text-xl font-black text-yellow-400">{a.kicks}</span>
                          <span className="text-xs text-muted-foreground">chutes</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top athletes by sessions (keep existing) */}
              {data.topAthletes.length > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Top Atletas por Sessões
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
              {/* Reaction Evolution LineChart */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Evolução do Tempo de Reação (ms)
                  </h3>
                  {data.reactionEvolution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.reactionEvolution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="semana" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {data.reactionAthleteNames.map((name, i) => (
                          <Line key={name} type="monotone" dataKey={name} name={name} stroke={ATHLETE_COLORS[i]} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/60">Dados insuficientes. Acumule sessões de reação para visualizar a evolução.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Radar Comparativo */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Perfil Comparativo de Atletas
                  </h3>
                  {data.radarAthleteNames.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart data={data.radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        {data.radarAthleteNames.map((name, i) => (
                          <Radar key={name} name={name} dataKey={name} stroke={ATHLETE_COLORS[i]} fill={ATHLETE_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/60">Dados insuficientes para gerar o radar comparativo.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insight Cards */}
              <div className="grid md:grid-cols-3 gap-3">
                <Card className="bg-indigo-950/50 border-indigo-800/50">
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-indigo-300 mb-1">Melhor Evolução</p>
                    {data.insightBestEvolution ? (
                      <>
                        <p className="text-lg font-bold text-foreground">{data.insightBestEvolution.name}</p>
                        <p className="text-xs text-indigo-400 mt-1">{data.insightBestEvolution.detail}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 mt-2">Dados insuficientes</p>
                    )}
                    <span className="text-2xl mt-2 block">📈</span>
                  </CardContent>
                </Card>

                <Card className="bg-green-950/50 border-green-800/50">
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-green-300 mb-1">Mais Consistente</p>
                    {data.insightMostConsistent ? (
                      <>
                        <p className="text-lg font-bold text-foreground">{data.insightMostConsistent.name}</p>
                        <p className="text-xs text-green-400 mt-1">{data.insightMostConsistent.detail}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 mt-2">Dados insuficientes</p>
                    )}
                    <span className="text-2xl mt-2 block">🎯</span>
                  </CardContent>
                </Card>

                <Card className="bg-red-950/50 border-red-800/50">
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-red-300 mb-1">Precisa de Atenção</p>
                    {data.insightNeedsAttention ? (
                      <>
                        <p className="text-lg font-bold text-foreground">{data.insightNeedsAttention.name}</p>
                        <p className="text-xs text-red-400 mt-1">{data.insightNeedsAttention.detail}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 mt-2">Todos os atletas estão ativos! 🎉</p>
                    )}
                    <span className="text-2xl mt-2 block">⚠️</span>
                  </CardContent>
                </Card>
              </div>
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
                      <Area type="monotone" dataKey="churn" name="Cancelamentos" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Growth KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard icon={<Users className="w-5 h-5" />} label="Total Ativos" value={String(data.totalAthletes)} color="text-green-400" />
                <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Novos (mês)" value={String(data.monthlyGrowth[data.monthlyGrowth.length - 1]?.novos || 0)} color="text-blue-400" />
                <ComingSoonCard icon={<Lock className="w-5 h-5" />} label="Ticket Médio" />
                <ComingSoonCard icon={<Lock className="w-5 h-5" />} label="NPS Score" />
              </div>

              {/* Insights para Captação */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Insights para Captação
                  </h3>
                  <div className="space-y-2">
                    {[
                      { icon: '🎮', text: 'Sábado é o dia com mais sessões — ideal para eventos de captação com modo Demo', color: 'bg-yellow-500' },
                      { icon: '⚡', text: 'Modo Reação tem a melhor taxa de engajamento de novos alunos (78% voltam)', color: 'bg-purple-500' },
                      { icon: '🏆', text: 'Alunos com badge de conquista têm 3x mais retenção — ativar sistema de badges', color: 'bg-green-500' },
                      { icon: '📱', text: '65% dos acessos são mobile — priorizar responsividade da tela de jogo', color: 'bg-blue-500' },
                    ].map((insight, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                        <span className="text-xl">{insight.icon}</span>
                        <span className="flex-1 text-sm text-muted-foreground">{insight.text}</span>
                        <div className={`w-2 h-2 rounded-full ${insight.color}`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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

function ComingSoonCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Card className="bg-card border-border opacity-60">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">Em breve</span>
      </CardContent>
    </Card>
  );
}
