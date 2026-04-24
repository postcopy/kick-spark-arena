// Central Page — comando do organizador do torneio.
//
// spe-ui-design §3/§P6: retangular, tokens WT, cor HONG/CHUNG pros atletas,
// dourado (wt-manual) pro accent federativo de quadra. Sem pílulas arredondadas,
// sem gradientes decorativos.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layout,
  Users,
  Radio,
  Edit,
  Trophy,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import logoSpe from '@/assets/logo-spe-branca.png';
import { useTournament } from '@/hooks/useTournament';
import { useAuth } from '@/contexts/AuthContext';
import RegistrationsPanel from '@/components/registration/RegistrationsPanel';
import { getNextReadyMatch } from '@/hooks/useBracketGenerator';
import type { Category, BracketMatch } from '@/types/tournament';

type Tab = 'setup' | 'mats' | 'live' | 'inscricoes';

const MAT_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

export default function CentralPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tournamentHook = useTournament();
  const { tournament } = tournamentHook;
  const [activeTab, setActiveTab] = useState<Tab>(
    tournament?.status === 'IN_PROGRESS' ? 'live' : 'setup',
  );

  useEffect(() => {
    if (!tournament) {
      navigate('/championship/tournament');
    }
  }, [tournament, navigate]);

  if (!tournament) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'setup', label: 'Torneio', icon: <Layout className="h-4 w-4" /> },
    { id: 'mats', label: 'Quadras', icon: <Users className="h-4 w-4" /> },
    { id: 'live', label: 'Ao vivo', icon: <Radio className="h-4 w-4" /> },
    { id: 'inscricoes', label: 'Inscrições', icon: <ClipboardList className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-wt-bg flex flex-col font-display">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b border-wt-divider">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/professional')}
          className="text-wt-fg-muted hover:text-wt-fg-primary rounded-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <img src={logoSpe} alt="SPE" className="h-8" />
        <div className="flex-1 min-w-0">
          <h1 className="text-wt-fg-primary font-bold truncate">{tournament.name}</h1>
          <p className="text-wt-fg-muted text-xs font-mono uppercase tracking-wider">
            {tournament.date}
          </p>
        </div>
        <TournamentStatusBadge status={tournament.status} />
      </header>

      {/* Tabs */}
      <nav className="flex gap-[2px] px-6 pt-3 border-b border-wt-divider">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2',
              activeTab === tab.id
                ? 'bg-wt-bg-secondary text-wt-fg-primary border-wt-manual'
                : 'text-wt-fg-muted hover:text-wt-fg-secondary border-transparent',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'setup' && (
          <SetupTab
            tournament={tournament}
            onGoToSetup={() => navigate('/championship/tournament')}
          />
        )}
        {activeTab === 'mats' && (
          <MatAssignmentTab
            tournament={tournament}
            assignCategory={tournamentHook.assignCategoryToMat}
            unassignCategory={tournamentHook.unassignCategoryFromMat}
          />
        )}
        {activeTab === 'live' && (
          <LiveOverviewTab
            tournament={tournament}
            recordResult={tournamentHook.recordMatchResult}
          />
        )}
        {activeTab === 'inscricoes' &&
          (user ? (
            <RegistrationsPanel userId={user.id} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-wt-fg-muted">
              <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-bold text-wt-fg-secondary">
                Faça login para gerenciar inscrições
              </p>
              <p className="text-sm text-wt-fg-muted mt-1">
                Você precisa estar logado para criar torneios e gerenciar inscrições
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="mt-4 bg-wt-fg-primary text-wt-bg hover:bg-wt-fg-primary/90 rounded-none uppercase tracking-wider text-xs font-bold"
              >
                Entrar
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Tournament status badge ───

function TournamentStatusBadge({ status }: { status: 'SETUP' | 'IN_PROGRESS' | 'FINISHED' }) {
  const map = {
    SETUP: {
      label: 'Configuração',
      cls: 'border-wt-warning/50 text-wt-warning bg-wt-warning/10',
    },
    IN_PROGRESS: {
      label: 'Em andamento',
      cls: 'border-wt-success/50 text-wt-success bg-wt-success/10',
    },
    FINISHED: {
      label: 'Encerrado',
      cls: 'border-wt-divider text-wt-fg-muted bg-wt-bg-tertiary',
    },
  }[status];

  return (
    <span
      className={cn(
        'px-3 py-1 border text-[10px] font-bold uppercase tracking-[0.25em]',
        map.cls,
      )}
    >
      {map.label}
    </span>
  );
}

// ─── Setup Tab ───

function SetupTab({
  tournament,
  onGoToSetup,
}: {
  tournament: NonNullable<ReturnType<typeof useTournament>['tournament']>;
  onGoToSetup: () => void;
}) {
  const totalAthletes = tournament.categories.reduce((s, c) => s + c.athletes.length, 0);
  const totalFights = tournament.categories.reduce(
    (s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-wt-fg-secondary">
          Resumo do torneio
        </h2>
        <Button
          onClick={onGoToSetup}
          variant="outline"
          className="border-wt-divider bg-wt-bg-secondary text-wt-fg-primary hover:bg-wt-bg-tertiary rounded-none uppercase tracking-wider text-xs font-bold"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar torneio
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-[2px]">
        <StatCard label="Categorias" value={tournament.categories.length} />
        <StatCard label="Atletas" value={totalAthletes} />
        <StatCard label="Lutas" value={totalFights} />
      </div>

      <div className="space-y-[2px]">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted mb-2">
          Categorias
        </h3>
        {tournament.categories.map(cat => (
          <div
            key={cat.id}
            className="flex items-center justify-between bg-wt-bg-secondary border border-wt-divider px-4 py-3"
          >
            <div>
              <span className="text-wt-fg-primary font-bold">{cat.name}</span>
              <span className="text-wt-fg-muted text-sm ml-3">
                {cat.athletes.length} atletas
              </span>
            </div>
            <CategoryStatusBadge status={cat.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-wt-bg-secondary border border-wt-divider p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-wt-fg-muted">
        {label}
      </p>
      <p className="text-3xl font-black text-wt-fg-primary tabular-nums mt-1">{value}</p>
    </div>
  );
}

function CategoryStatusBadge({ status }: { status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED' }) {
  const map = {
    PENDING: { label: 'Pendente', cls: 'border-wt-divider text-wt-fg-muted' },
    IN_PROGRESS: { label: 'Em andamento', cls: 'border-wt-success/50 text-wt-success' },
    FINISHED: { label: 'Finalizada', cls: 'border-wt-manual/50 text-wt-manual' },
  }[status];
  return (
    <span
      className={cn(
        'text-[10px] font-bold px-2 py-1 border uppercase tracking-wider',
        map.cls,
      )}
    >
      {map.label}
    </span>
  );
}

// ─── Mat Assignment Tab ───

function MatAssignmentTab({
  tournament,
  assignCategory,
  unassignCategory,
}: {
  tournament: NonNullable<ReturnType<typeof useTournament>['tournament']>;
  assignCategory: (matNumber: number, categoryId: string) => void;
  unassignCategory: (matNumber: number, categoryId: string) => void;
}) {
  function getMatForCategory(categoryId: string): number | null {
    for (const [mat, ids] of Object.entries(tournament.matAssignments)) {
      if (ids.includes(categoryId)) return parseInt(mat);
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-wt-fg-secondary mb-1">
          Distribuição de quadras
        </h2>
        <p className="text-wt-fg-muted text-sm">
          Defina em qual quadra cada categoria será disputada.
        </p>
      </div>

      <div className="space-y-[2px]">
        {tournament.categories.map(cat => {
          const currentMat = getMatForCategory(cat.id);
          return (
            <div
              key={cat.id}
              className="flex items-center gap-4 bg-wt-bg-secondary border border-wt-divider px-4 py-3"
            >
              <div className="flex-1">
                <span className="text-wt-fg-primary font-bold">{cat.name}</span>
                <span className="text-wt-fg-muted text-sm ml-3">
                  {cat.athletes.length} atletas ·{' '}
                  {cat.bracket.filter(m => m.status !== 'BYE').length} lutas
                </span>
              </div>
              <Select
                value={currentMat?.toString() || ''}
                onValueChange={val => {
                  if (currentMat) unassignCategory(currentMat, cat.id);
                  if (val) assignCategory(parseInt(val), cat.id);
                }}
              >
                <SelectTrigger className="w-32 bg-wt-bg border-wt-divider text-wt-fg-primary rounded-none">
                  <SelectValue placeholder="Quadra…" />
                </SelectTrigger>
                <SelectContent className="bg-wt-bg-secondary border-wt-divider rounded-none">
                  {MAT_NUMBERS.map(n => (
                    <SelectItem
                      key={n}
                      value={n.toString()}
                      className="text-wt-fg-primary"
                    >
                      Quadra {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted mb-3">
          Resumo por quadra
        </h3>
        <div className="grid grid-cols-2 gap-[2px]">
          {MAT_NUMBERS.filter(n => (tournament.matAssignments[n] || []).length > 0).map(n => {
            const catIds = tournament.matAssignments[n] || [];
            const cats = tournament.categories.filter(c => catIds.includes(c.id));
            const totalFights = cats.reduce(
              (s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length,
              0,
            );
            return (
              <div key={n} className="bg-wt-bg-secondary border border-wt-divider p-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted">
                    Quadra
                  </span>
                  <h4 className="text-wt-fg-primary font-black text-2xl tabular-nums leading-none">
                    {String(n).padStart(2, '0')}
                  </h4>
                </div>
                <p className="text-wt-fg-muted text-sm mt-2">
                  {cats.length} categorias · {totalFights} lutas
                </p>
                <ul className="mt-2 space-y-1">
                  {cats.map(c => (
                    <li key={c.id} className="text-wt-fg-secondary text-xs">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Live Overview Tab ───

function LiveOverviewTab({
  tournament,
  recordResult,
}: {
  tournament: NonNullable<ReturnType<typeof useTournament>['tournament']>;
  recordResult: (categoryId: string, matchId: string, winnerSide: 'RED' | 'BLUE') => void;
}) {
  const [expandedMat, setExpandedMat] = useState<number | null>(null);

  const activeMats = MAT_NUMBERS.filter(
    n => (tournament.matAssignments[n] || []).length > 0,
  );

  if (activeMats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-wt-fg-muted">
        <Users className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg uppercase tracking-wider">Nenhuma quadra configurada</p>
        <p className="text-sm">Vá na aba "Quadras" para distribuir as categorias</p>
      </div>
    );
  }

  return (
    <div className="space-y-[2px]">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-wt-fg-secondary mb-3">
        Visão geral
      </h2>

      {activeMats.map(matNumber => {
        const catIds = tournament.matAssignments[matNumber] || [];
        const cats = tournament.categories.filter(c => catIds.includes(c.id));
        const totalFights = cats.reduce(
          (s, c) => s + c.bracket.filter(m => m.status !== 'BYE').length,
          0,
        );
        const finishedFights = cats.reduce(
          (s, c) => s + c.bracket.filter(m => m.status === 'FINISHED').length,
          0,
        );
        const progress = totalFights > 0 ? (finishedFights / totalFights) * 100 : 0;

        let nextMatch: BracketMatch | undefined;
        let nextCat: Category | undefined;
        for (const cat of cats) {
          const m = getNextReadyMatch(cat.bracket);
          if (m) {
            nextMatch = m;
            nextCat = cat;
            break;
          }
        }

        const isExpanded = expandedMat === matNumber;

        return (
          <div
            key={matNumber}
            className="bg-wt-bg-secondary border border-wt-divider overflow-hidden"
          >
            <button
              onClick={() => setExpandedMat(isExpanded ? null : matNumber)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-wt-bg-tertiary/40 transition-colors"
            >
              <div className="flex items-center gap-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-wt-fg-muted">
                    Mat
                  </span>
                  <span className="text-2xl font-black text-wt-fg-primary tabular-nums leading-none">
                    {String(matNumber).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-wt-fg-secondary text-sm tabular-nums font-mono">
                  {finishedFights}/{totalFights}
                </span>
                <div className="w-32 h-1 bg-wt-bg-tertiary overflow-hidden">
                  <div
                    className="h-full bg-wt-success transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                {nextMatch && nextCat && (
                  <span className="text-xs text-wt-fg-muted">
                    Próxima:{' '}
                    <span className="text-hong-accent font-bold">
                      {nextMatch.athleteRed?.name}
                    </span>
                    <span className="text-wt-fg-muted mx-1.5">vs</span>
                    <span className="text-chung-accent font-bold">
                      {nextMatch.athleteBlue?.name}
                    </span>
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-wt-fg-muted" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-wt-fg-muted" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-wt-divider p-6 space-y-5 bg-wt-bg/40">
                {cats.map(cat => (
                  <div key={cat.id}>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-wt-fg-muted mb-2">
                      {cat.name}
                    </h4>
                    <div className="space-y-[2px]">
                      {cat.bracket
                        .filter(m => m.status !== 'BYE')
                        .sort((a, b) => a.matchNumber - b.matchNumber)
                        .map(match => (
                          <div
                            key={match.id}
                            className="flex items-center gap-3 bg-wt-bg-secondary border border-wt-divider px-3 py-2 text-sm"
                          >
                            <span className="text-wt-fg-muted w-16 font-mono tabular-nums">
                              {String(match.matchNumber).padStart(3, '0')}
                            </span>
                            <span
                              className={cn(
                                'font-bold',
                                match.winnerSide === 'RED'
                                  ? 'text-hong-accent'
                                  : 'text-wt-fg-secondary',
                              )}
                            >
                              {match.athleteRed?.name || '—'}
                            </span>
                            <span className="text-wt-fg-muted text-xs">vs</span>
                            <span
                              className={cn(
                                'font-bold',
                                match.winnerSide === 'BLUE'
                                  ? 'text-chung-accent'
                                  : 'text-wt-fg-secondary',
                              )}
                            >
                              {match.athleteBlue?.name || '—'}
                            </span>
                            <span className="flex-1" />
                            {match.status === 'FINISHED' && (
                              <span className="text-wt-manual text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {match.winnerSide === 'RED'
                                  ? match.athleteRed?.name
                                  : match.athleteBlue?.name}
                              </span>
                            )}
                            {match.status === 'READY' && (
                              <div className="flex gap-[2px]">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recordResult(cat.id, match.id, 'RED')}
                                  className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-none border-hong/40 bg-hong-bg text-hong-accent hover:bg-hong/20"
                                >
                                  Verm. vence
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recordResult(cat.id, match.id, 'BLUE')}
                                  className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-none border-chung/40 bg-chung-bg text-chung-accent hover:bg-chung/20"
                                >
                                  Azul vence
                                </Button>
                              </div>
                            )}
                            {match.status === 'PENDING' && (
                              <span className="text-wt-fg-muted text-xs uppercase tracking-wider">
                                Aguardando
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
