import { useEffect, useRef } from 'react';
import { Trophy, TrendingDown, Zap, Target, UserRoundCog, Settings, RotateCcw, ShieldCheck, AlertTriangle, Clock, Crosshair } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { ReactionResult } from '@/types/reaction';
import { LEVEL_LABELS } from '@/types/reaction';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useToast } from '@/hooks/use-toast';
import type { Athlete } from '@/types/game';
import { cn } from '@/lib/utils';

interface ReactionFinishedScreenProps {
  result: ReactionResult;
  selectedAthlete?: Athlete | null;
  isGuest?: boolean;
  onPlayAgain: () => void;
  onAdjustSetup: () => void;
  onSwitchAthlete: () => void;
}

export function ReactionFinishedScreen({
  result,
  selectedAthlete,
  isGuest,
  onPlayAgain,
  onAdjustSetup,
  onSwitchAthlete,
}: ReactionFinishedScreenProps) {
  const { saveSession } = useTrainingSessions();
  const { toast } = useToast();
  const savedRef = useRef(false);

  const hasReactionData = result.reactionTimes.length > 0;
  const isCognitive = result.cognitiveMode;

  const avgTime = hasReactionData
    ? Math.round(result.reactionTimes.reduce((a, b) => a + b, 0) / result.reactionTimes.length)
    : null;
  const bestTime = hasReactionData ? Math.min(...result.reactionTimes) : null;

  const stdDev = hasReactionData
    ? Math.round(
        Math.sqrt(
          result.reactionTimes.reduce((sq, t) => sq + Math.pow(t - avgTime!, 2), 0) /
            result.reactionTimes.length,
        ),
      )
    : null;

  // Auto-save session for selected athlete
  useEffect(() => {
    if (savedRef.current) return;
    if (!selectedAthlete || isGuest) return;

    savedRef.current = true;
    saveSession({
      athleteId: selectedAthlete.id,
      mode: 'reaction',
      avgScore: avgTime,
      bestScore: bestTime,
      details: {
        level: result.level,
        reactionTimes: result.reactionTimes,
        totalStimuli: result.totalStimuli,
        roundsCompleted: result.roundsCompleted,
        cognitiveMode: result.cognitiveMode,
        correctInhibitions: result.correctInhibitions,
        commissionErrors: result.commissionErrors,
        omissionErrors: result.omissionErrors,
      },
    }).then((saved) => {
      if (saved) {
        toast({ title: 'Sess\u00e3o salva!', description: `Resultado registrado para ${selectedAthlete.name}` });
      }
    });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Chart data
  const chartData = result.reactionTimes.map((t, i) => ({ index: i + 1, time: t }));

  // Cognitive stats
  const inhibitionRate = result.totalNoGoStimuli > 0
    ? Math.round((result.correctInhibitions / result.totalNoGoStimuli) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0A0A0F] relative">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="flex-shrink-0 pt-5 pb-3 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Crosshair className="w-5 h-5 text-green-400/60" />
          <span className="font-mono text-[10px] text-green-400/40 uppercase tracking-[0.3em]">Miss\u00e3o Completa</span>
          <Crosshair className="w-5 h-5 text-green-400/60" />
        </div>
        <h1 className="font-display font-black text-white text-3xl md:text-4xl tracking-tight">TREINO COMPLETO!</h1>
        <p className="font-mono text-xs text-white/30 mt-1">
          N\u00edvel: <span className="text-green-400 font-bold">{LEVEL_LABELS[result.level]}</span>
          {isCognitive && <span className="text-cyan-400 ml-2 font-bold">Cognitivo</span>}
        </p>
      </header>

      {/* Main scrollable area */}
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start p-4 gap-4 relative z-10">
        {/* Performance Chart */}
        {hasReactionData && chartData.length > 1 && (
          <div className="w-full max-w-3xl h-[28vh] min-h-[180px] bg-white/[0.02] rounded-xl border border-white/[0.06] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <defs>
                  <linearGradient id="reactionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="index"
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit="ms"
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: '#141420',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}ms`, 'Tempo']}
                  labelFormatter={(label) => `Est\u00edmulo #${label}`}
                />
                <ReferenceLine
                  y={avgTime!}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="4 4"
                  label={{
                    value: `M\u00e9dia ${avgTime}ms`,
                    position: 'insideTopRight',
                    fill: 'rgba(255,255,255,0.3)',
                    fontSize: 10,
                  }}
                />
                <Area
                  type="linear"
                  dataKey="time"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fill="url(#reactionGradient)"
                  dot={{ r: 3, fill: '#22C55E' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-3xl w-full">
          {isCognitive ? (
            <CognitiveStatsGrid
              correctInhibitions={result.correctInhibitions}
              totalNoGoStimuli={result.totalNoGoStimuli}
              inhibitionRate={inhibitionRate}
              commissionErrors={result.commissionErrors}
              omissionErrors={result.omissionErrors}
              avgTime={avgTime}
            />
          ) : hasReactionData ? (
            <StandardStatsGrid
              bestTime={bestTime}
              avgTime={avgTime}
              hits={result.reactionTimes.length}
              totalStimuli={result.totalStimuli}
              stdDev={stdDev}
            />
          ) : (
            <NoHardwareStatsGrid
              roundsCompleted={result.roundsCompleted}
              totalStimuli={result.totalStimuli}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 p-4 border-t border-white/[0.06] relative z-10">
        <div className="flex gap-2.5 max-w-3xl mx-auto">
          <button
            onClick={onSwitchAthlete}
            className="flex-1 h-12 rounded-xl font-mono text-sm uppercase tracking-wider border border-white/[0.06] hover:border-green-500/20 hover:bg-green-500/5 text-white/40 hover:text-white/60 bg-transparent transition-all flex items-center justify-center gap-2"
          >
            <UserRoundCog className="w-4 h-4" />
            Trocar
          </button>
          <button
            onClick={onAdjustSetup}
            className="flex-1 h-12 rounded-xl font-mono text-sm uppercase tracking-wider border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04] text-white/40 hover:text-white/60 bg-transparent transition-all flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Ajustar
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-[1.4] h-12 rounded-xl font-display font-bold uppercase tracking-wider bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            REPETIR
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---- Sub-components for stats grids ---- */

function StatCard({ icon: Icon, label, value, valueColor }: {
  icon: typeof Trophy;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white/[0.02] p-4 md:p-5 rounded-xl border border-white/[0.06] text-center">
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <Icon className={cn("w-4 h-4", valueColor || "text-white/30")} />
        <span className="text-[10px] font-mono text-white/25 uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-2xl md:text-3xl font-black font-mono tabular-nums", valueColor || "text-white/80")}>
        {value}
      </p>
    </div>
  );
}

function CognitiveStatsGrid({
  correctInhibitions,
  totalNoGoStimuli,
  inhibitionRate,
  commissionErrors,
  omissionErrors,
  avgTime,
}: {
  correctInhibitions: number;
  totalNoGoStimuli: number;
  inhibitionRate: number;
  commissionErrors: number;
  omissionErrors: number;
  avgTime: number | null;
}) {
  return (
    <>
      <StatCard icon={ShieldCheck} label="Inibi\u00e7\u00f5es" value={`${correctInhibitions}/${totalNoGoStimuli}`} valueColor="text-green-400" />
      <StatCard icon={AlertTriangle} label="Faltas" value={String(commissionErrors)} valueColor="text-red-400" />
      <StatCard icon={Clock} label="Omiss\u00f5es" value={String(omissionErrors)} valueColor="text-yellow-400" />
      <StatCard icon={TrendingDown} label="M\u00e9dia GO" value={avgTime !== null ? `${avgTime}ms` : '--'} valueColor="text-cyan-400" />
    </>
  );
}

function StandardStatsGrid({
  bestTime,
  avgTime,
  hits,
  totalStimuli,
  stdDev,
}: {
  bestTime: number | null;
  avgTime: number | null;
  hits: number;
  totalStimuli: number;
  stdDev: number | null;
}) {
  return (
    <>
      <StatCard icon={Trophy} label="Melhor (PB)" value={`${bestTime}ms`} valueColor="text-yellow-400" />
      <StatCard icon={TrendingDown} label="M\u00e9dia" value={`${avgTime}ms`} valueColor="text-green-400" />
      <StatCard icon={Zap} label="Total Hits" value={`${hits}/${totalStimuli}`} valueColor="text-cyan-400" />
      <StatCard icon={Target} label="Estabilidade" value={`\u00b1${stdDev}ms`} valueColor="text-green-400" />
    </>
  );
}

function NoHardwareStatsGrid({
  roundsCompleted,
  totalStimuli,
}: {
  roundsCompleted: number;
  totalStimuli: number;
}) {
  return (
    <>
      <StatCard icon={Target} label="Rounds" value={String(roundsCompleted)} />
      <StatCard icon={Zap} label="Est\u00edmulos" value={String(totalStimuli)} />
    </>
  );
}
