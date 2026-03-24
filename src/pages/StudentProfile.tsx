import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Trophy, TrendingDown, TrendingUp, Flame, Brain, Zap, Target, Swords, Timer, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StudentAvatar } from '@/components/game/StudentAvatar';
import { cn } from '@/lib/utils';

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
  background: '#141420',
  border: '1px solid #1E1E2E',
  borderRadius: 12,
  color: '#F8FAFC',
  fontSize: 13,
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
  const [activeTab, setActiveTab] = useState<'reaction' | 'kicks'>('reaction');

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
    ]).then(([athleteRes, sessionsRes, soloRes]) => {
      const ath = (athleteRes.data as AthleteRow) || null;
      setAthlete(ath);
      setSessions((sessionsRes.data as SessionRow[]) || []);
      setSoloResults((soloRes.data as SoloRow[]) || []);

      // Fetch championship matches filtered at database level by athlete name
      const athleteName = ath?.name;
      if (athleteName) {
        supabase.from('championship_matches')
          .select('id, red_athlete_name, blue_athlete_name, winner_side, status, created_at')
          .eq('academy_id', user!.id)
          .in('status', ['FINISHED', 'finished'])
          .or(`red_athlete_name.eq.${athleteName},blue_athlete_name.eq.${athleteName}`)
          .then(({ data }) => {
            setMatches((data as MatchRow[]) || []);
            setLoading(false);
          });
      } else {
        setMatches([]);
        setLoading(false);
      }
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

  const bestKicks = useMemo(() => {
    if (filteredSolo.length === 0) return null;
    return Math.max(...filteredSolo.map(s => s.kicks));
  }, [filteredSolo]);
  const avgKicks = useMemo(() => {
    if (filteredSolo.length === 0) return null;
    return Math.round(filteredSolo.reduce((a, s) => a + s.kicks, 0) / filteredSolo.length);
  }, [filteredSolo]);

  const arcadeSessions = useMemo(() => filteredSessions.filter(s => s.mode === 'arcade'), [filteredSessions]);
  const arcadeWins = useMemo(() => arcadeSessions.filter(s => {
    const d = s.details as any;
    return d?.result === 'win' || d?.winner === 'red';
  }).length, [arcadeSessions]);

  const champWins = useMemo(() => {
    if (!athlete) return 0;
    const name = athlete.name.toLowerCase();
    return matches.filter(m => {
      if (m.winner_side === 'red' && m.red_athlete_name?.toLowerCase() === name) return true;
      if (m.winner_side === 'blue' && m.blue_athlete_name?.toLowerCase() === name) return true;
      return false;
    }).length;
  }, [matches, athlete]);

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

  const runningAverages = useMemo(() => {
    const rOnly = sessions.filter(s => s.mode === 'reaction' && s.avg_score != null);
    let sum = 0;
    return rOnly.map((s, i) => { sum += s.avg_score!; return { id: s.id, avg: sum / (i + 1) }; });
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E11D48]" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <p className="text-[#94A3B8]">Atleta não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/students')} className="border-[#2D2D3F] text-[#94A3B8]">Voltar</Button>
      </div>
    );
  }

  const ringColor = BELT_RING_COLORS[athlete.belt || ''] || 'ring-zinc-500';
  const isActive = athlete.is_active !== false;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Back header */}
      <div className="flex-shrink-0 flex items-center gap-3 p-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/students')}
          className="h-10 w-10 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display font-bold text-lg text-white truncate">{athlete.name}</h1>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:px-6 space-y-5 max-w-2xl mx-auto w-full">
        {/* Hero Profile Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#141420] border border-[#1E1E2E]">
          <div className={`rounded-full ring-3 ${ringColor} p-0.5`}>
            <StudentAvatar name={athlete.name} avatarUrl={athlete.avatar_url} belt={athlete.belt} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-white truncate">{athlete.name}</h2>
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isActive ? 'bg-green-500' : 'bg-zinc-500')} />
              <span className="text-xs text-[#94A3B8]">{isActive ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {athlete.belt && <Badge className={cn('text-[10px] px-2 py-0.5', BELT_BADGE_COLORS[athlete.belt] || '')}>{athlete.belt.charAt(0).toUpperCase() + athlete.belt.slice(1)}</Badge>}
              {athlete.category && <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-[#1E1E2E] text-[#94A3B8] border-0">{athlete.category}</Badge>}
              {athlete.weight_kg && <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[#2D2D3F] text-[#94A3B8]">{athlete.weight_kg}kg</Badge>}
              {athlete.birth_date && <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[#2D2D3F] text-[#94A3B8]">{calcAge(athlete.birth_date)} anos</Badge>}
            </div>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as TimeFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 h-9 text-sm font-bold rounded-xl transition-all duration-200',
                filter === f
                  ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white shadow-lg shadow-[#E11D48]/20'
                  : 'bg-[#1E1E2E] text-[#94A3B8] hover:text-white hover:bg-[#2D2D3F]'
              )}
            >
              {{ week: 'Semana', month: 'Mês', year: 'Ano', all: 'Tudo' }[f]}
            </button>
          ))}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <KPI icon={<Trophy className="w-4 h-4 text-[#F59E0B]" />} label="Recorde" value={absolutePB != null ? `${absolutePB}ms` : '--'} />
          <KPI icon={<TrendingDown className="w-4 h-4 text-[#10B981]" />} label="Média Reação" value={reactionAvg != null ? `${reactionAvg}ms` : '--'} />
          <KPI icon={<Brain className="w-4 h-4 text-[#8B5CF6]" />} label="Precisão Cogn." value={cognitiveAccuracy != null ? `${cognitiveAccuracy}%` : '--'} />
          <KPI icon={<Flame className="w-4 h-4 text-[#F59E0B]" />} label="Assiduidade" value={`${filteredSessions.length}`} sub="treinos" />
          <KPI icon={<Timer className="w-4 h-4 text-[#F59E0B]" />} label="Melhor Chutes" value={bestKicks != null ? String(bestKicks) : '--'} />
          <KPI icon={<Target className="w-4 h-4 text-[#3B82F6]" />} label="Média Chutes" value={avgKicks != null ? String(avgKicks) : '--'} />
          <KPI icon={<Gamepad2 className="w-4 h-4 text-[#E11D48]" />} label="Duelos" value={`${arcadeWins}/${arcadeSessions.length}`} sub="Vitórias/Total" />
          <KPI icon={<Swords className="w-4 h-4 text-[#E11D48]" />} label="Campeonato" value={`${champWins}/${matches.length}`} sub="Vitórias/Total" />
        </div>

        {/* Evolution Charts - Custom Tabs */}
        <div className="space-y-3">
          <div className="flex gap-2 bg-[#1E1E2E] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('reaction')}
              className={cn(
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                activeTab === 'reaction'
                  ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white'
                  : 'text-[#94A3B8] hover:text-white'
              )}
            >
              Reação
            </button>
            <button
              onClick={() => setActiveTab('kicks')}
              className={cn(
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                activeTab === 'kicks'
                  ? 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white'
                  : 'text-[#94A3B8] hover:text-white'
              )}
            >
              Chutes
            </button>
          </div>

          {activeTab === 'reaction' && (
            reactionChartData.length > 1 ? (
              <div className="w-full h-52 md:h-64 bg-[#141420] border border-[#1E1E2E] rounded-xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reactionChartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                    <defs>
                      <linearGradient id="evoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" width={50} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [`${v}ms`, 'Média']} />
                    {reactionAvg && <ReferenceLine y={reactionAvg} stroke="#64748B" strokeDasharray="4 4" />}
                    <ReferenceLine y={450} stroke="#F59E0B" strokeDasharray="6 3" />
                    <Area type="linear" dataKey="avg" stroke="#10B981" strokeWidth={2} fill="url(#evoGrad)" dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text={reactionSessions.length === 0 ? 'Nenhuma sessão de reação neste período' : 'Precisa de 2+ sessões para o gráfico'} />
            )
          )}

          {activeTab === 'kicks' && (
            soloChartData.length > 1 ? (
              <div className="w-full h-52 md:h-64 bg-[#141420] border border-[#1E1E2E] rounded-xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={soloChartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [v, 'Chutes']} />
                    <Bar dataKey="kicks" fill="#E11D48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text={filteredSolo.length === 0 ? 'Nenhuma sessão de chutes neste período' : 'Precisa de 2+ sessões para o gráfico'} />
            )
          )}
        </div>

        {/* Recent History */}
        <div>
          <h3 className="text-sm font-bold text-[#94A3B8] mb-3">
            Histórico Recente ({filteredSessions.length + filteredSolo.length})
          </h3>
          {filteredSessions.length === 0 && filteredSolo.length === 0 ? (
            <p className="text-sm text-[#64748B]">Nenhuma sessão encontrada.</p>
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
    <div className="p-3 rounded-xl bg-[#141420] border border-[#1E1E2E]">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">{label}</span>
      </div>
      <span className="font-mono text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-[#64748B] ml-1">{sub}</span>}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center gap-2 bg-[#141420] border border-[#1E1E2E] rounded-xl">
      <Calendar className="w-10 h-10 text-[#2D2D3F]" />
      <p className="text-sm text-[#64748B]">{text}</p>
    </div>
  );
}

