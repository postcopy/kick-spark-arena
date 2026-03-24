import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Target, Flame, Zap, TrendingUp, TrendingDown, Award, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const TOOLTIP_STYLE = {
  background: '#141420',
  border: '1px solid #1E1E2E',
  borderRadius: 12,
  fontSize: 13,
  color: '#F8FAFC',
};

const MODE_COLORS: Record<string, string> = {
  time_attack: '#F59E0B',
  arcade: '#E11D48',
  reaction: '#10B981',
  cognitive: '#8B5CF6',
};

const MODE_LABELS: Record<string, string> = {
  time_attack: 'Contra o Tempo',
  arcade: 'Duelo',
  reaction: 'Reação',
  cognitive: 'Cognitivo',
};

const ATHLETE_COLORS = ['#E11D48', '#3B82F6', '#10B981'];

const BELT_COLORS: Record<string, string> = {
  preta: '#1a1a1a',
  vermelha: '#dc2626',
  azul: '#2563eb',
  verde: '#16a34a',
  amarela: '#eab308',
  branca: '#f8fafc',
  roxa: '#9333ea',
  marrom: '#92400e',
  laranja: '#ea580c',
};

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

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const TABS = [
  { id: 'visao_geral', label: 'Visão Geral' },
  { id: 'atletas', label: 'Atletas' },
  { id: 'desempenho', label: 'Desempenho' },
  { id: 'crescimento', label: 'Crescimento' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState('visao_geral');
  const [period, setPeriod] = useState('semana');
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDashboard(user.id);
  }, [user, period]);

  async function loadDashboard(uid: string) {
    setLoading(true);

    const now = new Date();
    const periodDays = period === 'ano' ? 365 : period === 'mes' ? 30 : 7;
    const periodAgo = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const weekAgoISO = periodAgo.toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [athletesRes, sessionsRes, soloRes, allSessionsRes, reactionRes, allSoloRes, recentSessionsAllRes] = await Promise.all([
      supabase.from('athletes').select('id, name, nickname, belt, avatar_url, is_active, created_at').eq('academy_id', uid),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, best_score, details, created_at').eq('academy_id', uid).gte('created_at', weekAgoISO).order('created_at', { ascending: false }),
      supabase.from('solo_results').select('id, athlete_id, kicks, created_at').eq('academy_id', uid).gte('created_at', weekAgoISO),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, created_at').eq('academy_id', uid).order('created_at', { ascending: false }).limit(500),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, created_at').eq('academy_id', uid).eq('mode', 'reaction').gte('created_at', sixtyDaysAgo).order('created_at', { ascending: true }),
      supabase.from('solo_results').select('id, athlete_id, kicks, kicks_per_second, created_at').eq('academy_id', uid).gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('training_sessions').select('id, athlete_id, mode, avg_score, created_at').eq('academy_id', uid).gte('created_at', thirtyDaysAgo),
    ]);

    // Error handling for all queries
    const queryErrors = [
      { res: athletesRes, label: 'atletas' },
      { res: sessionsRes, label: 'sessões' },
      { res: soloRes, label: 'resultados solo' },
      { res: allSessionsRes, label: 'todas sessões' },
      { res: reactionRes, label: 'sessões de reação' },
      { res: allSoloRes, label: 'todos resultados solo' },
      { res: recentSessionsAllRes, label: 'sessões recentes' },
    ];
    for (const { res, label } of queryErrors) {
      if (res.error) {
        console.error(`Dashboard query error (${label}):`, res.error);
        import('sonner').then(({ toast }) => toast.error(`Erro ao carregar ${label}`));
      }
    }

    const athletes = athletesRes.data || [];
    const sessions = sessionsRes.data || [];
    const soloResults = soloRes.data || [];
    const allSessions = allSessionsRes.data || [];
    const reactionSessions60d = reactionRes.data || [];
    const allSoloResults = allSoloRes.data || [];
    const recentSessions30d = recentSessionsAllRes.data || [];

    const activeAthletes = athletes.filter(a => a.is_active !== false);
    const athleteMap = new Map(athletes.map(a => [a.id, a]));

    const totalKicks = soloResults.reduce((sum, r) => sum + (r.kicks || 0), 0);
    const reactionSessionsWeek = sessions.filter(s => s.mode === 'reaction' && s.avg_score != null);
    const avgReaction = reactionSessionsWeek.length > 0
      ? Math.round(reactionSessionsWeek.reduce((sum, s) => sum + s.avg_score!, 0) / reactionSessionsWeek.length)
      : null;

    const dayBuckets: Record<number, number> = {};
    for (let i = 0; i < 7; i++) dayBuckets[i] = 0;
    sessions.forEach(s => { dayBuckets[new Date(s.created_at).getDay()]++; });
    const sessionsByDay = DAY_NAMES.map((day, i) => ({ day, sessoes: dayBuckets[i] }));

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
        athlete: ath?.name || 'Desconhecido', mode: MODE_LABELS[s.mode] || s.mode,
        result, time, avatarUrl: ath?.avatar_url || undefined, belt: ath?.belt || undefined,
      };
    });

    const modeCount: Record<string, number> = {};
    sessions.forEach(s => { modeCount[s.mode] = (modeCount[s.mode] || 0) + 1; });
    const modeUsage = Object.entries(modeCount).map(([mode, value]) => ({
      name: MODE_LABELS[mode] || mode, value, color: MODE_COLORS[mode] || '#64748b',
    }));

    let coleteCount = 0; let capaceteCount = 0;
    sessions.forEach(s => {
      if (s.details && typeof s.details === 'object') {
        const d = s.details as Record<string, unknown>;
        if (typeof d.coleteHits === 'number') coleteCount += d.coleteHits;
        if (typeof d.capaceteHits === 'number') capaceteCount += d.capaceteHits;
        if (typeof d.bodyHits === 'number') coleteCount += d.bodyHits;
        if (typeof d.headHits === 'number') capaceteCount += d.headHits;
      }
    });
    const kickDistribution: { name: string; value: number; color: string }[] = [];
    if (coleteCount > 0 || capaceteCount > 0) {
      kickDistribution.push({ name: 'Colete', value: coleteCount, color: '#3B82F6' });
      kickDistribution.push({ name: 'Capacete', value: capaceteCount, color: '#E11D48' });
    }

    const athleteSessionCount: Record<string, number> = {};
    allSessions.forEach(s => { athleteSessionCount[s.athlete_id] = (athleteSessionCount[s.athlete_id] || 0) + 1; });
    const topAthletes = Object.entries(athleteSessionCount).sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([id, count]) => { const ath = athleteMap.get(id); return { name: ath?.name || 'Desconhecido', sessions: count, avatarUrl: ath?.avatar_url || undefined, belt: ath?.belt || undefined }; });

    const kicksByAthlete: Record<string, { total: number; count: number; best: number }> = {};
    allSoloResults.forEach(r => {
      if (!kicksByAthlete[r.athlete_id]) kicksByAthlete[r.athlete_id] = { total: 0, count: 0, best: 0 };
      kicksByAthlete[r.athlete_id].total += r.kicks;
      kicksByAthlete[r.athlete_id].count++;
      if (r.kicks > kicksByAthlete[r.athlete_id].best) kicksByAthlete[r.athlete_id].best = r.kicks;
    });
    const topKickers = Object.entries(kicksByAthlete).sort(([, a], [, b]) => b.total - a.total).slice(0, 5)
      .map(([id, stats]) => { const ath = athleteMap.get(id); return { name: ath?.name || 'Desconhecido', kicks: stats.total, avg: Math.round(stats.total / stats.count), best: stats.best, avatarUrl: ath?.avatar_url || undefined, belt: ath?.belt || undefined }; });

    const monthlyGrowth: { mes: string; ativos: number; novos: number; churn: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - i, 0);
      const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const novos = athletes.filter(a => { if (!a.created_at) return false; const c = new Date(a.created_at); return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear(); }).length;
      const ativos = athletes.filter(a => { if (!a.created_at) return false; return new Date(a.created_at) <= monthEnd && a.is_active !== false; }).length;
      const inactiveThisMonth = athletes.filter(a => { if (!a.created_at) return false; return new Date(a.created_at) <= prevMonthEnd && a.is_active === false; }).length;
      monthlyGrowth.push({ mes: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1), ativos, novos, churn: inactiveThisMonth });
    }

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
        const prev = new Date(sorted[i - 1]); const curr = new Date(sorted[i]);
        if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) streak++; else break;
      }
      return streak;
    }

    const athletesList = athletes.map(a => ({
      id: a.id, name: a.name, belt: a.belt || undefined, avatarUrl: a.avatar_url || undefined,
      active: a.is_active !== false, sessionCount: athleteSessionCount[a.id] || 0,
      streak: calcStreak(athleteSessionDates[a.id] || new Set()),
    })).sort((a, b) => b.sessionCount - a.sessionCount);

    const reactionByAthlete: Record<string, { created_at: string; avg_score: number }[]> = {};
    reactionSessions60d.forEach(s => { if (s.avg_score == null) return; if (!reactionByAthlete[s.athlete_id]) reactionByAthlete[s.athlete_id] = []; reactionByAthlete[s.athlete_id].push({ created_at: s.created_at, avg_score: s.avg_score }); });
    const top3Reaction = Object.entries(reactionByAthlete).sort(([, a], [, b]) => b.length - a.length).slice(0, 3);
    const reactionAthleteNames = top3Reaction.map(([id]) => athleteMap.get(id)?.name?.split(' ')[0] || id.slice(0, 6));
    const weekStart = (dateStr: string) => { const d = new Date(dateStr); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()).toISOString().split('T')[0]; };
    const allWeeks = new Set<string>(); top3Reaction.forEach(([, s]) => s.forEach(x => allWeeks.add(weekStart(x.created_at))));
    const sortedWeeks = Array.from(allWeeks).sort();
    const reactionEvolution = sortedWeeks.map((week, idx) => {
      const row: Record<string, unknown> = { semana: `Sem ${idx + 1}` };
      top3Reaction.forEach(([, sessions], ai) => { const ws = sessions.filter(s => weekStart(s.created_at) === week); if (ws.length > 0) row[reactionAthleteNames[ai]] = Math.round(ws.reduce((s, x) => s + x.avg_score, 0) / ws.length); });
      return row;
    });

    const top3Overall = Object.entries(athleteSessionCount).sort(([, a], [, b]) => b - a).slice(0, 3).map(([id]) => id);
    const radarAthleteNames = top3Overall.map(id => athleteMap.get(id)?.name?.split(' ')[0] || id.slice(0, 6));
    const radarMetrics = top3Overall.map(id => {
      const soloForAthlete = allSoloResults.filter(r => r.athlete_id === id);
      const reactForAthlete = reactionByAthlete[id] || [];
      const sessionsForAthlete = allSessions.filter(s => s.athlete_id === id);
      const avgKps = soloForAthlete.length > 0 ? soloForAthlete.reduce((s, r) => s + (Number(r.kicks_per_second) || 0), 0) / soloForAthlete.length : 0;
      const bestKicks = soloForAthlete.length > 0 ? Math.max(...soloForAthlete.map(r => r.kicks)) : 0;
      const avgReact = reactForAthlete.length > 0 ? reactForAthlete.reduce((s, r) => s + r.avg_score, 0) / reactForAthlete.length : 999;
      const totalSessions = sessionsForAthlete.length;
      let consistency = 0;
      if (reactForAthlete.length > 1) { const mean = reactForAthlete.reduce((s, r) => s + r.avg_score, 0) / reactForAthlete.length; const variance = reactForAthlete.reduce((s, r) => s + Math.pow(r.avg_score - mean, 2), 0) / reactForAthlete.length; consistency = Math.sqrt(variance) > 0 ? 1 / Math.sqrt(variance) : 1; }
      return { speed: avgKps, power: bestKicks, reaction: avgReact, endurance: totalSessions, precision: 0, consistency };
    });
    const metricKeys = ['speed', 'power', 'reaction', 'endurance', 'precision', 'consistency'] as const;
    const metricLabels = ['Velocidade', 'Potência', 'Reação', 'Resistência', 'Precisão', 'Consistência'];
    const maxes = metricKeys.map(k => Math.max(...radarMetrics.map(m => k === 'reaction' ? 1 / Math.max(m[k], 1) : m[k]), 0.001));
    const radarData = metricLabels.map((label, mi) => {
      const row: Record<string, unknown> = { metric: label };
      radarMetrics.forEach((m, ai) => { let val: number; if (metricKeys[mi] === 'reaction') val = m.reaction > 0 ? (1 / m.reaction) / maxes[mi] * 100 : 0; else val = (m[metricKeys[mi]] / maxes[mi]) * 100; row[radarAthleteNames[ai]] = Math.round(Math.min(val, 100)); });
      return row;
    });

    let insightBestEvolution: { name: string; detail: string } | null = null; let bestDrop = 0;
    top3Reaction.forEach(([id, sessions]) => { if (sessions.length < 4) return; const half = Math.floor(sessions.length / 2); const avgFirst = sessions.slice(0, half).reduce((s, x) => s + x.avg_score, 0) / half; const avgSecond = sessions.slice(half).reduce((s, x) => s + x.avg_score, 0) / (sessions.length - half); const drop = avgFirst - avgSecond; if (drop > bestDrop) { bestDrop = drop; insightBestEvolution = { name: athleteMap.get(id)?.name || 'Desconhecido', detail: `-${Math.round(drop)}ms em tempo de reação` }; } });

    let insightMostConsistent: { name: string; detail: string } | null = null;
    const sessions30dByAthlete: Record<string, number> = {}; recentSessions30d.forEach(s => { sessions30dByAthlete[s.athlete_id] = (sessions30dByAthlete[s.athlete_id] || 0) + 1; });
    const mostConsistentEntry = Object.entries(sessions30dByAthlete).sort(([, a], [, b]) => b - a)[0];
    if (mostConsistentEntry) { const ath = athleteMap.get(mostConsistentEntry[0]); const streak = calcStreak(athleteSessionDates[mostConsistentEntry[0]] || new Set()); insightMostConsistent = { name: ath?.name || 'Desconhecido', detail: `${mostConsistentEntry[1]} sessões (30d)${streak > 0 ? ` - ${streak} dias seguidos` : ''}` }; }

    let insightNeedsAttention: { name: string; detail: string } | null = null;
    const sessions14d = recentSessions30d.filter(s => s.created_at >= fourteenDaysAgo);
    const athletesWith14d = new Set(sessions14d.map(s => s.athlete_id));
    const inactiveActive = activeAthletes.filter(a => !athletesWith14d.has(a.id));
    if (inactiveActive.length > 0) insightNeedsAttention = { name: inactiveActive[0].name, detail: 'Sem sessões nos últimos 14 dias' };

    setData({ totalAthletes: activeAthletes.length, weekSessions: sessions.length, totalKicks, avgReaction, sessionsByDay, recentSessions, modeUsage, kickDistribution, topAthletes, topKickers, monthlyGrowth, athletesList, reactionEvolution, reactionAthleteNames, radarData, radarAthleteNames, insightBestEvolution, insightMostConsistent, insightNeedsAttention });
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E11D48]" />
      </div>
    );
  }

  const getInitials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-[#94A3B8] font-medium">Visão geral da sua academia</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-1 bg-[#141420] rounded-xl p-1 border border-[#1E1E2E]" role="tablist" aria-label="Seções do Dashboard">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id} aria-controls={`tabpanel-${t.id}`} className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-0',
                tab === t.id
                  ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              )}>{t.label}</button>
            ))}
          </div>

          {/* Period filter */}
          <div className="flex gap-1 bg-[#141420] rounded-lg p-1 border border-[#1E1E2E]">
            {['semana', 'mes', 'ano'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-all min-h-0',
                period === p ? 'bg-[#1E1E2E] text-white' : 'text-[#64748B] hover:text-[#94A3B8]'
              )}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* VISAO GERAL */}
      {tab === 'visao_geral' && (<div role="tabpanel" id="tabpanel-visao_geral" className="space-y-6">
        {data.totalAthletes === 0 && data.weekSessions === 0 && (
          <div className="bg-[#141420] rounded-xl p-8 border border-[#1E1E2E] text-center">
            <Users className="w-12 h-12 text-[#374151] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Bem-vindo ao seu Dashboard!</h2>
            <p className="text-sm text-[#64748B] max-w-md mx-auto mb-4">Cadastre seu primeiro atleta para começar a ver dados aqui. Depois, registre treinos para acompanhar estatísticas.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate('/students')} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#E11D48] text-white hover:bg-[#F43F5E] transition-colors">Cadastrar atleta</button>
              <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1E1E2E] text-[#94A3B8] hover:bg-[#2D2D3F] transition-colors">Iniciar treino</button>
            </div>
          </div>
        )}
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard icon={<Users className="w-5 h-5" />} label="Atletas Ativos" value={String(data.totalAthletes)} sub={`${data.athletesList.length} cadastrados`} color="#10B981" />
          <KpiCard icon={<Target className="w-5 h-5" />} label="Sessões (7d)" value={String(data.weekSessions)} sub="Esta semana" color="#3B82F6" />
          <KpiCard icon={<Flame className="w-5 h-5" />} label="Total Chutes" value={data.totalKicks > 999 ? `${(data.totalKicks / 1000).toFixed(1)}k` : String(data.totalKicks)} sub="Esta semana" color="#F59E0B" />
          <KpiCard icon={<Zap className="w-5 h-5" />} label="Reação Média" value={data.avgReaction ? `${data.avgReaction}ms` : '--'} sub="Esta semana" color="#8B5CF6" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DashCard title="Sessões da Semana" icon={<BarChart3 className="w-4 h-4" />} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.sessionsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="sessoes" name="Sessões" fill="#E11D48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DashCard>

          <DashCard title="Atividade Recente" icon={<Activity className="w-4 h-4" />}>
            <div className="space-y-2">
              {data.recentSessions.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-[#64748B]">Nenhuma sessão recente.</p>
                  <p className="text-[11px] text-[#475569] mt-1">Registre treinos para ver a atividade aqui.</p>
                  <button onClick={() => navigate('/')} className="mt-2 text-[11px] font-bold text-[#E11D48] hover:text-[#F43F5E] transition-colors">Iniciar treino &rarr;</button>
                </div>
              ) : data.recentSessions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{s.athlete}</p>
                    <p className="text-[11px] text-[#64748B]">{s.mode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#F59E0B]">{s.result}</p>
                    <p className="text-[10px] text-[#64748B]">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        </div>

        {/* Distribution charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.kickDistribution.length > 0 && (
            <DashCard title="Distribuição de Golpes" icon={<Target className="w-4 h-4" />}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.kickDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.kickDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </DashCard>
          )}
          {data.modeUsage.length > 0 && (
            <DashCard title="Uso por Modo" icon={<BarChart3 className="w-4 h-4" />}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.modeUsage} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.modeUsage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </DashCard>
          )}
        </div>
      </div>)}

      {/* ATLETAS */}
      {tab === 'atletas' && (<div role="tabpanel" id="tabpanel-atletas" className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.athletesList.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="w-10 h-10 text-[#374151] mx-auto mb-3" />
              <p className="text-sm text-[#64748B]">Nenhum atleta cadastrado ainda.</p>
              <p className="text-xs text-[#475569] mt-1">Cadastre seu primeiro atleta para começar a ver dados aqui.</p>
              <button onClick={() => navigate('/students')} className="mt-3 px-4 py-2 rounded-lg text-xs font-bold bg-[#E11D48] text-white hover:bg-[#F43F5E] transition-colors">Cadastrar atleta</button>
            </div>
          )}
          {data.athletesList.map(a => (
            <div key={a.id} onClick={() => setSelectedAthlete(a.id === selectedAthlete ? null : a.id)}
              className={cn(
                'rounded-xl p-4 cursor-pointer transition-all duration-200 border',
                selectedAthlete === a.id
                  ? 'bg-[#E11D48]/10 border-[#E11D48]/30'
                  : 'bg-[#141420] border-[#1E1E2E] hover:border-[#E11D48]/20'
              )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-white text-sm shrink-0',
                  a.active ? 'bg-gradient-to-br from-[#E11D48] to-[#9F1239]' : 'bg-[#374151]'
                )}>{getInitials(a.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{a.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.belt && <BeltBadge belt={a.belt} />}
                    <span className="text-[11px] text-[#64748B]">{a.sessionCount} sessões</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn('w-2.5 h-2.5 rounded-full ml-auto', a.active ? 'bg-[#10B981]' : 'bg-[#475569]')} />
                  {a.streak > 0 && <p className="text-[11px] text-[#F59E0B] font-bold mt-1">{a.streak}d</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.topKickers.length > 0 && (
          <DashCard title="Ranking de Chutes" icon={<Award className="w-4 h-4" />}>
            <div className="divide-y divide-[#1E1E2E]">
              {data.topKickers.map((a, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                    i === 0 ? 'bg-[#F59E0B] text-black' : i === 1 ? 'bg-[#94A3B8] text-black' : i === 2 ? 'bg-[#B45309] text-white' : 'bg-[#1E1E2E] text-[#64748B]'
                  )}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{a.name}</p>
                    <p className="text-[11px] text-[#64748B]">Media: {a.avg}/sessao - Melhor: {a.best}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold font-mono text-[#F59E0B]">{a.kicks}</p>
                    <p className="text-[10px] text-[#64748B]">chutes</p>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        )}
      </div>)}

      {/* DESEMPENHO */}
      {tab === 'desempenho' && (<div role="tabpanel" id="tabpanel-desempenho" className="space-y-6">
        <DashCard title="Evolução do Tempo de Reação (ms)" icon={<TrendingDown className="w-4 h-4" />}>
          {data.reactionEvolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.reactionEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
                <XAxis dataKey="semana" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {data.reactionAthleteNames.map((name, i) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={ATHLETE_COLORS[i]} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10"><p className="text-[#64748B] text-sm">Dados insuficientes para visualizar evolução.</p><p className="text-xs text-[#475569] mt-1">Registre sessões no modo Reação para acompanhar a evolução dos atletas.</p><button onClick={() => navigate('/')} className="mt-2 text-xs font-bold text-[#E11D48] hover:text-[#F43F5E] transition-colors">Iniciar treino &rarr;</button></div>}
        </DashCard>

        <DashCard title="Perfil Comparativo de Atletas" icon={<Target className="w-4 h-4" />}>
          {data.radarAthleteNames.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={data.radarData}>
                <PolarGrid stroke="#1E1E2E" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} />
                {data.radarAthleteNames.map((name, i) => (
                  <Radar key={name} name={name} dataKey={name} stroke={ATHLETE_COLORS[i]} fill={ATHLETE_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10"><p className="text-[#64748B] text-sm">Dados insuficientes para gerar o radar.</p><p className="text-xs text-[#475569] mt-1">São necessárias pelo menos 3 sessões de diferentes atletas para gerar o comparativo.</p><button onClick={() => navigate('/')} className="mt-2 text-xs font-bold text-[#E11D48] hover:text-[#F43F5E] transition-colors">Iniciar treino &rarr;</button></div>}
        </DashCard>

        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            icon={<TrendingUp className="w-5 h-5 text-[#818CF8]" />}
            label="MELHOR EVOLUÇÃO"
            data={data.insightBestEvolution}
            borderColor="border-[#6366F1]/30"
            bgColor="bg-[#6366F1]/5"
            labelColor="text-[#A5B4FC]"
            detailColor="text-[#818CF8]"
          />
          <InsightCard
            icon={<Award className="w-5 h-5 text-[#4ADE80]" />}
            label="MAIS CONSISTENTE"
            data={data.insightMostConsistent}
            borderColor="border-[#10B981]/30"
            bgColor="bg-[#10B981]/5"
            labelColor="text-[#86EFAC]"
            detailColor="text-[#4ADE80]"
          />
          <InsightCard
            icon={<AlertTriangle className="w-5 h-5 text-[#FCA5A5]" />}
            label="PRECISA DE ATENÇÃO"
            data={data.insightNeedsAttention}
            fallback="Todos os atletas estão ativos!"
            borderColor="border-[#E11D48]/30"
            bgColor="bg-[#E11D48]/5"
            labelColor="text-[#FCA5A5]"
            detailColor="text-[#F87171]"
          />
        </div>
      </div>)}

      {/* CRESCIMENTO */}
      {tab === 'crescimento' && (<div role="tabpanel" id="tabpanel-crescimento" className="space-y-6">
        <DashCard title="Crescimento da Academia" icon={<TrendingUp className="w-4 h-4" />}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
              <XAxis dataKey="mes" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="ativos" name="Ativos" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2.5} />
              <Area type="monotone" dataKey="novos" name="Novos" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="churn" name="Cancelamentos" stroke="#E11D48" fill="#E11D48" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </DashCard>

        <div className="grid grid-cols-2 gap-3">
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Retenção" value={`${data.totalAthletes > 0 ? Math.round((data.totalAthletes / data.athletesList.length) * 100) : 0}%`} sub="Ativos / Total" color="#10B981" />
          <KpiCard icon={<Users className="w-5 h-5" />} label="Novos este Mes" value={`+${data.monthlyGrowth[data.monthlyGrowth.length - 1]?.novos || 0}`} sub="Cadastros recentes" color="#3B82F6" />
        </div>

      </div>)}
    </div>
  );
}

/* ── Sub-components ── */

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-[#141420] rounded-xl p-4 border border-[#1E1E2E] relative overflow-hidden group hover:border-[#2D2D3F] transition-colors">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10" style={{ background: color }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl md:text-3xl font-bold font-mono leading-none" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#64748B] mt-1">{sub}</p>
    </div>
  );
}

function DashCard({ title, icon, children, className }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#141420] rounded-xl p-4 md:p-5 border border-[#1E1E2E]', className)}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#94A3B8]">{icon}</span>
        <h3 className="font-display font-bold text-sm text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InsightCard({ icon, label, data, fallback, borderColor, bgColor, labelColor, detailColor }: {
  icon: React.ReactNode; label: string; data: { name: string; detail: string } | null;
  fallback?: string; borderColor: string; bgColor: string; labelColor: string; detailColor: string;
}) {
  return (
    <div className={cn('rounded-xl p-5 border', borderColor, bgColor)}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className={cn('text-[11px] font-bold uppercase tracking-wider', labelColor)}>{label}</span>
      </div>
      {data ? (
        <>
          <p className="text-xl font-bold text-white">{data.name}</p>
          <p className={cn('text-sm mt-1', detailColor)}>{data.detail}</p>
        </>
      ) : (
        <p className="text-sm text-[#64748B]">{fallback || 'Registre mais sessões de treino para gerar este insight.'}</p>
      )}
    </div>
  );
}

function BeltBadge({ belt }: { belt: string }) {
  const bg = BELT_COLORS[belt.toLowerCase()] || '#475569';
  const isLight = belt.toLowerCase() === 'branca' || belt.toLowerCase() === 'amarela';
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
      background: bg, color: isLight ? '#0A0A0F' : '#fff',
      border: belt.toLowerCase() === 'preta' ? '1px solid #444' : 'none',
    }}>{belt}</span>
  );
}
