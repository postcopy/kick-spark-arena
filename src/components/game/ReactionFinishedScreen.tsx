import { Trophy, TrendingDown, Zap, Target, UserRoundCog, Settings, RotateCcw, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
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
import type { ReactionResult } from '@/types/reaction';
import { LEVEL_LABELS } from '@/types/reaction';

interface ReactionFinishedScreenProps {
  result: ReactionResult;
  onPlayAgain: () => void;
  onAdjustSetup: () => void;
  onSwitchAthlete: () => void;
}

export function ReactionFinishedScreen({
  result,
  onPlayAgain,
  onAdjustSetup,
  onSwitchAthlete,
}: ReactionFinishedScreenProps) {
  const hasReactionData = result.reactionTimes.length > 0;
  const isCognitive = result.cognitiveMode;

  const avgTime = hasReactionData
    ? Math.round(result.reactionTimes.reduce((a, b) => a + b, 0) / result.reactionTimes.length)
    : null;
  const bestTime = hasReactionData ? Math.min(...result.reactionTimes) : null;

  // Standard deviation (stability)
  const stdDev = hasReactionData
    ? Math.round(
        Math.sqrt(
          result.reactionTimes.reduce((sq, t) => sq + Math.pow(t - avgTime!, 2), 0) /
            result.reactionTimes.length,
        ),
      )
    : null;

  // Chart data
  const chartData = result.reactionTimes.map((t, i) => ({ index: i + 1, time: t }));

  // Cognitive stats
  const inhibitionRate = result.totalNoGoStimuli > 0
    ? Math.round((result.correctInhibitions / result.totalNoGoStimuli) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gradient-to-b from-green-900/50 to-background">
      {/* Header */}
      <header className="flex-shrink-0 pt-5 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <Trophy className="w-7 h-7 text-game-yellow" />
          <h1 className="text-2xl md:text-3xl font-black text-foreground">TREINO COMPLETO!</h1>
          <Trophy className="w-7 h-7 text-game-yellow" />
        </div>
        <p className="text-muted-foreground text-sm">
          Nível: <span className="text-green-500 font-bold">{LEVEL_LABELS[result.level]}</span>
          {isCognitive && <span className="text-orange-400 ml-2 font-bold">• Cognitivo</span>}
        </p>
      </header>

      {/* Main scrollable area */}
      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center p-4 gap-4">
        {/* Performance Chart */}
        {hasReactionData && chartData.length > 1 && (
          <div className="w-full max-w-lg h-48 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <defs>
                  <linearGradient id="reactionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0, 80%, 55%)" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="hsl(60, 80%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="index"
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
                  formatter={(value: number) => [`${value}ms`, 'Tempo']}
                  labelFormatter={(label) => `Estímulo #${label}`}
                />
                <ReferenceLine
                  y={avgTime!}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{
                    value: `Média ${avgTime}ms`,
                    position: 'insideTopRight',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11,
                  }}
                />
                <Area
                  type="linear"
                  dataKey="time"
                  stroke="#39FF14"
                  strokeWidth={2}
                  fill="url(#reactionGradient)"
                  dot={{ r: 4, fill: '#39FF14' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
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

      {/* Footer – 3 action buttons */}
      <footer className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button onClick={onSwitchAthlete} variant="outline" size="lg" className="flex-1 py-5">
            <UserRoundCog className="w-4 h-4 mr-1.5" />
            Trocar
          </Button>
          <Button onClick={onAdjustSetup} variant="ghost" size="lg" className="flex-1 py-5">
            <Settings className="w-4 h-4 mr-1.5" />
            Ajustar
          </Button>
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="flex-[1.4] bg-green-500 hover:bg-green-600 text-white py-5 font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            REPETIR
          </Button>
        </div>
      </footer>
    </div>
  );
}

/* ---- Sub-components for stats grids ---- */

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
      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span className="text-xs text-muted-foreground">Inibições Corretas</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-foreground">
          {correctInhibitions}/{totalNoGoStimuli}
        </p>
        <p className="text-xs text-green-400 font-bold">{inhibitionRate}%</p>
      </div>

      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-muted-foreground">Faltas (Impulso)</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-red-400">{commissionErrors}</p>
      </div>

      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-muted-foreground">Omissões</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-foreground">{omissionErrors}</p>
      </div>

      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-green-500" />
          <span className="text-xs text-muted-foreground">Média GO</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-foreground">
          {avgTime !== null ? `${avgTime}ms` : '--'}
        </p>
      </div>
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
      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-game-yellow" />
          <span className="text-xs text-muted-foreground">Melhor (PB)</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-foreground">{bestTime}ms</p>
      </div>

      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-green-500" />
          <span className="text-xs text-muted-foreground">Média</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-foreground">{avgTime}ms</p>
      </div>

      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-game-yellow" />
          <span className="text-xs text-muted-foreground">Total Hits</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-foreground">
          {hits}
          <span className="text-base font-normal text-muted-foreground">
            /{totalStimuli}
          </span>
        </p>
      </div>

      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Target className="w-4 h-4 text-green-400" />
          <span className="text-xs text-muted-foreground">Estabilidade</span>
        </div>
        <p className="text-2xl md:text-3xl font-black text-foreground">±{stdDev}ms</p>
      </div>
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
      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <span className="text-xs text-muted-foreground">Rounds</span>
        <p className="text-3xl font-black text-foreground">{roundsCompleted}</p>
      </div>
      <div className="bg-muted/50 p-4 rounded-xl border border-border text-center">
        <span className="text-xs text-muted-foreground">Estímulos</span>
        <p className="text-3xl font-black text-foreground">{totalStimuli}</p>
      </div>
    </>
  );
}