type RunAvg = { id: string; avg: number };

function buildHistory(sessions: SessionRow[], soloResults: SoloRow[], matches: MatchRow[], athleteName: string, runningAverages: RunAvg[]) {
  interface HistoryItem { id: string; date: Date; type: string; label: string; detail: string; icon: React.ReactNode; trendArrow?: React.ReactNode }

  const items: HistoryItem[] = [];

  sessions.forEach(s => {
    const isCognitive = (s.details as any)?.cognitiveMode === true;
    let label = s.mode === 'reaction' ? (isCognitive ? 'Cognitivo' : 'Reação') : s.mode === 'arcade' ? 'Duelo' : s.mode === 'time_attack' ? 'Contra o Tempo' : s.mode;
    let detail = '';
    let icon: React.ReactNode;

    if (isCognitive) {
      icon = <Brain className="w-4 h-4 text-[#8B5CF6]" />;
      detail = s.avg_score != null ? `${Math.round(s.avg_score)}ms` : '';
    } else if (s.mode === 'reaction') {
      icon = <Zap className="w-4 h-4 text-[#F59E0B]" />;
      detail = s.avg_score != null ? `${Math.round(s.avg_score)}ms` : '';
    } else if (s.mode === 'arcade') {
      icon = <Gamepad2 className="w-4 h-4 text-[#E11D48]" />;
      const d = s.details as any;
      detail = d?.result === 'win' ? 'Vitória' : d?.result === 'loss' ? 'Derrota' : 'Duelo';
    } else if (s.mode === 'time_attack') {
      icon = <Timer className="w-4 h-4 text-[#F59E0B]" />;
      detail = '';
    } else {
      icon = <Target className="w-4 h-4 text-[#64748B]" />;
    }

    let trendArrow: React.ReactNode = null;
    if (s.mode === 'reaction' && s.avg_score != null) {
      const ra = runningAverages.find(r => r.id === s.id);
      const idx = runningAverages.findIndex(r => r.id === s.id);
      if (ra && idx > 0) {
        const prev = runningAverages[idx - 1].avg;
        if (s.avg_score < prev) trendArrow = <TrendingDown className="w-4 h-4 text-[#10B981]" />;
        else if (s.avg_score > prev) trendArrow = <TrendingUp className="w-4 h-4 text-[#E11D48]" />;
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
      detail: `${s.kicks} chutes | ${s.duration_seconds}s`,
      icon: <Timer className="w-4 h-4 text-[#F59E0B]" />,
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
      icon: <Swords className="w-4 h-4 text-[#E11D48]" />,
    });
  });

  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  return items.slice(0, 20).map(item => (
    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#141420] border border-[#1E1E2E]">
      <div className="flex items-center gap-2.5">
        {item.icon}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{item.label}</span>
          <span className="text-[11px] text-[#64748B]">
            {item.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {item.trendArrow}
        <span className="text-sm font-bold text-white">{item.detail}</span>
      </div>
    </div>
  ));
}
